// Game state variables
const gameState = {
    score: 0,
    peopleServed: 0,
    combo: 0,
    timeRemaining: 60,
    isGameActive: false,
    activeCans: new Set(),
    timerInterval: null,
    spawnInterval: null
};

// DOM Elements
const screens = {
    start: document.getElementById('start-screen'),
    game: document.getElementById('game-screen'),
    end: document.getElementById('end-screen')
};

const elements = {
    score: document.getElementById('score'),
    peopleServed: document.getElementById('people-served'),
    timer: document.getElementById('timer'),
    combo: document.getElementById('combo'),
    finalScore: document.getElementById('final-score'),
    finalPeopleServed: document.getElementById('final-people-served'),
    startButton: document.getElementById('start-button'),
    playAgainButton: document.getElementById('play-again'),
    shareButton: document.getElementById('share'),
    resetButton: document.getElementById('reset-button'),
    gridCells: document.querySelectorAll('.grid-cell')
};

// Game Constants
const SPAWN_INTERVAL = 800; // milliseconds
const CAN_LIFETIME = 1500; // milliseconds
const CLEAN_CAN_PROBABILITY = 0.8; // 80% chance for clean water cans
const STORM_PROBABILITY = 0.1; // 10% chance for storm clouds
const POINTS = {
    clean: 10,
    dirty: -5,
    storm: -15
};

// Show specific screen and hide others
function showScreen(screenId) {
    Object.values(screens).forEach(screen => {
        screen.classList.remove('active');
    });
    screens[screenId].classList.add('active');
}

// Update display elements
function updateDisplay() {
    elements.score.textContent = gameState.score;
    elements.peopleServed.textContent = Math.floor(gameState.score / 10);
    elements.combo.textContent = gameState.combo;
    elements.timer.textContent = gameState.timeRemaining;
}

// Create confetti effect
function createConfetti() {
    const confettiContainer = document.createElement('div');
    confettiContainer.className = 'confetti-container';
    document.body.appendChild(confettiContainer);

    // Create multiple confetti pieces
    for (let i = 0; i < 100; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.backgroundColor = ['#FFC907', '#2E9DF7', '#8BD1CB', '#4FCB53'][Math.floor(Math.random() * 4)];
        confetti.style.animation = `confettiFall ${1 + Math.random() * 2}s linear forwards`;
        confettiContainer.appendChild(confetti);
    }

    // Remove container after animation
    setTimeout(() => {
        document.body.removeChild(confettiContainer);
    }, 3000);
}

// Spawn a jerry can or storm cloud
function spawnCan() {
    if (!gameState.isGameActive) return;

    // Find empty cells
    const emptyCells = Array.from(elements.gridCells).filter(cell => !cell.hasChildNodes());
    if (emptyCells.length === 0) return;

    // Select random empty cell
    const cell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    
    // Determine spawn type
    const random = Math.random();
    let type;
    if (random < STORM_PROBABILITY) {
        type = 'storm';
    } else if (random < STORM_PROBABILITY + CLEAN_CAN_PROBABILITY) {
        type = 'clean';
    } else {
        type = 'dirty';
    }
    
    // Create element
    const element = document.createElement('div');
    element.className = type === 'storm' ? 'storm-cloud' : 'jerry-can';
    if (type === 'clean') element.classList.add('yellow');
    if (type === 'dirty') element.classList.add('brown');
    
    // Add element to cell
    cell.appendChild(element);
    
    // Track active element
    const elementId = Date.now();
    gameState.activeCans.add(elementId);

    // Remove element after lifetime
    setTimeout(() => {
        if (element.parentNode === cell) {
            cell.removeChild(element);
            gameState.activeCans.delete(elementId);
            if (type === 'clean') gameState.combo = 0; // Reset combo if clean can was missed
        }
    }, CAN_LIFETIME);

    // Add click handler
    element.addEventListener('click', () => {
        // Remove element
        cell.removeChild(element);
        gameState.activeCans.delete(elementId);

        // Update score based on type
        switch(type) {
            case 'clean':
                // Calculate bonus points based on combo
                const bonus = Math.min(gameState.combo * 2, 10);
                gameState.score += POINTS.clean + bonus;
                gameState.combo++;
                break;
            case 'dirty':
                gameState.score = Math.max(0, gameState.score + POINTS.dirty);
                gameState.combo = 0;
                break;
            case 'storm':
                gameState.score = Math.max(0, gameState.score + POINTS.storm);
                gameState.combo = 0;
                break;
        }

        updateDisplay();
    });
}

// Start game timer
function startTimer() {
    gameState.timerInterval = setInterval(() => {
        gameState.timeRemaining--;
        elements.timer.textContent = gameState.timeRemaining;

        if (gameState.timeRemaining <= 0) {
            clearInterval(gameState.timerInterval);
            endGame();
        }
    }, 1000);
}

// Initialize game
function initGame() {
    // Reset game state
    gameState.score = 0;
    gameState.peopleServed = 0;
    gameState.combo = 0;
    gameState.timeRemaining = 60;
    gameState.isGameActive = true;
    gameState.activeCans.clear();

    // Clear any remaining cans
    elements.gridCells.forEach(cell => {
        while (cell.firstChild) {
            cell.removeChild(cell.firstChild);
        }
    });

    // Update display
    updateDisplay();

    // Start spawning cans
    gameState.spawnInterval = setInterval(() => {
        if (!gameState.isGameActive) {
            clearInterval(gameState.spawnInterval);
            return;
        }
        spawnCan();
    }, SPAWN_INTERVAL);

    // Start timer
    startTimer();
}

// Reset game
function resetGame() {
    // Clear intervals
    if (gameState.timerInterval) clearInterval(gameState.timerInterval);
    if (gameState.spawnInterval) clearInterval(gameState.spawnInterval);
    
    // Reset game state
    gameState.isGameActive = false;
    
    // Clear grid
    elements.gridCells.forEach(cell => {
        while (cell.firstChild) {
            cell.removeChild(cell.firstChild);
        }
    });
    
    // Show start screen
    showScreen('start');
}

// End game
function endGame() {
    gameState.isGameActive = false;
    
    // Update final scores
    elements.finalScore.textContent = gameState.score;
    elements.finalPeopleServed.textContent = Math.floor(gameState.score / 10);
    
    // Show end screen
    showScreen('end');
    
    // Show confetti for high scores (over 200 points)
    if (gameState.score >= 200) {
        createConfetti();
    }
}

// Event Listeners
elements.startButton.addEventListener('click', () => {
    showScreen('game');
    initGame();
});

elements.playAgainButton.addEventListener('click', () => {
    showScreen('game');
    initGame();
});

elements.shareButton.addEventListener('click', () => {
    const text = `I helped provide clean water to ${Math.floor(gameState.score / 10)} people in Water Quest! Play now and make a difference! #charitywater`;
    
    if (navigator.share) {
        navigator.share({
            title: 'Water Quest',
            text: text,
            url: window.location.href
        }).catch(console.error);
    } else {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(text)
            .then(() => alert('Share text copied to clipboard!'))
            .catch(console.error);
    }
});

// Add reset button handler
elements.resetButton.addEventListener('click', resetGame);
