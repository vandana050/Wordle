// ========== INSTRUCTIONS MODAL ==========
document.addEventListener('DOMContentLoaded', () => {
  const modal = document.querySelector("#instructions-modal");
  const closeBtn = document.querySelector("#close-modal");
  const understoodBtn = document.querySelector("#understoodBtn");
  const helpBtn = document.querySelector("#help-btn");

  const copyBtn = document.getElementById('copy-link-btn');
  const shareLinkInput = document.getElementById('share-link');

  // ✅ Show modal only if user hasn't skipped it
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
    localStorage.removeItem("skipInstructions"); // so help opens again in the future
    modal.style.display = "flex";
  });

  // Multiplayer shared word via URL
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

  // Copy link functionality
  copyBtn.addEventListener('click', () => {
    const link = shareLinkInput.value;

    if (!link) return showToast("No link to copy!");

    navigator.clipboard.writeText(link)
      .then(() => showToast("Copied!"))
      .catch(() => showToast("Failed to copy!"));
  });

  // ✅ HINT button logic
  // ✅ HINT button logic with toggle
  const hintBtn = document.getElementById('hint-btn');
  const hintText = document.getElementById('hint-text');

  if (hintBtn && hintText) {
    let hintVisible = false;

    hintBtn.addEventListener('click', () => {
      if (hintVisible) {
        // Hide the hint
        hintText.textContent = "";
        hintVisible = false;
        return;
      }

      if (!targetWord || targetWord.length !== 5) {
        hintText.textContent = "Start the game first to get a hint.";
        hintVisible = true;  // so clicking again hides this message
        return;
      }

      // Show loading text while fetching
      hintText.textContent = "Fetching hint...";
      hintVisible = true;

      fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${targetWord}`)
        .then(res => res.json())
        .then(data => {
          const definitions = data[0]?.meanings[0]?.definitions;
          const fullHint = definitions?.[0]?.definition || "No hint available.";

          const hint = fullHint.length > 100 ? fullHint.slice(0, 100) + "..." : fullHint;

          hintText.textContent = `Hint: ${hint}`;
        })
        .catch(err => {
          hintText.textContent = "Sorry, couldn't fetch a hint.";
        });
    });
  }

});



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
  targetWord = getRandomWord(); // From words.js
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

  if (word.length === 5 && /^[a-z]{5}$/.test(word)) {
    targetWord = word;
    isGameReady = true;

    // Hide mode selector and setup screen, show the game grid and keyboard
    document.querySelector('.mode-selector').style.display = "none";
    setupScreen.style.display = "none";
    document.querySelector('.guess-grid').style.display = 'grid';
    document.querySelector('.keyboard').style.display = 'flex';

    // Build shareable URL with the secret word in the query string
    const encoded = btoa(word); // Encode the word
    const shareUrl = `${window.location.origin}${window.location.pathname}?code=${encoded}`;


    // Show and populate the share link input

    document.getElementById('share-link-container').style.display = 'flex';

    // Show and populate the share link input (but keep it hidden)
    shareLinkInput.value = shareUrl;
    shareLinkInput.style.display = "none"; // 👈 Hide the input

    // Show the container that includes the copy button
    document.getElementById('share-link-container').style.display = "flex";

    // Show the copy button itself
    copyBtn.style.display = "inline-block";


    // Clear input and blur
    inputField.value = "";
    inputField.blur();
  } else {
    showToast("Please enter a valid 5-letter word.");
  }
});


// ========== TOAST FUNCTION ==========
function showToast(message) {
  const toast = document.createElement('div');
  toast.textContent = message;
  toast.style.position = 'fixed';
  toast.style.bottom = '30px';
  toast.style.right = '30px';
  toast.style.backgroundColor = '#333';
  toast.style.color = '#fff';
  toast.style.padding = '10px 20px';
  toast.style.borderRadius = '20px';
  toast.style.fontSize = '14px';
  toast.style.zIndex = '9999';
  toast.style.opacity = '0';
  toast.style.transition = 'opacity 0.3s ease';

  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.style.opacity = '1');

  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 1500);
}

// ========== INPUT ==========
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
    keyButton.style.backgroundColor = "#538d4e";
    keyButton.style.color = "white";
  } else if (status === "present" && currentColor !== "rgb(83, 141, 78)") {
    keyButton.style.backgroundColor = "#b59f3b";
    keyButton.style.color = "white";
  } else if (status === "absent" &&
    currentColor !== "rgb(83, 141, 78)" &&
    currentColor !== "rgb(181, 159, 59)") {
    keyButton.style.backgroundColor = "#3a3a3c";
    keyButton.style.color = "white";
  }
}

// ========== CHECK GUESS ==========
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

async function isRealWord(word) {
  try {
    const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
    return response.ok;
  } catch (error) {
    console.error("Error checking word validity:", error);
    return false;
  }
}

// ========== SUBMIT GUESS ==========


// Modify submitGuess to be async
async function submitGuess() {
  if (!isGameReady) return;
  if (currentCol !== maxCols) return;

  let guess = "";
  const row = guessGrid[currentRow];
  for (let i = 0; i < maxCols; i++) {
    guess += row.children[i].textContent.toLowerCase();
  }

  // ✅ Check if it's a real word using the API
  const valid = await isRealWord(guess);
  if (!valid) {
    showToast("Not a real word!");
    return;
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
    if (guess.toLowerCase() === targetWord && guess.trim().length === 5) {
      showResultModal(targetWord, true); // Win
      return;
    }


    currentRow++;
    currentCol = 0;

    if (currentRow === maxRows) {
      showResultModal(targetWord, false); // Loss
    }

  }, maxCols * 300 + 300);
}


// ========== KEYBOARD EVENTS ==========
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

function showResultModal(word, didWin = true) {
  const winModal = document.getElementById('win-modal');
  const wordEl = document.getElementById('win-word');
  const meaningEl = document.getElementById('win-meaning');

  wordEl.textContent = word.toUpperCase();
  meaningEl.textContent = "Loading meaning...";

  // Change heading based on win/lose
  const heading = winModal.querySelector("h2");
  heading.textContent = didWin ? "🎉 You Won!" : "❌ You Lost!";
  heading.style.color = didWin ? "green" : "red";

  winModal.style.display = 'flex';

  fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`)
    .then(res => res.json())
    .then(data => {
      const meaning = data[0]?.meanings[0]?.definitions[0]?.definition;
      meaningEl.textContent = meaning || "No meaning found.";
    })
    .catch(err => {
      meaningEl.textContent = "Failed to load meaning.";
    });
}


function startNewGame() {
  // Hide the win modal
  const winModal = document.getElementById('win-modal');
  winModal.style.display = 'none';

  // Reset game state
  currentRow = 0;
  currentCol = 0;
  isGameReady = false;
  targetWord = "";

  // Clear the guess grid
  guessGrid.forEach(row => {
    Array.from(row.children).forEach(cell => {
      cell.textContent = "";
      cell.style.backgroundColor = "";
      cell.classList.remove("flip");
    });
  });

  // Reset the keyboard
  keys.forEach(key => {
    key.style.backgroundColor = "";
    key.style.color = "";
  });

  // Clear hint text
  document.getElementById('hint-text').textContent = "";

  // Hide share link and input
  document.getElementById('share-link-container').style.display = 'none';

  // Clear the secret word input if any
  inputField.value = "";

  // Show mode selection again
  document.querySelector('.mode-selector').style.display = "flex";
  setupScreen.style.display = "none"; // ensure setup form is hidden
}

