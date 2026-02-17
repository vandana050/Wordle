let isChecking = false;
let WORD_LIST = [];
let gameOver = false;

//button
const helpBtn = document.querySelector('[data-tooltip="Help"]');
const helpModal = document.getElementById('help-modal');
const closeHelp = helpModal.querySelector('.modal-close');

helpBtn.onclick = () => helpModal.classList.remove('hidden');
closeHelp.onclick = () => helpModal.classList.add('hidden');

const statsBtn = document.querySelector('[data-tooltip="Stats"]');
const statsModal = document.getElementById('stats-modal');
const closeStats = statsModal.querySelector('.modal-close');

statsBtn.onclick = () => {
  renderStats();
  statsModal.classList.remove("hidden");
};

closeStats.onclick = () => statsModal.classList.add('hidden');

/*const settingsBtn = document.querySelector('[data-tooltip="Settings"]');
const settingsModal = document.getElementById("settings-modal");

settingsBtn.onclick = () => settingsModal.classList.remove("hidden");
settingsModal.querySelector(".modal-close").onclick = () =>
  settingsModal.classList.add("hidden");*/


// -----themebuttons
const themeToggle = document.getElementById("theme-toggle");

function applyTheme(theme) {
  document.body.classList.toggle("light", theme === "light");
  themeToggle.textContent = theme === "light" ? "dark_mode" : "light_mode";
  localStorage.setItem("theme", theme);
}

themeToggle.onclick = () => {
  const isLight = document.body.classList.contains("light");
  applyTheme(isLight ? "dark" : "light");
};

// Loads saved theme
const savedTheme = localStorage.getItem("theme") || "dark";
applyTheme(savedTheme);

//-------stats default
const defaultStats = {
                 played: 0,
                 wins: 0,
                 currentStreak: 0,
                 maxStreak: 0,
                 guessDistribution: [0, 0, 0, 0, 0, 0]
               };

function loadStats() {
  const saved = JSON.parse(localStorage.getItem("wordleStats"));

  if (!saved) return { ...defaultStats };

  return {
    ...defaultStats,
    ...saved,
    guessDistribution:
      saved.guessDistribution || [0, 0, 0, 0, 0, 0]
  };
}

function saveStats(stats) {
  localStorage.setItem("wordleStats", JSON.stringify(stats));
}
function recordWin(attempt) {
  const stats = loadStats();

  stats.played += 1;
  stats.wins += 1;
  stats.currentStreak += 1;
  stats.maxStreak = Math.max(stats.maxStreak, stats.currentStreak);

  stats.guessDistribution[attempt - 1] += 1;

  saveStats(stats);
}

function recordLoss() {
  const stats = loadStats();

  stats.played += 1;
  stats.currentStreak = 0;

  saveStats(stats);
}

function renderStats() {
  const stats = loadStats();

  document.getElementById("played").textContent = stats.played;
  document.getElementById("current-streak").textContent = stats.currentStreak;
  document.getElementById("max-streak").textContent = stats.maxStreak;

  const winPercent =
    stats.played === 0 ? 0 : Math.round((stats.wins / stats.played) * 100);

  document.getElementById("win-percent").textContent = winPercent;

  // Guess distribution
  const rows = document.querySelectorAll(".guess-row");
  const maxGuess = Math.max(...stats.guessDistribution, 1);

  stats.guessDistribution.forEach((count, index) => {
    const bar = rows[index]?.querySelector(".guess-bar div");
    if (!bar) return;

    bar.textContent = count;
    bar.style.width = `${(count / maxGuess) * 100}%`;
  });
}




//load word list
async function loadWordList() {
  const cached = localStorage.getItem("wordList");
  if (cached) {
    return JSON.parse(cached);
  }

  const res = await fetch(
    "https://raw.githubusercontent.com/tabatkins/wordle-list/main/words"
  );

  const text = await res.text();
  const words = text
    .split("\n")
    .map(w => w.trim().toUpperCase())
    .filter(w => w.length === 5);

  localStorage.setItem("wordList", JSON.stringify(words));
  return words;
}
//words

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

async function getRandomWord() {
  const words = await loadWordList();
  return words[Math.floor(Math.random() * words.length)];
}


//initialise target word
let TARGET_WORD = "";
let gameReady = false;

(async function initGame() {
  WORD_LIST = await loadWordList();
  TARGET_WORD = await getRandomWord();
  gameReady = true;
})();

//validate

function evaluateGuess(guess) {
  const result = Array(WORD_LENGTH).fill("absent");
  const targetArr = TARGET_WORD.split("");

  // First pass: correct (green)
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (guess[i] === targetArr[i]) {
      result[i] = "correct";
      targetArr[i] = null;
    }
  }

  // Second pass: present (yellow)
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (result[i] === "correct") continue;

    const index = targetArr.indexOf(guess[i]);
    if (index !== -1) {
      result[i] = "present";
      targetArr[index] = null;
    }
  }

  return result;
}
//color tiles

function colorTiles(result) {
  for (let i = 0; i < WORD_LENGTH; i++) {
    const tileIndex = currentRow * WORD_LENGTH + i;
    tiles[tileIndex].classList.add(result[i]);
  }
}
//color keyboard
function colorKey(letter, state) {
  const key = document.querySelector(`.key[data-key="${letter}"]`);
  if (!key) return;

  if (state === "correct") {
    key.classList.remove("present", "absent");
    key.classList.add("correct");
  } else if (state === "present" && !key.classList.contains("correct")) {
    key.classList.add("present");
  } else if (
    state === "absent" &&
    !key.classList.contains("correct") &&
    !key.classList.contains("present")
  ) {
    key.classList.add("absent");
  }
}


//keyboard

const tiles = document.querySelectorAll(".board .tile");
const keys = document.querySelectorAll(".key");

let currentRow = 0;
let currentCol = 0;

const WORD_LENGTH = 5;
const MAX_ROWS = 6;

function addLetter(letter) {
  if (currentCol >= WORD_LENGTH) return;

  const index = currentRow * WORD_LENGTH + currentCol;
  tiles[index].textContent = letter;
  currentCol++;
}

function removeLetter() {
  if (currentCol === 0) return;

  currentCol--;
  const index = currentRow * WORD_LENGTH + currentCol;
  tiles[index].textContent = "";
}

//submission
async function submitRow() {
  if (!gameReady || isChecking) return;

  if (currentCol < WORD_LENGTH) {
    showMessage("Not enough letters");
    return;
  }

  isChecking = true;

  const guess = getCurrentWord();
  const valid = await isValidWord(guess);

  if (!valid) {
    showMessage("Not in word list");
    isChecking = false;
    return;
  }

  const result = evaluateGuess(guess);
  flipTiles(result, guess);

  const row = currentRow;
  const attempt = row + 1;

  setTimeout(() => {
    if (guess === TARGET_WORD) {
      recordWin(attempt);
      showEndgameModal(true, TARGET_WORD);
      isChecking = false;
      return;
    }

    if (row === MAX_ROWS - 1) {
      recordLoss();
      showEndgameModal(false, TARGET_WORD);
      isChecking = false;
      return;
    }

    currentRow++;
    currentCol = 0;
    isChecking = false;
  }, WORD_LENGTH * 350 + 300);
}




//---
keys.forEach(key => {
  key.addEventListener("click", () => {
    if (gameOver) return;
    const value = key.dataset.key;

    if (value === "ENTER") {
      submitRow();
    } else if (value === "BACKSPACE") {
      removeLetter();
    } else {
      addLetter(value);
    }
  });
});

document.addEventListener("keydown", (e) => {
  if (gameOver) return;
  if (e.key === "Enter") {
    submitRow();
  } else if (e.key === "Backspace") {
    removeLetter();
  } else if (/^[a-zA-Z]$/.test(e.key)) {
    addLetter(e.key.toUpperCase());
  }
});

//alert message
function showMessage(text) {
  const msg = document.getElementById("message");
  msg.textContent = text;
  msg.classList.remove("hidden");

  setTimeout(() => {
    msg.classList.add("hidden");
  }, 1500);
}

function getCurrentWord() {
  let word = "";
  for (let i = 0; i < WORD_LENGTH; i++) {
    const index = currentRow * WORD_LENGTH + i;
    word += tiles[index].textContent;
  }
  return word;
}
//validate against word list
function isValidWord(word) {
  return WORD_LIST.includes(word);
}


//tiles flips
function flipTiles(result, guess) {
  for (let i = 0; i < WORD_LENGTH; i++) {
    const tileIndex = currentRow * WORD_LENGTH + i;
    const tile = tiles[tileIndex];

    setTimeout(() => {
      tile.classList.add("flip");


      setTimeout(() => {
        tile.classList.add(result[i]);
        colorKey(guess[i], result[i]);
      }, 300);

    }, i * 350);
  }
}

//new game button
const endgameModal = document.getElementById("endgame-modal");
const newGameBtn = document.getElementById("new-game-btn");
const closeEndgame = endgameModal.querySelector(".modal-close");


newGameBtn.onclick = async () => {
  endgameModal.classList.add("hidden");
  gameOver = false;
  tiles.forEach(tile => {
    tile.textContent = "";
    tile.classList.remove("correct", "present", "absent", "flip");
  });

  keys.forEach(key => {
    key.classList.remove("correct", "present", "absent");
  });

  currentRow = 0;
  currentCol = 0;
  isChecking = false;

  TARGET_WORD = await getRandomWord();
};

// win/loss modal


closeEndgame.onclick = () => {
  endgameModal.classList.add("hidden");
};

function showEndgameModal(win, word) {
  gameOver = true;

  const title = document.getElementById("endgame-title");
  const wordBox = document.getElementById("endgame-word");
  const meaningLink = document.getElementById("word-meaning");

  if (win) {
    title.textContent = "You Win!";
    document.querySelector(".endgame-subtext").textContent = "The word was:";
  } else {
    title.textContent = "You Lost!";
    document.querySelector(".endgame-subtext").textContent = "The answer was:";
  }

  wordBox.textContent = word;

  meaningLink.href =
    `https://www.dictionary.com/browse/${word.toLowerCase()}`;

  endgameModal.classList.remove("hidden");
}
