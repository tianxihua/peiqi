const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");

const ui = {
  quickGold: document.querySelector("#quick-gold"),
  quickBuffs: document.querySelector("#quick-buffs"),
  quickRecall: document.querySelector("#quick-recall"),
  quickRecallText: document.querySelector("#quick-recall-text"),
  quickRecallBar: document.querySelector("#quick-recall-bar"),
  hud: document.querySelector(".hud"),
  hudToggle: document.querySelector("#hud-toggle"),
  objective: document.querySelector("#objective-text"),
  level: document.querySelector("#level"),
  gold: document.querySelector("#gold"),
  score: document.querySelector("#score"),
  wave: document.querySelector("#wave"),
  laneName: document.querySelector("#lane-name"),
  hpLabel: document.querySelector("#hp-label"),
  hpBar: document.querySelector("#hp-bar"),
  hpText: document.querySelector("#hp-text"),
  manaBar: document.querySelector("#mana-bar"),
  manaText: document.querySelector("#mana-text"),
  xpBar: document.querySelector("#xp-bar"),
  xpText: document.querySelector("#xp-text"),
  recallBar: document.querySelector("#recall-bar"),
  recallText: document.querySelector("#recall-text"),
  qName: document.querySelector("#q-name"),
  qCd: document.querySelector("#q-cd"),
  eName: document.querySelector("#e-name"),
  eCd: document.querySelector("#e-cd"),
  rName: document.querySelector("#r-name"),
  rCd: document.querySelector("#r-cd"),
  tCd: document.querySelector("#t-cd"),
  heroName: document.querySelector("#hero-name"),
  inventorySlots: document.querySelector("#inventory-slots"),
  shop: document.querySelector("#shop"),
  shopHint: document.querySelector("#shop-hint"),
  shopItems: document.querySelector("#shop-items"),
  shopClose: document.querySelector("#shop-close"),
  startOverlay: document.querySelector("#start-overlay"),
  endOverlay: document.querySelector("#end-overlay"),
  endTag: document.querySelector("#end-tag"),
  endTitle: document.querySelector("#end-title"),
  endText: document.querySelector("#end-text"),
  heroGrid: document.querySelector("#hero-grid"),
  startButton: document.querySelector("#start-button"),
  restartButton: document.querySelector("#restart-button"),
};

const WORLD = {
  width: 2400,
  height: 1500,
  wall: 90,
  fountainRadius: 180,
  shopRadius: 210,
};

const CAMERA = {
  zoom: 0.9,
  lookAhead: 150,
  verticalBias: 70,
};

const COLORS = {
  blue: "#67cbff",
  blueSoft: "#d4f4ff",
  red: "#ff7f72",
  redSoft: "#ffd2c8",
  allyHp: "#78ffb1",
  enemyHp: "#ff5f5f",
  gold: "#ffd36e",
  text: "#eff6fb",
  bg: "#071015",
  jungle: "#123027",
  lane: "#6b5d45",
  river: "#17384b",
  stone: "#203240",
  camp: "#ad7b54",
};

const LANES = [
  {
    key: "top",
    name: "上路",
    points: [
      { x: 220, y: 1260 },
      { x: 240, y: 960 },
      { x: 390, y: 650 },
      { x: 700, y: 360 },
      { x: 1140, y: 230 },
      { x: 1680, y: 210 },
      { x: 2160, y: 220 },
    ],
  },
  {
    key: "mid",
    name: "中路",
    points: [
      { x: 220, y: 1260 },
      { x: 700, y: 920 },
      { x: 1180, y: 750 },
      { x: 1670, y: 470 },
      { x: 2160, y: 220 },
    ],
  },
  {
    key: "bot",
    name: "下路",
    points: [
      { x: 220, y: 1260 },
      { x: 520, y: 1270 },
      { x: 920, y: 1310 },
      { x: 1410, y: 1220 },
      { x: 1830, y: 960 },
      { x: 2100, y: 620 },
      { x: 2160, y: 220 },
    ],
  },
];

const BLUE_FOUNTAIN = { x: 220, y: 1260 };
const RED_FOUNTAIN = { x: 2160, y: 220 };
const STEP_UNITS = 90;
const HERO_BASE_SPEED = STEP_UNITS * 2;
const HERO_BOOTS_BONUS = STEP_UNITS;
const MINION_BASE_SPEED = STEP_UNITS;

const SHOP_ITEMS = [
  { id: "long_sword", name: "长剑", cost: 350, desc: "攻击 +14", attack: 14 },
  { id: "ruby_crystal", name: "红水晶", cost: 400, desc: "生命 +180", hp: 180 },
  { id: "sorcerer_orb", name: "法能宝珠", cost: 420, desc: "法力 +120，技能伤害 +18", mana: 120, power: 18 },
  { id: "swift_boots", name: "迅捷之靴", cost: 650, desc: "移速 +90（1 秒 3 步）", speed: HERO_BOOTS_BONUS },
  { id: "recurve_bow", name: "反曲弓", cost: 700, desc: "攻速提升，攻击间隔 -0.12 秒", haste: 0.12 },
  { id: "giant_axe", name: "巨人战斧", cost: 980, desc: "攻击 +24，生命 +120", attack: 24, hp: 120 },
];

const HERO_BUILDS = {
  vanguard: ["ruby_crystal", "long_sword", "swift_boots", "giant_axe", "ruby_crystal", "giant_axe"],
  ranger: ["long_sword", "recurve_bow", "swift_boots", "long_sword", "recurve_bow", "giant_axe"],
  arcanist: ["sorcerer_orb", "sorcerer_orb", "swift_boots", "ruby_crystal", "sorcerer_orb", "giant_axe"],
};

const HERO_LANE_ASSIGNMENTS = {
  top: "vanguard",
  mid: "arcanist",
  bot: "ranger",
};

const LANE_ROLE_LABELS = {
  top: "对抗路",
  mid: "中路",
  bot: "发育路",
};

const LOW_HP_RATIO = 0.35;
const RECALL_HP_RATIO = 0.28;
const SUPPORT_RESPONSE_RANGE = 760;
const CHASE_RESPONSE_RANGE = 860;
const SPECTATOR_PAN_SPEED = 780;
const SPECTATOR_DEADZONE = 0.12;

const HERO_DEFS = {
  vanguard: {
    id: "vanguard",
    name: "曙光骑士",
    role: "前排战士",
    color: "#ffe07a",
    baseHp: 1120,
    baseMana: 360,
    speed: HERO_BASE_SPEED,
    attackDamage: 82,
    attackRange: 68,
    attackCooldown: 0.76,
    qName: "冲锋斩",
    eName: "审判旋风",
    rName: "黎明坠击",
  },
  ranger: {
    id: "ranger",
    name: "风羽游侠",
    role: "射手",
    color: "#7ef0a0",
    baseHp: 920,
    baseMana: 410,
    speed: HERO_BASE_SPEED,
    attackDamage: 72,
    attackRange: 260,
    attackCooldown: 0.58,
    qName: "翻滚射击",
    eName: "三重箭雨",
    rName: "穿云连射",
  },
  arcanist: {
    id: "arcanist",
    name: "星纹术师",
    role: "法师",
    color: "#a88cff",
    baseHp: 880,
    baseMana: 540,
    speed: HERO_BASE_SPEED,
    attackDamage: 62,
    attackRange: 230,
    attackCooldown: 0.7,
    qName: "奥术闪现",
    eName: "星爆法球",
    rName: "超新星",
  },
};

const CAMPS = [
  { id: "wolves_blue", name: "蓝狼群", x: 650, y: 1140, hp: 760, damage: 34, gold: 84, xp: 72 },
  { id: "blue_buff_blue", name: "蓝 Buff", x: 780, y: 1080, hp: 1220, damage: 48, gold: 122, xp: 118, radius: 34, color: "#7bbcff", respawn: 45 },
  { id: "raptors_blue", name: "蓝鸟群", x: 960, y: 1180, hp: 700, damage: 30, gold: 78, xp: 68 },
  { id: "red_buff_blue", name: "红 Buff", x: 520, y: 980, hp: 1280, damage: 52, gold: 128, xp: 122, radius: 34, color: "#ff8d73", respawn: 45 },
  { id: "golem_blue", name: "蓝石像", x: 860, y: 980, hp: 880, damage: 42, gold: 96, xp: 88 },
  { id: "krugs_blue", name: "蓝石甲虫", x: 520, y: 1080, hp: 940, damage: 44, gold: 102, xp: 92 },

  { id: "wolves_red", name: "红狼群", x: 1760, y: 360, hp: 760, damage: 34, gold: 84, xp: 72 },
  { id: "blue_buff_red", name: "蓝 Buff", x: 1620, y: 430, hp: 1220, damage: 48, gold: 122, xp: 118, radius: 34, color: "#7bbcff", respawn: 45 },
  { id: "raptors_red", name: "红鸟群", x: 1440, y: 300, hp: 700, damage: 30, gold: 78, xp: 68 },
  { id: "red_buff_red", name: "红 Buff", x: 1880, y: 520, hp: 1280, damage: 52, gold: 128, xp: 122, radius: 34, color: "#ff8d73", respawn: 45 },
  { id: "golem_red", name: "红石像", x: 1540, y: 520, hp: 880, damage: 42, gold: 96, xp: 88 },
  { id: "krugs_red", name: "红石甲虫", x: 1880, y: 420, hp: 940, damage: 44, gold: 102, xp: 92 },

  { id: "scuttle_top", name: "上河道蟹", x: 1200, y: 610, hp: 980, damage: 0, gold: 110, xp: 95, radius: 30, color: "#8ffff1", leash: 260, speed: 120, respawn: 40 },
  { id: "scuttle_bot", name: "下河道蟹", x: 1200, y: 940, hp: 980, damage: 0, gold: 110, xp: 95, radius: 30, color: "#8ffff1", leash: 260, speed: 120, respawn: 40 },
  { id: "dragon", name: "小龙", x: 360, y: 850, hp: 3600, damage: 82, gold: 280, xp: 260, radius: 48, color: "#ffb05e", leash: 320, speed: 105, attackRange: 92, respawn: 90, pit: "dragon" },
  { id: "baron", name: "大龙", x: 2040, y: 650, hp: 5200, damage: 118, gold: 420, xp: 360, radius: 58, color: "#c19dff", leash: 340, speed: 98, attackRange: 110, respawn: 120, pit: "baron" },
];

const MAX_LEVEL = 15;

for (const lane of LANES) {
  let totalLength = 0;
  for (let index = 0; index < lane.points.length - 1; index += 1) {
    totalLength += distance(lane.points[index], lane.points[index + 1]);
  }
  lane.length = totalLength;
}

const input = {
  keys: new Set(),
  pressed: new Set(),
  mouseDown: false,
  mouseX: 0,
  mouseY: 0,
};

let nextEntityId = 1;
let preferredLane = "mid";
let state = createGameState(preferredLane);
let hudCollapsed = false;
let spectatorCamera = { x: WORLD.width / 2, y: WORLD.height / 2 };

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function angleTo(source, target) {
  return Math.atan2(target.y - source.y, target.x - source.x);
}

function setBar(el, ratio) {
  el.style.width = `${clamp(ratio, 0, 1) * 100}%`;
}

function createEffectState() {
  return {
    redBuffTimer: 0,
    blueBuffTimer: 0,
    dragonBuffTimer: 0,
    baronBuffTimer: 0,
    burnTimer: 0,
    burnTickTimer: 0,
    burnDamage: 0,
    burnSource: null,
  };
}

function syncHudVisibility() {
  ui.hud.classList.toggle("hud--collapsed", hudCollapsed);
  ui.hudToggle.textContent = hudCollapsed ? "显示面板 Tab" : "隐藏面板 Tab";
}

function confineUnit(unit) {
  unit.x = clamp(unit.x, WORLD.wall + unit.radius, WORLD.width - WORLD.wall - unit.radius);
  unit.y = clamp(unit.y, WORLD.wall + unit.radius, WORLD.height - WORLD.wall - unit.radius);
}

function lanePointAt(lane, t, team) {
  const points = team === "blue" ? lane.points : [...lane.points].reverse();
  const totalSegments = points.length - 1;
  const scaled = clamp(t, 0, 1) * totalSegments;
  const index = Math.min(totalSegments - 1, Math.floor(scaled));
  const localT = scaled - index;
  const a = points[index];
  const b = points[index + 1];
  return {
    x: a.x + (b.x - a.x) * localT,
    y: a.y + (b.y - a.y) * localT,
  };
}

function getHeroSpawn(team, laneKey) {
  const spawn = team === "blue" ? BLUE_FOUNTAIN : RED_FOUNTAIN;
  const offsets = {
    top: { x: 10, y: -88 },
    mid: { x: 40, y: -18 },
    bot: { x: 80, y: 48 },
  };
  const offset = offsets[laneKey] ?? offsets.mid;
  return {
    x: spawn.x + (team === "blue" ? offset.x : -offset.x),
    y: spawn.y + (team === "blue" ? offset.y : -offset.y),
  };
}

function createHero(team, isPlayer, heroId, laneKey) {
  const def = HERO_DEFS[heroId];
  const spawn = getHeroSpawn(team, laneKey);
  return {
    id: nextEntityId += 1,
    kind: "hero",
    heroId,
    name: def.name,
    team,
    isPlayer,
    x: spawn.x,
    y: spawn.y,
    radius: 24,
    color: def.color,
    hp: def.baseHp,
    maxHp: def.baseHp,
    mana: def.baseMana,
    maxMana: def.baseMana,
    speed: def.speed,
    attackDamage: def.attackDamage,
    abilityPower: 0,
    attackRange: def.attackRange,
    attackCooldown: def.attackCooldown,
    attackTimer: 0,
    level: 1,
    xp: 0,
    xpToLevel: 120,
    gold: isPlayer ? 500 : 500,
    kills: 0,
    deaths: 0,
    assists: 0,
    qCooldown: 0,
    eCooldown: 0,
    rCooldown: 0,
    qUnlockLevel: 1,
    eUnlockLevel: 3,
    rUnlockLevel: 6,
    respawnTimer: 0,
    alive: true,
    facing: team === "blue" ? -0.7 : 2.2,
    inventory: [],
    recallTimer: 0,
    recalling: false,
    underAttackTimer: 0,
    targetLane: laneKey,
    laneRole: LANE_ROLE_LABELS[laneKey] ?? "分路",
    buildOrder: [...(HERO_BUILDS[heroId] ?? [])],
    autoBuyIndex: 0,
    ...createEffectState(),
  };
}

function createTower(team, laneKey, progress, tier) {
  const lane = LANES.find((item) => item.key === laneKey);
  const pos = lanePointAt(lane, progress, "blue");
  return {
    id: nextEntityId += 1,
    kind: "tower",
    team,
    lane: laneKey,
    x: team === "blue" ? pos.x : WORLD.width - pos.x,
    y: team === "blue" ? pos.y : WORLD.height - pos.y,
    radius: 42,
    hp: tier === 1 ? 2100 : 2700,
    maxHp: tier === 1 ? 2100 : 2700,
    attackDamage: tier === 1 ? 185 : 235,
    attackRange: tier === 1 ? 330 : 350,
    attackCooldown: 0.95,
    attackTimer: 0,
    rangeEntries: new Map(),
    tier,
    alive: true,
  };
}

function createCore(team) {
  return {
    id: nextEntityId += 1,
    kind: "core",
    team,
    x: team === "blue" ? BLUE_FOUNTAIN.x : RED_FOUNTAIN.x,
    y: team === "blue" ? BLUE_FOUNTAIN.y : RED_FOUNTAIN.y,
    radius: 64,
    hp: 5000,
    maxHp: 5000,
    threatTimer: 0,
    alive: true,
  };
}

function createMinion(team, laneKey, type, order) {
  const lane = LANES.find((item) => item.key === laneKey);
  const baseProgress = 0.02;
  const offset = order * -0.014;
  const progress = clamp(baseProgress + offset, 0, 1);
  const pos = lanePointAt(lane, progress, team);
  return {
    id: nextEntityId += 1,
    kind: "minion",
    team,
    lane: laneKey,
    minionType: type,
    progress,
    x: pos.x,
    y: pos.y,
    radius: type === "caster" ? 14 : 17,
    hp: type === "caster" ? 170 : 260,
    maxHp: type === "caster" ? 170 : 260,
    attackDamage: type === "caster" ? 42 : 32,
    attackRange: type === "caster" ? 220 : 42,
    speed: MINION_BASE_SPEED,
    attackCooldown: type === "caster" ? 1.2 : 0.9,
    attackTimer: 0,
    ...createEffectState(),
    alive: true,
  };
}

function createCamp(def) {
  return {
    id: nextEntityId += 1,
    kind: "camp",
    name: def.name,
    team: "neutral",
    x: def.x,
    y: def.y,
    homeX: def.x,
    homeY: def.y,
    radius: def.radius ?? 28,
    hp: def.hp,
    maxHp: def.hp,
    speed: def.speed ?? MINION_BASE_SPEED,
    attackDamage: def.damage,
    attackRange: def.attackRange ?? 70,
    leash: def.leash ?? 180,
    attackCooldown: 0.9,
    attackTimer: 0,
    goldReward: def.gold,
    xpReward: def.xp,
    color: def.color ?? COLORS.camp,
    stroke: def.stroke ?? "#ffe4c0",
    respawnDuration: def.respawn ?? 30,
    pit: def.pit ?? null,
    respawnTimer: 0,
    regenTimer: 0,
    alive: true,
    aggroTarget: null,
    ...createEffectState(),
  };
}

function createProjectile(source, target, options) {
  const angle = options.angle ?? angleTo(source, target);
  return {
    id: nextEntityId += 1,
    kind: "projectile",
    team: source.team,
    owner: source,
    x: source.x,
    y: source.y,
    vx: Math.cos(angle) * options.speed,
    vy: Math.sin(angle) * options.speed,
    damage: options.damage,
    radius: options.radius ?? 7,
    ttl: options.ttl ?? 1.4,
    color: options.color,
    pierce: options.pierce ?? 0,
    targetId: options.trackTarget ? target.id : null,
    speed: options.speed,
    trackTarget: options.trackTarget ?? false,
    onHit: options.onHit ?? null,
  };
}

function getManaRegen(hero) {
  return 24 + ((hero.blueBuffTimer ?? 0) > 0 ? 18 : 0);
}

function getCooldownRate(hero) {
  return (hero.blueBuffTimer ?? 0) > 0 ? 1.25 : 1;
}

function getBuffedAttackDamage(hero) {
  let bonus = 0;
  if ((hero.dragonBuffTimer ?? 0) > 0) bonus += 18;
  if ((hero.baronBuffTimer ?? 0) > 0) bonus += 30;
  return hero.attackDamage + bonus;
}

function getBuffedAbilityPower(hero) {
  let bonus = hero.abilityPower;
  if ((hero.dragonBuffTimer ?? 0) > 0) bonus += 24;
  if ((hero.baronBuffTimer ?? 0) > 0) bonus += 40;
  return bonus;
}

function applyCampReward(hero, camp) {
  if (!hero || hero.kind !== "hero" || camp.kind !== "camp") return;
  if (camp.id.includes("red_buff")) {
    hero.redBuffTimer = 75;
    state.effects.push(createBuffBurst(hero, "#ff8d73"));
    addFeedMessage(`${getEntityLabel(hero)} 获得了红 Buff`, hero.team === "blue" ? COLORS.blueSoft : COLORS.redSoft);
  } else if (camp.id.includes("blue_buff")) {
    hero.blueBuffTimer = 75;
    state.effects.push(createBuffBurst(hero, "#7bbcff"));
    addFeedMessage(`${getEntityLabel(hero)} 获得了蓝 Buff`, hero.team === "blue" ? COLORS.blueSoft : COLORS.redSoft);
  } else if (camp.id === "dragon") {
    hero.dragonBuffTimer = 120;
    state.effects.push(createBuffBurst(hero, "#ffb05e"));
    addFeedMessage(`${getEntityLabel(hero)} 获得了小龙强化`, hero.team === "blue" ? COLORS.blueSoft : COLORS.redSoft);
  } else if (camp.id === "baron") {
    hero.baronBuffTimer = 120;
    state.effects.push(createBuffBurst(hero, "#c19dff"));
    addFeedMessage(`${getEntityLabel(hero)} 获得了大龙强化`, hero.team === "blue" ? COLORS.blueSoft : COLORS.redSoft);
  }
}

function applyBurn(target, attacker, damagePerTick, duration = 3) {
  if (!target.alive || !attacker || attacker.kind !== "hero") return;
  if (target.kind === "tower" || target.kind === "core") return;
  target.burnTimer = duration;
  target.burnTickTimer = 1;
  target.burnDamage = damagePerTick;
  target.burnSource = attacker;
}

function updateBurns(dt) {
  const entities = [...state.heroes, ...state.minions, ...state.camps];
  for (const entity of entities) {
    if (!entity || !entity.alive || !entity.burnTimer || entity.burnTimer <= 0) continue;
    entity.burnTimer -= dt;
    entity.burnTickTimer -= dt;
    if (entity.burnTickTimer <= 0 && entity.burnTimer > 0) {
      entity.burnTickTimer += 1;
      dealDamage(entity, entity.burnDamage, entity.burnSource);
      addFloatText(entity.x, entity.y - entity.radius - 18, "灼烧", "#ff9c73");
    }
    if (entity.burnTimer <= 0) {
      entity.burnTimer = 0;
      entity.burnTickTimer = 0;
      entity.burnDamage = 0;
      entity.burnSource = null;
    }
  }
}

function updateHeroBuffs(hero, dt) {
  hero.redBuffTimer = Math.max(0, (hero.redBuffTimer ?? 0) - dt);
  hero.blueBuffTimer = Math.max(0, (hero.blueBuffTimer ?? 0) - dt);
  hero.dragonBuffTimer = Math.max(0, (hero.dragonBuffTimer ?? 0) - dt);
  hero.baronBuffTimer = Math.max(0, (hero.baronBuffTimer ?? 0) - dt);
}

function createEffect(x, y, radius, color, ttl = 0.22) {
  return { id: nextEntityId += 1, x, y, radius, color, ttl, maxTtl: ttl };
}

function createBuffBurst(hero, color) {
  return { id: nextEntityId += 1, x: hero.x, y: hero.y, radius: 90, color, ttl: 0.55, maxTtl: 0.55 };
}

function createMatchHeroes(playerLane = preferredLane) {
  const laneKeys = ["top", "mid", "bot"];
  const heroes = [];

  for (const laneKey of laneKeys) {
    heroes.push(createHero("blue", laneKey === playerLane, HERO_LANE_ASSIGNMENTS[laneKey], laneKey));
  }
  for (const laneKey of laneKeys) {
    heroes.push(createHero("red", false, HERO_LANE_ASSIGNMENTS[laneKey], laneKey));
  }

  return {
    heroes,
    player: heroes.find((hero) => hero.isPlayer),
  };
}

function createGameState(playerLane = preferredLane) {
  const match = createMatchHeroes(playerLane);
  return {
    running: false,
    ended: false,
    winner: null,
    time: 0,
    waveIndex: 0,
    waveTimer: 1,
    shopOpen: false,
    effects: [],
    projectiles: [],
    floatTexts: [],
    feed: [],
    minions: [],
    camps: CAMPS.map(createCamp),
    towers: [
      createTower("blue", "top", 0.18, 1),
      createTower("blue", "top", 0.34, 2),
      createTower("blue", "mid", 0.22, 1),
      createTower("blue", "mid", 0.39, 2),
      createTower("blue", "bot", 0.19, 1),
      createTower("blue", "bot", 0.36, 2),
      createTower("red", "top", 0.18, 1),
      createTower("red", "top", 0.34, 2),
      createTower("red", "mid", 0.22, 1),
      createTower("red", "mid", 0.39, 2),
      createTower("red", "bot", 0.19, 1),
      createTower("red", "bot", 0.36, 2),
    ],
    cores: [createCore("blue"), createCore("red")],
    heroes: match.heroes,
    player: match.player,
  };
}

function worldToScreen(x, y) {
  const camera = getCamera();
  return {
    x: (x - camera.left) * camera.scale,
    y: (y - camera.top) * camera.scale,
  };
}

function screenToWorld(x, y) {
  const camera = getCamera();
  return {
    x: x / camera.scale + camera.left,
    y: y / camera.scale + camera.top,
  };
}

function worldSizeToScreen(size) {
  return size * getCamera().scale;
}

function updateSpectatorCamera(dt) {
  const player = state?.player;
  if (!player || player.alive) return;

  const screenX = canvas.width > 0 ? input.mouseX / canvas.width : 0.5;
  const screenY = canvas.height > 0 ? input.mouseY / canvas.height : 0.5;
  let panX = (screenX - 0.5) * 2;
  let panY = (screenY - 0.5) * 2;
  if (Math.abs(panX) < SPECTATOR_DEADZONE) panX = 0;
  if (Math.abs(panY) < SPECTATOR_DEADZONE) panY = 0;

  spectatorCamera.x = clamp(spectatorCamera.x + panX * SPECTATOR_PAN_SPEED * dt, 0, WORLD.width);
  spectatorCamera.y = clamp(spectatorCamera.y + panY * SPECTATOR_PAN_SPEED * dt, 0, WORLD.height);
}

function getCameraTarget() {
  const hero = state?.player;
  if (!hero) {
    return { x: WORLD.width / 2, y: WORLD.height / 2 };
  }
  if (!hero.alive) {
    return {
      x: spectatorCamera.x,
      y: spectatorCamera.y,
    };
  }
  const focus = hero;
  return {
    x: focus.x + Math.cos(focus.facing ?? 0) * CAMERA.lookAhead,
    y: focus.y + Math.sin(focus.facing ?? 0) * CAMERA.lookAhead + CAMERA.verticalBias,
  };
}

function getCamera() {
  const scale = Math.min((window.devicePixelRatio || 1) * CAMERA.zoom, 2.2);
  const viewWidth = canvas.width / scale;
  const viewHeight = canvas.height / scale;
  const target = getCameraTarget();
  const left = clamp(target.x - viewWidth / 2, 0, Math.max(0, WORLD.width - viewWidth));
  const top = clamp(target.y - viewHeight / 2, 0, Math.max(0, WORLD.height - viewHeight));
  return {
    scale,
    viewWidth,
    viewHeight,
    left,
    top,
  };
}

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.floor(window.innerWidth * dpr);
  canvas.height = Math.floor(window.innerHeight * dpr);
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
}

function addFloatText(x, y, text, color = COLORS.text) {
  state.floatTexts.push({ x, y, text, color, ttl: 0.8, maxTtl: 0.8 });
}

function addFeedMessage(text, color = COLORS.text) {
  state.feed.unshift({ text, color, ttl: 3, maxTtl: 3 });
  state.feed = state.feed.slice(0, 4);
}

function getEntityLabel(entity) {
  if (!entity) return "未知";
  if (entity.kind === "hero") {
    if (entity.isPlayer) return `你（${entity.laneRole}）`;
    return `${entity.team === "blue" ? "蓝方" : "红方"}${entity.name}`;
  }
  if (entity.kind === "tower") return entity.team === "blue" ? "蓝方防御塔" : "红方防御塔";
  if (entity.kind === "core") return entity.team === "blue" ? "蓝方主水晶" : "红方主水晶";
  if (entity.kind === "camp") return entity.name;
  if (entity.kind === "minion") return entity.team === "blue" ? "蓝方小兵" : "红方小兵";
  return "未知";
}

function getHeroDef(hero) {
  return HERO_DEFS[hero.heroId];
}

function getOpponents(team) {
  const list = [];
  for (const minion of state.minions) if (minion.alive && minion.team !== team) list.push(minion);
  for (const tower of state.towers) if (tower.alive && tower.team !== team) list.push(tower);
  for (const core of state.cores) if (core.alive && core.team !== team) list.push(core);
  for (const hero of state.heroes) if (hero.alive && hero.team !== team) list.push(hero);
  return list;
}

function getAllies(team) {
  const list = [];
  for (const minion of state.minions) if (minion.alive && minion.team === team) list.push(minion);
  for (const hero of state.heroes) if (hero.alive && hero.team === team) list.push(hero);
  return list;
}

function getAttackables(unit) {
  const targets = getOpponents(unit.team).filter((entity) => entity.alive);
  if (unit.team !== "neutral") {
    for (const camp of state.camps) if (camp.alive) targets.push(camp);
  }
  return targets;
}

function findClosestTarget(unit, maxRange) {
  let best = null;
  let bestDistance = maxRange;
  for (const target of getAttackables(unit)) {
    const d = distance(unit, target);
    if (d < bestDistance) {
      best = target;
      bestDistance = d;
    }
  }
  return best;
}

function awardHeroKill(hero, target) {
  if (!hero || hero.kind !== "hero") return;
  if (target.kind === "minion") {
    hero.gold += target.minionType === "caster" ? 28 : 22;
    hero.xp += target.minionType === "caster" ? 24 : 18;
  } else if (target.kind === "camp") {
    hero.gold += target.goldReward;
    hero.xp += target.xpReward;
    applyCampReward(hero, target);
  } else if (target.kind === "tower") {
    hero.gold += target.tier === 1 ? 220 : 300;
    hero.xp += 120;
    hero.kills += 1;
  } else if (target.kind === "hero") {
    hero.gold += 320;
    hero.xp += 180;
    hero.kills += 1;
  } else if (target.kind === "core") {
    hero.gold += 600;
  }
}

function cancelRecall(hero) {
  hero.recalling = false;
  hero.recallTimer = 0;
}

function respawnHero(hero) {
  const spawn = getHeroSpawn(hero.team, hero.targetLane);
  hero.alive = true;
  hero.hp = hero.maxHp;
  hero.mana = hero.maxMana;
  hero.x = spawn.x;
  hero.y = spawn.y;
  hero.attackTimer = 0;
  hero.qCooldown = 0;
  hero.eCooldown = 0;
  hero.rCooldown = 0;
  cancelRecall(hero);
  confineUnit(hero);
  if (hero.isPlayer) {
    spectatorCamera.x = hero.x;
    spectatorCamera.y = hero.y;
  }
}

function handleDeath(target, attacker) {
  if (!target.alive) return;
  target.alive = false;

  if (target.kind === "hero") {
    target.deaths += 1;
    target.respawnTimer = target.isPlayer ? 10 : 8;
    cancelRecall(target);
    if (target.isPlayer) {
      spectatorCamera.x = target.x;
      spectatorCamera.y = target.y;
    }
  }

  if (target.kind === "camp") {
    target.respawnTimer = target.respawnDuration;
    target.aggroTarget = null;
  }

  if (attacker) {
    awardHeroKill(attacker, target);
    if (target.kind === "hero" || target.kind === "tower" || target.kind === "camp") {
      addFeedMessage(`${getEntityLabel(attacker)} 击败了 ${getEntityLabel(target)}`, attacker.team === "blue" ? COLORS.blueSoft : COLORS.redSoft);
    }
  }

  if (target.kind === "core") {
    state.ended = true;
    state.winner = target.team === "blue" ? "red" : "blue";
    const playerWon = state.winner === "blue";
    ui.endOverlay.classList.add("overlay--active");
    ui.endTag.textContent = playerWon ? "Victory" : "Defeat";
    ui.endTitle.textContent = playerWon ? "胜利" : "失败";
    ui.endText.textContent = playerWon
      ? "你在三路兵线和野区资源的拉扯中赢下了这盘单机峡谷。"
      : "这盘被翻了。下次试着多清野、控线，再带兵线进塔。";
  }
}

function dealDamage(target, amount, attacker) {
  if (!target.alive) return;
  target.hp = clamp(target.hp - amount, 0, target.maxHp);
  if (target.kind === "hero") {
    target.underAttackTimer = 1.2;
    cancelRecall(target);
  }
  if (target.kind === "core") {
    target.threatTimer = 5;
  }
  if (target.kind === "camp" && attacker?.kind === "hero") {
    target.aggroTarget = attacker;
    target.regenTimer = 0;
  }
  addFloatText(target.x, target.y - target.radius - 8, `${Math.round(amount)}`, COLORS.text);
  if (target.hp <= 0) handleDeath(target, attacker);
}

function levelUp(hero) {
  while (hero.level < MAX_LEVEL && hero.xp >= hero.xpToLevel) {
    hero.xp -= hero.xpToLevel;
    hero.level += 1;
    hero.xpToLevel = hero.level >= MAX_LEVEL ? 0 : Math.round(hero.xpToLevel * 1.18);
    hero.maxHp += 90;
    hero.hp = hero.maxHp;
    hero.maxMana += 38;
    hero.mana = hero.maxMana;
    hero.attackDamage += 10;
    addFloatText(hero.x, hero.y - 42, "升级", COLORS.gold);
  }

  if (hero.level >= MAX_LEVEL) {
    hero.level = MAX_LEVEL;
    hero.xp = 0;
    hero.xpToLevel = 0;
  }
}

function isSkillUnlocked(hero, skillKey) {
  if (skillKey === "q") return hero.level >= hero.qUnlockLevel;
  if (skillKey === "e") return hero.level >= hero.eUnlockLevel;
  if (skillKey === "r") return hero.level >= hero.rUnlockLevel;
  return false;
}

function isInFountain(hero) {
  const fountain = hero.team === "blue" ? BLUE_FOUNTAIN : RED_FOUNTAIN;
  return distance(hero, fountain) <= WORLD.fountainRadius;
}

function isInShopRange(hero) {
  const fountain = hero.team === "blue" ? BLUE_FOUNTAIN : RED_FOUNTAIN;
  return distance(hero, fountain) <= WORLD.shopRadius;
}

function applyItemToHero(hero, item) {
  hero.gold -= item.cost;
  hero.inventory.push(item.id);
  hero.attackDamage += item.attack ?? 0;
  hero.maxHp += item.hp ?? 0;
  hero.hp += item.hp ?? 0;
  hero.maxMana += item.mana ?? 0;
  hero.mana += item.mana ?? 0;
  hero.abilityPower += item.power ?? 0;
  hero.speed += item.speed ?? 0;
  hero.attackCooldown = Math.max(0.32, hero.attackCooldown - (item.haste ?? 0));
}

function grantPurchasedItem(hero, item, messagePrefix = "已购买") {
  applyItemToHero(hero, item);
  addFloatText(hero.x, hero.y - 38, `+${item.name}`, COLORS.gold);
  if (hero.isPlayer) {
    ui.shopHint.textContent = `${messagePrefix} ${item.name}`;
    renderInventory();
  }
}

function autoBuyRecommendedItems(hero) {
  while (hero.autoBuyIndex < hero.buildOrder.length && hero.inventory.length < 6) {
    const itemId = hero.buildOrder[hero.autoBuyIndex];
    const item = SHOP_ITEMS.find((entry) => entry.id === itemId);
    if (!item) {
      hero.autoBuyIndex += 1;
      continue;
    }
    if (hero.gold < item.cost) break;
    grantPurchasedItem(hero, item, "自动购买");
    hero.autoBuyIndex += 1;
  }
}

function buyItem(itemId) {
  const hero = state.player;
  const item = SHOP_ITEMS.find((entry) => entry.id === itemId);
  if (!item) return;
  if (!hero.alive) return;
  if (!isInShopRange(hero)) {
    ui.shopHint.textContent = "你离商店太远了，回到泉水附近再购买。";
    return;
  }
  if (hero.inventory.length >= 6) {
    ui.shopHint.textContent = "装备栏已满。";
    return;
  }
  if (hero.gold < item.cost) {
    ui.shopHint.textContent = "金币不足。";
    return;
  }

  grantPurchasedItem(hero, item);
}

function renderInventory() {
  const hero = state.player;
  const items = hero.inventory.map((id) => SHOP_ITEMS.find((entry) => entry.id === id));
  ui.inventorySlots.innerHTML = "";
  for (let index = 0; index < 6; index += 1) {
    const slot = document.createElement("div");
    slot.className = "inventory-slot";
    const item = items[index];
    if (item) {
      slot.innerHTML = `<strong>${item.name}</strong><small>${item.desc}</small>`;
    } else {
      slot.innerHTML = "<strong>空槽</strong><small>等待装备</small>";
    }
    ui.inventorySlots.appendChild(slot);
  }
}

function renderShop() {
  ui.shopItems.innerHTML = "";
  for (const item of SHOP_ITEMS) {
    const card = document.createElement("div");
    card.className = "shop-item";
    card.innerHTML = `
      <div class="shop-item__top">
        <strong>${item.name}</strong>
        <strong>${item.cost}G</strong>
      </div>
      <span>${item.desc}</span>
      <button data-buy="${item.id}" type="button">购买</button>
    `;
    ui.shopItems.appendChild(card);
  }
}

function renderHeroSelection() {
  const laneCards = ui.heroGrid.querySelectorAll("[data-lane]");
  for (const card of laneCards) {
    card.classList.toggle("hero-card--active", card.dataset.lane === preferredLane);
  }
}

function moveToward(unit, targetX, targetY, dt) {
  const dx = targetX - unit.x;
  const dy = targetY - unit.y;
  const len = Math.hypot(dx, dy) || 1;
  unit.x += (dx / len) * unit.speed * dt;
  unit.y += (dy / len) * unit.speed * dt;
  confineUnit(unit);
}

function confineCampToHome(camp) {
  const dx = camp.x - camp.homeX;
  const dy = camp.y - camp.homeY;
  const len = Math.hypot(dx, dy);
  if (len <= camp.leash || len === 0) return;
  const ratio = camp.leash / len;
  camp.x = camp.homeX + dx * ratio;
  camp.y = camp.homeY + dy * ratio;
}

function spawnWave() {
  state.waveIndex += 1;
  const pattern = ["melee", "melee", "melee", "caster", "caster"];
  for (const lane of LANES) {
    pattern.forEach((type, index) => {
      state.minions.push(createMinion("blue", lane.key, type, index));
      state.minions.push(createMinion("red", lane.key, type, index));
    });
  }
}

function towerTarget(tower) {
  const enemies = getOpponents(tower.team).filter(
    (entity) => entity.kind !== "core" && !(entity.kind === "camp" && entity.pit),
  );
  const inRange = [];
  for (const entity of enemies) {
    if (distance(tower, entity) <= tower.attackRange) {
      inRange.push(entity);
      if (!tower.rangeEntries.has(entity.id)) tower.rangeEntries.set(entity.id, state.time);
    } else {
      tower.rangeEntries.delete(entity.id);
    }
  }
  for (const id of Array.from(tower.rangeEntries.keys())) {
    if (!inRange.some((entity) => entity.id === id)) tower.rangeEntries.delete(id);
  }
  if (!inRange.length) return null;
  let best = inRange[0];
  let bestTime = tower.rangeEntries.get(best.id) ?? state.time;
  for (const entity of inRange) {
    const entered = tower.rangeEntries.get(entity.id) ?? state.time;
    if (entered < bestTime) {
      best = entity;
      bestTime = entered;
    }
  }
  return best;
}

function basicAttack(hero, target) {
  hero.attackTimer = hero.attackCooldown;
  const attackDamage = getBuffedAttackDamage(hero);
  if (hero.heroId === "ranger" || hero.heroId === "arcanist") {
    state.projectiles.push(
      createProjectile(hero, target, {
        speed: hero.heroId === "arcanist" ? 470 : 560,
        damage: attackDamage,
        color: hero.team === "blue" ? "#9fe9ff" : "#ffbcae",
        radius: hero.heroId === "arcanist" ? 9 : 7,
        onHit(hitTarget, owner) {
          if (owner.redBuffTimer > 0) {
            applyBurn(hitTarget, owner, 16, 3);
          }
        },
      }),
    );
  } else {
    dealDamage(target, attackDamage, hero);
    if (hero.redBuffTimer > 0) {
      applyBurn(target, hero, 16, 3);
    }
  }
}

function castHeroQ(hero, aim) {
  if (!isSkillUnlocked(hero, "q")) return;
  if (hero.qCooldown > 0) return;
  const target = aim ?? screenToWorld(input.mouseX, input.mouseY);
  const facing = angleTo(hero, target);
  hero.facing = facing;
  const buffedAttackDamage = getBuffedAttackDamage(hero);
  const buffedAbilityPower = getBuffedAbilityPower(hero);
  if (hero.heroId === "vanguard") {
    if (hero.mana < 65) return;
    hero.mana -= 65;
    hero.qCooldown = 6.2;
    hero.x += Math.cos(facing) * 160;
    hero.y += Math.sin(facing) * 160;
    confineUnit(hero);
    state.effects.push(createEffect(hero.x, hero.y, 110, hero.team === "blue" ? COLORS.blue : COLORS.red));
    for (const entity of getAttackables(hero)) {
      if (distance(hero, entity) < 120) dealDamage(entity, buffedAttackDamage * 1.45 + buffedAbilityPower * 0.3, hero);
    }
  } else if (hero.heroId === "ranger") {
    if (hero.mana < 55) return;
    hero.mana -= 55;
    hero.qCooldown = 5.4;
    hero.x -= Math.cos(facing) * 120;
    hero.y -= Math.sin(facing) * 120;
    confineUnit(hero);
    const shotTarget = findClosestTarget(hero, hero.attackRange + 120);
    if (shotTarget) basicAttack(hero, shotTarget);
  } else {
    if (hero.mana < 75) return;
    hero.mana -= 75;
    hero.qCooldown = 6.8;
    hero.x += Math.cos(facing) * 140;
    hero.y += Math.sin(facing) * 140;
    confineUnit(hero);
    state.projectiles.push(
      createProjectile(hero, target, {
        speed: 520,
        damage: buffedAttackDamage * 0.9 + 80 + buffedAbilityPower * 0.9,
        color: "#be9fff",
        radius: 11,
      }),
    );
  }
}

function castHeroE(hero, aim) {
  if (!isSkillUnlocked(hero, "e")) return;
  if (hero.eCooldown > 0) return;
  const target = aim ?? screenToWorld(input.mouseX, input.mouseY);
  const facing = angleTo(hero, target);
  hero.facing = facing;
  const buffedAttackDamage = getBuffedAttackDamage(hero);
  const buffedAbilityPower = getBuffedAbilityPower(hero);
  if (hero.heroId === "vanguard") {
    if (hero.mana < 95) return;
    hero.mana -= 95;
    hero.eCooldown = 8.4;
    state.effects.push(createEffect(hero.x, hero.y, 150, "#ffd26a", 0.32));
    for (const entity of getAttackables(hero)) {
      if (distance(hero, entity) < 165) {
        dealDamage(entity, buffedAttackDamage * 1.2 + 70 + buffedAbilityPower * 0.45, hero);
      }
    }
  } else if (hero.heroId === "ranger") {
    if (hero.mana < 85) return;
    hero.mana -= 85;
    hero.eCooldown = 8.2;
    for (let index = -1; index <= 1; index += 1) {
      state.projectiles.push(
        createProjectile(hero, target, {
          angle: facing + index * 0.12,
          speed: 640,
          damage: buffedAttackDamage * 1.05 + 46 + buffedAbilityPower * 0.3,
          color: "#85ffb4",
          radius: 7,
        }),
      );
    }
  } else {
    if (hero.mana < 110) return;
    hero.mana -= 110;
    hero.eCooldown = 9.4;
    state.projectiles.push(
      createProjectile(hero, target, {
        speed: 440,
        damage: buffedAttackDamage * 0.7 + 120 + buffedAbilityPower * 1.2,
        color: "#b990ff",
        radius: 15,
        ttl: 1.8,
      }),
    );
  }
}

function castHeroR(hero, aim) {
  if (!isSkillUnlocked(hero, "r")) return;
  if (hero.rCooldown > 0) return;
  const target = aim ?? screenToWorld(input.mouseX, input.mouseY);
  const facing = angleTo(hero, target);
  hero.facing = facing;
  const buffedAttackDamage = getBuffedAttackDamage(hero);
  const buffedAbilityPower = getBuffedAbilityPower(hero);

  if (hero.heroId === "vanguard") {
    if (hero.mana < 150) return;
    hero.mana -= 150;
    hero.rCooldown = 26;
    hero.x += Math.cos(facing) * 220;
    hero.y += Math.sin(facing) * 220;
    confineUnit(hero);
    state.effects.push(createEffect(hero.x, hero.y, 220, "#ffd36e", 0.45));
    for (const entity of getAttackables(hero)) {
      if (distance(hero, entity) < 230) {
        dealDamage(entity, buffedAttackDamage * 2 + 150 + buffedAbilityPower * 0.55, hero);
      }
    }
  } else if (hero.heroId === "ranger") {
    if (hero.mana < 145) return;
    hero.mana -= 145;
    hero.rCooldown = 24;
    for (let index = -2; index <= 2; index += 1) {
      state.projectiles.push(
        createProjectile(hero, target, {
          angle: facing + index * 0.08,
          speed: 760,
          damage: buffedAttackDamage * 1.45 + 90 + buffedAbilityPower * 0.45,
          color: "#a6ffd1",
          radius: 8,
          ttl: 1.5,
        }),
      );
    }
  } else {
    if (hero.mana < 170) return;
    hero.mana -= 170;
    hero.rCooldown = 28;
    state.effects.push(createEffect(target.x, target.y, 240, "#c2a1ff", 0.52));
    for (const entity of getAttackables(hero)) {
      if (distance(target, entity) < 240) {
        dealDamage(entity, buffedAttackDamage * 1.2 + 220 + buffedAbilityPower * 1.5, hero);
      }
    }
  }
}

function updateRecall(hero, dt) {
  if (!hero.alive) return;
  if (hero.recalling) {
    hero.recallTimer -= dt;
    if (hero.recallTimer <= 0) {
      const fountain = getHeroSpawn(hero.team, hero.targetLane);
      hero.x = fountain.x;
      hero.y = fountain.y;
      hero.hp = clamp(hero.hp + hero.maxHp * 0.5, 0, hero.maxHp);
      hero.mana = hero.maxMana;
      cancelRecall(hero);
      addFeedMessage(`${getEntityLabel(hero)} 完成了回城`, hero.team === "blue" ? COLORS.blueSoft : COLORS.redSoft);
    }
  }
}

function startRecall(hero) {
  if (!hero.alive || hero.recalling) return;
  hero.recalling = true;
  hero.recallTimer = 3;
}

function updatePlayer(dt) {
  const hero = state.player;
  if (!hero.alive) {
    hero.respawnTimer -= dt;
    if (hero.respawnTimer <= 0) respawnHero(hero);
    return;
  }

  hero.attackTimer -= dt;
  updateHeroBuffs(hero, dt);
  const cooldownRate = getCooldownRate(hero);
  hero.qCooldown = Math.max(0, hero.qCooldown - dt * cooldownRate);
  hero.eCooldown = Math.max(0, hero.eCooldown - dt * cooldownRate);
  hero.rCooldown = Math.max(0, hero.rCooldown - dt * cooldownRate);
  hero.underAttackTimer = Math.max(0, hero.underAttackTimer - dt);
  hero.mana = clamp(hero.mana + getManaRegen(hero) * dt, 0, hero.maxMana);
  if (isInFountain(hero)) {
    hero.hp = clamp(hero.hp + 240 * dt, 0, hero.maxHp);
    hero.mana = clamp(hero.mana + 180 * dt, 0, hero.maxMana);
  }

  let moveX = 0;
  let moveY = 0;
  if (input.keys.has("KeyW")) moveY -= 1;
  if (input.keys.has("KeyS")) moveY += 1;
  if (input.keys.has("KeyA")) moveX -= 1;
  if (input.keys.has("KeyD")) moveX += 1;
  const moving = moveX !== 0 || moveY !== 0;
  if (moving) {
    cancelRecall(hero);
    const len = Math.hypot(moveX, moveY) || 1;
    hero.x += (moveX / len) * hero.speed * dt;
    hero.y += (moveY / len) * hero.speed * dt;
    confineUnit(hero);
  }

  const aim = screenToWorld(input.mouseX, input.mouseY);
  hero.facing = angleTo(hero, aim);

  if (input.pressed.has("KeyT")) startRecall(hero);
  if (input.pressed.has("KeyB")) {
    state.shopOpen = !state.shopOpen;
    ui.shop.classList.toggle("shop--open", state.shopOpen);
  }
  if (input.pressed.has("KeyQ")) {
    cancelRecall(hero);
    castHeroQ(hero, aim);
  }
  if (input.pressed.has("KeyE")) {
    cancelRecall(hero);
    castHeroE(hero, aim);
  }
  if (input.pressed.has("KeyR")) {
    cancelRecall(hero);
    castHeroR(hero, aim);
  }

  if (input.mouseDown && hero.attackTimer <= 0) {
    cancelRecall(hero);
    const target = findClosestTarget(hero, hero.attackRange + 10);
    if (target) basicAttack(hero, target);
  }

  updateRecall(hero, dt);
  levelUp(hero);
}

function updateHeroRuntime(hero, dt) {
  hero.attackTimer -= dt;
  updateHeroBuffs(hero, dt);
  const cooldownRate = getCooldownRate(hero);
  hero.qCooldown = Math.max(0, hero.qCooldown - dt * cooldownRate);
  hero.eCooldown = Math.max(0, hero.eCooldown - dt * cooldownRate);
  hero.rCooldown = Math.max(0, hero.rCooldown - dt * cooldownRate);
  hero.underAttackTimer = Math.max(0, hero.underAttackTimer - dt);
  hero.mana = clamp(hero.mana + getManaRegen(hero) * dt, 0, hero.maxMana);
  if (isInFountain(hero)) {
    hero.hp = clamp(hero.hp + 220 * dt, 0, hero.maxHp);
    hero.mana = clamp(hero.mana + 170 * dt, 0, hero.maxMana);
  }
  updateRecall(hero, dt);
}

function isLaneMatchForHero(hero, entity) {
  if (entity.kind === "minion" || entity.kind === "tower") return entity.lane === hero.targetLane;
  if (entity.kind === "hero") return entity.targetLane === hero.targetLane;
  return false;
}

function getLaneAnchor(hero) {
  const lane = LANES.find((item) => item.key === hero.targetLane);
  const alliedWave = state.minions
    .filter((minion) => minion.alive && minion.team === hero.team && minion.lane === hero.targetLane)
    .reduce((best, minion) => Math.max(best, minion.progress), 0);
  const defensiveProgress = hero.team === "blue" ? 0.18 : 0.16;
  const forwardProgress = alliedWave > 0 ? clamp(alliedWave - 0.04, defensiveProgress, 0.82) : defensiveProgress;
  return lanePointAt(lane, forwardProgress, hero.team);
}

function findLaneThreat(hero) {
  const laneThreats = getOpponents(hero.team).filter(
    (entity) => entity.kind !== "core" && isLaneMatchForHero(hero, entity),
  );
  let best = null;
  let bestDistance = Infinity;
  for (const entity of laneThreats) {
    const d = distance(hero, entity);
    if (d < bestDistance) {
      best = entity;
      bestDistance = d;
    }
  }
  return { target: best, distance: bestDistance };
}

function isLowHealthHero(hero) {
  return hero.kind === "hero" && hero.alive && hero.hp / hero.maxHp <= LOW_HP_RATIO;
}

function findNearestHeroThreat(targetHero, enemyTeam, maxRange = 340) {
  let best = null;
  let bestDistance = maxRange;
  for (const hero of state.heroes) {
    if (!hero.alive || hero.team !== enemyTeam) continue;
    const d = distance(hero, targetHero);
    if (d < bestDistance) {
      best = hero;
      bestDistance = d;
    }
  }
  return best;
}

function hasNearbyEnemyThreat(hero, maxRange = 300) {
  for (const enemy of getOpponents(hero.team)) {
    if (!enemy.alive || enemy.kind === "core") continue;
    if (distance(hero, enemy) <= maxRange) return true;
  }
  return false;
}

function shouldAiRecall(hero) {
  if (!hero.alive || hero.recalling || isInFountain(hero)) return false;
  if (hero.hp / hero.maxHp > RECALL_HP_RATIO) return false;
  if (hero.underAttackTimer > 0.2) return false;
  if (hasNearbyEnemyThreat(hero, 280)) return false;
  return true;
}

function getTeamCore(team) {
  return state.cores.find((core) => core.team === team);
}

function getCoreDefenseOrder(hero) {
  const core = getTeamCore(hero.team);
  if (!core || !core.alive || (core.threatTimer ?? 0) <= 0) return null;

  let attacker = null;
  let bestDistance = Infinity;
  for (const enemy of getOpponents(hero.team)) {
    if (!enemy.alive || enemy.kind === "core") continue;
    const dToCore = distance(core, enemy);
    if (dToCore < 380 && dToCore < bestDistance) {
      attacker = enemy;
      bestDistance = dToCore;
    }
  }

  return {
    core,
    attacker,
  };
}

function getEmergencyResponse(hero) {
  if (!hero.alive || isLowHealthHero(hero)) return null;

  let bestResponse = null;
  let bestScore = -Infinity;

  for (const otherHero of state.heroes) {
    if (!otherHero.alive || otherHero.id === hero.id || !isLowHealthHero(otherHero)) continue;
    const d = distance(hero, otherHero);

    if (otherHero.team === hero.team && d <= SUPPORT_RESPONSE_RANGE) {
      const threat = findNearestHeroThreat(otherHero, hero.team === "blue" ? "red" : "blue");
      const score = (1 - otherHero.hp / otherHero.maxHp) * 1000 - d;
      if (score > bestScore) {
        bestScore = score;
        bestResponse = { kind: "support", hero: otherHero, threat };
      }
    }

    if (otherHero.team !== hero.team && d <= CHASE_RESPONSE_RANGE) {
      const score = (1 - otherHero.hp / otherHero.maxHp) * 900 - d * 0.8;
      if (score > bestScore) {
        bestScore = score;
        bestResponse = { kind: "chase", hero: otherHero };
      }
    }
  }

  return bestResponse;
}

function updateAiHero(hero, dt) {
  if (!hero.alive) {
    hero.respawnTimer -= dt;
    if (hero.respawnTimer <= 0) respawnHero(hero);
    return;
  }

  updateHeroRuntime(hero, dt);

  const coreDefense = getCoreDefenseOrder(hero);
  if (coreDefense) {
    cancelRecall(hero);
    const defenseTarget = coreDefense.attacker ?? coreDefense.core;
    const defenseDistance = distance(hero, defenseTarget);
    hero.facing = angleTo(hero, defenseTarget);
    if (coreDefense.attacker) {
      if (defenseDistance > hero.attackRange - 10) moveToward(hero, defenseTarget.x, defenseTarget.y, dt);
      if (hero.attackTimer <= 0 && defenseDistance <= hero.attackRange) basicAttack(hero, defenseTarget);
      if (hero.qCooldown <= 0 && hero.mana >= 65 && defenseDistance < 165) castHeroQ(hero, defenseTarget);
      if (hero.eCooldown <= 0 && hero.mana >= 85 && defenseDistance < 280) castHeroE(hero, defenseTarget);
      if (hero.rCooldown <= 0 && hero.mana >= 145 && defenseDistance < 245) castHeroR(hero, defenseTarget);
    } else if (defenseDistance > 180) {
      moveToward(hero, defenseTarget.x, defenseTarget.y, dt);
    }
    levelUp(hero);
    return;
  }

  if (shouldAiRecall(hero)) {
    startRecall(hero);
  }
  if (hero.recalling) {
    levelUp(hero);
    return;
  }

  const emergency = getEmergencyResponse(hero);
  if (emergency) {
    if (emergency.kind === "support") {
      const escortTarget = emergency.hero;
      const actionTarget = emergency.threat;
      const protectDistance = distance(hero, escortTarget);

      if (actionTarget) {
        const actionDistance = distance(hero, actionTarget);
        hero.facing = angleTo(hero, actionTarget);
        if (actionDistance > hero.attackRange - 10) moveToward(hero, actionTarget.x, actionTarget.y, dt);
        if (hero.attackTimer <= 0 && actionDistance <= hero.attackRange) basicAttack(hero, actionTarget);
        if (hero.qCooldown <= 0 && hero.mana >= 65 && actionDistance < 165) castHeroQ(hero, actionTarget);
        if (hero.eCooldown <= 0 && hero.mana >= 85 && actionDistance < 280) castHeroE(hero, actionTarget);
        if (hero.rCooldown <= 0 && hero.mana >= 145 && actionDistance < 245) castHeroR(hero, actionTarget);
      } else {
        hero.facing = angleTo(hero, escortTarget);
        if (protectDistance > 90) moveToward(hero, escortTarget.x, escortTarget.y, dt);
      }
    } else {
      const chaseTarget = emergency.hero;
      const chaseDistance = distance(hero, chaseTarget);
      hero.facing = angleTo(hero, chaseTarget);
      if (chaseDistance > hero.attackRange - 10) moveToward(hero, chaseTarget.x, chaseTarget.y, dt);
      if (hero.attackTimer <= 0 && chaseDistance <= hero.attackRange) basicAttack(hero, chaseTarget);
      if (hero.qCooldown <= 0 && hero.mana >= 65 && chaseDistance < 165) castHeroQ(hero, chaseTarget);
      if (hero.eCooldown <= 0 && hero.mana >= 85 && chaseDistance < 280) castHeroE(hero, chaseTarget);
      if (hero.rCooldown <= 0 && hero.mana >= 145 && chaseDistance < 245) castHeroR(hero, chaseTarget);
    }

    levelUp(hero);
    return;
  }

  const laneFight = findLaneThreat(hero);
  if (laneFight.target && laneFight.distance < 320) {
    hero.facing = angleTo(hero, laneFight.target);
    if (laneFight.distance > hero.attackRange - 10) moveToward(hero, laneFight.target.x, laneFight.target.y, dt);
    if (hero.attackTimer <= 0 && laneFight.distance <= hero.attackRange) basicAttack(hero, laneFight.target);
    if (hero.qCooldown <= 0 && hero.mana >= 65 && laneFight.distance < 165) castHeroQ(hero, laneFight.target);
    if (hero.eCooldown <= 0 && hero.mana >= 85 && laneFight.distance < 280) castHeroE(hero, laneFight.target);
    if (hero.rCooldown <= 0 && hero.mana >= 145 && laneFight.distance < 245) castHeroR(hero, laneFight.target);
  } else {
    const anchor = getLaneAnchor(hero);
    moveToward(hero, anchor.x, anchor.y, dt);
    hero.facing = angleTo(hero, anchor);
  }

  levelUp(hero);
}

function updateMinions(dt) {
  for (const minion of state.minions) {
    if (!minion.alive) continue;
    minion.attackTimer -= dt;
    const seekRange = minion.minionType === "caster" ? 240 : 90;
    const enemies = getOpponents(minion.team).filter(
      (entity) =>
        entity.kind !== "core" &&
        (entity.kind !== "minion" || entity.lane === minion.lane) &&
        (entity.kind !== "tower" || entity.lane === minion.lane),
    );
    let target = null;
    let bestDistance = seekRange;
    for (const entity of enemies) {
      const d = distance(minion, entity);
      if (d <= bestDistance) {
        target = entity;
        bestDistance = d;
      }
    }

    if (target) {
      if (bestDistance > minion.attackRange && target.kind !== "tower") {
        moveToward(minion, target.x, target.y, dt);
      } else if (minion.attackTimer <= 0) {
        minion.attackTimer = minion.attackCooldown;
        if (minion.minionType === "caster") {
          state.projectiles.push(
            createProjectile(minion, target, {
              speed: 320,
              damage: minion.attackDamage,
              color: minion.team === "blue" ? "#a7edff" : "#ffc0b8",
              radius: 6,
            }),
          );
        } else {
          dealDamage(target, minion.attackDamage, minion);
        }
      }
    } else {
      const lane = LANES.find((item) => item.key === minion.lane);
      const progressDelta = (minion.speed * dt) / lane.length;
      minion.progress = clamp(minion.progress + progressDelta, 0, 1);
      const pos = lanePointAt(lane, minion.progress, minion.team);
      minion.x = pos.x;
      minion.y = pos.y;
    }
  }
  state.minions = state.minions.filter((minion) => minion.alive);
}

function updateCamps(dt) {
  for (const camp of state.camps) {
    if (!camp.alive) {
      camp.respawnTimer -= dt;
      if (camp.respawnTimer <= 0) {
        camp.alive = true;
        camp.hp = camp.maxHp;
        camp.x = camp.homeX;
        camp.y = camp.homeY;
        camp.aggroTarget = null;
        camp.regenTimer = 0;
      }
      continue;
    }

    camp.attackTimer -= dt;
    const homeDistance = distance(camp, { x: camp.homeX, y: camp.homeY });
    if (camp.aggroTarget && (!camp.aggroTarget.alive || distance(camp, camp.aggroTarget) > camp.leash || homeDistance > camp.leash * 0.92)) {
      camp.aggroTarget = null;
      camp.regenTimer = 0;
    }

    if (camp.aggroTarget) {
      const target = camp.aggroTarget;
      if (distance(camp, target) > camp.attackRange - 10) moveToward(camp, target.x, target.y, dt);
      confineCampToHome(camp);
      if (camp.attackTimer <= 0 && distance(camp, target) <= camp.attackRange) {
        camp.attackTimer = camp.attackCooldown;
        dealDamage(target, camp.attackDamage, camp);
      }
    } else if (distance(camp, { x: camp.homeX, y: camp.homeY }) > 8) {
      moveToward(camp, camp.homeX, camp.homeY, dt);
      confineCampToHome(camp);
      camp.regenTimer = 0;
    } else if (camp.hp < camp.maxHp) {
      camp.regenTimer += dt;
      while (camp.regenTimer >= 2) {
        camp.regenTimer -= 2;
        camp.hp = clamp(camp.hp + 20, 0, camp.maxHp);
        addFloatText(camp.x, camp.y - camp.radius - 18, "+20", "#8dffb0");
      }
    } else {
      camp.regenTimer = 0;
    }
  }
}

function updateTowers(dt) {
  for (const tower of state.towers) {
    if (!tower.alive) continue;
    tower.attackTimer -= dt;
    const target = towerTarget(tower);
    if (target && tower.attackTimer <= 0) {
      tower.attackTimer = tower.attackCooldown;
      state.projectiles.push(
        createProjectile(tower, target, {
          speed: 760,
          damage: tower.attackDamage,
          color: tower.team === "blue" ? "#b8efff" : "#ffd0ba",
          radius: 10,
          ttl: 1.25,
          trackTarget: true,
        }),
      );
    }
  }
}

function updateProjectiles(dt) {
  for (const projectile of state.projectiles) {
    if (projectile.trackTarget && projectile.targetId != null) {
      const trackedTarget = getAttackables(projectile.owner).find((entity) => entity.id === projectile.targetId && entity.alive);
      if (!trackedTarget) {
        projectile.ttl = 0;
        continue;
      }
      const aim = angleTo(projectile, trackedTarget);
      projectile.vx = Math.cos(aim) * projectile.speed;
      projectile.vy = Math.sin(aim) * projectile.speed;
    }
    projectile.x += projectile.vx * dt;
    projectile.y += projectile.vy * dt;
    projectile.ttl -= dt;
    const targets = projectile.team === "neutral" ? state.heroes : getAttackables(projectile.owner);
    for (const target of targets) {
      if (!target.alive) continue;
      if (distance(projectile, target) <= projectile.radius + target.radius) {
        dealDamage(target, projectile.damage, projectile.owner);
        if (projectile.onHit) {
          projectile.onHit(target, projectile.owner);
        }
        projectile.pierce -= 1;
        if (projectile.pierce < 0) {
          projectile.ttl = 0;
          break;
        }
      }
    }
  }
  state.projectiles = state.projectiles.filter((projectile) => projectile.ttl > 0);
}

function updateEffects(dt) {
  updateBurns(dt);
  for (const effect of state.effects) effect.ttl -= dt;
  state.effects = state.effects.filter((effect) => effect.ttl > 0);

  for (const text of state.floatTexts) {
    text.y -= 28 * dt;
    text.ttl -= dt;
  }
  state.floatTexts = state.floatTexts.filter((text) => text.ttl > 0);

  for (const item of state.feed) item.ttl -= dt;
  state.feed = state.feed.filter((item) => item.ttl > 0);
}

function updateObjectives() {
  const enemyTowers = state.towers.filter((tower) => tower.alive && tower.team === "red");
  const hero = state.player;
  const nearestLane = hero.targetLane;
  ui.laneName.textContent = `${LANES.find((lane) => lane.key === nearestLane)?.name ?? "中路"} / ${hero.laneRole}`;
  if (hero.recalling) {
    ui.objective.textContent = "正在引导回城，移动、受伤或攻击都会打断。";
  } else if (enemyTowers.length) {
    const laneCount = enemyTowers.filter((tower) => tower.lane === nearestLane).length;
    ui.objective.textContent = `当前匹配到 ${hero.laneRole}，守好 ${LANES.find((lane) => lane.key === nearestLane)?.name ?? "中路"}，这一路还剩 ${laneCount} 座敌方塔。`;
  } else {
    ui.objective.textContent = "敌方三路已破，带兵线终结主水晶。";
  }
}

function updateGame(dt) {
  if (!state.running || state.ended) return;
  state.time += dt;
  updateSpectatorCamera(dt);
  for (const core of state.cores) {
    core.threatTimer = Math.max(0, (core.threatTimer ?? 0) - dt);
  }
  state.waveTimer -= dt;
  if (state.waveTimer <= 0) {
    spawnWave();
    state.waveTimer = 15;
  }

  updatePlayer(dt);
  for (const hero of state.heroes) {
    if (!hero.isPlayer) updateAiHero(hero, dt);
  }
  updateMinions(dt);
  updateCamps(dt);
  updateTowers(dt);
  updateProjectiles(dt);
  updateEffects(dt);
  for (const hero of state.heroes) autoBuyRecommendedItems(hero);
  updateObjectives();
}

function drawPath(points, color, width) {
  ctx.strokeStyle = color;
  ctx.lineWidth = worldSizeToScreen(width);
  ctx.beginPath();
  points.forEach((point, index) => {
    const pos = worldToScreen(point.x, point.y);
    if (index === 0) ctx.moveTo(pos.x, pos.y);
    else ctx.lineTo(pos.x, pos.y);
  });
  ctx.stroke();
}

function drawMap() {
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#102821";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const riverStart = worldToScreen(0, 780).y;
  const riverEnd = worldToScreen(0, 900).y;
  ctx.fillStyle = COLORS.river;
  ctx.fillRect(0, riverStart, canvas.width, riverEnd - riverStart);

  for (const pit of [
    { x: 360, y: 850, radius: 130, fill: "rgba(255, 162, 94, 0.14)", stroke: "rgba(255, 176, 94, 0.4)", label: "小龙坑" },
    { x: 2040, y: 650, radius: 142, fill: "rgba(186, 142, 255, 0.14)", stroke: "rgba(193, 157, 255, 0.4)", label: "大龙坑" },
  ]) {
    const pos = worldToScreen(pit.x, pit.y);
    const radius = worldSizeToScreen(pit.radius);
    ctx.fillStyle = pit.fill;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = pit.stroke;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
    ctx.fillRect(pos.x - 38, pos.y - 14, 76, 22);
    ctx.fillStyle = COLORS.text;
    ctx.textAlign = "center";
    ctx.font = "bold 13px Trebuchet MS";
    ctx.fillText(pit.label, pos.x, pos.y + 2);
  }

  drawPath(LANES[0].points.map((point) => point), "#695b45", 34);
  drawPath(LANES[1].points.map((point) => point), "#786348", 38);
  drawPath(LANES[2].points.map((point) => point), "#695b45", 34);

  for (const camp of state.camps) {
    const pos = worldToScreen(camp.homeX, camp.homeY);
    const radius = worldSizeToScreen(58);
    ctx.strokeStyle = "rgba(255, 217, 160, 0.18)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
    ctx.stroke();
  }

  const blue = worldToScreen(BLUE_FOUNTAIN.x, BLUE_FOUNTAIN.y);
  const red = worldToScreen(RED_FOUNTAIN.x, RED_FOUNTAIN.y);
  const fountainRadius = worldSizeToScreen(WORLD.fountainRadius);
  const blueGrad = ctx.createRadialGradient(blue.x, blue.y, 10, blue.x, blue.y, fountainRadius);
  blueGrad.addColorStop(0, "rgba(103, 203, 255, 0.35)");
  blueGrad.addColorStop(1, "rgba(103, 203, 255, 0)");
  ctx.fillStyle = blueGrad;
  ctx.beginPath();
  ctx.arc(blue.x, blue.y, fountainRadius, 0, Math.PI * 2);
  ctx.fill();

  const redGrad = ctx.createRadialGradient(red.x, red.y, 10, red.x, red.y, fountainRadius);
  redGrad.addColorStop(0, "rgba(255, 127, 114, 0.35)");
  redGrad.addColorStop(1, "rgba(255, 127, 114, 0)");
  ctx.fillStyle = redGrad;
  ctx.beginPath();
  ctx.arc(red.x, red.y, fountainRadius, 0, Math.PI * 2);
  ctx.fill();
}

function drawHealthBar(entity, color, options = {}) {
  const pos = worldToScreen(entity.x, entity.y - entity.radius - 18);
  const width = worldSizeToScreen(entity.radius * 2.4);
  ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
  ctx.fillRect(pos.x - width / 2, pos.y, width, 8);
  ctx.fillStyle = color;
  ctx.fillRect(pos.x - width / 2, pos.y, width * (entity.hp / entity.maxHp), 8);

  if (options.showLevel && typeof entity.level === "number") {
    ctx.fillStyle = COLORS.text;
    ctx.font = "bold 12px Trebuchet MS";
    ctx.textAlign = "left";
    ctx.fillText(`Lv.${entity.level}`, pos.x + width / 2 + 8, pos.y + 8);
  }
}

function drawCircleEntity(entity, fill, stroke) {
  const pos = worldToScreen(entity.x, entity.y);
  const radius = worldSizeToScreen(entity.radius);
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = stroke;
  ctx.stroke();
}

function drawTowersAndCores() {
  for (const tower of state.towers) {
    if (!tower.alive) continue;
    if (tower.team !== state.player.team) {
      const pos = worldToScreen(tower.x, tower.y);
      const radius = worldSizeToScreen(tower.attackRange);
      ctx.save();
      ctx.strokeStyle = "rgba(255, 132, 115, 0.32)";
      ctx.setLineDash([12, 9]);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    drawCircleEntity(
      tower,
      tower.team === "blue" ? "#315e75" : "#7d3d35",
      tower.team === "blue" ? COLORS.blueSoft : COLORS.redSoft,
    );
    drawHealthBar(tower, tower.team === "blue" ? COLORS.allyHp : COLORS.enemyHp);
  }

  for (const core of state.cores) {
    if (!core.alive) continue;
    drawCircleEntity(
      core,
      core.team === "blue" ? "#183d52" : "#572020",
      core.team === "blue" ? COLORS.blueSoft : COLORS.redSoft,
    );
    drawHealthBar(core, core.team === "blue" ? COLORS.allyHp : COLORS.enemyHp);
  }
}

function drawMinions() {
  for (const minion of state.minions) {
    if (!minion.alive) continue;
    drawCircleEntity(minion, minion.team === "blue" ? "#5baecc" : "#d76c60", "rgba(255,255,255,0.5)");
    drawHealthBar(minion, minion.team === "blue" ? COLORS.allyHp : COLORS.enemyHp);
  }
}

function drawHeroes() {
  for (const hero of state.heroes) {
    if (!hero.alive) continue;
    drawCircleEntity(hero, hero.color, hero.team === "blue" ? COLORS.blueSoft : COLORS.redSoft);
    const center = worldToScreen(hero.x, hero.y);
    const radius = worldSizeToScreen(hero.radius);
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(center.x, center.y);
    ctx.lineTo(center.x + Math.cos(hero.facing) * radius * 1.55, center.y + Math.sin(hero.facing) * radius * 1.55);
    ctx.stroke();
    const buffDots = [];
    if ((hero.redBuffTimer ?? 0) > 0) buffDots.push("#ff8d73");
    if ((hero.blueBuffTimer ?? 0) > 0) buffDots.push("#7bbcff");
    if ((hero.dragonBuffTimer ?? 0) > 0) buffDots.push("#ffb05e");
    if ((hero.baronBuffTimer ?? 0) > 0) buffDots.push("#c19dff");
    buffDots.forEach((color, index) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(center.x - 14 + index * 10, center.y - radius - 18, 4, 0, Math.PI * 2);
      ctx.fill();
    });
    drawHealthBar(hero, hero.team === "blue" ? COLORS.allyHp : COLORS.enemyHp, { showLevel: true });
  }
}

function drawCamps() {
  for (const camp of state.camps) {
    if (!camp.alive) continue;
    drawCircleEntity(camp, camp.color, camp.stroke);
    drawHealthBar(camp, "#f4c27d");
  }
}

function drawProjectiles() {
  for (const projectile of state.projectiles) {
    const pos = worldToScreen(projectile.x, projectile.y);
    const radius = worldSizeToScreen(projectile.radius);
    if (projectile.owner?.kind === "tower") {
      ctx.globalAlpha = 0.28;
      ctx.fillStyle = projectile.color;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, radius * 1.9, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = "#fff4dd";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, radius + 2, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = projectile.color;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawEffects() {
  for (const effect of state.effects) {
    const pos = worldToScreen(effect.x, effect.y);
    const radius = worldSizeToScreen(effect.radius);
    ctx.globalAlpha = clamp(effect.ttl / effect.maxTtl, 0, 1);
    ctx.strokeStyle = effect.color;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  for (const text of state.floatTexts) {
    const pos = worldToScreen(text.x, text.y);
    ctx.globalAlpha = clamp(text.ttl / text.maxTtl, 0, 1);
    ctx.fillStyle = text.color;
    ctx.textAlign = "center";
    ctx.font = "bold 18px Trebuchet MS";
    ctx.fillText(text.text, pos.x, pos.y);
    ctx.globalAlpha = 1;
  }
}

function drawFeed() {
  if (!state.feed.length) return;
  const centerX = canvas.width / 2;
  ctx.textAlign = "center";
  for (let index = 0; index < state.feed.length; index += 1) {
    const item = state.feed[index];
    const y = 72 + index * 30;
    ctx.globalAlpha = clamp(item.ttl / item.maxTtl, 0, 1);
    ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
    ctx.fillRect(centerX - 240, y - 18, 480, 24);
    ctx.fillStyle = item.color;
    ctx.font = "bold 16px Trebuchet MS";
    ctx.fillText(item.text, centerX, y);
    ctx.globalAlpha = 1;
  }
}

function drawRespawnTimer() {
  const hero = state.player;
  if (hero.alive || hero.respawnTimer <= 0 || state.ended) return;

  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  ctx.save();
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(0, 0, 0, 0.62)";
  ctx.fillRect(centerX - 220, centerY - 78, 440, 126);
  ctx.fillStyle = COLORS.enemyHp;
  ctx.font = "bold 28px Trebuchet MS";
  ctx.fillText("你已阵亡", centerX, centerY - 18);
  ctx.fillStyle = COLORS.text;
  ctx.font = "bold 22px Trebuchet MS";
  ctx.fillText(`${Math.ceil(hero.respawnTimer)} 秒后复活`, centerX, centerY + 20);
  ctx.font = "bold 16px Trebuchet MS";
  ctx.fillText("可用鼠标移动观战视野，期间无法移动或造成伤害", centerX, centerY + 50);
  ctx.restore();
}

function render() {
  drawMap();
  drawTowersAndCores();
  drawCamps();
  drawMinions();
  drawHeroes();
  drawProjectiles();
  drawEffects();
  drawFeed();
  drawRespawnTimer();
}

function updateHud() {
  const hero = state.player;
  const def = getHeroDef(hero);
  ui.level.textContent = `${hero.level}`;
  ui.gold.textContent = `${Math.round(hero.gold)}`;
  ui.quickGold.textContent = `${Math.round(hero.gold)}`;
  const buffs = [
    { key: "red", name: "红 Buff", timer: hero.redBuffTimer },
    { key: "blue", name: "蓝 Buff", timer: hero.blueBuffTimer },
    { key: "dragon", name: "小龙", timer: hero.dragonBuffTimer },
    { key: "baron", name: "大龙", timer: hero.baronBuffTimer },
  ].filter((item) => (item.timer ?? 0) > 0);
  ui.quickBuffs.innerHTML = buffs
    .map(
      (item) => `<div class="quick-ui__buff quick-ui__buff--${item.key}"><strong>${item.name}</strong><span>${item.timer.toFixed(0)} 秒</span></div>`,
    )
    .join("");
  ui.score.textContent = `${hero.kills} / ${hero.deaths} / ${hero.assists}`;
  ui.wave.textContent = `${state.waveIndex}`;
  ui.hpLabel.textContent = `生命 / 等级 Lv.${hero.level}`;
  ui.hpText.textContent = `Lv.${hero.level}  ${Math.round(hero.hp)} / ${Math.round(hero.maxHp)}`;
  ui.manaText.textContent = `${Math.round(hero.mana)} / ${Math.round(hero.maxMana)}`;
  ui.xpText.textContent = hero.level >= MAX_LEVEL ? "已满级" : `${Math.round(hero.xp)} / ${Math.round(hero.xpToLevel)}`;
  ui.qName.textContent = def.qName;
  ui.eName.textContent = def.eName;
  ui.rName.textContent = def.rName;
  ui.qCd.textContent = isSkillUnlocked(hero, "q")
    ? (hero.qCooldown > 0 ? `${hero.qCooldown.toFixed(1)} 秒` : "可用")
    : `Lv.${hero.qUnlockLevel} 解锁`;
  ui.eCd.textContent = isSkillUnlocked(hero, "e")
    ? (hero.eCooldown > 0 ? `${hero.eCooldown.toFixed(1)} 秒` : "可用")
    : `Lv.${hero.eUnlockLevel} 解锁`;
  ui.rCd.textContent = isSkillUnlocked(hero, "r")
    ? (hero.rCooldown > 0 ? `${hero.rCooldown.toFixed(1)} 秒` : "可用")
    : `Lv.${hero.rUnlockLevel} 解锁`;
  ui.recallText.textContent = hero.recalling ? `${hero.recallTimer.toFixed(1)} 秒` : "未引导";
  ui.tCd.textContent = hero.recalling ? `${hero.recallTimer.toFixed(1)} 秒` : "可引导";
  ui.quickRecall.classList.toggle("quick-ui__recall--active", hero.recalling);
  ui.quickRecallText.textContent = hero.recalling ? `回城中 ${hero.recallTimer.toFixed(1)} 秒` : "未引导";
  ui.quickRecallBar.style.width = `${(hero.recalling ? 1 - hero.recallTimer / 3 : 0) * 100}%`;
  ui.heroName.textContent = `${def.name} · ${hero.laneRole}`;
  const nextItemId = hero.buildOrder[hero.autoBuyIndex];
  const nextItem = SHOP_ITEMS.find((entry) => entry.id === nextItemId);
  ui.shopHint.textContent = nextItem
    ? `自动出装中：下件 ${nextItem.name}，需要 ${nextItem.cost}G。`
    : "自动出装已完成，装备已经买满。";
  setBar(ui.hpBar, hero.hp / hero.maxHp);
  setBar(ui.manaBar, hero.mana / hero.maxMana);
  setBar(ui.xpBar, hero.level >= MAX_LEVEL ? 1 : hero.xp / hero.xpToLevel);
  setBar(ui.recallBar, hero.recalling ? 1 - hero.recallTimer / 3 : 0);
}

function resetGame() {
  nextEntityId = 1;
  state = createGameState(preferredLane);
  state.running = true;
  ui.startOverlay.classList.remove("overlay--active");
  ui.endOverlay.classList.remove("overlay--active");
  ui.shop.classList.remove("shop--open");
  renderInventory();
  updateHud();
}

function returnToSelection() {
  nextEntityId = 1;
  state = createGameState(preferredLane);
  state.running = false;
  state.ended = false;
  ui.endOverlay.classList.remove("overlay--active");
  ui.startOverlay.classList.add("overlay--active");
  ui.shop.classList.remove("shop--open");
  renderHeroSelection();
  renderInventory();
  updateHud();
  render();
}

let lastTime = 0;
function frame(now) {
  const dt = Math.min((now - lastTime) / 1000 || 0, 1 / 30);
  lastTime = now;
  try {
    updateGame(dt);
    render();
    updateHud();
  } catch (error) {
    console.error("Game loop error:", error);
  }
  input.pressed.clear();
  requestAnimationFrame(frame);
}

window.addEventListener("resize", resize);
window.addEventListener("keydown", (event) => {
  if (event.code === "Tab") {
    event.preventDefault();
    hudCollapsed = !hudCollapsed;
    syncHudVisibility();
    return;
  }
  input.keys.add(event.code);
  input.pressed.add(event.code);
});
window.addEventListener("keyup", (event) => {
  input.keys.delete(event.code);
});
window.addEventListener("mousemove", (event) => {
  input.mouseX = event.clientX * (canvas.width / window.innerWidth);
  input.mouseY = event.clientY * (canvas.height / window.innerHeight);
});
window.addEventListener("mousedown", () => {
  input.mouseDown = true;
});
window.addEventListener("mouseup", () => {
  input.mouseDown = false;
});

ui.shopItems.addEventListener("click", (event) => {
  const button = event.target.closest("[data-buy]");
  if (!button) return;
  buyItem(button.dataset.buy);
});

ui.shopClose.addEventListener("click", () => {
  state.shopOpen = false;
  ui.shop.classList.remove("shop--open");
});

ui.heroGrid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-lane]");
  if (!button) return;
  preferredLane = button.dataset.lane;
  renderHeroSelection();
});

ui.hudToggle.addEventListener("click", () => {
  hudCollapsed = !hudCollapsed;
  syncHudVisibility();
});

ui.startButton.addEventListener("click", resetGame);
ui.restartButton.addEventListener("click", returnToSelection);

renderHeroSelection();
renderShop();
renderInventory();
syncHudVisibility();
resize();
render();
updateHud();
requestAnimationFrame(frame);
