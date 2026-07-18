// Variables to control game state
let gameRunning = false;
let dropMaker;
let contaminatedDropMaker;
let timerInterval;
let score = 0;
let timeRemaining = 30;
let confettiInterval;

const scoreDisplay = document.getElementById("score");
const timeDisplay = document.getElementById("time");
const gameContainer = document.getElementById("game-container");
const popup = document.getElementById("game-over-popup");
const popupMessage = document.getElementById("popup-message");
const popupContent = document.querySelector(".popup-content");
const startBtn = document.getElementById("start-btn");
const resetBtn = document.getElementById("reset-btn");
const restartBtn = document.getElementById("restart-btn");

const winMessages = [
  "Good Job you Win",
  "Amazing! You crushed it!",
  "Fantastic work, you won!",
  "You’re on fire!",
  "Incredible play!",
  "That was a superstar run!"
];

const lossMessages = [
  "It's Ok, try again?",
  "Nice try! Give it another go!",
  "Almost there! Try once more!",
  "You’ve got this next time!",
  "Keep practicing and you’ll shine!",
  "Close one! Let’s try again!"
];

startBtn.addEventListener("click", startGame);
resetBtn.addEventListener("click", resetGame);
restartBtn.addEventListener("click", startGame);

function startGame() {
  if (gameRunning) return;

  clearInterval(confettiInterval);

  score = 0;
  timeRemaining = 30;
  scoreDisplay.textContent = score;
  timeDisplay.textContent = timeRemaining;
  hideGameOverPopup();

  clearInterval(dropMaker);
  clearInterval(contaminatedDropMaker);
  clearInterval(timerInterval);
  document.querySelectorAll(".water-drop").forEach((drop) => drop.remove());

  gameRunning = true;

  dropMaker = setInterval(createDrop, 1000);
  contaminatedDropMaker = setInterval(createContaminatedDrop, 700);
  timerInterval = setInterval(updateTimer, 1000);
}

function resetGame() {
  clearInterval(dropMaker);
  clearInterval(contaminatedDropMaker);
  clearInterval(timerInterval);
  clearInterval(confettiInterval);
  gameRunning = false;

  document.querySelectorAll(".water-drop").forEach((drop) => drop.remove());
  score = 0;
  timeRemaining = 30;
  scoreDisplay.textContent = score;
  timeDisplay.textContent = timeRemaining;
  hideGameOverPopup();
}

function updateTimer() {
  timeRemaining -= 1;
  timeDisplay.textContent = timeRemaining;

  if (timeRemaining <= 0) {
    endGame();
  }
}

function endGame() {
  clearInterval(dropMaker);
  clearInterval(contaminatedDropMaker);
  clearInterval(timerInterval);
  gameRunning = false;

  showOutcomeMessage();
  popup.classList.remove("hidden");
}

function showOutcomeMessage() {
  if (score >= 20) {
    const randomWinMessage = winMessages[Math.floor(Math.random() * winMessages.length)];
    popupMessage.textContent = randomWinMessage;
    popupContent.style.backgroundColor = "#4CAF50";
    popupContent.style.color = "white";
    popupContent.classList.add("win-state");
    startConfettiLoop();
  } else {
    const randomLossMessage = lossMessages[Math.floor(Math.random() * lossMessages.length)];
    popupMessage.textContent = randomLossMessage;
    popupContent.style.backgroundColor = "#f44336";
    popupContent.style.color = "white";
    popupContent.classList.remove("win-state");
    clearInterval(confettiInterval);
  }
}

function hideGameOverPopup() {
  popup.classList.add("hidden");
  popupContent.style.backgroundColor = "#fff";
  popupContent.style.color = "#333";
  popupContent.classList.remove("win-state");
  clearInterval(confettiInterval);
}

function startConfettiLoop() {
  clearInterval(confettiInterval);
  confettiInterval = setInterval(() => {
    popupContent.classList.remove("win-state");
    void popupContent.offsetWidth;
    popupContent.classList.add("win-state");
  }, 900);
}

function createDrop(type = "good") {
  if (!gameRunning) return;

  const drop = document.createElement("div");
  drop.className = "water-drop";

  if (type === "bad") {
    drop.classList.add("bad-drop");
  }

  const baseSize = Math.min(72, Math.max(38, gameContainer.clientWidth * 0.08));
  const sizeMultiplier = Math.random() * 0.8 + 0.5;
  const size = baseSize * sizeMultiplier;
  drop.style.setProperty("--drop-size", `${size}px`);
  drop.style.width = drop.style.height = `${size}px`;

  const gameWidth = gameContainer.clientWidth;
  const maxX = Math.max(0, gameWidth - size);
  const xPosition = Math.random() * maxX;
  drop.style.left = xPosition + "px";
  drop.style.setProperty("--drop-distance", `${gameContainer.clientHeight + size + 40}px`);
  drop.style.animationDuration = type === "bad" ? "5s" : "6s";

  const pointsAwarded = type === "bad"
    ? (size >= 70 ? -3 : -1)
    : (size >= 70 ? 3 : 1);

  drop.addEventListener("click", () => {
    if (!gameRunning) return;

    score += pointsAwarded;
    scoreDisplay.textContent = score;
    drop.remove();
  });

  gameContainer.appendChild(drop);

  drop.addEventListener("animationend", () => {
    drop.remove();
  });
}

function createContaminatedDrop() {
  createDrop("bad");
}
