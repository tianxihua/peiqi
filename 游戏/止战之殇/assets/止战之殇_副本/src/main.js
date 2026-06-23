(function () {
  const canvas = document.querySelector("#game");
  const ctx = canvas.getContext("2d");
  const moveName = document.querySelector("#move-name");
  const comboLog = document.querySelector("#combo-log");

  const DPR_CAP = 2;
  const FLOOR_Y = 0.72;
  const INPUT_CHAIN_WINDOW = 1500;
  const PIG_SOURCE = {
    path: "./assets/pig-stand.png?v=stand-down-arms-1",
    height: 242,
  };

  const pigSprite = {
    image: null,
    canvas: null,
    ready: false,
  };

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
  };

  function loadPigSprite() {
    const image = new Image();
    image.onload = () => {
      pigSprite.image = image;
      pigSprite.canvas = image;
      pigSprite.ready = true;
    };
    image.src = PIG_SOURCE.path;
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
    punchLeft: { label: "向左打拳", duration: 330, side: -1 },
    punchRight: { label: "向右打拳", duration: 330, side: 1 },
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
      makePunchEffect(def.side);
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
    state.inputHistory.unshift(text);
    state.inputHistory = state.inputHistory.slice(0, 5);
    if (comboLog) {
      comboLog.innerHTML = state.inputHistory.map((item) => `<li>${item}</li>`).join("");
    }
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
      return side < 0 ? "crouchPunchLeft" : "crouchPunchRight";
    }
    const age = state.lastPrepAction ? state.time - state.lastPrepAction.at : Infinity;
    const prepType = age <= INPUT_CHAIN_WINDOW ? state.lastPrepAction.type : state.action?.type;
    if (prepType === "jump") {
      return side < 0 ? "jumpPunchLeft" : "jumpPunchRight";
    }
    if (prepType === "crouch") {
      return side < 0 ? "crouchPunchLeft" : "crouchPunchRight";
    }
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

  function update(dt) {
    state.time += dt * 1000;
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

    for (const effect of state.effects) {
      effect.life -= dt;
    }
    state.effects = state.effects.filter((effect) => effect.life > 0);
  }

  function drawRoad() {
    const w = state.width;
    const h = state.height;
    const groundY = h * 0.7;

    const sky = ctx.createLinearGradient(0, 0, 0, groundY);
    sky.addColorStop(0, "#8cc3e8");
    sky.addColorStop(0.62, "#d8ecf5");
    sky.addColorStop(1, "#f7deb3");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, groundY);

    ctx.fillStyle = "#5f8d4f";
    ctx.fillRect(0, groundY - 30, w, 30);

    ctx.fillStyle = "#34383d";
    ctx.fillRect(0, groundY, w, h - groundY);

    ctx.fillStyle = "#2a2d31";
    ctx.fillRect(0, groundY, w, 8);

    ctx.strokeStyle = "#f6d76a";
    ctx.lineWidth = 6;
    ctx.setLineDash([40, 40]);
    ctx.beginPath();
    ctx.moveTo(0, groundY + h * 0.15);
    ctx.lineTo(w, groundY + h * 0.15);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = "#2a2d31";
    ctx.fillRect(0, h - 40, w, 40);
  }

  function drawPig() {
    const p = state.player;
    const crouch = p.squash;
    const x = p.x;
    const y = p.y;
    const isJumping = state.action?.type === "jump" || state.action?.type?.startsWith("jumpPunch");
    const bob = isJumping ? Math.sin(p.step * 7) * (2 - crouch * 1.5) : 0;

    if (pigSprite.ready) {
      const sprite = pigSprite.canvas;
      const drawH = PIG_SOURCE.height;
      const drawW = drawH * (sprite.width / sprite.height);

      ctx.save();
      ctx.translate(x, y + bob);
      ctx.fillStyle = "rgba(0,0,0,0.28)";
      ctx.beginPath();
      ctx.ellipse(0, 8, 62 + crouch * 18, 13, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.scale(1 + crouch * 0.12, 1 - crouch * 0.22);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(sprite, -drawW / 2, -drawH, drawW, drawH);
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

  function render() {
    ctx.clearRect(0, 0, state.width, state.height);
    drawRoad();
    drawEffects();
    drawPig();
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
