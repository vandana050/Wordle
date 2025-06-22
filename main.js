// ========== INSTRUCTIONS MODAL ==========
document.addEventListener('DOMContentLoaded', () => {
  const modal = document.querySelector("#instructions-modal");
  const closeBtn = document.querySelector("#close-modal");
  const understoodBtn = document.querySelector("#understoodBtn");
  const helpBtn = document.querySelector("#help-btn");

  // Show on load
  modal.style.display = "flex";

  // Close modal on buttons
  closeBtn.addEventListener("click", () => {
    modal.style.display = "none";
  });

  understoodBtn.addEventListener("click", () => {
    modal.style.display = "none";
  });

  // Reopen modal
  helpBtn.addEventListener("click", () => {
    modal.style.display = "flex";
  });
   
  document.querySelector("#help-btn").addEventListener("click", () => {
  document.querySelector("#instructions-modal").style.display = "flex";
});

  // ... all other code like mode select, input handlers, etc.
});

// Help button to reopen instructions


// ========== GLOBAL GAME VARIABLES ==========
let currentRow = 0;
let currentCol = 0;
const maxCols = 5;
const maxRows = 6;
let isGameReady = false;
let targetWord = "";

const guessGrid = document.querySelectorAll('.guess-row');
const keys = document.querySelectorAll('.key');


// ========== MODE SELECTOR BUTTONS ==========
const singleBtn = document.getElementById('single-player-btn');
const multiBtn = document.getElementById('multiplayer-btn');
const setupScreen = document.getElementById('setup-screen');
const inputField = document.getElementById('secret-word-input');
const startBtn = document.getElementById('start-game-btn');

singleBtn.addEventListener('click', () => {
  targetWord = getRandomWord(); // from words.js
  isGameReady = true;
  document.querySelector('.mode-selector').style.display = "none";
});

multiBtn.addEventListener('click', () => {
  setupScreen.style.display = "flex";
  document.querySelector('.mode-selector').style.display = "none";
});

startBtn.addEventListener('click', (e) => {
  e.preventDefault();
  const word = inputField.value.trim().toLowerCase();

  if (word.length === 5 && /^[a-z]{5}$/.test(word)) {
    targetWord = word;
    isGameReady = true;
    setupScreen.style.display = "none";
    inputField.value = "";
    inputField.blur();

    document.querySelector('.guess-grid').style.display = 'grid';
    document.querySelector('.keyboard').style.display = 'flex';
  } else {
    alert("Please enter a valid 5-letter word.");
  }
});


// ========== INPUT HELPERS ==========
function addLetter(letter) {
  if (!isGameReady) return;
  if (currentCol < maxCols) {
    const cell = guessGrid[currentRow].children[currentCol];
    cell.textContent = letter.toUpperCase();
    currentCol++;
  }
}

function removeLetter() {
  if (!isGameReady) return;
  if (currentCol > 0) {
    currentCol--;
    const cell = guessGrid[currentRow].children[currentCol];
    cell.textContent = '';
  }
}


// ========== KEYBOARD COLOR LOGIC ==========
function updateKeyboard(letter, status) {
  const keyButton = [...keys].find(key => key.textContent === letter.toUpperCase());
  if (!keyButton) return;

  const currentColor = keyButton.style.backgroundColor;

  if (status === "correct") {
    keyButton.style.backgroundColor = "#538d4e"; // green
    keyButton.style.color = "white";
  } else if (status === "present" && currentColor !== "rgb(83, 141, 78)") {
    keyButton.style.backgroundColor = "#b59f3b"; // yellow
    keyButton.style.color = "white";
  } else if (status === "absent" &&
             currentColor !== "rgb(83, 141, 78)" &&
             currentColor !== "rgb(181, 159, 59)") {
    keyButton.style.backgroundColor = "#3a3a3c"; // gray
    keyButton.style.color = "white";
  }
}

function checkGuess(guess) {
  guess = guess.toLowerCase();
  const target = targetWord;
  const result = Array(maxCols).fill("absent");
  const targetUsed = Array(maxCols).fill(false);

  for (let i = 0; i < maxCols; i++) {
    if (guess[i] === target[i]) {
      result[i] = "correct";
      targetUsed[i] = true;
    }
  }

  for (let i = 0; i < maxCols; i++) {
    if (result[i] === "correct") continue;
    for (let j = 0; j < maxCols; j++) {
      if (!targetUsed[j] && guess[i] === target[j]) {
        result[i] = "present";
        targetUsed[j] = true;
        break;
      }
    }
  }
  return result;
}


// ========== GUESS SUBMISSION ==========
function submitGuess() {
  if (!isGameReady) return;
  if (currentCol !== maxCols) return;

  let guess = "";
  const row = guessGrid[currentRow];
  for (let i = 0; i < maxCols; i++) {
    guess += row.children[i].textContent;
  }

  const result = checkGuess(guess);

  result.forEach((status, i) => {
    const cell = row.children[i];
    const letter = guess[i].toUpperCase();

    setTimeout(() => {
      cell.classList.add("flip");

      setTimeout(() => {
        if (status === "correct") {
          cell.style.backgroundColor = "#538d4e";
        } else if (status === "present") {
          cell.style.backgroundColor = "#b59f3b";
        } else {
          cell.style.backgroundColor = "#3a3a3c";
        }

        updateKeyboard(letter, status);
      }, 300);
    }, i * 300);
  });

  setTimeout(() => {
    if (guess.toLowerCase() === targetWord) {
      alert("🎉 You guessed it!");
      return;
    }

    currentRow++;
    currentCol = 0;

    if (currentRow === maxRows) {
      alert("❌ Out of attempts! Word was: " + targetWord);
    }
  }, maxCols * 300 + 300);
}


// ========== EVENT LISTENERS ==========
keys.forEach(key => {
  key.addEventListener('click', () => {
    const letter = key.textContent;

    if (key.classList.contains('backspace')) {
      removeLetter();
    } else if (key.classList.contains('enter')) {
      submitGuess();
    } else {
      addLetter(letter);
    }
  });
});

document.addEventListener('keydown', (event) => {
  if (document.activeElement === inputField) return;

  const key = event.key;

  if (key === 'Backspace') {
    removeLetter();
  } else if (key === 'Enter') {
    submitGuess();
  } else if (/^[a-zA-Z]$/.test(key)) {
    addLetter(key);
  }
});
