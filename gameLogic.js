let targetWord = getRandomWord();
console.log("Target word:", targetWord); // For debugging

function checkGuess(guess) {
  guess = guess.toLowerCase();
  const result = [];

  for (let i = 0; i < 5; i++) {
    if (guess[i] === targetWord[i]) {
      result.push("correct");
    } else if (targetWord.includes(guess[i])) {
      result.push("present");
    } else {
      result.push("absent");
    }
  }

  return result;
}
