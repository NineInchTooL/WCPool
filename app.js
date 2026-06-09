// ── World Cup 2026 teams (48), tiered by expected strength ────
// Tier 1: favoritos (12), Tier 2: contendientes (12),
// Tier 3: intermedios (12), Tier 4: sorpresas (12)
const TEAMS = [
  // Tier 1 — favoritos
  { name: "🇦🇷 Argentina",                    tier: 1 },
  { name: "🇫🇷 Francia",                       tier: 1 },
  { name: "🏴󠁧󠁢󠁥󠁮󠁧󠁿 Inglaterra",                   tier: 1 },
  { name: "🇧🇷 Brasil",                        tier: 1 },
  { name: "🇪🇸 España",                        tier: 1 },
  { name: "🇩🇪 Alemania",                      tier: 1 },
  { name: "🇵🇹 Portugal",                      tier: 1 },
  { name: "🇳🇱 Países Bajos",                  tier: 1 },
  { name: "🇧🇪 Bélgica",                       tier: 1 },
  { name: "🇺🇾 Uruguay",                       tier: 1 },
  { name: "🇨🇴 Colombia",                      tier: 1 },
  { name: "🇺🇸 Estados Unidos",                tier: 1 },
  // Tier 2 — contendientes
  { name: "🇲🇽 México",                        tier: 2 },
  { name: "🇭🇷 Croacia",                       tier: 2 },
  { name: "🇨🇭 Suiza",                         tier: 2 },
  { name: "🇸🇳 Senegal",                       tier: 2 },
  { name: "🇯🇵 Japón",                         tier: 2 },
  { name: "🇲🇦 Marruecos",                     tier: 2 },
  { name: "🇰🇷 Corea del Sur",                 tier: 2 },
  { name: "🇪🇨 Ecuador",                       tier: 2 },
  { name: "🇦🇹 Austria",                       tier: 2 },
  { name: "🇹🇷 Turquía",                       tier: 2 },
  { name: "🇨🇦 Canadá",                        tier: 2 },
  { name: "🇸🇪 Suecia",                        tier: 2 },
  // Tier 3 — intermedios
  { name: "🇦🇺 Australia",                     tier: 3 },
  { name: "🇳🇴 Noruega",                       tier: 3 },
  { name: "🇵🇾 Paraguay",                      tier: 3 },
  { name: "🇹🇳 Túnez",                         tier: 3 },
  { name: "🇧🇦 Bosnia y Herzegovina",          tier: 3 },
  { name: "🇬🇭 Ghana",                         tier: 3 },
  { name: "🇨🇿 República Checa",               tier: 3 },
  { name: "🏴󠁧󠁢󠁳󠁣󠁴󠁿 Escocia",                     tier: 3 },
  { name: "🇨🇮 Costa de Marfil",               tier: 3 },
  { name: "🇩🇿 Argelia",                       tier: 3 },
  { name: "🇮🇷 Irán",                          tier: 3 },
  { name: "🇪🇬 Egipto",                        tier: 3 },
  // Tier 4 — sorpresas
  { name: "🇸🇦 Arabia Saudita",                tier: 4 },
  { name: "🇿🇦 Sudáfrica",                     tier: 4 },
  { name: "🇮🇶 Irak",                          tier: 4 },
  { name: "🇯🇴 Jordania",                      tier: 4 },
  { name: "🇶🇦 Catar",                         tier: 4 },
  { name: "🇺🇿 Uzbekistán",                    tier: 4 },
  { name: "🇨🇼 Curazao",                       tier: 4 },
  { name: "🇭🇹 Haití",                         tier: 4 },
  { name: "🇵🇦 Panamá",                        tier: 4 },
  { name: "🇳🇿 Nueva Zelanda",                 tier: 4 },
  { name: "🇨🇩 Rep. Democrática del Congo",    tier: 4 },
  { name: "🇨🇻 Cabo Verde",                    tier: 4 },
];

const STORAGE_KEY = "wc2026_pool";

// ── State ──────────────────────────────────────────────────────
let state = {
  title: "World Cup 2026 Pool",
  password: null,     // null until admin sets it — never committed to the repo
  participants: [],   // [{ id, name, extraTeam }]
  allocation: null,   // { [id]: [teamName, ...] } | null
};

let isAdmin = false;

// ── Persistence ────────────────────────────────────────────────
function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try { Object.assign(state, JSON.parse(raw)); } catch (_) {}
  }
}

// ── Fair allocation algorithm ──────────────────────────────────
function allocate(participants) {
  if (participants.length === 0) return null;
  const n = participants.length;           // e.g. 10
  const total = TEAMS.length;             // 48
  const base = Math.floor(total / n);     // 4
  const extras = total % n;              // 8 → 8 people get 5 teams if n=10, wait…
  // Actually 48 / 10 = 4 remainder 8, so 8 people get 5 and 2 get 4.
  // But the user said "5 people get 5, 5 get 4" which requires 5*5+5*4=45≠48.
  // 48 = 10*4 + 8, so 8 get 5 and 2 get 4 is the exact math.
  // We honour the extraTeam flag first (those people get an extra team).
  // If more extraTeam flags than available extras, we ignore the excess.
  // If fewer, we fill from remaining participants randomly.

  // Determine who gets (base+1) teams
  const flagged = participants.filter(p => p.extraTeam).map(p => p.id);
  const unflagged = participants.filter(p => !p.extraTeam).map(p => p.id);

  let bigGroup = [...flagged];
  let smallGroup = [...unflagged];

  // Shuffle both groups
  shuffle(bigGroup);
  shuffle(smallGroup);

  // Fill bigGroup up to `extras` slots, pulling from smallGroup if needed
  while (bigGroup.length < extras && smallGroup.length > 0) {
    bigGroup.push(smallGroup.shift());
  }
  // If bigGroup exceeds extras, demote the excess back to smallGroup
  while (bigGroup.length > extras) {
    smallGroup.push(bigGroup.pop());
  }

  // Build per-tier pools (shuffled)
  const tierPools = { 1: [], 2: [], 3: [], 4: [] };
  for (const t of TEAMS) tierPools[t.tier].push(t.name);
  for (const pool of Object.values(tierPools)) shuffle(pool);

  // Assign to participants using round-robin within each tier
  // Each person should get roughly equal tier representation.
  // Strategy: for each tier, distribute teams one-by-one across all participants
  // in a shuffled order, giving big-group people one extra round.

  const allIds = participants.map(p => p.id);
  shuffle(allIds);

  // Build a queue for each participant indicating how many teams they get
  const teamCount = {};
  for (const id of allIds) {
    teamCount[id] = bigGroup.includes(id) ? base + 1 : base;
  }

  // We distribute per tier. Each tier has 12 teams.
  // For a fair distribution, give each person teams proportional to their total share.
  // Simple approach: fill person by person, ensuring tier balance.

  const result = {};
  for (const id of allIds) result[id] = [];

  // Interleave tier pools: pick 1 from each tier per "round"
  // Build a flat draw order cycling through tiers 1-2-3-4
  const drawOrder = [];
  const tierKeys = [1, 2, 3, 4];
  // Each tier has 12 teams; we need 48 draws total
  // We want to distribute evenly across tiers within each person's share
  const tierQueue = tierKeys.map(t => [...tierPools[t]]);
  // Build interleaved list of all 48 teams
  for (let round = 0; round < 12; round++) {
    for (const t of tierKeys) {
      drawOrder.push({ name: tierQueue[t - 1][round], tier: t });
    }
  }
  // drawOrder is now 48 teams in tier-interleaved order

  // Assign teams round-by-round to participants
  // Each participant gets slots = teamCount[id]
  // We go through drawOrder sequentially, assigning to participants
  // in a round-robin, but only up to their slot count.

  // Flatten participants in assignment order: interleave big & small groups
  // so tier-1 teams are spread across both groups.
  const assignOrder = [];
  const bigQ = [...bigGroup];
  const smallQ = [...smallGroup];
  // Interleave
  let bi = 0, si = 0;
  while (bi < bigQ.length || si < smallQ.length) {
    if (bi < bigQ.length) assignOrder.push(bigQ[bi++]);
    if (si < smallQ.length) assignOrder.push(smallQ[si++]);
  }

  let drawIdx = 0;
  let round2 = 0;
  // We distribute base rounds to everyone, then one more round to bigGroup
  const totalRounds = base + 1;
  for (let r = 0; r < totalRounds; r++) {
    for (const id of assignOrder) {
      if (r === base && !bigGroup.includes(id)) continue; // small group stops at base
      if (drawIdx >= drawOrder.length) break;
      result[id].push(drawOrder[drawIdx++]);
    }
  }

  return result;
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ── WhatsApp export ────────────────────────────────────────────
function buildExportText() {
  if (!state.allocation) return "";
  const lines = [`🏆 *${state.title}*`, ""];
  const tierLabel = { 1: "⭐", 2: "🔵", 3: "🟢", 4: "⚪" };
  for (const p of state.participants) {
    const teams = state.allocation[p.id] || [];
    lines.push(`*${p.name}* (${teams.length} teams)`);
    for (const t of teams) {
      lines.push(`  ${tierLabel[t.tier]} ${t.name}`);
    }
    lines.push("");
  }
  lines.push("Good luck! 🎉");
  return lines.join("\n");
}

// ── Rendering ──────────────────────────────────────────────────
function renderParticipantsList() {
  const container = document.getElementById("participants-list");
  container.innerHTML = "";
  for (const p of state.participants) {
    const row = document.createElement("div");
    row.className = "participant-row";
    row.innerHTML = `
      <span class="p-name">${escHtml(p.name)}</span>
      <span class="p-badge${p.extraTeam ? "" : " hidden-badge"}">+5 teams</span>
      <button class="remove-btn" data-id="${p.id}" title="Remove">✕</button>
    `;
    container.appendChild(row);
  }
  container.querySelectorAll(".remove-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      state.participants = state.participants.filter(p => p.id !== id);
      if (state.allocation) delete state.allocation[id];
      saveState();
      renderParticipantsList();
      renderAllocation();
    });
  });
}

function renderAllocation() {
  const grid = document.getElementById("allocation-grid");
  const noMsg = document.getElementById("no-allocation-msg");
  const exportSection = document.getElementById("export-section");

  grid.innerHTML = "";

  if (!state.allocation || state.participants.length === 0) {
    noMsg.classList.remove("hidden");
    exportSection.classList.add("hidden");
    return;
  }

  noMsg.classList.add("hidden");
  exportSection.classList.remove("hidden");

  for (const p of state.participants) {
    const teams = state.allocation[p.id] || [];
    const card = document.createElement("div");
    card.className = "alloc-card";
    const teamItems = teams.map(t =>
      `<li><span class="tier-dot tier-${t.tier}"></span>${escHtml(t.name)}</li>`
    ).join("");
    card.innerHTML = `
      <div class="alloc-name">
        ${escHtml(p.name)}
        <span style="font-size:0.75rem;color:var(--text-muted);font-weight:400">${teams.length} teams</span>
      </div>
      <ul class="team-list">${teamItems}</ul>
    `;
    grid.appendChild(card);
  }

  document.getElementById("export-text").value = buildExportText();
}

function renderPoolTitle() {
  const el = document.getElementById("pool-title-display");
  el.textContent = state.title || "";
}

function renderAdminSettings() {
  document.getElementById("pool-title-input").value = state.title || "";
  document.getElementById("pool-password-input").value = "";
}

function renderAll() {
  renderPoolTitle();
  renderParticipantsList();
  renderAllocation();
  renderAdminSettings();
}

// ── Admin mode ─────────────────────────────────────────────────
function enterAdmin() {
  isAdmin = true;
  document.getElementById("admin-panel").classList.remove("hidden");
  document.getElementById("mode-label").textContent = "Admin mode";
  document.getElementById("admin-toggle-btn").textContent = "Exit admin";
}

function exitAdmin() {
  isAdmin = false;
  document.getElementById("admin-panel").classList.add("hidden");
  document.getElementById("mode-label").textContent = "Viewer mode";
  document.getElementById("admin-toggle-btn").textContent = "Admin";
}

// ── Utility ────────────────────────────────────────────────────
function escHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

// ── Event wiring ───────────────────────────────────────────────
function init() {
  loadState();
  renderAll();

  // Admin toggle
  document.getElementById("admin-toggle-btn").addEventListener("click", () => {
    if (isAdmin) {
      exitAdmin();
    } else if (!state.password) {
      // No password set yet — first-time setup
      document.getElementById("admin-setup").classList.remove("hidden");
      document.getElementById("setup-password").value = "";
      document.getElementById("setup-password-confirm").value = "";
      document.getElementById("admin-setup-error").classList.add("hidden");
      setTimeout(() => document.getElementById("setup-password").focus(), 50);
    } else {
      document.getElementById("admin-login").classList.remove("hidden");
      document.getElementById("admin-password").value = "";
      document.getElementById("admin-login-error").classList.add("hidden");
      setTimeout(() => document.getElementById("admin-password").focus(), 50);
    }
  });

  // First-time setup modal
  document.getElementById("admin-setup-cancel").addEventListener("click", () => {
    document.getElementById("admin-setup").classList.add("hidden");
  });

  function trySetup() {
    const pw = document.getElementById("setup-password").value;
    const pw2 = document.getElementById("setup-password-confirm").value;
    if (!pw || pw !== pw2) {
      document.getElementById("admin-setup-error").classList.remove("hidden");
      return;
    }
    state.password = pw;
    saveState();
    document.getElementById("admin-setup").classList.add("hidden");
    enterAdmin();
  }

  document.getElementById("admin-setup-submit").addEventListener("click", trySetup);
  document.getElementById("setup-password-confirm").addEventListener("keydown", e => {
    if (e.key === "Enter") trySetup();
  });

  document.getElementById("admin-setup").addEventListener("click", e => {
    if (e.target === e.currentTarget) e.currentTarget.classList.add("hidden");
  });

  // Admin login modal
  document.getElementById("admin-login-cancel").addEventListener("click", () => {
    document.getElementById("admin-login").classList.add("hidden");
  });

  function tryLogin() {
    const pw = document.getElementById("admin-password").value;
    if (pw === state.password) {
      document.getElementById("admin-login").classList.add("hidden");
      enterAdmin();
    } else {
      document.getElementById("admin-login-error").classList.remove("hidden");
    }
  }

  document.getElementById("admin-login-submit").addEventListener("click", tryLogin);
  document.getElementById("admin-password").addEventListener("keydown", e => {
    if (e.key === "Enter") tryLogin();
  });

  // Close login modal on backdrop click
  document.getElementById("admin-login").addEventListener("click", e => {
    if (e.target === e.currentTarget) e.currentTarget.classList.add("hidden");
  });

  // Add participant
  document.getElementById("add-participant-btn").addEventListener("click", () => {
    const nameInput = document.getElementById("new-participant-name");
    const extraInput = document.getElementById("new-participant-extra");
    const name = nameInput.value.trim();
    if (!name) return;
    if (state.participants.length >= 10) {
      alert("Maximum 10 participants.");
      return;
    }
    state.participants.push({ id: uid(), name, extraTeam: extraInput.checked });
    nameInput.value = "";
    extraInput.checked = false;
    saveState();
    renderParticipantsList();
  });

  document.getElementById("new-participant-name").addEventListener("keydown", e => {
    if (e.key === "Enter") document.getElementById("add-participant-btn").click();
  });

  // Allocate
  document.getElementById("allocate-btn").addEventListener("click", () => {
    if (state.participants.length === 0) {
      document.getElementById("allocation-status").textContent = "Add participants first.";
      return;
    }
    state.allocation = allocate(state.participants);
    saveState();
    renderAllocation();
    document.getElementById("allocation-status").textContent =
      `Allocated ${TEAMS.length} teams across ${state.participants.length} participants.`;
  });

  // Clear allocation
  document.getElementById("clear-allocation-btn").addEventListener("click", () => {
    if (!confirm("Clear the current allocation?")) return;
    state.allocation = null;
    saveState();
    renderAllocation();
    document.getElementById("allocation-status").textContent = "Allocation cleared.";
  });

  // Save settings
  document.getElementById("save-settings-btn").addEventListener("click", () => {
    const title = document.getElementById("pool-title-input").value.trim();
    const pw = document.getElementById("pool-password-input").value;
    if (title) state.title = title;
    if (pw) state.password = pw;
    saveState();
    renderPoolTitle();
    document.getElementById("pool-password-input").value = "";
    alert("Settings saved.");
  });

  // Copy export
  document.getElementById("copy-btn").addEventListener("click", () => {
    const text = document.getElementById("export-text").value;
    navigator.clipboard.writeText(text).then(() => {
      const fb = document.getElementById("copy-feedback");
      fb.classList.remove("hidden");
      setTimeout(() => fb.classList.add("hidden"), 2000);
    }).catch(() => {
      document.getElementById("export-text").select();
      document.execCommand("copy");
    });
  });
}

document.addEventListener("DOMContentLoaded", init);
