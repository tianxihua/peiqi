const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");

const startOverlay = document.querySelector("#start-overlay");
const resultOverlay = document.querySelector("#result-overlay");
const rankedButton = document.querySelector("#ranked-button");
const practiceButton = document.querySelector("#practice-button");
const skinButton = document.querySelector("#skin-button");
const menuNote = document.querySelector("#menu-note");
const menuHome = document.querySelector("#menu-home");
const skinScreen = document.querySelector("#skin-screen");
const skinBackButton = document.querySelector("#skin-back-button");
const skinGrid = document.querySelector("#skin-grid");
const skinTabRifle = document.querySelector("#skin-tab-rifle");
const skinTabPistol = document.querySelector("#skin-tab-pistol");
const summaryOverlay = document.querySelector("#summary-overlay");
const summaryText = document.querySelector("#summary-text");
const summaryFriendlyTitle = document.querySelector("#summary-friendly-title");
const summaryEnemyTitle = document.querySelector("#summary-enemy-title");
const summaryFriendlyBody = document.querySelector("#summary-friendly-body");
const summaryEnemyBody = document.querySelector("#summary-enemy-body");
const summaryContinueButton = document.querySelector("#summary-continue-button");
const restartButton = document.querySelector("#restart-button");
const exitSquadButton = document.querySelector("#exit-squad-button");
const ammoCount = document.querySelector("#ammo-count");
const weaponState = document.querySelector("#weapon-state");
const healthCount = document.querySelector("#health-count");
const healthFill = document.querySelector("#health-fill");
const killCount = document.querySelector("#kill-count");
const waveCount = document.querySelector("#wave-count");
const timerCount = document.querySelector("#timer-count");
const accountName = document.querySelector("#account-name");
const teamName = document.querySelector("#team-name");
const rankCount = document.querySelector("#rank-count");
const rankBadge = document.querySelector("#rank-badge");
const winCount = document.querySelector("#win-count");
const rankProgress = document.querySelector("#rank-progress");
const objectiveText = document.querySelector("#objective-text");
const promptText = document.querySelector("#prompt-text");
const damageMask = document.querySelector("#damage-mask");
const hitIndicator = document.querySelector("#hit-indicator");
const rankToast = document.querySelector("#rank-toast");
const rankToastBadge = document.querySelector("#rank-toast-badge");
const rankToastTitle = document.querySelector("#rank-toast-title");
const resultTitle = document.querySelector("#result-title");
const resultText = document.querySelector("#result-text");
const crosshair = document.querySelector(".crosshair");
const loginOverlay = document.querySelector("#login-overlay");
const loginNameInput = document.querySelector("#login-name");
const loginPasswordInput = document.querySelector("#login-password");
const loginButton = document.querySelector("#login-button");
const registerButton = document.querySelector("#register-button");
const loginMessage = document.querySelector("#login-message");
const chatToggle = document.querySelector("#chat-toggle");
const chatPanel = document.querySelector("#chat-panel");
const chatMessages = document.querySelector("#chat-messages");
const chatInput = document.querySelector("#chat-input");
const chatSend = document.querySelector("#chat-send");
const chatStatus = document.querySelector("#chat-status");

const MAP_W = 24;
const MAP_H = 24;
const CELL = 1;
const MIN_BATTLE_X = 1.5;
const MIN_BATTLE_Y = 1.5;
const MAX_BATTLE_X = MAP_W - 1.5;
const MAX_BATTLE_Y = MAP_H - 1.5;
const ACCOUNTS_STORAGE_KEY = "delta-fps-accounts";
const PROGRESSION_STORAGE_KEY = "delta-fps-rank-progression";
const CHAT_STORAGE_KEY = "delta-fps-public-chat";
const MAX_CHAT_MESSAGES = 5;
const SKIN_SHEET_PATHS = {
  pistol: "./assets/skins/pistol-sheet.png",
  rifle: "./assets/skins/rifle-sheet.png",
};

const mapRows = [
  "111111111111111111111111",
  "100000000000000000000001",
  "100111000111111000111001",
  "100101000100001000101001",
  "100101000100001000101001",
  "100100000100001000001001",
  "100101110101101011101001",
  "100001000100001000100001",
  "101101000111011000101101",
  "100000000000000000000001",
  "100111100011110001111001",
  "100000000000000000000001",
  "100000000000000000000001",
  "100111100011110001111001",
  "100000000000000000000001",
  "101101000111011000101101",
  "100001000100001000100001",
  "100101110101101011101001",
  "100100000100001000001001",
  "100101000100001000101001",
  "100101000100001000101001",
  "100111000111111000111001",
  "100000000000000000000001",
  "111111111111111111111111",
];

const map = mapRows.map((row) => row.split("").map(Number));
const keys = new Set();
const inputState = { firing: false };
const mouseState = { active: false };
const wallDepthBuffer = [];
const skinPreviewImages = {};
const skinThumbCache = {};
const skinRuntimeImageCache = {};
const skinGunCache = {};
const skinGunImageCache = {};
const SKIN_SHEET_SIZE = { width: 896, height: 1184 };
const PISTOL_THUMB_RECTS = [
  { x: 20, y: 44, width: 255, height: 150 },
  { x: 320, y: 40, width: 255, height: 150 },
  { x: 620, y: 36, width: 255, height: 156 },
  { x: 18, y: 280, width: 260, height: 150 },
  { x: 320, y: 278, width: 255, height: 150 },
  { x: 616, y: 274, width: 258, height: 156 },
  { x: 18, y: 512, width: 258, height: 160 },
  { x: 320, y: 512, width: 255, height: 160 },
  { x: 616, y: 510, width: 258, height: 160 },
  { x: 18, y: 748, width: 258, height: 160 },
  { x: 318, y: 744, width: 260, height: 164 },
  { x: 614, y: 742, width: 262, height: 168 },
  { x: 18, y: 982, width: 258, height: 160 },
  { x: 318, y: 980, width: 260, height: 164 },
  { x: 614, y: 980, width: 252, height: 160 },
];
const RIFLE_THUMB_RECTS = [
  { x: 452, y: 76, width: 300, height: 158 },
  { x: 8, y: 336, width: 426, height: 182 },
  { x: 452, y: 344, width: 412, height: 176 },
  { x: 436, y: 640, width: 446, height: 194 },
  { x: 14, y: 920, width: 430, height: 176 },
  { x: 452, y: 920, width: 412, height: 174 },
];

function createPistolSkin(index, row, col, theme) {
  return {
    id: `pistol-${index + 1}`,
    name: `手枪皮肤 ${index + 1}`,
    category: "pistol",
    sheet: "pistol",
    crop: {
      x: col * (896 / 3),
      y: row * (1184 / 5),
      width: 896 / 3,
      height: 1184 / 5,
    },
    thumbRect: PISTOL_THUMB_RECTS[index],
    theme,
  };
}

function createRifleSkin(index, row, col, name, theme) {
  return {
    id: `rifle-${index + 1}`,
    name,
    category: "rifle",
    sheet: "rifle",
    crop: {
      x: col * (896 / 2),
      y: row * (1184 / 4),
      width: 896 / 2,
      height: 1184 / 4,
    },
    thumbRect: RIFLE_THUMB_RECTS[index],
    theme,
  };
}

const WEAPON_SKINS = {
  pistol: [
    createPistolSkin(0, 0, 0, { body: "#a8b2bc", slide: "#d5d9de", grip: "#5f4437", accent: "#52a7ff", glow: "#5cb8ff" }),
    createPistolSkin(1, 0, 1, { body: "#a47c66", slide: "#ceb8a6", grip: "#644434", accent: "#8f6d52", glow: "#000000" }),
    createPistolSkin(2, 0, 2, { body: "#95a9cc", slide: "#dfe5f5", grip: "#26303d", accent: "#48c7ff", glow: "#77d8ff" }),
    createPistolSkin(3, 1, 0, { body: "#9098a0", slide: "#d8dbe0", grip: "#5a4239", accent: "#8f8f8f", glow: "#000000" }),
    createPistolSkin(4, 1, 1, { body: "#78553f", slide: "#8b664d", grip: "#5a3f2f", accent: "#3d92c4", glow: "#000000" }),
    createPistolSkin(5, 1, 2, { body: "#915a35", slide: "#a56c45", grip: "#633f2f", accent: "#ff9735", glow: "#ffb35a" }),
    createPistolSkin(6, 2, 0, { body: "#849097", slide: "#a8b9c6", grip: "#2b2f34", accent: "#3fc2ff", glow: "#52d6ff" }),
    createPistolSkin(7, 2, 1, { body: "#7d5ad8", slide: "#a57df0", grip: "#292534", accent: "#bf7eff", glow: "#ce94ff" }),
    createPistolSkin(8, 2, 2, { body: "#6e9ce0", slide: "#9fc8ff", grip: "#1f2d3d", accent: "#4acaff", glow: "#61deff" }),
    createPistolSkin(9, 3, 0, { body: "#23272d", slide: "#3c434d", grip: "#1b1f25", accent: "#525861", glow: "#000000" }),
    createPistolSkin(10, 3, 1, { body: "#866686", slide: "#b594bc", grip: "#684839", accent: "#b67df2", glow: "#c591ff" }),
    createPistolSkin(11, 3, 2, { body: "#7c6bb0", slide: "#b59bff", grip: "#352f4b", accent: "#63d8ff", glow: "#8f9bff" }),
    createPistolSkin(12, 4, 0, { body: "#525862", slide: "#7b8792", grip: "#1f2328", accent: "#8f70ff", glow: "#9f88ff" }),
    createPistolSkin(13, 4, 1, { body: "#925f7b", slide: "#c17c68", grip: "#5c274e", accent: "#ff76e0", glow: "#ff9ef0" }),
    createPistolSkin(14, 4, 2, { body: "#a4b5c8", slide: "#d9e5f1", grip: "#384454", accent: "#4ec9ff", glow: "#71dfff" }),
  ],
  rifle: [
    createRifleSkin(0, 0, 1, "突击步枪皮肤 1", { body: "#607458", slide: "#879972", grip: "#425447", accent: "#7ea56d", glow: "#000000" }),
    createRifleSkin(1, 1, 0, "突击步枪皮肤 2", { body: "#9edcff", slide: "#ddf8ff", grip: "#63b8ff", accent: "#6edbff", glow: "#93efff" }),
    createRifleSkin(2, 1, 1, "突击步枪皮肤 3", { body: "#8d6f59", slide: "#b6967e", grip: "#5c4838", accent: "#b470ff", glow: "#d193ff" }),
    createRifleSkin(3, 2, 1, "突击步枪皮肤 4", { body: "#864bb6", slide: "#b26cff", grip: "#4a235f", accent: "#ff7dff", glow: "#f1a1ff" }),
    createRifleSkin(4, 3, 0, "突击步枪皮肤 5", { body: "#4b4038", slide: "#7a6758", grip: "#2c2a2b", accent: "#6d716f", glow: "#000000" }),
    createRifleSkin(5, 3, 1, "突击步枪皮肤 6", { body: "#6e7d58", slide: "#9aae79", grip: "#49563f", accent: "#98b56f", glow: "#000000" }),
  ],
};

const WEAPONS = {
  rifle: {
    key: "rifle",
    name: "突击步枪",
    magSize: 30,
    reserveAmmo: 130,
    fireInterval: 0.09,
    reloadTime: 1.5,
    damageNear: 40,
    damageFar: 30,
    spreadHip: 0.075,
    spreadAim: 0.025,
    verticalHip: 0.06,
    verticalAim: 0.02,
    recoilKick: 1.4,
    shotSpreadGain: 0.38,
    projectileSpeed: 0,
  },
  pistol: {
    key: "pistol",
    name: "小手枪",
    magSize: 15,
    reserveAmmo: 70,
    fireInterval: 0.2,
    reloadTime: 1.15,
    damageNear: 30,
    damageFar: 22,
    spreadHip: 0.05,
    spreadAim: 0.02,
    verticalHip: 0.04,
    verticalAim: 0.018,
    recoilKick: 0.8,
    shotSpreadGain: 0.2,
    projectileSpeed: 0,
  },
  shotgun: {
    key: "shotgun",
    name: "散弹枪",
    magSize: 8,
    reserveAmmo: 120,
    fireInterval: 0.75,
    reloadTime: 1.9,
    damageNear: 18,
    damageFar: 10,
    pellets: 6,
    spreadHip: 0.18,
    spreadAim: 0.11,
    verticalHip: 0.1,
    verticalAim: 0.06,
    recoilKick: 1.8,
    shotSpreadGain: 0.55,
    projectileSpeed: 0,
  },
  sniper: {
    key: "sniper",
    name: "狙击枪",
    magSize: 5,
    reserveAmmo: 150,
    fireInterval: 1,
    reloadTime: 2.1,
    damageNear: 100,
    damageFar: 85,
    spreadHip: 0.09,
    spreadAim: 0.006,
    verticalHip: 0.05,
    verticalAim: 0.004,
    recoilKick: 2.2,
    shotSpreadGain: 0.28,
    projectileSpeed: 0,
  },
  rocket: {
    key: "rocket",
    name: "导弹枪",
    magSize: 1,
    reserveAmmo: 50,
    fireInterval: 1.3,
    reloadTime: 2.4,
    damageNear: 110,
    damageFar: 90,
    spreadHip: 0.03,
    spreadAim: 0.015,
    verticalHip: 0.02,
    verticalAim: 0.01,
    recoilKick: 2.5,
    shotSpreadGain: 0.12,
    projectileSpeed: 4.3,
    explosionRadius: 1.1,
  },
};

const WEAPON_POOL = Object.keys(WEAPONS);

const TEAMS = {
  blue: {
    key: "blue",
    name: "渡鸦小队",
    color: "#73d9ff",
    bright: "#d0f6ff",
    muzzle: "#8ee7ff",
  },
  red: {
    key: "red",
    name: "阿特拉斯",
    color: "#ff7d68",
    bright: "#ffd4bf",
    muzzle: "#ff9e86",
  },
};

const game = {
  running: false,
  ended: false,
  mode: "ranked",
  timer: 300,
  elapsed: 0,
  kills: 0,
  wave: 1,
  targetKills: 7,
  respawnTimer: 0,
  medDropTimer: 40,
  weaponDropTimer: 30,
};

const accounts = loadAccounts();
const publicChat = loadChatMessages();
let currentAccount = null;
const progression = { wins: 0 };
let audioContext = null;
let rankToastTimer = null;
let chatOpen = false;
let squadCommand = null;
let chatAnnounceCooldown = 0;
let activeSkinCategory = "rifle";
const participantLookup = new Map();

const player = {
  id: "player",
  x: 2.5,
  y: 2.5,
  angle: 0,
  pitch: 0,
  team: "blue",
  alive: true,
  health: 100,
  maxHealth: 100,
  weaponKey: "rifle",
  ammo: 30,
  magSize: 30,
  reserveAmmo: 130,
  reloadTimer: 0,
  reloadTime: 1.5,
  fireCooldown: 0,
  fireInterval: 0.09,
  moveSpeed: 2.8,
  sprintSpeed: 4.2,
  rotSpeed: 2.4,
  aimProgress: 0,
  damageFlash: 0,
  recoil: 0,
  recoilKick: 0,
  muzzleFlash: 0,
  moveBob: 0,
  moveBlend: 0,
  shotSpread: 0,
  fov: Math.PI / 3,
};

const units = [];
const projectiles = [];
const hitMarks = [];
const medDrops = [];
const weaponDrops = [];

function loadAccounts() {
  const fallback = {};
  try {
    const raw = window.localStorage.getItem(ACCOUNTS_STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function loadChatMessages() {
  try {
    const raw = window.localStorage.getItem(CHAT_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((entry) => entry && typeof entry.author === "string" && typeof entry.message === "string")
      .slice(-MAX_CHAT_MESSAGES);
  } catch {
    return [];
  }
}

function saveChatMessages() {
  try {
    window.localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(publicChat.slice(-MAX_CHAT_MESSAGES)));
  } catch {
    // Ignore storage failures and keep chat only in memory.
  }
}

function clearChatMessages() {
  publicChat.length = 0;
  saveChatMessages();
  renderChatMessages();
}

function saveAccounts() {
  try {
    window.localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
  } catch {
    // Ignore storage failures and keep in-memory accounts.
  }
}

function getAccountRecord(name) {
  return accounts[name] ?? null;
}

function ensureAccountCosmetics(account) {
  if (!account.selectedSkins || typeof account.selectedSkins !== "object") {
    account.selectedSkins = { rifle: "rifle-1", pistol: "pistol-1" };
  }
  account.selectedSkins.rifle ??= "rifle-1";
  account.selectedSkins.pistol ??= "pistol-1";
  return account;
}

function loadProgressionForAccount(name) {
  const account = getAccountRecord(name);
  if (account) {
    ensureAccountCosmetics(account);
  }
  progression.wins = Math.max(0, Number(account?.wins) || 0);
}

function saveProgression() {
  if (!currentAccount || !accounts[currentAccount]) {
    return;
  }
  ensureAccountCosmetics(accounts[currentAccount]);
  accounts[currentAccount].wins = progression.wins;
  saveAccounts();
}

function setLoginMessage(message, isError = false) {
  loginMessage.textContent = message;
  loginMessage.style.color = isError ? "#ff8c8c" : "";
}

function formatChatTime(timestamp) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return "--:--";
  }
  return date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
}

function getUnitCallsign(unit) {
  const prefix = unit.team === "blue" ? "渡鸦" : "阿特拉斯";
  return `${prefix}-${(unit.slot ?? 0) + 1}`;
}

function createMatchStats(id, name, team, isPlayer = false) {
  return {
    id,
    name,
    team,
    isPlayer,
    kills: 0,
    assists: 0,
    damageDealt: 0,
    damageTaken: 0,
  };
}

function registerParticipant(entity, name, isPlayer = false) {
  entity.stats = createMatchStats(entity.id, name, entity.team, isPlayer);
  entity.damageLedger = {};
  participantLookup.set(entity.id, entity);
  return entity.stats;
}

function resetParticipantTracking() {
  participantLookup.clear();
  registerParticipant(player, currentAccount ? `${currentAccount}（你）` : "你", true);
}

function recordDamageEvent(attacker, target, amount) {
  if (!attacker || !target || amount <= 0 || attacker === target) {
    return;
  }
  attacker.stats ??= createMatchStats(attacker.id, attacker.id, attacker.team, attacker === player);
  target.stats ??= createMatchStats(target.id, target.id, target.team, target === player);
  attacker.stats.damageDealt += amount;
  target.stats.damageTaken += amount;
  target.damageLedger ??= {};
  target.damageLedger[attacker.id] = (target.damageLedger[attacker.id] ?? 0) + amount;
}

function creditKillAndAssists(target, killer) {
  if (killer?.stats) {
    killer.stats.kills += 1;
  }

  const contributors = target.damageLedger ?? {};
  for (const [participantId, dealt] of Object.entries(contributors)) {
    if (participantId === killer?.id || dealt <= 0) {
      continue;
    }
    const contributor = participantLookup.get(participantId);
    if (!contributor?.stats || contributor.team === target.team) {
      continue;
    }
    contributor.stats.assists += 1;
  }

  target.damageLedger = {};
}

function defeatUnit(unit, killer = null) {
  unit.alive = false;
  unit.dead = true;
  unit.downed = false;
  unit.health = 0;
  unit.fireCooldown = 99;
  unit.reviveProgress = 0;
  unit.respawnTimer = teamHasRemainingCombatants(unit.team, unit) ? 5 : 0;
  creditKillAndAssists(unit, killer);
  if (killer === player) {
    game.kills += 1;
  }
}

function defeatPlayer(killer = null) {
  player.alive = false;
  player.health = 0;
  game.respawnTimer = 5;
  creditKillAndAssists(player, killer);
  promptText.textContent = "你已阵亡，若队友仍存活将在 5 秒后复活。";
  const responder = units.find((unit) => isUnitActive(unit) && isFriendlyTeam(unit.team, player.team));
  if (responder) {
    tryUnitChat(responder, "你先倒了，我们继续顶住。", "player-down", 8);
  }
}

function formatRate(value) {
  return `${Math.round(value * 100)}%`;
}

function buildMatchSummary() {
  const participants = [player, ...units].filter((entity) => entity.stats);
  const totalDamage = participants.reduce((sum, entity) => sum + entity.stats.damageDealt, 0);
  const totalTaken = participants.reduce((sum, entity) => sum + entity.stats.damageTaken, 0);
  const totalKills = participants.reduce((sum, entity) => sum + entity.stats.kills, 0);
  const teamKills = {
    blue: participants.filter((entity) => entity.team === "blue").reduce((sum, entity) => sum + entity.stats.kills, 0),
    red: participants.filter((entity) => entity.team === "red").reduce((sum, entity) => sum + entity.stats.kills, 0),
  };

  const rows = participants.map((entity) => {
    const stats = entity.stats;
    const participationRate = teamKills[entity.team] > 0
      ? Math.min(1, (stats.kills + stats.assists) / teamKills[entity.team])
      : 0;
    const tankRate = totalTaken > 0 ? stats.damageTaken / totalTaken : 0;
    const damageRate = totalDamage > 0 ? stats.damageDealt / totalDamage : 0;
    const killRate = totalKills > 0 ? stats.kills / totalKills : 0;
    const score = participationRate * 0.32 + tankRate * 0.18 + damageRate * 0.3 + killRate * 0.2;
    return {
      id: stats.id,
      name: stats.name,
      team: stats.team,
      isPlayer: stats.isPlayer,
      participationRate,
      tankRate,
      damageRate,
      killRate,
      score,
    };
  }).sort((a, b) => b.score - a.score || b.damageRate - a.damageRate || b.killRate - a.killRate);

  const best = rows[0] ?? null;
  return { rows, best };
}

function createSummaryRow(row, summary) {
  const item = document.createElement("div");
  item.className = "summary-board__row";
  if (row.isPlayer) {
    item.classList.add("is-player");
  }
  if (summary.best && row.id === summary.best.id) {
    item.classList.add("is-best");
  }

  const cells = [
    row.name,
    formatRate(row.participationRate),
    formatRate(row.tankRate),
    formatRate(row.damageRate),
    formatRate(row.killRate),
  ];

  cells.forEach((value, index) => {
    const cell = document.createElement("span");
    cell.textContent = value;
    cell.className = index === 0 ? "summary-board__name" : "summary-board__value";
    item.appendChild(cell);
  });

  return item;
}

function renderMatchSummary(summary, summaryNote) {
  if (!summaryFriendlyTitle || !summaryEnemyTitle || !summaryFriendlyBody || !summaryEnemyBody) {
    summaryText.textContent = summaryNote;
    return;
  }

  const friendlyTeam = player.team;
  const enemyTeam = friendlyTeam === "blue" ? "red" : "blue";
  summaryFriendlyTitle.textContent = `我方 · ${TEAMS[friendlyTeam].name}`;
  summaryEnemyTitle.textContent = `敌方 · ${TEAMS[enemyTeam].name}`;
  summaryFriendlyTitle.style.color = TEAMS[friendlyTeam].color;
  summaryEnemyTitle.style.color = TEAMS[enemyTeam].color;
  summaryFriendlyBody.innerHTML = "";
  summaryEnemyBody.innerHTML = "";

  for (const row of summary.rows) {
    const targetBody = row.team === friendlyTeam ? summaryFriendlyBody : summaryEnemyBody;
    targetBody.appendChild(createSummaryRow(row, summary));
  }
  summaryText.textContent = summaryNote;
}

function appendChatMessage(author, message, options = {}) {
  publicChat.push({
    author,
    message,
    createdAt: options.createdAt ?? Date.now(),
    team: options.team ?? null,
    kind: options.kind ?? "chat",
    commandType: options.commandType ?? null,
  });
  if (publicChat.length > MAX_CHAT_MESSAGES) {
    publicChat.splice(0, publicChat.length - MAX_CHAT_MESSAGES);
  }
  saveChatMessages();
  renderChatMessages();
}

function getSquadCommandReply(type) {
  if (type === "regroup") {
    return "收到，向你集合。";
  }
  if (type === "push") {
    return "收到，准备推进。";
  }
  if (type === "med") {
    return medDrops.length > 0 ? "收到，去抢医疗空投。" : "收到，但现在场上还没有医疗空投。";
  }
  return "收到。";
}

function parsePlayerChatCommand(message) {
  if (/(集合|跟上|抱团|靠拢)/.test(message)) {
    return { type: "regroup", duration: 14 };
  }
  if (/(推进|压上|进攻|冲|突进)/.test(message)) {
    return { type: "push", duration: 14 };
  }
  if (/(血包|医疗|回血|补血|治疗)/.test(message)) {
    return { type: "med", duration: 12 };
  }
  return null;
}

function handlePlayerChatCommand(message) {
  const command = parsePlayerChatCommand(message);
  if (!command) {
    return;
  }
  squadCommand = {
    type: command.type,
    expiresAt: game.elapsed + command.duration,
  };
  const responder = units.find((unit) => isUnitActive(unit) && isFriendlyTeam(unit.team, player.team));
  if (responder) {
    responder.chatCooldown = Math.max(responder.chatCooldown ?? 0, 2.2);
    appendChatMessage(getUnitCallsign(responder), getSquadCommandReply(command.type), {
      team: responder.team,
      kind: "ack",
      commandType: command.type,
    });
  }
}

function tryUnitChat(unit, message, tag, minCooldown = 5.5) {
  if ((unit.chatCooldown ?? 0) > 0 || chatAnnounceCooldown > 0) {
    return false;
  }
  if (unit.lastChatTag === tag && (unit.lastChatAt ?? 0) > game.elapsed - 5) {
    return false;
  }
  appendChatMessage(getUnitCallsign(unit), message, {
    team: unit.team,
    kind: "ai",
  });
  unit.chatCooldown = minCooldown + Math.random() * 2.8;
  unit.lastChatTag = tag;
  unit.lastChatAt = game.elapsed;
  chatAnnounceCooldown = 0.8;
  return true;
}

function renderChatMessages() {
  chatMessages.innerHTML = "";

  if (publicChat.length === 0) {
    const empty = document.createElement("div");
    empty.className = "chat-empty";
    empty.textContent = "公共频道还没有消息。";
    chatMessages.appendChild(empty);
  } else {
    for (const entry of publicChat.slice(-MAX_CHAT_MESSAGES)) {
      const item = document.createElement("article");
      item.className = "chat-message";

      const meta = document.createElement("div");
      meta.className = "chat-message__meta";

      const author = document.createElement("strong");
      author.className = "chat-message__author";
      author.textContent = entry.author;

      const time = document.createElement("span");
      time.textContent = formatChatTime(entry.createdAt);

      const body = document.createElement("div");
      body.className = "chat-message__body";
      body.textContent = entry.message;

      meta.append(author, time);
      item.append(meta, body);
      chatMessages.appendChild(item);
    }
  }

  chatStatus.textContent = `最近 ${Math.min(publicChat.length, MAX_CHAT_MESSAGES)} / ${MAX_CHAT_MESSAGES} 条消息`;
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function setChatOpen(nextOpen) {
  chatOpen = nextOpen;
  chatPanel.classList.toggle("is-open", nextOpen);
  chatToggle.textContent = nextOpen ? "收起频道" : "公共频道";

  if (nextOpen) {
    inputState.firing = false;
    mouseState.active = false;
    keys.delete("MouseRight");
    if (game.running) {
      chatInput.focus();
    }
  } else {
    chatInput.blur();
  }
}

function toggleChat(forceOpen = null) {
  if (!currentAccount) {
    return;
  }
  const nextOpen = forceOpen == null ? !chatOpen : forceOpen;
  setChatOpen(nextOpen);
}

function submitChatMessage() {
  if (!currentAccount) {
    return;
  }
  const message = chatInput.value.trim();
  if (!message) {
    return;
  }

  appendChatMessage(currentAccount, message, {
    team: player.team,
    kind: "player",
  });
  handlePlayerChatCommand(message);
  chatInput.value = "";
}

function setMenuNote(message) {
  if (menuNote) {
    menuNote.textContent = message;
  }
}

function completeLogin(name) {
  currentAccount = name;
  loadProgressionForAccount(name);
  accountName.textContent = name;
  loginOverlay.classList.remove("overlay--active");
  startOverlay.classList.add("overlay--active");
  setMenuNote(`欢迎回来，${name}。点击“排位赛”开始正式对局，或进入练习场热身。`);
  setLoginMessage("登录成功。");
  renderChatMessages();
  updateHud();
}

function normalizeAccountName(value) {
  return value.trim();
}

function handleLogin() {
  const name = normalizeAccountName(loginNameInput.value);
  const password = loginPasswordInput.value;
  if (!name || !password) {
    setLoginMessage("请输入名称和密码。", true);
    return;
  }

  const account = getAccountRecord(name);
  if (!account || account.password !== password) {
    setLoginMessage("名称或密码错误。", true);
    return;
  }

  completeLogin(name);
}

function handleRegister() {
  const name = normalizeAccountName(loginNameInput.value);
  const password = loginPasswordInput.value;
  if (!name || !password) {
    setLoginMessage("注册前请先输入名称和密码。", true);
    return;
  }
  if (accounts[name]) {
    setLoginMessage("这个名称已经存在，请换一个。", true);
    return;
  }

  accounts[name] = {
    password,
    wins: 0,
    selectedSkins: { rifle: "rifle-1", pistol: "pistol-1" },
  };
  saveAccounts();
  completeLogin(name);
}

function getUnlockedSkinCount(category) {
  return Math.max(1, Math.min(WEAPON_SKINS[category].length, progression.wins + 1));
}

function getUnlockedSkins(category) {
  return WEAPON_SKINS[category].slice(0, getUnlockedSkinCount(category));
}

function getSelectedSkinId(category) {
  if (!currentAccount || !accounts[currentAccount]) {
    return WEAPON_SKINS[category][0]?.id ?? null;
  }
  ensureAccountCosmetics(accounts[currentAccount]);
  return accounts[currentAccount].selectedSkins[category] ?? WEAPON_SKINS[category][0]?.id ?? null;
}

function getSelectedSkin(category) {
  const selectedId = getSelectedSkinId(category);
  return WEAPON_SKINS[category].find((skin) => skin.id === selectedId) ?? WEAPON_SKINS[category][0] ?? null;
}

function getWeaponSkinTheme(weaponKey) {
  if (weaponKey !== "rifle" && weaponKey !== "pistol") {
    return null;
  }
  return getSelectedSkin(weaponKey)?.theme ?? null;
}

function getSelectedWeaponSkin(weaponKey) {
  if (weaponKey !== "rifle" && weaponKey !== "pistol") {
    return null;
  }
  return getSelectedSkin(weaponKey);
}

function getWeaponSkin(weaponKey) {
  if (weaponKey !== "rifle" && weaponKey !== "pistol") {
    return null;
  }
  return getSelectedSkin(weaponKey);
}

function loadSkinSheet(sheetKey) {
  if (skinPreviewImages[sheetKey]) {
    return Promise.resolve(skinPreviewImages[sheetKey]);
  }

  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      skinPreviewImages[sheetKey] = image;
      resolve(image);
    };
    image.onerror = reject;
    image.src = SKIN_SHEET_PATHS[sheetKey];
  });
}

async function getSkinThumbDataUrl(skin) {
  if (skinThumbCache[skin.id]) {
    return skinThumbCache[skin.id];
  }

  const thumbRect = skin.thumbRect ?? skin.crop;
  const targetWidth = 360;
  const targetHeight = 232;
  const outCanvas = document.createElement("canvas");
  outCanvas.width = targetWidth;
  outCanvas.height = targetHeight;
  const outCtx = outCanvas.getContext("2d");
  outCtx.clearRect(0, 0, targetWidth, targetHeight);
  const theme = skin.theme ?? {};
  const bodyColor = theme.body ?? "#5f6d78";
  const slideColor = theme.slide ?? "#cbd5df";
  const gripColor = theme.grip ?? "#33414d";
  const accentColor = theme.accent ?? "#7cc8ff";
  const glowColor = theme.glow && theme.glow !== "#000000" ? theme.glow : null;
  const isRifle = skin.category === "rifle";
  const gunW = isRifle ? 250 : 170;
  const gunH = isRifle ? 70 : 62;
  const gunX = (targetWidth - gunW) / 2;
  const gunY = isRifle ? 86 : 90;

  outCtx.save();
  outCtx.fillStyle = "rgba(255, 255, 255, 0.035)";
  outCtx.fillRect(0, 0, targetWidth, targetHeight);
  if (glowColor) {
    outCtx.shadowColor = glowColor;
    outCtx.shadowBlur = 20;
  }

  outCtx.translate(gunX, gunY);
  outCtx.rotate(isRifle ? -0.05 : -0.08);

  outCtx.fillStyle = bodyColor;
  outCtx.fillRect(0, 0, gunW, gunH * 0.34);

  outCtx.fillStyle = slideColor;
  outCtx.fillRect(gunW * 0.44, gunH * 0.06, gunW * 0.38, gunH * 0.1);

  outCtx.fillStyle = gripColor;
  outCtx.fillRect(gunW * 0.24, gunH * 0.18, gunW * 0.16, gunH * 0.45);

  outCtx.fillStyle = accentColor;
  outCtx.fillRect(gunW * 0.08, gunH * 0.06, gunW * 0.18, gunH * 0.1);

  if (isRifle) {
    outCtx.fillStyle = slideColor;
    outCtx.fillRect(gunW * 0.76, gunH * 0.08, gunW * 0.18, gunH * 0.08);
    outCtx.fillStyle = gripColor;
    outCtx.fillRect(gunW * 0.54, gunH * 0.22, gunW * 0.12, gunH * 0.58);
    outCtx.fillRect(gunW * 0.04, gunH * 0.08, gunW * 0.12, gunH * 0.18);
    outCtx.fillStyle = accentColor;
    outCtx.fillRect(gunW * 0.48, -gunH * 0.12, gunW * 0.18, gunH * 0.1);
  } else {
    outCtx.fillStyle = slideColor;
    outCtx.fillRect(gunW * 0.7, gunH * 0.08, gunW * 0.12, gunH * 0.08);
    outCtx.fillStyle = accentColor;
    outCtx.fillRect(gunW * 0.56, -gunH * 0.08, gunW * 0.12, gunH * 0.08);
  }
  outCtx.restore();

  const url = outCanvas.toDataURL("image/png");
  skinThumbCache[skin.id] = url;
  return url;
}

function ensureSkinRuntimeImage(skin) {
  if (!skin) {
    return null;
  }
  const cached = skinRuntimeImageCache[skin.id];
  if (cached?.complete) {
    return cached;
  }
  if (cached) {
    return cached;
  }
  const image = new Image();
  skinRuntimeImageCache[skin.id] = image;
  getSkinThumbDataUrl(skin).then((url) => {
    image.src = url;
  }).catch(() => {
    // Keep fallback rectangle rendering if image prep fails.
  });
  return image;
}

async function ensureSkinGunImage(skin) {
  if (!skin) {
    return null;
  }
  if (skinGunImageCache[skin.id]) {
    return skinGunImageCache[skin.id];
  }
  const url = await getSkinThumbDataUrl(skin);
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      skinGunImageCache[skin.id] = image;
      resolve(image);
    };
    image.onerror = reject;
    image.src = url;
  });
}

async function renderSkinSelection() {
  if (!skinGrid) {
    return;
  }

  skinTabRifle.classList.toggle("is-active", activeSkinCategory === "rifle");
  skinTabPistol.classList.toggle("is-active", activeSkinCategory === "pistol");
  skinGrid.innerHTML = "";

  const unlockedSkins = getUnlockedSkins(activeSkinCategory);
  const selectedId = getSelectedSkinId(activeSkinCategory);

  for (const skin of unlockedSkins) {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "skin-card";
    if (skin.id === selectedId) {
      card.classList.add("is-active");
    }

    const thumb = document.createElement("div");
    thumb.className = "skin-card__thumb";
    try {
      const img = document.createElement("img");
      img.alt = skin.name;
      img.decoding = "async";
      img.loading = "eager";
      img.src = await getSkinThumbDataUrl(skin);
      thumb.appendChild(img);
    } catch {
      thumb.style.background = "rgba(255, 255, 255, 0.05)";
    }

    const label = document.createElement("strong");
    label.textContent = skin.name;

    card.append(thumb, label);
    card.addEventListener("click", () => {
      if (!currentAccount || !accounts[currentAccount]) {
        return;
      }
      ensureAccountCosmetics(accounts[currentAccount]);
      accounts[currentAccount].selectedSkins[activeSkinCategory] = skin.id;
      saveAccounts();
      renderSkinSelection();
      setMenuNote(`已选择${activeSkinCategory === "rifle" ? "突击步枪" : "小手枪"}皮肤：${skin.name}。`);
    });
    skinGrid.appendChild(card);
  }
}

function openSkinSelection(category = "rifle") {
  activeSkinCategory = category;
  menuHome.classList.add("is-hidden");
  skinScreen.classList.remove("is-hidden");
  renderSkinSelection();
  setMenuNote(`当前已解锁 ${getUnlockedSkinCount(category)} 把${category === "rifle" ? "突击步枪" : "小手枪"}皮肤。每赢一局会再解锁一把。`);
}

function closeSkinSelection() {
  skinScreen.classList.add("is-hidden");
  menuHome.classList.remove("is-hidden");
  setMenuNote("已返回主菜单。点击“排位赛”开始正式匹配。");
}

function getRankInfoByWins(wins) {
  if (wins >= 100) {
    return { name: "深渊王者", badge: "☬", color: "#7a5cff", nextWins: null, nextName: null };
  }
  if (wins >= 70) {
    return { name: "传奇王者", badge: "✹", color: "#ff8c42", nextWins: 100, nextName: "深渊王者" };
  }
  if (wins >= 50) {
    return { name: "非凡王者", badge: "✪", color: "#52e0c4", nextWins: 70, nextName: "传奇王者" };
  }
  if (wins >= 30) {
    return { name: "绝世王者", badge: "✺", color: "#7bd6ff", nextWins: 50, nextName: "非凡王者" };
  }
  if (wins >= 20) {
    return { name: "无双王者", badge: "✷", color: "#ff5fa2", nextWins: 30, nextName: "绝世王者" };
  }
  if (wins >= 10) {
    return { name: "最强王者", badge: "✸", color: "#ff4d4d", nextWins: 20, nextName: "无双王者" };
  }
  if (wins >= 5) {
    return { name: "黄金", badge: "✦", color: "#ffd65a", nextWins: 10, nextName: "最强王者" };
  }
  if (wins >= 2) {
    return { name: "白银", badge: "❖", color: "#d7e5f1", nextWins: 5, nextName: "黄金" };
  }
  return { name: "青铜", badge: "⬢", color: "#c88a5b", nextWins: 2, nextName: "白银" };
}

function getRankTierValue(wins) {
  if (wins >= 100) return 8;
  if (wins >= 70) return 7;
  if (wins >= 50) return 6;
  if (wins >= 30) return 5;
  if (wins >= 20) return 4;
  if (wins >= 10) return 3;
  if (wins >= 5) return 2;
  if (wins >= 2) return 1;
  return 0;
}

function getDifficultyProfileByWins(wins) {
  if (wins >= 100) {
    return {
      label: "深渊王者",
      enemy: { speed: 1.38, aim: 0.58, fireRate: 0.64, search: 0.68 },
      ally: { speed: 0.84, aim: 1.24, fireRate: 1.18, search: 1.14 },
    };
  }
  if (wins >= 70) {
    return {
      label: "传奇王者",
      enemy: { speed: 1.33, aim: 0.61, fireRate: 0.68, search: 0.71 },
      ally: { speed: 0.86, aim: 1.21, fireRate: 1.16, search: 1.12 },
    };
  }
  if (wins >= 50) {
    return {
      label: "非凡王者",
      enemy: { speed: 1.29, aim: 0.65, fireRate: 0.71, search: 0.73 },
      ally: { speed: 0.88, aim: 1.19, fireRate: 1.14, search: 1.1 },
    };
  }
  if (wins >= 30) {
    return {
      label: "绝世王者",
      enemy: { speed: 1.27, aim: 0.67, fireRate: 0.73, search: 0.75 },
      ally: { speed: 0.89, aim: 1.17, fireRate: 1.13, search: 1.09 },
    };
  }
  if (wins >= 20) {
    return {
      label: "无双王者",
      enemy: { speed: 1.25, aim: 0.69, fireRate: 0.75, search: 0.76 },
      ally: { speed: 0.9, aim: 1.16, fireRate: 1.12, search: 1.09 },
    };
  }
  if (wins >= 10) {
    return {
      label: "最强王者",
      enemy: { speed: 1.24, aim: 0.7, fireRate: 0.76, search: 0.77 },
      ally: { speed: 0.91, aim: 1.15, fireRate: 1.11, search: 1.08 },
    };
  }
  if (wins >= 5) {
    return {
      label: "黄金",
      enemy: { speed: 1.14, aim: 0.82, fireRate: 0.86, search: 0.86 },
      ally: { speed: 0.96, aim: 1.08, fireRate: 1.06, search: 1.04 },
    };
  }
  if (wins >= 2) {
    return {
      label: "白银",
      enemy: { speed: 1.07, aim: 0.92, fireRate: 0.94, search: 0.94 },
      ally: { speed: 0.99, aim: 1.03, fireRate: 1.02, search: 1.02 },
    };
  }
  return {
    label: "青铜",
    enemy: { speed: 1, aim: 1, fireRate: 1, search: 1 },
    ally: { speed: 1, aim: 1, fireRate: 1, search: 1 },
  };
}

function getAiTuning(team) {
  const profile = getDifficultyProfileByWins(progression.wins);
  return isFriendlyTeam(team, player.team) ? profile.ally : profile.enemy;
}

function playRankUpSound() {
  try {
    audioContext ??= new window.AudioContext();
    if (audioContext.state === "suspended") {
      audioContext.resume();
    }

    const now = audioContext.currentTime;
    const notes = [523.25, 659.25, 783.99];

    notes.forEach((freq, index) => {
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = "triangle";
      oscillator.frequency.setValueAtTime(freq, now + index * 0.08);
      gain.gain.setValueAtTime(0.0001, now + index * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.12, now + index * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.08 + 0.28);
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start(now + index * 0.08);
      oscillator.stop(now + index * 0.08 + 0.3);
    });
  } catch {
    // Audio is optional.
  }
}

function playRankDownSound() {
  try {
    audioContext ??= new window.AudioContext();
    if (audioContext.state === "suspended") {
      audioContext.resume();
    }

    const now = audioContext.currentTime;
    const notes = [392, 311.13, 233.08];

    notes.forEach((freq, index) => {
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = "sawtooth";
      oscillator.frequency.setValueAtTime(freq, now + index * 0.1);
      gain.gain.setValueAtTime(0.0001, now + index * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.09, now + index * 0.1 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.1 + 0.32);
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start(now + index * 0.1);
      oscillator.stop(now + index * 0.1 + 0.34);
    });
  } catch {
    // Audio is optional.
  }
}

function showRankToast(rankInfo) {
  if (!rankToast || !rankToastBadge || !rankToastTitle) {
    return;
  }

  rankToastBadge.textContent = rankInfo.badge;
  rankToastBadge.style.color = rankInfo.color;
  rankToastTitle.textContent = `晋升${rankInfo.name}`;
  rankToast.classList.add("is-visible");
  if (rankToastTimer) {
    window.clearTimeout(rankToastTimer);
  }
  rankToastTimer = window.setTimeout(() => {
    rankToast.classList.remove("is-visible");
  }, 2600);
}

function createWeaponState(weaponKey) {
  const weapon = WEAPONS[weaponKey];
  return {
    weaponKey,
    ammo: weapon.magSize,
    reserveAmmo: weapon.reserveAmmo,
  };
}

function syncWeaponFromSlot(target) {
  const slot = target.weaponSlots?.[target.activeWeaponSlot ?? 0];
  if (!slot) {
    return;
  }
  const weapon = WEAPONS[slot.weaponKey];
  target.weaponKey = slot.weaponKey;
  target.magSize = weapon.magSize;
  target.ammo = slot.ammo;
  target.reserveAmmo = slot.reserveAmmo;
  target.reloadTime = weapon.reloadTime;
  if (target === player) {
    target.fireInterval = weapon.fireInterval;
  }
}

function syncActiveWeaponToSlot(target) {
  const slot = target.weaponSlots?.[target.activeWeaponSlot ?? 0];
  if (!slot) {
    return;
  }
  slot.weaponKey = target.weaponKey;
  slot.ammo = target.ammo;
  slot.reserveAmmo = target.reserveAmmo;
}

function initializeWeaponInventory(target, primaryKey = "rifle", secondaryKey = "pistol") {
  target.weaponSlots = [
    createWeaponState(primaryKey),
    createWeaponState(secondaryKey),
  ];
  target.activeWeaponSlot = 0;
  syncWeaponFromSlot(target);
}

function switchWeaponSlot(target, slotIndex) {
  if (!target.weaponSlots || !target.weaponSlots[slotIndex] || target.activeWeaponSlot === slotIndex) {
    return false;
  }
  syncActiveWeaponToSlot(target);
  target.activeWeaponSlot = slotIndex;
  target.reloadTimer = 0;
  syncWeaponFromSlot(target);
  return true;
}

function togglePlayerWeapon() {
  if (!player.alive || !game.running) {
    return;
  }
  const nextSlot = player.activeWeaponSlot === 0 ? 1 : 0;
  if (switchWeaponSlot(player, nextSlot)) {
    const weapon = WEAPONS[player.weaponKey];
    promptText.textContent = `已切换到 ${weapon.name}。按 Q 可在两把枪之间切换。`;
    updateHud();
  }
}

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function isWall(x, y) {
  const mx = Math.floor(x);
  const my = Math.floor(y);
  if (mx < 0 || my < 0 || mx >= MAP_W || my >= MAP_H) {
    return true;
  }
  return map[my][mx] === 1;
}

function collidesWithWall(x, y, radius) {
  const minX = Math.floor(x - radius);
  const maxX = Math.floor(x + radius);
  const minY = Math.floor(y - radius);
  const maxY = Math.floor(y + radius);

  for (let my = minY; my <= maxY; my += 1) {
    for (let mx = minX; mx <= maxX; mx += 1) {
      if (mx < 0 || my < 0 || mx >= MAP_W || my >= MAP_H || map[my][mx] !== 1) {
        continue;
      }

      const nearestX = Math.max(mx, Math.min(x, mx + 1));
      const nearestY = Math.max(my, Math.min(y, my + 1));
      const dx = x - nearestX;
      const dy = y - nearestY;
      if ((dx * dx) + (dy * dy) < radius * radius) {
        return true;
      }
    }
  }

  return false;
}

function clampToWalkable(x, y, radius = 0.24) {
  let nextX = Math.max(1 + radius, Math.min(MAP_W - 1 - radius, x));
  let nextY = Math.max(1 + radius, Math.min(MAP_H - 1 - radius, y));
  const startedColliding = collidesWithWall(nextX, nextY, radius);

  if (!startedColliding) {
    return { x: nextX, y: nextY };
  }

  const pushDirections = [
    [1, 0], [-1, 0], [0, 1], [0, -1],
    [0.7, 0.7], [0.7, -0.7], [-0.7, 0.7], [-0.7, -0.7],
  ];

  function canResolveWithoutCrossingWall(fromX, fromY, toX, toY) {
    const dx = toX - fromX;
    const dy = toY - fromY;
    const dist = Math.hypot(dx, dy);
    const steps = Math.max(2, Math.ceil(dist / 0.04));

    for (let i = 1; i <= steps; i += 1) {
      const t = i / steps;
      const sampleX = fromX + dx * t;
      const sampleY = fromY + dy * t;
      if (collidesWithWall(sampleX, sampleY, radius)) {
        return false;
      }
    }

    return true;
  }

  let nearestCandidate = null;
  let nearestDistance = Infinity;

  for (let distance = 0.06; distance <= 1.4; distance += 0.06) {
    for (const [dx, dy] of pushDirections) {
      const candidateX = Math.max(1 + radius, Math.min(MAP_W - 1 - radius, x + dx * distance));
      const candidateY = Math.max(1 + radius, Math.min(MAP_H - 1 - radius, y + dy * distance));
      if (collidesWithWall(candidateX, candidateY, radius)) {
        continue;
      }

      const candidateDistance = Math.hypot(candidateX - nextX, candidateY - nextY);
      if (candidateDistance < nearestDistance) {
        nearestDistance = candidateDistance;
        nearestCandidate = { x: candidateX, y: candidateY };
      }

      if (
        startedColliding
        || canResolveWithoutCrossingWall(nextX, nextY, candidateX, candidateY)
      ) {
        return { x: candidateX, y: candidateY };
      }
    }
  }

  if (nearestCandidate) {
    return nearestCandidate;
  }

  return { x: nextX, y: nextY };
}

function isWalkableCell(mx, my) {
  return mx >= 0 && my >= 0 && mx < MAP_W && my < MAP_H && map[my][mx] === 0;
}

function getTeamSpawnPoints(team) {
  if (team === "blue") {
    return [[2.5, 2.5], [3.5, 5.5], [5.5, 3.5], [4.5, 7.5]];
  }
  return [[21.5, 21.5], [20.5, 18.5], [18.5, 20.5], [19.5, 16.5]];
}

function isPositionClearForPlayer(x, y, radius = 0.22, excludeUnit = null) {
  if (collidesWithWall(x, y, radius)) {
    return false;
  }

  for (const unit of units) {
    if (unit === excludeUnit || !isUnitActive(unit)) {
      continue;
    }
    if (Math.hypot(unit.x - x, unit.y - y) < radius + 0.24) {
      return false;
    }
  }

  return true;
}

function findNearbyPlayerEscapePoint() {
  const radius = 0.22;
  const directions = [
    [1, 0], [-1, 0], [0, 1], [0, -1],
    [0.8, 0.8], [0.8, -0.8], [-0.8, 0.8], [-0.8, -0.8],
  ];

  for (const distance of [0.35, 0.6, 0.9, 1.2]) {
    for (const [dx, dy] of directions) {
      const candidateX = player.x + dx * distance;
      const candidateY = player.y + dy * distance;
      const candidate = clampToWalkable(candidateX, candidateY, radius);
      if (isPositionClearForPlayer(candidate.x, candidate.y, radius)) {
        return candidate;
      }
    }
  }

  return null;
}

function measureWallClearance(x, y, radius = 0.22) {
  let clearance = 0;
  for (let distance = 0.08; distance <= 0.72; distance += 0.08) {
    const samples = [
      [x + distance, y],
      [x - distance, y],
      [x, y + distance],
      [x, y - distance],
    ];
    if (samples.some(([sx, sy]) => collidesWithWall(sx, sy, radius))) {
      break;
    }
    clearance = distance;
  }
  return clearance;
}

function scoreRespawnCandidate(x, y) {
  let nearestFriendly = Infinity;
  let nearestEnemy = Infinity;

  for (const unit of units) {
    if (!isUnitActive(unit)) continue;
    const dist = Math.hypot(unit.x - x, unit.y - y);
    if (isFriendlyTeam(unit.team, player.team)) {
      nearestFriendly = Math.min(nearestFriendly, dist);
    } else {
      nearestEnemy = Math.min(nearestEnemy, dist);
    }
  }

  const wallClearance = measureWallClearance(x, y);
  return wallClearance * 3 + Math.min(nearestEnemy, 6) * 1.4 + Math.min(nearestFriendly, 3) * 0.35;
}

function findSafeRespawnPoint(anchors, team) {
  const radius = 0.22;
  const candidateOffsets = [
    [0, 0],
    [0.65, 0],
    [-0.65, 0],
    [0, 0.65],
    [0, -0.65],
    [0.9, 0.9],
    [0.9, -0.9],
    [-0.9, 0.9],
    [-0.9, -0.9],
    [1.25, 0],
    [-1.25, 0],
    [0, 1.25],
    [0, -1.25],
  ];
  let bestCandidate = null;
  let bestScore = -Infinity;

  for (const anchor of anchors) {
    for (const [dx, dy] of candidateOffsets) {
      const targetX = anchor.x + dx;
      const targetY = anchor.y + dy;
      const candidate = clampToWalkable(targetX, targetY, radius);
      if (!isPositionClearForPlayer(candidate.x, candidate.y, radius, anchor.unit ?? null)) {
        continue;
      }
      if (anchor.requireSight && !lineOfSight(anchor.x, anchor.y, candidate.x, candidate.y)) {
        continue;
      }
      const score = scoreRespawnCandidate(candidate.x, candidate.y);
      if (score > bestScore) {
        bestScore = score;
        bestCandidate = candidate;
      }
    }
  }

  if (bestCandidate) {
    return bestCandidate;
  }

  const fallbackSpawns = getTeamSpawnPoints(team);
  for (const [x, y] of fallbackSpawns) {
    const candidate = clampToWalkable(x, y, radius);
    if (isPositionClearForPlayer(candidate.x, candidate.y, radius)) {
      return candidate;
    }
  }

  const fallback = clampToWalkable(anchors[0].x, anchors[0].y, radius);
  return fallback;
}

function separatePlayerFromFriendlies() {
  const radius = 0.22;
  for (const unit of units) {
    if (!isUnitActive(unit)) {
      continue;
    }

    const dx = player.x - unit.x;
    const dy = player.y - unit.y;
    const dist = Math.hypot(dx, dy);
    const minDist = 0.5;

    if (dist > 0.001 && dist < minDist) {
      const push = minDist - dist;
      const tryDistances = [push, push * 0.65, push * 0.35];
      let moved = false;

      for (const amount of tryDistances) {
        const candidateX = player.x + (dx / dist) * amount;
        const candidateY = player.y + (dy / dist) * amount;
        if (isPositionClearForPlayer(candidateX, candidateY, radius, unit)) {
          player.x = candidateX;
          player.y = candidateY;
          moved = true;
          break;
        }
      }
    }
  }

  if (collidesWithWall(player.x, player.y, radius)) {
    const escape = findNearbyPlayerEscapePoint();
    if (escape) {
      player.x = escape.x;
      player.y = escape.y;
    } else {
      const corrected = clampToWalkable(player.x, player.y, radius);
      player.x = corrected.x;
      player.y = corrected.y;
    }
  }
}

function isPositionClearForUnit(unit, x, y, radius = 0.24, ignoreUnit = null) {
  if (collidesWithWall(x, y, radius)) {
    return false;
  }

  if (player.alive && Math.hypot(player.x - x, player.y - y) < radius + 0.22) {
    return false;
  }

  for (const other of units) {
    if (other === unit || other === ignoreUnit || !isUnitActive(other)) {
      continue;
    }
    if (Math.hypot(other.x - x, other.y - y) < radius + 0.24) {
      return false;
    }
  }

  return true;
}

function separateUnitFromOthers(unit) {
  const radius = 0.24;

  for (const other of units) {
    if (other === unit || !isUnitActive(other)) continue;

    const pushDx = unit.x - other.x;
    const pushDy = unit.y - other.y;
    const pushDist = Math.hypot(pushDx, pushDy);
    const minDist = 0.46;
    if (pushDist <= 0.001 || pushDist >= minDist) {
      continue;
    }

    const push = minDist - pushDist;
    const tryDistances = [push, push * 0.65, push * 0.35];
    let moved = false;

    for (const amount of tryDistances) {
      const candidateX = unit.x + (pushDx / pushDist) * amount;
      const candidateY = unit.y + (pushDy / pushDist) * amount;
      if (isPositionClearForUnit(unit, candidateX, candidateY, radius, other)) {
        unit.x = candidateX;
        unit.y = candidateY;
        moved = true;
        break;
      }
    }
  }
}

function findNearbyEscapePoint(unit) {
  const radius = 0.24;
  const directions = [
    [1, 0], [-1, 0], [0, 1], [0, -1],
    [0.9, 0.9], [0.9, -0.9], [-0.9, 0.9], [-0.9, -0.9],
  ];

  for (const distance of [0.7, 1.1, 1.5]) {
    for (const [dx, dy] of directions) {
      const candidateX = unit.x + dx * distance;
      const candidateY = unit.y + dy * distance;
      const candidate = clampToWalkable(candidateX, candidateY, radius);
      if (isPositionClearForUnit(unit, candidate.x, candidate.y, radius)) {
        return candidate;
      }
    }
  }

  return null;
}

function tryUnitSidestep(unit, moveTarget) {
  if (!moveTarget) {
    return false;
  }

  const radius = 0.24;
  const dx = moveTarget.x - unit.x;
  const dy = moveTarget.y - unit.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 0.001) {
    return false;
  }

  const sideX = -dy / dist;
  const sideY = dx / dist;
  const options = [
    [sideX, sideY],
    [-sideX, -sideY],
  ];

  for (const [sx, sy] of options) {
    for (const amount of [0.45, 0.75, 1.05]) {
      const candidateX = unit.x + sx * amount;
      const candidateY = unit.y + sy * amount;
      const candidate = clampToWalkable(candidateX, candidateY, radius);
      if (isPositionClearForUnit(unit, candidate.x, candidate.y, radius)) {
        unit.x = candidate.x;
        unit.y = candidate.y;
        return true;
      }
    }
  }

  return false;
}

function findPathWaypoint(startX, startY, targetX, targetY) {
  const startCellX = Math.floor(startX);
  const startCellY = Math.floor(startY);
  const targetCellX = Math.floor(targetX);
  const targetCellY = Math.floor(targetY);

  if (
    !isWalkableCell(startCellX, startCellY)
    || !isWalkableCell(targetCellX, targetCellY)
  ) {
    return null;
  }

  if (startCellX === targetCellX && startCellY === targetCellY) {
    return { x: targetCellX + 0.5, y: targetCellY + 0.5 };
  }

  const queue = [[startCellX, startCellY]];
  const visited = Array.from({ length: MAP_H }, () => Array(MAP_W).fill(false));
  const previous = Array.from({ length: MAP_H }, () => Array(MAP_W).fill(null));
  visited[startCellY][startCellX] = true;

  const directions = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ];

  while (queue.length > 0) {
    const [cx, cy] = queue.shift();
    if (cx === targetCellX && cy === targetCellY) {
      break;
    }

    for (const [dx, dy] of directions) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (!isWalkableCell(nx, ny) || visited[ny][nx]) {
        continue;
      }
      visited[ny][nx] = true;
      previous[ny][nx] = [cx, cy];
      queue.push([nx, ny]);
    }
  }

  if (!visited[targetCellY][targetCellX]) {
    return null;
  }

  let cx = targetCellX;
  let cy = targetCellY;
  while (previous[cy][cx] && !(previous[cy][cx][0] === startCellX && previous[cy][cx][1] === startCellY)) {
    [cx, cy] = previous[cy][cx];
  }

  return { x: cx + 0.5, y: cy + 0.5 };
}

function resolveUnitMoveTarget(unit, moveTarget, delta) {
  if (!moveTarget) {
    return moveTarget;
  }

  unit.pathTimer = Math.max(0, (unit.pathTimer ?? 0) - delta);

  if (lineOfSight(unit.x, unit.y, moveTarget.x, moveTarget.y)) {
    unit.pathWaypointX = moveTarget.x;
    unit.pathWaypointY = moveTarget.y;
    unit.pathTimer = 0;
    return moveTarget;
  }

  const targetMoved = Math.hypot(
    (unit.pathTargetX ?? moveTarget.x) - moveTarget.x,
    (unit.pathTargetY ?? moveTarget.y) - moveTarget.y,
  ) > 1.2;

  if (
    unit.pathTimer <= 0
    || targetMoved
    || unit.pathWaypointX == null
    || unit.pathWaypointY == null
    || Math.hypot(unit.x - unit.pathWaypointX, unit.y - unit.pathWaypointY) < 0.45
  ) {
    const waypoint = findPathWaypoint(unit.x, unit.y, moveTarget.x, moveTarget.y);
    unit.pathTargetX = moveTarget.x;
    unit.pathTargetY = moveTarget.y;
    unit.pathTimer = 0.3;
    if (waypoint) {
      unit.pathWaypointX = waypoint.x;
      unit.pathWaypointY = waypoint.y;
    } else {
      unit.pathWaypointX = moveTarget.x;
      unit.pathWaypointY = moveTarget.y;
    }
  }

  return {
    ...moveTarget,
    x: unit.pathWaypointX,
    y: unit.pathWaypointY,
  };
}

function tryMove(dx, dy) {
  const radius = 0.2;
  const nextX = player.x + dx;
  const nextY = player.y + dy;
  if (!collidesWithWall(nextX, player.y, radius)) {
    player.x = nextX;
  }
  if (!collidesWithWall(player.x, nextY, radius)) {
    player.y = nextY;
  }

  const corrected = clampToWalkable(player.x, player.y, radius);
  player.x = corrected.x;
  player.y = corrected.y;
}

function normalizeAngle(angle) {
  while (angle < -Math.PI) angle += Math.PI * 2;
  while (angle > Math.PI) angle -= Math.PI * 2;
  return angle;
}

function raycast(angle, maxDepth = 20) {
  const sin = Math.sin(angle);
  const cos = Math.cos(angle);

  for (let depth = 0; depth < maxDepth; depth += 0.02) {
    const x = player.x + cos * depth;
    const y = player.y + sin * depth;
    if (isWall(x, y)) {
      return { depth, x, y };
    }
  }

  return { depth: maxDepth, x: player.x + cos * maxDepth, y: player.y + sin * maxDepth };
}

function lineOfSight(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.hypot(dx, dy);
  const steps = Math.max(1, Math.floor(dist / 0.08));

  for (let i = 1; i < steps; i += 1) {
    const t = i / steps;
    if (isWall(x1 + dx * t, y1 + dy * t)) {
      return false;
    }
  }

  return true;
}

function isFriendlyTeam(teamA, teamB) {
  return teamA === teamB;
}

function isUnitActive(unit) {
  return unit.alive && !unit.downed;
}

function teamHasLivingMember(team, excludeUnit = null) {
  if (team === player.team && player.alive) {
    return true;
  }

  return units.some((unit) => unit !== excludeUnit && isUnitActive(unit) && unit.team === team);
}

function teamHasRemainingCombatants(team, excludeUnit = null) {
  if (team === player.team && player.alive) {
    return true;
  }

  return units.some((unit) => (
    unit !== excludeUnit
    && unit.team === team
    && (
      isUnitActive(unit)
      || (!unit.alive && unit.dead && unit.respawnTimer > 0)
    )
  ));
}

function applyWeaponLoadout(target, weaponKey) {
  if (!target.weaponSlots) {
    initializeWeaponInventory(target, weaponKey, "pistol");
    return;
  }
  const slotIndex = target.activeWeaponSlot ?? 0;
  target.weaponSlots[slotIndex] = createWeaponState(weaponKey);
  syncWeaponFromSlot(target);
}

function createUnit(x, y, team, role = "assault", slot = 0) {
  const spawn = clampToWalkable(x, y, 0.24);
  const tuning = getAiTuning(team);
  const unit = {
    id: `unit-${team}-${slot}-${units.length}`,
    x: spawn.x,
    y: spawn.y,
    team,
    role,
    slot,
    health: 100,
    speed: (1.1 + Math.random() * 0.4 + game.wave * 0.05) * tuning.speed,
    fireCooldown: (1 + Math.random()) * tuning.fireRate,
    alive: true,
    downed: false,
    dead: false,
    respawnTimer: 0,
    hitFlash: 0,
    hurtTilt: 0,
    aimAngle: 0,
    muzzleFlash: 0,
    searchX: spawn.x,
    searchY: spawn.y,
    searchTimer: 0,
    reviveTimer: 18,
    reviveProgress: 0,
    tacticX: spawn.x,
    tacticY: spawn.y,
    respawnX: spawn.x,
    respawnY: spawn.y,
    pathTimer: 0,
    pathTargetX: spawn.x,
    pathTargetY: spawn.y,
    pathWaypointX: spawn.x,
    pathWaypointY: spawn.y,
    lastX: spawn.x,
    lastY: spawn.y,
    stuckTimer: 0,
    underFireTimer: 0,
    evadeX: spawn.x,
    evadeY: spawn.y,
    aimMultiplier: tuning.aim,
    fireRateMultiplier: tuning.fireRate,
    searchRateMultiplier: tuning.search,
    chatCooldown: 1.2 + Math.random() * 2,
    lastChatTag: "",
    lastChatAt: -99,
    lowHealthCalled: false,
  };
  initializeWeaponInventory(unit, "rifle", "pistol");
  registerParticipant(unit, getUnitCallsign(unit));
  units.push(unit);
}

function getTeamAdvancePoint(team) {
  if (team === "blue") {
    return { x: 19.5, y: 19.5 };
  }
  return { x: 4.5, y: 4.5 };
}

function refreshSearchTarget(unit) {
  const base = getTeamAdvancePoint(unit.team);
  unit.searchX = base.x + (Math.random() - 0.5) * 6;
  unit.searchY = base.y + (Math.random() - 0.5) * 6;
  unit.searchX = Math.max(MIN_BATTLE_X, Math.min(MAX_BATTLE_X, unit.searchX));
  unit.searchY = Math.max(MIN_BATTLE_Y, Math.min(MAX_BATTLE_Y, unit.searchY));
  unit.searchTimer = (2.6 + Math.random() * 2.2) * (unit.searchRateMultiplier ?? 1);
}

function spawnWave() {
  const allySpawns = player.team === "blue"
    ? [[3.5, 3.5], [3.5, 6.5], [6.5, 3.5], [4.5, 8.5], [7.5, 5.5], [8.5, 7.5]]
    : [[20.5, 20.5], [20.5, 17.5], [17.5, 20.5], [19.5, 15.5], [16.5, 18.5], [15.5, 20.5]];
  const enemySpawns = player.team === "blue"
    ? [[20.5, 20.5], [20.5, 17.5], [17.5, 20.5], [19.5, 15.5], [16.5, 18.5], [15.5, 20.5], [18.5, 13.5]]
    : [[3.5, 3.5], [3.5, 6.5], [6.5, 3.5], [4.5, 8.5], [7.5, 5.5], [8.5, 7.5], [5.5, 10.5]];
  const allyTeam = player.team;
  const enemyTeam = allyTeam === "blue" ? "red" : "blue";
  const allyCount = 6;
  const enemyCount = 7;
  const allyRoles = ["point", "flank-left", "flank-right", "support", "support", "point"];

  for (let i = 0; i < allyCount; i += 1) {
    const [x, y] = allySpawns[i % allySpawns.length];
    createUnit(x, y, allyTeam, allyRoles[i] ?? "support", i);
  }

  for (let i = 0; i < enemyCount; i += 1) {
    const [x, y] = enemySpawns[i % enemySpawns.length];
    createUnit(x, y, enemyTeam, "assault", i);
  }
}

function getRandomDropPoint() {
  const dropPoints = [
    { x: 12, y: 12 },
    { x: 8.5, y: 12.5 },
    { x: 15.5, y: 11.5 },
    { x: 12.5, y: 8.5 },
    { x: 11.5, y: 15.5 },
    { x: 6.5, y: 16.5 },
    { x: 17.5, y: 7.5 },
  ];
  const point = dropPoints[Math.floor(Math.random() * dropPoints.length)];
  return clampToWalkable(point.x, point.y, 0.22);
}

function spawnMedDrop() {
  const drop = getRandomDropPoint();
  medDrops.length = 0;
  medDrops.push({
    x: drop.x,
    y: drop.y,
    pulse: 0,
  });
  game.medDropTimer = 40;
  promptText.textContent = "医疗空投已降落，靠近可恢复生命值。";
}

function spawnWeaponDrop() {
  const drop = getRandomDropPoint();
  const weaponKey = WEAPON_POOL[Math.floor(Math.random() * WEAPON_POOL.length)];
  weaponDrops.length = 0;
  weaponDrops.push({
    x: drop.x,
    y: drop.y,
    pulse: 0,
    weaponKey,
  });
  game.weaponDropTimer = 30;
  promptText.textContent = `武器掉落已出现：${WEAPONS[weaponKey].name}。`;
}

function pickupMedDrop(target) {
  if (medDrops.length === 0) {
    return;
  }
  target.health = target.maxHealth ?? 100;
  if (target === player) {
    promptText.textContent = "你拾取了医疗空投，生命值已恢复。";
  } else {
    target.lowHealthCalled = false;
    tryUnitChat(target, "拿到医疗空投，状态恢复。", "med-picked", 7.5);
  }
  medDrops.length = 0;
  game.medDropTimer = 40;
}

function pickupWeaponDrop(target) {
  if (weaponDrops.length === 0) {
    return;
  }
  const drop = weaponDrops[0];
  const inactiveSlot = target.activeWeaponSlot === 0 ? 1 : 0;
  target.weaponSlots[inactiveSlot] = createWeaponState(drop.weaponKey);
  if (target === player) {
    syncActiveWeaponToSlot(player);
  } else {
    switchWeaponSlot(target, inactiveSlot);
  }
  if (target === player) {
    promptText.textContent = `你拾取了武器掉落，副武器变为 ${WEAPONS[drop.weaponKey].name}。按 Q 可切换。`;
  } else {
    tryUnitChat(target, `我捡到${WEAPONS[drop.weaponKey].name}了。`, "weapon-picked", 8);
  }
  weaponDrops.length = 0;
  game.weaponDropTimer = 30;
}

function getFormationTarget(unit) {
  const offsets = {
    point: { forward: 2.2, side: 0 },
    "flank-left": { forward: 0.8, side: -1.9 },
    "flank-right": { forward: 0.8, side: 1.9 },
    support: { forward: -1.4, side: 1.2 },
  };
  const offset = offsets[unit.role] ?? offsets.support;
  const forwardX = Math.cos(player.angle);
  const forwardY = Math.sin(player.angle);
  const sideX = Math.cos(player.angle + Math.PI / 2);
  const sideY = Math.sin(player.angle + Math.PI / 2);

  return {
    x: Math.max(MIN_BATTLE_X, Math.min(MAX_BATTLE_X, player.x + forwardX * offset.forward + sideX * offset.side)),
    y: Math.max(MIN_BATTLE_Y, Math.min(MAX_BATTLE_Y, player.y + forwardY * offset.forward + sideY * offset.side)),
  };
}

function findCoverPosition(unit, targetX, targetY) {
  let best = null;
  let bestScore = Infinity;
  const originX = Math.floor(unit.x);
  const originY = Math.floor(unit.y);

  for (let my = originY - 3; my <= originY + 3; my += 1) {
    for (let mx = originX - 3; mx <= originX + 3; mx += 1) {
      if (mx < 0 || my < 0 || mx >= MAP_W || my >= MAP_H || map[my][mx] !== 1) continue;
      const candidates = [
        { x: mx - 0.5, y: my + 0.5 },
        { x: mx + 1.5, y: my + 0.5 },
        { x: mx + 0.5, y: my - 0.5 },
        { x: mx + 0.5, y: my + 1.5 },
      ];

      for (const candidate of candidates) {
        if (collidesWithWall(candidate.x, candidate.y, 0.24)) continue;
        if (lineOfSight(candidate.x, candidate.y, targetX, targetY)) continue;
        const distToUnit = Math.hypot(candidate.x - unit.x, candidate.y - unit.y);
        const distToTarget = Math.hypot(candidate.x - targetX, candidate.y - targetY);
        const score = distToUnit + distToTarget * 0.22;
        if (score < bestScore) {
          bestScore = score;
          best = candidate;
        }
      }
    }
  }

  return best;
}

function markUnitUnderFire(unit, sourceX, sourceY, duration = 1.2) {
  unit.underFireTimer = Math.max(unit.underFireTimer ?? 0, duration);
  unit.evadeX = sourceX;
  unit.evadeY = sourceY;
}

function getIncomingThreat(unit) {
  let best = null;
  let bestDist = Infinity;

  for (const projectile of projectiles) {
    if (isFriendlyTeam(projectile.team, unit.team)) continue;

    const relX = unit.x - projectile.x;
    const relY = unit.y - projectile.y;
    const dist = Math.hypot(relX, relY);
    if (dist > 1.8) continue;

    const projectileDir = Math.hypot(projectile.dx, projectile.dy) || 1;
    const towardUnit = ((relX / Math.max(dist, 0.001)) * (projectile.dx / projectileDir))
      + ((relY / Math.max(dist, 0.001)) * (projectile.dy / projectileDir));

    if (towardUnit < 0.55) continue;

    if (dist < bestDist) {
      bestDist = dist;
      best = {
        x: projectile.x,
        y: projectile.y,
        dist,
      };
    }
  }

  return best;
}

function findEvadePosition(unit, threatX, threatY) {
  const dx = unit.x - threatX;
  const dy = unit.y - threatY;
  const dist = Math.hypot(dx, dy);
  const sideX = -dy / Math.max(dist, 0.001);
  const sideY = dx / Math.max(dist, 0.001);
  const backX = dx / Math.max(dist, 0.001);
  const backY = dy / Math.max(dist, 0.001);

  const candidates = [
    { x: unit.x + sideX * 1.1, y: unit.y + sideY * 1.1 },
    { x: unit.x - sideX * 1.1, y: unit.y - sideY * 1.1 },
    { x: unit.x + backX * 1.15, y: unit.y + backY * 1.15 },
    { x: unit.x + sideX * 0.7 + backX * 0.9, y: unit.y + sideY * 0.7 + backY * 0.9 },
    { x: unit.x - sideX * 0.7 + backX * 0.9, y: unit.y - sideY * 0.7 + backY * 0.9 },
  ];

  for (const candidate of candidates) {
    const corrected = clampToWalkable(candidate.x, candidate.y, 0.24);
    if (!collidesWithWall(corrected.x, corrected.y, 0.24)) {
      return corrected;
    }
  }

  return null;
}

function getFriendlyTacticalTarget(unit, target) {
  if (squadCommand && squadCommand.expiresAt <= game.elapsed) {
    squadCommand = null;
  }

  if (squadCommand?.type === "med" && medDrops.length > 0 && unit.health < 75) {
    return { ...medDrops[0] };
  }

  if (squadCommand?.type === "regroup") {
    return getFormationTarget(unit);
  }

  if (squadCommand?.type === "push") {
    const advance = getTeamAdvancePoint(unit.team);
    return findCoverPosition(unit, advance.x, advance.y) ?? advance;
  }

  if ((unit.underFireTimer ?? 0) > 0.08) {
    const cover = findCoverPosition(unit, unit.evadeX ?? target.x, unit.evadeY ?? target.y);
    if (cover) {
      return cover;
    }

    const evade = findEvadePosition(unit, unit.evadeX ?? target.x, unit.evadeY ?? target.y);
    if (evade) {
      return evade;
    }
  }

  const dx = target.x - unit.x;
  const dy = target.y - unit.y;
  const dist = Math.hypot(dx, dy);
  const normX = dx / Math.max(dist, 0.001);
  const normY = dy / Math.max(dist, 0.001);
  const sideX = -normY;
  const sideY = normX;

  if (unit.role === "point") {
    return findCoverPosition(unit, target.x, target.y) ?? {
      x: unit.x + normX * 1.3,
      y: unit.y + normY * 1.3,
    };
  }

  if (unit.role === "flank-left" || unit.role === "flank-right") {
    const side = unit.role === "flank-left" ? -1 : 1;
    const flank = {
      x: Math.max(MIN_BATTLE_X, Math.min(MAX_BATTLE_X, target.x + sideX * side * 2.4 - normX * 1.2)),
      y: Math.max(MIN_BATTLE_Y, Math.min(MAX_BATTLE_Y, target.y + sideY * side * 2.4 - normY * 1.2)),
    };
    return isWall(flank.x, flank.y) ? (findCoverPosition(unit, target.x, target.y) ?? flank) : flank;
  }

  return findCoverPosition(unit, target.x, target.y) ?? getFormationTarget(unit);
}

function showHitIndicator() {
  hitIndicator.classList.add("is-active");
  window.setTimeout(() => hitIndicator.classList.remove("is-active"), 80);
}

function updateAiBattleChatter(unit, target) {
  if (unit.health < 45 && !unit.lowHealthCalled) {
    unit.lowHealthCalled = true;
    const lowHealthMessage = medDrops.length > 0 ? "我残了，去拿医疗空投。" : "我快撑不住了，需要补血。";
    tryUnitChat(unit, lowHealthMessage, "low-health", 7);
    return;
  }

  if (unit.health > 72) {
    unit.lowHealthCalled = false;
  }

  if ((unit.underFireTimer ?? 0) > 0.95) {
    tryUnitChat(unit, "火力太猛，我先找掩体。", "under-fire", 6);
    return;
  }

  if (target && target.type === "player" && target.dist < 6.5) {
    const line = isFriendlyTeam(unit.team, player.team)
      ? "看到敌人了，准备压制。"
      : "发现目标，给我压上。";
    tryUnitChat(unit, line, "contact-player", 6.5);
    return;
  }

  if (squadCommand?.type === "regroup" && isFriendlyTeam(unit.team, player.team) && Math.hypot(unit.x - player.x, unit.y - player.y) > 4.6) {
    tryUnitChat(unit, "正在向你靠拢，别掉队。", "regroup-move", 7);
    return;
  }

  if (squadCommand?.type === "push" && isFriendlyTeam(unit.team, player.team) && target && target.dist > 4.5) {
    tryUnitChat(unit, "收到推进命令，往前压。", "push-order", 7);
  }
}

function updateHud() {
  accountName.textContent = currentAccount ?? "-";
  ammoCount.textContent = `${player.ammo} / ${player.reserveAmmo}`;
  const weapon = WEAPONS[player.weaponKey];
  const slotA = WEAPONS[player.weaponSlots?.[0]?.weaponKey ?? "rifle"];
  const slotB = WEAPONS[player.weaponSlots?.[1]?.weaponKey ?? "pistol"];
  const slotLabel = `1:${slotA.name}${player.activeWeaponSlot === 0 ? "*" : ""}  2:${slotB.name}${player.activeWeaponSlot === 1 ? "*" : ""}`;
  weaponState.textContent = player.reloadTimer > 0
    ? `${weapon.name} / 正在换弹 / ${slotLabel}`
    : player.aimProgress > 0.4
      ? `${weapon.name} / 瞄准中 / ${slotLabel}`
      : `${TEAMS[player.team].name} / ${weapon.name} / Q切枪 / ${slotLabel}`;
  healthCount.textContent = `${Math.max(0, Math.ceil(player.health))}%`;
  healthFill.style.transform = `scaleX(${Math.max(0, player.health / player.maxHealth)})`;
  killCount.textContent = `${game.kills}`;
  const enemyLeft = units.filter((unit) => unit.alive && !isFriendlyTeam(unit.team, player.team)).length;
  waveCount.textContent = `${enemyLeft}`;
  timerCount.textContent = `${Math.max(0, Math.ceil(game.timer))}`;
  teamName.textContent = TEAMS[player.team].name;
  teamName.style.color = TEAMS[player.team].color;
  const rankLabel = rankCount.previousElementSibling;
  const badgeLabel = rankBadge.previousElementSibling;
  const winsLabel = winCount.previousElementSibling;
  if (game.mode === "practice") {
    rankCount.style.display = "none";
    rankBadge.style.display = "none";
    winCount.style.display = "none";
    rankProgress.style.display = "none";
    if (rankLabel) rankLabel.style.display = "none";
    if (badgeLabel) badgeLabel.style.display = "none";
    if (winsLabel) winsLabel.style.display = "none";
  } else {
    rankCount.style.display = "";
    rankBadge.style.display = "";
    winCount.style.display = "";
    rankProgress.style.display = "";
    if (rankLabel) rankLabel.style.display = "";
    if (badgeLabel) badgeLabel.style.display = "";
    if (winsLabel) winsLabel.style.display = "";
    const rankInfo = getRankInfoByWins(progression.wins);
    rankCount.textContent = rankInfo.name;
    rankBadge.textContent = rankInfo.badge;
    rankBadge.style.color = rankInfo.color;
    winCount.textContent = `${progression.wins}`;
    rankProgress.textContent = rankInfo.nextWins == null
      ? "已达到最高段位"
      : `再赢 ${Math.max(0, rankInfo.nextWins - progression.wins)} 局晋升${rankInfo.nextName}`;
  }
  chatToggle.disabled = !currentAccount;
  chatInput.disabled = !currentAccount;
  chatSend.disabled = !currentAccount;
}

function beginReload() {
  if (player.reloadTimer > 0 || player.ammo > 0 || player.reserveAmmo <= 0) {
    return;
  }
  player.reloadTimer = player.reloadTime;
}

function finishReload() {
  const need = player.magSize - player.ammo;
  const amount = Math.min(need, player.reserveAmmo);
  player.ammo += amount;
  player.reserveAmmo -= amount;
  syncActiveWeaponToSlot(player);
}

function applyDamage(amount, source = null) {
  if (!game.running || !player.alive) {
    return;
  }
  const actualDamage = Math.min(amount, player.health);
  if (source && actualDamage > 0) {
    recordDamageEvent(source, player, actualDamage);
  }
  player.health -= amount;
  player.damageFlash = 1;
  if (player.health <= 0) {
    defeatPlayer(source);
  }
}

function fireWeapon() {
  if (!game.running || !player.alive || player.fireCooldown > 0 || player.reloadTimer > 0) {
    return;
  }
  if (player.ammo <= 0) {
    beginReload();
    return;
  }

  player.ammo -= 1;
  syncActiveWeaponToSlot(player);
  const weapon = WEAPONS[player.weaponKey];
  player.fireCooldown = weapon.fireInterval;
  player.recoil = Math.min(player.recoil + 1.1, 2.8);
  player.recoilKick = Math.min(player.recoilKick + weapon.recoilKick, 2.8);
  player.muzzleFlash = 1;
  player.shotSpread = Math.min(player.shotSpread + weapon.shotSpreadGain, 1.5);
  player.pitch = Math.max(-0.9, Math.min(0.9, player.pitch - 0.028));

  const pellets = weapon.pellets ?? 1;
  let anyHit = false;

  for (let pellet = 0; pellet < pellets; pellet += 1) {
    const spread = (player.aimProgress > 0.4 ? weapon.spreadAim : weapon.spreadHip) + player.shotSpread * 0.018;
    const verticalSpread = (player.aimProgress > 0.4 ? weapon.verticalAim : weapon.verticalHip) + player.shotSpread * 0.012;
    const shotAngle = player.angle + (Math.random() - 0.5) * spread;
    const shotPitch = player.pitch + (Math.random() - 0.5) * verticalSpread;

    if (weapon.projectileSpeed > 0) {
      projectiles.push({
        x: player.x,
        y: player.y,
        dx: Math.cos(shotAngle),
        dy: Math.sin(shotAngle),
        life: 2.2,
        team: player.team,
        ownerId: player.id,
        damage: weapon.damageNear,
        explosive: true,
        explosionRadius: weapon.explosionRadius ?? 1,
        speed: weapon.projectileSpeed,
      });
      anyHit = true;
      continue;
    }

    let bestEnemy = null;
    let bestDistance = Infinity;
    let bestPitchDelta = Infinity;

    for (const unit of units) {
      if (!unit.alive || isFriendlyTeam(unit.team, player.team)) continue;
      const dx = unit.x - player.x;
      const dy = unit.y - player.y;
      const distance = Math.hypot(dx, dy);
      const angleToEnemy = Math.atan2(dy, dx);
      const delta = Math.abs(normalizeAngle(angleToEnemy - shotAngle));
      const targetPitch = Math.atan2(0.16, Math.max(distance, 0.01));
      const pitchDelta = Math.abs(targetPitch - shotPitch);

      if (
        delta < 0.09
        && pitchDelta < 0.22
        && lineOfSight(player.x, player.y, unit.x, unit.y)
        && (distance < bestDistance || (Math.abs(distance - bestDistance) < 0.15 && pitchDelta < bestPitchDelta))
      ) {
        bestEnemy = unit;
        bestDistance = distance;
        bestPitchDelta = pitchDelta;
      }
    }

    if (bestEnemy) {
      const damage = bestDistance < 3 ? weapon.damageNear : weapon.damageFar;
      recordDamageEvent(player, bestEnemy, Math.min(damage, bestEnemy.health));
      bestEnemy.health -= damage;
      bestEnemy.hitFlash = 1;
      bestEnemy.hurtTilt = 1;
      anyHit = true;
      if (bestEnemy.health <= 0) {
        defeatUnit(bestEnemy, player);
      }
    } else {
      const hit = raycast(shotAngle, 20);
      hitMarks.push({ x: hit.x, y: hit.y, life: 0.3 });
    }
  }

  if (anyHit) {
    showHitIndicator();
  }

  const enemyTeam = player.team === "blue" ? "red" : "blue";
  if (!teamHasRemainingCombatants(enemyTeam)) {
    endGame(true, "敌方七人全部被清除，你们小队拿下了本局交战。");
  }
}

function endGame(success, text) {
  game.running = false;
  game.ended = true;
  setChatOpen(false);
  const previousWins = progression.wins;
  const summary = buildMatchSummary();
  const playerWasBest = summary.best?.isPlayer ?? false;
  let bonusWins = 0;
  if (game.mode === "ranked") {
    if (success) {
      progression.wins += 1;
    } else {
      progression.wins = Math.max(0, progression.wins - 1);
    }
    if (playerWasBest) {
      bonusWins = 3;
      progression.wins += bonusWins;
    }
    saveProgression();
  }
  const currentRank = getRankInfoByWins(progression.wins);
  const previousTier = getRankTierValue(previousWins);
  const currentTier = getRankTierValue(progression.wins);
  if (game.mode === "ranked" && currentTier > previousTier) {
    playRankUpSound();
    showRankToast(currentRank);
  }
  if (game.mode === "ranked" && currentTier < previousTier) {
    playRankDownSound();
  }
  const summaryNote = game.mode === "ranked"
    ? playerWasBest
      ? `你是本局综合最佳，额外奖励 ${bonusWins} 胜场。当前累计胜场 ${progression.wins}。`
      : `本局综合最佳：${summary.best?.name ?? "无"}。当前累计胜场 ${progression.wins}。`
    : `练习场仅展示本局统计，不计入段位与胜场。本局综合最佳：${summary.best?.name ?? "无"}。`;
  renderMatchSummary(summary, summaryNote);
  resultTitle.textContent = success ? (game.mode === "ranked" ? "排位获胜" : "训练结束") : (game.mode === "ranked" ? "行动失败" : "练习结束");
  resultText.textContent = game.mode === "ranked"
    ? `${text} 当前累计胜场 ${progression.wins}，当前段位 ${currentRank.name}。`
    : `${text} 当前为练习场模式，本局不计入段位与胜场。`;
  summaryOverlay.classList.add("overlay--active");
  resultOverlay.classList.remove("overlay--active");
  updateHud();
}

function resetGame(mode = "ranked") {
  units.length = 0;
  projectiles.length = 0;
  hitMarks.length = 0;
  medDrops.length = 0;
  weaponDrops.length = 0;
  squadCommand = null;
  chatAnnounceCooldown = 0;
  clearChatMessages();
  resetParticipantTracking();

  game.running = true;
  game.ended = false;
  game.mode = mode;
  game.timer = 300;
  game.elapsed = 0;
  game.kills = 0;
  game.wave = 1;
  game.respawnTimer = 0;
  game.medDropTimer = 40;
  game.weaponDropTimer = 30;
  player.team = Math.random() < 0.5 ? "blue" : "red";

  if (player.team === "blue") {
    player.x = 2.5;
    player.y = 2.5;
    player.angle = 0.35;
  } else {
    player.x = 21.5;
    player.y = 21.5;
    player.angle = -2.7;
  }
  player.pitch = 0;
  player.alive = true;
  player.health = 100;
  player.aimProgress = 0;
  player.damageFlash = 0;
  player.recoil = 0;
  player.recoilKick = 0;
  player.muzzleFlash = 0;
  player.moveBob = 0;
  player.moveBlend = 0;
  player.shotSpread = 0;
  player.fov = Math.PI / 3;
  player.reloadTimer = 0;
  player.fireCooldown = 0;
  initializeWeaponInventory(player, "rifle", "pistol");

  const difficultyProfile = getDifficultyProfileByWins(progression.wins);
  if (mode === "ranked") {
    objectiveText.textContent = `两队固定 7 人。你已加入 ${TEAMS[player.team].name}，歼灭敌方全队。当前段位 ${difficultyProfile.label}，段位越高敌军越强。`;
    promptText.textContent = "排位赛已开始。你现在可携带两把枪，按 Q 切换武器。";
  } else {
    objectiveText.textContent = `练习场模式。你已加入 ${TEAMS[player.team].name}，本局不计胜场与段位，可自由热身熟悉地图。`;
    promptText.textContent = "练习场已开始。这里不会影响段位，适合先热身和试枪。";
  }
  damageMask.style.opacity = "0";
  resultOverlay.classList.remove("overlay--active");
  summaryOverlay.classList.remove("overlay--active");
  setChatOpen(false);

  spawnWave();
  updateHud();
}

function updatePlayer(delta) {
  player.fireCooldown = Math.max(0, player.fireCooldown - delta);
  player.damageFlash = Math.max(0, player.damageFlash - delta * 2.4);
  player.recoil = Math.max(0, player.recoil - delta * 6.2);
  player.recoilKick = Math.max(0, player.recoilKick - delta * 8.5);
  player.muzzleFlash = Math.max(0, player.muzzleFlash - delta * 12);
  player.shotSpread = Math.max(0, player.shotSpread - delta * (player.aimProgress > 0.45 ? 1.9 : 1.15));

  if (player.reloadTimer > 0) {
    player.reloadTimer -= delta;
    if (player.reloadTimer <= 0) {
      finishReload();
    }
  }

  player.aimProgress += ((keys.has("MouseRight") ? 1 : 0) - player.aimProgress) * Math.min(1, delta * 10);
  player.fov += (((Math.PI / 3) - player.aimProgress * 0.2) - player.fov) * Math.min(1, delta * 9);

  if (!player.alive) {
    updateCrosshair();
    damageMask.style.opacity = `${player.damageFlash * 0.85}`;
    return;
  }

  const move = (keys.has("ShiftLeft") || keys.has("ShiftRight")) ? player.sprintSpeed : player.moveSpeed;
  const moveX = Math.cos(player.angle);
  const moveY = Math.sin(player.angle);
  const strafeX = Math.cos(player.angle + Math.PI / 2);
  const strafeY = Math.sin(player.angle + Math.PI / 2);
  let moving = false;
  if (keys.has("KeyW")) tryMove(moveX * move * delta, moveY * move * delta);
  if (keys.has("KeyS")) tryMove(-moveX * move * delta, -moveY * move * delta);
  if (keys.has("KeyA")) tryMove(-strafeX * move * delta, -strafeY * move * delta);
  if (keys.has("KeyD")) tryMove(strafeX * move * delta, strafeY * move * delta);
  separatePlayerFromFriendlies();
  moving = keys.has("KeyW") || keys.has("KeyS") || keys.has("KeyA") || keys.has("KeyD");
  player.moveBlend += ((moving ? 1 : 0) - player.moveBlend) * Math.min(1, delta * 10);
  player.moveBob += delta * (move / player.moveSpeed) * (moving ? 10 : 2.5);

  if (inputState.firing) {
    fireWeapon();
  }

  updateCrosshair();
  damageMask.style.opacity = `${player.damageFlash * 0.85}`;
}

function getUnitTarget(unit) {
  let best = null;
  let bestDistance = Infinity;

  const playerDistance = Math.hypot(player.x - unit.x, player.y - unit.y);
  if (!isFriendlyTeam(unit.team, player.team) && player.health > 0 && lineOfSight(unit.x, unit.y, player.x, player.y)) {
    best = { type: "player", x: player.x, y: player.y, dist: playerDistance };
    bestDistance = playerDistance;
  }

  for (const other of units) {
    if (!isUnitActive(other) || other === unit || isFriendlyTeam(other.team, unit.team)) continue;
    const dist = Math.hypot(other.x - unit.x, other.y - unit.y);
    if (dist < bestDistance && lineOfSight(unit.x, unit.y, other.x, other.y)) {
      best = { type: "unit", unit: other, x: other.x, y: other.y, dist };
      bestDistance = dist;
    }
  }

  return best;
}

function applyProjectileDamage(projectile, amount) {
  const attacker = participantLookup.get(projectile.ownerId) ?? null;
  if (!isFriendlyTeam(projectile.team, player.team) && Math.hypot(projectile.x - player.x, projectile.y - player.y) < 0.28) {
    applyDamage(amount, attacker);
    return true;
  }

  for (const unit of units) {
    if (!isUnitActive(unit) || isFriendlyTeam(unit.team, projectile.team)) continue;
    if (Math.hypot(projectile.x - unit.x, projectile.y - unit.y) < 0.28) {
      recordDamageEvent(attacker, unit, Math.min(amount, unit.health));
      unit.health -= amount;
      unit.hitFlash = 1;
      unit.hurtTilt = 1;
      markUnitUnderFire(unit, projectile.x, projectile.y, 1.45);
      if (unit.health <= 0) {
        defeatUnit(unit, attacker);
      }
      return true;
    }
  }

  return false;
}

function applyExplosionDamage(projectile) {
  if (!projectile.explosive) {
    return false;
  }

  let hit = false;
  const radius = projectile.explosionRadius ?? 1;
  const attacker = participantLookup.get(projectile.ownerId) ?? null;
  if (!isFriendlyTeam(projectile.team, player.team) && player.alive && Math.hypot(projectile.x - player.x, projectile.y - player.y) < radius) {
    applyDamage(projectile.damage ?? 80, attacker);
    hit = true;
  }

  for (const unit of units) {
    if (!isUnitActive(unit) || isFriendlyTeam(unit.team, projectile.team)) continue;
    if (Math.hypot(projectile.x - unit.x, projectile.y - unit.y) < radius) {
      const damage = projectile.damage ?? 80;
      recordDamageEvent(attacker, unit, Math.min(damage, unit.health));
      unit.health -= damage;
      unit.hitFlash = 1;
      unit.hurtTilt = 1;
      markUnitUnderFire(unit, projectile.x, projectile.y, 1.6);
      if (unit.health <= 0) {
        defeatUnit(unit, attacker);
      }
      hit = true;
    }
  }

  return hit;
}

function updateRespawn(delta) {
  if (player.alive) {
    return;
  }

  const survivingFriendlies = units.filter((unit) => isFriendlyTeam(unit.team, player.team) && isUnitActive(unit));
  if (survivingFriendlies.length === 0) {
    endGame(false, "团灭。你所在的小队已经没有一人存活。");
    return;
  }

  game.respawnTimer -= delta;
  promptText.textContent = `你已阵亡，${Math.max(0, Math.ceil(game.respawnTimer))} 秒后复活。`;

  if (game.respawnTimer <= 0) {
    const anchors = survivingFriendlies.map((unit) => ({
      x: unit.x,
      y: unit.y,
      unit,
      requireSight: true,
    }));
    for (const [x, y] of getTeamSpawnPoints(player.team)) {
      anchors.push({ x, y, unit: null, requireSight: false });
    }
    const spawn = findSafeRespawnPoint(anchors, player.team);
    player.x = spawn.x;
    player.y = spawn.y;
    player.alive = true;
    player.health = player.maxHealth;
    player.reloadTimer = 0;
    player.fireCooldown = 0;
    player.damageFlash = 0;
    separatePlayerFromFriendlies();
    promptText.textContent = "你已重新部署，继续作战。";
  }
}

function updateDrops(delta) {
  game.medDropTimer -= delta;
  game.weaponDropTimer -= delta;

  if (game.medDropTimer <= 0 && medDrops.length === 0) {
    spawnMedDrop();
  }

  if (game.weaponDropTimer <= 0 && weaponDrops.length === 0) {
    spawnWeaponDrop();
  }

  for (const drop of medDrops) {
    drop.pulse += delta;
  }

  for (const drop of weaponDrops) {
    drop.pulse += delta;
  }

  if (medDrops.length > 0) {
    const drop = medDrops[0];
    if (player.alive && Math.hypot(player.x - drop.x, player.y - drop.y) < 0.9) {
      pickupMedDrop(player);
      return;
    }

    for (const unit of units) {
      if (!isUnitActive(unit)) continue;
      if (Math.hypot(unit.x - drop.x, unit.y - drop.y) < 0.9) {
        pickupMedDrop(unit);
        return;
      }
    }
  }

  if (weaponDrops.length > 0) {
    const drop = weaponDrops[0];
    if (player.alive && Math.hypot(player.x - drop.x, player.y - drop.y) < 0.9) {
      pickupWeaponDrop(player);
      return;
    }

    for (const unit of units) {
      if (!isUnitActive(unit)) continue;
      if (Math.hypot(unit.x - drop.x, unit.y - drop.y) < 0.9) {
        pickupWeaponDrop(unit);
        return;
      }
    }
  }
}

function updateUnitRespawns(delta) {
  for (const unit of units) {
    if (unit.alive || !unit.dead || unit.respawnTimer <= 0) {
      continue;
    }

    if (!teamHasRemainingCombatants(unit.team, unit)) {
      unit.respawnTimer = 0;
      continue;
    }

    unit.respawnTimer -= delta;
    if (unit.respawnTimer <= 0) {
      const respawn = clampToWalkable(unit.respawnX, unit.respawnY, 0.24);
      unit.x = respawn.x;
      unit.y = respawn.y;
      unit.alive = true;
      unit.dead = false;
      unit.health = 100;
      unit.hitFlash = 0;
      unit.hurtTilt = 0;
      unit.fireCooldown = 1.1;
      unit.searchTimer = 0;
      unit.respawnTimer = 0;
    }
  }

  if (medDrops.length > 0) {
    promptText.textContent = "医疗空投已落地，靠近即可恢复生命值。";
  } else if (weaponDrops.length > 0) {
    const drop = weaponDrops[0];
    promptText.textContent = `武器掉落已落地：${WEAPONS[drop.weaponKey].name}，敌我双方都可拾取。`;
  } else if (player.alive) {
    promptText.textContent = "敌我双方都会在 5 秒后复活，直到对应队伍被团灭。";
  }
}

function updateUnits(delta) {
  chatAnnounceCooldown = Math.max(0, chatAnnounceCooldown - delta);
  if (squadCommand && squadCommand.expiresAt <= game.elapsed) {
    squadCommand = null;
  }

  for (const unit of units) {
    if (!unit.alive || unit.downed) continue;
    const previousX = unit.x;
    const previousY = unit.y;
    unit.hitFlash = Math.max(0, unit.hitFlash - delta * 3.8);
    unit.hurtTilt = Math.max(0, unit.hurtTilt - delta * 5);
    unit.muzzleFlash = Math.max(0, unit.muzzleFlash - delta * 10);
    unit.searchTimer -= delta;
    unit.underFireTimer = Math.max(0, (unit.underFireTimer ?? 0) - delta);
    unit.chatCooldown = Math.max(0, (unit.chatCooldown ?? 0) - delta);

    if (isFriendlyTeam(unit.team, player.team)) {
      const incomingThreat = getIncomingThreat(unit);
      if (incomingThreat) {
        markUnitUnderFire(unit, incomingThreat.x, incomingThreat.y, 0.85);
      }
    }

    const target = getUnitTarget(unit);
    let moveTarget = target;

    if (isFriendlyTeam(unit.team, player.team)) {
      moveTarget = target
        ? { ...target, ...getFriendlyTacticalTarget(unit, target) }
        : getFormationTarget(unit);
    } else if (!moveTarget) {
      const searchDistance = Math.hypot(unit.searchX - unit.x, unit.searchY - unit.y);
      if (unit.searchTimer <= 0 || searchDistance < 0.7) {
        refreshSearchTarget(unit);
      }
      moveTarget = { x: unit.searchX, y: unit.searchY, dist: Math.hypot(unit.searchX - unit.x, unit.searchY - unit.y) };
    }

    updateAiBattleChatter(unit, target);

    moveTarget = resolveUnitMoveTarget(unit, moveTarget, delta);

    const dx = moveTarget.x - unit.x;
    const dy = moveTarget.y - unit.y;
    const dist = Math.hypot(dx, dy);
    unit.aimAngle = Math.atan2(dy, dx);

    if (dist > 0.35 && (!target || dist > 2.6)) {
      const stepX = (dx / Math.max(dist, 0.001)) * unit.speed * delta;
      const stepY = (dy / Math.max(dist, 0.001)) * unit.speed * delta;
      const radius = 0.24;
      if (!collidesWithWall(unit.x + stepX, unit.y, radius)) unit.x += stepX;
      if (!collidesWithWall(unit.x, unit.y + stepY, radius)) unit.y += stepY;
      const corrected = clampToWalkable(unit.x, unit.y, radius);
      unit.x = corrected.x;
      unit.y = corrected.y;
    }

    separateUnitFromOthers(unit);

    if (collidesWithWall(unit.x, unit.y, 0.24)) {
      const corrected = clampToWalkable(unit.x, unit.y, 0.24);
      unit.x = corrected.x;
      unit.y = corrected.y;
      unit.searchTimer = 0;
    }

    const movedDistance = Math.hypot(unit.x - previousX, unit.y - previousY);
    if (dist > 0.35 && movedDistance < 0.015) {
      unit.stuckTimer += delta;
    } else {
      unit.stuckTimer = 0;
    }

    if (unit.stuckTimer > 0.22) {
      const sidestepped = tryUnitSidestep(unit, moveTarget);
      if (!sidestepped) {
        const escape = findNearbyEscapePoint(unit);
        if (escape) {
          unit.pathWaypointX = escape.x;
          unit.pathWaypointY = escape.y;
          const nudgeDx = escape.x - unit.x;
          const nudgeDy = escape.y - unit.y;
          const nudgeDist = Math.hypot(nudgeDx, nudgeDy);
          if (nudgeDist > 0.001) {
            const nudgeAmount = Math.min(0.18, nudgeDist);
            const candidateX = unit.x + (nudgeDx / nudgeDist) * nudgeAmount;
            const candidateY = unit.y + (nudgeDy / nudgeDist) * nudgeAmount;
            if (isPositionClearForUnit(unit, candidateX, candidateY, 0.24)) {
              unit.x = candidateX;
              unit.y = candidateY;
            }
          }
        }
      }
      unit.pathTimer = 0;
      unit.searchTimer = 0;
      unit.stuckTimer = 0;
    }

    unit.lastX = unit.x;
    unit.lastY = unit.y;

    unit.fireCooldown -= delta;
    if (
      target
      && dist < 8
      && unit.fireCooldown <= 0
      && lineOfSight(unit.x, unit.y, target.x, target.y)
      && !((unit.underFireTimer ?? 0) > 0.32 && isFriendlyTeam(unit.team, player.team))
    ) {
      const weapon = WEAPONS[unit.weaponKey ?? "rifle"];
      const spread = (weapon.spreadHip + Math.random() * 0.04) * (unit.aimMultiplier ?? 1);
      const shotAngle = unit.aimAngle + (Math.random() - 0.5) * spread;
      projectiles.push({
        x: unit.x,
        y: unit.y,
        dx: Math.cos(shotAngle),
        dy: Math.sin(shotAngle),
        life: weapon.projectileSpeed > 0 ? 2.2 : 1.5,
        team: unit.team,
        ownerId: unit.id,
        damage: weapon.damageFar,
        explosive: weapon.projectileSpeed > 0,
        explosionRadius: weapon.explosionRadius ?? 1,
        speed: weapon.projectileSpeed > 0 ? weapon.projectileSpeed : undefined,
      });
      unit.fireCooldown = (weapon.fireInterval + Math.random() * 0.35) * (unit.fireRateMultiplier ?? 1);
      unit.muzzleFlash = 1;
    }
  }

  updateUnitRespawns(delta);

  const enemyTeam = player.team === "blue" ? "red" : "blue";
  if (!teamHasRemainingCombatants(enemyTeam)) {
    endGame(true, "敌方七人全部被清除，你们小队拿下了本局交战。");
  }
}

function updateProjectiles(delta) {
  for (let i = projectiles.length - 1; i >= 0; i -= 1) {
    const p = projectiles[i];
    const speed = p.speed ?? 6.5;
    p.x += p.dx * delta * speed;
    p.y += p.dy * delta * speed;
    p.life -= delta;

    if (applyProjectileDamage(p, p.damage ?? (10 + Math.random() * 8))) {
      projectiles.splice(i, 1);
      continue;
    }

    if ((p.explosive && (p.life <= 0 || isWall(p.x, p.y)))) {
      applyExplosionDamage(p);
      hitMarks.push({ x: p.x, y: p.y, life: 0.45 });
      projectiles.splice(i, 1);
      continue;
    }

    if (p.life <= 0 || isWall(p.x, p.y)) {
      projectiles.splice(i, 1);
    }
  }
}

function updateHitMarks(delta) {
  for (let i = hitMarks.length - 1; i >= 0; i -= 1) {
    hitMarks[i].life -= delta;
    if (hitMarks[i].life <= 0) {
      hitMarks.splice(i, 1);
    }
  }
}

function renderBackground() {
  const lookOffset = player.pitch * canvas.height * 0.32 + player.recoil * 8;
  const horizon = canvas.height * 0.5 + lookOffset;
  const sky = ctx.createLinearGradient(0, 0, 0, horizon);
  sky.addColorStop(0, "#95aec0");
  sky.addColorStop(1, "#c4d4dd");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, canvas.width, horizon);

  const ground = ctx.createLinearGradient(0, horizon, 0, canvas.height);
  ground.addColorStop(0, "#514a43");
  ground.addColorStop(1, "#1b1b1b");
  ctx.fillStyle = ground;
  ctx.fillRect(0, horizon, canvas.width, canvas.height - horizon);
}

function renderWalls() {
  const fov = player.fov;
  const verticalOffset = player.pitch * canvas.height * 0.32 + player.recoil * 8;
  wallDepthBuffer.length = canvas.width;
  for (let x = 0; x < canvas.width; x += 2) {
    const cameraX = (x / canvas.width) - 0.5;
    const angle = player.angle + cameraX * fov;
    const hit = raycast(angle, 20);
    const corrected = hit.depth * Math.cos(angle - player.angle);
    const wallHeight = Math.min(canvas.height, canvas.height / Math.max(corrected, 0.0001));
    const shade = Math.max(30, 190 - corrected * 16);
    ctx.fillStyle = `rgb(${shade}, ${shade + 6}, ${shade + 12})`;
    ctx.fillRect(x, (canvas.height - wallHeight) / 2 + verticalOffset, 2, wallHeight);
    wallDepthBuffer[x] = corrected;
    wallDepthBuffer[x + 1] = corrected;
  }
}

function renderSprites() {
  const sprites = [];
  const fov = player.fov;
  const verticalOffset = player.pitch * canvas.height * 0.32 + player.recoil * 8;

  for (const unit of units) {
    if (!unit.alive) continue;
    if (!lineOfSight(player.x, player.y, unit.x, unit.y)) continue;
    const dx = unit.x - player.x;
    const dy = unit.y - player.y;
    const dist = Math.hypot(dx, dy);
    const rel = normalizeAngle(Math.atan2(dy, dx) - player.angle);
    if (Math.abs(rel) > fov) continue;
    const teamStyle = TEAMS[unit.team];
    const friendly = isFriendlyTeam(unit.team, player.team);
    sprites.push({
      type: "unit",
      x: unit.x,
      y: unit.y,
      dist,
      rel,
      color: unit.hitFlash > 0 ? teamStyle.bright : teamStyle.color,
      flash: unit.hitFlash,
      hurtTilt: unit.hurtTilt,
      health: unit.health,
      friendly,
      muzzleFlash: unit.muzzleFlash,
      teamColor: teamStyle.color,
      teamBright: teamStyle.bright,
      downed: unit.downed,
      role: unit.role,
      reviveProgress: unit.reviveProgress,
    });
  }

  for (const p of projectiles) {
    if (!lineOfSight(player.x, player.y, p.x, p.y)) continue;
    const dx = p.x - player.x;
    const dy = p.y - player.y;
    const dist = Math.hypot(dx, dy);
    const rel = normalizeAngle(Math.atan2(dy, dx) - player.angle);
    if (Math.abs(rel) > fov) continue;
    sprites.push({ type: "projectile", x: p.x, y: p.y, dist, rel, color: TEAMS[p.team].muzzle });
  }

  sprites.sort((a, b) => b.dist - a.dist);

  for (const sprite of sprites) {
    const screenX = (0.5 + sprite.rel / fov) * canvas.width;
    const wallDepth = wallDepthBuffer[Math.max(0, Math.min(canvas.width - 1, Math.round(screenX)))] ?? Infinity;
    if (sprite.dist > wallDepth + 0.06) continue;
    const size = sprite.type === "unit"
      ? Math.min(canvas.height * 0.75, canvas.height / sprite.dist)
      : Math.max(6, canvas.height / (sprite.dist * 5));
    const y = canvas.height * 0.5 - size * 0.5 + verticalOffset;

    ctx.fillStyle = sprite.color;
    if (sprite.type === "unit") {
      const bodyTilt = sprite.hurtTilt * 0.16;
      ctx.save();
      ctx.translate(screenX, y + size * 0.42);
      ctx.rotate(sprite.downed ? Math.PI * 0.48 : bodyTilt);
      ctx.fillRect(-size * 0.22, -size * 0.2, size * 0.44, sprite.downed ? size * 0.24 : size * 0.55);
      ctx.beginPath();
      ctx.arc(0, sprite.downed ? -size * 0.02 : -size * 0.26, size * 0.14, 0, Math.PI * 2);
      ctx.fillStyle = "#f0d7c9";
      ctx.fill();
      ctx.fillStyle = sprite.color;
      ctx.fillRect(-size * 0.28, -size * 0.04, size * 0.56, size * 0.08);
      if (sprite.flash > 0) {
        ctx.strokeStyle = `rgba(255, 240, 180, ${sprite.flash * 0.9})`;
        ctx.lineWidth = Math.max(2, size * 0.03);
        ctx.strokeRect(-size * 0.28, -size * 0.3, size * 0.56, size * 0.72);
      }
      if (!sprite.downed && sprite.muzzleFlash > 0) {
        ctx.strokeStyle = `rgba(255,255,255,${sprite.muzzleFlash * 0.8})`;
        ctx.lineWidth = Math.max(2, size * 0.04);
        ctx.beginPath();
        ctx.moveTo(size * 0.24, -size * 0.02);
        ctx.lineTo(size * 0.46, -size * 0.02);
        ctx.stroke();
      }
      ctx.restore();

      const healthRatio = Math.max(0, sprite.health / 100);
      const barWidth = Math.max(34, size * 0.54);
      const barHeight = Math.max(7, size * 0.065);
      const barX = screenX - barWidth * 0.5;
      const barY = y - Math.max(16, size * 0.16);
      ctx.fillStyle = "rgba(4, 8, 10, 0.88)";
      ctx.fillRect(barX - 2, barY - 2, barWidth + 4, barHeight + 4);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.22)";
      ctx.lineWidth = 1;
      ctx.strokeRect(barX - 2, barY - 2, barWidth + 4, barHeight + 4);
      ctx.fillStyle = "rgba(22, 28, 31, 0.95)";
      ctx.fillRect(barX, barY, barWidth, barHeight);
      ctx.fillStyle = sprite.teamColor;
      ctx.fillRect(barX, barY, barWidth * healthRatio, barHeight);
      ctx.fillStyle = sprite.friendly ? sprite.teamBright : "#ffd8cf";
      ctx.font = `${Math.max(10, size * 0.1)}px sans-serif`;
      ctx.textAlign = "center";
      const tag = sprite.downed ? "DOWNED" : (sprite.friendly ? sprite.role.toUpperCase() : "HOSTILE");
      ctx.fillText(tag, screenX, barY - 8);
      if (sprite.downed) {
        ctx.strokeStyle = sprite.teamBright;
        ctx.strokeRect(barX, barY + barHeight + 6, barWidth, 6);
        ctx.fillStyle = sprite.teamBright;
        ctx.fillRect(barX, barY + barHeight + 6, barWidth * Math.min(1, sprite.reviveProgress / 1.6), 6);
      }
    } else {
      ctx.beginPath();
      ctx.arc(screenX, canvas.height * 0.5 + verticalOffset, size * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function renderWeapon() {
  const w = canvas.width;
  const h = canvas.height;
  const aim = player.aimProgress;
  const weapon = WEAPONS[player.weaponKey];
  const skin = getWeaponSkin(player.weaponKey);
  const skinTheme = getWeaponSkinTheme(player.weaponKey);
  const bobX = Math.cos(player.moveBob) * 10 * player.moveBlend;
  const bobY = Math.abs(Math.sin(player.moveBob * 1.2)) * 8 * player.moveBlend;
  const sizeScale = weapon.key === "pistol" ? 0.62 : weapon.key === "sniper" ? 1.1 : weapon.key === "rocket" ? 1.2 : weapon.key === "shotgun" ? 0.95 : 1;
  const gunW = (180 - aim * 70) * sizeScale;
  const gunH = (110 - aim * 30) * sizeScale;
  const gunX = w * (0.68 - aim * 0.11) + bobX - player.recoilKick * 8;
  const gunY = h * (0.8 - aim * 0.05) + bobY + player.recoilKick * 6;
  const bodyColor = skinTheme?.body ?? "#232a2e";
  const accentColor = skinTheme?.accent ?? "#8cf7ba";
  const slideColor = skinTheme?.slide ?? "#3b474d";
  const gripColor = skinTheme?.grip ?? "#1a2024";
  const glowColor = skinTheme?.glow ?? null;

  ctx.save();
  ctx.translate(gunX + gunW * 0.5, gunY + gunH * 0.5);
  ctx.rotate(-0.08 - player.recoilKick * 0.04);

  if (glowColor) {
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 14;
  }
  ctx.fillStyle = bodyColor;
  ctx.fillRect(-gunW * 0.5, -gunH * 0.5, gunW, gunH);
  ctx.fillStyle = accentColor;
  ctx.fillRect(-gunW * 0.28, -gunH * 0.34, gunW * 0.16, 10);
  ctx.fillStyle = slideColor;
  ctx.fillRect(gunW * 0.18, -gunH * 0.14, gunW * 0.34, 12);
  ctx.fillStyle = gripColor;
  ctx.fillRect(-gunW * 0.08, gunH * 0.02, gunW * 0.18, gunH * 0.42);
  if (skinTheme && weapon.key === "rifle") {
    ctx.fillStyle = accentColor;
    ctx.fillRect(-gunW * 0.44, -gunH * 0.08, gunW * 0.14, gunH * 0.12);
    ctx.fillRect(gunW * 0.04, -gunH * 0.42, gunW * 0.28, gunH * 0.08);
  }
  if (skinTheme && weapon.key === "pistol") {
    ctx.fillStyle = accentColor;
    ctx.fillRect(gunW * 0.12, -gunH * 0.36, gunW * 0.12, gunH * 0.1);
  }

  if (player.muzzleFlash > 0) {
    ctx.fillStyle = `rgba(255, 208, 120, ${player.muzzleFlash * 0.75})`;
    ctx.beginPath();
    ctx.moveTo(gunW * 0.54, -gunH * 0.12);
    ctx.lineTo(gunW * 0.84 + player.muzzleFlash * 22, 0);
    ctx.lineTo(gunW * 0.54, gunH * 0.12);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function renderDrops() {
  for (const drop of medDrops) {
    if (!lineOfSight(player.x, player.y, drop.x, drop.y)) continue;
    const dx = drop.x - player.x;
    const dy = drop.y - player.y;
    const dist = Math.hypot(dx, dy);
    const rel = normalizeAngle(Math.atan2(dy, dx) - player.angle);
    if (Math.abs(rel) > player.fov) continue;
    const screenX = (0.5 + rel / player.fov) * canvas.width;
    const wallDepth = wallDepthBuffer[Math.max(0, Math.min(canvas.width - 1, Math.round(screenX)))] ?? Infinity;
    if (dist > wallDepth + 0.06) continue;

    const size = Math.max(20, canvas.height / (dist * 3.6));
    const y = canvas.height * 0.62 + player.pitch * canvas.height * 0.32;
    const pulse = 1 + Math.sin(drop.pulse * 4.5) * 0.12;
    ctx.save();
    ctx.translate(screenX, y);
    ctx.scale(pulse, pulse);
    ctx.fillStyle = "rgba(102, 242, 156, 0.95)";
    ctx.fillRect(-size * 0.28, -size * 0.18, size * 0.56, size * 0.36);
    ctx.strokeStyle = "rgba(255,255,255,0.55)";
    ctx.strokeRect(-size * 0.28, -size * 0.18, size * 0.56, size * 0.36);
    ctx.fillStyle = "#e8fff1";
    ctx.font = `${Math.max(11, size * 0.18)}px sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText("MED", 0, -size * 0.34);
    ctx.restore();
  }

  for (const drop of weaponDrops) {
    if (!lineOfSight(player.x, player.y, drop.x, drop.y)) continue;
    const dx = drop.x - player.x;
    const dy = drop.y - player.y;
    const dist = Math.hypot(dx, dy);
    const rel = normalizeAngle(Math.atan2(dy, dx) - player.angle);
    if (Math.abs(rel) > player.fov) continue;
    const screenX = (0.5 + rel / player.fov) * canvas.width;
    const wallDepth = wallDepthBuffer[Math.max(0, Math.min(canvas.width - 1, Math.round(screenX)))] ?? Infinity;
    if (dist > wallDepth + 0.06) continue;

    const size = Math.max(20, canvas.height / (dist * 3.6));
    const y = canvas.height * 0.62 + player.pitch * canvas.height * 0.32;
    const pulse = 1 + Math.sin(drop.pulse * 4.5) * 0.12;
    ctx.save();
    ctx.translate(screenX, y);
    ctx.scale(pulse, pulse);
    ctx.fillStyle = "rgba(242, 213, 112, 0.95)";
    ctx.fillRect(-size * 0.28, -size * 0.18, size * 0.56, size * 0.36);
    ctx.strokeStyle = "rgba(255,255,255,0.55)";
    ctx.strokeRect(-size * 0.28, -size * 0.18, size * 0.56, size * 0.36);
    ctx.fillStyle = "#fff4c8";
    ctx.font = `${Math.max(11, size * 0.16)}px sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(WEAPONS[drop.weaponKey].name, 0, -size * 0.34);
    ctx.restore();
  }
}

function updateCrosshair() {
  const spread = 1 + player.shotSpread * 1.3 + (1 - player.aimProgress) * 0.5 + player.moveBlend * 0.65;
  const scale = 1 + spread * 0.18;
  crosshair.style.transform = `translate(-50%, -50%) scale(${scale})`;
  crosshair.style.opacity = `${0.78 - player.aimProgress * 0.22}`;
}

function renderMinimap() {
  const size = 140;
  const cell = size / MAP_W;
  const ox = 18;
  const oy = canvas.height - size - 150;

  ctx.save();
  ctx.globalAlpha = 0.75;
  ctx.fillStyle = "#081014";
  ctx.fillRect(ox, oy, size, size);
  for (let y = 0; y < MAP_H; y += 1) {
    for (let x = 0; x < MAP_W; x += 1) {
      ctx.fillStyle = map[y][x] ? "#54636a" : "#10181b";
      ctx.fillRect(ox + x * cell, oy + y * cell, cell - 1, cell - 1);
    }
  }
  ctx.fillStyle = "#8cf7ba";
  const playerTeam = TEAMS[player.team];
  ctx.fillStyle = playerTeam.color;
  ctx.beginPath();
  ctx.arc(ox + player.x * cell, oy + player.y * cell, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = playerTeam.color;
  ctx.beginPath();
  ctx.moveTo(ox + player.x * cell, oy + player.y * cell);
  ctx.lineTo(
    ox + (player.x + Math.cos(player.angle) * 0.8) * cell,
    oy + (player.y + Math.sin(player.angle) * 0.8) * cell,
  );
  ctx.stroke();
  for (const unit of units) {
    if (!unit.alive) continue;
    ctx.fillStyle = TEAMS[unit.team].color;
    ctx.beginPath();
    ctx.arc(ox + unit.x * cell, oy + unit.y * cell, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  for (const drop of medDrops) {
    const dx = ox + drop.x * cell;
    const dy = oy + drop.y * cell;
    ctx.fillStyle = "#67f59d";
    ctx.beginPath();
    ctx.rect(dx - 3, dy - 3, 6, 6);
    ctx.fill();
    ctx.strokeStyle = "#dffff0";
    ctx.lineWidth = 1;
    ctx.strokeRect(dx - 4.5, dy - 4.5, 9, 9);
  }

  for (const drop of weaponDrops) {
    const dx = ox + drop.x * cell;
    const dy = oy + drop.y * cell;
    ctx.fillStyle = "#ffd95a";
    ctx.beginPath();
    ctx.moveTo(dx, dy - 4);
    ctx.lineTo(dx + 4, dy);
    ctx.lineTo(dx, dy + 4);
    ctx.lineTo(dx - 4, dy);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#fff0ae";
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  ctx.restore();
}

function render() {
  renderBackground();
  renderWalls();
  renderSprites();
  renderDrops();
  renderWeapon();
  renderMinimap();
}

function tick(delta) {
  if (game.running) {
    game.elapsed += delta;
    game.timer -= delta;
    if (game.timer <= 0) {
      endGame(false, "倒计时结束，突入训练未达成击杀指标。可以重新部署再试一次。");
    } else {
      updatePlayer(delta);
      updateUnits(delta);
      updateProjectiles(delta);
      updateDrops(delta);
      updateRespawn(delta);
      updateHitMarks(delta);
      updateHud();
    }
  }

  render();
}

window.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    if (!chatOpen && game.running && currentAccount) {
      event.preventDefault();
      toggleChat(true);
      return;
    }
    if (chatOpen && document.activeElement === chatInput) {
      event.preventDefault();
      submitChatMessage();
      return;
    }
  }

  if (event.key === "Escape" && chatOpen) {
    event.preventDefault();
    toggleChat(false);
    return;
  }

  if (chatOpen && document.activeElement === chatInput) {
    return;
  }

  keys.add(event.code);
  if (event.code === "KeyR") beginReload();
  if (event.code === "KeyQ") togglePlayerWeapon();
});

window.addEventListener("keyup", (event) => {
  keys.delete(event.code);
});

window.addEventListener("mousedown", (event) => {
  if (chatOpen || loginOverlay.classList.contains("overlay--active") || startOverlay.classList.contains("overlay--active") || resultOverlay.classList.contains("overlay--active")) {
    return;
  }
  mouseState.active = true;
  if (event.button === 0) {
    inputState.firing = true;
    fireWeapon();
  }
  if (event.button === 2) {
    keys.add("MouseRight");
  }
});

window.addEventListener("mouseup", (event) => {
  if (chatOpen) {
    return;
  }
  mouseState.active = false;
  if (event.button === 0) inputState.firing = false;
  if (event.button === 2) keys.delete("MouseRight");
});

window.addEventListener("mousemove", (event) => {
  if (!game.running) {
    return;
  }

  const yawDelta = event.movementX * 0.0032;
  const pitchDelta = event.movementY * 0.0024;

  if (document.pointerLockElement === canvas) {
    player.angle += yawDelta;
    player.pitch = Math.max(-0.8, Math.min(0.8, player.pitch - pitchDelta));
    return;
  }

  if (mouseState.active) {
    player.angle += yawDelta;
    player.pitch = Math.max(-0.8, Math.min(0.8, player.pitch - pitchDelta));
  }
});

canvas.addEventListener("click", () => {
  if (game.running && canvas.requestPointerLock) {
    canvas.requestPointerLock();
  }
});

window.addEventListener("contextmenu", (event) => event.preventDefault());
window.addEventListener("blur", () => {
  inputState.firing = false;
  mouseState.active = false;
  keys.delete("MouseRight");
});
window.addEventListener("resize", resize);

rankedButton.addEventListener("click", () => {
  startOverlay.classList.remove("overlay--active");
  setMenuNote("排位赛正在部署中。");
  resetGame("ranked");
});

practiceButton.addEventListener("click", () => {
  startOverlay.classList.remove("overlay--active");
  setMenuNote("练习场正在部署中。");
  resetGame("practice");
});

skinButton.addEventListener("click", () => {
  openSkinSelection("rifle");
});

skinBackButton.addEventListener("click", () => {
  closeSkinSelection();
});

skinTabRifle.addEventListener("click", () => {
  activeSkinCategory = "rifle";
  renderSkinSelection();
  setMenuNote(`当前已解锁 ${getUnlockedSkinCount("rifle")} 把突击步枪皮肤。`);
});

skinTabPistol.addEventListener("click", () => {
  activeSkinCategory = "pistol";
  renderSkinSelection();
  setMenuNote(`当前已解锁 ${getUnlockedSkinCount("pistol")} 把小手枪皮肤。`);
});

restartButton.addEventListener("click", () => {
  summaryOverlay.classList.remove("overlay--active");
  resultOverlay.classList.remove("overlay--active");
  resetGame(game.mode);
});

exitSquadButton.addEventListener("click", () => {
  summaryOverlay.classList.remove("overlay--active");
  resultOverlay.classList.remove("overlay--active");
  startOverlay.classList.add("overlay--active");
  menuHome.classList.remove("is-hidden");
  skinScreen.classList.add("is-hidden");
  setChatOpen(false);
  setMenuNote("你已退出当前队伍，返回主菜单。点击“排位赛”或“练习场”可重新开始。");
  updateHud();
});

summaryContinueButton.addEventListener("click", () => {
  summaryOverlay.classList.remove("overlay--active");
  resultOverlay.classList.add("overlay--active");
});

loginButton.addEventListener("click", handleLogin);
registerButton.addEventListener("click", handleRegister);
loginPasswordInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    handleLogin();
  }
});
loginNameInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    handleLogin();
  }
});
chatToggle.addEventListener("click", () => toggleChat());
chatSend.addEventListener("click", submitChatMessage);

resize();
updateHud();
renderChatMessages();
loginNameInput.focus();

let last = performance.now();
let loopErrorCooldown = 0;
function loop(now) {
  const delta = Math.min(0.033, (now - last) / 1000);
  last = now;
  try {
    tick(delta);
  } catch (error) {
    if (loopErrorCooldown <= 0) {
      console.error("Game loop recovered after an error:", error);
      promptText.textContent = "检测到一次战场数据异常，已自动恢复。";
      loopErrorCooldown = 1.5;
    }
  } finally {
    loopErrorCooldown = Math.max(0, loopErrorCooldown - delta);
    requestAnimationFrame(loop);
  }
}
requestAnimationFrame(loop);
