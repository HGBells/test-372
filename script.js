// Constants for click regeneration
const INITIAL_CLICKS = 372; // Max clicks and initial clicks granted at the start
const CLICK_REGEN_INTERVAL_MS = 4000; // Regenerate every 4 seconds
const CLICKS_PER_REGEN_TICK = 1; // 1 click regenerated per tick

// Game state object
let game = {
    currentClicks: INITIAL_CLICKS,
    total372Pages: 0,
    lastUpdateTime: Date.now(),
    resources: {
        rp1: 0, // Ready Player One: 80s Nostalgia Bits
        armada: 0, // Armada: Gamer Logic Bytes
        eyeofargon: 0, // The Eye of Argon: Purple Prose Blobs
        uglylove: 0, // Ugly Love: Troubled Romance Tokens
    },
    upgradeLevels: {
        rp1: 0,
        armada: 0,
        eyeofargon: 0,
        uglylove: 0,
    },
    // Base generation rates (per click)
    baseRates: {
        rp1: 1,
        armada: 1,
        eyeofargon: 1,
        uglylove: 1,
    },
    // Conversion costs and output for 372 Pages
    conversionRates: {
        rp1: { cost: 10, output: 1 },
        armada: { cost: 15, output: 1 },
        eyeofargon: { cost: 5, output: 1 },
        uglylove: { cost: 20, output: 1 },
    },
    // Upgrade costs and effects
    upgradeDetails: {
        rp1: { cost: 10, effect: 1 },
        armada: { cost: 50, passiveRate: 1, passiveInterval: 5000 },
        eyeofargon: { cost: 15, effect: 1 },
        uglylove: { cost: 75, passiveRate: 1, passiveInterval: 10000 },
    }
};

// --- DOM Elements ---
const clicksRemainingSpan = document.getElementById('clicks-remaining');
const total372PagesSpan = document.getElementById('total-372-pages');
const gameModal = document.getElementById('game-modal');
const modalMessage = document.getElementById('modal-message');
const modalCloseBtn = document.getElementById('modal-close');

// Book-specific elements
const bookElements = {
    rp1: {
        resourceSpan: document.getElementById('rp1-resource'),
        readBtn: document.getElementById('read-rp1'),
        convertBtn: document.getElementById('convert-rp1'),
    },
    armada: {
        resourceSpan: document.getElementById('armada-resource'),
        readBtn: document.getElementById('read-armada'),
        convertBtn: document.getElementById('convert-armada'),
    },
    eyeofargon: {
        resourceSpan: document.getElementById('eyeofargon-resource'),
        readBtn: document.getElementById('read-eyeofargon'),
        convertBtn: document.getElementById('convert-eyeofargon'),
    },
    uglylove: {
        resourceSpan: document.getElementById('uglylove-resource'),
        readBtn: document.getElementById('read-uglylove'),
        convertBtn: document.getElementById('convert-uglylove'),
    },
};

// Upgrade-specific elements
const upgradeElements = {
    rp1: {
        levelSpan: document.getElementById('upgrade-rp1-level'),
        buyBtn: document.getElementById('buy-upgrade-rp1'),
    },
    armada: {
        levelSpan: document.getElementById('upgrade-armada-level'),
        buyBtn: document.getElementById('buy-upgrade-armada'),
    },
    eyeofargon: {
        levelSpan: document.getElementById('upgrade-eyeofargon-level'),
        buyBtn: document.getElementById('buy-upgrade-eyeofargon'),
    },
    uglylove: {
        levelSpan: document.getElementById('upgrade-uglylove-level'),
        buyBtn: document.getElementById('buy-upgrade-uglylove'),
    },
};

// --- Utility Functions ---

/**
 * Displays a custom modal message to the user.
 * @param {string} message - The message to display.
 */
function showModal(message) {
    modalMessage.textContent = message;
    gameModal.classList.remove('hidden');
}

/**
 * Hides the custom modal.
 */
function hideModal() {
    gameModal.classList.add('hidden');
}

/**
 * Saves the current game state to local storage.
 */
function saveGame() {
    try {
        game.lastUpdateTime = Date.now(); // Update timestamp before saving
        localStorage.setItem('372pagesGame', JSON.stringify(game));
    } catch (e) {
        console.error("Error saving game to localStorage:", e);
        showModal("Error saving game! Please ensure your browser allows local storage.");
    }
}

/**
 * Loads the game state from local storage.
 */
function loadGame() {
    try {
        const savedGame = localStorage.getItem('372pagesGame');
        if (savedGame) {
            game = JSON.parse(savedGame);
            // Calculate offline click regeneration
            const now = Date.now();
            const timeElapsedMs = now - (game.lastUpdateTime || now); // Handle first load case if lastUpdateTime is missing
            const offlineClicksGenerated = Math.floor((timeElapsedMs / CLICK_REGEN_INTERVAL_MS) * CLICKS_PER_REGEN_TICK);
            // Only add offline clicks if currentClicks are below INITIAL_CLICKS
            if (game.currentClicks < INITIAL_CLICKS) {
                game.currentClicks = Math.min(INITIAL_CLICKS, game.currentClicks + offlineClicksGenerated);
            }
            game.lastUpdateTime = now; // Update timestamp
        } else {
            // Initialize game if no saved game
            game.currentClicks = INITIAL_CLICKS;
            game.lastUpdateTime = Date.now();
        }
    } catch (e) {
        console.error("Error loading game from localStorage:", e);
        showModal("Error loading game! Starting a new game.");
        game.currentClicks = INITIAL_CLICKS; // Initialize fresh game
        game.lastUpdateTime = Date.now();
    }
    // Ensure clicks don't go negative or above max on load if saved in a weird state
    game.currentClicks = Math.min(INITIAL_CLICKS, Math.max(0, game.currentClicks));
    saveGame(); // Save initial or loaded state
}

/**
 * Updates all displayed game information on the UI.
 */
function updateUI() {
    clicksRemainingSpan.textContent = game.currentClicks;
    total372PagesSpan.textContent = game.total372Pages;

    // Update book resources and button states
    for (const bookId in bookElements) {
        if (bookElements.hasOwnProperty(bookId)) {
            bookElements[bookId].resourceSpan.textContent = game.resources[bookId];

            // Enable/disable read buttons based on clicks remaining
            if (game.currentClicks <= 0) {
                bookElements[bookId].readBtn.classList.add('button-disabled');
                bookElements[bookId].readBtn.disabled = true;
            } else {
                bookElements[bookId].readBtn.classList.remove('button-disabled');
                bookElements[bookId].readBtn.disabled = false;
            }

            // Enable/disable convert buttons based on resources
            const conversionCost = game.conversionRates[bookId].cost;
            if (game.resources[bookId] < conversionCost) {
                bookElements[bookId].convertBtn.classList.add('button-disabled');
                bookElements[bookId].convertBtn.disabled = true;
            } else {
                bookElements[bookId].convertBtn.classList.remove('button-disabled');
                bookElements[bookId].convertBtn.disabled = false;
            }
        }
    }

    // Update upgrade levels and button states
    for (const upgradeId in upgradeElements) {
        if (upgradeElements.hasOwnProperty(upgradeId)) {
            upgradeElements[upgradeId].levelSpan.textContent = game.upgradeLevels[upgradeId];

            const upgradeCost = game.upgradeDetails[upgradeId].cost;
            if (game.total372Pages < upgradeCost) {
                upgradeElements[upgradeId].buyBtn.classList.add('button-disabled');
                upgradeElements[upgradeId].buyBtn.disabled = true;
            } else {
                upgradeElements[upgradeId].buyBtn.classList.remove('button-disabled');
                upgradeElements[upgradeId].buyBtn.disabled = false;
            }
        }
    }
    saveGame(); // Save game state after every UI update
}

// --- Core Game Logic Functions ---

/**
 * Handles a 'read' click for a specific book.
 * @param {string} bookId - The ID of the book being read (e.g., 'rp1').
 */
function readBook(bookId) {
    if (game.currentClicks <= 0) {
        showModal("You don't have enough clicks! Wait for them to regenerate.");
        return;
    }

    game.currentClicks--;
    // Calculate resource gain based on base rate and upgrade level
    let gain = game.baseRates[bookId];
    if (bookId === 'rp1' || bookId === 'eyeofargon') { // These upgrades affect click rate
        gain += game.upgradeLevels[bookId] * game.upgradeDetails[bookId].effect;
    }
    game.resources[bookId] += gain;

    updateUI();
}

/**
 * Handles resource conversion for a specific book.
 * @param {string} bookId - The ID of the book whose resource is being converted.
 */
function convertResource(bookId) {
    const conversion = game.conversionRates[bookId];
    if (game.resources[bookId] >= conversion.cost) {
        game.resources[bookId] -= conversion.cost;
        game.total372Pages += conversion.output;
        showModal(`Converted ${conversion.cost} ${bookId} resource into ${conversion.output} 372 Pages!`);
    } else {
        showModal(`Not enough resources to convert for ${bookId}. You need ${conversion.cost} but have ${game.resources[bookId]}.`);
    }
    updateUI();
}

/**
 * Handles buying an upgrade.
 * @param {string} upgradeId - The ID of the upgrade being purchased.
 */
function buyUpgrade(upgradeId) {
    const upgrade = game.upgradeDetails[upgradeId];
    if (game.total372Pages >= upgrade.cost) {
        game.total372Pages -= upgrade.cost;
        game.upgradeLevels[upgradeId]++;
        showModal(`Successfully purchased upgrade for ${upgradeId}!`);
        updateUI();
        // If it's a passive upgrade, start/restart its interval
        if (upgrade.passiveRate && upgrade.passiveInterval) {
            startPassiveGeneration(upgradeId);
        }
    } else {
        showModal(`Not enough 372 Pages to buy this upgrade. You need ${upgrade.cost} but have ${game.total372Pages}.`);
    }
}

// Object to store passive intervals so they can be cleared/restarted
const passiveIntervals = {};

/**
 * Starts or restarts passive resource generation for a given upgrade.
 * @param {string} upgradeId - The ID of the passive upgrade.
 */
function startPassiveGeneration(upgradeId) {
    // Clear any existing interval for this upgrade to prevent duplicates
    if (passiveIntervals[upgradeId]) {
        clearInterval(passiveIntervals[upgradeId]);
    }

    const upgrade = game.upgradeDetails[upgradeId];
    if (game.upgradeLevels[upgradeId] > 0 && upgrade.passiveRate && upgrade.passiveInterval) {
        passiveIntervals[upgradeId] = setInterval(() => {
            const bookId = upgradeId; // Assuming upgradeId matches bookId for passive resources
            game.resources[bookId] += upgrade.passiveRate * game.upgradeLevels[upgradeId];
            updateUI();
        }, upgrade.passiveInterval);
    }
}

/**
 * Starts the continuous click regeneration loop.
 */
function startClickRegenLoop() {
    setInterval(() => {
        if (game.currentClicks < INITIAL_CLICKS) { // Only regenerate if below max
            game.currentClicks += CLICKS_PER_REGEN_TICK;
        }
        updateUI();
    }, CLICK_REGEN_INTERVAL_MS);
}

/**
 * Initializes all passive generators based on loaded game state.
 */
function initializePassiveGenerators() {
    for (const upgradeId in game.upgradeLevels) {
        if (game.upgradeLevels.hasOwnProperty(upgradeId)) {
            const upgrade = game.upgradeDetails[upgradeId];
            if (game.upgradeLevels[upgradeId] > 0 && upgrade.passiveRate && upgrade.passiveInterval) {
                startPassiveGeneration(upgradeId);
            }
        }
    }
}

// --- Event Listeners ---
window.onload = function() {
    loadGame(); // Load game state first, including offline regeneration
    initializePassiveGenerators(); // Start passive generators based on loaded state
    startClickRegenLoop(); // Start the continuous click regeneration
    updateUI(); // Update UI after loading

    // Attach event listeners for book buttons
    for (const bookId in bookElements) {
        if (bookElements.hasOwnProperty(bookId)) {
            bookElements[bookId].readBtn.addEventListener('click', () => readBook(bookId));
            bookElements[bookId].convertBtn.addEventListener('click', () => convertResource(bookId));
        }
    }

    // Attach event listeners for upgrade buttons
    for (const upgradeId in upgradeElements) {
        if (upgradeElements.hasOwnProperty(upgradeId)) {
            upgradeElements[upgradeId].buyBtn.addEventListener('click', () => buyUpgrade(upgradeId));
        }
    }

    modalCloseBtn.addEventListener('click', hideModal);
};
