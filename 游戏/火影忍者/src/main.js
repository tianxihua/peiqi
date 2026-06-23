(() => {
  const canvas = document.querySelector("#game");
  const ctx = canvas.getContext("2d");
  const DRAGON_IMAGE = new Image();
  DRAGON_IMAGE.src = "./assets/dragon-cutout.png";

  const ui = {
    p1Name: document.querySelector("#p1-name"),
    p2Name: document.querySelector("#p2-name"),
    p1HpText: document.querySelector("#p1-hp-text"),
    p2HpText: document.querySelector("#p2-hp-text"),
    p1ChakraText: document.querySelector("#p1-chakra-text"),
    p2ChakraText: document.querySelector("#p2-chakra-text"),
    p1Hp: document.querySelector("#p1-hp"),
    p2Hp: document.querySelector("#p2-hp"),
    p1Chakra: document.querySelector("#p1-chakra"),
    p2Chakra: document.querySelector("#p2-chakra"),
    roundState: document.querySelector("#round-state"),
    timer: document.querySelector("#timer"),
    p1Select: document.querySelector("#p1-select"),
    startOverlay: document.querySelector("#start-overlay"),
    endOverlay: document.querySelector("#end-overlay"),
    startButton: document.querySelector("#start-button"),
    restartButton: document.querySelector("#restart-button"),
    winnerTitle: document.querySelector("#winner-title"),
    winnerText: document.querySelector("#winner-text"),
  };

  const WORLD = { width: 1600, height: 900, ground: 690 };
  const KEYS = new Set();
  const POINTER = { attack: false };
  const DPR_CAP = 2;

  const COLORS = {
    paper: "#fff4dc",
    ink: "#11141a",
    gold: "#ffd166",
    orange: "#ff9f43",
    blue: "#4cc9f0",
    red: "#ff5d73",
    violet: "#9b5de5",
    green: "#76d672",
    earth: "#c28b55",
    smoke: "rgba(230, 232, 238, 0.72)",
    shadow: "rgba(0, 0, 0, 0.28)",
  };

  const FIGHTERS = window.CHARACTERS;
  const DEFAULT_FIGHTER = Object.keys(FIGHTERS)[0];

  const CONTROLS = {
    p1: {
      left: "KeyA",
      right: "KeyD",
      up: "KeyW",
      down: "KeyS",
      attack: "MouseLeft",
      projectile: "KeyQ",
      dash: "KeyT",
      jutsu: "KeyE",
      ultimate: "KeyR",
    },
  };

  const state = {
    running: false,
    finished: false,
    selected: { p1: DEFAULT_FIGHTER, p2: "random" },
    players: [],
    projectiles: [],
    hitboxes: [],
    ultimates: [],
    skillEffects: [],
    particles: [],
    logs: [],
    camera: { x: 0, y: 0, zoom: 1 },
    shake: 0,
    flash: 0,
    timeLeft: 99,
    lastTime: 0,
  };

  function createFighter(id, type, x) {
    const def = FIGHTERS[type];
    return {
      id,
      type,
      name: def.name,
      school: def.school,
      x,
      y: WORLD.ground,
      vx: 0,
      vy: 0,
      w: 58,
      h: 104,
      facing: id === "p1" ? 1 : -1,
      hp: def.hp,
      maxHp: def.hp,
      chakra: 72,
      maxChakra: 100,
      speed: def.speed,
      jump: def.jump,
      power: def.power,
      profile: def.profile || "standard",
      color: def.color,
      accent: def.accent,
      grounded: true,
      attacking: 0,
      stun: 0,
      invuln: 0,
      guard: false,
      combo: 0,
      comboTimer: 0,
      kunaiStacks: 0,
      ai: {
        decision: 0,
        move: 0,
        guard: 0,
        jump: 0,
        feint: 0,
      },
      cooldowns: {
        attack: 0,
        projectile: 0,
        dash: 0,
        jutsu: 0,
        ultimate: 0,
        substitute: 0,
      },
    };
  }

  function buildCharacterSelect() {
    Object.entries(FIGHTERS).forEach(([key, fighter]) => {
      ui.p1Select.appendChild(characterCard("p1", key, fighter));
    });
    syncSelectCards();
  }

  function hasProfile(f, profile) {
    return f.profile === profile;
  }

  function characterCard(playerId, key, fighter) {
    const button = document.createElement("button");
    button.className = "card";
    button.type = "button";
    button.dataset.player = playerId;
    button.dataset.fighter = key;
    button.innerHTML = `<strong>${fighter.name}</strong><span>${fighter.school}<br>${fighter.description}<br>Q：${fighter.skill1} / E：${fighter.skill2} / R：${fighter.skill3}</span>`;
    button.addEventListener("click", () => {
      state.selected[playerId] = key;
      syncSelectCards();
      if (!state.running) updateUi();
    });
    return button;
  }

  function syncSelectCards() {
    document.querySelectorAll(".card").forEach((card) => {
      card.classList.toggle("card--active", state.selected[card.dataset.player] === card.dataset.fighter);
    });
  }

  function startMatch() {
    state.selected.p2 = randomAiFighter(state.selected.p1);
    state.players = [
      createFighter("p1", state.selected.p1, 420),
      createFighter("p2", state.selected.p2, 1180),
    ];
    state.projectiles = [];
    state.hitboxes = [];
    state.ultimates = [];
    state.skillEffects = [];
    state.particles = [];
    state.logs = [];
    state.shake = 0;
    state.flash = 0;
    state.timeLeft = 99;
    state.running = true;
    state.finished = false;
    state.lastTime = performance.now();
    ui.startOverlay.classList.remove("overlay--active");
    ui.endOverlay.classList.remove("overlay--active");
    addLog("开战");
    updateUi();
  }

  function randomAiFighter(playerChoice) {
    const options = Object.keys(FIGHTERS).filter((key) => key !== playerChoice);
    return options[Math.floor(Math.random() * options.length)];
  }

  function update(rawDt) {
    if (!state.running || state.finished) return;
    const dt = Math.min(rawDt, 0.033);
    state.timeLeft = Math.max(0, state.timeLeft - dt);
    state.shake = Math.max(0, state.shake - dt * 24);
    state.flash = Math.max(0, state.flash - dt * 2.4);

    const [p1, p2] = state.players;
    updateFighter(p1, p2, CONTROLS.p1, dt);
    updateAiFighter(p2, p1, dt);
    resolveFighterPush(p1, p2);
    updateProjectiles(dt);
    updateHitboxes(dt);
    updateUltimates(dt);
    updateSkillEffects(dt);
    updateParticles(dt);
    updateCamera(dt);
    updateUi();

    if (p1.hp <= 0 || p2.hp <= 0 || state.timeLeft <= 0) {
      finishMatch();
    }
  }

  function updateFighter(f, target, controls, dt) {
    tickCooldowns(f, dt);
    f.stun = Math.max(0, f.stun - dt);
    f.invuln = Math.max(0, f.invuln - dt);
    f.attacking = Math.max(0, f.attacking - dt);
    f.comboTimer = Math.max(0, f.comboTimer - dt);
    if (f.comboTimer <= 0) f.combo = 0;

    f.facing = target.x >= f.x ? 1 : -1;
    f.guard = KEYS.has(controls.down) && f.grounded && f.stun <= 0;

    if (f.guard) {
      f.chakra = Math.min(f.maxChakra, f.chakra + 28 * dt);
      if (Math.random() < dt * 16) spawnParticles(f.x, f.y - 64, f.accent, 2, 60);
    } else {
      f.chakra = Math.min(f.maxChakra, f.chakra + 7 * dt);
    }

    const move = Number(KEYS.has(controls.right)) - Number(KEYS.has(controls.left));
    if (f.stun <= 0 && !f.guard) {
      f.vx += move * f.speed * 9 * dt;
      f.vx *= f.grounded ? 0.78 : 0.91;
      if (KEYS.has(controls.up) && f.grounded) {
        f.vy = -f.jump;
        f.grounded = false;
        spawnParticles(f.x, f.y, COLORS.smoke, 8, 120);
      }
      if (isActionPressed(controls.attack)) melee(f);
      if (KEYS.has(controls.projectile)) projectile(f);
      if (KEYS.has(controls.dash)) shadowStep(f, target);
      if (KEYS.has(controls.jutsu)) castJutsu(f, target);
      if (KEYS.has(controls.ultimate)) castUltimate(f);
    }

    f.vy += 1580 * dt;
    f.x = clamp(f.x + f.vx * dt, 74, WORLD.width - 74);
    f.y += f.vy * dt;
    if (f.y >= WORLD.ground) {
      f.y = WORLD.ground;
      f.vy = 0;
      f.grounded = true;
    }
  }

  function updateAiFighter(f, target, dt) {
    tickCooldowns(f, dt);
    f.stun = Math.max(0, f.stun - dt);
    f.invuln = Math.max(0, f.invuln - dt);
    f.attacking = Math.max(0, f.attacking - dt);
    f.comboTimer = Math.max(0, f.comboTimer - dt);
    if (f.comboTimer <= 0) f.combo = 0;

    f.facing = target.x >= f.x ? 1 : -1;
    f.ai.decision = Math.max(0, f.ai.decision - dt);
    f.ai.guard = Math.max(0, f.ai.guard - dt);
    f.ai.jump = Math.max(0, f.ai.jump - dt);
    f.ai.feint = Math.max(0, f.ai.feint - dt);

    const dx = target.x - f.x;
    const absDx = Math.abs(dx);
    const distance = Math.hypot(dx, target.y - f.y);
    const incoming = state.projectiles.some((shot) => {
      if (shot.owner === f.id) return false;
      const approaching = Math.sign(shot.vx || dx) === Math.sign(f.x - shot.x);
      return approaching && Math.abs(shot.x - f.x) < 220 && Math.abs(shot.y - (f.y - 62)) < 80;
    });

    if (f.ai.decision <= 0) {
      const preferred = hasProfile(f, "heavy") ? 112 : hasProfile(f, "swift") ? 168 : 145;
      f.ai.decision = 0.16 + Math.random() * 0.16;
      if (absDx > preferred + 70) {
        f.ai.move = Math.sign(dx);
      } else if (absDx < 76) {
        f.ai.move = -Math.sign(dx || f.facing);
      } else {
        f.ai.move = Math.random() < 0.52 ? Math.sign(dx) : -Math.sign(dx);
      }

      const shouldGuard =
        f.grounded &&
        (incoming ||
          (target.attacking > 0 && absDx < 150 && Math.random() < 0.68) ||
          (f.chakra < 46 && absDx > 240 && Math.random() < 0.58));
      f.ai.guard = shouldGuard ? 0.32 + Math.random() * 0.28 : 0;

      if (target.y < f.y - 70 && f.grounded && Math.random() < 0.42) {
        f.ai.jump = 0.18;
      }
    }

    f.guard = f.ai.guard > 0 && f.grounded && f.stun <= 0;
    if (f.guard) {
      f.chakra = Math.min(f.maxChakra, f.chakra + 30 * dt);
      f.vx *= 0.72;
      if (Math.random() < dt * 18) spawnParticles(f.x, f.y - 64, f.accent, 2, 60);
    } else {
      f.chakra = Math.min(f.maxChakra, f.chakra + 8 * dt);
    }

    if (f.stun <= 0 && !f.guard) {
      if (f.ai.jump > 0 && f.grounded) {
        f.vy = -f.jump;
        f.grounded = false;
        f.ai.jump = 0;
        spawnParticles(f.x, f.y, COLORS.smoke, 8, 120);
      }

      f.vx += f.ai.move * f.speed * 8.4 * dt;
      f.vx *= f.grounded ? 0.8 : 0.92;

      const targetBlocking = target.guard && absDx < 150;
      if (f.chakra >= f.maxChakra && f.cooldowns.ultimate <= 0 && distance < 520) {
        castUltimate(f);
      } else if (f.cooldowns.jutsu <= 0 && f.chakra >= (hasProfile(f, "heavy") ? 34 : 28) && distance < 390 && !targetBlocking) {
        castJutsu(f, target);
      } else if (f.cooldowns.dash <= 0 && f.chakra >= 18 && absDx > 120 && absDx < 460 && Math.random() < dt * 2.8) {
        shadowStep(f, target);
      } else if (f.cooldowns.attack <= 0 && absDx < 112 && Math.abs(target.y - f.y) < 118) {
        melee(f);
      } else if (f.cooldowns.projectile <= 0 && f.chakra >= 10 && absDx > 135 && Math.random() < dt * 5.2) {
        projectile(f);
      }
    }

    f.vy += 1580 * dt;
    f.x = clamp(f.x + f.vx * dt, 74, WORLD.width - 74);
    f.y += f.vy * dt;
    if (f.y >= WORLD.ground) {
      f.y = WORLD.ground;
      f.vy = 0;
      f.grounded = true;
    }
  }

  function tickCooldowns(f, dt) {
    Object.keys(f.cooldowns).forEach((key) => {
      f.cooldowns[key] = Math.max(0, f.cooldowns[key] - dt);
    });
  }

  function isActionPressed(code) {
    return code === "MouseLeft" ? POINTER.attack : KEYS.has(code);
  }

  function melee(f) {
    if (f.cooldowns.attack > 0) return;
    f.combo = (f.combo % 3) + 1;
    f.comboTimer = 0.72;
    f.cooldowns.attack = f.combo === 3 ? 0.34 : 0.22;
    f.attacking = 0.16;
    const heavy = f.combo === 3;
    state.hitboxes.push({
      owner: f.id,
      x: f.x + f.facing * (heavy ? 58 : 46),
      y: f.y - 58,
      w: heavy ? 96 : 78,
      h: heavy ? 72 : 58,
      damage: (heavy ? 18 : 10) * f.power,
      knock: heavy ? 560 : 330,
      lift: heavy ? -430 : -170,
      life: 0.11,
      color: heavy ? f.accent : f.color,
      hit: false,
      kind: "体术",
    });
    spawnParticles(f.x + f.facing * 38, f.y - 58, f.color, heavy ? 14 : 7, 150);
  }

  function projectile(f) {
    castCharacterSkill(f, opponentOf(f.id), "q");
  }

  function shadowStep(f, target) {
    if (f.cooldowns.dash > 0 || f.chakra < 18) return;
    f.cooldowns.dash = hasProfile(f, "swift") ? 1.05 : 1.35;
    f.chakra -= 18;
    f.invuln = 0.22;
    const oldX = f.x;
    const oldY = f.y;
    if (Math.abs(target.x - f.x) < 330) {
      f.x = clamp(target.x - f.facing * 118, 74, WORLD.width - 74);
      f.y = Math.min(f.y, target.y);
    } else {
      f.x = clamp(f.x + f.facing * 230, 74, WORLD.width - 74);
    }
    f.vx = f.facing * 160;
    spawnParticles(oldX, oldY - 52, COLORS.smoke, 28, 190);
    spawnParticles(f.x, f.y - 52, f.accent, 18, 230);
    addLog(`${f.name} 影步`);
  }

  function castJutsu(f, target) {
    castCharacterSkill(f, target, "e");
  }

  function castUltimate(f) {
    castCharacterSkill(f, opponentOf(f.id), "r");
  }

  function castCharacterSkill(f, target, slot) {
    const def = FIGHTERS[f.type];
    const fx = def.fx ? def.fx[slot] : null;
    const cooldownKey = slot === "q" ? "projectile" : slot === "e" ? "jutsu" : "ultimate";
    const cost = slot === "q" ? 10 : slot === "e" ? (hasProfile(f, "heavy") ? 34 : 28) : f.maxChakra;
    if (!fx || f.cooldowns[cooldownKey] > 0 || f.chakra < cost) return;

    f.cooldowns[cooldownKey] = slot === "q" ? 0.55 : slot === "e" ? 3.1 : 8;
    if (slot === "q" && hasProfile(f, "swift")) f.cooldowns[cooldownKey] = 0.38;
    if (slot === "e" && hasProfile(f, "swift")) f.cooldowns[cooldownKey] = 2.35;
    f.chakra -= cost;
    if (slot === "q") f.kunaiStacks = Math.min(12, f.kunaiStacks + 1);
    if (slot === "r") {
      f.invuln = 1.1;
      state.flash = 1;
    }
    state.shake = Math.max(state.shake, slot === "r" ? 18 : 8);
    addLog(`${f.name}：${slot === "q" ? def.skill1 : slot === "e" ? def.skill2 : def.skill3}`);

    const baseDamage = (slot === "q" ? 18 : slot === "e" ? 34 : 62) * f.power;
    const x = f.x;
    const y = f.y - 70;
    const forwardX = x + f.facing * 120;

    switch (fx) {
      case "stomp":
        addAreaSkill(f, x, f.y - 30, 230, 110, baseDamage, "quake", COLORS.earth);
        f.chakra = Math.min(f.maxChakra, f.chakra + 10);
        break;
      case "rageCone":
        addBoxSkill(f, x + f.facing * 110, y, 240, 150, baseDamage + f.combo * 4, "rage", COLORS.red, 520, -220);
        break;
      case "fortress":
        f.guard = true;
        f.invuln = 1.4;
        addAreaSkill(f, x, f.y - 48, 260, 160, baseDamage * 1.25, "fortress", COLORS.gold);
        break;
      case "shadowStepStrike":
        if (target) {
          f.x = clamp(target.x - f.facing * 96, 74, WORLD.width - 74);
          f.y = Math.min(f.y, target.y);
        }
        addBoxSkill(f, f.x + f.facing * 42, f.y - 58, 130, 90, baseDamage * 1.15, "shadow", COLORS.violet, 560, -240);
        break;
      case "tripleStrike":
        for (let i = 0; i < 3; i += 1) {
          addDelayedBoxSkill(f, x + f.facing * (70 + i * 26), y, 120, 80, baseDamage * (i === 2 ? 0.85 : 0.45), "slash", f.accent, i * 0.08);
        }
        break;
      case "stealthBurst":
        f.invuln = 1.2;
        addBoxSkill(f, x + f.facing * 100, y, 230, 110, baseDamage * 1.25, "stealth", f.accent, 780, -360);
        break;
      case "bloodWave":
        addSkillProjectile(f, "bloodWave", x + f.facing * 42, y - 2, f.facing * 720, 0, 22, baseDamage, 1.1, f.accent, true);
        healFighter(f, 6);
        break;
      case "painBurst":
        f.hp = Math.max(1, f.hp - f.maxHp * 0.1);
        f.chakra = Math.min(f.maxChakra, f.chakra + 16);
        addAreaSkill(f, x, y, 210, 120, baseDamage * 1.1, "bloodBurst", f.accent);
        break;
      case "bloodPact":
        addLinkEffect(f, target, "bloodLink", f.accent);
        addBoxSkill(f, forwardX, y, 260, 110, baseDamage * 1.25, "bloodPact", f.accent, 420, -220);
        break;
      case "puppetRush":
        addSkillProjectile(f, "puppet", x + f.facing * 50, y, f.facing * 640, 0, 28, baseDamage, 1.25, f.accent, true);
        break;
      case "silkPull":
        addLinkEffect(f, target, "silk", f.accent);
        if (target) target.x += (f.x - target.x) * 0.35;
        addBoxSkill(f, forwardX, y, 300, 70, baseDamage * 0.8, "silk", f.accent, 160, -80);
        break;
      case "puppetResonance":
        for (let i = -1; i <= 1; i += 1) addSkillProjectile(f, "puppetBomb", x + i * 42, y, f.facing * (420 + i * 80), -80 + i * 60, 34, baseDamage * 0.55, 1.2, f.accent, false);
        addAreaSkill(f, x, y, 240, 120, baseDamage * 0.55, "resonance", f.accent);
        break;
      case "thunderThrust":
        f.x = clamp(f.x + f.facing * 190, 74, WORLD.width - 74);
        addBoxSkill(f, x + f.facing * 140, y, 310, 86, baseDamage, "thunderLine", f.accent, 620, -260);
        break;
      case "thunderField":
        addAreaSkill(f, x, y, 250, 140, baseDamage * 0.8, "thunderField", f.accent);
        break;
      case "thunderStrike":
        addAreaSkill(f, target ? target.x : forwardX, target ? target.y - 70 : y, 300, 300, baseDamage * 1.45, "thunderStrike", f.accent);
        break;
      case "frostNova":
        addAreaSkill(f, x, y, 230, 130, baseDamage, "frostNova", f.accent);
        break;
      case "iceShard":
        addSkillProjectile(f, "iceShard", x + f.facing * 44, y, f.facing * 680, -40, 20, baseDamage * 0.9, 1.1, f.accent, false);
        for (let i = -1; i <= 1; i += 1) addSkillProjectile(f, "iceShardSmall", x + f.facing * 80, y + i * 18, f.facing * 560, i * 90, 13, baseDamage * 0.35, 0.9, f.accent, false);
        break;
      case "absoluteZero":
        addBoxSkill(f, forwardX, y, 340, 260, baseDamage * 1.35, "blizzard", f.accent, 240, -520);
        break;
      case "starVolley":
        for (let i = -1; i <= 1; i += 1) addSkillProjectile(f, "starArrow", x + f.facing * 48, y + i * 16, f.facing * 860, i * 65, 12, baseDamage * 0.55, 1.0, f.accent, true);
        break;
      case "gravityTrap":
        addAreaSkill(f, forwardX, f.y - 40, 190, 120, baseDamage * 0.65, "gravity", f.accent);
        if (target) target.x += (forwardX - target.x) * 0.45;
        break;
      case "starPierce":
        addBoxSkill(f, x + f.facing * 360, y, 760, 54, baseDamage * 1.35, "starPierce", f.accent, 760, -160);
        break;
      case "flameBreath":
        addBoxSkill(f, x + f.facing * 130, y, 270, 150, baseDamage, "flameCone", f.accent, 380, -120);
        break;
      case "burnDetonate":
        addAreaSkill(f, target ? target.x : forwardX, target ? target.y - 60 : y, 230, 130, baseDamage * 1.2, "detonate", f.accent);
        f.cooldowns.projectile = Math.min(f.cooldowns.projectile, 0.2);
        break;
      case "infernoSea":
        addBoxSkill(f, forwardX, f.y - 35, 360, 150, baseDamage * 1.25, "inferno", f.accent, 400, -180);
        break;
      case "forestArrow":
        addSkillProjectile(f, "forestArrow", x + f.facing * 46, y, f.facing * 820, 0, 16, baseDamage, 1.0, f.accent, true);
        f.x = clamp(f.x - f.facing * 90, 74, WORLD.width - 74);
        break;
      case "vineTrap":
        addAreaSkill(f, forwardX, f.y - 24, 170, 130, baseDamage * 0.7, "vine", f.accent);
        break;
      case "featherStorm":
        addAreaSkill(f, x, y, 280, 190, baseDamage * 1.15, "feather", f.accent);
        healFighter(f, 4);
        break;
      case "lightningChain":
        addLinkEffect(f, target, "chain", f.accent);
        addAreaSkill(f, target ? target.x : forwardX, target ? target.y - 70 : y, 160, 120, baseDamage, "chainBurst", f.accent);
        break;
      case "staticField":
        addAreaSkill(f, x, y, 250, 150, baseDamage * 0.8, "static", f.accent);
        break;
      case "thunderStorm":
        for (let i = 0; i < 3; i += 1) addDelayedBoxSkill(f, (target ? target.x : forwardX) + (i - 1) * 80, target ? target.y - 90 : y, 130, 220, baseDamage * 0.55, "stormBolt", f.accent, i * 0.16);
        break;
      case "ghostSummon":
        for (let i = -1; i <= 1; i += 2) addSkillProjectile(f, "ghost", x + i * 34, y, f.facing * 520, i * 60, 20, baseDamage * 0.6, 1.4, f.accent, false);
        break;
      case "poisonRemains":
        addAreaSkill(f, target ? target.x : forwardX, target ? target.y - 60 : y, 240, 140, baseDamage * 0.85, "poison", f.accent);
        break;
      case "demonFall":
        addAreaSkill(f, forwardX, y - 20, 320, 250, baseDamage * 1.45, "demon", f.accent);
        break;
      case "mayflySwarm":
        for (let i = 0; i < 7; i += 1) addSkillProjectile(f, "mayfly", x + f.facing * 30, y + (i - 3) * 12, f.facing * (420 + i * 35), (i - 3) * 45, 9, baseDamage * 0.24, 1.2, f.accent, false);
        break;
      case "taotieMaw":
        addAreaSkill(f, forwardX, y, 250, 170, baseDamage, "maw", f.accent);
        break;
      case "flowerDream":
        addAreaSkill(f, x, y, 300, 210, baseDamage * 0.95, "flower", f.accent);
        for (let i = -2; i <= 2; i += 1) addSkillProjectile(f, "butterfly", x, y, f.facing * 360, i * 90, 10, baseDamage * 0.22, 1.3, f.accent, true);
        break;
      default:
        addBoxSkill(f, forwardX, y, 220, 120, baseDamage, "generic", f.accent, 440, -160);
    }
  }

  function addBoxSkill(f, x, y, w, h, damage, fx, color, knock = 420, lift = -180) {
    state.hitboxes.push({
      owner: f.id,
      x,
      y,
      w,
      h,
      damage,
      knock,
      lift,
      life: 0.16,
      color,
      hit: false,
      kind: "技能",
      fx,
    });
    addSkillEffect({ fx, x, y, w, h, color, life: 0.42, maxLife: 0.42, owner: f.id });
    spawnParticles(x, y, color, 26, 260);
  }

  function addAreaSkill(f, x, y, w, h, damage, fx, color, knock = 360, lift = -180) {
    addBoxSkill(f, x, y, w, h, damage, fx, color, knock, lift);
  }

  function addDelayedBoxSkill(f, x, y, w, h, damage, fx, color, delay) {
    state.skillEffects.push({
      fx,
      x,
      y,
      w,
      h,
      color,
      life: delay + 0.36,
      maxLife: delay + 0.36,
      delay,
      pendingHit: { owner: f.id, damage, knock: 430, lift: -220 },
    });
  }

  function addSkillProjectile(f, fx, x, y, vx, vy, radius, damage, life, color, pierce) {
    state.projectiles.push({
      owner: f.id,
      x,
      y,
      vx,
      vy,
      radius,
      damage,
      life,
      color,
      spin: 0,
      age: 0,
      pierce,
      skill: true,
      kind: fx,
      hit: new Set(),
    });
    addSkillEffect({ fx, x, y, w: radius * 4, h: radius * 4, color, life: 0.28, maxLife: 0.28, follow: true });
  }

  function addSkillEffect(effect) {
    state.skillEffects.push(effect);
  }

  function addLinkEffect(f, target, fx, color) {
    if (!target) return;
    state.skillEffects.push({
      fx,
      x: f.x,
      y: f.y - 70,
      x2: target.x,
      y2: target.y - 70,
      w: Math.abs(target.x - f.x),
      h: 80,
      color,
      life: 0.45,
      maxLife: 0.45,
    });
  }

  function healFighter(f, value) {
    f.hp = Math.min(f.maxHp, f.hp + value);
    spawnParticles(f.x, f.y - 70, COLORS.green, 16, 130);
  }

  function updateProjectiles(dt) {
    state.projectiles = state.projectiles.filter((shot) => {
      if (shot.life !== Infinity) shot.life -= dt;
      shot.age = (shot.age || 0) + dt;
      shot.x += shot.vx * dt;
      shot.y += shot.vy * dt;
      shot.vy += shot.kind === "手里剑" ? 70 * dt : 0;
      shot.spin += dt * 18;
      spawnParticles(shot.x, shot.y, shot.color, 1, 45);

      const target = opponentOf(shot.owner);
      if (shot.kind === "飞龙忍术") {
        const dragonRect = {
          x: shot.x - shot.w / 2,
          y: shot.y - shot.h / 2,
          w: shot.w,
          h: shot.h,
        };
        if (target && !shot.hit.has(target.id) && rectsOverlap(dragonRect, fighterRect(target))) {
          shot.hit.add(target.id);
          damageFighter(target, shot.damage, shot.owner, "忍术", Math.sign(shot.vx) || 1, 620, -300);
          spawnParticles(target.x, target.y - 66, shot.color, 54, 430);
        }
        return shot.x > -shot.w && shot.x < WORLD.width + shot.w && shot.y > -shot.h && shot.y < WORLD.height + shot.h;
      }
      if (target && circleRect(shot.x, shot.y, shot.radius, fighterRect(target))) {
        if (shot.hit && shot.hit.has(target.id)) return shot.life > 0;
        if (shot.hit) shot.hit.add(target.id);
        damageFighter(target, shot.damage, shot.owner, shot.skill ? "技能" : shot.kind, Math.sign(shot.vx) || 1, shot.kind === "手里剑" ? 250 : 520, -160);
        spawnParticles(shot.x, shot.y, shot.color, 22, 260);
        return shot.pierce && shot.life > 0;
      }
      return shot.life > 0 && shot.x > -80 && shot.x < WORLD.width + 80 && shot.y < WORLD.height + 120;
    });
  }

  function updateSkillEffects(dt) {
    state.skillEffects = state.skillEffects.filter((effect) => {
      effect.life -= dt;
      effect.age = (effect.age || 0) + dt;
      if (effect.delay !== undefined) effect.delay -= dt;

      if (effect.pendingHit && effect.delay <= 0) {
        state.hitboxes.push({
          owner: effect.pendingHit.owner,
          x: effect.x,
          y: effect.y,
          w: effect.w,
          h: effect.h,
          damage: effect.pendingHit.damage,
          knock: effect.pendingHit.knock,
          lift: effect.pendingHit.lift,
          life: 0.16,
          color: effect.color,
          hit: false,
          kind: "技能",
          fx: effect.fx,
        });
        spawnParticles(effect.x, effect.y, effect.color, 44, 340);
        state.shake = Math.max(state.shake, 11);
        effect.pendingHit = null;
      }

      return effect.life > 0;
    });
  }

  function updateHitboxes(dt) {
    state.hitboxes = state.hitboxes.filter((box) => {
      box.life -= dt;
      const target = opponentOf(box.owner);
      if (!box.hit && target && rectsOverlap(hitboxRect(box), fighterRect(target))) {
        const dir = Math.sign(target.x - centerX(box)) || (box.owner === "p1" ? 1 : -1);
        damageFighter(target, box.damage, box.owner, box.kind, dir, box.knock, box.lift);
        box.hit = true;
      }
      return box.life > 0;
    });
  }

  function updateUltimates(dt) {
    state.ultimates = state.ultimates.filter((ult) => {
      const caster = state.players.find((p) => p.id === ult.owner);
      const target = opponentOf(ult.owner);
      if (!caster || !target) return false;

      ult.time += dt;
      const orbX = caster.x + caster.facing * 94;
      const orbY = caster.y - (ult.airCast ? 112 : 84);

      const dx = orbX - target.x;
      const dy = orbY - (target.y - 58);
      const distance = Math.hypot(dx, dy);
      if (distance < ult.pullRadius) {
        const pull = Math.max(0, 1 - distance / ult.pullRadius);
        target.vx += (dx / (distance || 1)) * 1100 * pull * dt;
        target.vy += (dy / (distance || 1)) * 860 * pull * dt;
      }

      while (ult.nextTick <= ult.time && ult.nextTick < ult.duration) {
        ult.nextTick += 0.1;
        state.hitboxes.push({
          owner: ult.owner,
          x: orbX,
          y: orbY,
          w: ult.orbitRadius * 2.1,
          h: ult.orbitRadius * 1.8,
          damage: ult.orbitDamage,
          knock: 180,
          lift: -120,
          life: 0.09,
          color: ult.accent,
          hit: false,
          kind: "奥义",
        });
        state.shake = Math.max(state.shake, 7);
        spawnParticles(orbX, orbY, ult.accent, 20, 260);
      }

      if (ult.time >= ult.duration && !ult.exploded) {
        ult.exploded = true;
        state.hitboxes.push({
          owner: ult.owner,
          x: orbX + caster.facing * 18,
          y: orbY,
          w: ult.finalRadius * 2,
          h: ult.finalRadius * 2,
          damage: ult.finalDamage,
          knock: 980,
          lift: -760,
          life: 0.22,
          color: COLORS.gold,
          hit: false,
          kind: "奥义",
        });
        caster.kunaiStacks = 0;
        state.flash = 1;
        state.shake = 24;
        spawnParticles(orbX, orbY, COLORS.gold, 110, 720);
      }

      return ult.time < ult.duration + 0.25;
    });
  }

  function damageFighter(target, amount, attackerId, kind, dir, knock, lift) {
    if (target.invuln > 0 || state.finished) return;
    const attacker = state.players.find((p) => p.id === attackerId);
    if (trySubstitute(target, attacker)) return;

    const blocked = target.guard && Math.sign(attacker.x - target.x) === target.facing;
    const finalAmount = blocked ? amount * 0.35 : amount;
    target.hp = Math.max(0, target.hp - finalAmount);
    target.vx = dir * (blocked ? knock * 0.22 : knock);
    target.vy = blocked ? Math.min(target.vy, -80) : lift;
    target.stun = blocked ? 0.12 : kind === "奥义" ? 0.5 : 0.24;
    target.invuln = kind === "奥义" ? 0.06 : 0.12;
    target.chakra = Math.min(target.maxChakra, target.chakra + (blocked ? 7 : 4));
    attacker.chakra = Math.min(attacker.maxChakra, attacker.chakra + (kind === "体术" ? 8 : 5));
    state.shake = Math.max(state.shake, kind === "奥义" ? 16 : kind === "忍术" ? 10 : 5);
    spawnParticles(target.x, target.y - 62, blocked ? COLORS.gold : COLORS.red, blocked ? 12 : 28, blocked ? 140 : 280);
    if (!blocked) addLog(`${attacker.name} 命中 ${kind}`);
  }

  function trySubstitute(target, attacker) {
    if (!attacker || target.cooldowns.substitute > 0 || target.chakra < 24 || target.hp <= 18) return false;
    target.cooldowns.substitute = 4.2;
    target.chakra -= 24;
    target.invuln = 0.48;
    const oldX = target.x;
    const oldY = target.y;
    target.x = clamp(attacker.x - attacker.facing * 118, 74, WORLD.width - 74);
    target.y = Math.min(target.y, attacker.y);
    target.vx = 0;
    target.vy = Math.min(target.vy, -120);
    spawnParticles(oldX, oldY - 58, COLORS.smoke, 36, 210);
    spawnParticles(target.x, target.y - 58, target.accent, 18, 220);
    addLog(`${target.name} 替身术`);
    return true;
  }

  function resolveFighterPush(a, b) {
    if (!a || !b) return;
    const ra = fighterRect(a);
    const rb = fighterRect(b);
    if (!rectsOverlap(ra, rb)) return;
    const overlap = Math.min(ra.x + ra.w - rb.x, rb.x + rb.w - ra.x);
    const push = Math.max(0, overlap) * 0.5;
    if (a.x <= b.x) {
      a.x -= push;
      b.x += push;
    } else {
      a.x += push;
      b.x -= push;
    }
    a.x = clamp(a.x, 74, WORLD.width - 74);
    b.x = clamp(b.x, 74, WORLD.width - 74);
  }

  function updateParticles(dt) {
    state.particles = state.particles.filter((p) => {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.95;
      p.vy *= 0.95;
      return p.life > 0;
    });
    state.logs = state.logs.filter((log) => {
      log.life -= dt;
      return log.life > 0;
    });
  }

  function updateCamera(dt) {
    const [a, b] = state.players;
    if (!a || !b) return;
    const midX = (a.x + b.x) / 2;
    const midY = Math.min(a.y, b.y) - 90;
    const span = Math.abs(a.x - b.x);
    const targetZoom = clamp(window.innerWidth / Math.max(980, span + 420), 0.72, 1.06);
    state.camera.zoom += (targetZoom - state.camera.zoom) * Math.min(1, dt * 4);
    state.camera.x += (midX - window.innerWidth / (2 * state.camera.zoom) - state.camera.x) * Math.min(1, dt * 5);
    state.camera.y += (midY - window.innerHeight / (2 * state.camera.zoom) - state.camera.y) * Math.min(1, dt * 5);
    state.camera.x = clamp(state.camera.x, 0, WORLD.width - window.innerWidth / state.camera.zoom);
    state.camera.y = clamp(state.camera.y, 0, WORLD.height - window.innerHeight / state.camera.zoom);
  }

  function finishMatch() {
    if (state.finished) return;
    state.finished = true;
    state.running = false;
    const [p1, p2] = state.players;
    let winner = p1;
    if (p2.hp > p1.hp) winner = p2;
    const playerName = winner.id === "p1" ? "挑战胜利" : "AI 获胜";
    ui.winnerTitle.textContent = playerName;
    ui.winnerText.textContent =
      winner.id === "p1"
        ? `${winner.name} · ${winner.school} 击败了 AI，剩余体力 ${Math.ceil(winner.hp)}。`
        : `AI 的 ${winner.name} · ${winner.school} 赢下了对战，剩余体力 ${Math.ceil(winner.hp)}。`;
    ui.endOverlay.classList.add("overlay--active");
  }

  function updateUi() {
    const previewAi = FIGHTERS[state.selected.p2] ? state.selected.p2 : DEFAULT_FIGHTER;
    const [p1, p2] = state.players.length
      ? state.players
      : [createFighter("p1", state.selected.p1, 420), createFighter("p2", previewAi, 1180)];
    ui.p1Name.textContent = `${p1.name} · ${p1.school}`;
    ui.p2Name.textContent = `${p2.name} · ${p2.school}`;
    ui.p1HpText.textContent = `${Math.ceil(p1.hp)} / ${p1.maxHp}`;
    ui.p2HpText.textContent = `${Math.ceil(p2.hp)} / ${p2.maxHp}`;
    ui.p1ChakraText.textContent = `${Math.floor(p1.chakra)} / ${p1.maxChakra}`;
    ui.p2ChakraText.textContent = `${Math.floor(p2.chakra)} / ${p2.maxChakra}`;
    ui.p1Hp.style.width = `${clamp((p1.hp / p1.maxHp) * 100, 0, 100)}%`;
    ui.p2Hp.style.width = `${clamp((p2.hp / p2.maxHp) * 100, 0, 100)}%`;
    ui.p1Chakra.style.width = `${clamp((p1.chakra / p1.maxChakra) * 100, 0, 100)}%`;
    ui.p2Chakra.style.width = `${clamp((p2.chakra / p2.maxChakra) * 100, 0, 100)}%`;
    ui.roundState.textContent = state.running ? "交战" : state.finished ? "结束" : "准备";
    ui.timer.textContent = String(Math.ceil(state.timeLeft));
  }

  function render() {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    ctx.save();
    const shakeX = (Math.random() - 0.5) * state.shake;
    const shakeY = (Math.random() - 0.5) * state.shake;
    ctx.translate(shakeX, shakeY);
    ctx.scale(state.camera.zoom, state.camera.zoom);
    ctx.translate(-state.camera.x, -state.camera.y);
    drawStage();
    state.hitboxes.forEach(drawHitbox);
    state.skillEffects.forEach(drawSkillEffect);
    state.projectiles.forEach(drawProjectile);
    state.ultimates.forEach(drawUltimateEffect);
    state.players.forEach(drawFighter);
    state.particles.forEach(drawParticle);
    ctx.restore();
    drawOverlayFx();
  }

  function drawStage() {
    const sky = ctx.createLinearGradient(0, 0, 0, WORLD.height);
    sky.addColorStop(0, "#17263b");
    sky.addColorStop(0.52, "#20202d");
    sky.addColorStop(1, "#11141a");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, WORLD.width, WORLD.height);

    ctx.save();
    ctx.globalAlpha = 0.24;
    for (let i = 0; i < 8; i += 1) {
      const x = 80 + i * 220;
      drawMountain(x, WORLD.ground - 260, 260, 280, i % 2 ? "#33435a" : "#28364a");
    }
    ctx.restore();

    drawVillage();
    ctx.fillStyle = "#2d2420";
    ctx.fillRect(0, WORLD.ground, WORLD.width, WORLD.height - WORLD.ground);
    ctx.fillStyle = "#3b3026";
    for (let x = 0; x < WORLD.width; x += 84) {
      ctx.fillRect(x, WORLD.ground + 6, 54, 8);
      ctx.fillRect(x + 22, WORLD.ground + 34, 64, 8);
    }
    ctx.strokeStyle = "rgba(255, 209, 102, 0.55)";
    ctx.lineWidth = 6;
    ctx.strokeRect(34, 76, WORLD.width - 68, WORLD.ground - 76);

    ctx.save();
    ctx.globalAlpha = 0.12;
    ctx.strokeStyle = COLORS.gold;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(WORLD.width / 2, WORLD.ground - 24, 210, Math.PI, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  function drawMountain(x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x - w / 2, y + h);
    ctx.lineTo(x, y);
    ctx.lineTo(x + w / 2, y + h);
    ctx.closePath();
    ctx.fill();
  }

  function drawVillage() {
    const baseY = WORLD.ground - 72;
    for (let i = 0; i < 9; i += 1) {
      const x = 70 + i * 180;
      const h = 54 + (i % 3) * 18;
      ctx.fillStyle = i % 2 ? "#263040" : "#30354a";
      ctx.fillRect(x, baseY - h, 118, h);
      ctx.fillStyle = i % 2 ? "#9b3f36" : "#b55b36";
      ctx.beginPath();
      ctx.moveTo(x - 12, baseY - h);
      ctx.lineTo(x + 59, baseY - h - 42);
      ctx.lineTo(x + 130, baseY - h);
      ctx.closePath();
      ctx.fill();
    }
  }

  function drawFighter(f) {
    ctx.save();
    ctx.translate(f.x, f.y);
    ctx.globalAlpha = f.invuln > 0 && Math.floor(performance.now() / 55) % 2 ? 0.58 : 1;

    ctx.fillStyle = COLORS.shadow;
    ctx.beginPath();
    ctx.ellipse(0, 8, 46, 13, 0, 0, Math.PI * 2);
    ctx.fill();

    if (f.guard) {
      ctx.strokeStyle = f.accent;
      ctx.lineWidth = 5;
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.arc(f.facing * 16, -58, 54, -Math.PI / 2, Math.PI / 2, f.facing < 0);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    ctx.scale(f.facing, 1);
    ctx.fillStyle = f.color;
    roundedRect(-22, -96, 44, 72, 12);
    ctx.fill();
    ctx.fillStyle = f.accent;
    ctx.fillRect(-21, -74, 42, 10);
    ctx.fillStyle = COLORS.paper;
    ctx.beginPath();
    ctx.arc(0, -116, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLORS.ink;
    ctx.fillRect(4, -120, 7, 4);
    ctx.fillStyle = f.accent;
    ctx.fillRect(-24, -139, 48, 11);
    ctx.fillStyle = f.color;
    ctx.fillRect(-32, -137, 16, 7);
    ctx.fillRect(16, -137, 24, 7);

    ctx.strokeStyle = COLORS.paper;
    ctx.lineWidth = 8;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-18, -80);
    ctx.lineTo(-42, -50 + Math.sin(performance.now() / 90) * 5);
    ctx.moveTo(18, -80);
    ctx.lineTo(46 + (f.attacking > 0 ? 18 : 0), -54);
    ctx.moveTo(-12, -26);
    ctx.lineTo(-22, 0);
    ctx.moveTo(14, -26);
    ctx.lineTo(30, 0);
    ctx.stroke();
    ctx.restore();
  }

  function drawProjectile(shot) {
    ctx.save();
    ctx.translate(shot.x, shot.y);
    if (shot.kind === "飞龙忍术") {
      const dir = Math.sign(shot.vx) || 1;
      ctx.scale(dir, 1);
      ctx.globalAlpha = clamp((shot.age || 0) / 0.18, 0, 1);
      ctx.shadowColor = shot.color;
      ctx.shadowBlur = 24;
      drawFlyingDragon(shot);
      ctx.shadowBlur = 0;
      ctx.restore();
      return;
    }
    if (shot.skill) {
      drawSkillProjectile(shot);
      ctx.restore();
      return;
    }
    ctx.rotate(shot.spin);
    ctx.fillStyle = shot.color;
    if (shot.kind === "手里剑") {
      for (let i = 0; i < 4; i += 1) {
        ctx.rotate(Math.PI / 2);
        ctx.beginPath();
        ctx.moveTo(0, -shot.radius * 1.8);
        ctx.lineTo(shot.radius * 0.7, 0);
        ctx.lineTo(0, shot.radius * 0.55);
        ctx.lineTo(-shot.radius * 0.7, 0);
        ctx.closePath();
        ctx.fill();
      }
    } else {
      ctx.globalAlpha = 0.72;
      ctx.beginPath();
      ctx.arc(0, 0, shot.radius * 1.7, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = COLORS.paper;
      ctx.beginPath();
      ctx.arc(0, 0, shot.radius * 0.55, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawSkillEffect(effect) {
    const progress = 1 - clamp(effect.life / effect.maxLife, 0, 1);
    const alpha = clamp(effect.life / effect.maxLife, 0, 1);
    const rect = {
      x: effect.x - effect.w / 2,
      y: effect.y - effect.h / 2,
      w: effect.w,
      h: effect.h,
    };
    const fx = effect.fx;

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = alpha;

    if (["bloodPact", "silkPull"].includes(fx) && effect.x2 !== undefined) {
      drawEnergyLink(effect, progress);
      ctx.restore();
      return;
    }

    if (["thunderThrust", "thunderField", "thunderStrike", "staticField", "thunderStorm", "lightningChain"].includes(fx)) {
      drawStormEffect(effect, rect, progress);
    } else if (["frostNova", "iceShard", "absoluteZero"].includes(fx)) {
      drawFrostEffect(effect, rect, progress);
    } else if (["flameBreath", "burnDetonate", "infernoSea"].includes(fx)) {
      drawFireEffect(effect, rect, progress);
    } else if (["forestArrow", "vineTrap", "featherStorm", "flowerDream"].includes(fx)) {
      drawNatureEffect(effect, rect, progress);
    } else if (["puppetRush", "puppetBomb", "puppetResonance"].includes(fx)) {
      drawPuppetEffect(effect, rect, progress);
    } else if (["shadowStepStrike", "tripleStrike", "stealthBurst"].includes(fx)) {
      drawShadowEffect(effect, rect, progress);
    } else if (["bloodWave", "painBurst"].includes(fx)) {
      drawBloodEffect(effect, rect, progress);
    } else if (["starVolley", "gravityTrap", "starPierce"].includes(fx)) {
      drawStarEffect(effect, rect, progress);
    } else if (["ghostSummon", "poisonRemains", "demonFall", "mayflySwarm", "taotieMaw"].includes(fx)) {
      drawSummonEffect(effect, rect, progress);
    } else {
      drawEarthEffect(effect, rect, progress);
    }

    ctx.restore();
  }

  function drawEnergyLink(effect, progress) {
    const waves = effect.fx === "silkPull" ? 4 : 3;
    ctx.strokeStyle = effect.fx === "silkPull" ? "rgba(220,232,255,0.86)" : "rgba(255,72,112,0.82)";
    ctx.lineWidth = effect.fx === "silkPull" ? 3 : 9;
    ctx.setLineDash(effect.fx === "silkPull" ? [16, 10] : []);
    for (let i = 0; i < waves; i += 1) {
      const sway = Math.sin(progress * 10 + i) * 20;
      ctx.beginPath();
      ctx.moveTo(effect.x, effect.y + sway);
      ctx.quadraticCurveTo((effect.x + effect.x2) / 2, effect.y - 80 + sway, effect.x2, effect.y2 - sway);
      ctx.stroke();
    }
    ctx.setLineDash([]);
  }

  function drawEarthEffect(effect, rect, progress) {
    ctx.strokeStyle = "rgba(255,205,126,0.86)";
    ctx.lineWidth = 7;
    for (let i = 0; i < 5; i += 1) {
      const x = rect.x + (i + 0.5) * (rect.w / 5);
      ctx.beginPath();
      ctx.moveTo(x, rect.y + rect.h);
      ctx.lineTo(x + Math.sin(i * 2.1) * 34, rect.y + rect.h * (0.46 - progress * 0.18));
      ctx.lineTo(x + Math.cos(i * 1.7) * 62, rect.y + rect.h * 0.35);
      ctx.stroke();
    }
    ctx.strokeStyle = "rgba(194,139,85,0.68)";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.ellipse(effect.x, effect.y + 12, rect.w * (0.28 + progress * 0.28), rect.h * (0.18 + progress * 0.15), 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  function drawStormEffect(effect, rect, progress) {
    ctx.strokeStyle = "rgba(111,226,255,0.9)";
    ctx.lineWidth = 5;
    for (let i = 0; i < 8; i += 1) {
      const x = rect.x + Math.random() * rect.w;
      ctx.beginPath();
      ctx.moveTo(x, rect.y);
      ctx.lineTo(x + 24, effect.y - rect.h * 0.12);
      ctx.lineTo(x - 18, effect.y + rect.h * 0.16);
      ctx.lineTo(x + 34, rect.y + rect.h);
      ctx.stroke();
    }
    ctx.strokeStyle = "rgba(155,93,229,0.58)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(effect.x, effect.y, rect.w * (0.28 + progress * 0.24), rect.h * 0.36, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  function drawFrostEffect(effect, rect, progress) {
    ctx.strokeStyle = "rgba(174,240,255,0.82)";
    ctx.lineWidth = 4;
    for (let i = 0; i < 9; i += 1) {
      const a = (Math.PI * 2 * i) / 9 + progress;
      ctx.beginPath();
      ctx.moveTo(effect.x, effect.y);
      ctx.lineTo(effect.x + Math.cos(a) * rect.w * 0.45, effect.y + Math.sin(a) * rect.h * 0.35);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(effect.x + Math.cos(a) * rect.w * 0.32, effect.y + Math.sin(a) * rect.h * 0.26, 7, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = "rgba(76,201,240,0.18)";
    roundedRect(rect.x, rect.y, rect.w, rect.h, 12);
    ctx.fill();
  }

  function drawFireEffect(effect, rect, progress) {
    for (let i = 0; i < 9; i += 1) {
      const x = rect.x + Math.random() * rect.w;
      const y = rect.y + rect.h - Math.random() * rect.h * 0.75;
      const r = 18 + Math.random() * 38;
      const flame = ctx.createRadialGradient(x, y, 2, x, y, r);
      flame.addColorStop(0, "rgba(255,238,164,0.88)");
      flame.addColorStop(0.45, "rgba(255,95,54,0.62)");
      flame.addColorStop(1, "rgba(255,95,54,0)");
      ctx.fillStyle = flame;
      ctx.beginPath();
      ctx.ellipse(x, y, r * 0.72, r * (1.1 + progress), 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawNatureEffect(effect, rect, progress) {
    ctx.strokeStyle = "rgba(118,214,114,0.82)";
    ctx.lineWidth = 6;
    for (let i = 0; i < 7; i += 1) {
      const x = rect.x + (i + 0.5) * (rect.w / 7);
      ctx.beginPath();
      ctx.moveTo(x, rect.y + rect.h);
      ctx.bezierCurveTo(x - 24, effect.y + 40, x + 32, effect.y - 36, x + Math.sin(progress * 7 + i) * 28, rect.y + rect.h * 0.18);
      ctx.stroke();
      ctx.fillStyle = i % 2 ? "rgba(208,255,170,0.62)" : "rgba(118,214,114,0.7)";
      ctx.beginPath();
      ctx.ellipse(x + 12, effect.y - i * 7, 15, 6, progress + i, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawPuppetEffect(effect, rect, progress) {
    ctx.strokeStyle = "rgba(255,209,102,0.72)";
    ctx.lineWidth = 3;
    for (let i = 0; i < 6; i += 1) {
      const x = rect.x + (i + 0.5) * (rect.w / 6);
      ctx.beginPath();
      ctx.moveTo(x, rect.y);
      ctx.lineTo(effect.x + Math.sin(i + progress * 8) * rect.w * 0.32, rect.y + rect.h);
      ctx.stroke();
    }
    ctx.fillStyle = "rgba(194,139,85,0.42)";
    for (let i = 0; i < 4; i += 1) {
      roundedRect(rect.x + i * rect.w * 0.22, effect.y - 26 + Math.sin(i) * 12, 36, 32, 4);
      ctx.fill();
    }
  }

  function drawShadowEffect(effect, rect, progress) {
    ctx.strokeStyle = "rgba(155,93,229,0.9)";
    ctx.lineWidth = 8;
    for (let i = 0; i < 4; i += 1) {
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, rect.w * (0.2 + i * 0.08 + progress * 0.12), -0.8 + i, 1.2 + i);
      ctx.stroke();
    }
    ctx.fillStyle = "rgba(8,5,18,0.45)";
    ctx.beginPath();
    ctx.ellipse(effect.x, effect.y + 18, rect.w * 0.45, rect.h * 0.36, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawBloodEffect(effect, rect, progress) {
    ctx.strokeStyle = "rgba(255,93,115,0.9)";
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.arc(effect.x, effect.y, rect.w * (0.2 + progress * 0.38), -0.2, Math.PI * 1.25);
    ctx.stroke();
    ctx.fillStyle = "rgba(140,20,48,0.35)";
    ctx.beginPath();
    ctx.ellipse(effect.x, effect.y + 20, rect.w * 0.42, rect.h * 0.22, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawStarEffect(effect, rect, progress) {
    ctx.strokeStyle = "rgba(255,209,102,0.86)";
    ctx.lineWidth = 4;
    for (let i = 0; i < 8; i += 1) {
      const a = (Math.PI * 2 * i) / 8;
      ctx.beginPath();
      ctx.moveTo(effect.x + Math.cos(a) * 12, effect.y + Math.sin(a) * 12);
      ctx.lineTo(effect.x + Math.cos(a) * rect.w * (0.22 + progress * 0.24), effect.y + Math.sin(a) * rect.h * 0.34);
      ctx.stroke();
    }
    ctx.strokeStyle = "rgba(76,201,240,0.64)";
    ctx.beginPath();
    ctx.ellipse(effect.x, effect.y, rect.w * 0.42, rect.h * (0.18 + progress * 0.1), progress, 0, Math.PI * 2);
    ctx.stroke();
  }

  function drawSummonEffect(effect, rect, progress) {
    ctx.fillStyle = "rgba(80,42,130,0.38)";
    ctx.beginPath();
    ctx.ellipse(effect.x, effect.y + 20, rect.w * 0.42, rect.h * 0.34, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(190,255,180,0.74)";
    ctx.lineWidth = 4;
    for (let i = 0; i < 7; i += 1) {
      const a = progress * 7 + i;
      ctx.beginPath();
      ctx.arc(effect.x + Math.cos(a) * rect.w * 0.28, effect.y + Math.sin(a * 1.4) * rect.h * 0.24, 16 + i, 0.3, Math.PI * 1.7);
      ctx.stroke();
    }
  }

  function drawSkillProjectile(shot) {
    const dir = Math.sign(shot.vx) || 1;
    const r = shot.radius;
    ctx.rotate(Math.atan2(shot.vy, shot.vx));
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = shot.color;
    ctx.strokeStyle = shot.color;
    ctx.lineWidth = Math.max(3, r * 0.35);

    if (["iceShard", "iceShardSmall"].includes(shot.kind)) {
      ctx.beginPath();
      ctx.moveTo(r * 2.3 * dir, 0);
      ctx.lineTo(-r * 0.5 * dir, -r);
      ctx.lineTo(-r * 1.5 * dir, 0);
      ctx.lineTo(-r * 0.5 * dir, r);
      ctx.closePath();
      ctx.fill();
    } else if (["starArrow", "forestArrow"].includes(shot.kind)) {
      ctx.beginPath();
      ctx.moveTo(r * 2.8 * dir, 0);
      ctx.lineTo(-r * 1.5 * dir, -r * 0.8);
      ctx.lineTo(-r * 0.8 * dir, 0);
      ctx.lineTo(-r * 1.5 * dir, r * 0.8);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-r * 2.5 * dir, 0);
      ctx.lineTo(-r * 6 * dir, 0);
      ctx.stroke();
    } else if (["ghost", "mayfly", "butterfly"].includes(shot.kind)) {
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 1.6, r, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(r * 0.45, -r * 0.12, r * 0.22, 0, Math.PI * 2);
      ctx.arc(r * 0.45, r * 0.28, r * 0.18, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.paper;
      ctx.fill();
    } else if (shot.kind === "bloodWave") {
      ctx.strokeStyle = "rgba(255,93,115,0.92)";
      ctx.lineWidth = r * 1.2;
      ctx.beginPath();
      ctx.arc(0, 0, r * 2.1, -0.8, 0.8);
      ctx.stroke();
    } else if (shot.kind === "puppetRush") {
      roundedRect(-r * 1.3, -r, r * 2.6, r * 2, 4);
      ctx.fill();
      ctx.strokeStyle = COLORS.gold;
      ctx.strokeRect(-r, -r * 0.7, r * 2, r * 1.4);
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, r * 1.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawUltimateEffect(ult) {
    const caster = state.players.find((p) => p.id === ult.owner);
    if (!caster) return;
    const x = caster.x + caster.facing * 94;
    const y = caster.y - (ult.airCast ? 112 : 84);
    const spin = ult.time * 8;
    const charge = Math.min(1, ult.time / ult.duration);

    ctx.save();
    ctx.translate(x, y);
    ctx.globalCompositeOperation = "lighter";

    const orb = ctx.createRadialGradient(0, 0, 8, 0, 0, 44 + charge * 12);
    orb.addColorStop(0, "rgba(255,244,210,0.95)");
    orb.addColorStop(0.35, "rgba(104,224,255,0.9)");
    orb.addColorStop(0.7, "rgba(255,184,68,0.52)");
    orb.addColorStop(1, "rgba(255,184,68,0)");
    ctx.fillStyle = orb;
    ctx.beginPath();
    ctx.arc(0, 0, 44 + charge * 12, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(255,217,116,0.8)";
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(0, 0, ult.orbitRadius * 0.72, spin, spin + Math.PI * 1.55);
    ctx.stroke();

    ctx.strokeStyle = "rgba(104,224,255,0.72)";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(0, 0, ult.orbitRadius * 0.92, -spin * 1.2, -spin * 1.2 + Math.PI * 1.3);
    ctx.stroke();

    for (let i = 0; i < 4; i += 1) {
      const angle = spin + (Math.PI * 2 * i) / 4;
      const radius = 54 + Math.sin(ult.time * 12 + i) * 8;
      ctx.fillStyle = i % 2 ? "rgba(255,184,68,0.84)" : "rgba(104,224,255,0.84)";
      ctx.beginPath();
      ctx.arc(Math.cos(angle) * radius, Math.sin(angle) * radius, 8 + i, 0, Math.PI * 2);
      ctx.fill();
    }

    if (ult.time >= ult.duration - 0.15 && !ult.exploded) {
      ctx.strokeStyle = "rgba(255,245,196,0.7)";
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.arc(0, 0, ult.finalRadius * 0.55, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawFlyingDragon(shot) {
    const age = shot.age || 0;
    const pulse = Math.sin(age * 18);
    ctx.save();
    ctx.globalCompositeOperation = "lighter";

    for (let i = 0; i < 15; i += 1) {
      const t = i / 14;
      const x = 98 - t * 280;
      const y = Math.sin(t * Math.PI * 2.4 + age * 10) * (22 + t * 18);
      const radius = 38 - t * 18;
      const grd = ctx.createRadialGradient(x, y, 2, x, y, radius);
      grd.addColorStop(0, i % 2 ? "rgba(255, 222, 122, 0.95)" : "rgba(72, 220, 255, 0.9)");
      grd.addColorStop(0.48, i % 2 ? "rgba(255, 112, 42, 0.56)" : "rgba(32, 165, 255, 0.48)");
      grd.addColorStop(1, "rgba(255, 90, 18, 0)");
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.ellipse(x, y, radius * 1.36, radius * 0.72, -0.18, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.strokeStyle = "rgba(255, 213, 96, 0.8)";
    ctx.lineWidth = 10;
    ctx.lineCap = "round";
    ctx.beginPath();
    for (let i = 0; i <= 20; i += 1) {
      const t = i / 20;
      const x = 110 - t * 310;
      const y = Math.sin(t * Math.PI * 2.6 + age * 10) * (18 + t * 22);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    for (let i = 0; i < 9; i += 1) {
      const t = i / 8;
      ctx.fillStyle = `rgba(255, ${120 + i * 10}, 36, ${0.52 - t * 0.34})`;
      ctx.beginPath();
      ctx.arc(-160 - t * 100, Math.sin(t * 9 + age * 13) * 46, 18 + t * 30, 0, Math.PI * 2);
      ctx.fill();
    }

    if (DRAGON_IMAGE.complete && DRAGON_IMAGE.naturalWidth > 0) {
      ctx.save();
      ctx.translate(104, -6 + pulse * 3);
      ctx.rotate(-0.04 + pulse * 0.02);
      ctx.globalCompositeOperation = "screen";
      ctx.drawImage(DRAGON_IMAGE, 88, 22, 138, 148, -76, -58, 158, 116);
      ctx.restore();
    } else {
      ctx.fillStyle = COLORS.gold;
      ctx.beginPath();
      ctx.ellipse(100, 0, 64, 34, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = "rgba(255, 245, 196, 0.96)";
    ctx.beginPath();
    ctx.ellipse(144, -8, 12, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255, 88, 32, 0.9)";
    ctx.beginPath();
    ctx.moveTo(154, 14);
    ctx.lineTo(198 + pulse * 10, 4);
    ctx.lineTo(158, 28);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  function drawHitbox(box) {
    ctx.save();
    ctx.globalAlpha = clamp(box.life * 4, 0, 0.42);
    ctx.fillStyle = box.color;
    const rect = hitboxRect(box);
    roundedRect(rect.x, rect.y, rect.w, rect.h, 18);
    ctx.fill();
    ctx.restore();
  }

  function drawParticle(p) {
    ctx.save();
    ctx.globalAlpha = clamp(p.life / p.maxLife, 0, 1);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawOverlayFx() {
    if (state.flash > 0) {
      ctx.fillStyle = `rgba(255, 244, 220, ${state.flash * 0.24})`;
      ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
    }

    if (!state.running || !state.logs.length) return;
    const log = state.logs[state.logs.length - 1];
    ctx.save();
    ctx.globalAlpha = clamp(log.life / 1.2, 0, 1);
    ctx.fillStyle = "rgba(8, 11, 16, 0.72)";
    roundedRect(window.innerWidth / 2 - 150, 142, 300, 42, 8);
    ctx.fill();
    ctx.textAlign = "center";
    ctx.fillStyle = COLORS.paper;
    ctx.font = "800 20px system-ui, sans-serif";
    ctx.fillText(log.text, window.innerWidth / 2, 169);
    ctx.restore();
  }

  function spawnParticles(x, y, color, count, speed) {
    for (let i = 0; i < count; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const power = (0.25 + Math.random() * 0.75) * speed;
      const life = 0.22 + Math.random() * 0.42;
      state.particles.push({
        x,
        y,
        vx: Math.cos(angle) * power,
        vy: Math.sin(angle) * power,
        color,
        size: 2 + Math.random() * 5,
        life,
        maxLife: life,
      });
    }
  }

  function addLog(text) {
    state.logs.push({ text, life: 1.25 });
  }

  function opponentOf(id) {
    return state.players.find((fighter) => fighter.id !== id);
  }

  function fighterRect(f) {
    return { x: f.x - f.w / 2, y: f.y - f.h, w: f.w, h: f.h };
  }

  function hitboxRect(box) {
    return { x: box.x - box.w / 2, y: box.y - box.h / 2, w: box.w, h: box.h };
  }

  function centerX(box) {
    return box.x;
  }

  function rectsOverlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function circleRect(cx, cy, radius, rect) {
    const x = clamp(cx, rect.x, rect.x + rect.w);
    const y = clamp(cy, rect.y, rect.y + rect.h);
    return Math.hypot(cx - x, cy - y) <= radius;
  }

  function roundedRect(x, y, w, h, r) {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    state.camera.zoom = clamp(window.innerWidth / 1220, 0.72, 1.05);
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
    if (["KeyA", "KeyD", "KeyW", "KeyS", "KeyQ", "KeyE", "KeyR", "KeyT", "Space"].includes(event.code)) {
      event.preventDefault();
    }
    KEYS.add(event.code);
  });
  window.addEventListener("keyup", (event) => KEYS.delete(event.code));
  canvas.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    POINTER.attack = true;
    event.preventDefault();
  });
  window.addEventListener("pointerup", (event) => {
    if (event.button === 0) POINTER.attack = false;
  });
  canvas.addEventListener("contextmenu", (event) => event.preventDefault());
  ui.startButton.addEventListener("click", startMatch);
  ui.restartButton.addEventListener("click", () => {
    state.finished = false;
    state.running = false;
    state.players = [];
    state.selected.p2 = "random";
    ui.endOverlay.classList.remove("overlay--active");
    ui.startOverlay.classList.add("overlay--active");
    updateUi();
  });

  buildCharacterSelect();
  resize();
  updateUi();
  requestAnimationFrame((now) => {
    state.lastTime = now;
    requestAnimationFrame(loop);
  });
})();
