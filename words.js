const wordList = [
  "apple", "brave", "charm", "dream", "flute", 
  "grape", "house", "jolly", "knock", "lemon",
  "melon", "noble", "ocean", "proud", "quiet",
  "rider", "stone", "trail", "urban", "vivid",
  "witty", "xenon", "young", "zebra"
];

//const TARGET_WORD = getRandomWord();

// Pick a random word
function getRandomWord() {
  const index = Math.floor(Math.random() * wordList.length);
  return wordList[index];
}
