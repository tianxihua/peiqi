class Maze3DGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.setupCanvas();
        this.bindMethods();
        this.init();
        this.setupEventListeners();
    }
    
    bindMethods() {
        this.startGame = this.startGame.bind(this);
        this.restartGame = this.restartGame.bind(this);
        this.gameLoop = this.gameLoop.bind(this);
        this.updatePlayer = this.updatePlayer.bind(this);
        this.showUpgradeScreen = this.showUpgradeScreen.bind(this);
        this.upgradeWeapon = this.upgradeWeapon.bind(this);
        this.getRandomSkill = this.getRandomSkill.bind(this);
        this.nextLevel = this.nextLevel.bind(this);
    }
    
    setupCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.fov = Math.PI / 3;
        this.halfFov = this.fov / 2;
        this.numRays = 200;
        this.maxDist = 25;
        
        window.addEventListener('resize', () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        });
    }
    
    init() {
        this.currentLevel = 1;
        this.maxLevels = 5;
        this.totalTime = 0;
        this.levelStartTime = 0;
        
        this.mazeSize = 10 + this.currentLevel * 2;
        this.maze = [];
        this.player = {
            x: 1.5,
            y: 1.5,
            angle: 0,
            moveSpeed: 0.12,
            markers: [],
            maxMarkers: 3,
            hp: 6,
            maxHp: 6,
            attackCooldown: 0,
            invincibleTime: 0,
            attackRange: 1.5,
            attackAngle: Math.PI / 3
        };
        
        this.exit = { x: 0, y: 0 };
        this.monsters = [];
        this.arrows = [];
        this.explosions = [];
        this.usedMarkers = 0;
        this.gameRunning = false;
        this.gameOver = false;
        this.keys = {};
        this.mouse = { locked: false };
        
        this.weaponLevel = 1;
        this.weaponNames = ['木棒', '铁棍', '长刀', '巨剑', '神器'];
        this.skills = [];
        this.possibleSkills = [
            { name: '生命恢复 +2', effect: () => { this.player.hp = Math.min(this.player.hp + 2, this.player.maxHp); } },
            { name: '最大生命 +2', effect: () => { this.player.maxHp += 2; this.player.hp += 2; } },
            { name: '移动速度 +20%', effect: () => { this.player.moveSpeed *= 1.2; } },
            { name: '攻击冷却 -20%', effect: () => { } },
            { name: '标记次数 +1', effect: () => { this.player.maxMarkers++; } }
        ];
        this.currentSkill = null;
        
        this.monsterTypes = [
            { 
                type: 'melee', 
                emoji: '👹', 
                color: '#9932CC', 
                moveSpeed: 0.015, 
                attackRange: 1, 
                attackCooldown: 1000,
                description: '近战怪'
            },
            { 
                type: 'archer', 
                emoji: '🏹', 
                color: '#4CAF50', 
                moveSpeed: 0.01, 
                attackRange: 8, 
                attackCooldown: 2000,
                description: '弓箭手'
            },
            { 
                type: 'grief', 
                emoji: '💣', 
                color: '#FF9800', 
                moveSpeed: 0.02, 
                attackRange: 1.5, 
                attackCooldown: 0,
                description: '爆炸古力帕'
            }
        ];
        
        this.generateMaze();
        this.spawnExit();
        this.spawnMonsters();
    }
    
    spawnMonsters() {
        this.monsters = [];
        const monsterCount = Math.min(3 + Math.floor(this.currentLevel / 2), 5);
        
        for (let i = 0; i < monsterCount; i++) {
            let x, y, attempts = 0;
            do {
                x = Math.floor(Math.random() * (this.mazeSize - 2)) + 1;
                y = Math.floor(Math.random() * (this.mazeSize - 2)) + 1;
                attempts++;
            } while (
                (this.maze[y][x] !== 0 || (Math.abs(x - 1.5) < 4 && Math.abs(y - 1.5) < 4)) &&
                attempts < 100
            );
            
            if (attempts < 100) {
                const typeIndex = i % this.monsterTypes.length;
                const monsterType = this.monsterTypes[typeIndex];
                
                this.monsters.push({
                    x: x + 0.5,
                    y: y + 0.5,
                    angle: Math.random() * Math.PI * 2,
                    type: monsterType.type,
                    emoji: monsterType.emoji,
                    color: monsterType.color,
                    moveSpeed: monsterType.moveSpeed,
                    attackRange: monsterType.attackRange,
                    attackCooldown: monsterType.attackCooldown,
                    baseAttackCooldown: monsterType.attackCooldown,
                    hitTime: 0,
                    alive: true,
                    exploding: false,
                    explodeTime: 0
                });
            }
        }
    }
    
    setupEventListeners() {
        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        document.getElementById('continueBtn').addEventListener('click', () => this.showUpgradeScreen());
        document.getElementById('upgradeWeaponBtn').addEventListener('click', () => this.upgradeWeapon());
        document.getElementById('getSkillBtn').addEventListener('click', () => this.getRandomSkill());
        document.getElementById('restartGameBtn').addEventListener('click', () => this.restartGame());
        document.getElementById('restartGameBtn2').addEventListener('click', () => this.restartGame());
        
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
        
        this.canvas.addEventListener('click', () => this.handleCanvasClick());
        
        document.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        document.addEventListener('pointerlockchange', () => this.handlePointerLockChange());
    }
    
    handleKeyDown(e) {
        if (e.code === 'Space' && this.gameRunning) {
            e.preventDefault();
            this.attack();
        }
        if (e.code === 'KeyE' && this.gameRunning) {
            e.preventDefault();
            this.placeMarker();
        }
        if (e.key.toLowerCase() === 'w' || e.key.toLowerCase() === 'a' ||
            e.key.toLowerCase() === 's' || e.key.toLowerCase() === 'd') {
            this.keys[e.key.toLowerCase()] = true;
        }
    }
    
    attack() {
        if (this.player.attackCooldown > 0) return;
        
        const cooldown = 500 * (1 - (this.weaponLevel - 1) * 0.1);
        this.player.attackCooldown = cooldown;
        this.player.attackAngle = this.player.angle;
        
        const attackRange = this.player.attackRange * (1 + (this.weaponLevel - 1) * 0.3);
        const attackAngle = this.player.attackAngle * (1 + (this.weaponLevel - 1) * 0.2);
        
        for (const monster of this.monsters) {
            if (!monster.alive) continue;
            
            const dx = monster.x - this.player.x;
            const dy = monster.y - this.player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            let angle = Math.atan2(dy, dx) - this.player.angle;
            while (angle > Math.PI) angle -= Math.PI * 2;
            while (angle < -Math.PI) angle += Math.PI * 2;
            
            if (dist < attackRange && Math.abs(angle) < attackAngle) {
                monster.alive = false;
                monster.hitTime = Date.now();
                
                if (monster.type === 'grief') {
                    this.explosions.push({
                        x: monster.x,
                        y: monster.y,
                        startTime: Date.now(),
                        radius: 0,
                        maxRadius: 3
                    });
                }
            }
        }
    }
    
    handleKeyUp(e) {
        this.keys[e.key.toLowerCase()] = false;
    }
    
    handleCanvasClick() {
        if (this.gameRunning && !this.mouse.locked) {
            this.canvas.requestPointerLock();
        }
    }
    
    handleMouseMove(e) {
        if (this.mouse.locked && this.gameRunning) {
            this.player.angle += e.movementX * 0.002;
        }
    }
    
    handlePointerLockChange() {
        this.mouse.locked = document.pointerLockElement === this.canvas;
    }
    
    generateMaze() {
        for (let y = 0; y < this.mazeSize; y++) {
            this.maze[y] = [];
            for (let x = 0; x < this.mazeSize; x++) {
                this.maze[y][x] = 1;
            }
        }
        
        const stack = [];
        const startX = 1, startY = 1;
        this.maze[startY][startX] = 0;
        stack.push({ x: startX, y: startY });
        
        while (stack.length > 0) {
            const current = stack[stack.length - 1];
            const neighbors = this.getUnvisitedNeighbors(current.x, current.y);
            
            if (neighbors.length === 0) {
                stack.pop();
            } else {
                const next = neighbors[Math.floor(Math.random() * neighbors.length)];
                const wallX = current.x + (next.x - current.x) / 2;
                const wallY = current.y + (next.y - current.y) / 2;
                this.maze[Math.floor(wallY)][Math.floor(wallX)] = 0;
                this.maze[next.y][next.x] = 0;
                stack.push(next);
            }
        }
        
        for (let i = 0; i < this.currentLevel * 3; i++) {
            const x = Math.floor(Math.random() * (this.mazeSize - 2)) + 1;
            const y = Math.floor(Math.random() * (this.mazeSize - 2)) + 1;
            if (this.maze[y][x] === 0 && (Math.abs(x - 1.5) > 2 || Math.abs(y - 1.5) > 2)) {
                this.maze[y][x] = 0;
                if (x + 1 < this.mazeSize - 1) this.maze[y][x + 1] = 0;
                if (y + 1 < this.mazeSize - 1) this.maze[y + 1][x] = 0;
            }
        }
    }
    
    getUnvisitedNeighbors(x, y) {
        const neighbors = [];
        const directions = [
            { dx: 0, dy: -2 },
            { dx: 2, dy: 0 },
            { dx: 0, dy: 2 },
            { dx: -2, dy: 0 }
        ];
        
        for (const dir of directions) {
            const nx = x + dir.dx;
            const ny = y + dir.dy;
            if (nx > 0 && nx < this.mazeSize - 1 && ny > 0 && ny < this.mazeSize - 1) {
                if (this.maze[ny][nx] === 1) {
                    neighbors.push({ x: nx, y: ny });
                }
            }
        }
        return neighbors;
    }
    
    spawnExit() {
        let x, y;
        do {
            x = Math.floor(Math.random() * (this.mazeSize - 4)) + 2;
            y = Math.floor(Math.random() * (this.mazeSize - 4)) + 2;
        } while (
            this.maze[y][x] === 1 ||
            (Math.abs(x - 1.5) < 4 && Math.abs(y - 1.5) < 4)
        );
        
        this.exit.x = x + 0.5;
        this.exit.y = y + 0.5;
        this.maze[y][x] = 2;
    }
    
    startGame() {
        this.gameRunning = true;
        this.gameOver = false;
        this.levelStartTime = Date.now();
        document.getElementById('startScreen').classList.remove('active');
        document.getElementById('startScreen').classList.add('hidden');
        this.updateHUD();
        this.canvas.requestPointerLock();
        this.gameLoop();
    }
    
    showUpgradeScreen() {
        document.getElementById('levelCompleteScreen').classList.remove('active');
        document.getElementById('levelCompleteScreen').classList.add('hidden');
        
        document.getElementById('upgradeWeaponName').textContent = this.weaponNames[Math.min(this.weaponLevel, this.weaponNames.length - 1)];
        document.getElementById('upgradeWeaponDesc').textContent = `攻击范围 +30%, 角度 +20%`;
        
        this.currentSkill = this.possibleSkills[Math.floor(Math.random() * this.possibleSkills.length)];
        document.getElementById('skillName').textContent = this.currentSkill.name;
        
        document.getElementById('upgradeScreen').classList.remove('hidden');
        document.getElementById('upgradeScreen').classList.add('active');
    }
    
    upgradeWeapon() {
        if (this.weaponLevel < 5) {
            this.weaponLevel++;
        }
        this.continueToNextLevel();
    }
    
    getRandomSkill() {
        if (this.currentSkill) {
            this.currentSkill.effect();
            this.skills.push(this.currentSkill.name);
        }
        this.continueToNextLevel();
    }
    
    continueToNextLevel() {
        document.getElementById('upgradeScreen').classList.remove('active');
        document.getElementById('upgradeScreen').classList.add('hidden');
        this.nextLevel();
    }
    
    nextLevel() {
        this.currentLevel++;
        this.mazeSize = 10 + this.currentLevel * 2;
        this.maze = [];
        this.player.x = 1.5;
        this.player.y = 1.5;
        this.player.angle = 0;
        this.player.markers = [];
        this.arrows = [];
        this.explosions = [];
        
        this.generateMaze();
        this.spawnExit();
        this.spawnMonsters();
        
        this.gameRunning = true;
        this.levelStartTime = Date.now();
        this.updateHUD();
        this.canvas.requestPointerLock();
        this.gameLoop();
    }
    
    restartGame() {
        const screens = ['startScreen', 'gameOverScreen', 'victoryScreen', 'levelCompleteScreen', 'upgradeScreen'];
        screens.forEach(id => {
            const el = document.getElementById(id);
            el.classList.remove('active');
            el.classList.add('hidden');
        });
        
        this.currentLevel = 1;
        this.totalTime = 0;
        this.usedMarkers = 0;
        this.mazeSize = 10 + this.currentLevel * 2;
        this.maze = [];
        this.player = {
            x: 1.5,
            y: 1.5,
            angle: 0,
            moveSpeed: 0.12,
            markers: [],
            maxMarkers: 3,
            hp: 6,
            maxHp: 6,
            attackCooldown: 0,
            invincibleTime: 0,
            attackRange: 1.5,
            attackAngle: Math.PI / 3
        };
        this.weaponLevel = 1;
        this.skills = [];
        this.arrows = [];
        this.explosions = [];
        this.exit = { x: 0, y: 0 };
        this.gameRunning = true;
        this.gameOver = false;
        this.keys = {};
        this.mouse = { locked: false };
        
        this.generateMaze();
        this.spawnExit();
        this.spawnMonsters();
        
        this.levelStartTime = Date.now();
        this.updateHUD();
        this.canvas.requestPointerLock();
        this.gameLoop();
    }
    
    updatePlayer() {
        if (!this.gameRunning || this.gameOver) return;
        
        if (this.player.invincibleTime > 0) {
            this.player.invincibleTime -= 16;
        }
        if (this.player.attackCooldown > 0) {
            this.player.attackCooldown -= 16;
        }
        
        let dx = 0, dy = 0;
        const moveSpeed = this.player.moveSpeed;
        
        if (this.keys['w']) {
            dx += Math.cos(this.player.angle) * moveSpeed;
            dy += Math.sin(this.player.angle) * moveSpeed;
        }
        if (this.keys['s']) {
            dx -= Math.cos(this.player.angle) * moveSpeed;
            dy -= Math.sin(this.player.angle) * moveSpeed;
        }
        if (this.keys['a']) {
            dx += Math.cos(this.player.angle - Math.PI/2) * moveSpeed;
            dy += Math.sin(this.player.angle - Math.PI/2) * moveSpeed;
        }
        if (this.keys['d']) {
            dx += Math.cos(this.player.angle + Math.PI/2) * moveSpeed;
            dy += Math.sin(this.player.angle + Math.PI/2) * moveSpeed;
        }
        
        const newX = this.player.x + dx;
        const newY = this.player.y + dy;
        
        if (!this.checkWall(newX, this.player.y)) {
            this.player.x = newX;
        }
        if (!this.checkWall(this.player.x, newY)) {
            this.player.y = newY;
        }
        
        this.checkExit();
        this.updateMonsters();
        this.updateArrows();
        this.updateExplosions();
    }
    
    updateMonsters() {
        for (const monster of this.monsters) {
            if (!monster.alive) continue;
            
            const dx = this.player.x - monster.x;
            const dy = this.player.y - monster.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            monster.angle = Math.atan2(dy, dx);
            
            if (monster.type === 'melee') {
                this.updateMeleeMonster(monster, dx, dy, dist);
            } else if (monster.type === 'archer') {
                this.updateArcherMonster(monster, dx, dy, dist);
            } else if (monster.type === 'grief') {
                this.updateGriefMonster(monster, dx, dy, dist);
            }
            
            if (monster.attackCooldown > 0) {
                monster.attackCooldown -= 16;
            }
        }
    }
    
    updateMeleeMonster(monster, dx, dy, dist) {
        if (dist > 0.8) {
            const moveX = Math.cos(monster.angle) * monster.moveSpeed;
            const moveY = Math.sin(monster.angle) * monster.moveSpeed;
            this.moveMonster(monster, moveX, moveY);
        }
        
        if (dist < monster.attackRange && monster.attackCooldown <= 0 && this.player.invincibleTime <= 0) {
            this.player.hp--;
            this.player.invincibleTime = 1000;
            monster.attackCooldown = monster.baseAttackCooldown;
            
            if (this.player.hp <= 0) {
                this.playerDeath();
            }
        }
    }
    
    updateArcherMonster(monster, dx, dy, dist) {
        if (dist > monster.attackRange + 2) {
            const moveX = Math.cos(monster.angle) * monster.moveSpeed;
            const moveY = Math.sin(monster.angle) * monster.moveSpeed;
            this.moveMonster(monster, moveX, moveY);
        } else if (dist < 3) {
            const moveX = -Math.cos(monster.angle) * monster.moveSpeed;
            const moveY = -Math.sin(monster.angle) * monster.moveSpeed;
            this.moveMonster(monster, moveX, moveY);
        }
        
        if (monster.attackCooldown <= 0 && dist <= monster.attackRange) {
            this.shootArrow(monster);
            monster.attackCooldown = monster.baseAttackCooldown;
        }
    }
    
    updateGriefMonster(monster, dx, dy, dist) {
        if (dist > 0.8) {
            const moveX = Math.cos(monster.angle) * monster.moveSpeed;
            const moveY = Math.sin(monster.angle) * monster.moveSpeed;
            this.moveMonster(monster, moveX, moveY);
        }
        
        if (dist < monster.attackRange) {
            monster.alive = false;
            monster.hitTime = Date.now();
            
            this.explosions.push({
                x: monster.x,
                y: monster.y,
                startTime: Date.now(),
                radius: 0,
                maxRadius: 3
            });
            
            if (this.player.invincibleTime <= 0) {
                const explosionDamage = Math.ceil(3 * (1 - dist / monster.attackRange));
                this.player.hp -= explosionDamage;
                this.player.invincibleTime = 1000;
                
                if (this.player.hp <= 0) {
                    this.playerDeath();
                }
            }
        }
    }
    
    moveMonster(monster, moveX, moveY) {
        const newX = monster.x + moveX;
        const newY = monster.y + moveY;
        
        if (!this.checkWall(newX, monster.y)) {
            monster.x = newX;
        }
        if (!this.checkWall(monster.x, newY)) {
            monster.y = newY;
        }
    }
    
    shootArrow(monster) {
        const angleToPlayer = Math.atan2(
            this.player.y - monster.y,
            this.player.x - monster.x
        );
        
        this.arrows.push({
            x: monster.x + Math.cos(angleToPlayer) * 0.5,
            y: monster.y + Math.sin(angleToPlayer) * 0.5,
            angle: angleToPlayer,
            speed: 0.3,
            alive: true
        });
    }
    
    updateArrows() {
        for (const arrow of this.arrows) {
            if (!arrow.alive) continue;
            
            arrow.x += Math.cos(arrow.angle) * arrow.speed;
            arrow.y += Math.sin(arrow.angle) * arrow.speed;
            
            if (this.checkWall(arrow.x, arrow.y)) {
                arrow.alive = false;
                continue;
            }
            
            const dx = this.player.x - arrow.x;
            const dy = this.player.y - arrow.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < 0.5 && this.player.invincibleTime <= 0) {
                arrow.alive = false;
                this.player.hp--;
                this.player.invincibleTime = 500;
                
                if (this.player.hp <= 0) {
                    this.playerDeath();
                }
            }
            
            if (arrow.x < 0 || arrow.x >= this.mazeSize || arrow.y < 0 || arrow.y >= this.mazeSize) {
                arrow.alive = false;
            }
        }
        
        this.arrows = this.arrows.filter(a => a.alive);
    }
    
    updateExplosions() {
        const now = Date.now();
        
        for (const explosion of this.explosions) {
            const elapsed = now - explosion.startTime;
            explosion.radius = Math.min(explosion.maxRadius, (elapsed / 300) * explosion.maxRadius);
            
            const dx = this.player.x - explosion.x;
            const dy = this.player.y - explosion.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < explosion.radius && this.player.invincibleTime <= 0) {
                const damage = Math.ceil(2 * (1 - dist / explosion.radius));
                this.player.hp -= damage;
                this.player.invincibleTime = 800;
                
                if (this.player.hp <= 0) {
                    this.playerDeath();
                }
            }
        }
        
        this.explosions = this.explosions.filter(e => now - e.startTime < 500);
    }
    
    playerDeath() {
        this.gameRunning = false;
        this.gameOver = true;
        
        document.getElementById('gameOverScreen').classList.remove('hidden');
        document.getElementById('gameOverScreen').classList.add('active');
    }
    
    checkWall(x, y) {
        const checkPoints = [
            { x: x - 0.25, y: y - 0.25 },
            { x: x + 0.25, y: y - 0.25 },
            { x: x - 0.25, y: y + 0.25 },
            { x: x + 0.25, y: y + 0.25 }
        ];
        
        for (const point of checkPoints) {
            const mapX = Math.floor(point.x);
            const mapY = Math.floor(point.y);
            if (mapX < 0 || mapX >= this.mazeSize || mapY < 0 || mapY >= this.mazeSize) {
                return true;
            }
            if (this.maze[mapY][mapX] === 1) {
                return true;
            }
        }
        return false;
    }
    
    checkExit() {
        const dx = this.exit.x - this.player.x;
        const dy = this.exit.y - this.player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 0.8) {
            this.levelComplete();
        }
    }
    
    levelComplete() {
        this.gameRunning = false;
        const levelTime = Date.now() - this.levelStartTime;
        this.totalTime += levelTime;
        
        document.getElementById('levelTime').textContent = this.formatTime(levelTime);
        
        if (document.pointerLockElement) {
            document.exitPointerLock();
        }
        
        if (this.currentLevel >= this.maxLevels) {
            document.getElementById('totalTime').textContent = this.formatTime(this.totalTime);
            document.getElementById('victoryScreen').classList.remove('hidden');
            document.getElementById('victoryScreen').classList.add('active');
        } else {
            document.getElementById('levelCompleteScreen').classList.remove('hidden');
            document.getElementById('levelCompleteScreen').classList.add('active');
        }
    }
    
    formatTime(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    updateHUD() {
        document.getElementById('levelNum').textContent = this.currentLevel;
        document.getElementById('mazeSizeDisplay').textContent = `迷宫: ${this.mazeSize}x${this.mazeSize} | 武器: ${this.weaponNames[Math.min(this.weaponLevel - 1, this.weaponNames.length - 1)]}`;
        document.getElementById('healthDisplay').textContent = '❤️'.repeat(this.player.hp);
        const available = this.player.maxMarkers - this.usedMarkers;
        document.getElementById('markerCount').textContent = `标记: ${available}/3`;
        const markerDisplay = document.getElementById('markerCount').parentElement;
        if (available === 0) {
            markerDisplay.classList.add('no-markers');
        } else {
            markerDisplay.classList.remove('no-markers');
        }
        const aliveMonsters = this.monsters.filter(m => m.alive).length;
        document.getElementById('monsterCount').textContent = `怪物: ${aliveMonsters}`;
    }
    
    updateTimer() {
        if (!this.gameRunning) return;
        const elapsed = Date.now() - this.levelStartTime;
        document.getElementById('timer').textContent = this.formatTime(elapsed);
    }
    
    render() {
        this.renderWalls();
        this.renderMarkers();
        this.renderMonsters();
        this.renderArrows();
        this.renderExplosions();
        this.renderExit();
        this.renderDamageEffect();
    }
    
    renderDamageEffect() {
        if (this.player.invincibleTime > 0) {
            const flash = Math.sin(Date.now() / 50) > 0;
            if (flash) {
                this.ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
                this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            }
        }
    }
    
    renderMonsters() {
        const now = Date.now();
        
        for (const monster of this.monsters) {
            if (!monster.alive && now - monster.hitTime > 200) continue;
            
            const dx = monster.x - this.player.x;
            const dy = monster.y - this.player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist > this.maxDist) continue;
            
            let angle = Math.atan2(dy, dx) - this.player.angle;
            while (angle > Math.PI) angle -= Math.PI * 2;
            while (angle < -Math.PI) angle += Math.PI * 2;
            
            if (Math.abs(angle) < this.halfFov + 0.3) {
                const screenX = this.canvas.width / 2 + (angle / this.halfFov) * (this.canvas.width / 2);
                const size = Math.min(this.canvas.height * 0.3, (this.canvas.height / Math.max(dist, 0.5)) * 0.5);
                const screenY = this.canvas.height / 2;
                
                const isHit = !monster.alive;
                
                this.ctx.fillStyle = isHit ? '#ff6666' : monster.color;
                this.ctx.beginPath();
                this.ctx.arc(screenX, screenY, size, 0, Math.PI * 2);
                this.ctx.fill();
                
                this.ctx.fillStyle = '#222';
                this.ctx.beginPath();
                this.ctx.arc(screenX - size * 0.3, screenY - size * 0.2, size * 0.15, 0, Math.PI * 2);
                this.ctx.arc(screenX + size * 0.3, screenY - size * 0.2, size * 0.15, 0, Math.PI * 2);
                this.ctx.fill();
                
                this.ctx.fillStyle = '#fff';
                this.ctx.font = `bold ${Math.max(12, size * 0.4)}px Arial`;
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText(monster.emoji, screenX, screenY);
            }
        }
    }
    
    renderArrows() {
        for (const arrow of this.arrows) {
            if (!arrow.alive) continue;
            
            const dx = arrow.x - this.player.x;
            const dy = arrow.y - this.player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist > this.maxDist) continue;
            
            let angle = Math.atan2(dy, dx) - this.player.angle;
            while (angle > Math.PI) angle -= Math.PI * 2;
            while (angle < -Math.PI) angle += Math.PI * 2;
            
            if (Math.abs(angle) < this.halfFov + 0.3) {
                const screenX = this.canvas.width / 2 + (angle / this.halfFov) * (this.canvas.width / 2);
                const size = Math.min(this.canvas.height * 0.08, (this.canvas.height / Math.max(dist, 0.5)) * 0.15);
                const screenY = this.canvas.height / 2;
                
                this.ctx.fillStyle = '#8B4513';
                this.ctx.beginPath();
                this.ctx.arc(screenX, screenY, size, 0, Math.PI * 2);
                this.ctx.fill();
                
                this.ctx.fillStyle = '#FFD700';
                this.ctx.font = `bold ${Math.max(10, size * 0.8)}px Arial`;
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText('🏹', screenX, screenY);
            }
        }
    }
    
    renderExplosions() {
        const now = Date.now();
        
        for (const explosion of this.explosions) {
            const dx = explosion.x - this.player.x;
            const dy = explosion.y - this.player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist > this.maxDist + explosion.maxRadius) continue;
            
            let angle = Math.atan2(dy, dx) - this.player.angle;
            while (angle > Math.PI) angle -= Math.PI * 2;
            while (angle < -Math.PI) angle += Math.PI * 2;
            
            const inView = Math.abs(angle) < this.halfFov + 0.5;
            
            if (!inView && dist > this.maxDist) continue;
            
            const elapsed = now - explosion.startTime;
            const progress = Math.min(elapsed / 500, 1);
            const alpha = 1 - progress;
            
            if (inView && dist < this.maxDist) {
                const screenX = this.canvas.width / 2 + (angle / this.halfFov) * (this.canvas.width / 2);
                const baseSize = (this.canvas.height / Math.max(dist, 0.5)) * 0.3;
                const screenY = this.canvas.height / 2;
                
                const radius = baseSize * explosion.radius * 0.5;
                
                const gradient = this.ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, radius);
                gradient.addColorStop(0, `rgba(255, 200, 0, ${alpha})`);
                gradient.addColorStop(0.5, `rgba(255, 100, 0, ${alpha * 0.8})`);
                gradient.addColorStop(1, `rgba(255, 0, 0, 0)`);
                
                this.ctx.fillStyle = gradient;
                this.ctx.beginPath();
                this.ctx.arc(screenX, screenY, radius, 0, Math.PI * 2);
                this.ctx.fill();
            } else {
                const screenX = this.canvas.width / 2;
                const screenY = this.canvas.height / 2;
                const radius = Math.min(this.canvas.width, this.canvas.height) * 0.5 * progress;
                
                const gradient = this.ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, radius);
                gradient.addColorStop(0, `rgba(255, 200, 0, ${alpha * 0.3})`);
                gradient.addColorStop(1, `rgba(255, 0, 0, 0)`);
                
                this.ctx.fillStyle = gradient;
                this.ctx.beginPath();
                this.ctx.arc(screenX, screenY, radius, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }
    }
    
    placeMarker() {
        if (this.usedMarkers >= this.player.maxMarkers) return;
        
        const checkDist = 1.5;
        const testX = this.player.x + Math.cos(this.player.angle) * checkDist;
        const testY = this.player.y + Math.sin(this.player.angle) * checkDist;
        
        const mapX = Math.floor(testX);
        const mapY = Math.floor(testY);
        
        if (mapX >= 0 && mapX < this.mazeSize && mapY >= 0 && mapY < this.mazeSize) {
            if (this.maze[mapY][mapX] === 1) {
                const markerX = mapX + 0.5;
                const markerY = mapY + 0.5;
                
                for (const marker of this.player.markers) {
                    if (marker.x === markerX && marker.y === markerY) return;
                }
                
                this.player.markers.push({ x: markerX, y: markerY });
                this.usedMarkers++;
                this.updateHUD();
            }
        }
    }
    
    renderMarkers() {
        const now = Date.now();
        
        for (const marker of this.player.markers) {
            const dx = marker.x - this.player.x;
            const dy = marker.y - this.player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist > this.maxDist) continue;
            
            const markerAngle = Math.atan2(dy, dx);
            let relativeAngle = markerAngle - this.player.angle;
            while (relativeAngle > Math.PI) relativeAngle -= Math.PI * 2;
            while (relativeAngle < -Math.PI) relativeAngle += Math.PI * 2;
            
            if (Math.abs(relativeAngle) < this.halfFov + 0.3) {
                const screenX = this.canvas.width / 2 + (relativeAngle / this.halfFov) * (this.canvas.width / 2);
                const size = Math.min(this.canvas.height * 0.2, (this.canvas.height / Math.max(dist, 0.5)) * 0.4);
                const screenY = this.canvas.height / 2;
                
                const pulse = Math.sin(now / 200) * 0.2 + 0.8;
                const visibility = Math.max(0.3, 1 - dist / this.maxDist);
                
                this.ctx.fillStyle = `rgba(255, 182, 193, ${visibility * pulse})`;
                this.ctx.beginPath();
                this.ctx.arc(screenX, screenY, size, 0, Math.PI * 2);
                this.ctx.fill();
                
                this.ctx.fillStyle = `rgba(255, 105, 180, ${visibility})`;
                this.ctx.beginPath();
                this.ctx.arc(screenX, screenY, size * 0.6, 0, Math.PI * 2);
                this.ctx.fill();
                
                this.ctx.fillStyle = `rgba(255, 255, 255, ${visibility})`;
                this.ctx.font = `bold ${Math.max(12, size * 0.3)}px Arial`;
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText('🐷', screenX, screenY);
            }
        }
    }
    
    renderWalls() {
        const width = this.canvas.width;
        const height = this.canvas.height;
        const stripWidth = width / this.numRays;
        
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, 0, width, height);
        
        const floorGradient = this.ctx.createLinearGradient(0, height / 2, 0, height);
        floorGradient.addColorStop(0, '#444');
        floorGradient.addColorStop(1, '#1a1a1a');
        this.ctx.fillStyle = floorGradient;
        this.ctx.fillRect(0, height / 2, width, height / 2);
        
        const ceilingGradient = this.ctx.createLinearGradient(0, 0, 0, height / 2);
        ceilingGradient.addColorStop(0, '#2a2a3e');
        ceilingGradient.addColorStop(1, '#444');
        this.ctx.fillStyle = ceilingGradient;
        this.ctx.fillRect(0, 0, width, height / 2);
        
        for (let i = 0; i < this.numRays; i++) {
            const rayAngle = this.player.angle - this.halfFov + (i / this.numRays) * this.fov;
            
            let dist = 0;
            const step = 0.02;
            const maxSteps = this.maxDist / step;
            let hitVertical = false;
            let exitDist = null;
            let hitWall = false;
            
            for (let j = 0; j < maxSteps; j++) {
                dist += step;
                const testX = this.player.x + Math.cos(rayAngle) * dist;
                const testY = this.player.y + Math.sin(rayAngle) * dist;
                
                const mapX = Math.floor(testX);
                const mapY = Math.floor(testY);
                
                if (mapX < 0 || mapX >= this.mazeSize || mapY < 0 || mapY >= this.mazeSize) {
                    hitWall = true;
                    break;
                }
                
                if (this.maze[mapY][mapX] === 2) {
                    exitDist = dist;
                }
                
                if (this.maze[mapY][mapX] === 1) {
                    hitWall = true;
                    const nextX = this.player.x + Math.cos(rayAngle) * (dist - step);
                    const nextY = this.player.y + Math.sin(rayAngle) * (dist - step);
                    
                    const prevMapX = Math.floor(nextX);
                    const prevMapY = Math.floor(nextY);
                    
                    if (mapX !== prevMapX) hitVertical = true;
                    else if (mapY !== prevMapY) hitVertical = false;
                    break;
                }
            }
            
            if (exitDist !== null && (!hitWall || dist > exitDist)) {
                dist = exitDist * Math.cos(rayAngle - this.player.angle);
                const wallHeight = Math.min(height * 2, (height / Math.max(dist, 0.1)) * 1.2);
                const pulse = Math.sin(Date.now() / 150) * 0.3 + 0.7;
                const brightness = Math.min(255, Math.max(150, 255 - dist * 6));
                const r = Math.floor(100 * pulse + brightness * (1 - pulse));
                const g = Math.floor(220 * pulse + brightness * (1 - pulse));
                const b = Math.floor(200 * pulse + brightness * (1 - pulse));
                
                this.ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
                this.ctx.fillRect(
                    i * stripWidth,
                    (height - wallHeight) / 2,
                    stripWidth + 1,
                    wallHeight
                );
            } else if (hitWall) {
                dist = dist * Math.cos(rayAngle - this.player.angle);
                const wallHeight = Math.min(height * 2, (height / Math.max(dist, 0.5)) * 1.2);
                const brightness = Math.min(255, Math.max(100, 255 - dist * 8));
                
                let wallColor;
                if (hitVertical) {
                    wallColor = `rgb(${brightness}, ${brightness * 0.95}, ${brightness * 0.9})`;
                } else {
                    wallColor = `rgb(${brightness * 0.9}, ${brightness * 0.85}, ${brightness * 0.8})`;
                }
                
                this.ctx.fillStyle = wallColor;
                this.ctx.fillRect(
                    i * stripWidth,
                    (height - wallHeight) / 2,
                    stripWidth + 1,
                    wallHeight
                );
            }
        }
    }
    
    renderExit() {
        const dx = this.exit.x - this.player.x;
        const dy = this.exit.y - this.player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        const exitAngle = Math.atan2(dy, dx);
        let relativeAngle = exitAngle - this.player.angle;
        while (relativeAngle > Math.PI) relativeAngle -= Math.PI * 2;
        while (relativeAngle < -Math.PI) relativeAngle += Math.PI * 2;
        
        const inView = Math.abs(relativeAngle) < this.halfFov + 0.3;
        
        if (dist > this.maxDist && !inView) return;
        
        const pulse = Math.sin(Date.now() / 150) * 0.3 + 0.7;
        const visibility = Math.max(0.3, 1 - dist / this.maxDist);
        
        if (inView && dist < this.maxDist) {
            const screenX = this.canvas.width / 2 + (relativeAngle / this.halfFov) * (this.canvas.width / 2);
            const size = Math.min(this.canvas.height * 0.4, (this.canvas.height / Math.max(dist, 0.5)) * 0.8);
            const screenY = this.canvas.height / 2;
            
            this.ctx.fillStyle = `rgba(78, 205, 196, ${visibility * pulse * 0.8})`;
            this.ctx.beginPath();
            this.ctx.arc(screenX, screenY, size, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.fillStyle = `rgba(150, 255, 240, ${visibility})`;
            this.ctx.beginPath();
            this.ctx.arc(screenX, screenY, size * 0.6, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.fillStyle = `rgba(255, 255, 255, ${visibility})`;
            this.ctx.font = `bold ${Math.max(16, size * 0.4)}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText('EXIT', screenX, screenY);
            
            this.ctx.strokeStyle = `rgba(255, 255, 255, ${visibility * 0.8})`;
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.arc(screenX, screenY, size + 15, 0, Math.PI * 2);
            this.ctx.stroke();
        }
    }
    
    gameLoop() {
        if (!this.gameRunning) return;
        
        this.updatePlayer();
        this.updateTimer();
        this.updateHUD();
        this.render();
        
        requestAnimationFrame(() => this.gameLoop());
    }
}

window.addEventListener('load', () => {
    new Maze3DGame();
});