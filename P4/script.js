// --- Datos de configuración actualizados para usar imágenes ---
const pairs = {
    'casa_cama': { 
        w1: { word: 'CASA', img: 'casa.png', type: 'type-b' }, 
        w2: { word: 'CAMA', img: 'cama.png', type: 'type-a' } 
    },
    'pato_gato': { 
        w1: { word: 'PATO', img: 'pato.png', type: 'type-b' }, 
        w2: { word: 'GATO', img: 'gato.png', type: 'type-a' } 
    },
    'queso_beso': { 
        w1: { word: 'QUESO', img: 'queso.png', type: 'type-b' }, 
        w2: { word: 'BESO', img: 'beso.png', type: 'type-a' } 
    },
    'luna_cuna': { 
        w1: { word: 'LUNA', img: 'luna.png', type: 'type-b' }, 
        w2: { word: 'CUNA', img: 'cuna.png', type: 'type-a' } 
    }
};

const levelDistributions = {
    1: [0, 0, 0, 0, 1, 1, 1, 1],
    2: [0, 0, 1, 1, 0, 0, 1, 1],
    3: [0, 1, 0, 1, 0, 1, 0, 1],
    4: [1, 0, 0, 1, 1, 0, 0, 1],
    5: [0, 1, 1, 0, 1, 0, 0, 1] 
};

const speeds = { 1: 1200, 2: 1000, 3: 800, 4: 600, 5: 400 };

let isPlaying = false;
let currentLevel = 1;
let currentPosition = 0;
let timeElapsed = 0;
let gameInterval;
let timerInterval;
let currentDistribution = [];
let currentPair = null;

const selectSequence = document.getElementById('sequence-select');
const selectLevel = document.getElementById('level-select');
const checkLabels = document.getElementById('show-labels');
const btnStart = document.getElementById('btn-start');
const btnStop = document.getElementById('btn-stop');
const btnMusic = document.getElementById('btn-music');
const grid = document.getElementById('game-grid');
const mainMessage = document.getElementById('main-message');
const displayLevel = document.getElementById('display-level');
const displayTime = document.getElementById('display-time');
const displayState = document.getElementById('display-state');
const bgMusic = document.getElementById('bg-music');

function init() {
    renderGrid();
    selectSequence.addEventListener('change', renderGrid);
    checkLabels.addEventListener('change', toggleLabels);
    btnStart.addEventListener('click', startGame);
    btnStop.addEventListener('click', stopGame);
    btnMusic.addEventListener('click', toggleMusic);
}

function renderGrid() {
    grid.innerHTML = '';
    const pairKey = selectSequence.value;
    currentPair = pairs[pairKey];
    
    const lvlToPreview = isPlaying ? currentLevel : parseInt(selectLevel.value);
    currentDistribution = levelDistributions[lvlToPreview];

    currentDistribution.forEach(val => {
        const item = val === 0 ? currentPair.w1 : currentPair.w2;
        const card = document.createElement('div');
        card.className = `card ${item.type}`;
        
        card.innerHTML = `
            <img src="${item.img}" alt="${item.word}" class="card-image">
            <div class="card-label">${item.word}</div>
        `;
        grid.appendChild(card);
    });
    toggleLabels();
}

function toggleLabels() {
    if (checkLabels.checked) {
        grid.classList.remove('hide-labels');
    } else {
        grid.classList.add('hide-labels');
    }
}

function startGame() {
    isPlaying = true;
    currentLevel = parseInt(selectLevel.value);
    timeElapsed = 0;
    
    btnStart.disabled = true;
    btnStop.disabled = false;
    selectSequence.disabled = true;
    selectLevel.disabled = true;

    // --- LÓGICA DE MÚSICA INTELIGENTE ---
    // Solo suena si el texto del botón dice ON
    if (btnMusic.innerText === "Música 🎶​: ON") {
        bgMusic.play().catch(e => console.log("Error al reproducir:", e));
    }
    
    startTimer();
    prepareRound();
}

function stopGame() {
    isPlaying = false;
    clearInterval(gameInterval);
    clearInterval(timerInterval);
    
    btnStart.disabled = false;
    btnStop.disabled = true;
    selectSequence.disabled = false;
    selectLevel.disabled = false;
    
    displayState.innerText = "Detenido";
    mainMessage.innerText = "Partida detenida";
    
    document.querySelectorAll('.card').forEach(c => c.classList.remove('active'));
    bgMusic.pause();
    btnMusic.innerText = "Música 🎶​: OFF";
}

function startTimer() {
    displayTime.innerText = "0.0s";
    timerInterval = setInterval(() => {
        timeElapsed += 0.1;
        displayTime.innerText = timeElapsed.toFixed(1) + "s";
    }, 100);
}

function prepareRound() {
    if (!isPlaying) return;
    
    displayLevel.innerText = `${currentLevel}/5`;
    displayState.innerText = "Preparando...";
    mainMessage.innerText = "¡Prepárate!";
    renderGrid();
    
    setTimeout(() => {
        if (!isPlaying) return;
        playSequence();
    }, 1500); 
}

function playSequence() {
    displayState.innerText = "Jugando";
    currentPosition = 0;
    highlightCard(currentPosition);
    const speed = speeds[currentLevel];
    
    gameInterval = setInterval(() => {
        currentPosition++;
        if (currentPosition >= 8) {
            clearInterval(gameInterval);
            finishRound();
        } else {
            highlightCard(currentPosition);
        }
    }, speed);
}

function highlightCard(index) {
    const cards = document.querySelectorAll('.card');
    cards.forEach(c => c.classList.remove('active'));
    
    if (cards[index]) {
        cards[index].classList.add('active');
        const wordType = currentDistribution[index];
        const expectedWord = wordType === 0 ? currentPair.w1.word : currentPair.w2.word;
        mainMessage.innerText = expectedWord;
    }
}

function finishRound() {
    document.querySelectorAll('.card').forEach(c => c.classList.remove('active'));
    
    if (currentLevel < 5) {
        currentLevel++;
        prepareRound();
    } else {
        stopGame();
        displayState.innerText = "Finalizado";
        mainMessage.innerText = "¡Juego Completado!";
    }
}

function toggleMusic() {
    // Miramos qué pone el botón actualmente
    if (btnMusic.innerText === "Música: OFF") {
        // Si estaba en OFF, lo pasamos a ON
        btnMusic.innerText = "Música: ON";
        // Si el juego ya está en marcha, le damos al play
        if (isPlaying) {
            bgMusic.play().catch(e => console.log("Esperando interacción..."));
        }
    } else {
        // Si estaba en ON, lo pasamos a OFF y pausamos el audio siempre
        btnMusic.innerText = "Música: OFF";
        bgMusic.pause();
    }
}

init();