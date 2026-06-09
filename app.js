/*
  SECURITY NOTE:
  - SUPABASE_ANON_KEY is a public/publishable key — safe in client-side code.
  - Admin password is stored only in localStorage, never sent to Supabase.
  - password_set (boolean) is stored in Supabase so non-admin devices show login modal.
  - RLS policies allow public read/write intentionally for a shared family pool.
  - Do NOT use this pattern for sensitive or private data.
*/

// ── World Cup 2026 teams (48), tiered by expected strength ────
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

// ── Supabase client ────────────────────────────────────────────
const supabase = window.supabase.createClient(
  window.SUPABASE_URL,
  window.SUPABASE_ANON_KEY
);

// ── State ──────────────────────────────────────────────────────
let state = {
  title: "World Cup 2026 Pool",
  password: null,          // null until admin sets it — never sent to Supabase
  passwordSet: false,      // mirrors Supabase password_set flag (no actual password)
  participants: [],
  allocation: null,
  allocationLocked: false,
};

let isAdmin = false;
let pwWarningDismissed = false;

// ── Persistence ────────────────────────────────────────────────
async function saveState() {
  // password stays in localStorage only — never goes to Supabase
  localStorage.setItem('wc2026_pool_password', state.password || '');
  const { error } = await supabase
    .from('pool_state')
    .upsert({
      id: 'singleton',
      title: state.title,
      participants: state.participants,
      allocation: state.allocation,
      allocation_locked: state.allocationLocked ?? false,
      password_set: !!state.password,   // boolean flag only — no actual password
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' });
  if (error) console.error('Supabase saveState error:', error.message);
}

async function loadState() {
  // always load password from localStorage
  state.password = localStorage.getItem('wc2026_pool_password') || null;
  try {
    const { data, error } = await supabase
      .from('pool_state')
      .select('*')
      .eq('id', 'singleton')
      .single();
    if (error) throw error;
    if (data) {
      state.title            = data.title             ?? state.title;
      state.participants     = data.participants       ?? [];
      state.allocation       = data.allocation         ?? null;
      state.allocationLocked = data.allocation_locked  ?? false;
      state.passwordSet      = data.password_set       ?? false;
    }
  } catch (err) {
    console.warn('Supabase loadState failed, using defaults:', err.message);
  }
}

// ── Fair allocation algorithm ──────────────────────────────────
function allocate(participants) {
  if (participants.length === 0) return null;
  const n = participants.length;
  const total = TEAMS.length;
  const base = Math.floor(total / n);
  const extras = total % n;

  const flagged = participants.filter(p => p.extraTeam).map(p => p.id);
  const unflagged = participants.filter(p => !p.extraTeam).map(p => p.id);

  let bigGroup = [...flagged];
  let smallGroup = [...unflagged];

  shuffle(bigGroup);
  shuffle(smallGroup);

  while (bigGroup.length < extras && smallGroup.length > 0) bigGroup.push(smallGroup.shift());
  while (bigGroup.length > extras) smallGroup.push(bigGroup.pop());

  const tierPools = { 1: [], 2: [], 3: [], 4: [] };
  for (const t of TEAMS) tierPools[t.tier].push(t.name);
  for (const pool of Object.values(tierPools)) shuffle(pool);

  const allIds = participants.map(p => p.id);
  shuffle(allIds);

  const result = {};
  for (const id of allIds) result[id] = [];

  const drawOrder = [];
  const tierKeys = [1, 2, 3, 4];
  const tierQueue = tierKeys.map(t => [...tierPools[t]]);
  for (let round = 0; round < 12; round++) {
    for (const t of tierKeys) drawOrder.push({ name: tierQueue[t - 1][round], tier: t });
  }

  const assignOrder = [];
  const bigQ = [...bigGroup];
  const smallQ = [...smallGroup];
  let bi = 0, si = 0;
  while (bi < bigQ.length || si < smallQ.length) {
    if (bi < bigQ.length) assignOrder.push(bigQ[bi++]);
    if (si < smallQ.length) assignOrder.push(smallQ[si++]);
  }

  let drawIdx = 0;
  const totalRounds = base + 1;
  for (let r = 0; r < totalRounds; r++) {
    for (const id of assignOrder) {
      if (r === base && !bigGroup.includes(id)) continue;
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
    for (const t of teams) lines.push(`  ${tierLabel[t.tier]} ${t.name}`);
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
    row.dataset.id = p.id;
    row.innerHTML = `
      <span class="p-name">${escHtml(p.name)}</span>
      <span class="p-badge${p.extraTeam ? "" : " hidden-badge"}">+5 teams</span>
      <button class="edit-btn" data-id="${p.id}" title="Edit">✏️</button>
      <button class="remove-btn" data-id="${p.id}" title="Remove">✕</button>
    `;
    container.appendChild(row);
  }

  container.querySelectorAll(".edit-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      const p = state.participants.find(x => x.id === id);
      if (!p) return;
      const row = container.querySelector(`.participant-row[data-id="${id}"]`);
      row.innerHTML = `
        <input class="edit-name-input" type="text" value="${escHtml(p.name)}" />
        <label class="checkbox-label" style="white-space:nowrap">
          <input class="edit-extra-check" type="checkbox" ${p.extraTeam ? "checked" : ""} />
          5-team group
        </label>
        <button class="edit-save-btn primary" data-id="${id}">Save</button>
        <button class="edit-cancel-btn" data-id="${id}">Cancel</button>
      `;
      row.querySelector(".edit-name-input").focus();

      row.querySelector(".edit-save-btn").addEventListener("click", async () => {
        const newName = row.querySelector(".edit-name-input").value.trim();
        if (!newName) return;
        p.name = newName;
        p.extraTeam = row.querySelector(".edit-extra-check").checked;
        await saveState();
        renderParticipantsList();
        renderAllocation();
      });

      row.querySelector(".edit-cancel-btn").addEventListener("click", () => {
        renderParticipantsList();
      });

      row.querySelector(".edit-name-input").addEventListener("keydown", e => {
        if (e.key === "Enter") row.querySelector(".edit-save-btn").click();
        if (e.key === "Escape") row.querySelector(".edit-cancel-btn").click();
      });
    });
  });

  container.querySelectorAll(".remove-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      state.participants = state.participants.filter(p => p.id !== id);
      if (state.allocation) delete state.allocation[id];
      await saveState();
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
  document.getElementById("pool-title-display").textContent = state.title || "";
}

function renderAdminSettings() {
  document.getElementById("pool-title-input").value = state.title || "";
  document.getElementById("pool-password-input").value = "";
}

function showPwWarning() {
  if (pwWarningDismissed) return;
  document.getElementById("pw-warning-banner").classList.remove("hidden");
}

function renderLockState() {
  const locked = state.allocationLocked;
  const allocBtn = document.getElementById("allocate-btn");
  const clearBtn = document.getElementById("clear-allocation-btn");
  const lockBtn = document.getElementById("lock-allocation-btn");
  const badge = document.getElementById("lock-badge");

  allocBtn.disabled = locked;
  clearBtn.disabled = locked;
  allocBtn.style.opacity = locked ? "0.45" : "";
  clearBtn.style.opacity = locked ? "0.45" : "";

  lockBtn.textContent = locked ? "🔓 Unlock allocation" : "🔒 Lock allocation";
  badge.classList.toggle("hidden", !locked);
}

function render() {
  renderPoolTitle();
  renderParticipantsList();
  renderAllocation();
  renderAdminSettings();
  renderLockState();
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

// ── App bootstrap (async IIFE) ─────────────────────────────────
(async () => {
  await loadState();
  render();

  // Admin toggle
  // Uses state.passwordSet (from Supabase) to decide whether to show setup or login.
  // This means ALL devices correctly show the login modal once a password has been set,
  // even if they don't have the password in their own localStorage.
  document.getElementById("admin-toggle-btn").addEventListener("click", () => {
    if (isAdmin) {
      exitAdmin();
    } else if (!state.passwordSet) {
      // No password set anywhere yet — show first-time setup
      document.getElementById("admin-setup").classList.remove("hidden");
      document.getElementById("setup-password").value = "";
      document.getElementById("setup-password-confirm").value = "";
      document.getElementById("admin-setup-error").classList.add("hidden");
      setTimeout(() => document.getElementById("setup-password").focus(), 50);
    } else {
      // Password already set — show login modal
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

  async function trySetup() {
    const pw = document.getElementById("setup-password").value;
    const pw2 = document.getElementById("setup-password-confirm").value;
    if (!pw || pw !== pw2) {
      document.getElementById("admin-setup-error").classList.remove("hidden");
      return;
    }
    state.password = pw;
    state.passwordSet = true;
    await saveState();
    document.getElementById("admin-setup").classList.add("hidden");
    enterAdmin();
    showPwWarning();
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

  document.getElementById("admin-login").addEventListener("click", e => {
    if (e.target === e.currentTarget) e.currentTarget.classList.add("hidden");
  });

  // Add participant
  document.getElementById("add-participant-btn").addEventListener("click", async () => {
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
    await saveState();
    renderParticipantsList();
  });

  document.getElementById("new-participant-name").addEventListener("keydown", e => {
    if (e.key === "Enter") document.getElementById("add-participant-btn").click();
  });

  // Allocate
  document.getElementById("allocate-btn").addEventListener("click", async () => {
    if (state.allocationLocked) return;
    if (state.participants.length === 0) {
      document.getElementById("allocation-status").textContent = "Add participants first.";
      return;
    }
    state.allocation = allocate(state.participants);
    await saveState();
    renderAllocation();
    document.getElementById("allocation-status").textContent =
      `Allocated ${TEAMS.length} teams across ${state.participants.length} participants.`;
  });

  // Clear allocation
  document.getElementById("clear-allocation-btn").addEventListener("click", async () => {
    if (state.allocationLocked) return;
    if (!confirm("Clear the current allocation?")) return;
    state.allocation = null;
    await saveState();
    renderAllocation();
    document.getElementById("allocation-status").textContent = "Allocation cleared.";
  });

  // Lock / unlock allocation
  document.getElementById("lock-allocation-btn").addEventListener("click", async () => {
    if (state.allocationLocked) {
      if (!confirm("Are you sure you want to unlock the allocation? This will allow re-randomizing.")) return;
      state.allocationLocked = false;
    } else {
      state.allocationLocked = true;
    }
    await saveState();
    renderLockState();
  });

  // Save settings
  document.getElementById("save-settings-btn").addEventListener("click", async () => {
    const title = document.getElementById("pool-title-input").value.trim();
    const pw = document.getElementById("pool-password-input").value;
    if (title) state.title = title;
    if (pw) { state.password = pw; state.passwordSet = true; showPwWarning(); }
    await saveState();
    renderPoolTitle();
    document.getElementById("pool-password-input").value = "";
    alert("Settings saved.");
  });

  // Password warning banner dismiss
  document.getElementById("pw-warning-close").addEventListener("click", () => {
    pwWarningDismissed = true;
    document.getElementById("pw-warning-banner").classList.add("hidden");
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

  // Real-time subscription
  supabase
    .channel('pool_state_changes')
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'pool_state' },
      (payload) => {
        const d = payload.new;
        state.title            = d.title;
        state.participants     = d.participants;
        state.allocation       = d.allocation;
        state.allocationLocked = d.allocation_locked;
        state.passwordSet      = d.password_set;
        render();
      }
    )
    .subscribe();
})();
