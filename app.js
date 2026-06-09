/*
  SECURITY NOTE:
  - SUPABASE_ANON_KEY is a public/publishable key — safe in client-side code.
  - Authentication is handled by Supabase Auth (Google OAuth).
  - Admin access is enforced by checking pool.owner_id === auth.uid().
  - RLS allows public read (viewer mode) and owner-only write.
  - Do NOT use this pattern for sensitive or private data.
*/

// ── Teams ─────────────────────────────────────────────────────────
const TEAMS = [
  { name: "🇦🇷 Argentina",                  tier: 1 },
  { name: "🇫🇷 Francia",                     tier: 1 },
  { name: "🏴󠁧󠁢󠁥󠁮󠁧󠁿 Inglaterra",                 tier: 1 },
  { name: "🇧🇷 Brasil",                      tier: 1 },
  { name: "🇪🇸 España",                      tier: 1 },
  { name: "🇩🇪 Alemania",                    tier: 1 },
  { name: "🇵🇹 Portugal",                    tier: 1 },
  { name: "🇳🇱 Países Bajos",                tier: 1 },
  { name: "🇧🇪 Bélgica",                     tier: 1 },
  { name: "🇺🇾 Uruguay",                     tier: 1 },
  { name: "🇨🇴 Colombia",                    tier: 1 },
  { name: "🇺🇸 Estados Unidos",              tier: 1 },
  { name: "🇲🇽 México",                      tier: 2 },
  { name: "🇭🇷 Croacia",                     tier: 2 },
  { name: "🇨🇭 Suiza",                       tier: 2 },
  { name: "🇸🇳 Senegal",                     tier: 2 },
  { name: "🇯🇵 Japón",                       tier: 2 },
  { name: "🇲🇦 Marruecos",                   tier: 2 },
  { name: "🇰🇷 Corea del Sur",               tier: 2 },
  { name: "🇪🇨 Ecuador",                     tier: 2 },
  { name: "🇦🇹 Austria",                     tier: 2 },
  { name: "🇹🇷 Turquía",                     tier: 2 },
  { name: "🇨🇦 Canadá",                      tier: 2 },
  { name: "🇸🇪 Suecia",                      tier: 2 },
  { name: "🇦🇺 Australia",                   tier: 3 },
  { name: "🇳🇴 Noruega",                     tier: 3 },
  { name: "🇵🇾 Paraguay",                    tier: 3 },
  { name: "🇹🇳 Túnez",                       tier: 3 },
  { name: "🇧🇦 Bosnia y Herzegovina",        tier: 3 },
  { name: "🇬🇭 Ghana",                       tier: 3 },
  { name: "🇨🇿 República Checa",             tier: 3 },
  { name: "🏴󠁧󠁢󠁳󠁣󠁴󠁿 Escocia",                   tier: 3 },
  { name: "🇨🇮 Costa de Marfil",             tier: 3 },
  { name: "🇩🇿 Argelia",                     tier: 3 },
  { name: "🇮🇷 Irán",                        tier: 3 },
  { name: "🇪🇬 Egipto",                      tier: 3 },
  { name: "🇸🇦 Arabia Saudita",              tier: 4 },
  { name: "🇿🇦 Sudáfrica",                   tier: 4 },
  { name: "🇮🇶 Irak",                        tier: 4 },
  { name: "🇯🇴 Jordania",                    tier: 4 },
  { name: "🇶🇦 Catar",                       tier: 4 },
  { name: "🇺🇿 Uzbekistán",                  tier: 4 },
  { name: "🇨🇼 Curazao",                     tier: 4 },
  { name: "🇭🇹 Haití",                       tier: 4 },
  { name: "🇵🇦 Panamá",                      tier: 4 },
  { name: "🇳🇿 Nueva Zelanda",               tier: 4 },
  { name: "🇨🇩 Rep. Democrática del Congo",  tier: 4 },
  { name: "🇨🇻 Cabo Verde",                  tier: 4 },
];

const TEAM_SETS = {
  WC2026: { label: 'FIFA World Cup 2026', teams: TEAMS },
};

// ── Supabase ──────────────────────────────────────────────────────
const db = window.supabase.createClient(
  window.SUPABASE_URL,
  window.SUPABASE_ANON_KEY
);

// ── App state ─────────────────────────────────────────────────────
let session = null;
let realtimeChannel = null;

// ── Theme ─────────────────────────────────────────────────────────
(function () {
  const saved = localStorage.getItem('wcpool_theme') || 'dark';
  document.documentElement.dataset.theme = saved;
})();

function toggleTheme() {
  const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
  document.documentElement.dataset.theme = next;
  localStorage.setItem('wcpool_theme', next);
  document.querySelectorAll('.theme-toggle').forEach(btn => {
    btn.textContent = next === 'dark' ? '☀️' : '🌙';
  });
}

// ── Utilities ─────────────────────────────────────────────────────
function escHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function nanoid(len = 6) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from(crypto.getRandomValues(new Uint8Array(len)))
    .map(b => chars[b % chars.length]).join('');
}

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function navigate(hash) {
  window.location.hash = hash;
}

async function copyText(text, btn) {
  try {
    await navigator.clipboard.writeText(text);
    const orig = btn.textContent;
    btn.textContent = '✅ Copied!';
    setTimeout(() => { btn.textContent = orig; }, 2000);
  } catch { /* silent */ }
}

function buildExportText(pool) {
  if (!pool.allocation) return '';
  const lines = [`🏆 *${pool.title}*`, ''];
  const tierLabel = { 1: '⭐', 2: '🔵', 3: '🟢', 4: '⚪' };
  const eliminated = pool.eliminated_teams || [];
  for (const p of (pool.participants || [])) {
    const teams = (pool.allocation[p.id] || []);
    lines.push(`*${p.name}* (${teams.length} teams)`);
    for (const t of teams) {
      const isOut = eliminated.includes(t.name);
      lines.push(`  ${isOut ? '❌' : tierLabel[t.tier]} ${t.name}${isOut ? ' (eliminado)' : ''}`);
    }
    lines.push('');
  }
  lines.push('Good luck! 🎉');
  return lines.join('\n');
}

// ── Allocation algorithm ───────────────────────────────────────────
function allocate(participants) {
  if (!participants || participants.length === 0) return null;
  const N = participants.length;

  // Build per-tier pools (shuffled)
  const tierPools = {};
  for (let t = 1; t <= 4; t++) {
    tierPools[t] = TEAMS.filter(tm => tm.tier === t)
      .map(tm => ({ name: tm.name, tier: t }));
    shuffle(tierPools[t]);
  }

  const result = {};
  for (const p of participants) result[p.id] = [];

  // For each tier: distribute 12 teams across N players
  // floor(12/N) guaranteed per player, extras go to flagged players first
  for (let tier = 1; tier <= 4; tier++) {
    const pool = tierPools[tier]; // 12 teams
    const perPlayer = Math.floor(pool.length / N);
    const numExtras = pool.length % N;
    let idx = 0;

    const order = participants.map(p => p.id);
    shuffle(order);
    for (let round = 0; round < perPlayer; round++) {
      for (const id of order) result[id].push(pool[idx++]);
    }

    if (numExtras > 0) {
      const flagged = participants.filter(p => p.extraTeam).map(p => p.id);
      const unflagged = participants.filter(p => !p.extraTeam).map(p => p.id);
      shuffle(flagged); shuffle(unflagged);
      [...flagged, ...unflagged].slice(0, numExtras).forEach(id => {
        result[id].push(pool[idx++]);
      });
    }
  }

  return result;
}

// ── Database ──────────────────────────────────────────────────────
async function fetchPool(id) {
  const { data, error } = await db.from('pools').select('*').eq('id', id).single();
  if (error) return null;
  return data;
}

async function fetchUserPools() {
  const { data, error } = await db
    .from('pools').select('*')
    .eq('owner_id', session.user.id)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

async function savePool(pool) {
  const { error } = await db.from('pools')
    .upsert({ ...pool, updated_at: new Date().toISOString() }, { onConflict: 'id' });
  if (error) console.error('savePool error:', error.message);
}

async function createPool(title, participantCount) {
  const id = nanoid(6);
  const { error } = await db.from('pools').insert({
    id, owner_id: session.user.id, title,
    participant_count: participantCount,
    participants: [], allocation: null,
    allocation_locked: false, eliminated_teams: [],
    team_set: 'WC2026', tier_config: null,
  });
  if (error) throw error;
  return id;
}

async function deletePool(id) {
  const { error } = await db.from('pools').delete().eq('id', id);
  if (error) throw error;
}

// ── Realtime ──────────────────────────────────────────────────────
function cleanupRealtime() {
  if (realtimeChannel) { db.removeChannel(realtimeChannel); realtimeChannel = null; }
}

function subscribeToPool(poolId, onUpdate) {
  cleanupRealtime();
  realtimeChannel = db.channel(`pool_${poolId}`)
    .on('postgres_changes', {
      event: 'UPDATE', schema: 'public', table: 'pools', filter: `id=eq.${poolId}`,
    }, payload => onUpdate(payload.new))
    .subscribe();
}

// ── Header ────────────────────────────────────────────────────────
function headerHTML(opts = {}) {
  const { backTo, backLabel, pool } = opts;
  const isDark = document.documentElement.dataset.theme !== 'light';
  const themeIcon = isDark ? '☀️' : '🌙';

  const left = backTo
    ? `<a href="${backTo}" class="header-back">← ${escHtml(backLabel || 'Back')}</a>`
    : `<a href="#/" class="header-brand">⚽ WCPool</a>`;

  const center = pool
    ? `<span class="header-pool-title">${escHtml(pool.title)}</span>`
    : '';

  const right = session
    ? `<div class="header-user">
        ${session.user.user_metadata?.avatar_url
          ? `<img class="user-avatar" src="${escHtml(session.user.user_metadata.avatar_url)}" alt="" />`
          : ''}
        <span class="user-name">${escHtml(session.user.user_metadata?.name || session.user.email || '')}</span>
        <button class="btn btn-sm" id="sign-out-btn">Sign out</button>
       </div>`
    : `<button class="btn btn-sm primary" id="sign-in-btn">Sign in with Google</button>`;

  return `<header class="site-header">
    <div class="header-left">${left}</div>
    <div class="header-center">${center}</div>
    <div class="header-right">
      <button class="btn-icon theme-toggle" title="Toggle theme">${themeIcon}</button>
      ${right}
    </div>
  </header>`;
}

function bindHeaderEvents() {
  document.querySelector('.theme-toggle')?.addEventListener('click', toggleTheme);
  document.getElementById('sign-out-btn')?.addEventListener('click', () => db.auth.signOut());
  document.getElementById('sign-in-btn')?.addEventListener('click', () => {
    db.auth.signInWithOAuth({ provider: 'google',
      options: { redirectTo: window.location.origin + window.location.pathname } });
  });
}

// ── Landing ───────────────────────────────────────────────────────
function renderLanding() {
  cleanupRealtime();
  document.getElementById('app').innerHTML = `
    ${headerHTML()}
    <main class="landing-main">
      <div class="landing-box">
        <div class="landing-logo">⚽</div>
        <h1 class="landing-title">World Cup Pool</h1>
        <p class="landing-desc">Manage your FIFA World Cup 2026 pool — fair team allocation, real-time updates, and one-tap WhatsApp sharing.</p>
        <button class="btn-google" id="landing-sign-in">
          <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Sign in with Google
        </button>
        <p class="byline">by NineInchTooL</p>
      </div>
    </main>
    <footer class="site-footer"><span class="byline">by NineInchTooL</span></footer>
  `;
  bindHeaderEvents();
  document.getElementById('landing-sign-in')?.addEventListener('click', () => {
    db.auth.signInWithOAuth({ provider: 'google',
      options: { redirectTo: window.location.origin + window.location.pathname } });
  });
}

// ── Dashboard ─────────────────────────────────────────────────────
async function renderDashboard() {
  cleanupRealtime();
  document.getElementById('app').innerHTML = `
    ${headerHTML()}
    <main class="main-content">
      <div class="dashboard-header">
        <h2 class="page-title">Your Pools</h2>
        <button class="btn primary" id="create-pool-btn">+ New Pool</button>
      </div>
      <div id="pool-grid" class="pool-grid"><div class="loading-spinner">Loading pools…</div></div>
    </main>
    <footer class="site-footer"><span class="byline">by NineInchTooL</span></footer>

    <div id="create-modal" class="modal hidden">
      <div class="modal-box">
        <h2>Create New Pool</h2>
        <label>Pool title
          <input type="text" id="new-pool-title" placeholder="e.g. Family Pool 2026" />
        </label>
        <label>Participants (2–48)
          <div class="range-row">
            <input type="range" id="new-pool-count" min="2" max="48" value="10" />
            <span id="new-pool-count-display" class="range-value">10</span>
          </div>
        </label>
        <label>Team set
          <input type="text" value="FIFA World Cup 2026" readonly class="input-readonly" />
        </label>
        <p id="create-error" class="error hidden"></p>
        <div class="modal-actions">
          <button id="create-cancel-btn">Cancel</button>
          <button class="btn primary" id="create-submit-btn">Create</button>
        </div>
      </div>
    </div>
  `;
  bindHeaderEvents();

  let pools = [];
  try { pools = await fetchUserPools(); }
  catch { document.getElementById('pool-grid').innerHTML = '<p class="error center">Failed to load pools.</p>'; return; }
  renderPoolGrid(pools);

  const MAX_POOLS = 10;
  const createBtn = document.getElementById('create-pool-btn');
  if (pools.length >= MAX_POOLS) {
    createBtn.disabled = true;
    createBtn.title = 'Pool limit reached (10/10)';
  }

  const modal = document.getElementById('create-modal');
  const countSlider = document.getElementById('new-pool-count');
  const countDisplay = document.getElementById('new-pool-count-display');

  createBtn.addEventListener('click', () => modal.classList.remove('hidden'));
  document.getElementById('create-cancel-btn').addEventListener('click', () => modal.classList.add('hidden'));
  modal.addEventListener('click', e => { if (e.target === modal) modal.classList.add('hidden'); });
  countSlider.addEventListener('input', () => { countDisplay.textContent = countSlider.value; });

  document.getElementById('create-submit-btn').addEventListener('click', async () => {
    const title = document.getElementById('new-pool-title').value.trim();
    const count = parseInt(countSlider.value);
    const errEl = document.getElementById('create-error');
    errEl.classList.add('hidden');
    if (!title) { errEl.textContent = 'Please enter a pool title.'; errEl.classList.remove('hidden'); return; }
    const btn = document.getElementById('create-submit-btn');
    btn.disabled = true; btn.textContent = 'Creating…';
    try {
      const id = await createPool(title, count);
      navigate(`#/pool/${id}/admin`);
    } catch {
      errEl.textContent = 'Failed to create pool. Try again.';
      errEl.classList.remove('hidden');
      btn.disabled = false; btn.textContent = 'Create';
    }
  });
}

function renderPoolGrid(pools) {
  const grid = document.getElementById('pool-grid');
  if (!grid) return;
  const MAX_POOLS = 10;
  if (!pools.length) {
    grid.innerHTML = '<p class="hint center">No pools yet. Create your first pool!</p>';
    return;
  }
  grid.innerHTML = `
    <p class="hint pool-count">${pools.length} / ${MAX_POOLS} pools</p>
    <div class="pool-cards">
      ${pools.map(pool => {
        const pCount = (pool.participants || []).length;
        const lockedBadge = pool.allocation_locked ? '<span class="badge badge-locked">🔒 Locked</span>' : '';
        const allocBadge = pool.allocation ? '<span class="badge badge-alloc">✅ Allocated</span>' : '';
        return `<div class="pool-card">
          <div class="pool-card-title">${escHtml(pool.title)}</div>
          <div class="pool-card-meta">
            <span>👥 ${pCount} / ${pool.participant_count}</span>
            ${lockedBadge}${allocBadge}
          </div>
          <div class="pool-card-actions">
            <a href="#/pool/${pool.id}" class="btn btn-sm">👁 View</a>
            <a href="#/pool/${pool.id}/admin" class="btn btn-sm primary">⚙️ Admin</a>
          </div>
        </div>`;
      }).join('')}
    </div>
  `;
}

// ── Viewer ────────────────────────────────────────────────────────
async function renderViewer(poolId) {
  cleanupRealtime();
  document.getElementById('app').innerHTML = `
    ${headerHTML({ backTo: '#/', backLabel: 'Home' })}
    <div id="pool-title-hero">
      <h1 id="pool-title-display">Loading…</h1>
      <span class="byline">by NineInchTooL</span>
    </div>
    <main class="main-content" id="viewer-main">
      <div class="loading-spinner">Loading pool…</div>
    </main>
    <footer class="site-footer"><span class="byline">by NineInchTooL</span></footer>
  `;
  bindHeaderEvents();

  const pool = await fetchPool(poolId);
  if (!pool) {
    document.getElementById('pool-title-display').textContent = 'Pool not found';
    document.getElementById('viewer-main').innerHTML = '<p class="hint center">This pool does not exist or has been deleted.</p>';
    return;
  }

  document.getElementById('pool-title-display').textContent = pool.title;
  renderViewerContent(pool);

  subscribeToPool(poolId, updated => {
    document.getElementById('pool-title-display').textContent = updated.title;
    renderViewerContent(updated);
  });
}

function renderViewerContent(pool) {
  const container = document.getElementById('viewer-main');
  if (!container) return;
  if (!pool.allocation || !(pool.participants || []).length) {
    container.innerHTML = '<p class="hint center">No allocation yet.</p>';
    return;
  }
  container.innerHTML = `
    ${pool.allocation_locked ? '<div id="lock-badge">🔒 Allocation locked</div>' : ''}
    <div id="allocation-grid"></div>
  `;
  renderAllocationCards(pool, document.getElementById('allocation-grid'));
}

// ── Shared: allocation cards ───────────────────────────────────────
function renderAllocationCards(pool, container) {
  if (!container) return;
  container.innerHTML = '';
  const eliminated = pool.eliminated_teams || [];
  for (const p of (pool.participants || [])) {
    const teams = (pool.allocation || {})[p.id] || [];
    const alive = teams.filter(t => !eliminated.includes(t.name)).length;
    const out = teams.length - alive;
    const statusBadge = `<span class="alloc-status">${out > 0 ? `✅ ${alive} alive · ❌ ${out} out` : `✅ ${alive} alive`}</span>`;
    const teamItems = teams.map(t => {
      const isElim = eliminated.includes(t.name);
      return `<li class="${isElim ? 'team-eliminated' : ''}"><span class="tier-dot tier-${t.tier}"></span>${isElim ? '❌ ' : ''}${escHtml(t.name)}</li>`;
    }).join('');
    const card = document.createElement('div');
    card.className = 'alloc-card';
    card.innerHTML = `
      <div class="alloc-name">
        ${escHtml(p.name)}
        <span style="font-size:.75rem;color:var(--text-muted);font-weight:400">${teams.length} teams</span>
      </div>
      ${statusBadge}
      <ul class="team-list">${teamItems}</ul>
    `;
    container.appendChild(card);
  }
}

// ── Admin ─────────────────────────────────────────────────────────
async function renderAdmin(poolId) {
  cleanupRealtime();
  const app = document.getElementById('app');

  if (!session) {
    app.innerHTML = `
      ${headerHTML()}
      <main class="main-content">
        <div class="card auth-prompt">
          <p>Sign in to access pool admin.</p>
          <button class="btn-google" id="admin-sign-in">
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign in with Google
          </button>
        </div>
      </main>
    `;
    bindHeaderEvents();
    document.getElementById('admin-sign-in')?.addEventListener('click', () => {
      db.auth.signInWithOAuth({ provider: 'google',
        options: { redirectTo: window.location.origin + window.location.pathname } });
    });
    return;
  }

  app.innerHTML = `
    ${headerHTML({ backTo: `#/pool/${poolId}`, backLabel: 'View pool' })}
    <main class="main-content" id="admin-main">
      <div class="loading-spinner">Loading…</div>
    </main>
    <footer class="site-footer"><span class="byline">by NineInchTooL</span></footer>
  `;
  bindHeaderEvents();

  const pool = await fetchPool(poolId);
  if (!pool) {
    document.getElementById('admin-main').innerHTML = '<p class="error center">Pool not found.</p>';
    return;
  }
  if (pool.owner_id !== session.user.id) {
    document.getElementById('admin-main').innerHTML = '<p class="error center">Access denied — you are not the owner of this pool.</p>';
    return;
  }

  renderAdminPanel(pool);
}

function renderAdminPanel(pool) {
  const main = document.getElementById('admin-main');
  if (!main) return;
  const locked = pool.allocation_locked;

  main.innerHTML = `
    <div class="admin-heading">
      <h2 class="page-title" id="admin-page-title">${escHtml(pool.title)}</h2>
      <span class="hint">Admin Panel</span>
    </div>

    <!-- Settings -->
    <div class="card">
      <h3>Pool Settings</h3>
      <label>Title
        <input type="text" id="admin-title" value="${escHtml(pool.title)}" />
      </label>
      <label>Participants (2–48)
        <div class="range-row">
          <input type="range" id="admin-count" min="2" max="48" value="${pool.participant_count}" />
          <span id="admin-count-display" class="range-value">${pool.participant_count}</span>
        </div>
      </label>
      <div class="row">
        <button class="btn primary" id="save-settings-btn">Save settings</button>
        <button class="btn btn-sm" id="copy-link-btn">📋 Copy viewer link</button>
      </div>
    </div>

    <!-- Participants -->
    <div class="card">
      <h3>Participants</h3>
      <div id="participants-list"></div>
      <div class="row">
        <input type="text" id="new-participant-name" placeholder="Name" />
        <label class="checkbox-label">
          <input type="checkbox" id="new-participant-extra" /> Extra team
        </label>
        <button class="btn primary" id="add-participant-btn">Add</button>
      </div>
      <p class="hint">Teams distribute as evenly as possible across all 4 tiers. "Extra team" participants are prioritized when the total doesn't divide evenly.</p>
    </div>

    <!-- Elimination Tracker -->
    <details class="card">
      <summary class="card-summary"><h3>⚽ Elimination Tracker</h3></summary>
      <div id="elimination-tracker-body"></div>
    </details>

    <!-- Allocation -->
    <div class="card">
      <h3>Allocation</h3>
      <button class="btn primary big" id="allocate-btn" ${locked ? 'disabled' : ''} style="${locked ? 'opacity:.45' : ''}">🎲 Randomize &amp; Allocate</button>
      <div class="row">
        <button class="btn danger" id="clear-alloc-btn" ${locked ? 'disabled' : ''} style="${locked ? 'opacity:.45' : ''}">Clear allocation</button>
        <button class="btn" id="lock-alloc-btn">${locked ? '🔓 Unlock' : '🔒 Lock allocation'}</button>
      </div>
      <p id="alloc-status" class="hint"></p>
    </div>

    <!-- Allocation cards -->
    <div id="admin-allocation-grid"></div>

    <!-- Export -->
    <div class="card" id="export-card" ${pool.allocation ? '' : 'style="display:none"'}>
      <h3>Export for WhatsApp</h3>
      <textarea id="export-text" rows="14" readonly></textarea>
      <button class="btn primary" id="copy-export-btn">📋 Copy to clipboard</button>
      <p id="copy-feedback" class="hint hidden">Copied!</p>
    </div>

    <!-- Danger zone -->
    <div class="card danger-zone">
      <h3>Danger Zone</h3>
      <button class="btn danger" id="delete-pool-btn">🗑 Delete this pool</button>
    </div>

    <!-- Delete confirm modal -->
    <div id="delete-modal" class="modal hidden">
      <div class="modal-box">
        <h2>Delete pool?</h2>
        <p>This will permanently delete <strong>${escHtml(pool.title)}</strong> and all its data. This cannot be undone.</p>
        <div class="modal-actions">
          <button id="delete-cancel-btn">Cancel</button>
          <button class="btn danger" id="delete-confirm-btn">Delete permanently</button>
        </div>
      </div>
    </div>
  `;

  // Settings
  document.getElementById('admin-count').addEventListener('input', e => {
    document.getElementById('admin-count-display').textContent = e.target.value;
  });
  document.getElementById('save-settings-btn').addEventListener('click', async () => {
    const title = document.getElementById('admin-title').value.trim();
    const count = parseInt(document.getElementById('admin-count').value);
    if (!title) return;
    pool.title = title;
    pool.participant_count = count;
    await savePool(pool);
    document.getElementById('admin-page-title').textContent = title;
  });
  document.getElementById('copy-link-btn').addEventListener('click', async e => {
    await copyText(`https://wc-pool-three.vercel.app/#/pool/${pool.id}`, e.currentTarget);
  });

  // Participants
  bindParticipantsList(pool);

  // Elimination tracker
  renderEliminationTracker(pool);

  // Allocation
  document.getElementById('allocate-btn').addEventListener('click', async () => {
    if (pool.allocation_locked) return;
    if (!(pool.participants || []).length) {
      document.getElementById('alloc-status').textContent = 'Add participants first.';
      return;
    }
    pool.allocation = allocate(pool.participants);
    await savePool(pool);
    refreshAdminAllocation(pool);
    document.getElementById('alloc-status').textContent =
      `Allocated ${TEAMS.length} teams across ${pool.participants.length} participants.`;
  });

  document.getElementById('clear-alloc-btn').addEventListener('click', async () => {
    if (pool.allocation_locked) return;
    if (!confirm('Clear the current allocation?')) return;
    pool.allocation = null;
    await savePool(pool);
    refreshAdminAllocation(pool);
    document.getElementById('alloc-status').textContent = 'Allocation cleared.';
  });

  document.getElementById('lock-alloc-btn').addEventListener('click', async () => {
    if (pool.allocation_locked) {
      if (!confirm('Unlock the allocation? This will allow re-randomizing.')) return;
      pool.allocation_locked = false;
    } else {
      pool.allocation_locked = true;
    }
    await savePool(pool);
    const lk = pool.allocation_locked;
    document.getElementById('lock-alloc-btn').textContent = lk ? '🔓 Unlock' : '🔒 Lock allocation';
    const ab = document.getElementById('allocate-btn');
    const cb = document.getElementById('clear-alloc-btn');
    [ab, cb].forEach(b => { b.disabled = lk; b.style.opacity = lk ? '.45' : ''; });
  });

  // Export
  document.getElementById('copy-export-btn')?.addEventListener('click', async e => {
    await copyText(document.getElementById('export-text').value, e.currentTarget);
  });

  // Delete
  document.getElementById('delete-pool-btn').addEventListener('click', () => {
    document.getElementById('delete-modal').classList.remove('hidden');
  });
  document.getElementById('delete-cancel-btn').addEventListener('click', () => {
    document.getElementById('delete-modal').classList.add('hidden');
  });
  document.getElementById('delete-confirm-btn').addEventListener('click', async () => {
    await deletePool(pool.id);
    navigate('#/');
  });

  refreshAdminAllocation(pool);
}

function refreshAdminAllocation(pool) {
  const grid = document.getElementById('admin-allocation-grid');
  const exportCard = document.getElementById('export-card');
  if (!grid) return;
  grid.innerHTML = '';
  if (!pool.allocation || !(pool.participants || []).length) {
    if (exportCard) exportCard.style.display = 'none';
    return;
  }
  if (exportCard) exportCard.style.display = '';
  renderAllocationCards(pool, grid);
  const et = document.getElementById('export-text');
  if (et) et.value = buildExportText(pool);
}

// ── Admin: participants ───────────────────────────────────────────
function bindParticipantsList(pool) {
  renderParticipantsListUI(pool);

  document.getElementById('add-participant-btn').addEventListener('click', async () => {
    const nameInput = document.getElementById('new-participant-name');
    const extraInput = document.getElementById('new-participant-extra');
    const name = nameInput.value.trim();
    if (!name) return;
    if ((pool.participants || []).length >= 48) { alert('Maximum 48 participants.'); return; }
    pool.participants = [...(pool.participants || []), { id: uid(), name, extraTeam: extraInput.checked }];
    nameInput.value = ''; extraInput.checked = false;
    await savePool(pool);
    renderParticipantsListUI(pool);
    refreshAdminAllocation(pool);
  });

  document.getElementById('new-participant-name').addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('add-participant-btn').click();
  });
}

function renderParticipantsListUI(pool) {
  const container = document.getElementById('participants-list');
  if (!container) return;
  container.innerHTML = '';
  for (const p of (pool.participants || [])) {
    const row = document.createElement('div');
    row.className = 'participant-row';
    row.dataset.id = p.id;
    row.innerHTML = `
      <span class="p-name">${escHtml(p.name)}</span>
      <span class="p-badge${p.extraTeam ? '' : ' hidden-badge'}">+extra</span>
      <button class="edit-btn" data-id="${p.id}" title="Edit">✏️</button>
      <button class="remove-btn" data-id="${p.id}" title="Remove">✕</button>
    `;
    container.appendChild(row);
  }

  container.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const p = (pool.participants || []).find(x => x.id === id);
      if (!p) return;
      const row = container.querySelector(`[data-id="${id}"]`);
      row.innerHTML = `
        <input class="edit-name-input" type="text" value="${escHtml(p.name)}" />
        <label class="checkbox-label" style="white-space:nowrap">
          <input class="edit-extra-check" type="checkbox" ${p.extraTeam ? 'checked' : ''} /> Extra team
        </label>
        <button class="edit-save-btn btn primary" data-id="${id}">Save</button>
        <button class="edit-cancel-btn btn" data-id="${id}">Cancel</button>
      `;
      row.querySelector('.edit-name-input').focus();
      row.querySelector('.edit-save-btn').addEventListener('click', async () => {
        const newName = row.querySelector('.edit-name-input').value.trim();
        if (!newName) return;
        p.name = newName;
        p.extraTeam = row.querySelector('.edit-extra-check').checked;
        await savePool(pool);
        renderParticipantsListUI(pool);
        refreshAdminAllocation(pool);
      });
      row.querySelector('.edit-cancel-btn').addEventListener('click', () => renderParticipantsListUI(pool));
      row.querySelector('.edit-name-input').addEventListener('keydown', e => {
        if (e.key === 'Enter') row.querySelector('.edit-save-btn').click();
        if (e.key === 'Escape') row.querySelector('.edit-cancel-btn').click();
      });
    });
  });

  container.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      pool.participants = (pool.participants || []).filter(p => p.id !== id);
      if (pool.allocation) delete pool.allocation[id];
      await savePool(pool);
      renderParticipantsListUI(pool);
      refreshAdminAllocation(pool);
    });
  });
}

// ── Admin: elimination tracker ────────────────────────────────────
function renderEliminationTracker(pool) {
  const body = document.getElementById('elimination-tracker-body');
  if (!body) return;
  body.innerHTML = '';
  const tierNames = {
    1: '⭐ Tier 1 — Favoritos',
    2: '🔵 Tier 2 — Contendientes',
    3: '🟢 Tier 3 — Intermedios',
    4: '⚪ Tier 4 — Sorpresas',
  };
  [1, 2, 3, 4].forEach(tier => {
    const group = document.createElement('div');
    group.className = 'elim-tier-group';
    const label = document.createElement('div');
    label.className = 'elim-tier-label';
    label.textContent = tierNames[tier];
    const chips = document.createElement('div');
    chips.className = 'elim-chips';
    TEAMS.filter(t => t.tier === tier).forEach(team => {
      const isElim = (pool.eliminated_teams || []).includes(team.name);
      const chip = document.createElement('button');
      chip.className = 'elim-chip' + (isElim ? ' is-eliminated' : '');
      chip.textContent = isElim ? `❌ ${team.name}` : team.name;
      chip.addEventListener('click', async () => {
        const elim = pool.eliminated_teams || [];
        const idx = elim.indexOf(team.name);
        pool.eliminated_teams = idx === -1
          ? [...elim, team.name]
          : elim.filter(n => n !== team.name);
        await savePool(pool);
        renderEliminationTracker(pool);
        refreshAdminAllocation(pool);
      });
      chips.appendChild(chip);
    });
    group.appendChild(label);
    group.appendChild(chips);
    body.appendChild(group);
  });
}

// ── Router ────────────────────────────────────────────────────────
function router() {
  const hash = window.location.hash || '#/';
  if (hash.includes('access_token') || hash.includes('error_description')) return;

  const adminMatch = hash.match(/^#\/pool\/([^/]+)\/admin$/);
  const viewerMatch = hash.match(/^#\/pool\/([^/]+)(?:\/)?$/);

  if (adminMatch)       renderAdmin(adminMatch[1]);
  else if (viewerMatch) renderViewer(viewerMatch[1]);
  else                  session ? renderDashboard() : renderLanding();
}

// ── Init ─────────────────────────────────────────────────────────
async function init() {
  const { data: { session: s } } = await db.auth.getSession();
  session = s;

  db.auth.onAuthStateChange((event, newSession) => {
    session = newSession;
    if (event === 'SIGNED_IN' && window.location.hash.includes('access_token')) {
      navigate('#/');
      return;
    }
    router();
  });

  window.addEventListener('hashchange', () => {
    const h = window.location.hash;
    if (!h.includes('access_token') && !h.includes('error_description')) router();
  });

  router();
}

document.addEventListener('DOMContentLoaded', init);
