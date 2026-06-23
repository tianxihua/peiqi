(function () {
  const canvas = document.querySelector("#game");
  const ctx = canvas.getContext("2d");

  const ui = {
    statWaveLabel: document.querySelector("#stat-wave-label"),
    statKillsLabel: document.querySelector("#stat-kills-label"),
    statComboLabel: document.querySelector("#stat-combo-label"),
    statScoreLabel: document.querySelector("#stat-score-label"),
    wave: document.querySelector("#wave"),
    kills: document.querySelector("#kills"),
    combo: document.querySelector("#combo"),
    score: document.querySelector("#score"),
    hpText: document.querySelector("#hp-text"),
    hpBar: document.querySelector("#hp-bar"),
    chakraText: document.querySelector("#chakra-text"),
    chakraBar: document.querySelector("#chakra-bar"),
    p1VitalsLabel: document.querySelector("#p1-vitals-label"),
    
    slashName: document.querySelector("#slash-name"),
    shurikenName: document.querySelector("#shuriken-name"),
    cloneName: document.querySelector("#clone-name"),
    burstName: document.querySelector("#burst-name"),
    ultName: document.querySelector("#ult-name"),
    slashCd: document.querySelector("#slash-cd"),
    shurikenCd: document.querySelector("#shuriken-cd"),
    cloneCd: document.querySelector("#clone-cd"),
    burstCd: document.querySelector("#burst-cd"),
    ultCd: document.querySelector("#ult-cd"),
    gameShell: document.querySelector(".game-shell"),
    startOverlay: document.querySelector("#start-overlay"),
    endOverlay: document.querySelector("#end-overlay"),
    endEyebrow: document.querySelector("#end-eyebrow"),
    endTitle: document.querySelector("#end-title"),
    endText: document.querySelector("#end-text"),
    startButton: document.querySelector("#start-button"),
    restartButton: document.querySelector("#restart-button"),
    modeCards: [...document.querySelectorAll(".mode-card")],
    loadoutCards: [...document.querySelectorAll(".loadout-card[data-style]")],
  };

  const WORLD = { width: 1900, height: 1120 };
  const KEYS = new Set();
  const POINTER = { x: 0, y: 0, worldX: 0, worldY: 0, down: false };
  const DPR_CAP = 2;
  const P1_CONTROLS = {
    up: "KeyW",
    down: "KeyS",
    left: "KeyA",
    right: "KeyD",
    attack: "MouseLeft",
    shuriken: "KeyQ",
    clone: "KeyE",
    burst: "KeyR",
    ultimate: "KeyZ",
    charge: "KeyC",
    dash: "Space",
  };
  

  const COLORS = {
    player: "#ffd36a",
    playerCore: "#fff8d7",
    gold: "#ffd36a",
    cyan: "#69e6ff",
    violet: "#bc8cff",
    red: "#ff6666",
    enemy: "#ff6666",
    brute: "#ff9a5e",
    sniper: "#69e6ff",
    boss: "#bc8cff",
    ink: "#f5f0df",
    shadow: "rgba(0, 0, 0, 0.28)",
  };

  const LOADOUTS = {
    balanced: {
      name: "岚",
      title: "均衡流",
      hp: 112,
      speed: 340,
      dash: 560,
      damage: 1,
      chakraGain: 1.12,
      color: "#ffd36a",
      core: "#fff8d7",
      skills: {
        slash: "风刃连斩",
        q: "星铁手里剑",
        e: "残影步",
        r: "查克拉震",
        z: "月轮奥义",
        qCost: 9,
        eCost: 24,
        rCost: 32,
      },
    },
    swift: {
      name: "绯月",
      title: "雷影流",
      hp: 86,
      speed: 392,
      dash: 670,
      damage: 0.94,
      chakraGain: 1.2,
      color: "#69e6ff",
      core: "#ddfbff",
      skills: {
        slash: "瞬牙三闪",
        q: "绯星飞针",
        e: "雷影换位",
        r: "疾雷穿心",
        z: "绯月乱舞",
        qCost: 8,
        eCost: 22,
        rCost: 30,
      },
    },
    guard: {
      name: "铁心",
      title: "岩铠流",
      hp: 156,
      speed: 305,
      dash: 490,
      damage: 1.05,
      chakraGain: 1,
      color: "#ff9a5e",
      core: "#ffe2c5",
      skills: {
        slash: "重岩断",
        q: "回旋重刃",
        e: "铁壁替身",
        r: "地裂震",
        z: "不动山河",
        qCost: 14,
        eCost: 26,
        rCost: 36,
      },
    },
  };

  const state = {
    running: false,
    paused: false,
    finished: false,
    selectedMode: "trial",
    selectedStyle: "balanced",
    time: 0,
    lastTime: 0,
    shake: 0,
    hitStop: 0,
    wave: 1,
    kills: 0,
    score: 0,
    combo: 0,
    comboTimer: 0,
    camera: { x: 0, y: 0, zoom: 1 },
    player: null,
    opponent: null,
    enemies: [],
    projectiles: [],
    slashes: [],
    particles: [],
    clones: [],
    pickups: [],
    hazards: [],
    duelCallout: { text: "", life: 0, maxLife: 1 },
    waveBanner: 2,
  };

  function createPlayer(style = state.selectedStyle, x = WORLD.width / 2, y = WORLD.height / 2 + 100) {
    const loadout = LOADOUTS[style];
    return {
      id: `fighter-${style}-${Math.random().toString(36).slice(2)}`,
      style,
      name: loadout.name,
      title: loadout.title,
      x,
      y,
      vx: 0,
      vy: 0,
      radius: 20,
      facing: -Math.PI / 2,
      color: loadout.color,
      core: loadout.core,
      hp: loadout.hp,
      maxHp: loadout.hp,
      chakra: 70,
      maxChakra: 100,
      speed: loadout.speed,
      dashSpeed: loadout.dash,
      damageScale: loadout.damage,
      chakraGain: loadout.chakraGain,
      invuln: 0,
      dashTime: 0,
      dashCooldown: 0,
      slashCooldown: 0,
      slashChain: 0,
      shurikenCooldown: 0,
      cloneCooldown: 0,
      burstCooldown: 0,
      ultimateCooldown: 0,
      substitutionCooldown: 0,
      charging: false,
    };
  }

  function resetGame() {
    state.running = true;
    state.paused = false;
    state.finished = false;
    state.time = 0;
    state.lastTime = performance.now();
    state.shake = 0;
    state.hitStop = 0;
    state.wave = 1;
    state.kills = 0;
    state.score = 0;
    state.combo = 0;
    state.comboTimer = 0;
    state.player = createPlayer(
      state.selectedStyle,
      WORLD.width / 2,
      state.selectedMode === "duel" ? WORLD.height / 2 + 220 : WORLD.height / 2 + 100,
    );
    state.opponent = null;
    state.enemies = [];
    state.projectiles = [];
    state.slashes = [];
    state.particles = [];
    state.clones = [];
    state.pickups = [];
    state.hazards = [];
    state.duelCallout = { text: "", life: 0, maxLife: 1 };
    state.waveBanner = 2.2;
    if (state.selectedMode === "duel") {
      ui.gameShell.classList.add("duel-mode");
      startDuel();
    } else {
      ui.gameShell.classList.remove("duel-mode");
      spawnWave();
    }
    ui.startOverlay.classList.remove("overlay--active");
    ui.endOverlay.classList.remove("overlay--active");
  }

  function startDuel() {
    const styles = ["balanced", "swift", "guard"].filter((style) => style !== state.selectedStyle);
    const randomStyle = styles[Math.floor(Math.random() * styles.length)] || "swift";
    state.opponent = createDuelOpponent(randomStyle);
    state.enemies.push(state.opponent);
    state.waveBanner = 2.4;
  }

  function createDuelOpponent(style) {
    const fighter = createPlayer(style, WORLD.width / 2, WORLD.height / 2 - 220);
    fighter.id = `ai-${style}-${Math.random().toString(36).slice(2)}`;
    fighter.type = "duelist";
    fighter.ai = true;
    fighter.radius = 22;
    fighter.hp = Math.round(fighter.hp * 1.06);
    fighter.maxHp = fighter.hp;
    fighter.chakra = 65;
    fighter.attackCooldown = 0.2;
    fighter.shootCooldown = 0.8;
    fighter.tacticTimer = 0;
    fighter.stun = 0;
    fighter.mark = 0;
    fighter.damage = 14;
    fighter.color = LOADOUTS[style].color;
    return fighter;
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    state.camera.zoom = Math.min(window.innerWidth / 1180, window.innerHeight / 720, 1.05);
  }

  function spawnWave() {
    const count = 4 + state.wave * 2;
    for (let i = 0; i < count; i += 1) {
      const roll = Math.random();
      const type = state.wave >= 4 && roll > 0.76 ? "brute" : roll > 0.58 ? "sniper" : "scout";
      spawnEnemy(type, i);
    }
    if (state.wave === 5) {
      spawnEnemy("boss", 99);
    }
  }

  function spawnEnemy(type, index) {
    const edge = index % 4;
    const margin = 90;
    const x = edge === 0 ? margin : edge === 2 ? WORLD.width - margin : 180 + Math.random() * (WORLD.width - 360);
    const y = edge === 1 ? margin : edge === 3 ? WORLD.height - margin : 160 + Math.random() * (WORLD.height - 320);
    const defs = {
      scout: { hp: 38 + state.wave * 5, speed: 154, radius: 17, damage: 9, color: COLORS.enemy },
      brute: { hp: 92 + state.wave * 13, speed: 108, radius: 26, damage: 17, color: COLORS.brute },
      sniper: { hp: 48 + state.wave * 7, speed: 118, radius: 18, damage: 10, color: COLORS.sniper },
      boss: { hp: 760, speed: 92, radius: 48, damage: 22, color: COLORS.boss },
    };
    const def = defs[type];
    state.enemies.push({
      id: Math.random().toString(36).slice(2),
      type,
      x,
      y,
      vx: 0,
      vy: 0,
      hp: def.hp,
      maxHp: def.hp,
      speed: def.speed,
      radius: def.radius,
      damage: def.damage,
      color: def.color,
      attackCooldown: 0.4 + Math.random() * 0.7,
      shootCooldown: 1 + Math.random() * 1.2,
      stun: 0,
      mark: 0,
    });
  }

  function update(rawDt) {
    if (!state.running || state.finished || state.paused) return;
    let dt = Math.min(rawDt, 0.033);
    if (state.hitStop > 0) {
      state.hitStop -= rawDt;
      dt *= 0.15;
    }
    state.time += dt;
    state.waveBanner = Math.max(0, state.waveBanner - dt);
    state.duelCallout.life = Math.max(0, state.duelCallout.life - dt);
    updatePointerWorld();
    if (state.selectedMode === "duel") {
      updateDuelPlayers(dt);
    } else {
      updatePlayer(dt);
    }
    updateClones(dt);
    updateEnemies(dt);
    updateProjectiles(dt);
    updateSlashes(dt);
    updatePickups(dt);
    updateHazards(dt);
    updateParticles(dt);
    updateCamera(dt);
    updateUi();
    if (state.selectedMode === "duel") {
      if (state.opponent && state.opponent.hp <= 0) finishGame(true);
    } else if (state.enemies.length === 0 && state.wave < 5) {
      state.wave += 1;
      state.waveBanner = 2.1;
      spawnWave();
    } else if (state.enemies.length === 0 && state.wave >= 5) {
      finishGame(true);
    }
  }

  function updatePlayer(dt) {
    const p = state.player;
    const axis = getMoveAxis();
    const aim = Math.atan2(POINTER.worldY - p.y, POINTER.worldX - p.x);
    p.facing = aim;
    tickCooldowns(p, dt);
    p.invuln = Math.max(0, p.invuln - dt);

    if ((KEYS.has("Space") || KEYS.has("ShiftLeft")) && p.dashCooldown <= 0) {
      p.dashTime = 0.16;
      p.dashCooldown = 0.88;
      p.invuln = 0.22;
      burstParticles(p.x, p.y, COLORS.cyan, 18, 220);
    }

    const speed = p.dashTime > 0 ? p.dashSpeed : p.speed;
    p.dashTime = Math.max(0, p.dashTime - dt);
    p.vx = axis.x * speed;
    p.vy = axis.y * speed;
    p.x = clamp(p.x + p.vx * dt, 44, WORLD.width - 44);
    p.y = clamp(p.y + p.vy * dt, 44, WORLD.height - 44);
    p.chakra = Math.min(p.maxChakra, p.chakra + 8 * dt);
    p.charging = state.selectedMode === "duel" && KEYS.has("KeyC") && axis.x === 0 && axis.y === 0;
    if (p.charging) {
      p.chakra = Math.min(p.maxChakra, p.chakra + 46 * dt);
      if (Math.random() < dt * 18) burstParticles(p.x, p.y, COLORS.cyan, 2, 80);
    }

    if (POINTER.down) slash();
    if (KEYS.has("KeyQ")) throwShuriken();
    if (KEYS.has("KeyE")) summonClone();
    if (KEYS.has("KeyR")) chakraBurst();
    if (KEYS.has("KeyZ")) ultimate();

    state.comboTimer = Math.max(0, state.comboTimer - dt);
    if (state.comboTimer <= 0) state.combo = 0;
  }

  function updateDuelPlayers(dt) {
    if (!state.player || !state.opponent) return;
    updateHumanFighter(state.player, P1_CONTROLS, "player", state.opponent, dt);
    updateDuelist(state.opponent, dt);
    state.comboTimer = Math.max(0, state.comboTimer - dt);
    if (state.comboTimer <= 0) state.combo = 0;
  }

  function updateHumanFighter(fighter, controls, owner, target, dt) {
    const axis = getMoveAxisFor(controls);
    tickCooldowns(fighter, dt);
    fighter.attackCooldown = Math.max(0, (fighter.attackCooldown || 0) - dt);
    fighter.invuln = Math.max(0, fighter.invuln - dt);
    fighter.mark = Math.max(0, (fighter.mark || 0) - dt);
    fighter.stun = Math.max(0, (fighter.stun || 0) - dt);
    if (fighter.stun > 0) return;

    if (axis.x || axis.y) {
      fighter.facing = Math.atan2(axis.y, axis.x);
    } else if (target) {
      fighter.facing = Math.atan2(target.y - fighter.y, target.x - fighter.x);
    }

    if (KEYS.has(controls.dash) && fighter.dashCooldown <= 0) {
      fighter.dashTime = 0.16;
      fighter.dashCooldown = 0.88;
      fighter.invuln = 0.18;
      burstParticles(fighter.x, fighter.y, fighter.color, 18, 220);
    }

    const speed = fighter.dashTime > 0 ? fighter.dashSpeed : fighter.speed;
    fighter.dashTime = Math.max(0, fighter.dashTime - dt);
    fighter.x = clamp(fighter.x + axis.x * speed * dt, 52, WORLD.width - 52);
    fighter.y = clamp(fighter.y + axis.y * speed * dt, 52, WORLD.height - 52);
    fighter.chakra = Math.min(fighter.maxChakra, fighter.chakra + 8 * dt);
    fighter.charging = KEYS.has(controls.charge) && axis.x === 0 && axis.y === 0;
    if (fighter.charging) {
      fighter.chakra = Math.min(fighter.maxChakra, fighter.chakra + 46 * dt);
      if (Math.random() < dt * 18) burstParticles(fighter.x, fighter.y, fighter.color, 2, 80);
    }

    if ((controls.attack === "MouseLeft" && POINTER.down) || KEYS.has(controls.attack)) {
      fighterSlash(fighter, owner);
    }
    if (KEYS.has(controls.shuriken)) fighterThrowShuriken(fighter, owner);
    if (KEYS.has(controls.clone)) fighterSummonClone(fighter, owner);
    if (KEYS.has(controls.burst)) fighterChakraBurst(fighter, owner);
    if (KEYS.has(controls.ultimate)) fighterUltimate(fighter, owner);
  }

  function tickCooldowns(p, dt) {
    p.dashCooldown = Math.max(0, p.dashCooldown - dt);
    p.slashCooldown = Math.max(0, p.slashCooldown - dt);
    p.shurikenCooldown = Math.max(0, p.shurikenCooldown - dt);
    p.cloneCooldown = Math.max(0, p.cloneCooldown - dt);
    p.burstCooldown = Math.max(0, p.burstCooldown - dt);
    p.ultimateCooldown = Math.max(0, p.ultimateCooldown - dt);
    p.substitutionCooldown = Math.max(0, p.substitutionCooldown - dt);
  }

  function kit(fighter) {
    return LOADOUTS[fighter.style].skills;
  }

  function duelCallout(text, duration = 1) {
    if (state.selectedMode !== "duel") return;
    state.duelCallout = { text, life: duration, maxLife: duration };
  }

  function slash() {
    fighterSlash(state.player, "player");
  }

  function fighterSlash(fighter, owner) {
    if (fighter.slashCooldown > 0) return;
    duelCallout(`${fighter.name}：${kit(fighter).slash}`);
    fighter.slashChain = (fighter.slashChain % 3) + 1;
    const heavy = fighter.slashChain === 3;
    const profile = {
      balanced: { cooldown: heavy ? 0.33 : 0.22, range: heavy ? 132 : 106, arc: heavy ? Math.PI * 0.95 : Math.PI * 0.75, damage: heavy ? 34 : 22, color: COLORS.gold },
      swift: { cooldown: heavy ? 0.24 : 0.16, range: heavy ? 112 : 92, arc: heavy ? Math.PI * 0.7 : Math.PI * 0.54, damage: heavy ? 27 : 16, color: COLORS.cyan },
      guard: { cooldown: heavy ? 0.5 : 0.36, range: heavy ? 154 : 126, arc: heavy ? Math.PI * 1.14 : Math.PI * 0.92, damage: heavy ? 52 : 30, color: COLORS.brute },
    }[fighter.style];
    fighter.slashCooldown = profile.cooldown;
    state.slashes.push({
      x: fighter.x,
      y: fighter.y,
      angle: fighter.facing,
      range: profile.range,
      arc: profile.arc,
      damage: profile.damage * fighter.damageScale,
      life: 0.13,
      maxLife: 0.13,
      color: heavy ? profile.color : COLORS.ink,
      owner,
      attacker: fighter,
      hit: new Set(),
    });
    if (owner === "player") {
      addChakra((heavy ? 5 : 3) * (fighter.style === "swift" ? 1.1 : 1));
    } else {
      fighter.chakra = Math.min(fighter.maxChakra, fighter.chakra + (heavy ? 5 : 3) * (fighter.style === "swift" ? 1.1 : 1));
    }
    burstParticles(fighter.x + Math.cos(fighter.facing) * 42, fighter.y + Math.sin(fighter.facing) * 42, profile.color, heavy ? 20 : 10, 130);
  }

  function throwShuriken() {
    fighterThrowShuriken(state.player, "player");
  }

  function fighterThrowShuriken(fighter, owner) {
    const skills = kit(fighter);
    if (fighter.shurikenCooldown > 0 || fighter.chakra < skills.qCost) return;
    fighter.chakra -= skills.qCost;
    const profiles = {
      balanced: { cooldown: 0.34, speed: 760, radius: 8, damage: 18, life: 0.86, color: COLORS.cyan, spread: state.combo >= 8 ? [-0.15, 0, 0.15] : [0], stun: 0 },
      swift: { cooldown: 0.22, speed: 900, radius: 6, damage: 12, life: 0.72, color: COLORS.cyan, spread: state.combo >= 6 ? [-0.2, -0.07, 0.07, 0.2] : [-0.1, 0.1], stun: 0 },
      guard: { cooldown: 0.62, speed: 560, radius: 13, damage: 31, life: 1.12, color: COLORS.brute, spread: [0], stun: 0.22 },
    };
    const profile = profiles[fighter.style];
    fighter.shurikenCooldown = profile.cooldown;
    duelCallout(`${fighter.name}：${skills.q}`);
    const spread = profile.spread;
    spread.forEach((offset) => {
      const angle = fighter.facing + offset;
      state.projectiles.push({
        x: fighter.x + Math.cos(angle) * 28,
        y: fighter.y + Math.sin(angle) * 28,
        vx: Math.cos(angle) * profile.speed,
        vy: Math.sin(angle) * profile.speed,
        radius: profile.radius,
        life: profile.life,
        damage: profile.damage * fighter.damageScale,
        color: profile.color,
        owner,
        attacker: fighter,
        spin: 0,
        stun: profile.stun,
      });
    });
  }

  function summonClone() {
    fighterSummonClone(state.player, "player");
  }

  function fighterSummonClone(fighter, owner) {
    const skills = kit(fighter);
    if (fighter.cloneCooldown > 0 || fighter.chakra < skills.eCost) return;
    fighter.chakra -= skills.eCost;
    duelCallout(`${fighter.name}：${skills.e}`);
    if (fighter.style === "swift") {
      fighter.cloneCooldown = 3.6;
      const oldX = fighter.x;
      const oldY = fighter.y;
      fighter.x = clamp(fighter.x + Math.cos(fighter.facing) * 165, 44, WORLD.width - 44);
      fighter.y = clamp(fighter.y + Math.sin(fighter.facing) * 165, 44, WORLD.height - 44);
      fighter.invuln = 0.26;
      burstParticles(oldX, oldY, COLORS.violet, 32, 210);
      burstParticles(fighter.x, fighter.y, COLORS.cyan, 26, 250);
      for (let i = -1; i <= 1; i += 2) {
        const angle = fighter.facing + i * 0.22;
        state.projectiles.push({
          x: fighter.x + Math.cos(angle) * 24,
          y: fighter.y + Math.sin(angle) * 24,
          vx: Math.cos(angle) * 620,
          vy: Math.sin(angle) * 620,
          radius: 7,
          life: 0.76,
          damage: 14 * fighter.damageScale,
          color: COLORS.violet,
          owner,
          attacker: fighter,
          spin: 0,
        });
      }
      return;
    }
    if (fighter.style === "guard") {
      fighter.cloneCooldown = 6.4;
      fighter.invuln = 1.05;
      fighter.hp = Math.min(fighter.maxHp, fighter.hp + 10);
      state.clones.push({
        x: fighter.x - Math.cos(fighter.facing) * 46,
        y: fighter.y - Math.sin(fighter.facing) * 46,
        life: 2.6,
        attackCooldown: 0.2,
        angle: fighter.facing,
        owner,
        attacker: fighter,
        color: fighter.color,
      });
      burstParticles(fighter.x, fighter.y, COLORS.brute, 46, 210);
      return;
    }
    fighter.cloneCooldown = 5.6;
    for (let i = -1; i <= 1; i += 2) {
      const angle = fighter.facing + i * 1.9;
      state.clones.push({
        x: fighter.x - Math.cos(fighter.facing) * 28 + Math.cos(angle) * 26,
        y: fighter.y - Math.sin(fighter.facing) * 28 + Math.sin(angle) * 26,
        life: 3.2,
        attackCooldown: 0.15 + Math.random() * 0.2,
        angle: fighter.facing,
        owner,
        attacker: fighter,
        color: fighter.color,
      });
    }
    burstParticles(fighter.x, fighter.y, COLORS.violet, 32, 190);
  }

  function chakraBurst() {
    fighterChakraBurst(state.player, "player");
  }

  function fighterChakraBurst(fighter, owner) {
    const skills = kit(fighter);
    if (fighter.burstCooldown > 0 || fighter.chakra < skills.rCost) return;
    fighter.chakra -= skills.rCost;
    duelCallout(`${fighter.name}：${skills.r}`);
    state.shake = Math.max(state.shake, 9);
    state.hitStop = Math.max(state.hitStop, 0.08);
    if (fighter.style === "swift") {
      fighter.burstCooldown = 3.2;
      const startX = fighter.x;
      const startY = fighter.y;
      const endX = clamp(fighter.x + Math.cos(fighter.facing) * 250, 44, WORLD.width - 44);
      const endY = clamp(fighter.y + Math.sin(fighter.facing) * 250, 44, WORLD.height - 44);
      hitOpponentsOnSegment(owner, fighter, startX, startY, endX, endY, 46, 34 * fighter.damageScale, "burst", 0.28);
      fighter.x = endX;
      fighter.y = endY;
      fighter.invuln = 0.18;
      burstParticles(startX, startY, COLORS.cyan, 30, 260);
      burstParticles(fighter.x, fighter.y, COLORS.cyan, 42, 430);
      return;
    }
    if (fighter.style === "guard") {
      fighter.burstCooldown = 4.8;
      hitOpponentsInRadius(owner, fighter, 248, 24 * fighter.damageScale, "burst", 0.95, 64);
      burstParticles(fighter.x, fighter.y, COLORS.brute, 78, 430);
      return;
    }
    fighter.burstCooldown = 3.8;
    hitOpponentsInRadius(owner, fighter, 188, 28 * fighter.damageScale, "burst", 0.55, 42);
    burstParticles(fighter.x, fighter.y, COLORS.cyan, 64, 390);
  }

  function ultimate() {
    fighterUltimate(state.player, "player");
  }

  function fighterUltimate(fighter, owner) {
    if (fighter.ultimateCooldown > 0 || fighter.chakra < fighter.maxChakra) return;
    duelCallout(`${fighter.name}：${kit(fighter).z}`);
    fighter.ultimateCooldown = fighter.style === "guard" ? 10 : fighter.style === "swift" ? 7 : 8;
    fighter.chakra = 0;
    state.shake = 8;
    state.hitStop = 0.03;
    if (fighter.style === "swift") {
      for (let i = 0; i < 8; i += 1) {
        state.slashes.push({
          x: fighter.x + Math.cos(fighter.facing + i * 0.38) * (i % 3) * 14,
          y: fighter.y + Math.sin(fighter.facing + i * 0.38) * (i % 3) * 14,
          angle: fighter.facing - 1.05 + i * 0.11,
          range: 180,
          arc: Math.PI * 0.22,
          damage: 24 * fighter.damageScale,
          life: 0.12 + i * 0.008,
          maxLife: 0.2,
          color: i % 2 ? COLORS.cyan : COLORS.violet,
          owner,
          attacker: fighter,
          ultimate: true,
          hit: new Set(),
        });
      }
      burstParticles(fighter.x, fighter.y, COLORS.cyan, 22, 280);
      return;
    }
    if (fighter.style === "guard") {
      for (let i = 0; i < 5; i += 1) {
        state.slashes.push({
          x: fighter.x,
          y: fighter.y,
          angle: (Math.PI * 2 * i) / 5,
          range: 240,
          arc: Math.PI * 0.48,
          damage: 38 * fighter.damageScale,
          life: 0.16 + i * 0.01,
          maxLife: 0.24,
          color: COLORS.brute,
          owner,
          attacker: fighter,
          ultimate: true,
          hit: new Set(),
        });
      }
      if (owner === "player") {
        state.enemies.forEach((enemy) => {
          if (dist(fighter, enemy) < 280) enemy.stun = Math.max(enemy.stun, 0.9);
        });
      } else if (dist(fighter, state.player) < 280) {
        hurtPlayer(18 * fighter.damageScale, fighter);
      }
      burstParticles(fighter.x, fighter.y, COLORS.brute, 24, 260);
      return;
    }
    for (let i = 0; i < 6; i += 1) {
      state.slashes.push({
        x: fighter.x,
        y: fighter.y,
        angle: (Math.PI * 2 * i) / 6 + state.time * 0.35,
        range: 208,
        arc: Math.PI * 0.28,
        damage: 32 * fighter.damageScale,
        life: 0.14 + i * 0.01,
        maxLife: 0.22,
        color: i % 2 ? COLORS.violet : COLORS.cyan,
        owner,
        attacker: fighter,
        ultimate: true,
        hit: new Set(),
      });
    }
    burstParticles(fighter.x, fighter.y, COLORS.violet, 20, 260);
  }

  function updateClones(dt) {
    state.clones = state.clones.filter((clone) => {
      clone.life -= dt;
      clone.attackCooldown -= dt;
      const target = nearestTargetForClone(clone);
      if (target) {
        clone.angle = Math.atan2(target.y - clone.y, target.x - clone.x);
        const distance = dist(clone, target);
        if (distance > 84) {
          clone.x += Math.cos(clone.angle) * 230 * dt;
          clone.y += Math.sin(clone.angle) * 230 * dt;
        }
        if (clone.attackCooldown <= 0 && distance < 118) {
          clone.attackCooldown = 0.62;
          state.slashes.push({
            x: clone.x,
            y: clone.y,
            angle: clone.angle,
            range: 96,
            arc: Math.PI * 0.68,
            damage: 15 * (clone.attacker ? clone.attacker.damageScale : state.player.damageScale),
            life: 0.11,
            maxLife: 0.11,
            color: clone.color || COLORS.violet,
            owner: clone.owner || "player",
            attacker: clone.attacker || state.player,
            hit: new Set(),
          });
        }
      }
      return clone.life > 0;
    });
  }

  function updateEnemies(dt) {
    const p = state.player;
    state.enemies.forEach((enemy) => {
      if (enemy.type === "duelist") {
        updateDuelist(enemy, dt);
        return;
      }
      enemy.attackCooldown = Math.max(0, enemy.attackCooldown - dt);
      enemy.shootCooldown = Math.max(0, enemy.shootCooldown - dt);
      enemy.stun = Math.max(0, enemy.stun - dt);
      enemy.mark = Math.max(0, enemy.mark - dt);
      if (enemy.stun > 0) return;

      const bait = state.clones.length ? nearestClone(enemy) : null;
      const target = bait && dist(enemy, bait) < dist(enemy, p) + 120 ? bait : p;
      const angle = Math.atan2(target.y - enemy.y, target.x - enemy.x);
      const distance = dist(enemy, target);
      const keepRange = enemy.type === "sniper" ? 260 : enemy.type === "boss" ? 210 : 0;
      const dir = keepRange && distance < keepRange ? -1 : 1;
      const speed = enemy.speed * (enemy.mark > 0 ? 0.7 : 1);

      if (distance > enemy.radius + 28 || keepRange) {
        enemy.x += Math.cos(angle) * speed * dir * dt;
        enemy.y += Math.sin(angle) * speed * dir * dt;
        enemy.x = clamp(enemy.x, 36, WORLD.width - 36);
        enemy.y = clamp(enemy.y, 36, WORLD.height - 36);
      }

      if (distance < enemy.radius + p.radius + 12 && enemy.attackCooldown <= 0 && target === p) {
        enemy.attackCooldown = enemy.type === "brute" ? 1.0 : 0.72;
        hurtPlayer(enemy.damage);
      }

      if ((enemy.type === "sniper" || enemy.type === "boss") && enemy.shootCooldown <= 0) {
        enemy.shootCooldown = enemy.type === "boss" ? 0.72 : 1.35;
        shootAtPlayer(enemy);
      }

      if (enemy.type === "boss" && Math.random() < dt * 0.42) {
        state.hazards.push({ x: p.x, y: p.y, radius: 24, life: 1.15, maxLife: 1.15, damage: 16, armed: false });
      }
    });
    separateEnemies(dt);
  }

  function updateDuelist(ai, dt) {
    const p = state.player;
    tickCooldowns(ai, dt);
    ai.attackCooldown = Math.max(0, ai.attackCooldown - dt);
    ai.stun = Math.max(0, ai.stun - dt);
    ai.mark = Math.max(0, ai.mark - dt);
    ai.invuln = Math.max(0, ai.invuln - dt);
    ai.chakra = Math.min(ai.maxChakra, ai.chakra + 9 * dt);
    ai.facing = Math.atan2(p.y - ai.y, p.x - ai.x);
    if (ai.stun > 0) return;

    const distance = dist(ai, p);
    const strafe = Math.sin(state.time * (ai.style === "swift" ? 3.8 : 2.5)) * 0.72;
    const preferredRange = ai.style === "guard" ? 122 : 188;
    const desired = distance > preferredRange + 26 ? 1 : distance < preferredRange - 42 ? -1 : 0.08;
    const moveAngle = ai.facing + strafe;
    const moveSpeed = ai.speed * (ai.mark > 0 ? 0.72 : 1);
    ai.charging = distance > 260 && ai.chakra < 78 && Math.random() < 0.72;
    if (ai.charging) {
      ai.chakra = Math.min(ai.maxChakra, ai.chakra + 38 * dt);
      if (Math.random() < dt * 12) burstParticles(ai.x, ai.y, ai.color, 2, 70);
    } else {
      ai.x += Math.cos(moveAngle) * moveSpeed * desired * dt;
      ai.y += Math.sin(moveAngle) * moveSpeed * desired * dt;
    }
    ai.x = clamp(ai.x, 52, WORLD.width - 52);
    ai.y = clamp(ai.y, 52, WORLD.height - 52);

    if (distance > 300 && ai.dashCooldown <= 0) {
      ai.dashCooldown = ai.style === "swift" ? 0.72 : 1.0;
      ai.invuln = 0.16;
      ai.x += Math.cos(ai.facing) * ai.dashSpeed * 0.12;
      ai.y += Math.sin(ai.facing) * ai.dashSpeed * 0.12;
      burstParticles(ai.x, ai.y, ai.color, 14, 190);
    }

    if (ai.chakra >= ai.maxChakra && ai.ultimateCooldown <= 0 && distance < 360) {
      aiUltimate(ai);
      return;
    }
    const skills = kit(ai);
    if (distance < 420 && ai.cloneCooldown <= 0 && ai.chakra >= skills.eCost) {
      aiMirrorStep(ai);
      return;
    }
    if (distance < 230 && ai.burstCooldown <= 0 && ai.chakra >= skills.rCost) {
      aiBurst(ai);
      return;
    }
    if (distance < 620 && ai.shurikenCooldown <= 0 && ai.chakra >= skills.qCost) {
      aiThrowShuriken(ai);
    }
    if (distance < 132 && ai.slashCooldown <= 0) {
      aiSlash(ai);
    }
  }

  function aiSlash(ai) {
    duelCallout(`${ai.name}：${kit(ai).slash}`, 0.72);
    ai.slashChain = (ai.slashChain % 3) + 1;
    const heavy = ai.slashChain === 3;
    ai.slashCooldown = heavy ? 0.42 : 0.28;
    state.slashes.push({
      x: ai.x,
      y: ai.y,
      angle: ai.facing,
      range: heavy ? 126 : 102,
      arc: heavy ? Math.PI * 0.92 : Math.PI * 0.7,
      damage: (heavy ? 27 : 17) * ai.damageScale,
      life: 0.13,
      maxLife: 0.13,
      color: ai.color,
      owner: "enemy",
      hit: new Set(),
    });
    burstParticles(ai.x + Math.cos(ai.facing) * 38, ai.y + Math.sin(ai.facing) * 38, ai.color, heavy ? 16 : 8, 120);
  }

  function aiThrowShuriken(ai) {
    const skills = kit(ai);
    duelCallout(`${ai.name}：${skills.q}`);
    const profile = {
      balanced: { cooldown: 0.78, speed: 650, radius: 8, damage: 14, life: 0.95, spread: [0], color: ai.color, stun: 0 },
      swift: { cooldown: 0.44, speed: 820, radius: 6, damage: 10, life: 0.72, spread: [-0.14, 0.14], color: COLORS.cyan, stun: 0 },
      guard: { cooldown: 1.0, speed: 520, radius: 13, damage: 25, life: 1.1, spread: [0], color: COLORS.brute, stun: 0.18 },
    }[ai.style];
    ai.shurikenCooldown = profile.cooldown;
    ai.chakra -= skills.qCost;
    const spread = profile.spread;
    spread.forEach((offset) => {
      const angle = ai.facing + offset;
      state.projectiles.push({
        x: ai.x + Math.cos(angle) * 28,
        y: ai.y + Math.sin(angle) * 28,
        vx: Math.cos(angle) * profile.speed,
        vy: Math.sin(angle) * profile.speed,
        radius: profile.radius,
        life: profile.life,
        damage: profile.damage * ai.damageScale,
        color: profile.color,
        owner: "enemy",
        spin: 0,
        stun: profile.stun,
      });
    });
    burstParticles(ai.x + Math.cos(ai.facing) * 26, ai.y + Math.sin(ai.facing) * 26, profile.color, 10, 130);
  }

  function aiMirrorStep(ai) {
    const skills = kit(ai);
    duelCallout(`${ai.name}：${skills.e}`);
    ai.chakra -= skills.eCost;
    if (ai.style === "guard") {
      ai.cloneCooldown = 6.2;
      ai.invuln = 0.9;
      ai.hp = Math.min(ai.maxHp, ai.hp + 8);
      burstParticles(ai.x, ai.y, COLORS.brute, 40, 210);
      return;
    }
    ai.cloneCooldown = ai.style === "swift" ? 3.6 : 4.8;
    const side = Math.random() < 0.5 ? -1 : 1;
    const oldX = ai.x;
    const oldY = ai.y;
    const distance = ai.style === "swift" ? 136 : 92;
    ai.x = clamp(ai.x + Math.cos(ai.facing + side * Math.PI * 0.62) * distance, 52, WORLD.width - 52);
    ai.y = clamp(ai.y + Math.sin(ai.facing + side * Math.PI * 0.62) * distance, 52, WORLD.height - 52);
    ai.invuln = 0.24;
    burstParticles(oldX, oldY, COLORS.violet, 34, 210);
    burstParticles(ai.x, ai.y, ai.color, 26, 250);

    for (let i = -1; i <= 1; i += 2) {
      const angle = ai.facing + i * 0.28;
      state.projectiles.push({
        x: ai.x + Math.cos(angle) * 24,
        y: ai.y + Math.sin(angle) * 24,
        vx: Math.cos(angle) * 560,
        vy: Math.sin(angle) * 560,
        radius: 7,
        life: 0.82,
        damage: 12 * ai.damageScale,
        color: COLORS.violet,
        owner: "enemy",
        spin: 0,
      });
    }
  }

  function aiBurst(ai) {
    const skills = kit(ai);
    duelCallout(`${ai.name}：${skills.r}`);
    ai.chakra -= skills.rCost;
    if (ai.style === "swift") {
      ai.burstCooldown = 3.4;
      const startX = ai.x;
      const startY = ai.y;
      const endX = clamp(ai.x + Math.cos(ai.facing) * 215, 52, WORLD.width - 52);
      const endY = clamp(ai.y + Math.sin(ai.facing) * 215, 52, WORLD.height - 52);
      if (distanceToSegment(state.player.x, state.player.y, startX, startY, endX, endY) < state.player.radius + 42) {
        hurtPlayer(28 * ai.damageScale, ai);
      }
      ai.x = endX;
      ai.y = endY;
      ai.invuln = 0.16;
      burstParticles(startX, startY, COLORS.cyan, 24, 230);
      burstParticles(ai.x, ai.y, COLORS.cyan, 38, 390);
      return;
    }
    ai.burstCooldown = ai.style === "guard" ? 4.8 : 4.2;
    state.shake = Math.max(state.shake, 8);
    const radius = ai.style === "guard" ? 238 : 178;
    if (dist(ai, state.player) < radius) {
      hurtPlayer((ai.style === "guard" ? 22 : 24) * ai.damageScale, ai);
      const angle = Math.atan2(state.player.y - ai.y, state.player.x - ai.x);
      state.player.x += Math.cos(angle) * (ai.style === "guard" ? 58 : 34);
      state.player.y += Math.sin(angle) * (ai.style === "guard" ? 58 : 34);
    }
    burstParticles(ai.x, ai.y, ai.style === "guard" ? COLORS.brute : ai.color, ai.style === "guard" ? 78 : 52, 330);
  }

  function aiUltimate(ai) {
    duelCallout(`${ai.name}：${kit(ai).z}`, 1.35);
    ai.ultimateCooldown = ai.style === "guard" ? 10 : ai.style === "swift" ? 7 : 9;
    ai.chakra = 0;
    state.shake = 10;
    const count = ai.style === "swift" ? 8 : ai.style === "guard" ? 5 : 6;
    for (let i = 0; i < count; i += 1) {
      state.slashes.push({
        x: ai.x,
        y: ai.y,
        angle: ai.style === "guard" ? (Math.PI * 2 * i) / count : ai.facing - 0.9 + i * (ai.style === "swift" ? 0.11 : 0.16),
        range: ai.style === "guard" ? 240 : ai.style === "swift" ? 180 : 208,
        arc: ai.style === "guard" ? Math.PI * 0.52 : Math.PI * 0.26,
        damage: (ai.style === "guard" ? 36 : ai.style === "swift" ? 20 : 28) * ai.damageScale,
        life: 0.14 + i * 0.01,
        maxLife: ai.style === "guard" ? 0.24 : 0.22,
        color: ai.style === "guard" ? COLORS.brute : ai.color,
        owner: "enemy",
        ultimate: true,
        hit: new Set(),
      });
    }
    burstParticles(ai.x, ai.y, ai.style === "guard" ? COLORS.brute : ai.color, 28, 320);
  }

  function shootAtPlayer(enemy) {
    const p = state.player;
    const angle = Math.atan2(p.y - enemy.y, p.x - enemy.x);
    const speed = enemy.type === "boss" ? 420 : 360;
    const shots = enemy.type === "boss" ? [-0.18, 0, 0.18] : [0];
    shots.forEach((offset) => {
      state.projectiles.push({
        x: enemy.x,
        y: enemy.y,
        vx: Math.cos(angle + offset) * speed,
        vy: Math.sin(angle + offset) * speed,
        radius: enemy.type === "boss" ? 10 : 7,
        life: 2.2,
        damage: enemy.damage,
        color: enemy.color,
        owner: "enemy",
        spin: 0,
      });
    });
  }

  function updateProjectiles(dt) {
    state.projectiles = state.projectiles.filter((shot) => {
      shot.life -= dt;
      shot.x += shot.vx * dt;
      shot.y += shot.vy * dt;
      shot.spin += dt * 18;
      if (shot.x < -80 || shot.y < -80 || shot.x > WORLD.width + 80 || shot.y > WORLD.height + 80) return false;
      if (shot.owner === "player") {
        for (const enemy of state.enemies) {
          if (dist(shot, enemy) < shot.radius + enemy.radius) {
            enemy.mark = 1.2;
            enemy.stun = Math.max(enemy.stun, shot.stun || 0);
            damageEnemy(enemy, shot.damage, "shuriken");
            burstParticles(shot.x, shot.y, shot.color, 10, 120);
            return false;
          }
        }
      } else if (dist(shot, state.player) < shot.radius + state.player.radius) {
        hurtPlayer(shot.damage, state.opponent);
        burstParticles(shot.x, shot.y, shot.color, 10, 120);
        return false;
      }
      return shot.life > 0;
    });
  }

  function updateSlashes(dt) {
    state.slashes = state.slashes.filter((slash) => {
      slash.life -= dt;
      slash.x += Math.cos(slash.angle) * (slash.ultimate ? 210 : 0) * dt;
      slash.y += Math.sin(slash.angle) * (slash.ultimate ? 210 : 0) * dt;
      if (slash.owner === "enemy") {
        const p = state.player;
        if (!slash.hit.has(p.id)) {
          const dx = p.x - slash.x;
          const dy = p.y - slash.y;
          const distance = Math.hypot(dx, dy);
          const angle = Math.atan2(dy, dx);
          if (distance <= slash.range + p.radius && angleDiff(angle, slash.angle) < slash.arc / 2) {
            slash.hit.add(p.id);
            hurtPlayer(slash.damage, state.opponent);
          }
        }
        return slash.life > 0;
      }
      for (const enemy of state.enemies) {
        if (slash.hit.has(enemy.id)) continue;
        const dx = enemy.x - slash.x;
        const dy = enemy.y - slash.y;
        const distance = Math.hypot(dx, dy);
        if (distance > slash.range + enemy.radius) continue;
        const angle = Math.atan2(dy, dx);
        if (angleDiff(angle, slash.angle) < slash.arc / 2) {
          slash.hit.add(enemy.id);
          enemy.stun = Math.max(enemy.stun, slash.ultimate ? 0.2 : 0.08);
          damageEnemy(enemy, slash.damage, "slash");
        }
      }
      return slash.life > 0;
    });
  }

  function updatePickups(dt) {
    const p = state.player;
    state.pickups = state.pickups.filter((pickup) => {
      pickup.life -= dt;
      const angle = Math.atan2(p.y - pickup.y, p.x - pickup.x);
      const distance = dist(p, pickup);
      if (distance < 180) {
        pickup.x += Math.cos(angle) * 260 * dt;
        pickup.y += Math.sin(angle) * 260 * dt;
      }
      if (distance < p.radius + 12) {
        p.chakra = Math.min(p.maxChakra, p.chakra + pickup.chakra);
        p.hp = Math.min(p.maxHp, p.hp + pickup.hp);
        state.score += 25;
        return false;
      }
      return pickup.life > 0;
    });
  }

  function updateHazards(dt) {
    const p = state.player;
    state.hazards = state.hazards.filter((hazard) => {
      hazard.life -= dt;
      hazard.radius += 54 * dt;
      if (!hazard.armed && hazard.life < hazard.maxLife * 0.34) {
        hazard.armed = true;
        if (dist(hazard, p) < hazard.radius + p.radius) {
          hurtPlayer(hazard.damage);
        }
        burstParticles(hazard.x, hazard.y, COLORS.boss, 24, 260);
      }
      return hazard.life > 0;
    });
  }

  function updateParticles(dt) {
    state.particles = state.particles.filter((particle) => {
      particle.life -= dt;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vx *= 0.96;
      particle.vy *= 0.96;
      return particle.life > 0;
    });
  }

  function separateEnemies(dt) {
    const gridSize = 120;
    const grid = {};
    state.enemies.forEach((enemy) => {
      const cellX = Math.floor(enemy.x / gridSize);
      const cellY = Math.floor(enemy.y / gridSize);
      const key = `${cellX},${cellY}`;
      if (!grid[key]) grid[key] = [];
      grid[key].push(enemy);
    });
    const keys = Object.keys(grid);
    for (let i = 0; i < keys.length; i += 1) {
      const [cx, cy] = keys[i].split(',').map(Number);
      for (let dx = -1; dx <= 1; dx += 1) {
        for (let dy = -1; dy <= 1; dy += 1) {
          const otherKey = `${cx + dx},${cy + dy}`;
          if (!grid[otherKey]) continue;
          const listA = grid[keys[i]];
          const listB = grid[otherKey];
          const sameCell = keys[i] === otherKey;
          for (let ai = 0; ai < listA.length; ai += 1) {
            const startJ = sameCell ? ai + 1 : 0;
            for (let bj = startJ; bj < listB.length; bj += 1) {
              const a = listA[ai];
              const b = listB[bj];
              const dx2 = b.x - a.x;
              const dy2 = b.y - a.y;
              const distance = Math.hypot(dx2, dy2) || 1;
              const overlap = a.radius + b.radius + 4 - distance;
              if (overlap > 0) {
                const push = overlap * 0.5 * dt * 10;
                const nx = dx2 / distance;
                const ny = dy2 / distance;
                a.x -= nx * push;
                a.y -= ny * push;
                b.x += nx * push;
                b.y += ny * push;
              }
            }
          }
        }
      }
    }
  }

  function hitOpponentsInRadius(owner, attacker, radius, damage, source, knockback, hitCount) {
    let hits = 0;
    state.enemies.forEach((enemy) => {
      if (hits >= hitCount) return;
      const dx = enemy.x - attacker.x;
      const dy = enemy.y - attacker.y;
      const distance = Math.hypot(dx, dy);
      if (distance < radius) {
        damageEnemy(enemy, damage, source);
        enemy.vx += (dx / distance) * knockback;
        enemy.vy += (dy / distance) * knockback;
        hits += 1;
      }
    });
  }

  function hitOpponentsOnSegment(owner, attacker, startX, startY, endX, endY, radius, damage, source, knockback) {
    state.enemies.forEach((enemy) => {
      const dx = endX - startX;
      const dy = endY - startY;
      const len = Math.hypot(dx, dy);
      const nx = dx / len;
      const ny = dy / len;
      const px = enemy.x - startX;
      const py = enemy.y - startY;
      const proj = px * nx + py * ny;
      const clampedProj = Math.max(0, Math.min(len, proj));
      const closestX = startX + nx * clampedProj;
      const closestY = startY + ny * clampedProj;
      const dist = Math.hypot(enemy.x - closestX, enemy.y - closestY);
      if (dist < radius) {
        damageEnemy(enemy, damage, source);
        const angle = Math.atan2(enemy.y - attacker.y, enemy.x - attacker.x);
        enemy.vx += Math.cos(angle) * knockback;
        enemy.vy += Math.sin(angle) * knockback;
      }
    });
  }

  function damageEnemy(enemy, amount, source) {
    if (enemy.type === "duelist" && shouldEnemySubstitute(enemy, amount, source) && trySubstitution(enemy, state.player)) return;
    enemy.hp -= amount;
    addChakra((source === "slash" ? 5 : 3) * state.player.chakraGain);
    state.combo += 1;
    state.comboTimer = 2.3;
    state.score += Math.round(amount * (1 + Math.min(state.combo, 30) * 0.04));
    state.shake = Math.max(state.shake, source === "burst" ? 8 : 3);
    if (source !== "shuriken") state.hitStop = Math.max(state.hitStop, 0.025);
    burstParticles(enemy.x, enemy.y, enemy.color, source === "burst" ? 20 : 8, 110);
    if (enemy.hp <= 0) {
      state.kills += 1;
      state.score += enemy.type === "boss" ? 5000 : enemy.type === "duelist" ? 1600 : 180;
      addChakra(enemy.type === "boss" || enemy.type === "duelist" ? 100 : 12);
      if (state.selectedMode !== "duel") dropPickup(enemy);
      burstParticles(enemy.x, enemy.y, enemy.color, enemy.type === "boss" ? 110 : 40, enemy.type === "boss" ? 440 : 260);
      state.enemies = state.enemies.filter((item) => item !== enemy);
      if (enemy.type === "duelist") finishGame(true);
    }
  }

  function hurtPlayer(amount, attacker = null) {
    const p = state.player;
    if (p.invuln > 0 || state.finished) return;
    if (trySubstitution(p, attacker)) return;
    p.hp -= amount;
    p.invuln = 0.55;
    state.combo = 0;
    state.comboTimer = 0;
    state.shake = Math.max(state.shake, 12);
    burstParticles(p.x, p.y, COLORS.red, 28, 250);
    if (p.hp <= 0) finishGame(false);
  }

  function trySubstitution(fighter, attacker) {
    if (state.selectedMode !== "duel" || !attacker) return false;
    if (fighter.substitutionCooldown > 0 || fighter.chakra < 18) return false;
    fighter.substitutionCooldown = 3.2;
    fighter.chakra -= 18;
    fighter.invuln = 0.5;
    const angle = Math.atan2(attacker.y - fighter.y, attacker.x - fighter.x);
    const oldX = fighter.x;
    const oldY = fighter.y;
    fighter.x = clamp(attacker.x - Math.cos(angle) * 96, 52, WORLD.width - 52);
    fighter.y = clamp(attacker.y - Math.sin(angle) * 96, 52, WORLD.height - 52);
    fighter.facing = Math.atan2(attacker.y - fighter.y, attacker.x - fighter.x);
    burstParticles(oldX, oldY, COLORS.ink, 34, 180);
    burstParticles(fighter.x, fighter.y, fighter.color, 22, 180);
    duelCallout(`${fighter.name}：替身术！`, 1.05);
    return true;
  }

  function shouldEnemySubstitute(enemy, amount, source) {
    if (enemy.type !== "duelist") return false;
    const hpRatio = enemy.hp / enemy.maxHp;
    if (source === "shuriken" && hpRatio > 0.55) return false;
    if (source === "slash" && amount < 26 && hpRatio > 0.7) return false;
    if (enemy.substitutionCooldown > 0 || enemy.chakra < 18) return false;
    if (hpRatio < 0.38) return true;
    if (source === "burst" || source === "ultimate") return true;
    return Math.random() < 0.28;
  }

  function dropPickup(enemy) {
    if (Math.random() < 0.72 || enemy.type === "boss") {
      state.pickups.push({
        x: enemy.x,
        y: enemy.y,
        hp: enemy.type === "brute" ? 8 : 4,
        chakra: enemy.type === "boss" ? 60 : 14,
        life: 7,
        radius: 9,
      });
    }
  }

  function addChakra(value) {
    const p = state.player;
    p.chakra = Math.min(p.maxChakra, p.chakra + value);
  }

  function updateCamera(dt) {
    const p = state.player;
    const targetX = p.x - window.innerWidth / (2 * state.camera.zoom);
    const targetY = p.y - window.innerHeight / (2 * state.camera.zoom);
    state.camera.x += (targetX - state.camera.x) * Math.min(1, dt * 7);
    state.camera.y += (targetY - state.camera.y) * Math.min(1, dt * 7);
    state.camera.x = clamp(state.camera.x, 0, WORLD.width - window.innerWidth / state.camera.zoom);
    state.camera.y = clamp(state.camera.y, 0, WORLD.height - window.innerHeight / state.camera.zoom);
    state.shake = Math.max(0, state.shake - dt * 28);
  }

  function updateUi() {
    const p = state.player;
    const skills = kit(p);
    ui.slashName.textContent = skills.slash;
    ui.shurikenName.textContent = skills.q;
    ui.cloneName.textContent = skills.e;
    ui.burstName.textContent = skills.r;
    ui.ultName.textContent = skills.z;
    if (state.selectedMode === "duel") {
      const opponent = state.opponent;
      ui.statWaveLabel.textContent = "模式";
      ui.statKillsLabel.textContent = "对手";
      ui.statComboLabel.textContent = "替身";
      ui.statScoreLabel.textContent = "AI体力";
      ui.wave.textContent = "对战";
      ui.kills.textContent = opponent ? opponent.name : "-";
      ui.combo.textContent = p.substitutionCooldown <= 0 ? "就绪" : `${p.substitutionCooldown.toFixed(1)}s`;
      ui.score.textContent = opponent ? `${Math.max(0, Math.ceil(opponent.hp))}` : "0";
    } else {
      ui.statWaveLabel.textContent = "波次";
      ui.statKillsLabel.textContent = "击破";
      ui.statComboLabel.textContent = "连击";
      ui.statScoreLabel.textContent = "评分";
      ui.wave.textContent = state.wave;
      ui.kills.textContent = state.kills;
      ui.combo.textContent = state.combo;
      ui.score.textContent = state.score;
    }
    ui.hpText.textContent = `${Math.max(0, Math.ceil(p.hp))} / ${p.maxHp}`;
    ui.hpBar.style.width = `${clamp((p.hp / p.maxHp) * 100, 0, 100)}%`;
    ui.chakraText.textContent = `${Math.floor(p.chakra)} / ${p.maxChakra}`;
    ui.chakraBar.style.width = `${clamp((p.chakra / p.maxChakra) * 100, 0, 100)}%`;
    ui.slashCd.textContent = cdText(p.slashCooldown);
    ui.shurikenCd.textContent = p.chakra < skills.qCost ? "缺查克拉" : cdText(p.shurikenCooldown);
    ui.cloneCd.textContent = p.chakra < skills.eCost ? "缺查克拉" : cdText(p.cloneCooldown);
    ui.burstCd.textContent = p.chakra < skills.rCost ? "缺查克拉" : cdText(p.burstCooldown);
    ui.ultCd.textContent = p.chakra >= p.maxChakra ? cdText(p.ultimateCooldown) : "蓄能";
  }

  function cdText(value) {
    return value <= 0 ? "就绪" : `${value.toFixed(1)}s`;
  }

  function render() {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    ctx.save();
    const shakeX = (Math.random() - 0.5) * state.shake;
    const shakeY = (Math.random() - 0.5) * state.shake;
    ctx.translate(shakeX, shakeY);
    ctx.scale(state.camera.zoom, state.camera.zoom);
    ctx.translate(-state.camera.x, -state.camera.y);
    drawArena();
    drawHazards();
    drawPickups();
    drawClones();
    drawProjectiles();
    drawEnemies();
    drawPlayer();
    drawSlashes();
    drawParticles();
    ctx.restore();
    drawScreenEffects();
  }

  function drawArena() {
    const grd = ctx.createLinearGradient(0, 0, WORLD.width, WORLD.height);
    grd.addColorStop(0, "#101921");
    grd.addColorStop(0.5, "#121218");
    grd.addColorStop(1, "#1a1416");
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, WORLD.width, WORLD.height);

    ctx.strokeStyle = "rgba(245, 240, 223, 0.06)";
    ctx.lineWidth = 1;
    for (let x = 0; x <= WORLD.width; x += 56) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, WORLD.height);
      ctx.stroke();
    }
    for (let y = 0; y <= WORLD.height; y += 56) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(WORLD.width, y);
      ctx.stroke();
    }

    drawMoonGate(WORLD.width / 2, 210, 180);
    drawTrainingPosts();
    if (state.selectedMode === "duel") drawDuelArenaMarks();
    ctx.strokeStyle = "rgba(255, 211, 106, 0.45)";
    ctx.lineWidth = 7;
    ctx.strokeRect(24, 24, WORLD.width - 48, WORLD.height - 48);
  }

  function drawMoonGate(x, y, radius) {
    ctx.save();
    ctx.globalAlpha = 0.24;
    ctx.strokeStyle = COLORS.cyan;
    ctx.lineWidth = 18;
    ctx.beginPath();
    ctx.arc(x, y, radius, Math.PI * 0.05, Math.PI * 0.95, true);
    ctx.stroke();
    ctx.strokeStyle = COLORS.gold;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(x, y, radius - 26, Math.PI * 0.06, Math.PI * 0.94, true);
    ctx.stroke();
    ctx.restore();
  }

  function drawTrainingPosts() {
    const posts = [
      [280, 280],
      [1620, 280],
      [280, 860],
      [1620, 860],
      [640, 560],
      [1260, 560],
    ];
    posts.forEach(([x, y], index) => {
      ctx.fillStyle = index % 2 ? "#33251d" : "#283044";
      roundRect(x - 28, y - 28, 56, 56, 7);
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.18)";
      ctx.stroke();
    });
  }

  function drawDuelArenaMarks() {
    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.strokeStyle = COLORS.gold;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(WORLD.width / 2, WORLD.height / 2, 250, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 0.08;
    ctx.fillStyle = COLORS.cyan;
    ctx.beginPath();
    ctx.arc(WORLD.width / 2, WORLD.height / 2, 168, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.28;
    ctx.fillStyle = COLORS.ink;
    ctx.font = "800 78px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("忍", WORLD.width / 2, WORLD.height / 2 + 28);
    ctx.restore();
  }

  function drawPlayer() {
    const p = state.player;
    drawFighter(p, true);
  }

  function drawFighter(fighter, isPlayer) {
    ctx.save();
    ctx.translate(fighter.x, fighter.y);
    ctx.rotate(fighter.facing);
    ctx.globalAlpha = fighter.invuln > 0 && Math.floor(state.time * 18) % 2 ? 0.48 : 1;
    ctx.fillStyle = COLORS.shadow;
    ctx.beginPath();
    ctx.ellipse(0, 12, 24, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    if (fighter.charging) {
      ctx.save();
      ctx.globalAlpha = 0.28 + Math.sin(state.time * 16) * 0.08;
      ctx.strokeStyle = fighter.color || COLORS.cyan;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(0, 0, 34 + Math.sin(state.time * 12) * 5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    ctx.fillStyle = fighter.color || COLORS.player;
    ctx.beginPath();
    ctx.moveTo(27, 0);
    ctx.lineTo(-16, -17);
    ctx.lineTo(-7, 0);
    ctx.lineTo(-16, 17);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = fighter.core || COLORS.playerCore;
    ctx.beginPath();
    ctx.arc(0, 0, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = isPlayer ? COLORS.cyan : COLORS.red;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(8, -15);
    ctx.lineTo(26, -33);
    ctx.stroke();
    ctx.restore();
  }

  function drawClones() {
    state.clones.forEach((clone) => {
      ctx.save();
      ctx.translate(clone.x, clone.y);
      ctx.rotate(clone.angle);
      ctx.globalAlpha = Math.min(0.72, clone.life / 1.4);
      ctx.fillStyle = COLORS.violet;
      ctx.beginPath();
      ctx.moveTo(24, 0);
      ctx.lineTo(-15, -14);
      ctx.lineTo(-6, 0);
      ctx.lineTo(-15, 14);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    });
  }

  function drawEnemies() {
    state.enemies.forEach((enemy) => {
      if (enemy.type === "duelist") {
        drawFighter(enemy, false);
        drawHealthBar(enemy.x, enemy.y - enemy.radius - 20, enemy.hp / enemy.maxHp, 76);
        drawNameTag(enemy.x, enemy.y - enemy.radius - 31, `${enemy.name} · ${enemy.title}`);
        return;
      }
      ctx.save();
      ctx.translate(enemy.x, enemy.y);
      ctx.fillStyle = COLORS.shadow;
      ctx.beginPath();
      ctx.ellipse(0, enemy.radius * 0.55, enemy.radius * 1.05, enemy.radius * 0.45, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = enemy.color;
      if (enemy.type === "sniper") {
        ctx.rotate(state.time * 1.8);
        polygon(0, 0, enemy.radius, 4);
      } else if (enemy.type === "boss") {
        ctx.rotate(Math.sin(state.time) * 0.08);
        polygon(0, 0, enemy.radius, 8);
      } else {
        polygon(0, 0, enemy.radius, enemy.type === "brute" ? 6 : 5);
      }
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.28)";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
      drawHealthBar(enemy.x, enemy.y - enemy.radius - 16, enemy.hp / enemy.maxHp, enemy.type === "boss" ? 76 : 40);
    });
  }

  function drawNameTag(x, y, text) {
    ctx.save();
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(245, 240, 223, 0.78)";
    ctx.font = "600 13px system-ui, sans-serif";
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  function drawProjectiles() {
    state.projectiles.forEach((shot) => {
      ctx.save();
      ctx.translate(shot.x, shot.y);
      ctx.rotate(shot.spin);
      ctx.fillStyle = shot.color;
      polygon(0, 0, shot.radius, shot.owner === "player" ? 4 : 7);
      ctx.fill();
      ctx.restore();
    });
  }

  function drawSlashes() {
    state.slashes.forEach((slash) => {
      const t = slash.life / slash.maxLife;
      ctx.save();
      ctx.translate(slash.x, slash.y);
      ctx.rotate(slash.angle);
      ctx.globalAlpha = clamp(t, 0, 1) * 0.86;
      ctx.strokeStyle = slash.color;
      ctx.lineWidth = slash.ultimate ? 15 : 10;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.arc(0, 0, slash.range * (1.04 - t * 0.2), -slash.arc / 2, slash.arc / 2);
      ctx.stroke();
      ctx.restore();
    });
  }

  function drawPickups() {
    state.pickups.forEach((pickup) => {
      ctx.save();
      ctx.translate(pickup.x, pickup.y + Math.sin(state.time * 8 + pickup.x) * 4);
      ctx.fillStyle = pickup.hp > 5 ? COLORS.gold : COLORS.cyan;
      polygon(0, 0, pickup.radius, 6);
      ctx.fill();
      ctx.restore();
    });
  }

  function drawHazards() {
    state.hazards.forEach((hazard) => {
      const t = hazard.life / hazard.maxLife;
      ctx.save();
      ctx.globalAlpha = hazard.armed ? 0.3 : 0.5;
      ctx.strokeStyle = hazard.armed ? COLORS.boss : COLORS.red;
      ctx.lineWidth = hazard.armed ? 18 : 4;
      ctx.beginPath();
      ctx.arc(hazard.x, hazard.y, hazard.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 0.12 * (1 - t);
      ctx.fillStyle = COLORS.boss;
      ctx.fill();
      ctx.restore();
    });
  }

  function drawParticles() {
    state.particles.forEach((particle) => {
      ctx.globalAlpha = clamp(particle.life / particle.maxLife, 0, 1);
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    });
  }

  function drawHealthBar(x, y, ratio, width) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
    roundRect(x - width / 2, y, width, 6, 3);
    ctx.fill();
    ctx.fillStyle = ratio > 0.45 ? "#ffdd78" : COLORS.red;
    roundRect(x - width / 2, y, width * clamp(ratio, 0, 1), 6, 3);
    ctx.fill();
  }

  function drawScreenEffects() {
    if (!state.running) return;
    if (state.paused) {
      ctx.fillStyle = "rgba(4, 6, 8, 0.54)";
      ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
      drawCenteredText("暂停", "按 P 继续游戏");
    } else if (state.waveBanner > 0) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, state.waveBanner);
      if (state.selectedMode === "duel") {
        const foe = state.opponent ? `${state.opponent.name} · ${state.opponent.title}` : "AI 忍者";
        drawCenteredText("忍界对战", `AI 选择了 ${foe}`);
      } else {
        drawCenteredText(`第 ${state.wave} 波`, state.wave === 5 ? "影首现身" : "守住训练场");
      }
      ctx.restore();
    }
    if (state.selectedMode === "duel" && state.duelCallout.life > 0) {
      const t = state.duelCallout.life / state.duelCallout.maxLife;
      ctx.save();
      ctx.globalAlpha = clamp(t, 0, 1);
      ctx.fillStyle = "rgba(5, 8, 12, 0.68)";
      roundRect(window.innerWidth / 2 - 210, 92, 420, 48, 8);
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 211, 106, 0.44)";
      ctx.stroke();
      ctx.textAlign = "center";
      ctx.fillStyle = COLORS.ink;
      ctx.font = "800 22px system-ui, sans-serif";
      ctx.fillText(state.duelCallout.text, window.innerWidth / 2, 124);
      ctx.restore();
    }
  }

  function drawCenteredText(title, subtitle) {
    ctx.textAlign = "center";
    ctx.fillStyle = COLORS.ink;
    ctx.font = "800 52px system-ui, sans-serif";
    ctx.fillText(title, window.innerWidth / 2, window.innerHeight * 0.42);
    ctx.fillStyle = "rgba(245, 240, 223, 0.72)";
    ctx.font = "600 18px system-ui, sans-serif";
    ctx.fillText(subtitle, window.innerWidth / 2, window.innerHeight * 0.42 + 38);
  }

  const MAX_PARTICLES = 900;

  function burstParticles(x, y, color, count, speed) {
    const remaining = MAX_PARTICLES - state.particles.length;
    const actualCount = Math.min(count, Math.max(0, remaining));
    for (let i = 0; i < actualCount; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const power = (0.25 + Math.random() * 0.75) * speed;
      const life = 0.28 + Math.random() * 0.5;
      state.particles.push({
        x,
        y,
        vx: Math.cos(angle) * power,
        vy: Math.sin(angle) * power,
        color,
        size: 2 + Math.random() * 4,
        life,
        maxLife: life,
      });
    }
  }

  function finishGame(win) {
    state.finished = true;
    state.running = false;
    if (state.selectedMode === "duel") {
      const opponentName = state.opponent ? `${state.opponent.name} · ${state.opponent.title}` : "AI 忍者";
      ui.endEyebrow.textContent = win ? "Duel Victory" : "Duel Defeat";
      ui.endTitle.textContent = win ? "对战胜利" : "对战失败";
      ui.endText.textContent = win
        ? `你击败了 ${opponentName}，评分 ${state.score}，最高连击 ${state.combo}。`
        : `${opponentName} 赢下了这场对决。你打出了 ${state.combo} 连击，评分 ${state.score}。`;
    } else {
      ui.endEyebrow.textContent = win ? "Trial Clear" : "Trial Failed";
      ui.endTitle.textContent = win ? "试炼通过" : "试炼结束";
      ui.endText.textContent = win
        ? `你击破了影首，最终评分 ${state.score}，最高连击 ${state.combo}。`
        : `你倒在第 ${state.wave} 波，击破 ${state.kills} 名影兵，评分 ${state.score}。`;
    }
    ui.endOverlay.classList.add("overlay--active");
  }

  function getMoveAxis() {
    let x = 0;
    let y = 0;
    if (KEYS.has("KeyA") || KEYS.has("ArrowLeft")) x -= 1;
    if (KEYS.has("KeyD") || KEYS.has("ArrowRight")) x += 1;
    if (KEYS.has("KeyW") || KEYS.has("ArrowUp")) y -= 1;
    if (KEYS.has("KeyS") || KEYS.has("ArrowDown")) y += 1;
    const len = Math.hypot(x, y) || 1;
    return { x: x / len, y: y / len };
  }

  function getMoveAxisFor(controls) {
    let x = 0;
    let y = 0;
    if (KEYS.has(controls.left)) x -= 1;
    if (KEYS.has(controls.right)) x += 1;
    if (KEYS.has(controls.up)) y -= 1;
    if (KEYS.has(controls.down)) y += 1;
    const len = Math.hypot(x, y) || 1;
    return { x: x / len, y: y / len };
  }

  function updatePointerWorld() {
    POINTER.worldX = POINTER.x / state.camera.zoom + state.camera.x;
    POINTER.worldY = POINTER.y / state.camera.zoom + state.camera.y;
  }

  function nearestEnemy(from) {
    let best = null;
    let bestDistance = Infinity;
    state.enemies.forEach((enemy) => {
      const distance = dist(from, enemy);
      if (distance < bestDistance) {
        best = enemy;
        bestDistance = distance;
      }
    });
    return best;
  }

  function nearestTargetForClone(clone) {
    if (state.selectedMode === "duel") {
      return clone.owner === "enemy" ? state.player : state.opponent;
    }
    return nearestEnemy(clone);
  }

  function nearestClone(from) {
    let best = null;
    let bestDistance = Infinity;
    state.clones.forEach((clone) => {
      const distance = dist(from, clone);
      if (distance < bestDistance) {
        best = clone;
        bestDistance = distance;
      }
    });
    return best;
  }

  function dist(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  function distanceToSegment(px, py, ax, ay, bx, by) {
    const dx = bx - ax;
    const dy = by - ay;
    const lengthSq = dx * dx + dy * dy || 1;
    const t = clamp(((px - ax) * dx + (py - ay) * dy) / lengthSq, 0, 1);
    const x = ax + dx * t;
    const y = ay + dy * t;
    return Math.hypot(px - x, py - y);
  }

  function angleDiff(a, b) {
    return Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function polygon(x, y, radius, sides) {
    ctx.beginPath();
    for (let i = 0; i <= sides; i += 1) {
      const angle = -Math.PI / 2 + (Math.PI * 2 * i) / sides;
      const px = x + Math.cos(angle) * radius;
      const py = y + Math.sin(angle) * radius;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
  }

  function roundRect(x, y, w, h, r) {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
  }

  function loop(now) {
    const dt = (now - state.lastTime) / 1000 || 0;
    state.lastTime = now;
    update(dt);
    render();
    requestAnimationFrame(loop);
  }

  window.addEventListener("resize", resize);
  window.addEventListener("keydown", (event) => {
    if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.code)) {
      event.preventDefault();
    }
    if (event.code === "KeyP" && state.running) {
      state.paused = !state.paused;
      return;
    }
    KEYS.add(event.code);
  });
  window.addEventListener("keyup", (event) => KEYS.delete(event.code));
  canvas.addEventListener("pointermove", (event) => {
    POINTER.x = event.clientX;
    POINTER.y = event.clientY;
  });
  canvas.addEventListener("pointerdown", (event) => {
    POINTER.down = true;
    POINTER.x = event.clientX;
    POINTER.y = event.clientY;
  });
  window.addEventListener("pointerup", () => {
    POINTER.down = false;
  });

  ui.modeCards.forEach((card) => {
    card.addEventListener("click", () => {
      ui.modeCards.forEach((item) => item.classList.remove("mode-card--active"));
      card.classList.add("mode-card--active");
      state.selectedMode = card.dataset.mode;
    });
  });
  ui.loadoutCards.forEach((card) => {
    card.addEventListener("click", () => {
      ui.loadoutCards.forEach((item) => item.classList.remove("loadout-card--active"));
      card.classList.add("loadout-card--active");
      state.selectedStyle = card.dataset.style;
      if (!state.running) {
        state.player = createPlayer(state.selectedStyle);
        updateUi();
      }
    });
  });
  ui.startButton.addEventListener("click", resetGame);
  ui.restartButton.addEventListener("click", () => {
    state.running = false;
    state.finished = false;
    ui.endOverlay.classList.remove("overlay--active");
    ui.startOverlay.classList.add("overlay--active");
  });

  resize();
  state.player = createPlayer();
  updateUi();
  requestAnimationFrame((now) => {
    state.lastTime = now;
    requestAnimationFrame(loop);
  });
})();
