const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 600;

// 1. RECURSOS
const imgPlayer = new Image(); imgPlayer.src = 'player.png';
const imgAlien = new Image(); imgAlien.src = 'alien.webp';
const imgExplosion = new Image(); imgExplosion.src = 'explosion.webp';

const sndDisparo = new Audio('disparo.mp3');
const sndVictoria = new Audio('victoria.mp3');
const sndDerrota = new Audio('derrota.mp3');

// 2. ESTADO
let score = 0;
let lives = 3;
let energy = 100;
let gameActive = false;

let player = { x: 375, y: 530, w: 50, h: 50, speed: 7 };
let aliens = [];
let bullets = [];
let enemyBullets = [];
let explosions = [];
let alienDirection = 1;
let alienBaseSpeed = 1.3;

// 3. INICIO
function startGame() {
    document.getElementById('start-screen').style.display = 'none';
    gameActive = true;
    if (window.innerWidth <= 850) {
        document.getElementById('mobile-controls').style.display = 'flex';
    }
    createFleet();
    requestAnimationFrame(gameLoop);
}

function createFleet() {
    aliens = [];
    for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 8; c++) {
            aliens.push({ x: 100 + c * 80, y: 70 + r * 65, w: 45, h: 45, alive: true });
        }
    }
}

// 4. CONTROLES
const keys = {};
window.onkeydown = (e) => keys[e.key] = true;
window.onkeyup = (e) => keys[e.key] = false;

const btnLeft = document.getElementById('btn-left');
const btnRight = document.getElementById('btn-right');
const btnShoot = document.getElementById('btn-shoot');

btnLeft.ontouchstart = (e) => { e.preventDefault(); keys['ArrowLeft'] = true; };
btnLeft.ontouchend = () => keys['ArrowLeft'] = false;
btnRight.ontouchstart = (e) => { e.preventDefault(); keys['ArrowRight'] = true; };
btnRight.ontouchend = () => keys['ArrowRight'] = false;
btnShoot.ontouchstart = (e) => { e.preventDefault(); keys[' '] = true; };
btnShoot.ontouchend = () => keys[' '] = false;

function drawImageSafe(img, x, y, w, h, fallbackColor) {
    if (img.complete && img.naturalWidth !== 0) {
        ctx.drawImage(img, x, y, w, h);
    } else {
        ctx.fillStyle = fallbackColor;
        ctx.fillRect(x, y, w, h);
    }
}

function update() {
    if (!gameActive) return;

    if (keys['ArrowLeft'] && player.x > 0) player.x -= player.speed;
    if (keys['ArrowRight'] && player.x < canvas.width - player.w) player.x += player.speed;

    if (keys[' '] && energy >= 20) {
        bullets.push({ x: player.x + player.w / 2 - 2, y: player.y, speed: 9 });
        energy -= 20;
        sndDisparo.currentTime = 0;
        sndDisparo.play().catch(() => {});
        keys[' '] = false; 
    }

    if (energy < 100) energy += 0.9;
    document.getElementById('energy').value = energy;

    const aliveCount = aliens.filter(a => a.alive).length;
    let currentSpeed = (alienBaseSpeed + (24 - aliveCount) * 0.15) * alienDirection;

    let reachEdge = false;
    aliens.forEach(a => {
        if (!a.alive) return;
        a.x += currentSpeed;
        if (a.x > canvas.width - a.w || a.x < 0) reachEdge = true;
        // CONDICIÓN: Si llegan abajo
        if (a.y + a.h >= player.y) endGame("invasion");
    });

    if (reachEdge) {
        alienDirection *= -1;
        aliens.forEach(a => { if (a.alive) a.y += 25; });
    }

    for (let i = bullets.length - 1; i >= 0; i--) {
        let b = bullets[i]; b.y -= b.speed;
        let hit = false;
        for (let j = 0; j < aliens.length; j++) {
            let a = aliens[j];
            if (a.alive && b.x > a.x && b.x < a.x + a.w && b.y > a.y && b.y < a.y + a.h) {
                a.alive = false; hit = true; score += 10;
                document.getElementById('score').innerText = score;
                explosions.push({ x: a.x, y: a.y, timer: 15 });
                break;
            }
        }
        if (hit || b.y < 0) bullets.splice(i, 1);
    }

    if (Math.random() < 0.02 && aliveCount > 0) {
        const shooter = aliens.filter(a => a.alive)[Math.floor(Math.random() * aliveCount)];
        enemyBullets.push({ x: shooter.x + 20, y: shooter.y + 40, speed: 4 });
    }

    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        let eb = enemyBullets[i]; eb.y += eb.speed;
        if (eb.x > player.x && eb.x < player.x + player.w && eb.y > player.y && eb.y < player.y + player.h) {
            enemyBullets.splice(i, 1);
            lives--;
            document.getElementById('lives').innerText = lives;
            // CONDICIÓN: Si te matan
            if (lives <= 0) endGame("death");
        } else if (eb.y > canvas.height) enemyBullets.splice(i, 1);
    }

    // CONDICIÓN: Si ganas
    if (aliveCount === 0) endGame("victory");
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawImageSafe(imgPlayer, player.x, player.y, player.w, player.h, "#ECF0F1");
    aliens.forEach(a => { if (a.alive) drawImageSafe(imgAlien, a.x, a.y, a.w, a.h, "#32E0C4"); });
    for (let i = explosions.length - 1; i >= 0; i--) {
        let exp = explosions[i];
        drawImageSafe(imgExplosion, exp.x, exp.y, 45, 45, "#E74C3C");
        exp.timer--;
        if (exp.timer <= 0) explosions.splice(i, 1);
    }
    ctx.fillStyle = "#32E0C4"; 
    bullets.forEach(b => ctx.fillRect(b.x, b.y, 4, 12));
    ctx.fillStyle = "#E74C3C"; 
    enemyBullets.forEach(eb => ctx.fillRect(eb.x, eb.y, 4, 12));
}

function gameLoop() {
    if (!gameActive) return;
    update(); draw();
    requestAnimationFrame(gameLoop);
}

function endGame(reason) {
    gameActive = false;
    document.getElementById('game-over-screen').style.display = 'block';
    document.getElementById('final-score').innerText = `PUNTOS: ${score}`;
    const msg = document.getElementById('final-message');

    if (reason === "victory") {
        msg.innerText = "¡FLOTA ALIENÍGENA ENVIADA AL DESGUACE!";
        msg.style.color = "#32E0C4";
        sndVictoria.play().catch(() => {});
    } else if (reason === "invasion") {
        msg.innerText = "¡NOS INVADEN! (Buscaban aparcamiento)";
        msg.style.color = "#FFD700"; // Dorado/Amarillo aviso
        sndDerrota.play().catch(() => {});
    } else if (reason === "death") {
        msg.innerText = "¡HOUSTON, TENEMOS UN PROBLEMA... MUY GORDO!";
        msg.style.color = "#E74C3C";
        sndDerrota.play().catch(() => {});
    }
}