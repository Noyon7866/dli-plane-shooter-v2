const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let W = 0;
let H = 0;
let gameState = "menu";
let score = 0;
let lives = 3;
let level = 1;
let lastTime = 0;
let enemyTimer = 0;
let cloudTimer = 0;

const playerImg = new Image();
playerImg.src = "assets/dli-character.png";

const enemyImg = new Image();
enemyImg.src = "assets/enemy-plane.png";

const player = {
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    targetX: 0,
    targetY: 0,
    speed: 7,
    invincible: 0
};

const enemies = [];
const clouds = [];
const particles = [];
const stars = [];

function resizeCanvas() {
    const ratio = window.devicePixelRatio || 1;

    W = window.innerWidth;
    H = window.innerHeight;

    canvas.width = W * ratio;
    canvas.height = H * ratio;
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";

    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

    player.width = Math.min(105, W * 0.20);
    player.height = player.width;

    player.x = Math.max(0, Math.min(player.x, W - player.width));
    player.y = Math.max(0, Math.min(player.y, H - player.height));
}

window.addEventListener("resize", resizeCanvas);

function createStars() {
    stars.length = 0;

    const count = Math.floor((W * H) / 9000);

    for (let i = 0; i < count; i++) {
        stars.push({
            x: Math.random() * W,
            y: Math.random() * H,
            size: Math.random() * 2 + 0.5,
            speed: Math.random() * 1.5 + 0.5
        });
    }
}

function resetGame() {
    score = 0;
    lives = 3;
    level = 1;

    enemies.length = 0;
    clouds.length = 0;
    particles.length = 0;

    player.width = Math.min(105, W * 0.20);
    player.height = player.width;

    player.x = W / 2 - player.width / 2;
    player.y = H - player.height - 80;

    player.targetX = player.x;
    player.targetY = player.y;

    player.invincible = 0;

    enemyTimer = 0;
    cloudTimer = 0;

    createStars();
    updateHUD();
}

function startGame() {
    resetGame();
    gameState = "playing";
}

function updateLevel() {
    const newLevel = Math.floor(score / 100) + 1;

    if (newLevel > level) {
        level = newLevel;
        createParticles(W / 2, H / 2, 40);
        lives = Math.min(5, lives + 1);
        updateHUD();
    }
}

function spawnEnemy() {
    const size = Math.min(110, W * 0.18);
    const margin = 10;

    enemies.push({
        x: margin + Math.random() * Math.max(1, W - size - margin * 2),
        y: -size - 20,
        width: size,
        height: size,
        speed: 2.2 + level * 0.35 + Math.random() * 1.8,
        wave: Math.random() * Math.PI * 2,
        waveSpeed: 1.5 + Math.random() * 2,
        rotation: 0
    });
}

function spawnCloud() {
    clouds.push({
        x: Math.random() * W,
        y: -80,
        width: 70 + Math.random() * 100,
        height: 30 + Math.random() * 30,
        speed: 0.5 + Math.random(),
        opacity: 0.08 + Math.random() * 0.10
    });
}

function createParticles(x, y, amount = 15) {
    for (let i = 0; i < amount; i++) {
        particles.push({
            x,
            y,
            vx: (Math.random() - 0.5) * 5,
            vy: (Math.random() - 0.5) * 5,
            size: Math.random() * 5 + 2,
            life: 1,
            gravity: 0.04
        });
    }
}

function collision(a, b) {
    const padding = Math.min(a.width, a.height) * 0.20;

    return (
        a.x + padding < b.x + b.width - padding &&
        a.x + a.width - padding > b.x + padding &&
        a.y + padding < b.y + b.height - padding &&
        a.y + a.height - padding > b.y + padding
    );
}

function playerHit(enemy) {
    if (player.invincible > 0) return;

    lives--;
    player.invincible = 1.5;

    createParticles(
        player.x + player.width / 2,
        player.y + player.height / 2,
        30
    );

    updateHUD();

    if (lives <= 0) {
        gameOver();
    }
}

function gameOver() {
    gameState = "gameover";
    saveScore(score);
}

function saveScore(value) {
    const oldScores = JSON.parse(
        localStorage.getItem("dliLeaderboard") || "[]"
    );

    oldScores.push({
        score: value,
        date: new Date().toLocaleDateString()
    });

    oldScores.sort((a, b) => b.score - a.score);

    localStorage.setItem(
        "dliLeaderboard",
        JSON.stringify(oldScores.slice(0, 10))
    );
}

function getLeaderboard() {
    return JSON.parse(
        localStorage.getItem("dliLeaderboard") || "[]"
    );
}

function updateHUD() {
    const scoreElement = document.getElementById("score");
    const livesElement = document.getElementById("lives");
    const levelElement = document.getElementById("level");

    if (scoreElement) {
        scoreElement.textContent = score;
    }

    if (livesElement) {
        livesElement.textContent = "❤️ ".repeat(lives);
    }

    if (levelElement) {
        levelElement.textContent = level;
    }
}

function movePlayer(clientX, clientY) {
    if (gameState !== "playing") return;

    player.targetX = clientX - player.width / 2;
    player.targetY = clientY - player.height / 2;

    player.targetX = Math.max(
        0,
        Math.min(W - player.width, player.targetX)
    );

    player.targetY = Math.max(
        0,
        Math.min(H - player.height, player.targetY)
    );
}

canvas.addEventListener("pointerdown", event => {
    movePlayer(event.clientX, event.clientY);
});

canvas.addEventListener("pointermove", event => {
    if (event.buttons || event.pointerType === "touch") {
        movePlayer(event.clientX, event.clientY);
    }
});

const keys = {};

window.addEventListener("keydown", event => {
    keys[event.key.toLowerCase()] = true;

    if (event.key === " ") {
        if (gameState === "menu") {
            startGame();
        }

        event.preventDefault();
    }

    if (event.key.toLowerCase() === "p") {
        togglePause();
    }
});

window.addEventListener("keyup", event => {
    keys[event.key.toLowerCase()] = false;
});

function keyboardMovement() {
    if (gameState !== "playing") return;

    if (keys["arrowleft"] || keys["a"]) {
        player.targetX -= player.speed;
    }

    if (keys["arrowright"] || keys["d"]) {
        player.targetX += player.speed;
    }

    if (keys["arrowup"] || keys["w"]) {
        player.targetY -= player.speed;
    }

    if (keys["arrowdown"] || keys["s"]) {
        player.targetY += player.speed;
    }

    player.targetX = Math.max(
        0,
        Math.min(W - player.width, player.targetX)
    );

    player.targetY = Math.max(
        0,
        Math.min(H - player.height, player.targetY)
    );
}

function togglePause() {
    if (gameState === "playing") {
        gameState = "paused";
    } else if (gameState === "paused") {
        gameState = "playing";
        lastTime = performance.now();
    }
}

function update(dt) {
    if (gameState !== "playing") return;

    keyboardMovement();

    const smooth = Math.min(1, dt * 10);

    player.x += (player.targetX - player.x) * smooth;
    player.y += (player.targetY - player.y) * smooth;

    if (player.invincible > 0) {
        player.invincible -= dt;
    }

    enemyTimer += dt;

    const spawnDelay = Math.max(
        0.45,
        1.25 - level * 0.06
    );

    if (enemyTimer >= spawnDelay) {
        enemyTimer = 0;
        spawnEnemy();
    }

    cloudTimer += dt;

    if (cloudTimer >= 2.5) {
        cloudTimer = 0;
        spawnCloud();
    }

    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];

        enemy.y += enemy.speed * dt * 60;
        enemy.wave += enemy.waveSpeed * dt;
        enemy.x += Math.sin(enemy.wave) * 0.8;
        enemy.rotation = Math.sin(enemy.wave) * 0.08;

        if (collision(player, enemy)) {
            playerHit(enemy);
            enemies.splice(i, 1);
            continue;
        }

        if (enemy.y > H + enemy.height) {
            enemies.splice(i, 1);

            score += 10;

            updateLevel();
            updateHUD();
        }
    }

    for (let i = clouds.length - 1; i >= 0; i--) {
        const cloud = clouds[i];

        cloud.y += cloud.speed * dt * 60;

        if (cloud.y > H + 100) {
            clouds.splice(i, 1);
        }
    }

    for (const star of stars) {
        star.y += star.speed * dt * 60;

        if (star.y > H) {
            star.y = 0;
            star.x = Math.random() * W;
        }
    }

    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];

        p.x += p.vx * dt * 60;
        p.y += p.vy * dt * 60;
        p.vy += p.gravity;
        p.life -= dt;

        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }
}

function drawBackground() {
    const gradient = ctx.createLinearGradient(0, 0, 0, H);

    gradient.addColorStop(0, "#07142f");
    gradient.addColorStop(1, "#020617");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, W, H);

    for (const star of stars) {
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = "#ffffff";

        ctx.beginPath();

        ctx.arc(
            star.x,
            star.y,
            star.size,
            0,
            Math.PI * 2
        );

        ctx.fill();
    }

    ctx.globalAlpha = 1;
}

function drawClouds() {
    for (const cloud of clouds) {
        ctx.save();

        ctx.globalAlpha = cloud.opacity;
        ctx.fillStyle = "#ffffff";

        ctx.beginPath();

        ctx.ellipse(
            cloud.x,
            cloud.y,
            cloud.width,
            cloud.height,
            0,
            0,
            Math.PI * 2
        );

        ctx.fill();
        ctx.restore();
    }
}

function drawPlayer() {
    if (player.invincible > 0) {
        if (
            Math.floor(player.invincible * 10) % 2 === 0
        ) {
            return;
        }
    }

    ctx.drawImage(
        playerImg,
        player.x,
        player.y,
        player.width,
        player.height
    );
}

function drawEnemies() {
    for (const enemy of enemies) {
        ctx.save();

        ctx.translate(
            enemy.x + enemy.width / 2,
            enemy.y + enemy.height / 2
        );

        ctx.rotate(enemy.rotation);

        ctx.drawImage(
            enemyImg,
            -enemy.width / 2,
            -enemy.height / 2,
            enemy.width,
            enemy.height
        );

        ctx.restore();
    }
}

function drawParticles() {
    for (const p of particles) {
        ctx.save();

        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = "#60a5fa";

        ctx.beginPath();

        ctx.arc(
            p.x,
            p.y,
            p.size,
            0,
            Math.PI * 2
        );

        ctx.fill();
        ctx.restore();
    }
}

function drawPauseScreen() {
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";

    ctx.font = "bold 42px Arial";

    ctx.fillText(
        "PAUSED",
        W / 2,
        H / 2
    );

    ctx.font = "18px Arial";

    ctx.fillText(
        "Tap or press P to resume",
        W / 2,
        H / 2 + 40
    );
}

function drawGameOver() {
    ctx.fillStyle = "rgba(0,0,0,0.65)";
    ctx.fillRect(0, 0, W, H);

    ctx.textAlign = "center";
    ctx.fillStyle = "#ffffff";

    ctx.font = "bold 40px Arial";

    ctx.fillText(
        "GAME OVER",
        W / 2,
        H / 2 - 40
    );

    ctx.font = "22px Arial";

    ctx.fillText(
        `Score: ${score}`,
        W / 2,
        H / 2 + 5
    );

    ctx.font = "17px Arial";

    ctx.fillText(
        "Press Restart to play again",
        W / 2,
        H / 2 + 45
    );
}

function draw() {
    drawBackground();
    drawClouds();
    drawEnemies();
    drawPlayer();
    drawParticles();

    if (gameState === "paused") {
        drawPauseScreen();
    }

    if (gameState === "gameover") {
        drawGameOver();
    }
}

function gameLoop(timestamp) {
    if (!lastTime) {
        lastTime = timestamp;
    }

    let dt = (timestamp - lastTime) / 1000;

    lastTime = timestamp;

    dt = Math.min(dt, 0.033);

    update(dt);
    draw();

    requestAnimationFrame(gameLoop);
}

const startButton =
    document.getElementById("startButton");

if (startButton) {
    startButton.addEventListener(
        "click",
        startGame
    );
}

const pauseButton =
    document.getElementById("pauseButton");

if (pauseButton) {
    pauseButton.addEventListener(
        "click",
        togglePause
    );
}

const restartButton =
    document.getElementById("restartButton");

if (restartButton) {
    restartButton.addEventListener(
        "click",
        startGame
    );
}

resizeCanvas();
createStars();

player.x =
    W / 2 - player.width / 2;

player.y =
    H - player.height - 80;

player.targetX = player.x;
player.targetY = player.y;

updateHUD();

requestAnimationFrame(gameLoop);
