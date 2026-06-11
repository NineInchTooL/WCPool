// IMPORTANT: Set FOOTBALL_DATA_API_KEY in Supabase Dashboard →
// Settings → Edge Functions → Secrets before deploying.
//
// Modes (query param ?mode=):
//   scores  (default) — finished GROUP_STAGE matches, used by elimination tracker
//   today              — all WC matches scheduled for today (UTC), used by viewer strip

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS });
  }

  const mode = new URL(req.url).searchParams.get('mode') ?? 'scores';

  // ── Today's fixtures mode ──────────────────────────────────────────
  if (mode === 'today') {
    const today = new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD' in UTC
    type TodayMatch = { home: string; away: string; utcDate: string; status: string; group: string };
    let todayMatches: TodayMatch[] | null = null;

    // Primary: football-data.org
    try {
      const apiKey = Deno.env.get('FOOTBALL_DATA_API_KEY') ?? '';
      const res = await fetch(
        `https://api.football-data.org/v4/competitions/WC/matches?dateFrom=${today}&dateTo=${today}`,
        { headers: { 'X-Auth-Token': apiKey } },
      );
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.matches)) {
          todayMatches = data.matches.map((m: any) => ({
            home:    m.homeTeam.name as string,
            away:    m.awayTeam.name as string,
            utcDate: m.utcDate as string,
            status:  m.status  as string,
            group:   (m.group ?? '') as string,
          }));
        }
      }
    } catch (_) { /* fall through to fallback */ }

    // Fallback: worldcup26.ir — best-effort date filter
    if (!todayMatches) {
      try {
        const res = await fetch('https://worldcup26.ir/get/games');
        if (res.ok) {
          const data = await res.json();
          todayMatches = (data.games as any[] ?? [])
            .filter((g: any) => String(g.date ?? g.datetime ?? g.kickoff ?? '').startsWith(today))
            .map((g: any) => ({
              home:    g.home_team_name_en as string,
              away:    g.away_team_name_en as string,
              utcDate: String(g.datetime ?? g.date ?? ''),
              status:  g.finished === 'TRUE' ? 'FINISHED' : 'SCHEDULED',
              group:   (g.group ?? '') as string,
            }));
        }
      } catch (_) { /* fall through */ }
    }

    return new Response(JSON.stringify(todayMatches ?? []), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  // ── Scores mode (default) — finished GROUP_STAGE matches ──────────
  let matches: Array<{ home: string; away: string; homeScore: number; awayScore: number; group: string }> | null = null;

  // Primary: football-data.org
  try {
    const apiKey = Deno.env.get('FOOTBALL_DATA_API_KEY') ?? '';
    const res = await fetch(
      'https://api.football-data.org/v4/competitions/WC/matches?status=FINISHED&stage=GROUP_STAGE',
      { headers: { 'X-Auth-Token': apiKey } },
    );
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.matches) && data.matches.length > 0) {
        matches = data.matches.map((m: any) => ({
          home: m.homeTeam.name as string,
          away: m.awayTeam.name as string,
          homeScore: m.score.fullTime.home as number,
          awayScore: m.score.fullTime.away as number,
          group: (m.group ?? '') as string,
        }));
      }
    }
  } catch (_) { /* fall through to fallback */ }

  // Fallback: worldcup26.ir
  if (!matches || matches.length === 0) {
    try {
      const res = await fetch('https://worldcup26.ir/get/games');
      if (res.ok) {
        const data = await res.json();
        matches = (data.games as any[] ?? [])
          .filter((g: any) => g.finished === 'TRUE' && g.type === 'group')
          .map((g: any) => ({
            home: g.home_team_name_en as string,
            away: g.away_team_name_en as string,
            homeScore: Number(g.home_score),
            awayScore: Number(g.away_score),
            group: (g.group ?? '') as string,
          }));
      }
    } catch (_) { /* fall through */ }
  }

  return new Response(JSON.stringify(matches ?? []), {
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
});
