(function () {
  const canvas = document.querySelector("#game");
  const ctx = canvas.getContext("2d");
  const moveName = document.querySelector("#move-name");
  const comboLog = document.querySelector("#combo-log");

  const DPR_CAP = 2;
  const FLOOR_Y = 0.72;
  const INPUT_CHAIN_WINDOW = 1500;
  const MAX_ENEMIES = 2;
  const DIFFICULTY_RAMP_MS = 120000;
  const MAX_HEALTH = 10;
  const DAMAGE_COOLDOWN_MS = 900;
  const HEART_SOURCE = {
    path: "./assets/heart-life.png?v=heart-life-1",
    size: 24,
  };
  const STAR_SOURCE = {
    path: "./assets/star-score.png?v=star-score-1",
    size: 28,
  };
  const PIG_SOURCE = {
    path: "./assets/pig-stand.png?v=stand-down-arms-1",
    height: 242,
    offsetX: 0,
  };
  const PIG_LEFT_HOOK_SOURCE = {
    path: "./assets/pig-left-hook.png?v=left-hook-1",
    height: 242,
    offsetX: -22,
  };
  const PIG_RIGHT_HOOK_SOURCE = {
    path: "./assets/pig-right-hook.png?v=right-hook-clean-1",
    height: 242,
    offsetX: -12,
  };
  const PIG_CROUCH_SOURCE = {
    path: "./assets/pig-crouch.png?v=crouch-pose-1",
    height: 204,
    offsetX: -6,
    keepShape: true,
  };
  const PIG_CROUCH_LEFT_PUNCH_SOURCE = {
    path: "./assets/pig-crouch-left-punch.png?v=crouch-left-punch-4",
    height: 224,
    offsetX: 0,
    keepShape: true,
  };
  const PIG_CROUCH_RIGHT_PUNCH_SOURCE = {
    path: "./assets/pig-crouch-right-punch.png?v=crouch-right-punch-3",
    height: 224,
    offsetX: -10,
    keepShape: true,
  };
  const PIG_JUMP_LEFT_PUNCH_SOURCE = {
    path: "./assets/pig-jump-left-punch.png?v=jump-left-punch-1",
    height: 242,
    offsetX: -4,
    keepShape: true,
  };
  const PIG_JUMP_RIGHT_PUNCH_SOURCE = {
    path: "./assets/pig-jump-right-punch.png?v=jump-right-punch-1",
    height: 242,
    offsetX: 4,
    keepShape: true,
  };
  const ENEMY_WOLF_SOURCE = {
    path: "./assets/enemy-wolf.png?v=wolf-clean-6",
    height: 238,
    facing: 1,
    weight: 1,
    attackStyle: "weapon",
    swingAmount: 0.12,
  };
  const ENEMY_RED_HOOD_WOLF_SOURCE = {
    path: "./assets/enemy-red-hood-wolf.png?v=red-hood-wolf-1",
    height: 238,
    facing: -1,
    weight: 0.325,
    attackStyle: "basket",
    basket: { x: 282, y: 706, width: 318, height: 292 },
  };
  const ENEMY_AXE_WOLF_SOURCE = {
    path: "./assets/enemy-axe-wolf.png?v=axe-wolf-1",
    height: 238,
    facing: -1,
    weight: 0.325,
    attackStyle: "weapon",
    swingAmount: 0.2,
  };
  const ENEMY_KNIFE_WOLF_SOURCE = {
    path: "./assets/enemy-knife-wolf.png?v=knife-wolf-2",
    height: 330,
    facing: 1,
    weight: 0.65,
    attackStyle: "none",
    movement: "bouncer",
  };

  const pigSprites = {
    stand: { image: null, ready: false, source: PIG_SOURCE },
    leftHook: { image: null, ready: false, source: PIG_LEFT_HOOK_SOURCE },
    rightHook: { image: null, ready: false, source: PIG_RIGHT_HOOK_SOURCE },
    crouch: { image: null, ready: false, source: PIG_CROUCH_SOURCE },
    crouchLeftPunch: { image: null, ready: false, source: PIG_CROUCH_LEFT_PUNCH_SOURCE },
    crouchRightPunch: { image: null, ready: false, source: PIG_CROUCH_RIGHT_PUNCH_SOURCE },
    jumpLeftPunch: { image: null, ready: false, source: PIG_JUMP_LEFT_PUNCH_SOURCE },
    jumpRightPunch: { image: null, ready: false, source: PIG_JUMP_RIGHT_PUNCH_SOURCE },
  };
  const wolfSprite = { image: null, ready: false, source: ENEMY_WOLF_SOURCE };
  const redHoodWolfSprite = { image: null, ready: false, source: ENEMY_RED_HOOD_WOLF_SOURCE };
  const axeWolfSprite = { image: null, ready: false, source: ENEMY_AXE_WOLF_SOURCE };
  const knifeWolfSprite = { image: null, ready: false, source: ENEMY_KNIFE_WOLF_SOURCE };
  const enemySprites = [wolfSprite, redHoodWolfSprite, axeWolfSprite, knifeWolfSprite];
  const heartSprite = { image: null, ready: false, source: HEART_SOURCE };
  const starSprite = { image: null, ready: false, source: STAR_SOURCE };

  const state = {
    width: 0,
    height: 0,
    dpr: 1,
    time: 0,
    lastTime: performance.now(),
    inputHistory: [],
    action: null,
    lastPrepAction: null,
    player: {
      x: 0,
      y: 0,
      groundY: 0,
      vx: 0,
      vy: 0,
      facing: 1,
      squash: 0,
      punchSide: 0,
      step: 0,
    },
    effects: [],
    enemies: [],
    health: MAX_HEALTH,
    defeatedWolves: 0,
    lastDamageAt: -Infinity,
    nextEnemyAt: 900,
    gameOver: false,
  };

  function loadPigSprite() {
    loadSprite(pigSprites.stand);
    loadSprite(pigSprites.leftHook);
    loadSprite(pigSprites.rightHook);
    loadSprite(pigSprites.crouch);
    loadSprite(pigSprites.crouchLeftPunch);
    loadSprite(pigSprites.crouchRightPunch);
    loadSprite(pigSprites.jumpLeftPunch);
    loadSprite(pigSprites.jumpRightPunch);
    loadSprite(wolfSprite);
    loadSprite(redHoodWolfSprite);
    loadSprite(axeWolfSprite);
    loadSprite(knifeWolfSprite);
    loadSprite(heartSprite);
    loadSprite(starSprite);
  }

  function loadSprite(sprite) {
    const image = new Image();
    image.onload = () => {
      sprite.image = image;
      sprite.ready = true;
    };
    image.src = sprite.source.path;
  }

  function makeTransparentPigCanvas(image) {
    const { x, y, width, height } = PIG_SOURCE.crop;
    const spriteCanvas = document.createElement("canvas");
    const spriteCtx = spriteCanvas.getContext("2d", { willReadFrequently: true });
    spriteCanvas.width = width;
    spriteCanvas.height = height;
    spriteCtx.imageSmoothingEnabled = false;
    spriteCtx.drawImage(image, x, y, width, height, 0, 0, width, height);

    const imageData = spriteCtx.getImageData(0, 0, width, height);
    const data = imageData.data;
    const visited = new Uint8Array(width * height);
    const stack = [];
    const bg = sampleBackground(data, width);

    for (let px = 0; px < width; px += 1) {
      stack.push(px, (height - 1) * width + px);
    }
    for (let py = 1; py < height - 1; py += 1) {
      stack.push(py * width, py * width + width - 1);
    }

    while (stack.length) {
      const index = stack.pop();
      if (visited[index]) {
        continue;
      }
      visited[index] = 1;
      const offset = index * 4;
      if (!isBackgroundLike(data, offset, bg)) {
        continue;
      }

      data[offset + 3] = 0;
      const px = index % width;
      const py = Math.floor(index / width);
      if (px > 0) stack.push(index - 1);
      if (px < width - 1) stack.push(index + 1);
      if (py > 0) stack.push(index - width);
      if (py < height - 1) stack.push(index + width);
    }

    spriteCtx.putImageData(imageData, 0, 0);
    return spriteCanvas;
  }

  function sampleBackground(data, width) {
    const samples = [0, width - 1];
    let r = 0;
    let g = 0;
    let b = 0;
    for (const sample of samples) {
      const offset = sample * 4;
      r += data[offset];
      g += data[offset + 1];
      b += data[offset + 2];
    }
    return { r: r / samples.length, g: g / samples.length, b: b / samples.length };
  }

  function isBackgroundLike(data, offset, bg) {
    const dr = data[offset] - bg.r;
    const dg = data[offset + 1] - bg.g;
    const db = data[offset + 2] - bg.b;
    return Math.sqrt(dr * dr + dg * dg + db * db) < 72;
  }

  const ACTIONS = {
    idle: { label: "站立待机", duration: 0 },
    punchLeft: { label: "向左打拳", duration: 620, side: -1 },
    punchRight: { label: "向右打拳", duration: 620, side: 1 },
    crouch: { label: "蹲下", duration: 0 },
    jump: { label: "向上跳", duration: 520 },
    jumpPunchLeft: { label: "跳起向左打", duration: 700, side: -1, jump: true },
    jumpPunchRight: { label: "跳起向右打", duration: 700, side: 1, jump: true },
    crouchPunchLeft: { label: "蹲下起身左拳", duration: 620, side: -1, crouch: true },
    crouchPunchRight: { label: "蹲下起身右拳", duration: 620, side: 1, crouch: true },
  };

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
    state.width = window.innerWidth;
    state.height = window.innerHeight;
    state.dpr = dpr;
    canvas.width = Math.round(state.width * dpr);
    canvas.height = Math.round(state.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    state.player.x = state.width * 0.5;
    state.player.groundY = state.height * FLOOR_Y;
    state.player.y = state.player.groundY;
  }

  function difficultyLevel() {
    return Math.min(1, state.time / DIFFICULTY_RAMP_MS);
  }

  function enemySpeedMultiplier() {
    return 1 + difficultyLevel() * 0.85;
  }

  function nextEnemyDelay() {
    const level = difficultyLevel();
    return 1800 - level * 800 + Math.random() * (2200 - level * 1100);
  }

  function scheduleNextEnemy(delay = nextEnemyDelay()) {
    state.nextEnemyAt = state.time + delay;
  }

  function activeEnemies() {
    return state.enemies.filter((enemy) => !enemy.dead);
  }

  function chooseEnemySprite() {
    const hasKnifeWolf = activeEnemies().some((enemy) => enemy.sprite.source.movement === "bouncer");
    const availableSprites = hasKnifeWolf
      ? enemySprites.filter((sprite) => sprite.source.movement !== "bouncer")
      : enemySprites;
    const totalWeight = availableSprites.reduce((sum, sprite) => sum + sprite.source.weight, 0);
    let roll = Math.random() * totalWeight;
    for (const sprite of availableSprites) {
      roll -= sprite.source.weight;
      if (roll <= 0) {
        return sprite;
      }
    }
    return wolfSprite;
  }

  function spawnEnemy(side) {
    if (activeEnemies().length >= MAX_ENEMIES) {
      return null;
    }
    const sprite = chooseEnemySprite();
    const height = sprite.source.height;
    const width = height * (sprite.image ? sprite.image.width / sprite.image.height : 1.13);
    const enemy = {
      x: side < 0 ? -width * 0.65 : state.width + width * 0.65,
      y: state.player.groundY + 8 + Math.random() * 18,
      sprite,
      side,
      direction: side < 0 ? 1 : -1,
      speed: 185 + Math.random() * 55,
      height,
      hits: 0,
      hopSeed: Math.random() * Math.PI * 2,
      bobSeed: Math.random() * Math.PI * 2,
      attacking: false,
      attackSeed: Math.random() * Math.PI * 2,
      knockedUntil: 0,
      knockStartedAt: 0,
      knockFromX: 0,
      knockToX: 0,
      lastHitAt: -1,
      dead: false,
    };
    state.enemies.push(enemy);
    return enemy;
  }

  function spawnEnemyWave() {
    const enemies = activeEnemies();
    if (enemies.length === 0) {
      spawnEnemy(Math.random() < 0.5 ? -1 : 1);
    } else if (enemies.length === 1 && Math.random() < 0.18) {
      spawnEnemy(enemies[0].side * -1);
    }
    scheduleNextEnemy();
  }

  function startAction(type) {
    const def = ACTIONS[type] || ACTIONS.idle;
    state.action = {
      type,
      label: def.label,
      duration: def.duration,
      startedAt: state.time,
      side: def.side || 0,
    };
    if (def.side) {
      state.player.facing = def.side;
    }
    if (type === "jump" || type === "crouch") {
      state.lastPrepAction = { type, at: state.time };
    }
    pushLog(def.label);
    if (moveName) {
      moveName.textContent = def.label;
    }
  }

  function pushLog(text) {
    if (!comboLog) {
      return;
    }
    state.inputHistory.unshift(text);
    state.inputHistory = state.inputHistory.slice(0, 5);
    comboLog.innerHTML = state.inputHistory.map((item) => `<li>${item}</li>`).join("");
  }

  function makePunchEffect(side) {
    state.effects.push({
      x: state.player.x + side * 72,
      y: state.player.y - 78,
      side,
      life: 0.18,
      maxLife: 0.18,
    });
  }

  function actionProgress() {
    if (!state.action || state.action.duration === 0) {
      return 0;
    }
    return Math.min(1, (state.time - state.action.startedAt) / state.action.duration);
  }

  function chainFrom(side) {
    if (state.action?.type === "crouch") {
      state.lastPrepAction = null;
      return side < 0 ? "crouchPunchLeft" : "crouchPunchRight";
    }
    const age = state.lastPrepAction ? state.time - state.lastPrepAction.at : Infinity;
    const prepType = age <= INPUT_CHAIN_WINDOW ? state.lastPrepAction.type : null;
    if (prepType === "jump") {
      state.lastPrepAction = null;
      return side < 0 ? "jumpPunchLeft" : "jumpPunchRight";
    }
    if (prepType === "crouch") {
      state.lastPrepAction = null;
      return side < 0 ? "crouchPunchLeft" : "crouchPunchRight";
    }
    state.lastPrepAction = null;
    return side < 0 ? "punchLeft" : "punchRight";
  }

  function handleKeyDown(event) {
    const keyAliases = {
      Up: "ArrowUp",
      Down: "ArrowDown",
      Left: "ArrowLeft",
      Right: "ArrowRight",
    };
    const key = keyAliases[event.key] || event.key;
    if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(key)) {
      return;
    }
    event.preventDefault();
    if (state.gameOver) {
      if (key === " ") {
        restartGame();
      }
      return;
    }
    if (key === "ArrowUp") {
      startAction("jump");
    } else if (key === "ArrowDown") {
      startAction(state.action?.type === "crouch" ? "idle" : "crouch");
    } else if (key === "ArrowLeft") {
      startAction(chainFrom(-1));
    } else if (key === "ArrowRight") {
      startAction(chainFrom(1));
    }
  }

  function restartGame() {
    state.time = 0;
    state.lastTime = performance.now();
    state.health = MAX_HEALTH;
    state.defeatedWolves = 0;
    state.lastDamageAt = -Infinity;
    state.enemies = [];
    state.effects = [];
    state.action = null;
    state.lastPrepAction = null;
    state.gameOver = false;
    scheduleNextEnemy(900);
    startAction("idle");
  }

  function update(dt) {
    state.time += dt * 1000;
    if (state.gameOver) {
      return;
    }
    const player = state.player;
    player.step += dt;
    player.squash = 0;
    player.punchSide = 0;
    player.y = player.groundY;

    if (!state.action) {
      startAction("idle");
    }

    const progress = actionProgress();
    const type = state.action.type;

    if (type === "jump" || type.startsWith("jumpPunch")) {
      const lift = Math.sin(progress * Math.PI) * Math.min(180, state.height * 0.22);
      player.y = player.groundY - lift;
    }

    if (type === "crouch" || type.startsWith("crouchPunch")) {
      const crouchCurve = type === "crouch"
        ? 1
        : Math.sin(Math.min(1, progress * 1.45) * Math.PI);
      player.squash = Math.max(0, crouchCurve);
    }

    if (type.includes("Punch") || type.startsWith("punch")) {
      const punchCurve = Math.sin(Math.min(1, progress * 1.4) * Math.PI);
      player.punchSide = state.action.side * Math.max(0, punchCurve);
    }

    if (state.action.duration > 0 && progress >= 1) {
      startAction("idle");
    }

    if (state.time >= state.nextEnemyAt) {
      spawnEnemyWave();
    }
    resolvePunchHits(progress);
    updateEnemies(dt);
    resolvePlayerDamage();

    for (const effect of state.effects) {
      effect.life -= dt;
    }
    state.effects = state.effects.filter((effect) => effect.life > 0);
  }

  function updateEnemies(dt) {
    const margin = ENEMY_WOLF_SOURCE.height * 1.2;
    for (const enemy of state.enemies) {
      if (enemy.dead) {
        continue;
      }
      const stopX = state.player.x + enemy.side * 118;
      if (state.time < enemy.knockedUntil) {
        const knockProgress = Math.min(1, (state.time - enemy.knockStartedAt) / (enemy.knockedUntil - enemy.knockStartedAt));
        const arc = Math.sin(knockProgress * Math.PI);
        enemy.x = enemy.knockFromX + (enemy.knockToX - enemy.knockFromX) * knockProgress;
        enemy.y = state.player.groundY + 8 - arc * 92;
        enemy.attacking = false;
        continue;
      } else if (enemy.sprite.source.movement === "bouncer") {
        const edgePadding = 70;
        const speed = enemy.speed * enemySpeedMultiplier() * 1.1;
        enemy.x += enemy.direction * speed * dt;
        if (enemy.x < edgePadding) {
          enemy.x = edgePadding;
          enemy.direction = 1;
        } else if (enemy.x > state.width - edgePadding) {
          enemy.x = state.width - edgePadding;
          enemy.direction = -1;
        }
        enemy.side = enemy.x < state.player.x ? -1 : 1;
        enemy.attacking = false;
        enemy.y = state.player.groundY - 46 - Math.abs(Math.sin(state.time * 0.01 + enemy.hopSeed)) * 54;
        continue;
      } else if (!enemy.attacking) {
        enemy.side = enemy.x < state.player.x ? -1 : 1;
        enemy.direction = enemy.side < 0 ? 1 : -1;
        enemy.x += enemy.direction * enemy.speed * enemySpeedMultiplier() * dt;
        if ((enemy.direction > 0 && enemy.x >= stopX) || (enemy.direction < 0 && enemy.x <= stopX)) {
          enemy.x = stopX;
          enemy.attacking = true;
        }
      } else {
        const slash = Math.sin(state.time * (Math.PI * 2 / 1000) + enemy.attackSeed);
        enemy.x = stopX - enemy.side * Math.max(0, slash) * 18;
      }
      enemy.y = state.player.groundY + 8 + Math.sin(state.time * 0.006 + enemy.bobSeed) * (enemy.attacking ? 6 : 4);
    }
    state.enemies = state.enemies.filter((enemy) => !enemy.dead && enemy.x > -margin && enemy.x < state.width + margin);
  }

  function resolvePlayerDamage() {
    if (state.health <= 0 || state.time - state.lastDamageAt < DAMAGE_COOLDOWN_MS) {
      return;
    }

    for (const enemy of state.enemies) {
      if (enemy.dead || state.time < enemy.knockedUntil) {
        continue;
      }

      const dx = Math.abs(enemy.x - state.player.x);
      const dy = Math.abs(enemy.y - state.player.y);
      const bouncerHit = enemy.sprite.source.movement === "bouncer" && dx < 82 && dy < 135;
      const attackHit = enemy.sprite.source.movement !== "bouncer" && enemy.attacking && dx < 145 && dy < 165;

      if (bouncerHit || attackHit) {
        damagePlayer();
        return;
      }
    }
  }

  function damagePlayer() {
    state.health = Math.max(0, state.health - 1);
    state.lastDamageAt = state.time;
    makeHitSpark(state.player.x, state.player.y - 120, state.player.facing || 1);
    if (state.health <= 0) {
      state.gameOver = true;
      state.action = null;
      state.lastPrepAction = null;
    }
  }

  function resolvePunchHits(progress) {
    if (!state.action || !(state.action.type.includes("Punch") || state.action.type.startsWith("punch"))) {
      return;
    }
    if (progress < 0.14 || progress > 0.72 || Math.abs(state.player.punchSide) < 0.32) {
      return;
    }

    const side = state.action.side;
    const punchX = state.player.x + side * 132;
    const punchY = state.player.y - 118;
    let hitEnemy = null;
    let hitDistance = Infinity;

    for (const enemy of state.enemies) {
      if (enemy.dead || state.time < enemy.knockedUntil || enemy.lastHitAt === state.action.startedAt) {
        continue;
      }
      if (enemy.sprite.source.movement === "bouncer" && !state.action.type.startsWith("jumpPunch")) {
        continue;
      }
      if (Math.sign(enemy.x - state.player.x) !== side) {
        continue;
      }
      const dx = Math.abs(enemy.x - punchX);
      const dy = Math.abs(enemy.y - punchY);
      const distance = dx + dy * 0.35;
      const hitWidth = enemy.sprite.source.movement === "bouncer" ? 185 : 126;
      const hitHeight = enemy.sprite.source.movement === "bouncer" ? 220 : 150;
      if (dx < hitWidth && dy < hitHeight && distance < hitDistance) {
        hitEnemy = enemy;
        hitDistance = distance;
      }
    }

    if (!hitEnemy) {
      return;
    }

    hitEnemy.lastHitAt = state.action.startedAt;
    hitEnemy.hits += 1;
    makeHitSpark(hitEnemy.x, hitEnemy.y - 112, side);

    if (hitEnemy.hits >= 2) {
      hitEnemy.dead = true;
      state.defeatedWolves += 1;
      return;
    }

    hitEnemy.attacking = false;
    hitEnemy.knockStartedAt = state.time;
    hitEnemy.knockedUntil = state.time + 650;
    hitEnemy.knockFromX = hitEnemy.x;
    hitEnemy.knockToX = hitEnemy.x + side * 210;
    if (activeEnemies().length < MAX_ENEMIES) {
      spawnEnemy(Math.random() < 0.5 ? -1 : 1);
    }
    scheduleNextEnemy();
  }

  function makeHitSpark(x, y, side) {
    state.effects.push({
      x,
      y,
      side,
      life: 0.2,
      maxLife: 0.2,
    });
  }

  function drawRoad() {
    const w = state.width;
    const h = state.height;
    const roadTop = h * 0.52;
    const roadBottom = h * 0.86;
    const roadMid = (roadTop + roadBottom) * 0.5;

    ctx.fillStyle = "#355e39";
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = "#2d5634";
    for (let i = -40; i < w + 80; i += 92) {
      ctx.beginPath();
      ctx.moveTo(i, roadTop);
      ctx.lineTo(i + 45, roadTop - 122);
      ctx.lineTo(i + 92, roadTop);
      ctx.closePath();
      ctx.fill();
    }

    ctx.fillStyle = "#3f6f3f";
    for (let i = -20; i < w + 80; i += 78) {
      ctx.beginPath();
      ctx.moveTo(i, roadBottom);
      ctx.lineTo(i + 38, roadBottom + 104);
      ctx.lineTo(i + 76, roadBottom);
      ctx.closePath();
      ctx.fill();
    }

    ctx.fillStyle = "#34383d";
    ctx.fillRect(0, roadTop, w, roadBottom - roadTop);

    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, roadTop + 3);
    ctx.lineTo(w, roadTop + 3);
    ctx.moveTo(0, roadBottom - 3);
    ctx.lineTo(w, roadBottom - 3);
    ctx.stroke();

    ctx.strokeStyle = "#f6d76a";
    ctx.lineWidth = 7;
    ctx.setLineDash([44, 34]);
    ctx.lineDashOffset = 0;
    ctx.beginPath();
    ctx.moveTo(0, roadMid);
    ctx.lineTo(w, roadMid);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = "rgba(0,0,0,0.08)";
    ctx.fillRect(0, roadBottom, w, 6);
  }

  function drawPig() {
    const p = state.player;
    const crouch = p.squash;
    const x = p.x;
    const y = p.y;
    const bob = Math.sin(p.step * 7) * (2 - crouch * 1.5);

    const pose = getPigPose();
    if (pose.ready) {
      const sprite = pose.image;
      const source = pose.source;
      const drawH = source.height;
      const drawW = drawH * (sprite.width / sprite.height);

      ctx.save();
      ctx.translate(x, y + bob);
      ctx.fillStyle = "rgba(0,0,0,0.28)";
      ctx.beginPath();
      ctx.ellipse(0, 8, 62 + crouch * 18, 13, 0, 0, Math.PI * 2);
      ctx.fill();

      const squash = source.keepShape ? 0 : crouch;
      ctx.scale(1 + squash * 0.12, 1 - squash * 0.22);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(sprite, -drawW / 2 + source.offsetX, -drawH, drawW, drawH);
      ctx.restore();
      ctx.imageSmoothingEnabled = true;
      return;
    }

    ctx.save();
    ctx.translate(x, y + bob);

    ctx.fillStyle = "rgba(0,0,0,0.28)";
    ctx.beginPath();
    ctx.ellipse(0, 8, 66 + crouch * 18, 13, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.scale(1.18 + crouch * 0.12, 1.18 - crouch * 0.2);
    ctx.translate(0, -112);

    drawPigEar(-44, -88, -1);
    drawPigEar(44, -88, 1);

    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    ctx.fillStyle = "#f39aaa";
    ctx.strokeStyle = "#4b1717";
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(-47, -64);
    ctx.bezierCurveTo(-78, -42, -83, 12, -67, 67);
    ctx.lineTo(-56, 96);
    ctx.lineTo(-25, 96);
    ctx.lineTo(-22, 72);
    ctx.bezierCurveTo(-12, 76, 12, 76, 22, 72);
    ctx.lineTo(25, 96);
    ctx.lineTo(56, 96);
    ctx.lineTo(67, 67);
    ctx.bezierCurveTo(83, 12, 78, -42, 47, -64);
    ctx.bezierCurveTo(31, -78, -31, -78, -47, -64);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#e77f92";
    ctx.globalAlpha = 0.42;
    ctx.beginPath();
    ctx.moveTo(-59, -28);
    ctx.bezierCurveTo(-45, 10, -17, 31, 38, 29);
    ctx.bezierCurveTo(22, 45, -30, 43, -58, 8);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;

    drawArm(-1, crouch);
    drawArm(1, crouch);

    ctx.fillStyle = "#fff9f1";
    ctx.beginPath();
    ctx.ellipse(0, 35, 45, 39, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#f5a2af";
    ctx.strokeStyle = "#4b1717";
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.roundRect(-25, -29, 50, 28, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#9b4158";
    ctx.beginPath();
    ctx.roundRect(-12, -20, 7, 10, 1);
    ctx.roundRect(6, -20, 7, 10, 1);
    ctx.fill();

    ctx.fillStyle = "#080506";
    ctx.beginPath();
    ctx.roundRect(-36, -42, 10, 12, 1);
    ctx.roundRect(26, -42, 10, 12, 1);
    ctx.fill();

    ctx.strokeStyle = "#080506";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(-25, -5);
    ctx.lineTo(-17, 6);
    ctx.lineTo(18, 6);
    ctx.lineTo(28, -4);
    ctx.stroke();

    drawFoot(-34);
    drawFoot(34);
    ctx.restore();
  }

  function drawEnemies() {
    const sortedEnemies = [...state.enemies].sort((a, b) => a.y - b.y);

    for (const enemy of sortedEnemies) {
      if (!enemy.sprite.ready) {
        continue;
      }
      const sprite = enemy.sprite.image;
      const drawH = enemy.sprite.source.height;
      const drawW = drawH * (sprite.width / sprite.height);
      const desiredFacing = enemy.sprite.source.movement === "bouncer"
        ? Math.sign(enemy.direction) || 1
        : enemy.side < 0 ? 1 : -1;
      const shouldFlip = desiredFacing !== enemy.sprite.source.facing;
      const weaponLean = enemy.sprite.source.attackStyle === "weapon" && enemy.attacking
        ? Math.sin(state.time * (Math.PI * 2 / 1000) + enemy.attackSeed) * enemy.sprite.source.swingAmount
        : 0;
      ctx.save();
      ctx.translate(enemy.x, enemy.y);
      ctx.fillStyle = "rgba(0,0,0,0.24)";
      ctx.beginPath();
      ctx.ellipse(0, 8, drawW * 0.32, 11, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.rotate(desiredFacing * weaponLean);
      ctx.scale(shouldFlip ? -1 : 1, 1);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(sprite, -drawW / 2, -drawH, drawW, drawH);
      if (enemy.sprite.source.attackStyle === "basket" && enemy.attacking) {
        drawRotatingBasket(enemy, sprite, drawW, drawH);
      }
      ctx.restore();
      ctx.imageSmoothingEnabled = true;
    }
  }

  function drawRotatingBasket(enemy, sprite, drawW, drawH) {
    const basket = enemy.sprite.source.basket;
    const scale = drawH / sprite.height;
    const basketW = basket.width * scale;
    const basketH = basket.height * scale;
    const basketX = -drawW / 2 + (basket.x + basket.width / 2) * scale;
    const basketY = -drawH + (basket.y + basket.height / 2) * scale;
    const spin = state.time * (Math.PI * 2 / 1000) + enemy.attackSeed;

    ctx.save();
    ctx.translate(basketX, basketY);
    ctx.rotate(spin);
    ctx.drawImage(
      sprite,
      basket.x,
      basket.y,
      basket.width,
      basket.height,
      -basketW / 2,
      -basketH / 2,
      basketW,
      basketH,
    );
    ctx.restore();
  }

  function getPigPose() {
    if (state.action?.type === "crouchPunchLeft" && pigSprites.crouchLeftPunch.ready) {
      return pigSprites.crouchLeftPunch;
    }
    if (state.action?.type === "crouchPunchRight" && pigSprites.crouchRightPunch.ready) {
      return pigSprites.crouchRightPunch;
    }
    if (state.action?.type === "jumpPunchLeft" && pigSprites.jumpLeftPunch.ready) {
      return pigSprites.jumpLeftPunch;
    }
    if (state.action?.type === "jumpPunchRight" && pigSprites.jumpRightPunch.ready) {
      return pigSprites.jumpRightPunch;
    }
    if (state.action?.type?.endsWith("Left") && pigSprites.leftHook.ready) {
      return pigSprites.leftHook;
    }
    if (state.action?.type?.endsWith("Right") && pigSprites.rightHook.ready) {
      return pigSprites.rightHook;
    }
    if (state.action?.type === "crouch" && pigSprites.crouch.ready) {
      return pigSprites.crouch;
    }
    return pigSprites.stand;
  }

  function drawArm(side, crouch) {
    const active = Math.max(0, state.player.punchSide * side);
    const shoulderX = side * 56;
    const shoulderY = 2 + crouch * 8;
    const elbowX = shoulderX + side * (18 + active * 26);
    const elbowY = shoulderY + 39 - active * 18;
    const fistX = shoulderX + side * (33 + active * 54);
    const fistY = shoulderY + 55 - active * 24;

    ctx.strokeStyle = "#4b1717";
    ctx.lineWidth = 24;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(shoulderX, shoulderY);
    ctx.quadraticCurveTo(elbowX, elbowY, fistX, fistY);
    ctx.stroke();

    ctx.strokeStyle = "#ee94a5";
    ctx.lineWidth = 17;
    ctx.beginPath();
    ctx.moveTo(shoulderX, shoulderY);
    ctx.quadraticCurveTo(elbowX, elbowY, fistX, fistY);
    ctx.stroke();

    ctx.fillStyle = "#7a4b25";
    ctx.strokeStyle = "#4b1717";
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.roundRect(fistX - 16, fistY - 11, 30, 24, 4);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = "#4b1717";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(fistX - side * 3, fistY + 12);
    ctx.lineTo(fistX - side * 3, fistY + 3);
    ctx.stroke();
  }

  function drawPigEar(x, y, side) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(side, 1);
    ctx.rotate(-0.24);
    ctx.fillStyle = "#f6a8b5";
    ctx.strokeStyle = "#4b1717";
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(37, 8);
    ctx.lineTo(44, 74);
    ctx.lineTo(15, 82);
    ctx.lineTo(-4, 38);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = "#d9788b";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(16, 14);
    ctx.lineTo(29, 60);
    ctx.stroke();
    ctx.restore();
  }

  function drawFoot(x) {
    ctx.fillStyle = "#7a4b25";
    ctx.strokeStyle = "#4b1717";
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.roundRect(x - 17, 91, 34, 24, 4);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = "#4b1717";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(x, 115);
    ctx.lineTo(x, 106);
    ctx.stroke();
  }

  function roundEllipse(x, y, rx, ry) {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  }

  function drawEffects() {
    for (const effect of state.effects) {
      const t = 1 - effect.life / effect.maxLife;
      ctx.save();
      ctx.translate(effect.x, effect.y);
      ctx.scale(effect.side, 1);
      ctx.strokeStyle = `rgba(255, 239, 178, ${1 - t})`;
      ctx.lineWidth = 9 - t * 4;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.arc(0, 0, 22 + t * 38, -0.8, 0.85);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawHud() {
    drawHealthHud();
    drawScoreHud();
  }

  function drawHealthHud() {
    const size = HEART_SOURCE.size;
    const gap = 5;
    const startX = 14;
    const startY = 14;
    const health = Math.max(0, Math.min(MAX_HEALTH, state.health));

    ctx.save();
    ctx.imageSmoothingEnabled = false;
    for (let i = 0; i < MAX_HEALTH; i += 1) {
      const x = startX + i * (size + gap);
      const filled = i < health;
      if (heartSprite.ready) {
        ctx.save();
        ctx.filter = filled ? "none" : "brightness(0)";
        ctx.drawImage(heartSprite.image, x, startY, size, size);
        ctx.restore();
      } else {
        drawFallbackHeart(x + size / 2, startY + size / 2, size, filled);
      }
    }
    ctx.restore();
    ctx.imageSmoothingEnabled = true;
  }

  function drawScoreHud() {
    const size = STAR_SOURCE.size;
    const gap = 7;
    const score = Math.floor(state.defeatedWolves / 2);
    const text = `×${score}`;

    ctx.save();
    ctx.font = "700 20px Arial, sans-serif";
    const textWidth = ctx.measureText(text).width;
    const x = state.width - 16 - size - gap - textWidth;
    const y = 13;

    ctx.imageSmoothingEnabled = false;
    if (starSprite.ready) {
      ctx.drawImage(starSprite.image, x, y, size, size);
    } else {
      drawFallbackStar(x + size / 2, y + size / 2, size);
    }
    ctx.imageSmoothingEnabled = true;

    ctx.textBaseline = "middle";
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "rgba(0, 0, 0, 0.75)";
    ctx.lineWidth = 4;
    ctx.strokeText(text, x + size + gap, y + size / 2 + 1);
    ctx.fillText(text, x + size + gap, y + size / 2 + 1);
    ctx.restore();
  }

  function drawFallbackStar(x, y, size) {
    const outer = size / 2;
    const inner = outer * 0.48;

    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = "#ffd43b";
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < 10; i += 1) {
      const angle = -Math.PI / 2 + i * Math.PI / 5;
      const radius = i % 2 === 0 ? outer : inner;
      const px = Math.cos(angle) * radius;
      const py = Math.sin(angle) * radius;
      if (i === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  function drawFallbackHeart(x, y, size, filled = true) {
    const scale = size / 24;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.fillStyle = filled ? "#ef2636" : "#050505";
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 9);
    ctx.lineTo(-11, -2);
    ctx.bezierCurveTo(-18, -10, -7, -18, 0, -8);
    ctx.bezierCurveTo(7, -18, 18, -10, 11, -2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  function drawGameOver() {
    if (!state.gameOver) {
      return;
    }

    ctx.save();
    ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
    ctx.fillRect(0, 0, state.width, state.height);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#250000";
    ctx.lineWidth = 8;
    ctx.font = "700 56px Arial, sans-serif";
    ctx.strokeText("GAME OVER", state.width / 2, state.height / 2 - 24);
    ctx.fillText("GAME OVER", state.width / 2, state.height / 2 - 24);
    ctx.font = "700 22px Arial, sans-serif";
    ctx.fillStyle = "#ffe66d";
    ctx.fillText("按空格重新开始", state.width / 2, state.height / 2 + 38);
    ctx.restore();
  }

  function render() {
    ctx.clearRect(0, 0, state.width, state.height);
    drawRoad();
    drawEffects();
    drawEnemies();
    drawPig();
    drawHud();
    drawGameOver();
  }

  function frame(now) {
    const dt = Math.min(0.033, (now - state.lastTime) / 1000 || 0);
    state.lastTime = now;
    update(dt);
    render();
    requestAnimationFrame(frame);
  }

  window.addEventListener("resize", resize);
  window.addEventListener("keydown", handleKeyDown, { passive: false });

  loadPigSprite();
  resize();
  startAction("idle");
  requestAnimationFrame(frame);
})();
