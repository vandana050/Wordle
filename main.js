document.addEventListener('DOMContentLoaded', () => {
  const modal = document.querySelector("#instructions-modal");
  const closeBtn = document.querySelector("#close-modal");
  const understoodBtn = document.querySelector("#understoodBtn");

  closeBtn.onclick = () => {
    modal.style.display = "none";
  };
  
  understoodBtn.onclick = () => {
    modal.style.display = "none";
  };
  
  // If you want to show it again on page refresh, do nothing here.
});

// (Optionally) To remember if the person already closed it:
// you can use localStorage:
// if (localStorage.getItem('instructionsShown')) { modal.style.display = "none" }
document.querySelector("#help-btn").addEventListener("click", () => {
  document.querySelector("#instructions-modal").style.display = "flex";
});


let currentRow = 0;
let currentCol = 0;
const maxCols = 5;
const maxRows = 6;

const guessGrid = document.querySelectorAll('.guess-row');
const keys = document.querySelectorAll('.key');

const singleBtn = document.getElementById('single-player-btn');
const multiBtn = document.getElementById('multiplayer-btn');
const setupScreen = document.getElementById('setup-screen');

singleBtn.addEventListener('click', () => {
  targetWord = getRandomWord(); // from words.js
  document.querySelector('.mode-selector').style.display = "none";
});

multiBtn.addEventListener('click', () => {
  setupScreen.style.display = "flex"; // show word input popup
  document.querySelector('.mode-selector').style.display = "none";
});


function addLetter(letter) {
  if (currentCol < maxCols) {
    const cell = guessGrid[currentRow].children[currentCol];
    cell.textContent = letter.toUpperCase();
    currentCol++;
  }
}

function removeLetter() {
  if (currentCol > 0) {
    currentCol--;
    const cell = guessGrid[currentRow].children[currentCol];
    cell.textContent = '';
  }
}

function updateKeyboard(letter, status) {
  const keyButton = [...keys].find(key => key.textContent === letter.toUpperCase());
  if (!keyButton) return;

  // Priority: correct (green) > present (yellow) > absent (gray)
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


function submitGuess() {
  if (currentCol === maxCols) {
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
        // Apply flip class
        cell.classList.add("flip");

        // After 300ms, apply color and update keyboard
        setTimeout(() => {
          if (status === "correct") {
            cell.style.backgroundColor = "#538d4e";
          } else if (status === "present") {
            cell.style.backgroundColor = "#b59f3b";
          } else {
            cell.style.backgroundColor = "#3a3a3c";
          }

          updateKeyboard(letter, status);
        }, 300); // flip halfway point

      }, i * 300); // delay each tile
    });

    // Move to next row after flip animation
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
}



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
  const key = event.key;

  if (key === 'Backspace') {
    removeLetter();
  } else if (key === 'Enter') {
    submitGuess();
  } else if (/^[a-zA-Z]$/.test(key)) {
    addLetter(key);
  }
});
