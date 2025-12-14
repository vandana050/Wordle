// ========== AUTH CHECK ==========
const token = localStorage.getItem("token");
const isGuest = localStorage.getItem("guest");

if (!token && !isGuest) {
  window.location.href = "auth.html";
}

// ========== INSTRUCTIONS MODAL ==========
document.addEventListener('DOMContentLoaded', () => {

  // Load stats only for logged-in users
  loadStats();

  const modal = document.querySelector("#instructions-modal");
  const closeBtn = document.querySelector("#close-modal");
  const understoodBtn = document.querySelector("#understoodBtn");
  const helpBtn = document.querySelector("#help-btn");

  const copyBtn = document.getElementById('copy-link-btn');
  const shareLinkInput = document.getElementById('share-link');

  if (!localStorage.getItem("skipInstructions")) {
    modal.style.display = "flex";
  }

  closeBtn.addEventListener("click", () => {
    modal.style.display = "none";
    localStorage.setItem("skipInstructions", "true");
  });

  understoodBtn.addEventListener("click", () => {
    modal.style.display = "none";
    localStorage.setItem("skipInstructions", "true");
  });

  helpBtn.addEventListener("click", () => {
    localStorage.removeItem("skipInstructions");
    modal.style.display = "flex";
  });

  // Multiplayer via URL
  const urlParams = new URLSearchParams(window.location.search);
  const encodedWord = urlParams.get("code");
  const wordFromUrl = encodedWord ? atob(encodedWord) : null;

  if (wordFromUrl && /^[a-z]{5}$/.test(wordFromUrl)) {
    targetWord = wordFromUrl.toLowerCase();
    isGameReady = true;

    document.querySelector('.mode-selector').style.display = "none";
    document.getElementById('setup-screen').style.display = "none";
    document.querySelector('.guess-grid').style.display = 'grid';
    document.querySelector('.keyboard').style.display = 'flex';
  }

  copyBtn.addEventListener('click', () => {
    const link = shareLinkInput.value;
    if (!link) return showToast("No link to copy!");
    navigator.clipboard.writeText(link)
      .then(() => showToast("Copied!"));
  });

  // Hint logic
  const hintBtn = document.getElementById('hint-btn');
  const hintText = document.getElementById('hint-text');
  let hintVisible = false;

  hintBtn.addEventListener('click', () => {
    if (hintVisible) {
      hintText.textContent = "";
      hintVisible = false;
      return;
    }

    if (!targetWord) {
      hintText.textContent = "Start the game first to get a hint.";
      hintVisible = true;
      return;
    }

    hintText.textContent = "Fetching hint...";
    hintVisible = true;

    fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${targetWord}`)
      .then(res => res.json())
      .then(data => {
        const def = data[0]?.meanings[0]?.definitions[0]?.definition;
        hintText.textContent = def ? `Hint: ${def.slice(0, 100)}...` : "No hint available.";
      })
      .catch(() => hintText.textContent = "Couldn't fetch hint.");
  });
});

// ========== LOAD STATS ==========
async function loadStats() {
  if (!token || isGuest) return;

  try {
    const res = await fetch("http://localhost:5000/api/game/stats", {
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (!res.ok) return;

    const data = await res.json();
    document.getElementById("stats-panel").style.display = "block";
    document.getElementById("games").innerText = data.games_played;
    document.getElementById("wins").innerText = data.wins;
    document.getElementById("losses").innerText = data.losses;

    const percent = data.games_played === 0
      ? 0
      : Math.round((data.wins / data.games_played) * 100);

    document.getElementById("winPercent").innerText = percent;
  } catch {}
}

// ========== GLOBAL GAME VARIABLES ==========
let currentRow = 0;
let currentCol = 0;
const maxCols = 5;
const maxRows = 6;
let isGameReady = false;
let targetWord = "";

const guessGrid = document.querySelectorAll('.guess-row');
const keys = document.querySelectorAll('.key');

// ========== MODE SELECTOR ==========
const singleBtn = document.getElementById('single-player-btn');
const multiBtn = document.getElementById('multiplayer-btn');
const setupScreen = document.getElementById('setup-screen');
const inputField = document.getElementById('secret-word-input');
const startBtn = document.getElementById('start-game-btn');
const copyBtn = document.getElementById('copy-link-btn');
const shareLinkInput = document.getElementById('share-link');

singleBtn.addEventListener('click', () => {
  targetWord = getRandomWord();
  isGameReady = true;
  document.querySelector('.mode-selector').style.display = "none";
  document.querySelector('.guess-grid').style.display = 'grid';
  document.querySelector('.keyboard').style.display = 'flex';
});

multiBtn.addEventListener('click', () => {
  setupScreen.style.display = "flex";
  document.querySelector('.mode-selector').style.display = "none";
});

// ========== START GAME ==========
startBtn.addEventListener('click', (e) => {
  e.preventDefault();
  const word = inputField.value.trim().toLowerCase();

  if (/^[a-z]{5}$/.test(word)) {
    targetWord = word;
    isGameReady = true;

    document.querySelector('.mode-selector').style.display = "none";
    setupScreen.style.display = "none";
    document.querySelector('.guess-grid').style.display = 'grid';
    document.querySelector('.keyboard').style.display = 'flex';

    const encoded = btoa(word);
    shareLinkInput.value = `${location.origin}${location.pathname}?code=${encoded}`;
    document.getElementById('share-link-container').style.display = "flex";
    inputField.value = "";
  } else {
    showToast("Please enter a valid 5-letter word.");
  }
});

// ========== TOAST ==========
function showToast(message) {
  const toast = document.createElement('div');
  toast.textContent = message;
  toast.style.cssText =
    "position:fixed;bottom:30px;right:30px;background:#333;color:#fff;padding:10px 20px;border-radius:20px;z-index:9999;";
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 1500);
}

// ========== INPUT ==========
function addLetter(letter) {
  if (!isGameReady || currentCol >= maxCols) return;
  guessGrid[currentRow].children[currentCol++].textContent = letter.toUpperCase();
}

function removeLetter() {
  if (!isGameReady || currentCol === 0) return;
  guessGrid[currentRow].children[--currentCol].textContent = '';
}

// ========== KEYBOARD COLOR ==========
function updateKeyboard(letter, status) {
  const key = [...keys].find(k => k.textContent === letter.toUpperCase());
  if (!key) return;

  if (status === "correct") key.style.backgroundColor = "#538d4e";
  else if (status === "present") key.style.backgroundColor = "#b59f3b";
  else key.style.backgroundColor = "#3a3a3c";
}

// ========== CHECK GUESS ==========
function checkGuess(guess) {
  const result = Array(5).fill("absent");
  const used = Array(5).fill(false);

  for (let i = 0; i < 5; i++) {
    if (guess[i] === targetWord[i]) {
      result[i] = "correct";
      used[i] = true;
    }
  }

  for (let i = 0; i < 5; i++) {
    if (result[i] === "correct") continue;
    for (let j = 0; j < 5; j++) {
      if (!used[j] && guess[i] === targetWord[j]) {
        result[i] = "present";
        used[j] = true;
        break;
      }
    }
  }
  return result;
}

// ========== SUBMIT GUESS ==========
async function submitGuess() {
  if (!isGameReady || currentCol !== 5) return;

  let guess = "";
  [...guessGrid[currentRow].children].forEach(c => guess += c.textContent.toLowerCase());

  const valid = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${guess}`)
    .then(res => res.ok);

  if (!valid) return showToast("Not a real word!");

  const result = checkGuess(guess);
  result.forEach((s, i) => updateKeyboard(guess[i], s));

  if (guess === targetWord) {
    showResultModal(targetWord, true);
    return;
  }

  currentRow++;
  currentCol = 0;

  if (currentRow === maxRows) {
    showResultModal(targetWord, false);
  }
}

// ========== KEYBOARD EVENTS ==========
keys.forEach(key => {
  key.addEventListener('click', () => {
    if (key.classList.contains('backspace')) removeLetter();
    else if (key.classList.contains('enter')) submitGuess();
    else addLetter(key.textContent);
  });
});

document.addEventListener('keydown', (e) => {
  if (document.activeElement === inputField) return;

  if (e.key === "Backspace") removeLetter();
  else if (e.key === "Enter") submitGuess();
  else if (/^[a-zA-Z]$/.test(e.key)) addLetter(e.key);
});

// ========== RESULT MODAL ==========
function showResultModal(word, didWin) {

  if (token && !isGuest) {
    fetch("http://localhost:5000/api/game/update", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ result: didWin ? "win" : "loss" })
    });
  }

  document.getElementById('win-modal').style.display = "flex";
  document.getElementById('win-word').textContent = word.toUpperCase();
}

// ========== LOGOUT ==========
function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("guest");
  window.location.href = "auth.html";
}

