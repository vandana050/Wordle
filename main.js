// ========== AUTH CHECK ==========
const token = localStorage.getItem("token");
const isGuest = localStorage.getItem("guest");

if (!token && !isGuest) {
  window.location.href = "auth.html";
}

// ========== LOAD STATS (ONLY FOR LOGGED-IN USERS) ==========
async function loadStats() {
  if (!token || isGuest) return;

  try {
    const res = await fetch("http://localhost:5000/api/game/stats", {
      headers: {
        "Authorization": `Bearer ${token}`
      }
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
  } catch (err) {
    console.error("Failed to load stats", err);
  }
}

// ========== INSTRUCTIONS MODAL ==========
document.addEventListener('DOMContentLoaded', () => {
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

  closeBtn.onclick = understoodBtn.onclick = () => {
    modal.style.display = "none";
    localStorage.setItem("skipInstructions", "true");
  };

  helpBtn.onclick = () => {
    localStorage.removeItem("skipInstructions");
    modal.style.display = "flex";
  };

  const urlParams = new URLSearchParams(window.location.search);
  const encodedWord = urlParams.get("code");
  const wordFromUrl = encodedWord ? atob(encodedWord) : null;

  if (wordFromUrl && /^[a-z]{5}$/.test(wordFromUrl)) {
    targetWord = wordFromUrl;
    isGameReady = true;

    document.querySelector('.mode-selector').style.display = "none";
    document.getElementById('setup-screen').style.display = "none";
    document.querySelector('.guess-grid').style.display = 'grid';
    document.querySelector('.keyboard').style.display = 'flex';
  }

  copyBtn.onclick = () => {
    if (!shareLinkInput.value) return showToast("No link to copy!");
    navigator.clipboard.writeText(shareLinkInput.value)
      .then(() => showToast("Copied!"));
  };
});

// ========== GAME STATE ==========
let currentRow = 0;
let currentCol = 0;
const maxCols = 5;
const maxRows = 6;
let isGameReady = false;
let targetWord = "";

const guessGrid = document.querySelectorAll('.guess-row');
const keys = document.querySelectorAll('.key');

// ========== MODE SELECTION ==========
document.getElementById('single-player-btn').onclick = () => {
  targetWord = getRandomWord();
  isGameReady = true;
  document.querySelector('.mode-selector').style.display = "none";
  document.querySelector('.guess-grid').style.display = 'grid';
  document.querySelector('.keyboard').style.display = 'flex';
};

document.getElementById('multiplayer-btn').onclick = () => {
  document.getElementById('setup-screen').style.display = "flex";
  document.querySelector('.mode-selector').style.display = "none";
};

// ========== START MULTIPLAYER ==========
document.getElementById('start-game-btn').onclick = (e) => {
  e.preventDefault();
  const word = document.getElementById('secret-word-input').value.trim().toLowerCase();

  if (!/^[a-z]{5}$/.test(word)) return showToast("Enter valid 5-letter word");

  targetWord = word;
  isGameReady = true;

  const encoded = btoa(word);
  document.getElementById('share-link').value =
    `${location.origin}${location.pathname}?code=${encoded}`;

  document.getElementById('share-link-container').style.display = "flex";
  document.querySelector('.guess-grid').style.display = 'grid';
  document.querySelector('.keyboard').style.display = 'flex';
  document.getElementById('setup-screen').style.display = "none";
};

// ========== TOAST ==========
function showToast(msg) {
  const t = document.createElement('div');
  t.textContent = msg;
  Object.assign(t.style, {
    position: 'fixed', bottom: '30px', right: '30px',
    background: '#333', color: '#fff', padding: '10px 20px',
    borderRadius: '20px', zIndex: 9999
  });
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 1500);
}

// ========== INPUT ==========
function addLetter(l) {
  if (!isGameReady || currentCol >= maxCols) return;
  guessGrid[currentRow].children[currentCol++].textContent = l.toUpperCase();
}

function removeLetter() {
  if (!isGameReady || currentCol === 0) return;
  guessGrid[currentRow].children[--currentCol].textContent = '';
}

// ========== CHECK GUESS ==========
function checkGuess(guess) {
  const res = Array(5).fill("absent");
  const used = Array(5).fill(false);

  for (let i = 0; i < 5; i++) {
    if (guess[i] === targetWord[i]) {
      res[i] = "correct";
      used[i] = true;
    }
  }

  for (let i = 0; i < 5; i++) {
    if (res[i] === "correct") continue;
    for (let j = 0; j < 5; j++) {
      if (!used[j] && guess[i] === targetWord[j]) {
        res[i] = "present";
        used[j] = true;
        break;
      }
    }
  }
  return res;
}

// ========== SUBMIT ==========
async function submitGuess() {
  if (!isGameReady || currentCol !== 5) return;

  let guess = "";
  [...guessGrid[currentRow].children].forEach(c => guess += c.textContent.toLowerCase());

  const valid = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${guess}`).then(r => r.ok);
  if (!valid) return showToast("Not a real word!");

  const result = checkGuess(guess);
  result.forEach((s, i) => updateKeyboard(guess[i], s));

  if (guess === targetWord) return showResultModal(true);

  currentRow++;
  currentCol = 0;

  if (currentRow === maxRows) showResultModal(false);
}

// ========== RESULT ==========
function showResultModal(didWin) {
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
}

// ========== LOGOUT ==========
function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("guest");
  window.location.href = "auth.html";
}
