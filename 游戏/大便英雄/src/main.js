const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");

const ui = {
  scoreText: document.querySelector("#score-text"),
  comboText: document.querySelector("#combo-text"),
  cleanText: document.querySelector("#clean-text"),
  actionList: document.querySelector("#action-list"),
  startOverlay: document.querySelector("#start-overlay"),
  startButton: document.querySelector("#start-button"),
  targetInput: document.querySelector("#target-input"),
  toast: document.querySelector("#toast"),
};

const WORLD = { width: 1280, height: 720 };
const DPR_CAP = 2;

const actions = [
  { key: "1", hotkey: "1", name: "空翻屎", style: "flip", color: "#8d5524", score: 35, clean: 1 },
  { key: "2", hotkey: "2", name: "躺屎", style: "lay", color: "#9f6327", score: 45, clean: 1 },
  { key: "3", hotkey: "3", name: "命中屎", style: "aim", color: "#7e4d22", score: 55, clean: 1 },
  { key: "4", hotkey: "4", name: "巨屎", style: "giant", color: "#a8682e", score: 75, clean: 2 },
  { key: "5", hotkey: "5", name: "屁冲天撞", style: "fart", color: "#8d5524", score: 90, clean: 2 },
  { key: "6", hotkey: "6", name: "上头干屎", style: "headHard", color: "#a95f28", score: 105, clean: 2 },
  { key: "7", hotkey: "7", name: "屎雷", style: "mine", color: "#b56c2d", score: 120, clean: 2 },
  { key: "8", hotkey: "8", name: "大便枪", style: "gun", color: "#7c4a21", score: 140, clean: 2 },
  { key: "9", hotkey: "9", name: "弹力屎", style: "elastic", color: "#8d5524", score: 155, clean: 2 },
  { key: "10", hotkey: "0", name: "连环屎", style: "chain", color: "#9b5d26", score: 190, clean: 3 },
  { key: "12", hotkey: "-", name: "终极大招", style: "ultimate", color: "#5a3b20", score: 280, clean: 100 },
];

let state = createState();
let lastTime = 0;
let toastTimer = 0;

function createState() {
  return {
    mode: "menu",
    time: 0,
    score: 0,
    combo: 0,
    comboTimer: 0,
    clean: 100,
    targetName: "倒霉布偶",
    hero: { x: 260, y: 438, pose: "idle", poseTimer: 0, victoryLocked: false },
    target: {
      x: 860,
      y: 392,
      vx: 0,
      vy: 0,
      rotation: 0,
      angularVelocity: 0,
      landed: false,
      ropeBroken: false,
      wobble: 0,
      hitTimer: 0,
      emotion: "normal",
    },
    ko: { pending: false, active: false, timer: 0, landedAt: 0, pileX: 860, pileY: 540 },
    ultimate: { active: false, phase: "idle", timer: 0, stepIndex: 0, stepTimer: 0 },
    projectiles: [],
    splats: [],
    poopTrail: [],
    particles: [],
    floatTexts: [],
    screenShake: 0,
  };
}

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
  canvas.width = Math.floor(window.innerWidth * dpr);
  canvas.height = Math.floor(window.innerHeight * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function worldScale() {
  return Math.max(window.innerWidth / WORLD.width, window.innerHeight / WORLD.height);
}

function withWorld(callback) {
  const scale = worldScale();
  const width = window.innerWidth / scale;
  const height = window.innerHeight / scale;
  const offsetX = (width - WORLD.width) * 0.5;
  const offsetY = (height - WORLD.height) * 0.5;

  ctx.save();
  ctx.scale(scale, scale);
  ctx.translate(offsetX, offsetY);
  if (state.screenShake > 0) {
    ctx.translate(rand(-state.screenShake, state.screenShake), rand(-state.screenShake, state.screenShake));
  }
  callback();
  ctx.restore();
}

function setupActionButtons() {
  ui.actionList.innerHTML = "";
  actions.forEach((action, index) => {
    const button = document.createElement("button");
    button.className = "action-button";
    button.type = "button";
    button.dataset.action = action.key;
    button.innerHTML = `<b>${action.key}</b><span>${action.name}</span><small>${action.hotkey || "点击"}</small>`;
    button.addEventListener("click", () => triggerAction(action));
    ui.actionList.append(button);
  });
}

function startGame() {
  state = createState();
  const name = ui.targetInput.value.trim();
  state.targetName = name || "倒霉布偶";
  state.mode = "playing";
  ui.startOverlay.classList.remove("overlay--active");
  showToast("点击右侧按钮整蛊");
  lastTime = performance.now();
}

function resetGame() {
  ui.startOverlay.classList.add("overlay--active");
  state = createState();
}

function triggerAction(action) {
  if (state.mode !== "playing" || state.ko.pending || state.ko.active || state.ultimate.active) return;

  if (action.style === "ultimate") {
    startUltimateSequence(action);
    return;
  }

  playAction(action);
}

function playAction(action, options = {}) {
  state.hero.pose = action.style;
  state.hero.poseTimer = 0.5;
  state.target.emotion = "worried";
  state.combo += 1;
  state.comboTimer = 2.2;
  state.score += action.score + Math.min(400, state.combo * 12);
  state.clean = clamp(state.clean - action.clean, 0, 100);
  state.screenShake = Math.max(state.screenShake, 7);
  showToast(`${action.name}！连击 x${state.combo}`);

  spawnActionProjectiles(action);
  addFloatText(state.target.x, state.target.y - 170, `+${action.score}`, "#172322");

  if (state.clean <= 0 && !options.fromUltimate) {
    requestKoSequence();
  }
}

function startUltimateSequence(action) {
  state.ultimate.active = true;
  state.ultimate.phase = "skills";
  state.ultimate.timer = 0;
  state.ultimate.stepIndex = 0;
  state.ultimate.stepTimer = 0.12;
  state.hero.pose = "ultimate";
  state.hero.poseTimer = 999;
  state.target.emotion = "worried";
  state.combo += 1;
  state.comboTimer = 999;
  state.score += action.score + Math.min(400, state.combo * 12);
  state.screenShake = Math.max(state.screenShake, 12);
  showToast("终极大招：全技能连发！");
  addFloatText(state.hero.x + 100, state.hero.y - 230, "终极连招", "#e85c69");
}

function requestKoSequence() {
  if (state.ko.pending || state.ko.active) return;

  state.clean = 0;
  state.ko.pending = true;
  state.target.emotion = "worried";
  showToast("破防中！");
}

function startKoSequence() {
  if (state.ko.active) return;

  state.clean = 0;
  state.ko.pending = false;
  state.ko.active = true;
  state.ko.timer = 0;
  state.ko.landedAt = 0;
  state.ko.pileX = state.target.x + 6;
  state.ko.pileY = 540;
  state.target.emotion = "defeated";
  state.target.ropeBroken = true;
  state.target.vx = rand(-40, 28);
  state.target.vy = -72;
  state.target.angularVelocity = rand(-1.8, -1.1);
  showToast("绳子断了！");

  addFloatText(state.target.x, state.target.y - 180, "绳子断了！", "#e85c69");
  addParticles(state.target.x, 122, "#8d6a43", 18);
}

function spawnActionProjectiles(action) {
  const from = { x: state.hero.x + 52, y: state.hero.y - 96 };
  const target = { x: state.target.x, y: state.target.y - 70 };
  const addProjectile = (options) => {
    const start = options.start || from;
    const end = options.end || target;
    state.projectiles.push({
      style: action.style,
      shape: options.shape || action.style,
      motion: options.motion || "arc",
      impact: options.impact || action.style,
      color: options.color || action.color,
      x: start.x,
      y: start.y,
      sx: start.x,
      sy: start.y,
      ex: end.x,
      ey: end.y,
      cx: options.cx ?? (start.x + end.x) / 2 + rand(-70, 70),
      cy: options.cy ?? Math.min(start.y, end.y) - 150,
      t: 0,
      delay: options.delay || 0,
      duration: options.duration || 0.7,
      radius: options.radius || 14,
      spin: rand(0, Math.PI * 2),
      spinSpeed: options.spinSpeed ?? 10,
      bounces: options.bounces || 3,
      done: false,
    });
  };

  if (action.style === "flip") {
    for (let i = 0; i < 3; i += 1) {
      addProjectile({
        shape: "flip",
        start: { x: from.x, y: from.y + i * 8 },
        end: { x: target.x + rand(-30, 30), y: target.y + rand(-102, -28) },
        cy: 138 - i * 24,
        duration: 0.58 + i * 0.08,
        delay: i * 0.05,
        radius: 14,
        spinSpeed: 26,
      });
    }
    return;
  }

  if (action.style === "lay") {
    addProjectile({
      shape: "lay",
      motion: "slide",
      start: { x: from.x - 12, y: 578 },
      end: { x: target.x - 10, y: target.y + 94 },
      duration: 0.68,
      radius: 24,
      spinSpeed: 1.4,
    });
    return;
  }

  if (action.style === "aim") {
    addProjectile({
      shape: "aim",
      motion: "line",
      start: { x: from.x + 12, y: from.y - 4 },
      end: { x: target.x + 2, y: target.y - 76 },
      duration: 0.26,
      radius: 13,
      spinSpeed: 18,
    });
    addFloatText(target.x, target.y - 132, "锁定", "#e85c69");
    return;
  }

  if (action.style === "giant") {
    addProjectile({
      shape: "giant",
      start: { x: from.x + 4, y: from.y - 18 },
      end: { x: target.x - 16, y: target.y - 24 },
      cy: -22,
      duration: 0.92,
      radius: 54,
      spinSpeed: 5,
    });
    return;
  }

  if (action.style === "fart") {
    for (let i = 0; i < 18; i += 1) addParticles(state.hero.x - 78, state.hero.y - 56, "#aee8c2", 1);
    addProjectile({
      shape: "fart",
      motion: "line",
      start: { x: from.x - 18, y: from.y + 44 },
      end: { x: target.x - 18, y: target.y - 12 },
      duration: 0.42,
      radius: 23,
      spinSpeed: 18,
    });
    return;
  }

  if (action.style === "headHard") {
    addProjectile({
      shape: "hard",
      motion: "drop",
      start: { x: target.x - 8, y: -62 },
      end: { x: target.x - 6, y: target.y - 116 },
      duration: 0.5,
      radius: 22,
      spinSpeed: 6,
    });
    return;
  }

  if (action.style === "mine") {
    for (let i = 0; i < 3; i += 1) {
      addProjectile({
        shape: "mine",
        motion: "drop",
        start: { x: target.x + rand(-120, 82), y: -58 - i * 54 },
        end: { x: target.x + rand(-56, 40), y: target.y + rand(-98, 12) },
        delay: i * 0.12,
        duration: 0.48,
        radius: 19,
        spinSpeed: 9,
      });
    }
    return;
  }

  if (action.style === "gun") {
    for (let i = 0; i < 8; i += 1) {
      addProjectile({
        shape: "bullet",
        motion: "line",
        start: { x: from.x + 12, y: from.y - 18 + i * 9 },
        end: { x: target.x + rand(-42, 36), y: target.y + rand(-108, 16) },
        delay: i * 0.045,
        duration: 0.23,
        radius: 8,
        spinSpeed: 24,
      });
    }
    return;
  }

  if (action.style === "elastic") {
    addProjectile({
      shape: "elastic",
      motion: "bounce",
      start: { x: from.x, y: from.y + 20 },
      end: { x: target.x - 18, y: target.y + 70 },
      duration: 0.95,
      radius: 17,
      spinSpeed: 20,
      bounces: 4,
    });
    return;
  }

  if (action.style === "chain") {
    for (let i = 0; i < 10; i += 1) {
      addProjectile({
        shape: "chain",
        start: { x: from.x + rand(-8, 8), y: from.y + rand(-28, 30) },
        end: { x: target.x + rand(-58, 42), y: target.y + rand(-130, 34) },
        cy: rand(70, 230),
        delay: i * 0.08,
        duration: 0.45,
        radius: rand(10, 17),
        spinSpeed: 16,
      });
    }
    return;
  }

  for (let i = 0; i < 34; i += 1) {
    addProjectile({
      shape: "ultimate",
      motion: i % 3 === 0 ? "bounce" : "line",
      start: { x: from.x + rand(-12, 20), y: from.y + rand(-46, 52) },
      end: { x: target.x + rand(-74, 54), y: target.y + rand(-150, 60) },
      delay: i * 0.045,
      duration: rand(0.25, 0.48),
      radius: rand(10, 24),
      spinSpeed: 26,
      bounces: 2,
    });
  }
}

function addSplat(x, y, color, size) {
  state.splats.push({
    x,
    y,
    color,
    size,
    rotation: rand(0, Math.PI * 2),
    drips: Array.from({ length: 4 }, () => ({ x: rand(-18, 18), y: rand(12, 44), length: rand(18, 56) })),
  });
  if (state.splats.length > 26) state.splats.shift();
}

function addParticles(x, y, color, count) {
  for (let i = 0; i < count; i += 1) {
    const angle = rand(0, Math.PI * 2);
    const speed = rand(60, 240);
    state.particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: rand(3, 8),
      color,
      life: rand(0.35, 0.7),
      maxLife: 0.7,
    });
  }
}

function addPoopTrail(x, y, vx, vy, radius = 12) {
  state.poopTrail.push({
    x,
    y,
    vx,
    vy,
    radius: rand(radius * 0.72, radius * 1.18),
    spin: rand(0, Math.PI * 2),
    spinSpeed: rand(-7, 7),
    color: "#8d5524",
    life: rand(0.65, 1.05),
    maxLife: 1.05,
  });

  if (state.poopTrail.length > 90) state.poopTrail.shift();
}

function addFloatText(x, y, text, color) {
  state.floatTexts.push({ x, y, text, color, life: 0.9 });
}

function showToast(text) {
  ui.toast.textContent = text;
  ui.toast.classList.add("toast--active");
  toastTimer = 1.35;
}

function update(dt) {
  state.time += dt;
  state.screenShake = Math.max(0, state.screenShake - dt * 48);
  if (!state.hero.victoryLocked) state.hero.poseTimer = Math.max(0, state.hero.poseTimer - dt);
  state.target.hitTimer = Math.max(0, state.target.hitTimer - dt);
  state.target.wobble *= 0.9;

  updateUltimateSequence(dt);
  updateKoSequence(dt);

  if (state.hero.poseTimer <= 0 && !state.hero.victoryLocked) state.hero.pose = "idle";
  if (state.comboTimer > 0) {
    state.comboTimer -= dt;
  } else {
    state.combo = 0;
  }

  for (const projectile of state.projectiles) {
    if (projectile.delay > 0) {
      projectile.delay -= dt;
      continue;
    }

    projectile.t += dt / projectile.duration;
    const t = clamp(projectile.t, 0, 1);
    const inv = 1 - t;
    if (projectile.motion === "line") {
      projectile.x = projectile.sx + (projectile.ex - projectile.sx) * t;
      projectile.y = projectile.sy + (projectile.ey - projectile.sy) * t;
    } else if (projectile.motion === "slide") {
      projectile.x = projectile.sx + (projectile.ex - projectile.sx) * t;
      projectile.y = projectile.sy + (projectile.ey - projectile.sy) * t + Math.sin(t * Math.PI * 3) * 8;
    } else if (projectile.motion === "drop") {
      projectile.x = projectile.sx + Math.sin(t * Math.PI) * 24;
      projectile.y = projectile.sy + (projectile.ey - projectile.sy) * (t * t);
    } else if (projectile.motion === "bounce") {
      projectile.x = projectile.sx + (projectile.ex - projectile.sx) * t;
      projectile.y =
        projectile.sy +
        (projectile.ey - projectile.sy) * t -
        Math.abs(Math.sin(t * Math.PI * projectile.bounces)) * 112 * (1 - t * 0.25);
    } else {
      projectile.x = inv * inv * projectile.sx + 2 * inv * t * projectile.cx + t * t * projectile.ex;
      projectile.y = inv * inv * projectile.sy + 2 * inv * t * projectile.cy + t * t * projectile.ey;
    }
    projectile.spin += dt * projectile.spinSpeed;
    if (t >= 1 && !projectile.done) {
      projectile.done = true;
      state.target.hitTimer = 0.32;
      state.target.wobble = projectile.impact === "giant" || projectile.impact === "ultimate" ? rand(-28, 28) : rand(-18, 18);
      state.target.emotion = state.clean <= 0 ? "defeated" : "hit";
      applyImpact(projectile);
    }
  }
  state.projectiles = state.projectiles.filter((projectile) => projectile.delay > 0 || projectile.t < 1.05);

  for (const particle of state.particles) {
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.vx *= 0.96;
    particle.vy += 220 * dt;
    particle.life -= dt;
  }
  state.particles = state.particles.filter((particle) => particle.life > 0);

  for (const poop of state.poopTrail) {
    poop.x += poop.vx * dt;
    poop.y += poop.vy * dt;
    poop.vx *= 0.98;
    poop.vy += 160 * dt;
    poop.spin += poop.spinSpeed * dt;
    poop.life -= dt;
  }
  state.poopTrail = state.poopTrail.filter((poop) => poop.life > 0);

  for (const text of state.floatTexts) {
    text.y -= 46 * dt;
    text.life -= dt;
  }
  state.floatTexts = state.floatTexts.filter((text) => text.life > 0);

  if (toastTimer > 0) {
    toastTimer -= dt;
    if (toastTimer <= 0) ui.toast.classList.remove("toast--active");
  }
}

function updateUltimateSequence(dt) {
  if (!state.ultimate.active) return;

  state.ultimate.timer += dt;

  if (state.ultimate.phase === "skills") {
    state.ultimate.stepTimer -= dt;
    const chain = actions.filter((action) => action.style !== "ultimate");

    if (state.ultimate.stepTimer <= 0 && state.ultimate.stepIndex < chain.length) {
      const action = chain[state.ultimate.stepIndex];
      playAction(action, { fromUltimate: true });
      state.hero.poseTimer = 0.58;
      state.ultimate.stepIndex += 1;
      state.ultimate.stepTimer = action.style === "giant" || action.style === "chain" ? 0.88 : 0.66;
    }

    const allSkillsQueued = state.ultimate.stepIndex >= chain.length;
    const projectilesDone = state.projectiles.every((projectile) => projectile.delay <= 0 && projectile.t >= 1);
    if (allSkillsQueued && projectilesDone && state.hero.poseTimer <= 0) {
      state.clean = 0;
      startKoSequence();
      state.ultimate.phase = "waitPile";
      state.ultimate.timer = 0;
      showToast("全技能结束，绳子断开！");
    }
    return;
  }

  if (state.ultimate.phase === "waitPile") {
    const pileReady = state.target.landed && state.ko.landedAt > 0 && state.ko.timer - state.ko.landedAt > 0.85;
    if (pileReady) {
      state.ultimate.phase = "chainLift";
      state.ultimate.timer = 0;
      state.hero.pose = "chainLift";
      state.hero.poseTimer = 999;
      showToast("连环屎升天！");
    }
    return;
  }

  if (state.ultimate.phase === "chainLift") {
    for (let i = 0; i < 4; i += 1) {
      addPoopTrail(state.hero.x - 34 + rand(-10, 12), state.hero.y - 42 + rand(-8, 10), rand(-40, 34), rand(170, 260), 11);
    }
    state.hero.y -= 150 * dt;
    state.hero.x += Math.sin(state.time * 8) * 18 * dt;
    state.screenShake = Math.max(state.screenShake, 4);

    if (state.ultimate.timer > 1.15 || state.hero.y < 310) {
      state.ultimate.phase = "chainFly";
      state.ultimate.timer = 0;
      state.hero.pose = "chainFly";
      showToast("连环屎推进！");
    }
    return;
  }

  if (state.ultimate.phase === "chainFly") {
    const goalX = state.ko.pileX - 78;
    const goalY = state.ko.pileY - 8;
    const dx = goalX - state.hero.x;
    const dy = goalY - state.hero.y;
    const angle = Math.atan2(dy, dx);

    for (let i = 0; i < 5; i += 1) {
      addPoopTrail(
        state.hero.x - Math.cos(angle) * 58 + rand(-10, 10),
        state.hero.y - 54 - Math.sin(angle) * 16 + rand(-10, 10),
        -Math.cos(angle) * rand(160, 260) + rand(-30, 30),
        -Math.sin(angle) * rand(160, 260) + rand(-20, 35),
        12,
      );
    }

    state.hero.x += dx * Math.min(1, dt * 1.55);
    state.hero.y += dy * Math.min(1, dt * 1.55);
    state.screenShake = Math.max(state.screenShake, 3);

    if (Math.hypot(dx, dy) < 12 || state.ultimate.timer > 3.8) {
      state.hero.x = goalX;
      state.hero.y = goalY;
      state.hero.pose = "victory";
      state.hero.victoryLocked = true;
      state.hero.poseTimer = 999;
      state.ultimate.phase = "done";
      state.ultimate.active = false;
      showToast("胜利！");
      addFloatText(state.hero.x, state.hero.y - 230, "胜利！", "#2fa6a1");
    }
  }
}

function updateKoSequence(dt) {
  if (state.ko.pending) {
    const projectilesDone = state.projectiles.every((projectile) => projectile.delay <= 0 && projectile.t >= 1);
    const heroActionDone = state.hero.poseTimer <= 0;
    if (projectilesDone && heroActionDone) startKoSequence();
    return;
  }

  if (!state.ko.active) return;

  state.ko.timer += dt;

  if (!state.target.landed) {
    state.target.vy += 520 * dt;
    state.target.x += state.target.vx * dt;
    state.target.y += state.target.vy * dt;
    state.target.rotation += state.target.angularVelocity * dt;

    if (state.target.y >= 514) {
      state.target.y = 514;
      state.target.vx = 0;
      state.target.vy = 0;
      state.target.rotation = -Math.PI / 2 + 0.12;
      state.target.angularVelocity = 0;
      state.target.landed = true;
      state.ko.landedAt = state.ko.timer;
      state.screenShake = Math.max(state.screenShake, 14);
      addParticles(state.ko.pileX, state.ko.pileY - 30, "#8d5524", 34);
      addFloatText(state.ko.pileX, state.ko.pileY - 136, "KO", "#e85c69");
    }
  }

  const landedTime = state.ko.landedAt > 0 ? state.ko.timer - state.ko.landedAt : 0;
  if (state.target.landed && landedTime > 0.85 && !state.hero.victoryLocked && !state.ultimate.active) {
    const goalX = state.ko.pileX - 78;
    const goalY = state.ko.pileY - 8;
    const dx = goalX - state.hero.x;
    const dy = goalY - state.hero.y;
    state.hero.x += dx * Math.min(1, dt * 2.05);
    state.hero.y += dy * Math.min(1, dt * 2.05);
    state.hero.pose = "fly";
    state.hero.poseTimer = 999;

    if (Math.hypot(dx, dy) < 12 || landedTime > 3.4) {
      state.hero.x = goalX;
      state.hero.y = goalY;
      state.hero.pose = "victory";
      state.hero.victoryLocked = true;
    }
  }
}

function applyImpact(projectile) {
  const sizeBoost =
    projectile.impact === "giant"
      ? 2.45
      : projectile.impact === "mine"
        ? 2
        : projectile.impact === "ultimate"
          ? 1.55
          : projectile.impact === "gun"
            ? 0.86
            : 1.25;

  addSplat(projectile.ex, projectile.ey, projectile.color, projectile.radius * sizeBoost);
  addParticles(projectile.ex, projectile.ey, projectile.color, projectile.impact === "gun" ? 7 : 16);

  if (projectile.impact === "mine") {
    addFloatText(projectile.ex, projectile.ey - 36, "BOOM", "#e85c69");
  } else if (projectile.impact === "fart") {
    for (let i = 0; i < 20; i += 1) addParticles(projectile.ex - 36, projectile.ey + 16, "#aee8c2", 1);
  } else if (projectile.impact === "headHard") {
    addFloatText(projectile.ex, projectile.ey - 38, "硬砸", "#172322");
  } else if (projectile.impact === "aim") {
    addFloatText(projectile.ex, projectile.ey - 38, "命中", "#e85c69");
  } else if (projectile.impact === "ultimate") {
    state.target.emotion = state.clean <= 0 ? "defeated" : "worried";
  }

  if (state.clean <= 0) requestKoSequence();
}

function drawBackground() {
  const sky = ctx.createLinearGradient(0, 0, 0, WORLD.height);
  sky.addColorStop(0, "#78c8e9");
  sky.addColorStop(0.58, "#c7efce");
  sky.addColorStop(1, "#70bc72");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, WORLD.width, WORLD.height);

  ctx.fillStyle = "rgba(255,255,255,0.72)";
  for (let i = 0; i < 7; i += 1) {
    const x = ((i * 220 - state.time * 18) % (WORLD.width + 260)) - 120;
    const y = 78 + (i % 3) * 48;
    drawCloud(x, y, 1 + (i % 2) * 0.2);
  }

  drawRoom();
}

function drawCloud(x, y, scale) {
  ctx.beginPath();
  ctx.ellipse(x, y, 45 * scale, 18 * scale, 0, 0, Math.PI * 2);
  ctx.ellipse(x + 34 * scale, y + 3 * scale, 32 * scale, 15 * scale, 0, 0, Math.PI * 2);
  ctx.ellipse(x - 35 * scale, y + 4 * scale, 27 * scale, 14 * scale, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawRoom() {
  ctx.fillStyle = "#63ab77";
  ctx.fillRect(0, 500, WORLD.width, 220);
  ctx.fillStyle = "#4f615f";
  ctx.fillRect(0, 594, WORLD.width, 126);
  ctx.fillStyle = "#fffdf6";
  for (let x = 70; x < WORLD.width; x += 160) {
    ctx.fillRect(x, 642, 66, 10);
  }

  ctx.fillStyle = "rgba(255,253,246,0.34)";
  ctx.fillRect(94, 360, 230, 22);
  ctx.fillRect(728, 348, 300, 22);
}

function drawHero() {
  const hero = state.hero;
  const poseY = Math.sin(state.time * 7) * 4;
  ctx.save();
  ctx.translate(hero.x, hero.y + poseY);
  if (hero.pose === "fly" || hero.pose === "chainLift" || hero.pose === "chainFly") {
    ctx.rotate(Math.sin(state.time * 9) * 0.08);
  }
  if (hero.pose === "victory") ctx.translate(0, -10 + Math.sin(state.time * 8) * 3);

  ctx.fillStyle = "#3778df";
  ctx.beginPath();
  ctx.moveTo(-22, -96);
  ctx.quadraticCurveTo(-110, -126, -134, -36);
  ctx.quadraticCurveTo(-76, -58, -28, -12);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#fffdf6";
  roundRect(-38, -102, 68, 126, 24);
  ctx.fill();
  ctx.strokeStyle = "#172322";
  ctx.lineWidth = 6;
  ctx.stroke();

  ctx.fillStyle = "#f1b844";
  ctx.beginPath();
  ctx.arc(-3, -142, 44, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#172322";
  ctx.beginPath();
  ctx.arc(-18, -150, 6, 0, Math.PI * 2);
  ctx.arc(14, -150, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(-2, -131, 19, 0.18, Math.PI - 0.18);
  ctx.stroke();

  ctx.fillStyle = "#e85c69";
  ctx.beginPath();
  ctx.moveTo(-22, -214);
  ctx.lineTo(24, -172);
  ctx.lineTo(-58, -172);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "#172322";
  ctx.lineWidth = 8;
  ctx.lineCap = "round";
  ctx.beginPath();
  if (hero.pose === "victory") {
    line(-38, -76, -78, -136);
    line(30, -76, 78, -136);
  } else if (hero.pose === "idle") {
    line(-38, -72, -70, -42);
    line(30, -72, 58, -44);
  } else {
    line(-38, -74, -66, -28);
    line(28, -74, 92, -88);
  }
  ctx.stroke();
  ctx.restore();
}

function drawTarget() {
  const target = state.target;
  const hit = target.hitTimer > 0 ? Math.sin(state.time * 50) * 7 : 0;
  const anchorX = target.ropeBroken ? state.ko.pileX - 6 : target.x;
  const anchorY = 118;
  const ropeLength = target.y - anchorY - 96;
  const swing = Math.sin(state.time * 1.9) * 0.035 + (target.wobble + hit) * 0.006;
  const pivotX = Math.sin(swing) * ropeLength;
  const pivotY = Math.cos(swing) * ropeLength;

  ctx.save();

  ctx.strokeStyle = "#5a3b20";
  ctx.lineWidth = 12;
  ctx.lineCap = "round";
  ctx.beginPath();
  line(anchorX - 112, anchorY - 16, anchorX + 112, anchorY - 16);
  ctx.stroke();

  if (target.ropeBroken) {
    ctx.strokeStyle = "#8d6a43";
    ctx.lineWidth = 6;
    ctx.beginPath();
    line(anchorX, anchorY - 16, anchorX - 14, anchorY + 46);
    line(target.x - 8, target.y - 142, target.x + 6, target.y - 104);
    ctx.stroke();

    ctx.fillStyle = "#5a3b20";
    ctx.beginPath();
    ctx.arc(anchorX, anchorY - 16, 11, 0, Math.PI * 2);
    ctx.fill();

    ctx.translate(target.x, target.y);
    ctx.rotate(target.rotation);
    drawTargetBody();
    ctx.restore();
    return;
  }

  ctx.strokeStyle = "#8d6a43";
  ctx.lineWidth = 6;
  ctx.beginPath();
  line(anchorX, anchorY - 16, anchorX + pivotX, anchorY + pivotY);
  ctx.stroke();

  ctx.fillStyle = "#5a3b20";
  ctx.beginPath();
  ctx.arc(anchorX, anchorY - 16, 11, 0, Math.PI * 2);
  ctx.fill();

  ctx.translate(anchorX + pivotX, anchorY + pivotY + 96);
  ctx.rotate(swing);

  ctx.strokeStyle = "#8d6a43";
  ctx.lineWidth = 5;
  ctx.beginPath();
  line(0, -142, 0, -118);
  ctx.stroke();

  ctx.strokeStyle = "#172322";
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.arc(0, -112, 14, 0, Math.PI * 2);
  ctx.stroke();

  drawTargetBody();
  ctx.restore();
}

function drawTargetBody() {
  const target = state.target;

  ctx.strokeStyle = "#172322";
  ctx.lineWidth = 8;
  ctx.lineCap = "round";
  ctx.beginPath();
  line(0, 4, -64, 78);
  line(0, 4, 64, 78);
  line(0, 100, -54, 178);
  line(0, 100, 54, 178);
  ctx.stroke();

  ctx.fillStyle = "#f3d6b3";
  roundRect(-52, -18, 104, 136, 28);
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(0, -70, 48, 0, Math.PI * 2);
  ctx.fillStyle = "#f6c989";
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#6b4728";
  ctx.beginPath();
  ctx.arc(-18, -82, 7, 0, Math.PI * 2);
  ctx.arc(18, -82, 7, 0, Math.PI * 2);
  ctx.fill();

  ctx.lineWidth = 5;
  ctx.beginPath();
  if (target.emotion === "defeated") {
    line(-22, -52, -8, -66);
    line(-8, -52, -22, -66);
    line(8, -52, 22, -66);
    line(22, -52, 8, -66);
  } else if (target.emotion === "worried" || target.emotion === "hit") {
    ctx.arc(0, -50, 16, Math.PI + 0.15, Math.PI * 2 - 0.15);
  } else {
    ctx.arc(0, -62, 16, 0.12, Math.PI - 0.12);
  }
  ctx.stroke();

  ctx.fillStyle = "rgba(255,253,246,0.96)";
  roundRect(-76, -178, 152, 42, 8);
  ctx.fill();
  ctx.strokeStyle = "rgba(23,35,34,0.22)";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = "#172322";
  ctx.font = "900 20px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(state.targetName, 0, -157);
}

function drawKoPile() {
  if (!state.ko.active || !state.target.landed) return;

  const pileX = state.ko.pileX;
  const pileY = state.ko.pileY;
  const landedTime = state.ko.timer - state.ko.landedAt;
  const grow = clamp(landedTime / 0.75, 0, 1);
  const squash = 0.82 + Math.sin(state.time * 5) * 0.02;

  ctx.save();
  ctx.translate(pileX, pileY);
  ctx.scale(grow, grow * squash);
  ctx.fillStyle = "rgba(23,35,34,0.22)";
  ctx.beginPath();
  ctx.ellipse(0, 80, 142, 26, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#8d5524";
  drawPoopBlob(82);
  ctx.translate(-46, 26);
  drawPoopBlob(58);
  ctx.translate(96, 8);
  drawPoopBlob(50);

  ctx.fillStyle = "rgba(255,253,246,0.3)";
  ctx.beginPath();
  ctx.arc(-88, -42, 13, 0, Math.PI * 2);
  ctx.arc(-16, -72, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawSplats() {
  for (const splat of state.splats) {
    ctx.save();
    ctx.translate(splat.x, splat.y);
    ctx.rotate(splat.rotation);
    ctx.fillStyle = splat.color;
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.arc(0, 0, splat.size, 0, Math.PI * 2);
    ctx.arc(-splat.size * 0.72, 2, splat.size * 0.48, 0, Math.PI * 2);
    ctx.arc(splat.size * 0.58, 4, splat.size * 0.42, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.5;
    for (const drip of splat.drips) {
      roundRect(drip.x, drip.y, 8, drip.length, 5);
      ctx.fill();
    }
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}

function drawProjectile(projectile) {
  if (projectile.delay > 0) return;

  ctx.save();
  ctx.translate(projectile.x, projectile.y);
  ctx.rotate(projectile.spin);
  ctx.fillStyle = projectile.color;
  if (projectile.shape === "fart") {
    roundRect(-24, -12, 48, 24, 12);
    ctx.fill();
    ctx.fillStyle = "#aee8c2";
    ctx.beginPath();
    ctx.moveTo(-24, -12);
    ctx.lineTo(-50, 0);
    ctx.lineTo(-24, 12);
    ctx.closePath();
    ctx.fill();
  } else if (projectile.shape === "lay") {
    ctx.scale(1.85, 0.62);
    drawPoopBlob(projectile.radius);
  } else if (projectile.shape === "aim") {
    drawPoopBlob(projectile.radius);
    ctx.strokeStyle = "#e85c69";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, projectile.radius + 8, 0, Math.PI * 2);
    ctx.moveTo(-projectile.radius - 14, 0);
    ctx.lineTo(projectile.radius + 14, 0);
    ctx.moveTo(0, -projectile.radius - 14);
    ctx.lineTo(0, projectile.radius + 14);
    ctx.stroke();
  } else if (projectile.shape === "giant") {
    drawPoopBlob(projectile.radius);
    ctx.fillStyle = "rgba(255,253,246,0.38)";
    ctx.beginPath();
    ctx.arc(-18, -20, 10, 0, Math.PI * 2);
    ctx.fill();
  } else if (projectile.shape === "hard") {
    drawPoopBlob(projectile.radius);
    ctx.strokeStyle = "#5a3b20";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-8, -20);
    ctx.lineTo(4, -4);
    ctx.lineTo(-3, 12);
    ctx.stroke();
  } else if (projectile.shape === "mine") {
    drawPoopBlob(projectile.radius);
    ctx.strokeStyle = "#172322";
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (let i = 0; i < 8; i += 1) {
      const a = (i / 8) * Math.PI * 2;
      ctx.moveTo(Math.cos(a) * (projectile.radius + 2), Math.sin(a) * (projectile.radius + 2));
      ctx.lineTo(Math.cos(a) * (projectile.radius + 12), Math.sin(a) * (projectile.radius + 12));
    }
    ctx.stroke();
  } else if (projectile.shape === "bullet") {
    ctx.scale(1.6, 0.82);
    drawPoopBlob(projectile.radius);
  } else if (projectile.shape === "elastic") {
    const squash = 1 + Math.sin(projectile.t * Math.PI * projectile.bounces) * 0.22;
    ctx.scale(1 / squash, squash);
    drawPoopBlob(projectile.radius);
  } else if (projectile.shape === "flip") {
    ctx.scale(1.1, 0.94);
    drawPoopBlob(projectile.radius);
  } else {
    drawPoopBlob(projectile.radius);
  }
  ctx.strokeStyle = "rgba(23,35,34,0.42)";
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.restore();
}

function drawPoopTrail() {
  for (const poop of state.poopTrail) {
    ctx.save();
    ctx.globalAlpha = clamp(poop.life / poop.maxLife, 0, 1) * 0.9;
    ctx.translate(poop.x, poop.y);
    ctx.rotate(poop.spin);
    ctx.fillStyle = poop.color;
    drawPoopBlob(poop.radius);
    ctx.strokeStyle = "rgba(23,35,34,0.28)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}

function drawPoopBlob(radius) {
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.arc(-radius * 0.58, radius * 0.35, radius * 0.56, 0, Math.PI * 2);
  ctx.arc(radius * 0.62, radius * 0.38, radius * 0.48, 0, Math.PI * 2);
  ctx.arc(radius * 0.06, -radius * 0.72, radius * 0.46, 0, Math.PI * 2);
  ctx.fill();
}

function drawParticles() {
  for (const particle of state.particles) {
    ctx.globalAlpha = clamp(particle.life / particle.maxLife, 0, 1);
    ctx.fillStyle = particle.color;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawFloatTexts() {
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "900 26px sans-serif";
  for (const text of state.floatTexts) {
    ctx.globalAlpha = clamp(text.life / 0.9, 0, 1);
    ctx.lineWidth = 6;
    ctx.strokeStyle = "#fffdf6";
    ctx.strokeText(text.text, text.x, text.y);
    ctx.fillStyle = text.color;
    ctx.fillText(text.text, text.x, text.y);
  }
  ctx.restore();
  ctx.globalAlpha = 1;
}

function roundRect(x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function line(x1, y1, x2, y2) {
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
}

function render() {
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  withWorld(() => {
    drawBackground();
    drawTarget();
    drawSplats();
    drawKoPile();
    for (const projectile of state.projectiles) drawProjectile(projectile);
    drawPoopTrail();
    drawHero();
    drawParticles();
    drawFloatTexts();
  });
}

function updateUi() {
  if (ui.scoreText) ui.scoreText.textContent = state.score.toString();
  if (ui.comboText) ui.comboText.textContent = state.combo.toString();
  if (ui.cleanText) ui.cleanText.textContent = `${Math.round(state.clean)}%`;

  document.querySelectorAll(".action-button").forEach((button) => {
    const key = button.dataset.action;
    const action = actions.find((item) => item.key === key);
    button.disabled = state.mode !== "playing" || state.ko.pending || state.ko.active || state.ultimate.active;
    const small = button.querySelector("small");
    small.textContent = action?.hotkey || key;
  });
}

function frame(now) {
  const dt = Math.min(0.033, (now - lastTime) / 1000 || 0);
  lastTime = now;
  if (state.mode === "playing") update(dt);
  render();
  updateUi();
  requestAnimationFrame(frame);
}

window.addEventListener("resize", resize);
window.addEventListener("keydown", (event) => {
  if (event.key === "r" || event.key === "R") {
    resetGame();
    return;
  }
  const action = actions.find((item) => item.hotkey && item.hotkey.toLowerCase() === event.key.toLowerCase());
  if (action) {
    event.preventDefault();
    triggerAction(action);
  }
});

ui.startButton.addEventListener("click", startGame);
setupActionButtons();
resize();
lastTime = performance.now();
requestAnimationFrame(frame);
