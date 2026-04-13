// --- Datos de configuración actualizados para usar imágenes ---
const pairs = {
    'casa_cama': { 
        w1: { word: 'CASA', img: 'casa.jpg', type: 'type-b' }, 
        w2: { word: 'CAMA', img: 'cama.avif', type: 'type-a' } 
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
        w1: { word: 'LUNA', img: 'luna.avif', type: 'type-b' }, 
        w2: { word: 'CUNA', img: 'cuna.png', type: 'type-a' } 
    }
};

// ... (el resto de variables como levelDistributions se quedan igual) ...

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
        
        // Aquí cambiamos el div del icono por una etiqueta <img>
        card.innerHTML = `
            <img src="${item.img}" alt="${item.word}" class="card-image">
            <div class="card-label">${item.word}</div>
        `;
        grid.appendChild(card);
    });
    toggleLabels();
}

// 0 representa la primera palabra, 1 representa la segunda. 
// Cada nivel tiene una distribución distinta de las 8 tarjetas.
const levelDistributions = {
    1: [0, 0, 0, 0, 1, 1, 1, 1], // Agrupadas
    2: [0, 0, 1, 1, 0, 0, 1, 1], // Grupos de 2
    3: [0, 1, 0, 1, 0, 1, 0, 1], // Alternas
    4: [1, 0, 0, 1, 1, 0, 0, 1], // Espejo
    5: [0, 1, 1, 0, 1, 0, 0, 1]  // Mezcladas
};

// Velocidades por nivel (milisegundos por tarjeta) - ¡Versión rápida!
const speeds = { 1: 800, 2: 600, 3: 450, 4: 350, 5: 250 };

// --- Variables de estado ---
let isPlaying = false;
let currentLevel = 1;
let currentPosition = 0;
let timeElapsed = 0;
let gameInterval;
let timerInterval;
let currentDistribution = [];
let currentPair = null;

// --- Elementos del DOM ---
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

// --- Inicialización ---
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
    
    // Si no estamos jugando, mostramos la distribución del nivel seleccionado en los controles
    const lvlToPreview = isPlaying ? currentLevel : parseInt(selectLevel.value);
    currentDistribution = levelDistributions[lvlToPreview];

    currentDistribution.forEach(val => {
        const item = val === 0 ? currentPair.w1 : currentPair.w2;
        const card = document.createElement('div');
        card.className = `card ${item.type}`;
        card.innerHTML = `
            <div class="card-icon">${item.icon}</div>
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

// --- Lógica del juego ---
function startGame() {
    isPlaying = true;
    currentLevel = parseInt(selectLevel.value);
    timeElapsed = 0;
    
    // Interfaz
    btnStart.disabled = true;
    btnStop.disabled = false;
    selectSequence.disabled = true;
    selectLevel.disabled = true;
    
    startTimer();
    prepareRound();
}

function stopGame() {
    isPlaying = false;
    clearInterval(gameInterval);
    clearInterval(timerInterval);
    
    // Reiniciar interfaz
    btnStart.disabled = false;
    btnStop.disabled = true;
    selectSequence.disabled = false;
    selectLevel.disabled = false;
    
    displayState.innerText = "Detenido";
    mainMessage.innerText = "Partida detenida";
    
    // Limpiar resaltados
    document.querySelectorAll('.card').forEach(c => c.classList.remove('active'));
    
    // Pausar música si estaba sonando
    bgMusic.pause();
    btnMusic.innerText = "🎵 Música: OFF";
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
    }, 1500); // Breve espera entre rondas
}

function playSequence() {
    displayState.innerText = "Jugando";
    currentPosition = 0;
    
    // Resaltar la primera imagen inmediatamente
    highlightCard(currentPosition);
    
    const speed = speeds[currentLevel];
    
    gameInterval = setInterval(() => {
        currentPosition++;
        
        if (currentPosition >= 8) {
            // Fin de la ronda
            clearInterval(gameInterval);
            finishRound();
        } else {
            // Siguiente paso
            highlightCard(currentPosition);
        }
    }, speed);
}

function highlightCard(index) {
    const cards = document.querySelectorAll('.card');
    cards.forEach(c => c.classList.remove('active'));
    
    if (cards[index]) {
        cards[index].classList.add('active');
        
        // Actualizar el área principal con la palabra esperada
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
        // Fin de la partida
        stopGame();
        displayState.innerText = "Finalizado";
        mainMessage.innerText = "¡Juego Completado!";
    }
}

// --- Música ---
function toggleMusic() {
    if (bgMusic.paused) {
        bgMusic.play();
        btnMusic.innerText = "🎵 Música: ON";
    } else {
        bgMusic.pause();
        btnMusic.innerText = "🎵 Música: OFF";
    }
}

// Arrancar la app
init();