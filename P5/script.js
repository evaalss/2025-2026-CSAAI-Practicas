document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const uiLayer = document.getElementById('ui-layer');
    const menuScreen = document.getElementById('menu-screen');
    const messageScreen = document.getElementById('message-screen');
    const overlayText = document.getElementById('overlay-text');
    const gameOverControls = document.getElementById('game-over-controls');
    const scoreDisplay = document.getElementById('score-display');
    const scorePlayerEl = document.getElementById('score-player');
    const scoreBotEl = document.getElementById('score-bot');
    const modeDisplay = document.getElementById('mode-display');

    // --- Sistema de Audio ---
    const bgMusic = new Audio('principio.mp3');
    bgMusic.loop = true;
    const winSound = new Audio('victoria.mp3');
    const loseSound = new Audio('derrota.mp3');
    const tieSound = new Audio('empate.mp3');
    const countdownSound = new Audio('cuenta_atras.mp3');
    const goalSound = new Audio('gol.mp3');

    const startMenuMusic = () => {
        if (currentState === STATES.MENU && bgMusic.paused) {
            bgMusic.play().catch(() => {});
        }
    };
    document.addEventListener('keydown', startMenuMusic, {once: true});
    document.addEventListener('touchstart', startMenuMusic, {once: true});
    document.addEventListener('click', startMenuMusic, {once: true});

    const timerDisplay = document.createElement('div');
    timerDisplay.style.fontSize = '1.5rem';
    timerDisplay.style.fontWeight = 'bold';
    timerDisplay.style.color = '#ffffff';
    timerDisplay.style.marginTop = '10px';
    timerDisplay.style.textShadow = '2px 2px 4px rgba(0,0,0,0.6)';
    timerDisplay.textContent = "00:00";
    scoreDisplay.appendChild(timerDisplay);

    const STATES = { MENU: 0, COUNTDOWN: 1, PLAYING: 2, GOAL: 3, GAMEOVER: 4 };
    let currentState = STATES.MENU;
    let gameMode = 1; 
    let scores = { player: 0, bot: 0 };
    let countdownValue = 3;
    let countdownTimer = 0;

    let lastFrameTime = Date.now();
    let matchSeconds = 0;
    let matchTimeCounter = 0;

    const FIELD = { width: 800, height: 500, margin: 40 };
    const GOAL_HEIGHT = 140;
    const GOAL_WIDTH = 40;
    const GOAL_TOP = (FIELD.height - GOAL_HEIGHT) / 2;
    const GOAL_BOTTOM = GOAL_TOP + GOAL_HEIGHT;

    let player = { x: 200, y: 150, r: 18, color: '#2b78e4', angle: 0, speed: 4 };
    let teammate = { x: 200, y: 350, r: 18, color: '#4fc3f7', speed: 2 };
    let ball = { x: 400, y: 250, r: 10, color: '#ffffff', vx: 0, vy: 0, friction: 0.97 };
    let bots = [
        { x: 600, y: 150, r: 18, color: '#cc3333', speed: 2 },
        { x: 600, y: 350, r: 18, color: '#cc3333', speed: 2.2 }
    ];

    // --- Controladores (Teclado y Táctil) ---
    const keys = {};
    window.addEventListener('keydown', (e) => keys[e.key] = true);
    window.addEventListener('keyup', (e) => keys[e.key] = false);

    // Mapear los botones del móvil para que actúen como el teclado
    const bindTouch = (id, keyName) => {
        const btn = document.getElementById(id);
        if(!btn) return;
        const press = (e) => { e.preventDefault(); keys[keyName] = true; };
        const release = (e) => { e.preventDefault(); keys[keyName] = false; };
        btn.addEventListener('touchstart', press, {passive: false});
        btn.addEventListener('touchend', release, {passive: false});
        btn.addEventListener('mousedown', press);
        btn.addEventListener('mouseup', release);
        btn.addEventListener('mouseleave', release);
    };

    bindTouch('btn-up', 'ArrowUp');
    bindTouch('btn-down', 'ArrowDown');
    bindTouch('btn-left', 'ArrowLeft');
    bindTouch('btn-right', 'ArrowRight');
    bindTouch('btn-rot-left', 'a');
    bindTouch('btn-rot-right', 'd');
    bindTouch('btn-shoot', ' ');

    // --- Lógica del Menú Táctil ---
    document.querySelectorAll('.btn-modo').forEach(btn => {
        btn.addEventListener('click', (e) => {
            let mode = parseInt(e.target.dataset.mode);
            startGame(mode);
        });
    });

    document.getElementById('btn-restart').addEventListener('click', () => {
        if(currentState === STATES.GAMEOVER) startGame(gameMode);
    });

    document.getElementById('btn-menu').addEventListener('click', () => {
        if(currentState === STATES.GAMEOVER) {
            currentState = STATES.MENU;
            confetti = [];
            uiLayer.classList.remove('hidden');
            menuScreen.classList.remove('hidden');
            messageScreen.classList.add('hidden');
            scoreDisplay.classList.add('hidden');
            
            winSound.pause(); loseSound.pause(); tieSound.pause(); goalSound.pause();
            bgMusic.currentTime = 0;
            bgMusic.play().catch(() => {});
        }
    });

    // --- Sistema de Partículas ---
    let confetti = [];
    const confettiColors = ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50', '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800', '#ff5722'];

    class ConfettiParticle {
        constructor() {
            this.x = canvas.width / 2; this.y = canvas.height / 2;
            this.size = Math.random() * 8 + 4;
            this.color = confettiColors[Math.floor(Math.random() * confettiColors.length)];
            this.speedX = (Math.random() - 0.5) * 15; this.speedY = (Math.random() - 0.5) * 15 - 5;
            this.gravity = 0.2; this.opacity = 1;
        }
        update() {
            this.speedY += this.gravity; this.x += this.speedX; this.y += this.speedY; this.opacity -= 0.01;
        }
        draw() {
            ctx.fillStyle = this.color; ctx.globalAlpha = this.opacity;
            ctx.fillRect(this.x, this.y, this.size, this.size); ctx.globalAlpha = 1;
        }
    }

    function triggerConfetti() {
        confetti = [];
        for (let i = 0; i < 300; i++) { confetti.push(new ConfettiParticle()); }
    }

    function updateConfetti() {
        for (let i = confetti.length - 1; i >= 0; i--) {
            confetti[i].update();
            if (confetti[i].opacity <= 0) { confetti.splice(i, 1); }
        }
    }

    function drawConfetti() { confetti.forEach(particle => particle.draw()); }

    function updateTimerUI() {
        let m = Math.floor(matchSeconds / 60).toString().padStart(2, '0');
        let s = (matchSeconds % 60).toString().padStart(2, '0');
        timerDisplay.textContent = m + ":" + s;
    }

    function resetPositions() {
        player.x = 200; player.y = 150; player.angle = 0;
        teammate.x = 200; teammate.y = 350;
        bots[0].x = 600; bots[0].y = 150;
        bots[1].x = 600; bots[1].y = 350;
        ball.x = 400; ball.y = 250; ball.vx = 0; ball.vy = 0;
    }

    function startGame(mode) {
        gameMode = mode; 
        scores = { player: 0, bot: 0 }; 
        matchTimeCounter = 0; 
        confetti = []; 
        
        bgMusic.pause(); bgMusic.currentTime = 0;
        winSound.pause(); winSound.currentTime = 0;
        loseSound.pause(); loseSound.currentTime = 0;
        tieSound.pause(); tieSound.currentTime = 0;
        goalSound.pause(); goalSound.currentTime = 0;

        matchSeconds = (gameMode === 3) ? 30 : 0;
        const modeNames = { 1: "A 3 goles", 2: "Gol de oro", 3: "Tiempo (30s)" };
        modeDisplay.textContent = modeNames[mode];
        
        updateScoreUI(); updateTimerUI();
        scoreDisplay.classList.remove('hidden'); menuScreen.classList.add('hidden');
        resetPositions(); startCountdown();
    }

    function startCountdown() {
        currentState = STATES.COUNTDOWN; uiLayer.style.background = "rgba(0,0,0,0.5)";
        uiLayer.classList.remove('hidden'); messageScreen.classList.remove('hidden');
        gameOverControls.classList.add('hidden'); countdownValue = 3;
        overlayText.textContent = countdownValue; countdownTimer = Date.now(); lastFrameTime = Date.now();
        countdownSound.currentTime = 0; countdownSound.play().catch(() => {});
    }

    function handleGoal(scorer) {
        currentState = STATES.GOAL;
        scorer === 'player' ? scores.player++ : scores.bot++;
        updateScoreUI();
        uiLayer.classList.remove('hidden'); overlayText.textContent = scorer === 'player' ? "¡GOOOL!" : "¡Gol rival!";
        
        goalSound.currentTime = 0; goalSound.play().catch(() => {});

        setTimeout(() => {
            if (checkWinCondition()) { endGame(scores.player > scores.bot, scores.player === scores.bot); }
            else { resetPositions(); startCountdown(); }
        }, 2000);
    }

    function checkWinCondition() {
        if (gameMode === 1 && (scores.player >= 3 || scores.bot >= 3)) return true;
        if (gameMode === 2 && (scores.player >= 1 || scores.bot >= 1)) return true;
        return false;
    }

    function endGame(playerWon, isTie = false) {
        currentState = STATES.GAMEOVER; uiLayer.style.background = "rgba(0,0,0,0.8)";
        countdownSound.pause(); bgMusic.pause(); goalSound.pause();
        
        if (isTie) {
            overlayText.textContent = "¡Empate!";
            tieSound.currentTime = 0; tieSound.play().catch(() => {});
        } else {
            overlayText.textContent = playerWon ? "¡Has ganado!" : "¡Has perdido!";
            if (playerWon) {
                triggerConfetti();
                winSound.currentTime = 0; winSound.play().catch(() => {});
            } else {
                loseSound.currentTime = 0; loseSound.play().catch(() => {});
            }
        }
        
        uiLayer.classList.remove('hidden'); messageScreen.classList.remove('hidden');
        gameOverControls.classList.remove('hidden');
    }

    function updateScoreUI() { scorePlayerEl.textContent = scores.player; scoreBotEl.textContent = scores.bot; }

    function applyBotLogic(entity, allChars) {
        let minDist = Math.hypot(ball.x - entity.x, ball.y - entity.y);
        let angleToBall = Math.atan2(ball.y - entity.y, ball.x - entity.x);
        
        if (minDist > entity.r + ball.r - 2) { 
            entity.x += Math.cos(angleToBall) * entity.speed; 
            entity.y += Math.sin(angleToBall) * entity.speed; 
        }
        
        allChars.forEach(other => {
            if (other !== entity) {
                let d = Math.hypot(other.x - entity.x, other.y - entity.y);
                let colDist = entity.r + other.r;
                if (d < colDist && d > 0) {
                    let anglePush = Math.atan2(entity.y - other.y, entity.x - other.x);
                    let overlap = colDist - d;
                    entity.x += Math.cos(anglePush) * overlap * 0.2; 
                    entity.y += Math.sin(anglePush) * overlap * 0.2;
                }
            }
        });
        
        entity.x = Math.max(FIELD.margin + entity.r, Math.min(FIELD.width - FIELD.margin - entity.r, entity.x));
        entity.y = Math.max(FIELD.margin + entity.r, Math.min(FIELD.height - FIELD.margin - entity.r, entity.y));
        
        if (minDist < entity.r + ball.r) { 
            ball.vx += Math.cos(angleToBall) * 2; 
            ball.vy += Math.sin(angleToBall) * 2; 
        }
    }

    function update() {
        let now = Date.now(); let dt = now - lastFrameTime; lastFrameTime = now;
        if (dt > 100) dt = 16; 
        
        // El control por teclado del menú sigue activo para quien juegue en PC
        if (currentState === STATES.MENU) { 
            if (keys['1']) startGame(1); if (keys['2']) startGame(2); if (keys['3']) startGame(3); return; 
        }
        
        if (currentState === STATES.GAMEOVER) { 
            if (scores.player > scores.bot) updateConfetti(); 
            if (keys['r'] || keys['R']) startGame(gameMode); 
            if (keys['m'] || keys['M']) document.getElementById('btn-menu').click(); 
            return; 
        }
        
        if (currentState === STATES.COUNTDOWN) {
            if (Date.now() - countdownTimer > 1000) { countdownValue--; countdownTimer = Date.now(); overlayText.textContent = countdownValue > 0 ? countdownValue : "¡YA!"; }
            if (countdownValue < 0) { currentState = STATES.PLAYING; uiLayer.classList.add('hidden'); }
            return;
        }
        
        if (currentState !== STATES.PLAYING) return;
        
        matchTimeCounter += dt;
        if (matchTimeCounter >= 1000) {
            let passedSeconds = Math.floor(matchTimeCounter / 1000);
            matchTimeCounter %= 1000; 
            if (gameMode === 3) {
                matchSeconds -= passedSeconds;
                if (matchSeconds <= 0) {
                    matchSeconds = 0; updateTimerUI();
                    endGame(scores.player > scores.bot, scores.player === scores.bot); return;
                }
            } else { matchSeconds += passedSeconds; }
            updateTimerUI();
        }
        
        if (keys['ArrowUp']) player.y -= player.speed; if (keys['ArrowDown']) player.y += player.speed;
        if (keys['ArrowLeft']) player.x -= player.speed; if (keys['ArrowRight']) player.x += player.speed;
        if (keys['a'] || keys['A']) player.angle -= 0.08; if (keys['d'] || keys['D']) player.angle += 0.08;
        
        player.x = Math.max(FIELD.margin + player.r, Math.min(FIELD.width - FIELD.margin - player.r, player.x));
        player.y = Math.max(FIELD.margin + player.r, Math.min(FIELD.height - FIELD.margin - player.r, player.y));
        
        let distPlayerBall = Math.hypot(ball.x - player.x, ball.y - player.y);
        if (keys[' '] && distPlayerBall < player.r + ball.r + 15) { 
            ball.vx = Math.cos(player.angle) * 12; ball.vy = Math.sin(player.angle) * 12; 
        } else if (distPlayerBall < player.r + ball.r) { 
            let a = Math.atan2(ball.y - player.y, ball.x - player.x); 
            ball.vx += Math.cos(a) * 1.5; ball.vy += Math.sin(a) * 1.5; 
        }
        
        ball.x += ball.vx; ball.y += ball.vy; ball.vx *= ball.friction; ball.vy *= ball.friction;
        
        if (ball.y - ball.r < FIELD.margin) { ball.y = FIELD.margin + ball.r; ball.vy *= -1; }
        if (ball.y + ball.r > FIELD.height - FIELD.margin) { ball.y = FIELD.height - FIELD.margin - ball.r; ball.vy *= -1; }
        
        if (ball.x - ball.r < FIELD.margin) {
            if (ball.y > GOAL_TOP && ball.y < GOAL_BOTTOM) {
                if (ball.x - ball.r < FIELD.margin - GOAL_WIDTH) { ball.x = FIELD.margin - GOAL_WIDTH + ball.r; ball.vx *= -1; }
                if (currentState === STATES.PLAYING && ball.x < FIELD.margin) { handleGoal('bot'); }
            } else { ball.x = FIELD.margin + ball.r; ball.vx *= -1; }
        } else if (ball.x + ball.r > FIELD.width - FIELD.margin) {
            if (ball.y > GOAL_TOP && ball.y < GOAL_BOTTOM) {
                if (ball.x + ball.r > FIELD.width - FIELD.margin + GOAL_WIDTH) { ball.x = FIELD.width - FIELD.margin + GOAL_WIDTH - ball.r; ball.vx *= -1; }
                if (currentState === STATES.PLAYING && ball.x > FIELD.width - FIELD.margin) { handleGoal('player'); }
            } else { ball.x = FIELD.width - FIELD.margin - ball.r; ball.vx *= -1; }
        }
        
        let allChars = [player, teammate, ...bots]; 
        applyBotLogic(teammate, allChars); bots.forEach(bot => applyBotLogic(bot, allChars));
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3; ctx.strokeRect(FIELD.margin, FIELD.margin, FIELD.width - FIELD.margin * 2, FIELD.height - FIELD.margin * 2);
        ctx.beginPath(); ctx.moveTo(FIELD.width / 2, FIELD.margin); ctx.lineTo(FIELD.width / 2, FIELD.height - FIELD.margin); ctx.stroke();
        ctx.beginPath(); ctx.arc(FIELD.width / 2, FIELD.height / 2, 50, 0, Math.PI * 2); ctx.stroke();
        
        const penaltyBoxWidth = 120; const penaltyBoxHeight = 260; const goalBoxWidth = 45; const goalBoxHeight = 110;
        ctx.strokeRect(FIELD.margin, (FIELD.height - penaltyBoxHeight) / 2, penaltyBoxWidth, penaltyBoxHeight); 
        ctx.strokeRect(FIELD.margin, (FIELD.height - goalBoxHeight) / 2, goalBoxWidth, goalBoxHeight); 
        ctx.strokeRect(FIELD.width - FIELD.margin - penaltyBoxWidth, (FIELD.height - penaltyBoxHeight) / 2, penaltyBoxWidth, penaltyBoxHeight); 
        ctx.strokeRect(FIELD.width - FIELD.margin - goalBoxWidth, (FIELD.height - goalBoxHeight) / 2, goalBoxWidth, goalBoxHeight); 
        
        ctx.fillStyle = '#999999'; ctx.fillRect(FIELD.margin - GOAL_WIDTH, GOAL_TOP, GOAL_WIDTH, GOAL_HEIGHT); ctx.fillRect(FIELD.width - FIELD.margin, GOAL_TOP, GOAL_WIDTH, GOAL_HEIGHT);
        
        ctx.fillStyle = teammate.color; ctx.beginPath(); ctx.arc(teammate.x, teammate.y, teammate.r, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#ffffff'; ctx.stroke(); 
        ctx.fillStyle = player.color; ctx.beginPath(); ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#ffffff'; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(player.x + Math.cos(player.angle) * player.r, player.y + Math.sin(player.angle) * player.r); ctx.lineTo(player.x + Math.cos(player.angle) * (player.r + 10), player.y + Math.sin(player.angle) * (player.r + 10)); ctx.lineWidth = 4; ctx.stroke();
        
        bots.forEach(bot => { ctx.fillStyle = bot.color; ctx.beginPath(); ctx.arc(bot.x, bot.y, bot.r, 0, Math.PI * 2); ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = '#ffffff'; ctx.stroke(); });
        ctx.fillStyle = ball.color; ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#000000'; ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.r - 4, 0, Math.PI * 2); ctx.fill(); 
        
        if (confetti.length > 0) drawConfetti();
    }
    
    function gameLoop() { update(); draw(); requestAnimationFrame(gameLoop); }
    gameLoop();
});