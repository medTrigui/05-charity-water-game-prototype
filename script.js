// Game state variables
const gameState = {
    score: 0,
    peopleServed: 0,
    combo: 0,
    maxCombo: 0,
    timeRemaining: 60,
    isGameActive: false,
    activeCans: new Set(),
    timerInterval: null,
    spawnInterval: null,
    difficulty: 'normal',
    lastMilestoneReached: 0,
    totalCleanWater: 0,
    totalDirtyWater: 0,
    totalStorms: 0
};

// Difficulty settings
const difficulties = {
    easy: {
        spawnInterval: 1000,
        canLifetime: 2000,
        cleanCanProb: 0.9,
        stormProb: 0.05,
        timeLimit: 90
    },
    normal: {
        spawnInterval: 800,
        canLifetime: 1500,
        cleanCanProb: 0.8,
        stormProb: 0.1,
        timeLimit: 60
    },
    hard: {
        spawnInterval: 600,
        canLifetime: 1200,
        cleanCanProb: 0.7,
        stormProb: 0.15,
        timeLimit: 45
    }
};

// Milestone messages
const milestones = [
    { score: 50, message: "Great start! You're making a difference!" },
    { score: 100, message: "Halfway there! Keep going!" },
    { score: 150, message: "Amazing progress! Almost there!" },
    { score: 200, message: "You're a water champion!" }
];

// Sound effects
const sounds = {
    collect: null,
    miss: null,
    storm: null,
    milestone: null,
    gameOver: null
};

// Preload sounds
function preloadSounds() {
    const soundFiles = {
        collect: 'sounds/collect.mp3',
        miss: 'sounds/miss.mp3',
        storm: 'sounds/storm.mp3',
        milestone: 'sounds/milestone.mp3',
        gameOver: 'sounds/game-over.mp3'
    };

    // Create loading message
    const loadingMsg = document.createElement('div');
    loadingMsg.className = 'loading-message';
    loadingMsg.textContent = 'Loading sounds...';
    document.body.appendChild(loadingMsg);

    const promises = [];

    for (const [key, file] of Object.entries(soundFiles)) {
        const audio = new Audio();
        audio.preload = 'auto';
        
        const promise = new Promise((resolve, reject) => {
            audio.addEventListener('canplaythrough', () => resolve());
            audio.addEventListener('error', () => reject());
        });

        audio.src = file;
        sounds[key] = audio;
        promises.push(promise);
    }

    // Wait for all sounds to load
    Promise.all(promises)
        .then(() => {
            loadingMsg.remove();
            console.log('All sounds loaded successfully');
        })
        .catch(error => {
            loadingMsg.textContent = 'Sound loading failed - game will continue without sound';
            setTimeout(() => loadingMsg.remove(), 2000);
            console.error('Sound loading error:', error);
        });
}

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
const POINTS = {
    clean: 10,
    dirty: -5,
    storm: -15
};

// Show floating points animation
function showPoints(cell, points) {
    const pointsDiv = document.createElement('div');
    pointsDiv.className = 'points-popup';
    pointsDiv.textContent = points;
    pointsDiv.style.color = parseInt(points) > 0 ? '#4FCB53' : '#F5402C';
    
    // Position the points relative to the cell
    const cellRect = cell.getBoundingClientRect();
    pointsDiv.style.left = `${cellRect.left + cellRect.width / 2}px`;
    pointsDiv.style.top = `${cellRect.top + cellRect.height / 2}px`;
    
    document.body.appendChild(pointsDiv);
    
    // Remove after animation
    setTimeout(() => {
        pointsDiv.remove();
    }, 1000);
}

// Show milestone message
function showMilestone(message) {
    const milestoneDiv = document.createElement('div');
    milestoneDiv.className = 'milestone-message';
    milestoneDiv.textContent = message;
    document.body.appendChild(milestoneDiv);
    sounds.milestone.play();
    
    setTimeout(() => {
        milestoneDiv.remove();
    }, 2000);
}

// Check for milestones
function checkMilestones() {
    for (const milestone of milestones) {
        if (gameState.score >= milestone.score && gameState.lastMilestoneReached < milestone.score) {
            showMilestone(milestone.message);
            gameState.lastMilestoneReached = milestone.score;
            break;
        }
    }
}

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

// Create element with animation
function createGameElement(type) {
    const element = document.createElement('div');
    element.className = `game-element ${type}`;
    
    // Create water gallon container
    const gallon = document.createElement('div');
    gallon.className = 'water-gallon';
    
    // Add water wave effect
    const waterWave = document.createElement('div');
    waterWave.className = 'water-wave';
    gallon.appendChild(waterWave);

    // Add handle to gallon
    const handle = document.createElement('div');
    handle.className = 'gallon-handle';
    gallon.appendChild(handle);

    // Add cap to gallon
    const cap = document.createElement('div');
    cap.className = 'gallon-cap';
    gallon.appendChild(cap);
    
    element.appendChild(gallon);
    
    // Add splash effect container
    const splash = document.createElement('div');
    splash.className = 'splash-effect';
    for (let i = 0; i < 8; i++) {
        const droplet = document.createElement('div');
        droplet.className = 'droplet';
        splash.appendChild(droplet);
    }
    element.appendChild(splash);
    
    return element;
}

// Spawn a jerry can or storm cloud
function spawnCan() {
    if (!gameState.isGameActive) return;

    // Find empty cells
    const emptyCells = Array.from(elements.gridCells).filter(cell => !cell.hasChildNodes());
    if (emptyCells.length === 0) return;

    // Select random empty cell
    const cell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    
    // Get current difficulty settings
    const currentSettings = difficulties[gameState.difficulty];
    const random = Math.random();
    let type;
    if (random < currentSettings.stormProb) {
        type = 'storm';
    } else if (random < currentSettings.stormProb + currentSettings.cleanCanProb) {
        type = 'clean';
    } else {
        type = 'dirty';
    }
    
    // Create and add element
    const element = createGameElement(type);
    cell.appendChild(element);
    
    // Track active element
    const elementId = Date.now();
    gameState.activeCans.add(elementId);

    // Add appear animation
    element.style.animation = 'elementAppear 0.3s ease-out';

    // Remove element after lifetime
    const settings = difficulties[gameState.difficulty];
    const removeTimeout = setTimeout(() => {
        if (element.parentNode === cell) {
            element.style.animation = 'elementDisappear 0.3s ease-in';
            setTimeout(() => {
                if (element.parentNode === cell) {
                    cell.removeChild(element);
                    gameState.activeCans.delete(elementId);
                    if (type === 'clean') {
                        gameState.combo = 0; // Reset combo if clean can was missed
                        sounds.miss.play();
                    }
                }
            }, 300);
        }
    }, settings.canLifetime);

    // Add click handler
    element.addEventListener('click', () => {
        if (!gameState.isGameActive) return;
        clearTimeout(removeTimeout);
        
        // Try to play sound with error handling
        try {
            const sound = sounds[type === 'clean' ? 'collect' : type === 'dirty' ? 'miss' : 'storm'];
            if (sound.readyState >= 2) {  // Check if sound is loaded
                sound.currentTime = 0;  // Reset sound to start
                sound.play().catch(err => console.log('Sound play failed:', err));
            }
        } catch (err) {
            console.log('Sound error:', err);
        }

        // Add hit animation
        element.style.animation = 'elementHit 0.3s ease-out';
        
        setTimeout(() => {
            if (element.parentNode === cell) {
                cell.removeChild(element);
                gameState.activeCans.delete(elementId);

                // Update score and stats based on type
                switch(type) {
                    case 'clean':
                        // Calculate bonus points based on combo
                        const bonus = Math.min(gameState.combo * 2, 10);
                        const points = POINTS.clean + bonus;
                        gameState.score += points;
                        gameState.combo++;
                        gameState.maxCombo = Math.max(gameState.maxCombo, gameState.combo);
                        gameState.totalCleanWater++;
                        showPoints(cell, `+${points}`);
                        break;
                    case 'dirty':
                        gameState.score = Math.max(0, gameState.score + POINTS.dirty);
                        gameState.combo = 0;
                        gameState.totalDirtyWater++;
                        showPoints(cell, POINTS.dirty.toString());
                        break;
                    case 'storm':
                        gameState.score = Math.max(0, gameState.score + POINTS.storm);
                        gameState.combo = 0;
                        gameState.totalStorms++;
                        showPoints(cell, POINTS.storm.toString());
                        break;
                }

                // Update people served (every 10 points = 1 person)
                gameState.peopleServed = Math.max(0, Math.floor(gameState.score / 10));

                // Check for milestones
                checkMilestones();
                
                // Update display
                updateDisplay();
            }
        }, 300);
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

// Add splash effect on click
function createSplashEffect(element, color) {
    const splash = element.querySelector('.splash-effect');
    splash.style.opacity = '1';
    
    const droplets = splash.querySelectorAll('.droplet');
    droplets.forEach((droplet, i) => {
        const angle = (i / droplets.length) * Math.PI * 2;
        const tx = Math.cos(angle) * 50;
        const ty = Math.sin(angle) * 50;
        
        droplet.style.setProperty('--tx', `${tx}px`);
        droplet.style.setProperty('--ty', `${ty}px`);
        droplet.style.animation = 'splash 0.5s ease-out forwards';
    });
    
    setTimeout(() => {
        splash.style.opacity = '0';
        droplets.forEach(droplet => {
            droplet.style.animation = 'none';
        });
    }, 500);
}

// Initialize game
function initGame() {
    // Preload sounds if not already loaded
    if (!sounds.collect) {
        preloadSounds();
    }

    const difficultySettings = difficulties[gameState.difficulty];
    
    // Reset game state
    gameState.score = 0;
    gameState.peopleServed = 0;
    gameState.combo = 0;
    gameState.maxCombo = 0;
    gameState.timeRemaining = difficultySettings.timeLimit;
    gameState.isGameActive = true;
    gameState.activeCans.clear();
    gameState.lastMilestoneReached = 0;
    gameState.totalCleanWater = 0;
    gameState.totalDirtyWater = 0;
    gameState.totalStorms = 0;

    // Clear any remaining cans
    elements.gridCells.forEach(cell => {
        while (cell.firstChild) {
            cell.removeChild(cell.firstChild);
        }
    });

    // Update display
    updateDisplay();

    // Start spawning cans
    gameState.spawnInterval = setInterval(spawnCan, difficultySettings.spawnInterval);

    // Start timer
    gameState.timerInterval = setInterval(() => {
        gameState.timeRemaining--;
        updateDisplay();

        if (gameState.timeRemaining <= 0) {
            sounds.gameOver.play();
            endGame();
        }
    }, 1000);
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
    clearInterval(gameState.timerInterval);
    clearInterval(gameState.spawnInterval);
    
    // Calculate stats
    const accuracy = Math.round((gameState.totalCleanWater / (gameState.totalCleanWater + gameState.totalDirtyWater + gameState.totalStorms)) * 100) || 0;
    
    // Update final scores
    elements.finalScore.textContent = gameState.score;
    elements.finalPeopleServed.textContent = Math.floor(gameState.score / 10);
    
    // Create detailed stats
    const statsHtml = `
        <div class="game-stats">
            <div class="stat-item">
                <span class="stat-label">Final Score:</span>
                <span class="stat-value">${gameState.score}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">People Served:</span>
                <span class="stat-value">${Math.floor(gameState.score / 10)}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Max Combo:</span>
                <span class="stat-value">×${gameState.maxCombo}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Accuracy:</span>
                <span class="stat-value">${accuracy}%</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Clean Water Collected:</span>
                <span class="stat-value">${gameState.totalCleanWater}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Storms Avoided:</span>
                <span class="stat-value">${gameState.totalStorms}</span>
            </div>
        </div>
    `;
    
    // Update the end screen with stats
    document.querySelector('.final-stats').innerHTML = statsHtml;
    
    // Create confetti for good scores
    if (gameState.score >= 100) {
        createConfetti();
    }
    
    // Show end screen with animation
    showScreen('end');
    
    // Trigger end screen animation
    setTimeout(() => {
        document.querySelector('.game-stats').classList.add('show');
    }, 500);
    
    // Show confetti for high scores (over 200 points)
    if (gameState.score >= 200) {
        createConfetti();
    }
}

// Event Listeners
document.querySelectorAll('.difficulty-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.difficulty-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        gameState.difficulty = btn.dataset.difficulty;
        
        // Update UI to show difficulty settings
        const settings = difficulties[gameState.difficulty];
        const difficultyInfo = document.createElement('div');
        difficultyInfo.className = 'difficulty-info';
        difficultyInfo.innerHTML = `
            <p>Time: ${settings.timeLimit}s</p>
            <p>Clean Water Chance: ${Math.round(settings.cleanCanProb * 100)}%</p>
            <p>Storm Chance: ${Math.round(settings.stormProb * 100)}%</p>
        `;
        
        // Remove any existing info
        const existingInfo = document.querySelector('.difficulty-info');
        if (existingInfo) existingInfo.remove();
        
        // Add new info
        document.querySelector('.difficulty-select').appendChild(difficultyInfo);
    });
});

elements.startButton.addEventListener('click', () => {
    if (!gameState.difficulty) {
        gameState.difficulty = 'normal';
        document.querySelector('[data-difficulty="normal"]').classList.add('selected');
    }
    showScreen('game');
    initGame();
    
    // Play start sound
    sounds.collect.play();
});

// Share button handler
elements.shareButton.addEventListener('click', () => {
    const shareText = `🌊 I just helped ${Math.floor(gameState.score / 10)} people get clean water in Water Quest by charity: water!\n` +
                     `💧 Score: ${gameState.score}\n` +
                     `⭐ Max Combo: ×${gameState.maxCombo}\n` +
                     `Play now and make a difference! https://charitywater.org`;
    
    if (navigator.share) {
        navigator.share({
            title: 'Water Quest Score',
            text: shareText
        }).catch(console.error);
    } else {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(shareText)
            .then(() => {
                alert('Results copied to clipboard!');
            })
            .catch(console.error);
    }
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
