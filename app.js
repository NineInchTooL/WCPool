// PWA install prompt — must be captured synchronously before any await
let deferredInstallPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
});

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
  'Bosnia and Herzegovina': 'Bosnia y Herzegovina', 'Bosnia & Herzegovina': 'Bosnia y Herzegovina', 'Bosnia-Herzegovina': 'Bosnia y Herzegovina',
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
  'Cape Verde Islands': 'Cabo Verde',
};

// Maps Spanish canonical names → display names per locale (es-MX is identity)
const TEAM_NAMES_I18N = {
  'en-US': {
    'Argentina': 'Argentina', 'Francia': 'France', 'Inglaterra': 'England',
    'Brasil': 'Brazil', 'España': 'Spain', 'Alemania': 'Germany',
    'Portugal': 'Portugal', 'Países Bajos': 'Netherlands', 'Bélgica': 'Belgium',
    'Uruguay': 'Uruguay', 'Colombia': 'Colombia', 'Estados Unidos': 'USA',
    'México': 'Mexico', 'Croacia': 'Croatia', 'Suiza': 'Switzerland',
    'Senegal': 'Senegal', 'Japón': 'Japan', 'Marruecos': 'Morocco',
    'Corea del Sur': 'South Korea', 'Ecuador': 'Ecuador', 'Austria': 'Austria',
    'Turquía': 'Turkey', 'Canadá': 'Canada', 'Suecia': 'Sweden',
    'Australia': 'Australia', 'Noruega': 'Norway', 'Paraguay': 'Paraguay',
    'Túnez': 'Tunisia', 'Bosnia y Herzegovina': 'Bosnia & Herzegovina',
    'Ghana': 'Ghana', 'República Checa': 'Czech Republic', 'Escocia': 'Scotland',
    'Costa de Marfil': 'Ivory Coast', 'Argelia': 'Algeria', 'Irán': 'Iran',
    'Egipto': 'Egypt', 'Arabia Saudita': 'Saudi Arabia', 'Sudáfrica': 'South Africa',
    'Irak': 'Iraq', 'Jordania': 'Jordan', 'Catar': 'Qatar',
    'Uzbekistán': 'Uzbekistan', 'Curazao': 'Curaçao', 'Haití': 'Haiti',
    'Panamá': 'Panama', 'Nueva Zelanda': 'New Zealand',
    'Rep. Democrática del Congo': 'DR Congo', 'Cabo Verde': 'Cape Verde',
  },
  'es-MX': {},
  'pt-PT': {
    'Argentina': 'Argentina', 'Francia': 'França', 'Inglaterra': 'Inglaterra',
    'Brasil': 'Brasil', 'España': 'Espanha', 'Alemania': 'Alemanha',
    'Portugal': 'Portugal', 'Países Bajos': 'Países Baixos', 'Bélgica': 'Bélgica',
    'Uruguay': 'Uruguai', 'Colombia': 'Colômbia', 'Estados Unidos': 'EUA',
    'México': 'México', 'Croacia': 'Croácia', 'Suiza': 'Suíça',
    'Senegal': 'Senegal', 'Japón': 'Japão', 'Marruecos': 'Marrocos',
    'Corea del Sur': 'Coreia do Sul', 'Ecuador': 'Equador', 'Austria': 'Áustria',
    'Turquía': 'Turquia', 'Canadá': 'Canadá', 'Suecia': 'Suécia',
    'Australia': 'Austrália', 'Noruega': 'Noruega', 'Paraguay': 'Paraguai',
    'Túnez': 'Tunísia', 'Bosnia y Herzegovina': 'Bósnia e Herzegovina',
    'Ghana': 'Gana', 'República Checa': 'República Checa', 'Escocia': 'Escócia',
    'Costa de Marfil': 'Costa do Marfim', 'Argelia': 'Argélia', 'Irán': 'Irão',
    'Egipto': 'Egito', 'Arabia Saudita': 'Arábia Saudita', 'Sudáfrica': 'África do Sul',
    'Irak': 'Iraque', 'Jordania': 'Jordânia', 'Catar': 'Qatar',
    'Uzbekistán': 'Uzbequistão', 'Curazao': 'Curaçao', 'Haití': 'Haiti',
    'Panamá': 'Panamá', 'Nueva Zelanda': 'Nova Zelândia',
    'Rep. Democrática del Congo': 'RD Congo', 'Cabo Verde': 'Cabo Verde',
  },
};

// ── Supabase (use `db` — window.supabase is non-configurable) ──────
const db = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);

// ── State ──────────────────────────────────────────────────────────
let currentSession = null;
let realtimeChannel = null;
let currentSuggestions = [];
let elimSyncIntervalId = null;
let lastUpdatedInterval = null;
let todayMatchesCache = null; // null = unfetched; [] = fetched, none today
let todayMatchMap = null;     // Map<spanishCanonicalName, { opponentEs, utcDate, status }>
const dismissedEliminationNotices = new Map(); // poolId → Set<teamName>

// ── i18n ───────────────────────────────────────────────────────────
// Rules: TEAMS[].name is always Spanish (es-MX) — canonical DB key.
//        localTeamName(nameEs) translates for display only.
//        t(key, ...args) handles plain strings and function-valued entries.
//        setLocale() persists to localStorage and re-renders via router().

const TRANSLATIONS = {
  'en-US': {
    // Landing
    landing_subtitle:          'Create and manage your World Cup 2026 pool',
    sign_in_google:            'Sign in with Google',
    // Header / nav
    my_pools_back:             'My Pools',
    view:                      '👁 View',
    admin:                     '⚙ Admin',
    // Dashboard
    sign_out:                  'Sign out',
    my_pools:                  'My Pools',
    create_new_pool:           '＋ Create New Pool',
    loading_pools:             'Loading pools…',
    new_pool_title:            'New Pool',
    pool_title_label:          'Pool title',
    default_pool_title:        'My WC2026 Pool',
    participants_label:        'Participants',
    team_set_label:            'Team set',
    team_set_value:            'FIFA World Cup 2026 — 48 teams, 4 tiers',
    cancel:                    'Cancel',
    create_pool:               'Create Pool',
    creating:                  'Creating…',
    delete_pool_modal_title:   'Delete pool?',
    delete_permanently:        'Delete permanently',
    failed_load_pools:         'Failed to load pools. Please refresh.',
    failed_create_pool:        'Failed to create pool. Try again.',
    failed_delete:             'Failed to delete. Try again.',
    please_enter_title:        'Please enter a pool title.',
    player_count_helper:       (n, lo, hi) => `With ${n} players, each gets ${lo === hi ? lo : `${lo}–${hi}`} teams`,
    delete_pool_confirm:       title => `This will permanently delete <strong>${escHtml(title)}</strong> and all its data.`,
    // Pool grid
    no_pools_title:            'No pools yet',
    no_pools_desc:             'Create your first pool to get started!',
    pool_limit_msg:            "You've reached the 10 pool limit.",
    // Pool card
    badge_allocated:           '✅ Allocated',
    badge_locked:              '🔒 Locked',
    players:                   n => `${n} players`,
    // Viewer
    pool_not_found:            'Pool not found',
    go_home:                   '← Go home',
    allocation_locked:         '🔒 Allocation locked',
    teams_still_in:            n => `⚽ <strong>${n}</strong> teams still in`,
    teams_eliminated:          n => `❌ <strong>${n}</strong> eliminated`,
    // Admin
    access_denied:             'Access denied',
    not_owner:                 'You are not the owner of this pool.',
    pool_not_found_error:      'Pool not found.',
    admin_panel_label:         'Admin Panel',
    change:                    '· change',
    save:                      'Save',
    share_viewer_link:         '📋 Share viewer link',
    copy_whatsapp:             '📋 Copy for WhatsApp',
    // Participants
    participants:              'Participants',
    name_placeholder:          'Name',
    extra_team:                'Extra team',
    add:                       'Add',
    extra_team_hint:           'Mark "Extra team" to flag a participant as priority for an extra team when totals don\'t divide evenly.',
    participant_over_limit:    (n, max) => `⚠️ ${n} / ${max} — please remove ${n - max} participant(s)`,
    participant_count:         (n, max) => `${n} / ${max} participants added`,
    must_be_2_12:              'Must be 2–12.',
    save_failed:               'Save failed.',
    failed_add_participant:    'Failed to add participant.',
    failed_remove_participant: 'Failed to remove participant.',
    extra_badge:               '+extra',
    extra_inline:              'Extra',
    // Allocation
    elimination_tracker:       '⚽ Elimination Tracker',
    allocation_heading:        'Allocation',
    allocate_teams:            '🎲 Allocate Teams',
    unlock_allocation:         '🔓 Unlock Allocation',
    lock_allocation:           '🔒 Lock Allocation',
    clear:                     'Clear',
    allocation_is_locked:      '🔒 Allocation is locked.',
    allocation_assigned:       'Allocation assigned.',
    no_allocation_yet:         'No allocation yet.',
    allocation_unlocked:       'Allocation unlocked.',
    whatsapp_export:           'WhatsApp Export',
    copy_to_clipboard:         '📋 Copy to clipboard',
    danger_zone:               'Danger Zone',
    delete_this_pool:          '🗑 Delete this pool',
    admin_delete_confirm:      title => `This will permanently delete <strong>${escHtml(title)}</strong> and all its data.`,
    // Elim tracker
    tier_1:                    '⭐ Tier 1 — Favorites',
    tier_2:                    '🔵 Tier 2 — Contenders',
    tier_3:                    '🟢 Tier 3 — Underdogs',
    tier_4:                    '⚪ Tier 4 — Wildcards',
    sync_scores:               '🔄 Sync Scores',
    syncing:                   'Syncing…',
    suggested_eliminations:    '📊 Suggested eliminations based on live scores:',
    could_not_fetch:           'Could not fetch scores',
    // Alloc cards
    no_alloc_hint:             'No allocation yet.',
    teams_count:               n => `${n} teams`,
    status_all_alive:          n => `✅ ${n} alive`,
    status_mixed:              (a, e) => `✅ ${a} alive · ❌ ${e} eliminated`,
    // Confirms / errors
    confirm_realloc:           'This will re-randomize the current allocation. Are you sure?',
    confirm_unlock:            'Unlock the allocation?',
    confirm_clear:             'Clear the current allocation?',
    failed_save_allocation:    'Failed to save allocation.',
    failed_save:               'Failed to save.',
    failed_clear_allocation:   'Failed to clear allocation.',
    failed_delete_pool:        'Failed to delete pool.',
    failed_update:             'Failed to update.',
    copied:                    '✅ Copied!',
    // Share
    share_copy:                'Share',
    share_copied:              '✅ Link copied!',
    // Elimination banner
    elimination_banner:        '⚠️ {teams} were eliminated from your pool',
    elimination_banner_dismiss: 'Dismiss',
    // Saved pools
    pool_save:                 '📌 Save',
    pool_saved:                '✅ Saved',
    saved_pools_section:       'Saved Pools',
    saved_pools_empty:         'Save pools from friends to see them here',
    unpin:                     'Unpin',
    // PWA
    pwa_install_prompt:        'Add WCPool to your home screen',
    pwa_install_cta:           'Install',
    pwa_install_ios:           'Tap the share icon then "Add to Home Screen"',
    pwa_dismiss:               'Maybe later',
    // Live viewer
    live_indicator:            'Live',
    last_updated:              'Updated just now',
    // Auth modal
    auth_modal_title:          'Sign in to save',
    auth_modal_subtitle:       'Save this pool to your dashboard',
    auth_google:               'Continue with Google',
    auth_or_divider:           '— or —',
    auth_email_placeholder:    'Email address',
    auth_magic_link_btn:       'Send magic link',
    auth_check_email:          '✉️ Check your inbox!',
    auth_check_email_sub:      'We sent a link to {email}',
    // Today's Matches / Upcoming Matches
    todaysMatches:             "Today's Matches",
    upcoming_matches:          'Upcoming Matches',
    noMatchesToday:            'No upcoming matches',
    today_badge:               time => `Today ${time}`,
    match_today:               time => `Today ${time}`,
    match_tomorrow:            time => `Tomorrow ${time}`,
    liveNow:                   '🔴 Live',
    scheduled:                 'Scheduled',
    finished:                  'Finished',
  },
  'es-MX': {
    landing_subtitle:          'Crea y gestiona tu quiniela del Mundial 2026',
    sign_in_google:            'Iniciar sesión con Google',
    my_pools_back:             'Mis Quinielas',
    view:                      '👁 Ver',
    admin:                     '⚙ Admin',
    sign_out:                  'Cerrar sesión',
    my_pools:                  'Mis Quinielas',
    create_new_pool:           '＋ Nueva Quiniela',
    loading_pools:             'Cargando quinielas…',
    new_pool_title:            'Nueva Quiniela',
    pool_title_label:          'Nombre',
    default_pool_title:        'Mi Quiniela WC2026',
    participants_label:        'Participantes',
    team_set_label:            'Set de equipos',
    team_set_value:            'Copa Mundial FIFA 2026 — 48 equipos, 4 categorías',
    cancel:                    'Cancelar',
    create_pool:               'Crear Quiniela',
    creating:                  'Creando…',
    delete_pool_modal_title:   '¿Eliminar quiniela?',
    delete_permanently:        'Eliminar permanentemente',
    failed_load_pools:         'Error al cargar las quinielas. Recarga la página.',
    failed_create_pool:        'Error al crear la quiniela. Inténtalo de nuevo.',
    failed_delete:             'Error al eliminar. Inténtalo de nuevo.',
    please_enter_title:        'Por favor escribe un nombre para la quiniela.',
    player_count_helper:       (n, lo, hi) => `Con ${n} jugadores, cada uno recibe ${lo === hi ? lo : `${lo}–${hi}`} equipos`,
    delete_pool_confirm:       title => `Esto eliminará permanentemente <strong>${escHtml(title)}</strong> y todos sus datos.`,
    no_pools_title:            'Sin quinielas',
    no_pools_desc:             '¡Crea tu primera quiniela para comenzar!',
    pool_limit_msg:            'Alcanzaste el límite de 10 quinielas.',
    badge_allocated:           '✅ Asignada',
    badge_locked:              '🔒 Bloqueada',
    players:                   n => `${n} jugadores`,
    pool_not_found:            'Quiniela no encontrada',
    go_home:                   '← Inicio',
    allocation_locked:         '🔒 Asignación bloqueada',
    teams_still_in:            n => `⚽ <strong>${n}</strong> equipos en competencia`,
    teams_eliminated:          n => `❌ <strong>${n}</strong> eliminados`,
    access_denied:             'Acceso denegado',
    not_owner:                 'No eres el dueño de esta quiniela.',
    pool_not_found_error:      'Quiniela no encontrada.',
    admin_panel_label:         'Panel de Admin',
    change:                    '· cambiar',
    save:                      'Guardar',
    share_viewer_link:         '📋 Compartir enlace',
    copy_whatsapp:             '📋 Copiar para WhatsApp',
    participants:              'Participantes',
    name_placeholder:          'Nombre',
    extra_team:                'Equipo extra',
    add:                       'Agregar',
    extra_team_hint:           'Marca "Equipo extra" para priorizar a un participante cuando los totales no dividan de forma exacta.',
    participant_over_limit:    (n, max) => `⚠️ ${n} / ${max} — elimina ${n - max} participante(s)`,
    participant_count:         (n, max) => `${n} / ${max} participantes agregados`,
    must_be_2_12:              'Debe ser entre 2 y 12.',
    save_failed:               'Error al guardar.',
    failed_add_participant:    'Error al agregar participante.',
    failed_remove_participant: 'Error al eliminar participante.',
    extra_badge:               '+extra',
    extra_inline:              'Extra',
    elimination_tracker:       '⚽ Rastreador de Eliminaciones',
    allocation_heading:        'Asignación',
    allocate_teams:            '🎲 Asignar Equipos',
    unlock_allocation:         '🔓 Desbloquear Asignación',
    lock_allocation:           '🔒 Bloquear Asignación',
    clear:                     'Limpiar',
    allocation_is_locked:      '🔒 La asignación está bloqueada.',
    allocation_assigned:       'Asignación realizada.',
    no_allocation_yet:         'Sin asignación todavía.',
    allocation_unlocked:       'Asignación desbloqueada.',
    whatsapp_export:           'Exportar a WhatsApp',
    copy_to_clipboard:         '📋 Copiar al portapapeles',
    danger_zone:               'Zona de Peligro',
    delete_this_pool:          '🗑 Eliminar esta quiniela',
    admin_delete_confirm:      title => `Esto eliminará permanentemente <strong>${escHtml(title)}</strong> y todos sus datos.`,
    tier_1:                    '⭐ Tier 1 — Favoritos',
    tier_2:                    '🔵 Tier 2 — Contendientes',
    tier_3:                    '🟢 Tier 3 — Intermedios',
    tier_4:                    '⚪ Tier 4 — Sorpresas',
    sync_scores:               '🔄 Sincronizar Marcadores',
    syncing:                   'Sincronizando…',
    suggested_eliminations:    '📊 Eliminaciones sugeridas según marcadores en vivo:',
    could_not_fetch:           'No se pudieron obtener los marcadores',
    no_alloc_hint:             'Sin asignación todavía.',
    teams_count:               n => `${n} equipos`,
    status_all_alive:          n => `✅ ${n} vivos`,
    status_mixed:              (a, e) => `✅ ${a} vivos · ❌ ${e} eliminados`,
    confirm_realloc:           '¿Reasignar equipos aleatoriamente? Se reemplazará la asignación actual.',
    confirm_unlock:            '¿Desbloquear la asignación?',
    confirm_clear:             '¿Limpiar la asignación actual?',
    failed_save_allocation:    'Error al guardar la asignación.',
    failed_save:               'Error al guardar.',
    failed_clear_allocation:   'Error al limpiar la asignación.',
    failed_delete_pool:        'Error al eliminar la quiniela.',
    failed_update:             'Error al actualizar.',
    copied:                    '✅ ¡Copiado!',
    // Share
    share_copy:                'Compartir',
    share_copied:              '✅ ¡Link copiado!',
    // Elimination banner
    elimination_banner:        '⚠️ {teams} fueron eliminados de tu quiniela',
    elimination_banner_dismiss: 'Cerrar',
    // Saved pools
    pool_save:                 '📌 Guardar',
    pool_saved:                '✅ Guardada',
    saved_pools_section:       'Quinielas Guardadas',
    saved_pools_empty:         'Guarda quinielas de amigos para verlas aquí',
    unpin:                     'Quitar',
    // PWA
    pwa_install_prompt:        'Agrega WCPool a tu pantalla de inicio',
    pwa_install_cta:           'Instalar',
    pwa_install_ios:           'Toca el ícono compartir y luego "Añadir a pantalla de inicio"',
    pwa_dismiss:               'Quizás después',
    // Live viewer
    live_indicator:            'En vivo',
    last_updated:              'Actualizado ahora',
    // Auth modal
    auth_modal_title:          'Inicia sesión para guardar',
    auth_modal_subtitle:       'Guarda esta quiniela en tu tablero',
    auth_google:               'Continuar con Google',
    auth_or_divider:           '— o —',
    auth_email_placeholder:    'Correo electrónico',
    auth_magic_link_btn:       'Enviar link mágico',
    auth_check_email:          '✉️ ¡Revisa tu correo!',
    auth_check_email_sub:      'Enviamos un link a {email}',
    // Today's Matches / Upcoming Matches
    todaysMatches:             'Partidos de Hoy',
    upcoming_matches:          'Próximos partidos',
    noMatchesToday:            'Sin próximos partidos',
    today_badge:               time => `Hoy ${time}`,
    match_today:               time => `Hoy ${time}`,
    match_tomorrow:            time => `Mañana ${time}`,
    liveNow:                   '🔴 En vivo',
    scheduled:                 'Programado',
    finished:                  'Finalizado',
  },
  'pt-PT': {
    landing_subtitle:          'Crie e gerencie o seu bolão da Copa do Mundo 2026',
    sign_in_google:            'Entrar com Google',
    my_pools_back:             'Meus Bolões',
    view:                      '👁 Ver',
    admin:                     '⚙ Admin',
    sign_out:                  'Sair',
    my_pools:                  'Meus Bolões',
    create_new_pool:           '＋ Criar Novo Bolão',
    loading_pools:             'Carregando bolões…',
    new_pool_title:            'Novo Bolão',
    pool_title_label:          'Nome do bolão',
    default_pool_title:        'Meu Bolão WC2026',
    participants_label:        'Participantes',
    team_set_label:            'Conjunto de seleções',
    team_set_value:            'Copa do Mundo FIFA 2026 — 48 seleções, 4 níveis',
    cancel:                    'Cancelar',
    create_pool:               'Criar Bolão',
    creating:                  'Criando…',
    delete_pool_modal_title:   'Eliminar bolão?',
    delete_permanently:        'Eliminar permanentemente',
    failed_load_pools:         'Falha ao carregar bolões. Por favor recarregue.',
    failed_create_pool:        'Falha ao criar bolão. Tente novamente.',
    failed_delete:             'Falha ao eliminar. Tente novamente.',
    please_enter_title:        'Por favor insira um nome para o bolão.',
    player_count_helper:       (n, lo, hi) => `Com ${n} jogadores, cada um recebe ${lo === hi ? lo : `${lo}–${hi}`} seleções`,
    delete_pool_confirm:       title => `Isto vai eliminar permanentemente <strong>${escHtml(title)}</strong> e todos os seus dados.`,
    no_pools_title:            'Sem bolões',
    no_pools_desc:             'Crie o seu primeiro bolão para começar!',
    pool_limit_msg:            'Atingiu o limite de 10 bolões.',
    badge_allocated:           '✅ Alocado',
    badge_locked:              '🔒 Bloqueado',
    players:                   n => `${n} jogadores`,
    pool_not_found:            'Bolão não encontrado',
    go_home:                   '← Início',
    allocation_locked:         '🔒 Alocação bloqueada',
    teams_still_in:            n => `⚽ <strong>${n}</strong> seleções em campo`,
    teams_eliminated:          n => `❌ <strong>${n}</strong> eliminadas`,
    access_denied:             'Acesso negado',
    not_owner:                 'Você não é o dono deste bolão.',
    pool_not_found_error:      'Bolão não encontrado.',
    admin_panel_label:         'Painel de Admin',
    change:                    '· alterar',
    save:                      'Guardar',
    share_viewer_link:         '📋 Partilhar link',
    copy_whatsapp:             '📋 Copiar para WhatsApp',
    participants:              'Participantes',
    name_placeholder:          'Nome',
    extra_team:                'Seleção extra',
    add:                       'Adicionar',
    extra_team_hint:           'Marque "Seleção extra" para dar prioridade a um participante na distribuição quando o total não divide igualmente.',
    participant_over_limit:    (n, max) => `⚠️ ${n} / ${max} — remova ${n - max} participante(s)`,
    participant_count:         (n, max) => `${n} / ${max} participantes adicionados`,
    must_be_2_12:              'Deve ser entre 2 e 12.',
    save_failed:               'Falha ao guardar.',
    failed_add_participant:    'Falha ao adicionar participante.',
    failed_remove_participant: 'Falha ao remover participante.',
    extra_badge:               '+extra',
    extra_inline:              'Extra',
    elimination_tracker:       '⚽ Rastreador de Eliminações',
    allocation_heading:        'Alocação',
    allocate_teams:            '🎲 Alocar Seleções',
    unlock_allocation:         '🔓 Desbloquear Alocação',
    lock_allocation:           '🔒 Bloquear Alocação',
    clear:                     'Limpar',
    allocation_is_locked:      '🔒 Alocação bloqueada.',
    allocation_assigned:       'Alocação realizada.',
    no_allocation_yet:         'Sem alocação ainda.',
    allocation_unlocked:       'Alocação desbloqueada.',
    whatsapp_export:           'Exportar para WhatsApp',
    copy_to_clipboard:         '📋 Copiar para área de transferência',
    danger_zone:               'Zona de Perigo',
    delete_this_pool:          '🗑 Eliminar este bolão',
    admin_delete_confirm:      title => `Isto vai eliminar permanentemente <strong>${escHtml(title)}</strong> e todos os seus dados.`,
    tier_1:                    '⭐ Nível 1 — Favoritos',
    tier_2:                    '🔵 Nível 2 — Candidatos',
    tier_3:                    '🟢 Nível 3 — Intermediários',
    tier_4:                    '⚪ Nível 4 — Surpresas',
    sync_scores:               '🔄 Sincronizar Resultados',
    syncing:                   'Sincronizando…',
    suggested_eliminations:    '📊 Eliminações sugeridas com base em resultados em tempo real:',
    could_not_fetch:           'Não foi possível obter os resultados',
    no_alloc_hint:             'Sem alocação ainda.',
    teams_count:               n => `${n} seleções`,
    status_all_alive:          n => `✅ ${n} em campo`,
    status_mixed:              (a, e) => `✅ ${a} em campo · ❌ ${e} eliminadas`,
    confirm_realloc:           'Isto vai re-randomizar a alocação atual. Tem a certeza?',
    confirm_unlock:            'Desbloquear a alocação?',
    confirm_clear:             'Limpar a alocação atual?',
    failed_save_allocation:    'Falha ao guardar a alocação.',
    failed_save:               'Falha ao guardar.',
    failed_clear_allocation:   'Falha ao limpar a alocação.',
    failed_delete_pool:        'Falha ao eliminar o bolão.',
    failed_update:             'Falha ao atualizar.',
    copied:                    '✅ Copiado!',
    // Share
    share_copy:                'Compartilhar',
    share_copied:              '✅ Link copiado!',
    // Elimination banner
    elimination_banner:        '⚠️ {teams} foram eliminados do seu bolão',
    elimination_banner_dismiss: 'Fechar',
    // Saved pools
    pool_save:                 '📌 Guardar',
    pool_saved:                '✅ Guardada',
    saved_pools_section:       'Bolões Guardados',
    saved_pools_empty:         'Guarda bolões de amigos para vê-los aqui',
    unpin:                     'Remover',
    // PWA
    pwa_install_prompt:        'Adiciona WCPool ao ecrã inicial',
    pwa_install_cta:           'Instalar',
    pwa_install_ios:           'Toca o ícone de partilha e depois "Adicionar ao ecrã"',
    pwa_dismiss:               'Talvez depois',
    // Live viewer
    live_indicator:            'Ao vivo',
    last_updated:              'Atualizado agora',
    // Auth modal
    auth_modal_title:          'Entra para guardar',
    auth_modal_subtitle:       'Guarda este bolão no teu painel',
    auth_google:               'Continuar com Google',
    auth_or_divider:           '— ou —',
    auth_email_placeholder:    'Endereço de email',
    auth_magic_link_btn:       'Enviar link mágico',
    auth_check_email:          '✉️ Verifique o seu email!',
    auth_check_email_sub:      'Enviámos um link para {email}',
    // Today's Matches / Upcoming Matches
    todaysMatches:             'Jogos de Hoje',
    upcoming_matches:          'Próximos jogos',
    noMatchesToday:            'Sem próximos jogos',
    today_badge:               time => `Hoje ${time}`,
    match_today:               time => `Hoje ${time}`,
    match_tomorrow:            time => `Amanhã ${time}`,
    liveNow:                   '🔴 Ao vivo',
    scheduled:                 'Agendado',
    finished:                  'Terminado',
  },
};

const LOCALES = ['en-US', 'es-MX', 'pt-PT'];
const LOCALE_LABELS = { 'en-US': 'EN', 'es-MX': 'ES', 'pt-PT': 'PT' };

let currentLocale = (() => {
  const saved = localStorage.getItem('wcpool_locale');
  if (saved && LOCALES.includes(saved)) return saved;
  const lang = navigator.language || '';
  if (lang.startsWith('pt')) return 'pt-PT';
  if (lang.startsWith('es')) return 'es-MX';
  return 'en-US';
})();

function t(key, ...args) {
  const val = TRANSLATIONS[currentLocale]?.[key] ?? TRANSLATIONS['en-US']?.[key];
  return typeof val === 'function' ? val(...args) : (val ?? key);
}

function setLocale(locale) {
  if (!LOCALES.includes(locale)) return;
  currentLocale = locale;
  localStorage.setItem('wcpool_locale', locale);
  document.documentElement.lang = locale;
  router();
}

function localTeamName(nameEs) {
  const map = TEAM_NAMES_I18N[currentLocale];
  return (map && map[nameEs]) ? map[nameEs] : nameEs;
}

function localeSwitcherHTML() {
  return `<div class="locale-switcher">${LOCALES.map(l =>
    `<button class="locale-btn${l === currentLocale ? ' active' : ''}" data-locale="${l}">${LOCALE_LABELS[l]}</button>`
  ).join('')}</div>`;
}

function bindLocaleSwitcher(container) {
  container.querySelectorAll('.locale-btn').forEach(btn => {
    btn.addEventListener('click', () => setLocale(btn.dataset.locale));
  });
}

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
    btn.textContent = t('copied');
    setTimeout(() => { btn.textContent = orig; }, 2000);
  } catch { /* silent */ }
}

async function sharePool(poolId, poolTitle) {
  const url = `${window.location.origin}${window.location.pathname}#/pool/${poolId}`;
  const shareData = { title: poolTitle || 'WCPool', url };
  if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
    try { await navigator.share(shareData); return; }
    catch (err) { if (err.name === 'AbortError') return; }
  }
  try {
    await navigator.clipboard.writeText(url);
    showShareTooltip();
  } catch {
    prompt(t('share_copy'), url);
  }
}

function showShareTooltip() {
  const tooltip = document.getElementById('share-tooltip');
  if (!tooltip) return;
  tooltip.textContent = t('share_copied');
  tooltip.classList.add('share-tooltip--visible');
  setTimeout(() => tooltip.classList.remove('share-tooltip--visible'), 2000);
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
  const tierBase        = Math.floor(12 / N);
  const globalBase      = Math.floor(48 / N);
  const extras          = 48 % N;
  const extraBaseRounds = globalBase - 4 * tierBase;

  const result = {};
  for (const p of participants) result[p.id] = [];

  const tierPools = {};
  for (let tier = 1; tier <= 4; tier++) {
    tierPools[tier] = shuffle(TEAMS.filter(t => t.tier === tier));
  }

  const baseOrder = shuffle(participants.map(p => p.id));
  for (let tier = 1; tier <= 4; tier++) {
    const pool = tierPools[tier];
    let idx = 0;
    for (let round = 0; round < tierBase; round++) {
      for (const pid of baseOrder) result[pid].push(pool[idx++]);
    }
  }

  const leftover = [];
  for (let tier = 1; tier <= 4; tier++) {
    for (let i = tierBase * N; i < 12; i++) leftover.push(tierPools[tier][i]);
  }
  shuffle(leftover);

  let li = 0;

  const extraOrder = shuffle(participants.map(p => p.id));
  for (let round = 0; round < extraBaseRounds; round++) {
    for (const pid of extraOrder) result[pid].push(leftover[li++]);
  }

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
    const extrasLine = TIERS.flatMap(tier => byTier[tier].slice(1).map(t => `${TIER_ICON[tier]} ${t}`));
    if (extrasLine.length) lines.push(extrasLine.join(' · '));
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

async function persistPool(pool) {
  const { error } = await db.from('pools')
    .upsert({ ...pool, updated_at: new Date().toISOString() }, { onConflict: 'id' });
  if (error) throw error;
}

// ── Saved pools (pin) ──────────────────────────────────────────────
async function getSavedPools(userId) {
  const { data, error } = await db
    .from('saved_pools')
    .select('pool_id, saved_at, pools(*)')
    .eq('user_id', userId);
  if (error) throw error;
  return data || [];
}

async function savePool(userId, poolId) {
  const { error } = await db
    .from('saved_pools')
    .upsert({ user_id: userId, pool_id: poolId }, { onConflict: 'user_id,pool_id' });
  if (error) throw error;
  await maybeShowPwaPrompt();
}

async function unsavePool(userId, poolId) {
  const { error } = await db
    .from('saved_pools')
    .delete()
    .eq('user_id', userId)
    .eq('pool_id', poolId);
  if (error) throw error;
}

async function isPoolSaved(userId, poolId) {
  const { data, error } = await db
    .from('saved_pools')
    .select('pool_id')
    .eq('user_id', userId)
    .eq('pool_id', poolId)
    .maybeSingle();
  if (error) throw error;
  return !!data;
}

// ── PWA install prompt ─────────────────────────────────────────────
function isIosSafari() {
  const ua = navigator.userAgent;
  const isIos    = /iphone|ipad|ipod/i.test(ua);
  const isSafari = /safari/i.test(ua) && !/crios|fxios|opios|edgios/i.test(ua);
  return isIos && isSafari;
}

function isInStandaloneMode() {
  return window.matchMedia('(display-mode: standalone)').matches
    || window.navigator.standalone === true;
}

async function maybeShowPwaPrompt() {
  if (isInStandaloneMode()) return;
  if (sessionStorage.getItem('pwa-prompt-dismissed')) return;
  await new Promise(r => setTimeout(r, 1500));
  if (deferredInstallPrompt) {
    showPwaBanner('android');
  } else if (isIosSafari()) {
    showPwaBanner('ios');
  }
}

function showPwaBanner(type) {
  if (document.getElementById('pwa-banner')) return;
  const banner = document.createElement('div');
  banner.id        = 'pwa-banner';
  banner.className = 'pwa-banner';
  banner.setAttribute('role', 'complementary');
  banner.setAttribute('aria-label', t('pwa_install_prompt'));
  if (type === 'ios') {
    banner.innerHTML = `
      <span class="pwa-banner__text">${escHtml(t('pwa_install_ios'))}</span>
      <button class="pwa-banner__dismiss btn btn-sm btn-ghost"
              aria-label="${escHtml(t('pwa_dismiss'))}">${escHtml(t('pwa_dismiss'))}</button>`;
  } else {
    banner.innerHTML = `
      <span class="pwa-banner__text">${escHtml(t('pwa_install_prompt'))}</span>
      <div class="pwa-banner__actions">
        <button class="pwa-banner__install btn btn-sm btn-primary">${escHtml(t('pwa_install_cta'))}</button>
        <button class="pwa-banner__dismiss btn btn-sm btn-ghost"
                aria-label="${escHtml(t('pwa_dismiss'))}">${escHtml(t('pwa_dismiss'))}</button>
      </div>`;
    banner.querySelector('.pwa-banner__install').addEventListener('click', async () => {
      if (!deferredInstallPrompt) return;
      deferredInstallPrompt.prompt();
      const { outcome } = await deferredInstallPrompt.userChoice;
      deferredInstallPrompt = null;
      banner.remove();
      if (outcome === 'accepted') sessionStorage.setItem('pwa-prompt-dismissed', '1');
    });
  }
  banner.querySelector('.pwa-banner__dismiss').addEventListener('click', () => {
    sessionStorage.setItem('pwa-prompt-dismissed', '1');
    banner.classList.add('pwa-banner--dismissed');
    setTimeout(() => banner.remove(), 300);
  });
  document.body.appendChild(banner);
}

// ── Shared auth form (modal + landing) ────────────────────────────
function renderAuthForm(container) {
  const stateA = document.createElement('div');
  stateA.setAttribute('data-auth-state', 'initial');
  stateA.innerHTML = `
    <button id="auth-google-btn" class="btn auth-btn-google" type="button" aria-label="${escHtml(t('auth_google'))}">
      ${GOOGLE_ICON}
      <span>${escHtml(t('auth_google'))}</span>
    </button>
    <div class="auth-divider" aria-hidden="true">
      <span>${escHtml(t('auth_or_divider'))}</span>
    </div>
    <form id="auth-magic-form" novalidate>
      <label for="auth-email" class="sr-only">${escHtml(t('auth_email_placeholder'))}</label>
      <input
        id="auth-email"
        type="email"
        autocomplete="email"
        inputmode="email"
        class="auth-input"
        placeholder="${escHtml(t('auth_email_placeholder'))}"
        required
      />
      <button id="auth-magic-btn" class="btn auth-btn-magic" type="submit">
        ${escHtml(t('auth_magic_link_btn'))}
      </button>
    </form>
    <p class="error-msg hidden" id="auth-error"></p>`;

  const stateB = document.createElement('div');
  stateB.className = 'auth-modal__sent';
  stateB.hidden    = true;
  stateB.innerHTML = `
    <div class="auth-sent-icon">✉️</div>
    <h3>${escHtml(t('auth_check_email'))}</h3>
    <p id="auth-sent-detail" class="auth-sent-detail"></p>`;

  container.appendChild(stateA);
  container.appendChild(stateB);

  stateA.querySelector('#auth-google-btn').addEventListener('click', async () => {
    const btn = stateA.querySelector('#auth-google-btn');
    btn.disabled = true;
    btn.setAttribute('aria-busy', 'true');
    const { error } = await db.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.href },
    });
    if (error) {
      btn.disabled = false;
      btn.removeAttribute('aria-busy');
      showAuthError(error.message);
    }
  });

  stateA.querySelector('#auth-magic-form').addEventListener('submit', async e => {
    e.preventDefault();
    const emailInput = stateA.querySelector('#auth-email');
    const btn        = stateA.querySelector('#auth-magic-btn');
    const email      = emailInput.value.trim();
    if (!email || !emailInput.checkValidity()) { emailInput.focus(); return; }
    btn.disabled = true;
    const { error } = await db.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.href },
    });
    if (error) {
      btn.disabled = false;
      showAuthError(error.message);
      return;
    }
    stateA.hidden = true;
    stateB.hidden = false;
    stateB.querySelector('#auth-sent-detail').textContent =
      t('auth_check_email_sub').replace('{email}', email);
  });
}

function showAuthError(msg) {
  const el = document.getElementById('auth-error');
  if (!el) return;
  el.textContent = msg;
  el.classList.remove('hidden');
}

// ── Auth modal (sign in to save) ───────────────────────────────────
function showAuthModal() {
  if (document.getElementById('auth-modal')) return;

  const overlay = document.createElement('div');
  overlay.id        = 'auth-modal';
  overlay.className = 'modal';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-labelledby', 'auth-modal-title');

  const box = document.createElement('div');
  box.className = 'modal-box';
  box.innerHTML = `
    <h2 id="auth-modal-title" class="modal-title">${escHtml(t('auth_modal_title'))}</h2>
    <p style="color:var(--color-text-muted);font-size:.9rem;margin-top:-8px;margin-bottom:16px">${escHtml(t('auth_modal_subtitle'))}</p>`;
  renderAuthForm(box);
  overlay.appendChild(box);
  document.body.appendChild(overlay);
  box.querySelector('#auth-google-btn').focus();

  const close = () => { overlay.remove(); document.removeEventListener('keydown', onKey); };
  const onKey = e => { if (e.key === 'Escape') close(); };
  document.addEventListener('keydown', onKey);
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
}

// ── Live viewer helpers ────────────────────────────────────────────
function updateLastUpdatedLabel() {
  const el = document.getElementById('last-updated');
  if (!el) return;
  if (lastUpdatedInterval) { clearInterval(lastUpdatedInterval); lastUpdatedInterval = null; }
  el.style.display = 'inline';
  el.textContent   = t('last_updated');
  let secs = 0;
  lastUpdatedInterval = setInterval(() => {
    secs += 30;
    const cur = document.getElementById('last-updated');
    if (!cur) { clearInterval(lastUpdatedInterval); lastUpdatedInterval = null; return; }
    cur.textContent = secs < 60 ? t('last_updated') : `${Math.floor(secs / 60)} min ago`;
  }, 30000);
}

function pulseCard(participantName) {
  const card = document.querySelector(`[data-participant="${CSS.escape(participantName)}"]`);
  if (!card) return;
  card.classList.add('card-pulse');
  setTimeout(() => card.classList.remove('card-pulse'), 400);
}

async function fetchLiveScores() {
  const url = `${window.SUPABASE_URL}/functions/v1/wc-scores`;
  const res = await fetch(url, { headers: { apikey: window.SUPABASE_ANON_KEY } });
  if (!res.ok) return [];
  return res.json();
}

// ── Today's Matches ────────────────────────────────────────────────
async function fetchTodayMatches() {
  if (todayMatchesCache !== null) return todayMatchesCache;
  try {
    const url = `${window.SUPABASE_URL}/functions/v1/wc-scores?mode=today`;
    const res = await fetch(url, { headers: { apikey: window.SUPABASE_ANON_KEY } });
    todayMatchesCache = res.ok ? await res.json() : [];
  } catch {
    todayMatchesCache = [];
  }
  todayMatchMap = buildTodayMatchMap(todayMatchesCache);
  return todayMatchesCache;
}

function buildTodayMatchMap(matches) {
  const map = new Map();
  for (const m of matches) {
    const homeEs = EN_TO_LOCAL[m.home] || null;
    const awayEs = EN_TO_LOCAL[m.away] || null;
    if (homeEs) map.set(homeEs, { opponentEs: awayEs, utcDate: m.utcDate, status: m.status });
    if (awayEs) map.set(awayEs, { opponentEs: homeEs, utcDate: m.utcDate, status: m.status });
  }
  return map;
}

function formatMatchTime(utcDateStr) {
  if (!utcDateStr) return '';
  try {
    return new Date(utcDateStr).toLocaleTimeString(currentLocale, { hour: '2-digit', minute: '2-digit' });
  } catch { return ''; }
}

function getMatchDisplayTiming(utcDateStr) {
  if (!utcDateStr) return { dayBucket: 'future', label: '' };
  try {
    const matchDate = new Date(utcDateStr);
    if (isNaN(matchDate)) return { dayBucket: 'future', label: '' };
    const now = new Date();
    const todayStart    = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const dayAfterStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2);
    const timeStr = matchDate.toLocaleTimeString(currentLocale, { hour: '2-digit', minute: '2-digit' });
    if (matchDate >= todayStart && matchDate < tomorrowStart) {
      return { dayBucket: 'today', label: t('match_today', timeStr) };
    }
    if (matchDate >= tomorrowStart && matchDate < dayAfterStart) {
      return { dayBucket: 'tomorrow', label: t('match_tomorrow', timeStr) };
    }
    const dayStr = matchDate.toLocaleDateString(currentLocale, { weekday: 'short' });
    return { dayBucket: 'future', label: `${dayStr} ${timeStr}` };
  } catch { return { dayBucket: 'future', label: '' }; }
}

function getTeamOwner(teamNameEs, pool) {
  if (!pool?.allocation || !pool?.participants) return null;
  for (const p of pool.participants) {
    const teams = pool.allocation[p.id] || [];
    if (teams.some(tm => tm.name === teamNameEs)) return p.name;
  }
  return null;
}

function renderTodayMatchesStrip(matches, pool = null) {
  const wrap = document.getElementById('today-matches-wrap');
  if (!wrap) return;
  if (!Array.isArray(matches) || !matches.length) {
    wrap.innerHTML = `<p class="today-matches-empty">${t('noMatchesToday')}</p>`;
    return;
  }
  const cards = matches.map(m => {
    const homeEs = EN_TO_LOCAL[m.home] || m.home;
    const awayEs = EN_TO_LOCAL[m.away] || m.away;
    const homeTeam    = TEAMS.find(tm => tm.name === homeEs);
    const awayTeam    = TEAMS.find(tm => tm.name === awayEs);
    const homeDisplay = escHtml(homeTeam ? localTeamName(homeTeam.name) : m.home);
    const awayDisplay = escHtml(awayTeam ? localTeamName(awayTeam.name) : m.away);
    const homeFlag    = homeTeam?.flag ?? '';
    const awayFlag    = awayTeam?.flag ?? '';
    const isLive      = m.status === 'IN_PLAY' || m.status === 'PAUSED';
    const isFinished  = m.status === 'FINISHED';
    const hasScore    = m.homeScore != null && m.awayScore != null;
    const timing      = (!isLive && !isFinished) ? getMatchDisplayTiming(m.utcDate) : null;
    const homeOwner   = getTeamOwner(homeEs, pool);
    const awayOwner   = getTeamOwner(awayEs, pool);
    const homeWins    = isFinished && hasScore && m.homeScore > m.awayScore;
    const awayWins    = isFinished && hasScore && m.awayScore > m.homeScore;
    const starIcon    = '<span class="match-winner-icon" aria-hidden="true">⭐</span>';
    let centerHtml;
    if ((isLive || isFinished) && hasScore) {
      const scoreHtml   = `<span class="match-score">${m.homeScore} – ${m.awayScore}</span>`;
      const elapsedText = escHtml(m.elapsed ?? (isFinished ? 'FT' : ''));
      const elapsedHtml = isLive
        ? `<span class="match-elapsed"><span class="live-dot"></span> ${elapsedText}'</span>`
        : `<span class="match-elapsed match-elapsed--ft">${elapsedText}</span>`;
      centerHtml = scoreHtml + elapsedHtml;
    } else {
      centerHtml = `<span class="today-match-vs">vs</span>`
        + (timing?.label ? `<span class="today-match-time">${escHtml(timing.label)}</span>` : '');
    }
    const cardMod    = isLive ? ' match-card--live' : isFinished ? ' match-card--finished' : '';
    const homeSideMod = homeWins ? ' match-side--winner' : awayWins ? ' match-side--loser' : '';
    const awaySideMod = awayWins ? ' match-side--winner' : homeWins ? ' match-side--loser' : '';
    return `<div class="today-match-card${cardMod}">
      <div class="today-match-side today-match-side--home${homeSideMod}${homeOwner ? '' : ' today-match-side--unowned'}">
        <span class="today-match-player">${escHtml(homeOwner ?? '—')}</span>
        <span class="today-match-team">${escHtml(homeFlag)} ${homeDisplay}${homeWins ? starIcon : ''}</span>
      </div>
      <div class="today-match-center">
        ${centerHtml}
      </div>
      <div class="today-match-side today-match-side--away${awaySideMod}${awayOwner ? '' : ' today-match-side--unowned'}">
        <span class="today-match-player">${escHtml(awayOwner ?? '—')}</span>
        <span class="today-match-team">${escHtml(awayFlag)} ${awayDisplay}${awayWins ? starIcon : ''}</span>
      </div>
    </div>`;
  }).join('');
  wrap.innerHTML = `
    <div class="today-matches-strip">
      <span class="today-matches-label">${escHtml(t('upcoming_matches'))}</span>
      <div class="today-matches-scroll">${cards}</div>
    </div>`;
  // Trigger winner shimmer + icon animation when each winning side enters viewport
  const winnerSides = wrap.querySelectorAll('.match-side--winner');
  if (winnerSides.length) {
    const animate = (el) => el.classList.add('match-side--winner-animate');
    if (window.IntersectionObserver) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach(e => { if (e.isIntersecting) { animate(e.target); io.unobserve(e.target); } });
      }, { threshold: 0.5 });
      winnerSides.forEach(el => io.observe(el));
    } else {
      winnerSides.forEach(animate);
    }
  }
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
  if (realtimeChannel)     { db.removeChannel(realtimeChannel); realtimeChannel = null; }
  if (elimSyncIntervalId)  { clearInterval(elimSyncIntervalId);  elimSyncIntervalId  = null; }
  if (lastUpdatedInterval) { clearInterval(lastUpdatedInterval); lastUpdatedInterval = null; }
}

function subscribeToPool(poolId, onUpdate, onStatus) {
  cleanupRealtime();
  realtimeChannel = db.channel(`pool-${poolId}`)
    .on('postgres_changes', {
      event: 'UPDATE', schema: 'public', table: 'pools', filter: `id=eq.${poolId}`,
    }, payload => onUpdate(payload.new))
    .subscribe(status => { if (onStatus) onStatus(status); });
}

// ── Shared: allocation cards HTML ──────────────────────────────────
function allocationCardsHTML(pool) {
  if (!pool.allocation || !(pool.participants || []).length) {
    return `<p class="hint center" style="padding:24px 0">${t('no_alloc_hint')}</p>`;
  }
  const eliminated = pool.eliminated_teams || [];
  return (pool.participants || []).map(p => {
    const teams = pool.allocation[p.id] || [];
    const alive = teams.filter(tm => !eliminated.includes(teamId(tm))).length;
    const out   = teams.length - alive;
    const aliveTeams   = teams.filter(tm => !eliminated.includes(teamId(tm)));
    const deadTeams    = teams.filter(tm =>  eliminated.includes(teamId(tm)));
    const orderedTeams = [...aliveTeams, ...deadTeams];
    const teamsHtml = orderedTeams.map(tm => {
      const isElim    = eliminated.includes(teamId(tm));
      const todayInfo = todayMatchMap?.get(tm.name);
      let todayChip   = '';
      if (todayInfo && !isElim) {
        const isLive = todayInfo.status === 'IN_PLAY' || todayInfo.status === 'PAUSED';
        const isDone = todayInfo.status === 'FINISHED';
        if (isLive) {
          todayChip = `<span class="today-chip today-chip--live">${escHtml(t('live_indicator'))}</span>`;
        } else if (!isDone) {
          const timing = getMatchDisplayTiming(todayInfo.utcDate);
          if (timing.label) todayChip = `<span class="today-chip">${escHtml(timing.label)}</span>`;
        }
      }
      return `<li class="${isElim ? 'team-eliminated' : ''}">
        <span class="tier-dot tier-${tm.tier}"></span>
        ${isElim ? '❌ ' : '✅ '}${escHtml(tm.flag)} ${escHtml(localTeamName(tm.name))}
        ${todayChip}
      </li>`;
    }).join('');
    const statusText = out === 0
      ? t('status_all_alive', alive)
      : t('status_mixed', alive, out);
    return `<div class="alloc-card" data-participant="${escHtml(p.name)}">
      <div class="alloc-card-name">
        <span class="alloc-card-name-text">${escHtml(p.name)}</span>
        <span class="alloc-card-count">${teams.length > 0 ? t('teams_count', teams.length) : '—'}</span>
      </div>
      <span class="alloc-status">${statusText}</span>
      <ul class="team-list">${teamsHtml}</ul>
    </div>`;
  }).join('');
}

// ── Logo SVG mark (hex + W) ────────────────────────────────────────
const LOGO_MARK = `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <path d="M14 2L25.26 8.5V21.5L14 28L2.74 21.5V8.5L14 2Z" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linejoin="round"/>
  <path d="M8 10L10.5 18L14 13L17.5 18L20 10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
</svg>`;

// ── Link/chain SVG (share button) ─────────────────────────────────
const LINK_ICON = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`;

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
        <span class="logo">${LOGO_MARK}<span class="logo-text">WCPool</span></span>
        <div class="header-right">
          ${localeSwitcherHTML()}
          <button class="theme-toggle" title="Toggle theme">${themeIcon()}</button>
        </div>
      </header>
      <main class="landing-main">
        <div class="landing-card">
          <div class="landing-icon"><svg width="56" height="56" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M14 2L25.26 8.5V21.5L14 28L2.74 21.5V8.5L14 2Z" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linejoin="round"/><path d="M8 10L10.5 18L14 13L17.5 18L20 10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg></div>
          <h1 class="landing-title">WCPool</h1>
          <p class="landing-subtitle">${t('landing_subtitle')}</p>
        </div>
      </main>
      <footer class="landing-footer">by NineInchTooL</footer>
    </div>
  `;
  bindLocaleSwitcher(document.getElementById('app'));
  document.querySelector('.theme-toggle').addEventListener('click', toggleTheme);
  renderAuthForm(document.querySelector('.landing-card'));
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
        <span class="logo">${LOGO_MARK}<span class="logo-text header-wordmark">WCPool</span></span>
      </div>
      <div class="header-right">
        <div class="user-info">
          ${avatar ? `<img class="user-avatar" src="${escHtml(avatar)}" alt="" />` : ''}
          <span class="user-name">${escHtml(name)}</span>
        </div>
        <button class="btn btn-sm btn-ghost" id="sign-out-btn" aria-label="${escHtml(t('sign_out'))}"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg><span class="signout-label">${t('sign_out')}</span></button>
        ${localeSwitcherHTML()}
        <button class="theme-toggle" title="Toggle theme">${themeIcon()}</button>
      </div>
    </header>
    <main class="main-content">
      <div class="page-heading">
        <h1>${t('my_pools')} <span class="count-badge" id="pool-count-badge">…</span></h1>
        <button class="btn btn-primary" id="create-pool-btn">${t('create_new_pool')}</button>
      </div>
      <div id="dashboard-content"><span class="loading-spinner-sm"></span> ${t('loading_pools')}</div>
    </main>
    <footer class="site-footer">by NineInchTooL</footer>

    <!-- Create pool modal -->
    <div id="create-modal" class="modal hidden">
      <div class="modal-box">
        <h2 class="modal-title">${t('new_pool_title')}</h2>
        <label class="field">${t('pool_title_label')}
          <input type="text" id="new-title" value="${escHtml(t('default_pool_title'))}" />
        </label>
        <label class="field">${t('participants_label')}
          <div class="modal-range-row">
            <input type="range" id="new-count" min="2" max="12" value="10" />
            <span class="modal-range-val" id="new-count-val">10</span>
          </div>
          <span class="count-helper" id="count-helper">${t('player_count_helper', 10, 4, 5)}</span>
        </label>
        <label class="field">${t('team_set_label')}
          <input type="text" value="${escHtml(t('team_set_value'))}" readonly />
        </label>
        <p class="error-msg hidden" id="create-error"></p>
        <div class="modal-actions">
          <button class="btn" id="create-cancel">${t('cancel')}</button>
          <button class="btn btn-primary" id="create-submit">${t('create_pool')}</button>
        </div>
      </div>
    </div>

    <!-- Delete confirm modal -->
    <div id="delete-modal" class="modal hidden">
      <div class="modal-box">
        <h2 class="modal-title">${t('delete_pool_modal_title')}</h2>
        <p id="delete-modal-text" style="color:var(--color-text-muted);font-size:.9rem"></p>
        <p class="error-msg hidden" id="delete-modal-err"></p>
        <div class="modal-actions">
          <button class="btn" id="delete-cancel">${t('cancel')}</button>
          <button class="btn btn-danger" id="delete-confirm">${t('delete_permanently')}</button>
        </div>
      </div>
    </div>
  `;

  bindLocaleSwitcher(document.getElementById('app'));
  document.getElementById('sign-out-btn').addEventListener('click', async () => { await db.auth.signOut(); });
  document.querySelector('.theme-toggle').addEventListener('click', toggleTheme);

  let pools = [], savedEntries = [];
  try {
    [pools, savedEntries] = await Promise.all([
      fetchUserPools(),
      getSavedPools(user.id),
    ]);
  } catch {
    document.getElementById('dashboard-content').innerHTML =
      `<p class="error-msg">${t('failed_load_pools')}</p>`;
    document.getElementById('pool-count-badge').textContent = '—';
    return;
  }

  renderPoolGrid(pools, savedEntries);
  bindDashboardModals(pools, savedEntries);
}

function renderPoolGrid(pools, savedEntries = []) {
  const MAX = 10;
  document.getElementById('pool-count-badge').textContent = `${pools.length} / ${MAX}`;

  const createBtn = document.getElementById('create-pool-btn');
  if (pools.length >= MAX) createBtn.disabled = true;

  const container = document.getElementById('dashboard-content');

  // Owned pools section
  const ownedHTML = pools.length
    ? `<div class="pool-grid">${pools.map(poolCardHTML).join('')}</div>
       ${pools.length >= MAX ? `<p class="limit-msg">${t('pool_limit_msg')}</p>` : ''}`
    : `<div class="empty-state">
         <div class="empty-state-icon">🏆</div>
         <p class="empty-state-title">${t('no_pools_title')}</p>
         <p class="empty-state-desc">${t('no_pools_desc')}</p>
       </div>`;

  // Saved pools section
  const validSaved = savedEntries.filter(e => e.pools);
  const savedHTML = validSaved.length
    ? `<div class="pool-grid">${validSaved.map(e => savedPoolCardHTML(e.pools)).join('')}</div>`
    : `<p class="hint saved-pools-empty">${t('saved_pools_empty')}</p>`;

  container.innerHTML = `
    ${ownedHTML}
    <div class="saved-pools-section">
      <h2 class="saved-pools-heading">${t('saved_pools_section')}</h2>
      ${savedHTML}
    </div>`;
}

function poolCardHTML(pool) {
  const badges = [
    pool.allocation        ? `<span class="badge badge-success">${t('badge_allocated')}</span>` : '',
    pool.allocation_locked ? `<span class="badge badge-warning">${t('badge_locked')}</span>`   : '',
  ].filter(Boolean).join('');

  return `<div class="pool-card" data-id="${escHtml(pool.id)}">
    <div class="pool-card-title">${escHtml(pool.title)}</div>
    <div class="pool-card-meta">${t('players', (pool.participants || []).length)} / ${pool.participant_count}</div>
    <div class="pool-card-badges">${badges}</div>
    <div class="pool-card-actions">
      <a href="#/pool/${pool.id}" class="btn btn-sm">${t('view')}</a>
      <a href="#/pool/${pool.id}/admin" class="btn btn-sm btn-primary">${t('admin')}</a>
      <span class="spacer"></span>
      <button class="btn-icon delete-pool-btn" data-id="${escHtml(pool.id)}" data-title="${escHtml(pool.title)}" title="Delete pool">🗑</button>
    </div>
  </div>`;
}

function savedPoolCardHTML(pool) {
  const badges = [
    pool.allocation        ? `<span class="badge badge-success">${t('badge_allocated')}</span>` : '',
    pool.allocation_locked ? `<span class="badge badge-warning">${t('badge_locked')}</span>`   : '',
  ].filter(Boolean).join('');

  return `<div class="pool-card pool-card--saved" data-id="${escHtml(pool.id)}">
    <div class="pool-card-title">📌 ${escHtml(pool.title)}</div>
    <div class="pool-card-meta">${t('players', (pool.participants || []).length)} / ${pool.participant_count}</div>
    <div class="pool-card-badges">${badges}</div>
    <div class="pool-card-actions">
      <a href="#/pool/${pool.id}" class="btn btn-sm">${t('view')}</a>
      <span class="spacer"></span>
      <button class="btn btn-sm unpin-pool-btn" data-id="${escHtml(pool.id)}" title="Unpin">${t('unpin')}</button>
    </div>
  </div>`;
}

function bindDashboardModals(pools, savedEntries = []) {
  const modal    = document.getElementById('create-modal');
  const countEl  = document.getElementById('new-count');
  const countVal = document.getElementById('new-count-val');
  const helper   = document.getElementById('count-helper');
  const errEl    = document.getElementById('create-error');

  function updateHelper(n) {
    const lo = Math.floor(48 / n), hi = Math.ceil(48 / n);
    helper.textContent = t('player_count_helper', n, lo, hi);
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
    if (!title) { errEl.textContent = t('please_enter_title'); errEl.classList.remove('hidden'); return; }
    const btn = document.getElementById('create-submit');
    btn.disabled = true; btn.innerHTML = `<span class="loading-spinner-sm"></span> ${t('creating')}`;
    try {
      const id = await createPool(title, count);
      modal.classList.add('hidden');
      navigate(`#/pool/${id}/admin`);
    } catch {
      errEl.textContent = t('failed_create_pool');
      errEl.classList.remove('hidden');
      btn.disabled = false; btn.textContent = t('create_pool');
    }
  };

  // Delete modal
  const delModal = document.getElementById('delete-modal');
  let pendingDeleteId = null;

  document.getElementById('dashboard-content').addEventListener('click', async e => {
    // Unpin button
    const unpinBtn = e.target.closest('.unpin-pool-btn');
    if (unpinBtn) {
      unpinBtn.disabled = true;
      unpinBtn.style.opacity = '0.5';
      try {
        await unsavePool(currentSession.user.id, unpinBtn.dataset.id);
        unpinBtn.closest('.pool-card--saved')?.remove();
        // Re-check if saved section is now empty
        const remaining = document.querySelectorAll('.pool-card--saved');
        if (!remaining.length) {
          const grid = document.querySelector('.saved-pools-section .pool-grid');
          if (grid) grid.outerHTML = `<p class="hint saved-pools-empty">${t('saved_pools_empty')}</p>`;
        }
      } catch {
        unpinBtn.disabled = false;
        unpinBtn.style.opacity = '';
      }
      return;
    }

    // Delete button
    const btn = e.target.closest('.delete-pool-btn');
    if (!btn) return;
    pendingDeleteId = btn.dataset.id;
    document.getElementById('delete-modal-text').innerHTML =
      t('delete_pool_confirm', btn.dataset.title);
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
      errEl2.textContent = t('failed_delete');
      errEl2.classList.remove('hidden');
    }
  };
}

// ── Elimination banner (saved-pool viewers only) ───────────────────
const CLOSE_ICON = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;

function checkEliminationsOnLoad(pool) {
  const eliminated  = pool.eliminated_teams || [];
  const dismissed   = dismissedEliminationNotices.get(pool.id) || new Set();
  const undismissed = eliminated.filter(name => !dismissed.has(name));
  if (undismissed.length) showEliminationBanner(pool.id, undismissed);
}

function showEliminationBanner(poolId, teams) {
  const existing = document.getElementById('elimination-banner');
  if (existing) existing.remove();

  const msg    = t('elimination_banner').replace('{teams}', teams.join(', '));
  const banner = document.createElement('div');
  banner.id        = 'elimination-banner';
  banner.className = 'elimination-banner';
  banner.setAttribute('role', 'alert');
  banner.innerHTML = `
    <span class="elimination-banner__message">${escHtml(msg)}</span>
    <button class="elimination-banner__dismiss btn-icon" aria-label="${escHtml(t('elimination_banner_dismiss'))}">${CLOSE_ICON}</button>`;

  banner.querySelector('.elimination-banner__dismiss').addEventListener('click', () => {
    const dismissed = dismissedEliminationNotices.get(poolId) || new Set();
    teams.forEach(name => dismissed.add(name));
    dismissedEliminationNotices.set(poolId, dismissed);
    banner.classList.add('elimination-banner--dismissed');
    setTimeout(() => banner.remove(), 300);
  });

  const viewerHeader = document.querySelector('.viewer-header');
  if (viewerHeader) viewerHeader.insertAdjacentElement('afterend', banner);
}

// ── Viewer mode ────────────────────────────────────────────────────
async function renderViewer(poolId) {
  cleanupRealtime();

  document.getElementById('app').innerHTML = `
    <header class="site-header viewer-header">
      <div class="header-left">
        <a href="#/" class="header-back">← <span class="header-back-text">${t('my_pools_back')}</span></a>
      </div>
      <div class="header-right" id="viewer-header-right">
        <div id="viewer-actions" class="viewer-actions"></div>
        ${localeSwitcherHTML()}
        <button class="theme-toggle" title="Toggle theme">${themeIcon()}</button>
      </div>
    </header>
    <div id="pool-hero-wrap"></div>
    <div id="today-matches-wrap"></div>
    <div class="main-content" id="viewer-content">
      <div class="center" style="padding:40px 0"><span class="loading-spinner"></span></div>
    </div>
    <footer class="site-footer">by NineInchTooL</footer>
  `;
  bindLocaleSwitcher(document.getElementById('app'));
  document.querySelector('.theme-toggle').addEventListener('click', toggleTheme);

  const pool = await fetchPool(poolId);
  if (!pool) {
    document.getElementById('pool-hero-wrap').innerHTML = '';
    document.getElementById('viewer-content').innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🤷</div>
        <p class="empty-state-title">${t('pool_not_found')}</p>
        <a href="#/" class="btn btn-sm" style="margin-top:8px">${t('go_home')}</a>
      </div>`;
    return;
  }

  const viewerActions = document.getElementById('viewer-actions');

  if (currentSession && pool.owner_id === currentSession.user.id) {
    viewerActions.insertAdjacentHTML('beforeend',
      `<a href="#/pool/${poolId}/admin" class="btn btn-sm btn-primary">${t('admin')}</a>`);
  } else {
    // Pin button — for logged-in non-owners AND anonymous viewers
    const pinBtn = document.createElement('button');
    pinBtn.id = 'pin-pool-btn';

    if (!currentSession) {
      // Anonymous: open auth modal on click
      pinBtn.textContent = t('pool_save');
      pinBtn.className   = 'btn btn-sm';
      pinBtn.addEventListener('click', () => showAuthModal());
    } else {
      // Logged-in non-owner: save / unsave
      let pinned = false;
      const updatePinBtn = (isPinned, disabled = false) => {
        pinBtn.textContent   = isPinned ? t('pool_saved') : t('pool_save');
        pinBtn.className     = `btn btn-sm${isPinned ? ' btn-saved' : ''}`;
        pinBtn.disabled      = disabled;
        pinBtn.style.opacity = disabled ? '0.5' : '';
      };
      try { pinned = await isPoolSaved(currentSession.user.id, poolId); } catch { /* ignore */ }
      updatePinBtn(pinned);
      pinBtn.addEventListener('click', async () => {
        updatePinBtn(pinned, true);
        try {
          if (pinned) { await unsavePool(currentSession.user.id, poolId); pinned = false; }
          else        { await savePool(currentSession.user.id, poolId);   pinned = true;  }
          updatePinBtn(pinned);
        } catch { updatePinBtn(pinned); }
      });
    }
    viewerActions.appendChild(pinBtn);
  }

  // Share button — always visible to all viewers
  const shareWrap = document.createElement('div');
  shareWrap.className = 'share-wrap';
  shareWrap.innerHTML = `
    <button id="share-btn" class="btn btn-sm btn-ghost" aria-label="${escHtml(t('share_copy'))}">
      ${LINK_ICON}<span class="share-label">${escHtml(t('share_copy'))}</span>
    </button>
    <span id="share-tooltip" class="share-tooltip" aria-live="polite"></span>`;
  viewerActions.appendChild(shareWrap);
  shareWrap.querySelector('#share-btn').addEventListener('click', () => sharePool(pool.id, pool.title));

  // Live indicator — shown only when subscription is SUBSCRIBED
  const liveEl = document.createElement('span');
  liveEl.id        = 'live-indicator';
  liveEl.className = 'live-indicator';
  liveEl.setAttribute('aria-label', 'Live updates active');
  liveEl.style.display = 'none';
  liveEl.innerHTML = `<span class="live-dot"></span><span>${escHtml(t('live_indicator'))}</span>`;
  viewerActions.appendChild(liveEl);

  renderViewerContent(pool);

  // Fetch today's matches (non-blocking) — re-render cards once data lands
  fetchTodayMatches().then(todayMatches => {
    renderTodayMatchesStrip(todayMatches, pool);
    if (todayMatches.length > 0) renderViewerContent(pool); // add badges
  });

  // Track last-known eliminations for pulse + non-owner alerts
  let lastKnownEliminated = new Set(pool.eliminated_teams || []);
  if (currentSession && pool.owner_id !== currentSession.user.id) {
    checkEliminationsOnLoad(pool);
  }

  subscribeToPool(poolId, updated => {
    if (typeof updated.allocation        === 'string') updated.allocation        = JSON.parse(updated.allocation);
    if (typeof updated.eliminated_teams  === 'string') updated.eliminated_teams  = JSON.parse(updated.eliminated_teams);
    if (typeof updated.participants      === 'string') updated.participants       = JSON.parse(updated.participants);
    renderViewerContent(updated);
    updateLastUpdatedLabel();

    const newElim = updated.eliminated_teams || [];
    const newly   = newElim.filter(name => !lastKnownEliminated.has(name));

    if (newly.length) {
      // Pulse cards for participants with newly-eliminated teams
      const allocation = (typeof updated.allocation === 'object' && updated.allocation) ? updated.allocation : {};
      for (const [participantId, teams] of Object.entries(allocation)) {
        const participant = (updated.participants || []).find(p => p.id === participantId);
        if (participant && (teams || []).some(tm => newly.includes(teamId(tm)))) {
          pulseCard(participant.name);
        }
      }
      // Elimination alerts for non-owner saved-pool viewers
      if (currentSession && pool.owner_id !== currentSession.user.id) {
        showEliminationBanner(poolId, newly);
      }
    }
    lastKnownEliminated = new Set(newElim);
  }, status => {
    const indicator = document.getElementById('live-indicator');
    if (indicator) indicator.style.display = status === 'SUBSCRIBED' ? 'inline-flex' : 'none';
  });
}

function renderViewerContent(pool) {
  const heroWrap = document.getElementById('pool-hero-wrap');
  const content  = document.getElementById('viewer-content');
  if (!heroWrap || !content) return;

  // Preserve last-updated state across re-renders
  const prevLastUpdated = document.getElementById('last-updated');
  const savedLUText     = prevLastUpdated?.textContent;
  const savedLUVisible  = prevLastUpdated?.style.display !== 'none';

  heroWrap.innerHTML = `
    <div class="pool-hero">
      <h1 class="pool-hero-title">${escHtml(pool.title)}</h1>
    </div>`;

  const lockNotice = pool.allocation_locked
    ? `<p class="lock-notice">${t('allocation_locked')}</p>` : '';

  const elim = pool.eliminated_teams || [];
  const totalAlive = 48 - elim.length;
  const bannerHTML = elim.length > 0
    ? `<div class="elim-banner">
         <span class="elim-banner-stat">
           ${t('teams_still_in', totalAlive)} ·
           ${t('teams_eliminated', elim.length)}
         </span>
       </div>`
    : '';

  content.innerHTML = lockNotice + bannerHTML
    + `<span class="last-updated" id="last-updated" style="display:none"></span>`
    + `<div class="alloc-grid">${allocationCardsHTML(pool)}</div>`;

  if (savedLUText && savedLUVisible) {
    const el = document.getElementById('last-updated');
    if (el) { el.textContent = savedLUText; el.style.display = 'inline'; }
  }
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
        <a href="#/" class="header-back">← <span class="header-back-text">${t('my_pools_back')}</span></a>
      </div>
      <div class="header-right">
        <a href="#/pool/${poolId}" class="btn btn-sm btn-ghost">${t('view')}</a>
        ${localeSwitcherHTML()}
        <button class="theme-toggle" title="Toggle theme">${themeIcon()}</button>
      </div>
    </header>
    <main class="main-content" id="admin-main">
      <div class="center" style="padding:40px 0"><span class="loading-spinner"></span></div>
    </main>
    <footer class="site-footer">by NineInchTooL</footer>
  `;
  bindLocaleSwitcher(document.getElementById('app'));
  document.querySelector('.theme-toggle').addEventListener('click', toggleTheme);

  let pool;
  try { pool = await fetchPool(poolId); } catch { pool = null; }

  const main = document.getElementById('admin-main');
  if (!pool) {
    main.innerHTML = `<p class="error-msg center" style="padding:40px 0">${t('pool_not_found_error')}</p>`; return;
  }
  if (pool.owner_id !== currentSession.user.id) {
    main.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🔒</div>
        <p class="empty-state-title">${t('access_denied')}</p>
        <p class="empty-state-desc">${t('not_owner')}</p>
        <a href="#/" class="btn btn-sm" style="margin-top:8px">${t('go_home')}</a>
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
        <span class="admin-title-label">${t('admin_panel_label')}</span>
      </div>
      <div class="participant-count-row">
        <span id="p-count-display">${t('players', pool.participant_count)}</span>
        <button class="change-link" id="change-count-btn">${t('change')}</button>
      </div>
      <div id="count-change-wrap" class="hidden row">
        <input type="number" id="count-change-input" min="2" max="12" value="${pool.participant_count}" style="width:80px" />
        <button class="btn btn-sm btn-primary" id="count-change-save">${t('save')}</button>
        <button class="btn btn-sm" id="count-change-cancel">${t('cancel')}</button>
        <span class="error-msg hidden" id="count-change-err"></span>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn btn-sm" id="copy-link-btn">${t('share_viewer_link')}</button>
        <button class="btn btn-sm" id="copy-wa-btn" ${hasAlloc ? '' : 'disabled'}>${t('copy_whatsapp')}</button>
      </div>
      <p class="error-msg hidden" id="settings-error"></p>
    </div>

    <!-- Participants -->
    <div class="card">
      <h3>${t('participants')}</h3>
      <p class="participant-counter ${pCount > pool.participant_count ? 'over-limit' : pCount >= pool.participant_count ? 'full' : ''}" id="p-counter">
        ${pCount > pool.participant_count
          ? t('participant_over_limit', pCount, pool.participant_count)
          : t('participant_count', pCount, pool.participant_count)}
      </p>
      <div class="participants-list" id="participants-list"></div>
      <div class="add-participant-form">
        <input type="text" id="new-p-name" placeholder="${t('name_placeholder')}" ${pCount >= pool.participant_count ? 'disabled' : ''} />
        ${extras ? `<label class="checkbox-row"><input type="checkbox" id="new-p-extra" /> ${t('extra_team')}</label>` : ''}
        <button class="btn btn-sm btn-primary" id="add-p-btn" ${pCount >= pool.participant_count ? 'disabled' : ''}>${t('add')}</button>
      </div>
      ${extras ? `<p class="hint">${t('extra_team_hint')}</p>` : ''}
    </div>

    <!-- Elimination tracker -->
    <details class="card elim-card">
      <summary>
        <span class="elim-summary-title">${t('elimination_tracker')}</span>
        <span class="elim-summary-arrow">▸</span>
      </summary>
      <div id="elim-body"></div>
    </details>

    <!-- Allocation controls -->
    <div class="card">
      <h3>${t('allocation_heading')}</h3>
      <div class="alloc-actions">
        <button class="btn btn-primary" id="allocate-btn" ${locked || !pCount ? 'disabled' : ''}>${t('allocate_teams')}</button>
        <button class="btn" id="lock-btn">${locked ? t('unlock_allocation') : t('lock_allocation')}</button>
        <button class="btn btn-danger btn-sm" id="clear-alloc-btn" ${locked || !hasAlloc ? 'disabled' : ''}>${t('clear')}</button>
      </div>
      <p class="hint" id="alloc-hint">${locked ? t('allocation_is_locked') : hasAlloc ? t('allocation_assigned') : t('no_allocation_yet')}</p>
    </div>

    <!-- Allocation preview -->
    <div id="admin-alloc-grid" class="alloc-grid">${hasAlloc ? allocationCardsHTML(pool) : ''}</div>

    <!-- WhatsApp export -->
    <div class="card" id="export-card" ${hasAlloc ? '' : 'style="display:none"'}>
      <h3>${t('whatsapp_export')}</h3>
      <textarea id="export-text" rows="12" readonly>${escHtml(buildExportText(pool))}</textarea>
      <button class="btn btn-sm btn-primary" id="copy-export-btn">${t('copy_to_clipboard')}</button>
    </div>

    <!-- Danger zone -->
    <div class="card danger-card">
      <h3>${t('danger_zone')}</h3>
      <button class="btn btn-danger btn-sm" id="delete-pool-btn">${t('delete_this_pool')}</button>
    </div>

    <!-- Delete modal -->
    <div id="del-confirm-modal" class="modal hidden">
      <div class="modal-box">
        <h2 class="modal-title">${t('delete_pool_modal_title')}</h2>
        <p style="color:var(--color-text-muted);font-size:.9rem">${t('admin_delete_confirm', pool.title)}</p>
        <div class="modal-actions">
          <button class="btn" id="del-cancel">${t('cancel')}</button>
          <button class="btn btn-danger" id="del-confirm">${t('delete_permanently')}</button>
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
      errEl.textContent = t('must_be_2_12'); errEl.classList.remove('hidden'); return;
    }
    pool.participant_count = val;
    try { await persistPool(pool); renderAdminPanel(pool); }
    catch { errEl.textContent = t('save_failed'); errEl.classList.remove('hidden'); }
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
    if (pool.allocation && !confirm(t('confirm_realloc'))) return;
    pool.allocation = allocate(pool.participants);
    try { await persistPool(pool); refreshAllocUI(pool); }
    catch { showAdminError(t('failed_save_allocation')); }
  });

  // Lock / unlock
  document.getElementById('lock-btn').addEventListener('click', async () => {
    if (pool.allocation_locked) {
      if (!confirm(t('confirm_unlock'))) return;
      pool.allocation_locked = false;
    } else {
      pool.allocation_locked = true;
    }
    try {
      await persistPool(pool);
      document.getElementById('lock-btn').textContent =
        pool.allocation_locked ? t('unlock_allocation') : t('lock_allocation');
      document.getElementById('allocate-btn').disabled = pool.allocation_locked;
      document.getElementById('clear-alloc-btn').disabled = pool.allocation_locked || !pool.allocation;
      document.getElementById('alloc-hint').textContent =
        pool.allocation_locked ? t('allocation_is_locked') : t('allocation_unlocked');
    } catch { showAdminError(t('failed_save')); }
  });

  // Clear allocation
  document.getElementById('clear-alloc-btn').addEventListener('click', async () => {
    if (pool.allocation_locked) return;
    if (!confirm(t('confirm_clear'))) return;
    pool.allocation = null;
    try { await persistPool(pool); refreshAllocUI(pool); }
    catch { showAdminError(t('failed_clear_allocation')); }
  });

  // Delete pool
  const delModal = document.getElementById('del-confirm-modal');
  document.getElementById('delete-pool-btn').addEventListener('click', () => delModal.classList.remove('hidden'));
  document.getElementById('del-cancel').addEventListener('click', () => delModal.classList.add('hidden'));
  delModal.addEventListener('click', e => { if (e.target === delModal) delModal.classList.add('hidden'); });
  document.getElementById('del-confirm').addEventListener('click', async () => {
    try { await deletePool(pool.id); navigate('#/'); }
    catch { showAdminError(t('failed_delete_pool')); }
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
      try { await persistPool(pool); } catch { /* silent */ }
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
  if (hint)     hint.textContent   = pool.allocation ? t('allocation_assigned') : t('no_allocation_yet');
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
    await persistPool(pool);
    renderParticipantsList(pool);
    updateParticipantCounter(pool);
    refreshAllocUI(pool);
  } catch { showAdminError(t('failed_add_participant')); }
}

function renderParticipantsList(pool) {
  const container = document.getElementById('participants-list');
  if (!container) return;
  const extras = 12 % (pool.participant_count || 1) > 0;

  container.innerHTML = (pool.participants || []).map(p => `
    <div class="participant-row" data-id="${p.id}">
      <span class="p-name">${escHtml(p.name)}</span>
      ${extras ? `<span class="p-extra ${p.extraTeam ? '' : 'hidden-badge'}">${t('extra_badge')}</span>` : ''}
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
      ? t('participant_over_limit', n, pool.participant_count)
      : t('participant_count', n, pool.participant_count);
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
    ${extras ? `<label class="checkbox-row"><input class="p-edit-extra" type="checkbox" ${p.extraTeam ? 'checked' : ''} /> ${t('extra_inline')}</label>` : ''}
    <button class="btn btn-sm btn-primary p-save-btn">${t('save')}</button>
    <button class="btn btn-sm p-cancel-btn">${t('cancel')}</button>
  `;
  row.querySelector('.p-edit-name').focus();
  row.querySelector('.p-save-btn').addEventListener('click', async () => {
    const newName = row.querySelector('.p-edit-name').value.trim();
    if (!newName) return;
    p.name = newName;
    p.extraTeam = row.querySelector('.p-edit-extra')?.checked || false;
    try { await persistPool(pool); } catch { showAdminError(t('failed_save')); }
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
    await persistPool(pool);
    renderParticipantsList(pool);
    updateParticipantCounter(pool);
    refreshAllocUI(pool);
  } catch { showAdminError(t('failed_remove_participant')); }
}

function updateParticipantCounter(pool) {
  const el = document.getElementById('p-counter');
  if (!el) return;
  const n = (pool.participants || []).length;
  const overLimit = n > pool.participant_count;
  el.textContent = overLimit
    ? t('participant_over_limit', n, pool.participant_count)
    : t('participant_count', n, pool.participant_count);
  el.className = `participant-counter ${overLimit ? 'over-limit' : (n >= pool.participant_count ? 'full' : '')}`;
}

// ── Elimination tracker ────────────────────────────────────────────
function renderEliminationTracker(pool) {
  const body = document.getElementById('elim-body');
  if (!body) return;

  body.innerHTML = '';

  // Header row with Sync Scores button
  const header = document.createElement('div');
  header.className = 'elim-header';
  const syncBtn = document.createElement('button');
  syncBtn.id = 'elim-sync-btn';
  syncBtn.className = 'btn btn-sm elim-sync-btn';
  syncBtn.textContent = t('sync_scores');
  header.appendChild(syncBtn);
  body.appendChild(header);

  // Suggestion banner (purely UI state, never persisted)
  const nonElim = currentSuggestions.filter(t => !(pool.eliminated_teams || []).includes(teamId(t)));
  if (nonElim.length > 0) {
    const banner = document.createElement('div');
    banner.className = 'elim-suggestions';
    const label = document.createElement('span');
    label.className = 'sugg-label';
    label.textContent = t('suggested_eliminations');
    banner.appendChild(label);
    nonElim.forEach(team => {
      const tid = teamId(team);
      const chip = document.createElement('span');
      chip.className = 'sugg-chip';
      const name = document.createElement('button');
      name.className = 'sugg-name';
      name.textContent = `${team.flag} ${localTeamName(team.name)}`;
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
    label.textContent = t(`tier_${tier}`);
    group.appendChild(label);
    const chips = document.createElement('div');
    chips.className = 'elim-chips';
    TEAMS.filter(tm => tm.tier === tier).forEach(team => {
      const id  = teamId(team);
      const out = (pool.eliminated_teams || []).includes(id);
      const chip = document.createElement('button');
      chip.className = `elim-chip${out ? ' is-elim' : ''}`;
      chip.dataset.teamId = id;
      chip.textContent = (out ? '❌ ' : '') + `${team.flag} ${localTeamName(team.name)}`;
      let saving = false;
      chip.addEventListener('click', async () => {
        if (saving) return;
        saving = true;
        chip.style.opacity = '0.5';
        const elim = pool.eliminated_teams || [];
        const idx  = elim.indexOf(id);
        pool.eliminated_teams = idx === -1 ? [...elim, id] : elim.filter(n => n !== id);
        try { await persistPool(pool); renderEliminationTracker(pool); refreshAllocUI(pool); }
        catch { showAdminError(t('failed_update')); saving = false; }
      });
      chips.appendChild(chip);
    });
    group.appendChild(chips);
    body.appendChild(group);
  }

  // Sync button handler
  syncBtn.addEventListener('click', async () => {
    syncBtn.textContent = t('syncing');
    syncBtn.disabled = true;
    try {
      const matches = await fetchLiveScores();
      if (!matches.length) {
        showElimSyncError(header);
        syncBtn.textContent = t('sync_scores');
        syncBtn.disabled = false;
        return;
      }
      currentSuggestions = computeSuggestions(matches);
      renderEliminationTracker(pool);
    } catch {
      showElimSyncError(header);
      syncBtn.textContent = t('sync_scores');
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
  err.textContent = t('could_not_fetch');
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
    if (event === 'SIGNED_OUT') { navigate('#/'); router(); return; }
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
