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
    // "today" in UTC. Evening local games (e.g. 20:00 ET = 00:00 UTC next day)
    // would be missed by a UTC-only query, so we always run both sources and merge.
    const today = new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD' in UTC
    type TodayMatch = { home: string; away: string; utcDate: string; status: string; group: string };

    // Primary: football-data.org — proper UTC timestamps, accurate for UTC-day games
    let fdoMatches: TodayMatch[] = [];
    try {
      const apiKey = Deno.env.get('FOOTBALL_DATA_API_KEY') ?? '';
      const res = await fetch(
        `https://api.football-data.org/v4/competitions/WC/matches?dateFrom=${today}&dateTo=${today}`,
        { headers: { 'X-Auth-Token': apiKey } },
      );
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.matches)) {
          fdoMatches = data.matches.map((m: any) => ({
            home:    m.homeTeam.name as string,
            away:    m.awayTeam.name as string,
            utcDate: m.utcDate as string,
            status:  m.status  as string,
            group:   (m.group ?? '') as string,
          }));
        }
      }
    } catch (_) { /* fall through */ }

    // Supplementary: worldcup26.ir — local-date filter catches evening games
    // that spill past UTC midnight and are missed by football-data.org above
    let irMatches: TodayMatch[] = [];
    try {
      const res = await fetch('https://worldcup26.ir/get/games', {
        headers: { 'Accept': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        // local_date format: "MM/DD/YYYY HH:MM" (local stadium time, not UTC)
        irMatches = (data.games as any[] ?? [])
          .filter((g: any) => {
            const ld = String(g.local_date ?? '');
            if (!ld) return false;
            const [datePart] = ld.split(' ');
            const [mm, dd, yyyy] = datePart.split('/');
            if (!yyyy) return false;
            return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}` === today;
          })
          .map((g: any) => {
            // Convert "MM/DD/YYYY HH:MM" → "YYYY-MM-DDTHH:MM:00" for cross-browser Date()
            const ld = String(g.local_date ?? '');
            const [datePart = '', timePart = '00:00'] = ld.split(' ');
            const [mm = '01', dd = '01', yyyy = '2026'] = datePart.split('/');
            const isoDate = `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}T${timePart}:00`;
            const elapsed = String(g.time_elapsed ?? '').toLowerCase();
            const status = (elapsed === 'ft' || g.finished === 'TRUE') ? 'FINISHED'
                         : ['1st', 'ht', '2nd', 'et', 'pen'].includes(elapsed) ? 'IN_PLAY'
                         : 'TIMED';
            return {
              home:    g.home_team_name_en as string,
              away:    g.away_team_name_en as string,
              utcDate: isoDate,
              status,
              group:   (g.group ?? '') as string,
            };
          });
      }
    } catch (_) { /* fall through */ }

    // Normalize team names before dedup — the two APIs spell some teams
    // differently (e.g. "Bosnia-Herzegovina" vs "Bosnia and Herzegovina",
    // "Czechia" vs "Czech Republic").
    const ALIASES: Record<string, string> = {
      'bosnia-herzegovina':        'bosnia and herzegovina',
      'czechia':                   'czech republic',
      'republic of korea':         'south korea',
      'korea republic':            'south korea',
      'usa':                       'united states',
      'ir iran':                   'iran',
      'türkiye':                   'turkey',
    };
    const norm = (s: string) => { const l = s.toLowerCase().trim(); return ALIASES[l] ?? l; };
    const dedupeKey = (m: TodayMatch) => `${norm(m.home)}|${norm(m.away)}`;

    // Merge: football-data.org entries take precedence (have proper UTC times).
    // Supplement with worldcup26.ir entries not already present.
    const fdoKeys = new Set(fdoMatches.map(dedupeKey));
    const merged = [
      ...fdoMatches,
      ...irMatches.filter((m) => !fdoKeys.has(dedupeKey(m))),
    ];

    return new Response(JSON.stringify(merged), {
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

  // Fallback: worldcup26.ir — requires Accept: text/json to get real data (not schema)
  if (!matches || matches.length === 0) {
    try {
      const res = await fetch('https://worldcup26.ir/get/games', {
        headers: { 'Accept': 'application/json' },
      });
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
