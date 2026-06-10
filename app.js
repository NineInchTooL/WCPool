/*
  SECURITY NOTE:
  - SUPABASE_ANON_KEY is a public/publishable key — safe in client-side code.
  - Authentication is via Supabase Auth (Google OAuth). No passwords stored.
  - Pool ownership enforced by checking pool.owner_id === auth.uid().
  - RLS allows public read (viewer mode) and owner-only write.
  - Do NOT use this pattern for sensitive or private data.
*/

// ── Teams & constants ──────────────────────────────────────────────
const TIERS = [1, 2, 3, 4];

const TEAMS = [
  // Tier 1
  { flag: '🇦🇷', name: 'Argentina',                   tier: 1 },
  { flag: '🇫🇷', name: 'Francia',                      tier: 1 },
  { flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', name: 'Inglaterra',                  tier: 1 },
  { flag: '🇧🇷', name: 'Brasil',                       tier: 1 },
  { flag: '🇪🇸', name: 'España',                       tier: 1 },
  { flag: '🇩🇪', name: 'Alemania',                     tier: 1 },
  { flag: '🇵🇹', name: 'Portugal',                     tier: 1 },
  { flag: '🇳🇱', name: 'Países Bajos',                 tier: 1 },
  { flag: '🇧🇪', name: 'Bélgica',                      tier: 1 },
  { flag: '🇺🇾', name: 'Uruguay',                      tier: 1 },
  { flag: '🇨🇴', name: 'Colombia',                     tier: 1 },
  { flag: '🇺🇸', name: 'Estados Unidos',               tier: 1 },
  // Tier 2
  { flag: '🇲🇽', name: 'México',                       tier: 2 },
  { flag: '🇭🇷', name: 'Croacia',                      tier: 2 },
  { flag: '🇨🇭', name: 'Suiza',                        tier: 2 },
  { flag: '🇸🇳', name: 'Senegal',                      tier: 2 },
  { flag: '🇯🇵', name: 'Japón',                        tier: 2 },
  { flag: '🇲🇦', name: 'Marruecos',                    tier: 2 },
  { flag: '🇰🇷', name: 'Corea del Sur',                tier: 2 },
  { flag: '🇪🇨', name: 'Ecuador',                      tier: 2 },
  { flag: '🇦🇹', name: 'Austria',                      tier: 2 },
  { flag: '🇹🇷', name: 'Turquía',                      tier: 2 },
  { flag: '🇨🇦', name: 'Canadá',                       tier: 2 },
  { flag: '🇸🇪', name: 'Suecia',                       tier: 2 },
  // Tier 3
  { flag: '🇦🇺', name: 'Australia',                    tier: 3 },
  { flag: '🇳🇴', name: 'Noruega',                      tier: 3 },
  { flag: '🇵🇾', name: 'Paraguay',                     tier: 3 },
  { flag: '🇹🇳', name: 'Túnez',                        tier: 3 },
  { flag: '🇧🇦', name: 'Bosnia y Herzegovina',         tier: 3 },
  { flag: '🇬🇭', name: 'Ghana',                        tier: 3 },
  { flag: '🇨🇿', name: 'República Checa',              tier: 3 },
  { flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', name: 'Escocia',                    tier: 3 },
  { flag: '🇨🇮', name: 'Costa de Marfil',              tier: 3 },
  { flag: '🇩🇿', name: 'Argelia',                      tier: 3 },
  { flag: '🇮🇷', name: 'Irán',                         tier: 3 },
  { flag: '🇪🇬', name: 'Egipto',                       tier: 3 },
  // Tier 4
  { flag: '🇸🇦', name: 'Arabia Saudita',               tier: 4 },
  { flag: '🇿🇦', name: 'Sudáfrica',                    tier: 4 },
  { flag: '🇮🇶', name: 'Irak',                         tier: 4 },
  { flag: '🇯🇴', name: 'Jordania',                     tier: 4 },
  { flag: '🇶🇦', name: 'Catar',                        tier: 4 },
  { flag: '🇺🇿', name: 'Uzbekistán',                   tier: 4 },
  { flag: '🇨🇼', name: 'Curazao',                      tier: 4 },
  { flag: '🇭🇹', name: 'Haití',                        tier: 4 },
  { flag: '🇵🇦', name: 'Panamá',                       tier: 4 },
  { flag: '🇳🇿', name: 'Nueva Zelanda',                tier: 4 },
  { flag: '🇨🇩', name: 'Rep. Democrática del Congo',   tier: 4 },
  { flag: '🇨🇻', name: 'Cabo Verde',                   tier: 4 },
];

const TEAM_SETS = {
  WC2026: { label: 'FIFA World Cup 2026', teams: TEAMS },
};

// Maps English API names (football-data.org / worldcup26.ir) → local Spanish names
const EN_TO_LOCAL = {
  'Argentina': 'Argentina', 'France': 'Francia', 'England': 'Inglaterra',
  'Brazil': 'Brasil', 'Spain': 'España', 'Germany': 'Alemania',
  'Portugal': 'Portugal', 'Netherlands': 'Países Bajos', 'Netherlands NT': 'Países Bajos',
  'Belgium': 'Bélgica', 'Uruguay': 'Uruguay', 'Colombia': 'Colombia',
  'United States': 'Estados Unidos', 'USA': 'Estados Unidos',
  'Mexico': 'México', 'Croatia': 'Croacia', 'Switzerland': 'Suiza',
  'Senegal': 'Senegal', 'Japan': 'Japón', 'Morocco': 'Marruecos',
  'South Korea': 'Corea del Sur', 'Korea Republic': 'Corea del Sur', 'Republic of Korea': 'Corea del Sur',
  'Ecuador': 'Ecuador', 'Austria': 'Austria', 'Turkey': 'Turquía', 'Türkiye': 'Turquía',
  'Canada': 'Canadá', 'Sweden': 'Suecia', 'Australia': 'Australia', 'Norway': 'Noruega',
  'Paraguay': 'Paraguay', 'Tunisia': 'Túnez',
  'Bosnia and Herzegovina': 'Bosnia y Herzegovina', 'Bosnia & Herzegovina': 'Bosnia y Herzegovina',
  'Ghana': 'Ghana', 'Czech Republic': 'República Checa', 'Czechia': 'República Checa',
  'Scotland': 'Escocia', "Ivory Coast": 'Costa de Marfil',
  "Côte d'Ivoire": 'Costa de Marfil', "Cote d'Ivoire": 'Costa de Marfil',
  'Algeria': 'Argelia', 'Iran': 'Irán', 'Islamic Republic of Iran': 'Irán', 'Egypt': 'Egipto',
  'Saudi Arabia': 'Arabia Saudita', 'South Africa': 'Sudáfrica', 'Iraq': 'Irak',
  'Jordan': 'Jordania', 'Qatar': 'Catar', 'Uzbekistan': 'Uzbekistán',
  'Curaçao': 'Curazao', 'Curacao': 'Curazao', 'Haiti': 'Haití', 'Panama': 'Panamá',
  'New Zealand': 'Nueva Zelanda', 'DR Congo': 'Rep. Democrática del Congo',
  'Congo DR': 'Rep. Democrática del Congo',
  'Democratic Republic of the Congo': 'Rep. Democrática del Congo',
  'Cape Verde': 'Cabo Verde',
};

// ── Supabase (use `db` — window.supabase is non-configurable) ──────
const db = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);

// ── State ──────────────────────────────────────────────────────────
let currentSession = null;
let realtimeChannel = null;
let currentSuggestions = [];
let elimSyncIntervalId = null;

// ── Theme ──────────────────────────────────────────────────────────
(function initTheme() {
  const saved = localStorage.getItem('wcpool_theme') || 'dark';
  document.documentElement.dataset.theme = saved;
})();

function toggleTheme() {
  const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
  document.documentElement.dataset.theme = next;
  localStorage.setItem('wcpool_theme', next);
  document.querySelectorAll('.theme-toggle').forEach(b => {
    b.textContent = next === 'dark' ? '☀️' : '🌙';
  });
}

function themeIcon() {
  return document.documentElement.dataset.theme === 'dark' ? '☀️' : '🌙';
}

// ── Utilities ──────────────────────────────────────────────────────
function escHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function nanoid(len = 6) {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  return Array.from(crypto.getRandomValues(new Uint8Array(len)))
    .map(b => chars[b % chars.length]).join('');
}

function uid() { return Math.random().toString(36).slice(2, 9); }

function navigate(hash) { window.location.hash = hash; }

async function copyToClipboard(text, btn) {
  try {
    await navigator.clipboard.writeText(text);
    const orig = btn.textContent;
    btn.textContent = '✅ Copied!';
    setTimeout(() => { btn.textContent = orig; }, 2000);
  } catch { /* silent */ }
}

function teamId(team) { return `${team.flag} ${team.name}`; }

// ── Allocation algorithm ───────────────────────────────────────────
// Guarantees for N ≤ 12:
//   - every player gets exactly floor(48/N) teams
//   - (48 % N) players get one extra  →  max = ceil(48/N)
//   - tier-balanced base: floor(12/N) teams per tier per player from tier pools
//   - remaining teams shuffled into cross-tier extra rounds (no player gets +2)
// For N > 12 each tier pool (12 teams) can't cover all players;
// that case is not handled yet — pools should stay at ≤ 12 players.
function allocate(participants) {
  if (!participants.length) return null;
  // Algorithm is only correct for N ≤ 12; clamp defensively (UI should prevent N > 12)
  if (participants.length > 12) participants = participants.slice(0, 12);
  const N = participants.length;
  const tierBase       = Math.floor(12 / N);       // per-tier base rounds
  const globalBase     = Math.floor(48 / N);        // total guaranteed per player
  const extras         = 48 % N;                    // players who get one extra
  const extraBaseRounds = globalBase - 4 * tierBase; // full cross-tier rounds after tier base

  const result = {};
  for (const p of participants) result[p.id] = [];

  // Pre-shuffle each tier pool once
  const tierPools = {};
  for (let tier = 1; tier <= 4; tier++) {
    tierPools[tier] = shuffle(TEAMS.filter(t => t.tier === tier));
  }

  // Tier base rounds: give each player tierBase teams from every tier
  const baseOrder = shuffle(participants.map(p => p.id));
  for (let tier = 1; tier <= 4; tier++) {
    const pool = tierPools[tier];
    let idx = 0;
    for (let round = 0; round < tierBase; round++) {
      for (const pid of baseOrder) result[pid].push(pool[idx++]);
    }
  }

  // Collect leftover teams (not used in tier base rounds) into one shuffled pool
  const leftover = [];
  for (let tier = 1; tier <= 4; tier++) {
    for (let i = tierBase * N; i < 12; i++) leftover.push(tierPools[tier][i]);
  }
  shuffle(leftover); // leftover.length === extraBaseRounds*N + extras (exact)

  let li = 0;

  // Extra base rounds: give 1 leftover team to every player per round
  const extraOrder = shuffle(participants.map(p => p.id));
  for (let round = 0; round < extraBaseRounds; round++) {
    for (const pid of extraOrder) result[pid].push(leftover[li++]);
  }

  // Final partial round: 1 more team each to exactly `extras` players
  if (extras > 0) {
    const extraIds = shuffle(participants.map(p => p.id)).slice(0, extras);
    for (const pid of extraIds) result[pid].push(leftover[li++]);
  }

  return result;
}

// ── WhatsApp export ────────────────────────────────────────────────
const TIER_ICON = { 1: '⭐', 2: '🔵', 3: '🟢', 4: '⚪' };

function buildExportText(pool) {
  if (!pool.allocation || !(pool.participants || []).length) return '';
  const sep = '━'.repeat(15);
  const lines = [`🏆 *${pool.title}*`, sep];
  for (const p of pool.participants) {
    const teams = pool.allocation[p.id] || [];
    const byTier = { 1: [], 2: [], 3: [], 4: [] };
    for (const t of teams) byTier[t.tier].push(`${t.flag} ${t.name}`);
    lines.push(`👤 *${p.name}*`);
    const mainLine = TIERS
      .map(tier => byTier[tier][0] ? `${TIER_ICON[tier]} ${byTier[tier][0]}` : null)
      .filter(Boolean).join(' · ');
    if (mainLine) lines.push(mainLine);
    const extras = TIERS.flatMap(tier => byTier[tier].slice(1).map(t => `${TIER_ICON[tier]} ${t}`));
    if (extras.length) lines.push(extras.join(' · '));
    lines.push(sep);
  }
  return lines.join('\n');
}

// ── DB helpers ─────────────────────────────────────────────────────
async function fetchPool(id) {
  const { data, error } = await db.from('pools').select('*').eq('id', id).single();
  if (error) return null;
  return data;
}

async function fetchUserPools() {
  const { data, error } = await db
    .from('pools').select('*')
    .eq('owner_id', currentSession.user.id)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

async function savePool(pool) {
  const { error } = await db.from('pools')
    .upsert({ ...pool, updated_at: new Date().toISOString() }, { onConflict: 'id' });
  if (error) throw error;
}

async function fetchLiveScores() {
  const url = `${window.SUPABASE_URL}/functions/v1/wc-scores`;
  const res = await fetch(url, { headers: { apikey: window.SUPABASE_ANON_KEY } });
  if (!res.ok) return [];
  return res.json();
}

function computeSuggestions(matches) {
  const standings = {};
  for (const m of matches) {
    const g = m.group || 'Unknown';
    if (!standings[g]) standings[g] = {};
    for (const name of [m.home, m.away]) {
      if (!standings[g][name]) standings[g][name] = { pts: 0, played: 0 };
    }
    standings[g][m.home].played++;
    standings[g][m.away].played++;
    if (m.homeScore > m.awayScore)      { standings[g][m.home].pts += 3; }
    else if (m.homeScore < m.awayScore) { standings[g][m.away].pts += 3; }
    else                                { standings[g][m.home].pts += 1; standings[g][m.away].pts += 1; }
  }
  const suggested = [];
  for (const group of Object.values(standings)) {
    for (const [name, rec] of Object.entries(group)) {
      if (rec.pts === 0 && rec.played === 3) {
        const localName = EN_TO_LOCAL[name];
        if (localName) {
          const team = TEAMS.find(t => t.name === localName);
          if (team) suggested.push(team);
        }
      }
    }
  }
  return suggested;
}

async function createPool(title, participantCount) {
  const id = nanoid(6);
  const { error } = await db.from('pools').insert({
    id, owner_id: currentSession.user.id, title,
    participant_count: participantCount,
    participants: [], allocation: null,
    allocation_locked: false, eliminated_teams: [],
    team_set: 'WC2026',
  });
  if (error) throw error;
  return id;
}

async function deletePool(id) {
  const { error } = await db.from('pools').delete().eq('id', id);
  if (error) throw error;
}

// ── Realtime ───────────────────────────────────────────────────────
function cleanupRealtime() {
  if (realtimeChannel) { db.removeChannel(realtimeChannel); realtimeChannel = null; }
  if (elimSyncIntervalId) { clearInterval(elimSyncIntervalId); elimSyncIntervalId = null; }
}

function subscribeToPool(poolId, onUpdate) {
  cleanupRealtime();
  realtimeChannel = db.channel(`pool-${poolId}`)
    .on('postgres_changes', {
      event: 'UPDATE', schema: 'public', table: 'pools', filter: `id=eq.${poolId}`,
    }, payload => onUpdate(payload.new))
    .subscribe();
}

// ── Shared: allocation cards HTML ──────────────────────────────────
function allocationCardsHTML(pool) {
  if (!pool.allocation || !(pool.participants || []).length) {
    return '<p class="hint center" style="padding:24px 0">Sin asignación todavía.</p>';
  }
  const eliminated = pool.eliminated_teams || [];
  return (pool.participants || []).map(p => {
    const teams = pool.allocation[p.id] || [];
    const alive = teams.filter(t => !eliminated.includes(teamId(t))).length;
    const out   = teams.length - alive;
    const aliveTeams   = teams.filter(t => !eliminated.includes(teamId(t)));
    const deadTeams    = teams.filter(t =>  eliminated.includes(teamId(t)));
    const orderedTeams = [...aliveTeams, ...deadTeams];
    const teamsHtml = orderedTeams.map(t => {
      const isElim = eliminated.includes(teamId(t));
      return `<li class="${isElim ? 'team-eliminated' : ''}">
        <span class="tier-dot tier-${t.tier}"></span>
        ${isElim ? '❌ ' : '✅ '}${escHtml(t.flag)} ${escHtml(t.name)}
      </li>`;
    }).join('');
    const statusText = out === 0
      ? `✅ ${alive} vivos`
      : `✅ ${alive} vivos · ❌ ${out} eliminados`;
    return `<div class="alloc-card">
      <div class="alloc-card-name">
        <span class="alloc-card-name-text">${escHtml(p.name)}</span>
        <span class="alloc-card-count">${teams.length > 0 ? `${teams.length} equipos` : '—'}</span>
      </div>
      <span class="alloc-status">${statusText}</span>
      <ul class="team-list">${teamsHtml}</ul>
    </div>`;
  }).join('');
}

// ── Google SVG ─────────────────────────────────────────────────────
const GOOGLE_ICON = `<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66 2.84-.81-.62z"/>
  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
</svg>`;

// ── Sign-in helper ─────────────────────────────────────────────────
function signInWithGoogle() {
  db.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: 'https://wc-pool-three.vercel.app/' },
  });
}

// ── Landing page ───────────────────────────────────────────────────
function renderLanding() {
  cleanupRealtime();
  document.getElementById('app').innerHTML = `
    <div class="landing-page">
      <header class="landing-header">
        <span class="logo">⚽ WCPool</span>
        <button class="theme-toggle" title="Toggle theme">${themeIcon()}</button>
      </header>
      <main class="landing-main">
        <div class="landing-card">
          <div class="landing-icon">⚽</div>
          <h1 class="landing-title">WCPool</h1>
          <p class="landing-subtitle">Create and manage your World Cup 2026 pool</p>
          <div class="landing-divider"></div>
          <button class="btn-google" id="landing-sign-in">${GOOGLE_ICON} Sign in with Google</button>
        </div>
      </main>
      <footer class="landing-footer">by NineInchTooL</footer>
    </div>
  `;
  document.querySelector('.theme-toggle').addEventListener('click', toggleTheme);
  document.getElementById('landing-sign-in').addEventListener('click', signInWithGoogle);
}

// ── Dashboard ──────────────────────────────────────────────────────
async function renderDashboard() {
  cleanupRealtime();
  const user   = currentSession.user;
  const avatar = user.user_metadata?.avatar_url;
  const name   = user.user_metadata?.name || user.email || '';

  document.getElementById('app').innerHTML = `
    <header class="site-header">
      <div class="header-left">
        <span class="logo">⚽ WCPool</span>
      </div>
      <div class="header-right">
        <div class="user-info">
          ${avatar ? `<img class="user-avatar" src="${escHtml(avatar)}" alt="" />` : ''}
          <span class="user-name">${escHtml(name)}</span>
        </div>
        <button class="btn btn-sm btn-ghost" id="sign-out-btn">Sign out</button>
        <button class="theme-toggle" title="Toggle theme">${themeIcon()}</button>
      </div>
    </header>
    <main class="main-content">
      <div class="page-heading">
        <h1>My Pools <span class="count-badge" id="pool-count-badge">…</span></h1>
        <button class="btn btn-primary" id="create-pool-btn">＋ Create New Pool</button>
      </div>
      <div id="dashboard-content"><span class="loading-spinner-sm"></span> Loading pools…</div>
    </main>
    <footer class="site-footer">by NineInchTooL</footer>

    <!-- Create pool modal -->
    <div id="create-modal" class="modal hidden">
      <div class="modal-box">
        <h2 class="modal-title">New Pool</h2>
        <label class="field">Pool title
          <input type="text" id="new-title" value="My WC2026 Pool" />
        </label>
        <label class="field">Participants
          <div class="modal-range-row">
            <input type="range" id="new-count" min="2" max="12" value="10" />
            <span class="modal-range-val" id="new-count-val">10</span>
          </div>
          <span class="count-helper" id="count-helper">With 10 players, each gets 4–5 teams</span>
        </label>
        <label class="field">Team set
          <input type="text" value="FIFA World Cup 2026 — 48 teams, 4 tiers" readonly />
        </label>
        <p class="error-msg hidden" id="create-error"></p>
        <div class="modal-actions">
          <button class="btn" id="create-cancel">Cancel</button>
          <button class="btn btn-primary" id="create-submit">Create Pool</button>
        </div>
      </div>
    </div>

    <!-- Delete confirm modal -->
    <div id="delete-modal" class="modal hidden">
      <div class="modal-box">
        <h2 class="modal-title">Delete pool?</h2>
        <p id="delete-modal-text" style="color:var(--color-text-muted);font-size:.9rem"></p>
        <p class="error-msg hidden" id="delete-modal-err"></p>
        <div class="modal-actions">
          <button class="btn" id="delete-cancel">Cancel</button>
          <button class="btn btn-danger" id="delete-confirm">Delete permanently</button>
        </div>
      </div>
    </div>
  `;

  document.getElementById('sign-out-btn').addEventListener('click', () => db.auth.signOut());
  document.querySelector('.theme-toggle').addEventListener('click', toggleTheme);

  let pools = [];
  try {
    pools = await fetchUserPools();
  } catch {
    document.getElementById('dashboard-content').innerHTML =
      '<p class="error-msg">Failed to load pools. Please refresh.</p>';
    document.getElementById('pool-count-badge').textContent = '—';
    return;
  }

  renderPoolGrid(pools);
  bindDashboardModals(pools);
}

function renderPoolGrid(pools) {
  const MAX = 10;
  document.getElementById('pool-count-badge').textContent = `${pools.length} / ${MAX}`;

  const createBtn = document.getElementById('create-pool-btn');
  if (pools.length >= MAX) {
    createBtn.disabled = true;
  }

  const container = document.getElementById('dashboard-content');
  if (!pools.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🏆</div>
        <p class="empty-state-title">No pools yet</p>
        <p class="empty-state-desc">Create your first pool to get started!</p>
      </div>`;
    return;
  }

  container.innerHTML = `<div class="pool-grid">${pools.map(poolCardHTML).join('')}</div>
    ${pools.length >= MAX ? '<p class="limit-msg">You\'ve reached the 10 pool limit.</p>' : ''}`;
}

function poolCardHTML(pool) {
  const badges = [
    pool.allocation        ? '<span class="badge badge-success">✅ Allocated</span>' : '',
    pool.allocation_locked ? '<span class="badge badge-warning">🔒 Locked</span>'   : '',
  ].filter(Boolean).join('');

  return `<div class="pool-card" data-id="${escHtml(pool.id)}">
    <div class="pool-card-title">${escHtml(pool.title)}</div>
    <div class="pool-card-meta">${(pool.participants || []).length} / ${pool.participant_count} players</div>
    <div class="pool-card-badges">${badges}</div>
    <div class="pool-card-actions">
      <a href="#/pool/${pool.id}" class="btn btn-sm">👁 View</a>
      <a href="#/pool/${pool.id}/admin" class="btn btn-sm btn-primary">⚙ Admin</a>
      <span class="spacer"></span>
      <button class="btn-icon delete-pool-btn" data-id="${escHtml(pool.id)}" data-title="${escHtml(pool.title)}" title="Delete pool">🗑</button>
    </div>
  </div>`;
}

function bindDashboardModals(pools) {
  const modal    = document.getElementById('create-modal');
  const countEl  = document.getElementById('new-count');
  const countVal = document.getElementById('new-count-val');
  const helper   = document.getElementById('count-helper');
  const errEl    = document.getElementById('create-error');

  function updateHelper(n) {
    const lo = Math.floor(48 / n), hi = Math.ceil(48 / n);
    helper.textContent = `With ${n} players, each gets ${lo === hi ? lo : `${lo}–${hi}`} teams`;
  }

  document.getElementById('create-pool-btn').addEventListener('click', () => {
    modal.classList.remove('hidden');
    updateHelper(+countEl.value);
    document.getElementById('new-title').focus();
  });
  document.getElementById('create-cancel').addEventListener('click', () => modal.classList.add('hidden'));
  modal.addEventListener('click', e => { if (e.target === modal) modal.classList.add('hidden'); });

  countEl.addEventListener('input', () => {
    countVal.textContent = countEl.value;
    updateHelper(+countEl.value);
  });

  document.getElementById('create-submit').onclick = async () => {
    const title = document.getElementById('new-title').value.trim();
    const count = +countEl.value;
    errEl.classList.add('hidden');
    if (!title) { errEl.textContent = 'Please enter a pool title.'; errEl.classList.remove('hidden'); return; }
    const btn = document.getElementById('create-submit');
    btn.disabled = true; btn.innerHTML = '<span class="loading-spinner-sm"></span> Creating…';
    try {
      const id = await createPool(title, count);
      modal.classList.add('hidden');
      navigate(`#/pool/${id}/admin`);
    } catch {
      errEl.textContent = 'Failed to create pool. Try again.';
      errEl.classList.remove('hidden');
      btn.disabled = false; btn.textContent = 'Create Pool';
    }
  };

  // Delete modal
  const delModal = document.getElementById('delete-modal');
  let pendingDeleteId = null;

  document.getElementById('dashboard-content').addEventListener('click', e => {
    const btn = e.target.closest('.delete-pool-btn');
    if (!btn) return;
    pendingDeleteId = btn.dataset.id;
    document.getElementById('delete-modal-text').textContent =
      `This will permanently delete "${btn.dataset.title}" and all its data.`;
    document.getElementById('delete-modal-err').classList.add('hidden');
    delModal.classList.remove('hidden');
  });
  document.getElementById('delete-cancel').addEventListener('click', () => delModal.classList.add('hidden'));
  delModal.addEventListener('click', e => { if (e.target === delModal) delModal.classList.add('hidden'); });

  document.getElementById('delete-confirm').onclick = async () => {
    if (!pendingDeleteId) return;
    const errEl2 = document.getElementById('delete-modal-err');
    try {
      await deletePool(pendingDeleteId);
      delModal.classList.add('hidden');
      await renderDashboard();
    } catch {
      errEl2.textContent = 'Failed to delete. Try again.';
      errEl2.classList.remove('hidden');
    }
  };
}

// ── Viewer mode ────────────────────────────────────────────────────
async function renderViewer(poolId) {
  cleanupRealtime();

  document.getElementById('app').innerHTML = `
    <header class="site-header">
      <div class="header-left">
        <a href="#/" class="header-back">← <span class="header-back-text">My Pools</span></a>
      </div>
      <div class="header-center">
        <span class="byline">by NineInchTooL</span>
      </div>
      <div class="header-right" id="viewer-header-right">
        <button class="theme-toggle" title="Toggle theme">${themeIcon()}</button>
      </div>
    </header>
    <div id="pool-hero-wrap"></div>
    <div class="main-content" id="viewer-content">
      <div class="center" style="padding:40px 0"><span class="loading-spinner"></span></div>
    </div>
    <footer class="site-footer">by NineInchTooL</footer>
  `;
  document.querySelector('.theme-toggle').addEventListener('click', toggleTheme);

  const pool = await fetchPool(poolId);
  if (!pool) {
    document.getElementById('pool-hero-wrap').innerHTML = '';
    document.getElementById('viewer-content').innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🤷</div>
        <p class="empty-state-title">Pool not found</p>
        <a href="#/" class="btn btn-sm" style="margin-top:8px">← Go home</a>
      </div>`;
    return;
  }

  // Add admin button if current user is owner
  if (currentSession && pool.owner_id === currentSession.user.id) {
    document.getElementById('viewer-header-right').insertAdjacentHTML('afterbegin',
      `<a href="#/pool/${poolId}/admin" class="btn btn-sm btn-primary">⚙ Admin</a>`);
  }

  renderViewerContent(pool);
  subscribeToPool(poolId, updated => {
    if (typeof updated.allocation      === 'string') updated.allocation      = JSON.parse(updated.allocation);
    if (typeof updated.eliminated_teams === 'string') updated.eliminated_teams = JSON.parse(updated.eliminated_teams);
    if (typeof updated.participants     === 'string') updated.participants     = JSON.parse(updated.participants);
    renderViewerContent(updated);
  });
}

function renderViewerContent(pool) {
  const heroWrap = document.getElementById('pool-hero-wrap');
  const content  = document.getElementById('viewer-content');
  if (!heroWrap || !content) return;

  heroWrap.innerHTML = `
    <div class="pool-hero">
      <h1 class="pool-hero-title">${escHtml(pool.title)}</h1>
      <span class="byline">by NineInchTooL</span>
    </div>`;

  const lockNotice = pool.allocation_locked
    ? '<p class="lock-notice">🔒 Allocation locked</p>' : '';

  const elim = pool.eliminated_teams || [];
  const totalAlive = 48 - elim.length;
  const bannerHTML = elim.length > 0
    ? `<div class="elim-banner">
         <span class="elim-banner-stat">
           ⚽ <strong>${totalAlive}</strong> teams still in ·
           ❌ <strong>${elim.length}</strong> eliminated
         </span>
       </div>`
    : '';

  content.innerHTML = lockNotice + bannerHTML + `<div class="alloc-grid">${allocationCardsHTML(pool)}</div>`;
}

// ── Admin mode ─────────────────────────────────────────────────────
async function renderAdmin(poolId) {
  cleanupRealtime();

  if (!currentSession) {
    sessionStorage.setItem('wcpool_redirect', window.location.hash);
    navigate('#/');
    return;
  }

  document.getElementById('app').innerHTML = `
    <header class="site-header">
      <div class="header-left">
        <a href="#/" class="header-back">← <span class="header-back-text">My Pools</span></a>
      </div>
      <div class="header-right">
        <a href="#/pool/${poolId}" class="btn btn-sm btn-ghost">👁 Viewer</a>
        <button class="theme-toggle" title="Toggle theme">${themeIcon()}</button>
      </div>
    </header>
    <main class="main-content" id="admin-main">
      <div class="center" style="padding:40px 0"><span class="loading-spinner"></span></div>
    </main>
    <footer class="site-footer">by NineInchTooL</footer>
  `;
  document.querySelector('.theme-toggle').addEventListener('click', toggleTheme);

  let pool;
  try { pool = await fetchPool(poolId); } catch { pool = null; }

  const main = document.getElementById('admin-main');
  if (!pool) {
    main.innerHTML = '<p class="error-msg center" style="padding:40px 0">Pool not found.</p>'; return;
  }
  if (pool.owner_id !== currentSession.user.id) {
    main.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🔒</div>
        <p class="empty-state-title">Access denied</p>
        <p class="empty-state-desc">You are not the owner of this pool.</p>
        <a href="#/" class="btn btn-sm" style="margin-top:8px">← Go home</a>
      </div>`; return;
  }

  renderAdminPanel(pool);
}

function renderAdminPanel(pool) {
  const main   = document.getElementById('admin-main');
  const locked = pool.allocation_locked;
  const hasAlloc = !!pool.allocation;
  const pCount = (pool.participants || []).length;
  const extras = 12 % (pool.participant_count || 1) > 0;

  main.innerHTML = `
    <!-- Title + settings -->
    <div class="card" style="gap:10px">
      <div class="admin-title-wrap">
        <span class="pool-title-editable" id="admin-title-el">${escHtml(pool.title)}</span>
        <span class="admin-title-label">Admin Panel</span>
      </div>
      <div class="participant-count-row">
        <span id="p-count-display">${pool.participant_count} players</span>
        <button class="change-link" id="change-count-btn">· change</button>
      </div>
      <div id="count-change-wrap" class="hidden row">
        <input type="number" id="count-change-input" min="2" max="12" value="${pool.participant_count}" style="width:80px" />
        <button class="btn btn-sm btn-primary" id="count-change-save">Save</button>
        <button class="btn btn-sm" id="count-change-cancel">Cancel</button>
        <span class="error-msg hidden" id="count-change-err"></span>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn btn-sm" id="copy-link-btn">📋 Share viewer link</button>
        <button class="btn btn-sm" id="copy-wa-btn" ${hasAlloc ? '' : 'disabled'}>📋 Copy for WhatsApp</button>
      </div>
      <p class="error-msg hidden" id="settings-error"></p>
    </div>

    <!-- Participants -->
    <div class="card">
      <h3>Participants</h3>
      <p class="participant-counter ${pCount > pool.participant_count ? 'over-limit' : pCount >= pool.participant_count ? 'full' : ''}" id="p-counter">
        ${pCount > pool.participant_count
          ? `⚠️ ${pCount} / ${pool.participant_count} — please remove ${pCount - pool.participant_count} participant(s)`
          : `${pCount} / ${pool.participant_count} participants added`}
      </p>
      <div class="participants-list" id="participants-list"></div>
      <div class="add-participant-form">
        <input type="text" id="new-p-name" placeholder="Name" ${pCount >= pool.participant_count ? 'disabled' : ''} />
        ${extras ? `<label class="checkbox-row"><input type="checkbox" id="new-p-extra" /> Extra team</label>` : ''}
        <button class="btn btn-sm btn-primary" id="add-p-btn" ${pCount >= pool.participant_count ? 'disabled' : ''}>Add</button>
      </div>
      ${extras ? '<p class="hint">Mark "Extra team" to flag a participant as priority for an extra team when totals don\'t divide evenly.</p>' : ''}
    </div>

    <!-- Elimination tracker -->
    <details class="card elim-card">
      <summary>
        <span class="elim-summary-title">⚽ Elimination Tracker</span>
        <span class="elim-summary-arrow">▸</span>
      </summary>
      <div id="elim-body"></div>
    </details>

    <!-- Allocation controls -->
    <div class="card">
      <h3>Allocation</h3>
      <div class="alloc-actions">
        <button class="btn btn-primary" id="allocate-btn" ${locked || !pCount ? 'disabled' : ''}>🎲 Allocate Teams</button>
        <button class="btn" id="lock-btn">${locked ? '🔓 Unlock' : '🔒 Lock'} Allocation</button>
        <button class="btn btn-danger btn-sm" id="clear-alloc-btn" ${locked || !hasAlloc ? 'disabled' : ''}>Clear</button>
      </div>
      <p class="hint" id="alloc-hint">${locked ? '🔒 Allocation is locked.' : hasAlloc ? 'Allocation assigned.' : 'No allocation yet.'}</p>
    </div>

    <!-- Allocation preview -->
    <div id="admin-alloc-grid" class="alloc-grid">${hasAlloc ? allocationCardsHTML(pool) : ''}</div>

    <!-- WhatsApp export -->
    <div class="card" id="export-card" ${hasAlloc ? '' : 'style="display:none"'}>
      <h3>WhatsApp Export</h3>
      <textarea id="export-text" rows="12" readonly>${escHtml(buildExportText(pool))}</textarea>
      <button class="btn btn-sm btn-primary" id="copy-export-btn">📋 Copy to clipboard</button>
    </div>

    <!-- Danger zone -->
    <div class="card danger-card">
      <h3>Danger Zone</h3>
      <button class="btn btn-danger btn-sm" id="delete-pool-btn">🗑 Delete this pool</button>
    </div>

    <!-- Delete modal -->
    <div id="del-confirm-modal" class="modal hidden">
      <div class="modal-box">
        <h2 class="modal-title">Delete pool?</h2>
        <p style="color:var(--color-text-muted);font-size:.9rem">This will permanently delete <strong>${escHtml(pool.title)}</strong> and all its data.</p>
        <div class="modal-actions">
          <button class="btn" id="del-cancel">Cancel</button>
          <button class="btn btn-danger" id="del-confirm">Delete permanently</button>
        </div>
      </div>
    </div>
  `;

  renderParticipantsList(pool);
  renderEliminationTracker(pool);
  bindAdminEvents(pool);
}

function bindAdminEvents(pool) {
  bindTitleEdit(pool);

  // Participant count change
  document.getElementById('change-count-btn').addEventListener('click', () => {
    document.getElementById('count-change-wrap').classList.remove('hidden');
    document.getElementById('count-change-input').focus();
  });
  document.getElementById('count-change-cancel').addEventListener('click', () => {
    document.getElementById('count-change-wrap').classList.add('hidden');
  });
  document.getElementById('count-change-save').addEventListener('click', async () => {
    const val  = +document.getElementById('count-change-input').value;
    const errEl = document.getElementById('count-change-err');
    if (!val || val < 2 || val > 12) {
      errEl.textContent = 'Must be 2–12.'; errEl.classList.remove('hidden'); return;
    }
    pool.participant_count = val;
    try { await savePool(pool); renderAdminPanel(pool); }
    catch { errEl.textContent = 'Save failed.'; errEl.classList.remove('hidden'); }
  });

  // Share / export
  document.getElementById('copy-link-btn').addEventListener('click', async e => {
    await copyToClipboard(`https://wc-pool-three.vercel.app/#/pool/${pool.id}`, e.currentTarget);
  });
  document.getElementById('copy-wa-btn').addEventListener('click', async e => {
    await copyToClipboard(buildExportText(pool), e.currentTarget);
  });
  document.getElementById('copy-export-btn')?.addEventListener('click', async e => {
    await copyToClipboard(document.getElementById('export-text').value, e.currentTarget);
  });

  // Add participant
  document.getElementById('add-p-btn').addEventListener('click', () => addParticipant(pool));
  document.getElementById('new-p-name').addEventListener('keydown', e => {
    if (e.key === 'Enter') addParticipant(pool);
  });

  // Allocate
  document.getElementById('allocate-btn').addEventListener('click', async () => {
    if (pool.allocation_locked || !pool.participants?.length) return;
    if (pool.allocation && !confirm('This will re-randomize the current allocation. Are you sure?')) return;
    pool.allocation = allocate(pool.participants);
    try { await savePool(pool); refreshAllocUI(pool); }
    catch { showAdminError('Failed to save allocation.'); }
  });

  // Lock / unlock
  document.getElementById('lock-btn').addEventListener('click', async () => {
    if (pool.allocation_locked) {
      if (!confirm('Unlock the allocation?')) return;
      pool.allocation_locked = false;
    } else {
      pool.allocation_locked = true;
    }
    try {
      await savePool(pool);
      document.getElementById('lock-btn').textContent =
        pool.allocation_locked ? '🔓 Unlock Allocation' : '🔒 Lock Allocation';
      document.getElementById('allocate-btn').disabled = pool.allocation_locked;
      document.getElementById('clear-alloc-btn').disabled = pool.allocation_locked || !pool.allocation;
      document.getElementById('alloc-hint').textContent =
        pool.allocation_locked ? '🔒 Allocation is locked.' : 'Allocation unlocked.';
    } catch { showAdminError('Failed to save.'); }
  });

  // Clear allocation
  document.getElementById('clear-alloc-btn').addEventListener('click', async () => {
    if (pool.allocation_locked) return;
    if (!confirm('Clear the current allocation?')) return;
    pool.allocation = null;
    try { await savePool(pool); refreshAllocUI(pool); }
    catch { showAdminError('Failed to clear allocation.'); }
  });

  // Delete pool
  const delModal = document.getElementById('del-confirm-modal');
  document.getElementById('delete-pool-btn').addEventListener('click', () => delModal.classList.remove('hidden'));
  document.getElementById('del-cancel').addEventListener('click', () => delModal.classList.add('hidden'));
  delModal.addEventListener('click', e => { if (e.target === delModal) delModal.classList.add('hidden'); });
  document.getElementById('del-confirm').addEventListener('click', async () => {
    try { await deletePool(pool.id); navigate('#/'); }
    catch { showAdminError('Failed to delete pool.'); }
  });
}

function showAdminError(msg) {
  const el = document.getElementById('settings-error');
  if (!el) return;
  el.textContent = msg; el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), 4000);
}

function bindTitleEdit(pool) {
  const el = document.getElementById('admin-title-el');
  if (!el) return;
  el.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'text';
    input.value = pool.title;
    input.className = 'pool-title-edit-input';
    el.replaceWith(input);
    input.focus(); input.select();
    const save = async () => {
      const val = input.value.trim() || pool.title;
      pool.title = val;
      try { await savePool(pool); } catch { /* silent */ }
      const span = document.createElement('span');
      span.id = 'admin-title-el';
      span.className = 'pool-title-editable';
      span.textContent = val;
      input.replaceWith(span);
      bindTitleEdit(pool);
    };
    input.addEventListener('blur', save);
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') input.blur();
      if (e.key === 'Escape') { input.value = pool.title; input.blur(); }
    });
  });
}

function refreshAllocUI(pool) {
  const grid     = document.getElementById('admin-alloc-grid');
  const card     = document.getElementById('export-card');
  const waBtn    = document.getElementById('copy-wa-btn');
  const clearBtn = document.getElementById('clear-alloc-btn');
  const hint     = document.getElementById('alloc-hint');
  const allocBtn = document.getElementById('allocate-btn');
  const et       = document.getElementById('export-text');

  if (grid)     grid.innerHTML     = pool.allocation ? allocationCardsHTML(pool) : '';
  if (card)     card.style.display = pool.allocation ? '' : 'none';
  if (waBtn)    waBtn.disabled     = !pool.allocation;
  if (clearBtn) clearBtn.disabled  = !pool.allocation || pool.allocation_locked;
  if (hint)     hint.textContent   = pool.allocation ? 'Allocation assigned.' : 'No allocation yet.';
  if (allocBtn) allocBtn.disabled  = pool.allocation_locked || !pool.participants?.length;
  if (et)       et.value           = buildExportText(pool);
}

// ── Participants ───────────────────────────────────────────────────
async function addParticipant(pool) {
  const nameInput  = document.getElementById('new-p-name');
  const extraInput = document.getElementById('new-p-extra');
  const name = nameInput?.value.trim();
  if (!name) return;
  if ((pool.participants || []).length >= pool.participant_count) return;
  pool.participants = [...(pool.participants || []), { id: uid(), name, extraTeam: extraInput?.checked || false }];
  nameInput.value = '';
  if (extraInput) extraInput.checked = false;
  try {
    await savePool(pool);
    renderParticipantsList(pool);
    updateParticipantCounter(pool);
    refreshAllocUI(pool);
  } catch { showAdminError('Failed to add participant.'); }
}

function renderParticipantsList(pool) {
  const container = document.getElementById('participants-list');
  if (!container) return;
  const extras = 12 % (pool.participant_count || 1) > 0;

  container.innerHTML = (pool.participants || []).map(p => `
    <div class="participant-row" data-id="${p.id}">
      <span class="p-name">${escHtml(p.name)}</span>
      ${extras ? `<span class="p-extra ${p.extraTeam ? '' : 'hidden-badge'}">+extra</span>` : ''}
      <button class="btn-icon edit-p-btn" data-id="${p.id}" title="Edit">✏️</button>
      <button class="btn-icon del-p-btn"  data-id="${p.id}" title="Remove">🗑</button>
    </div>
  `).join('');

  container.querySelectorAll('.edit-p-btn').forEach(btn =>
    btn.addEventListener('click', () => editParticipantInline(pool, btn.dataset.id)));
  container.querySelectorAll('.del-p-btn').forEach(btn =>
    btn.addEventListener('click', () => removeParticipant(pool, btn.dataset.id)));

  const n = (pool.participants || []).length;
  const full = n >= pool.participant_count;
  const nameInput = document.getElementById('new-p-name');
  const addBtn    = document.getElementById('add-p-btn');
  if (nameInput) nameInput.disabled = full;
  if (addBtn)    addBtn.disabled    = full;

  const counterEl = document.getElementById('p-counter');
  if (counterEl) {
    const overLimit = n > pool.participant_count;
    counterEl.textContent = overLimit
      ? `⚠️ ${n} / ${pool.participant_count} — please remove ${n - pool.participant_count} participant(s)`
      : `${n} / ${pool.participant_count} participants added`;
    counterEl.className = `participant-counter ${overLimit ? 'over-limit' : (full ? 'full' : '')}`;
  }
}

function editParticipantInline(pool, id) {
  const p   = (pool.participants || []).find(x => x.id === id);
  const row = document.querySelector(`.participant-row[data-id="${id}"]`);
  if (!p || !row) return;
  const extras = 12 % (pool.participant_count || 1) > 0;
  row.innerHTML = `
    <input class="p-edit-name" type="text" value="${escHtml(p.name)}" style="flex:1;min-width:100px" />
    ${extras ? `<label class="checkbox-row"><input class="p-edit-extra" type="checkbox" ${p.extraTeam ? 'checked' : ''} /> Extra</label>` : ''}
    <button class="btn btn-sm btn-primary p-save-btn">Save</button>
    <button class="btn btn-sm p-cancel-btn">Cancel</button>
  `;
  row.querySelector('.p-edit-name').focus();
  row.querySelector('.p-save-btn').addEventListener('click', async () => {
    const newName = row.querySelector('.p-edit-name').value.trim();
    if (!newName) return;
    p.name = newName;
    p.extraTeam = row.querySelector('.p-edit-extra')?.checked || false;
    try { await savePool(pool); } catch { showAdminError('Failed to save.'); }
    renderParticipantsList(pool);
    refreshAllocUI(pool);
  });
  row.querySelector('.p-cancel-btn').addEventListener('click', () => renderParticipantsList(pool));
  row.querySelector('.p-edit-name').addEventListener('keydown', e => {
    if (e.key === 'Enter')  row.querySelector('.p-save-btn').click();
    if (e.key === 'Escape') row.querySelector('.p-cancel-btn').click();
  });
}

async function removeParticipant(pool, id) {
  pool.participants = (pool.participants || []).filter(p => p.id !== id);
  if (pool.allocation) delete pool.allocation[id];
  try {
    await savePool(pool);
    renderParticipantsList(pool);
    updateParticipantCounter(pool);
    refreshAllocUI(pool);
  } catch { showAdminError('Failed to remove participant.'); }
}

function updateParticipantCounter(pool) {
  const el = document.getElementById('p-counter');
  if (!el) return;
  const n = (pool.participants || []).length;
  const overLimit = n > pool.participant_count;
  el.textContent = overLimit
    ? `⚠️ ${n} / ${pool.participant_count} — please remove ${n - pool.participant_count} participant(s)`
    : `${n} / ${pool.participant_count} participants added`;
  el.className = `participant-counter ${overLimit ? 'over-limit' : (n >= pool.participant_count ? 'full' : '')}`;
}

// ── Elimination tracker ────────────────────────────────────────────
function renderEliminationTracker(pool) {
  const body = document.getElementById('elim-body');
  if (!body) return;

  const tierLabels = {
    1: '⭐ Tier 1 — Favoritos',
    2: '🔵 Tier 2 — Contendientes',
    3: '🟢 Tier 3 — Intermedios',
    4: '⚪ Tier 4 — Sorpresas',
  };

  body.innerHTML = '';

  // Header row with Sync Scores button
  const header = document.createElement('div');
  header.className = 'elim-header';
  const syncBtn = document.createElement('button');
  syncBtn.id = 'elim-sync-btn';
  syncBtn.className = 'btn btn-sm elim-sync-btn';
  syncBtn.textContent = '🔄 Sync Scores';
  header.appendChild(syncBtn);
  body.appendChild(header);

  // Suggestion banner (purely UI state, never persisted)
  const nonElim = currentSuggestions.filter(t => !(pool.eliminated_teams || []).includes(teamId(t)));
  if (nonElim.length > 0) {
    const banner = document.createElement('div');
    banner.className = 'elim-suggestions';
    const label = document.createElement('span');
    label.className = 'sugg-label';
    label.textContent = '📊 Suggested eliminations based on live scores:';
    banner.appendChild(label);
    nonElim.forEach(t => {
      const tid = teamId(t);
      const chip = document.createElement('span');
      chip.className = 'sugg-chip';
      const name = document.createElement('button');
      name.className = 'sugg-name';
      name.textContent = `${t.flag} ${t.name}`;
      name.addEventListener('click', () => {
        currentSuggestions = currentSuggestions.filter(s => teamId(s) !== tid);
        const target = body.querySelector(`button.elim-chip[data-team-id="${CSS.escape(tid)}"]`);
        if (target && !(pool.eliminated_teams || []).includes(tid)) target.click();
        else renderEliminationTracker(pool);
      });
      const dismiss = document.createElement('button');
      dismiss.className = 'sugg-dismiss';
      dismiss.setAttribute('aria-label', 'Dismiss');
      dismiss.textContent = '×';
      dismiss.addEventListener('click', () => {
        currentSuggestions = currentSuggestions.filter(s => teamId(s) !== tid);
        renderEliminationTracker(pool);
      });
      chip.appendChild(name);
      chip.appendChild(dismiss);
      banner.appendChild(chip);
    });
    body.appendChild(banner);
  }

  // Tier chip groups
  for (const tier of TIERS) {
    const group = document.createElement('div');
    group.className = 'elim-tier-group';
    const label = document.createElement('div');
    label.className = 'elim-tier-label';
    label.textContent = tierLabels[tier];
    group.appendChild(label);
    const chips = document.createElement('div');
    chips.className = 'elim-chips';
    TEAMS.filter(t => t.tier === tier).forEach(team => {
      const id  = teamId(team);
      const out = (pool.eliminated_teams || []).includes(id);
      const chip = document.createElement('button');
      chip.className = `elim-chip${out ? ' is-elim' : ''}`;
      chip.dataset.teamId = id;
      chip.textContent = (out ? '❌ ' : '') + `${team.flag} ${team.name}`;
      let saving = false;
      chip.addEventListener('click', async () => {
        if (saving) return;
        saving = true;
        chip.style.opacity = '0.5';
        const elim = pool.eliminated_teams || [];
        const idx  = elim.indexOf(id);
        pool.eliminated_teams = idx === -1 ? [...elim, id] : elim.filter(n => n !== id);
        try { await savePool(pool); renderEliminationTracker(pool); refreshAllocUI(pool); }
        catch { showAdminError('Failed to update.'); saving = false; }
      });
      chips.appendChild(chip);
    });
    group.appendChild(chips);
    body.appendChild(group);
  }

  // Sync button handler
  syncBtn.addEventListener('click', async () => {
    syncBtn.textContent = 'Syncing…';
    syncBtn.disabled = true;
    try {
      const matches = await fetchLiveScores();
      if (!matches.length) {
        showElimSyncError(header);
        syncBtn.textContent = '🔄 Sync Scores';
        syncBtn.disabled = false;
        return;
      }
      currentSuggestions = computeSuggestions(matches);
      renderEliminationTracker(pool);
    } catch {
      showElimSyncError(header);
      syncBtn.textContent = '🔄 Sync Scores';
      syncBtn.disabled = false;
    }
  });

  // Auto-sync on mount
  syncBtn.click();

  // Poll every 5 minutes while tab is visible; clear any previous interval first
  if (elimSyncIntervalId) clearInterval(elimSyncIntervalId);
  elimSyncIntervalId = setInterval(() => {
    if (!document.hidden) syncBtn.click();
  }, 5 * 60 * 1000);

  window.addEventListener('hashchange', () => clearInterval(elimSyncIntervalId), { once: true });
}

function showElimSyncError(container) {
  const err = document.createElement('span');
  err.className = 'elim-sync-error';
  err.textContent = 'Could not fetch scores';
  container.appendChild(err);
  setTimeout(() => err.remove(), 3000);
}

// ── Router ─────────────────────────────────────────────────────────
async function router() {
  const hash = window.location.hash;
  if (hash.includes('access_token') || hash.includes('error_description')) return;

  if (!hash || hash === '#' || hash === '#/') {
    currentSession ? await renderDashboard() : renderLanding();
    return;
  }

  const adminMatch  = hash.match(/^#\/pool\/([^/]+)\/admin$/);
  const viewerMatch = hash.match(/^#\/pool\/([^/]+)(?:\/)?$/);

  if (adminMatch)       await renderAdmin(adminMatch[1]);
  else if (viewerMatch) await renderViewer(viewerMatch[1]);
  else                  currentSession ? await renderDashboard() : renderLanding();
}

// ── Profile upsert (replaces removed DB trigger) ───────────────────
async function ensureProfile(session) {
  const { data: existing } = await db
    .from('profiles')
    .select('id')
    .eq('id', session.user.id)
    .single();

  if (!existing) {
    await db.from('profiles').insert({
      id: session.user.id,
      display_name: session.user.user_metadata?.full_name ?? session.user.email,
      avatar_url: session.user.user_metadata?.avatar_url ?? null,
    });
  }
}

// ── Init ───────────────────────────────────────────────────────────
async function init() {
  const { data: { session } } = await db.auth.getSession();
  currentSession = session;
  if (session) await ensureProfile(session);

  db.auth.onAuthStateChange(async (event, newSession) => {
    currentSession = newSession;
    if (event === 'SIGNED_IN') {
      await ensureProfile(newSession);
      const redirect = sessionStorage.getItem('wcpool_redirect');
      sessionStorage.removeItem('wcpool_redirect');
      navigate(redirect && redirect !== '#/' && !redirect.includes('access_token') ? redirect : '#/');
      return;
    }
    if (event === 'SIGNED_OUT') { navigate('#/'); return; }
    // TOKEN_REFRESHED and INITIAL_SESSION must not re-render —
    // INITIAL_SESSION fires right after the explicit router() call below
    // and would cause a concurrent render that doubles event listeners.
    if (event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') return;
    router();
  });

  window.addEventListener('hashchange', () => {
    const h = window.location.hash;
    if (!h.includes('access_token') && !h.includes('error_description')) router();
  });

  router();
}

document.addEventListener('DOMContentLoaded', init);
