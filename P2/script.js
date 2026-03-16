// Variables de estado del juego
let secretKey = [];
let attempts = 7;
let foundCount = 0;
let timerInterval = null;
let milliseconds = 0;
let isRunning = false;
let gameEnded = false;
// Carga de sonidos (ponlo al principio del archivo)
const clickSound = new Audio('click.mp3');
const boomSound = new Audio('explosion.mp3');
const winSound = new Audio('victoria.mp3');
const startSound = new Audio('start.mp3');
const stopSound = new Audio('stop.mp3');

// Elementos del DOM
const timerDisplay = document.getElementById('timer');
const attemptsDisplay = document.getElementById('attempts-count');
const messageDisplay = document.getElementById('game-message');
const numButtons = document.querySelectorAll('.num-btn');
const btnStart = document.getElementById('btn-start');
const btnStop = document.getElementById('btn-stop');
const btnReset = document.getElementById('btn-reset');

// Inicialización
function init() {
    generateSecretKey();
    setupEventListeners();
}

// Generar clave de 4 dígitos distintos
function generateSecretKey() {
    secretKey = [];
    while (secretKey.length < 4) {
        let r = Math.floor(Math.random() * 10).toString();
        if (!secretKey.includes(r)) secretKey.push(r);
    }
    console.log("Clave secreta (trampa):", secretKey); // Solo para desarrollo
}

// Lógica del Cronómetro
function updateTimer() {
    milliseconds += 10;
    let mins = Math.floor(milliseconds / 60000);
    let secs = Math.floor((milliseconds % 60000) / 1000);
    let cents = Math.floor((milliseconds % 1000) / 10);
    
    timerDisplay.textContent = `${mins}:${secs.toString().padStart(2, '0')}:${cents.toString().padStart(2, '0')}`;
}

function startTimer() {
    if (!isRunning && !gameEnded) {
        isRunning = true;
        timerInterval = setInterval(updateTimer, 10);
    }
}

function stopTimer() {
    isRunning = false;
    clearInterval(timerInterval);
}

// Manejo de pulsación de número
function handleNumberClick(e) {
    if (gameEnded) return;

    clickSound.currentTime = 0;
    clickSound.play();

    // Iniciar cronómetro si es la primera pulsación
    if (!isRunning) {
        startTimer();
        messageDisplay.textContent = "¡Bomba activada! Sigue buscando.";
    }

    const val = e.target.dataset.val;
    e.target.disabled = true; // Desactivar botón visualmente
    attempts--;
    attemptsDisplay.textContent = attempts;

    let foundInThisTurn = false;
    
    // Comprobar si el número está en la clave
    secretKey.forEach((digit, index) => {
        if (digit === val) {
            const box = document.getElementById(`pos-${index}`);
            box.textContent = val;
            box.classList.add('found');
            foundCount++;
            foundInThisTurn = true;
        }
    });

    if (foundInThisTurn) {
        messageDisplay.textContent = `Has acertado el número ${val}. Sigue así.`;
    } else {
        messageDisplay.textContent = `El número ${val} no está en la clave.`;
    }

    // ... viene de la línea 83 (el final del forEach)

    if (foundInThisTurn) {
        messageDisplay.textContent = `Has acertado el número ${val}. Sigue así.`;
    } else {
        // === AQUÍ VA EL EFECTO DE VIBRACIÓN ===
        messageDisplay.textContent = `El número ${val} no está en la clave.`;
        
        const panel = document.querySelector('.display-panel');
        panel.classList.add('vibrate');
        setTimeout(() => panel.classList.remove('vibrate'), 300);
    }

    // Después de esto vendría la función checkGameStatus();

    checkGameStatus();
}

function checkGameStatus() {
    // Victoria
    if (foundCount === 4) {
        endGame(true);
    } 
    // Derrota
    else if (attempts === 0) {
        endGame(false);
    }
}

function endGame(victory) {
    gameEnded = true;
    stopTimer();
    
    if (victory) {
        const timeResult = timerDisplay.textContent;
        const consumed = 7 - attempts;
        messageDisplay.innerHTML = `¡Clave descubierta! Tiempo: ${timeResult} · Intentos consumidos: ${consumed} · Intentos restantes: ${attempts}`;
        messageDisplay.style.color = "#ff00b3";
        winSound.currentTime = 0;
        winSound.play();
        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 }
        });
    } else {
        messageDisplay.textContent = `BOOM. Has agotado los intentos. La clave correcta era ${secretKey.join('')}`;
        messageDisplay.style.color = "#ff4444";
        boomSound.currentTime = 0;
        boomSound.play();
        // Mostrar la clave correcta al perder
        secretKey.forEach((digit, index) => {
            document.getElementById(`pos-${index}`).textContent = digit;
        });
        // Busca donde pones el mensaje de derrota y añade esto:
        document.getElementById('explosion-gif-container').style.display = 'block';}
            
    // Bloquear todos los botones numéricos al terminar
    numButtons.forEach(btn => btn.disabled = true);
}

function resetGame() {
    // Añade esto para que el GIF desaparezca al darle a Reset:
    document.getElementById('explosion-gif-container').style.display = 'none';
    stopTimer();
    milliseconds = 0;
    attempts = 7;
    foundCount = 0;
    gameEnded = false;
    isRunning = false;
    
    // Resetear UI
    timerDisplay.textContent = "0:00:00";
    attemptsDisplay.textContent = attempts;
    messageDisplay.textContent = "Nueva partida preparada. Pulsa Start o un número para comenzar.";
    messageDisplay.style.color = "#ff00b3";
    
    numButtons.forEach(btn => {
        btn.disabled = false;
    });

    for (let i = 0; i < 4; i++) {
        const box = document.getElementById(`pos-${i}`);
        box.textContent = "*";
        box.classList.remove('found');
    }

    generateSecretKey();
}

// Configurar eventos
function setupEventListeners() {
    numButtons.forEach(btn => {
        btn.addEventListener('click', handleNumberClick);
    });

    btnStart.addEventListener('click', () => {
        startSound.currentTime = 0;
        startSound.play();

        if (!gameEnded) {
            startTimer();
            messageDisplay.textContent = "Cronómetro en marcha...";
        }
    });

    btnStop.addEventListener('click', () => {
        stopSound.currentTime = 0;
        stopSound.play();
        stopTimer();
        if (!gameEnded) messageDisplay.textContent = "Cronómetro detenido.";
    });

    btnReset.addEventListener('click', resetGame);
}

// Ejecutar al cargar
init();