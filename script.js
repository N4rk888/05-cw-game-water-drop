// Variables to control game state
let gameRunning = false;
let dropMaker;
let contaminatedDropMaker;
let addTimeClockMaker;
let umbrellaSpawnTimers = [];
let timerInterval;
let score = 0;
let timeRemaining = 30;
let confettiInterval;
let currentDifficulty = "easy";
const umbrellaProtectionDurationMs = 6000;
const addTimeClockSpawnIntervalMs = 1200;
let umbrellaProtectionUntil = 0;
let umbrellaProtectionTimerId;
let cursorX = 0;
let cursorY = 0;
let latestPointerX = 0;
let latestPointerY = 0;
let pointerProtectionFrameId = 0;
let halfWayMilestoneShown = false;
let winMilestoneShown = false;
let milestoneMessageTimerId;
const WIN_SCORE_THRESHOLD = 60;

const winMusic = new Audio("audio/Water-Drop-Game_winMusic.mp3");
winMusic.preload = "auto";

const scoreDisplay = document.getElementById("score");
const timeDisplay = document.getElementById("time");
const gameContainer = document.getElementById("game-container");
const popup = document.getElementById("game-over-popup");
const popupMessage = document.getElementById("popup-message");
const popupContent = document.querySelector(".popup-content");
const milestoneMessage = document.getElementById("milestone-message");
const startBtn = document.getElementById("start-btn");
const resetBtn = document.getElementById("reset-btn");
const restartBtn = document.getElementById("restart-btn");
const popupResetBtn = document.getElementById("popup-reset-btn");
const helpBtn = document.getElementById("help-btn");
const difficultyBtn = document.getElementById("difficulty-btn");
const helpPopup = document.getElementById("help-popup");
const difficultyPopup = document.getElementById("difficulty-popup");
const difficultyStatus = document.getElementById("difficulty-status");
const closePopupButtons = document.querySelectorAll(".close-popup-btn");
const helpMenuImage = document.querySelector(".help-menu-image");
const umbrellaTimer = document.createElement("div");
const difficultyOptionButtons = [
  document.getElementById("easy-btn"),
  document.getElementById("medium-btn"),
  document.getElementById("hard-btn")
];

umbrellaTimer.className = "umbrella-protection-timer hidden";
umbrellaTimer.textContent = "6.0s";
gameContainer.appendChild(umbrellaTimer);

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
popupResetBtn.addEventListener("click", resetGame);
helpBtn.addEventListener("click", () => openInfoPopup(helpPopup));
difficultyBtn.addEventListener("click", () => openInfoPopup(difficultyPopup));
difficultyOptionButtons.forEach((button) => {
  button.addEventListener("click", () => setDifficulty(button.id.replace("-btn", "")));
});
closePopupButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const popupId = button.getAttribute("data-popup");
    const popupToClose = document.getElementById(popupId);
    if (popupToClose) {
      popupToClose.classList.add("hidden");
    }
  });
});

function playWinMusic() {
  winMusic.currentTime = 0;
  const playPromise = winMusic.play();

  if (playPromise !== undefined) {
    playPromise.catch(() => {
      // Ignore autoplay-policy errors when audio playback is blocked.
    });
  }
}

function stopWinMusic() {
  winMusic.pause();
  winMusic.currentTime = 0;
}

function clearMilestoneMessage() {
  if (!milestoneMessage) return;
  clearTimeout(milestoneMessageTimerId);
  milestoneMessage.classList.remove("show");
  milestoneMessage.textContent = "";
}

function showMilestoneMessage(messageText) {
  if (!milestoneMessage) return;

  clearTimeout(milestoneMessageTimerId);
  milestoneMessage.classList.remove("show");
  milestoneMessage.textContent = messageText;
  void milestoneMessage.offsetWidth;
  milestoneMessage.classList.add("show");
  milestoneMessageTimerId = setTimeout(() => {
    milestoneMessage.classList.remove("show");
  }, 2000);
}

function updateMilestones() {
  if (!halfWayMilestoneShown && score >= 30) {
    halfWayMilestoneShown = true;
    showMilestoneMessage("Good Job, You are Half Way There!");
  }

  if (!winMilestoneShown && score >= 60) {
    winMilestoneShown = true;
    showMilestoneMessage("You've Won, How High Can You Get Your Score?");
  }
}

function resetMilestones() {
  halfWayMilestoneShown = false;
  winMilestoneShown = false;
  clearMilestoneMessage();
}

function openInfoPopup(targetPopup) {
  hideGameOverPopup();
  document.querySelectorAll(".popup").forEach((popupElement) => {
    if (popupElement !== targetPopup) {
      popupElement.classList.add("hidden");
    }
  });
  targetPopup.classList.remove("hidden");
}

function getDifficultySettings() {
  switch (currentDifficulty) {
    case "medium":
      return { spawnInterval: 300, contaminatedDuration: 2500, goodDropInterval: 650 };
    case "hard":
      return { spawnInterval: 233, contaminatedDuration: 1667, goodDropInterval: 500 };
    default:
      return { spawnInterval: 700, contaminatedDuration: 5000, goodDropInterval: 250 };
  }
}

function updateDifficultyButtons() {
  difficultyOptionButtons.forEach((button) => {
    const isActive = button.id === `${currentDifficulty}-btn`;
    button.classList.toggle("active", isActive);
  });

  if (difficultyStatus) {
    const label = currentDifficulty.charAt(0).toUpperCase() + currentDifficulty.slice(1);
    difficultyStatus.textContent = `Current: ${label}`;
  }
}

const helpMenuImages = {
  easy: "img/helpMenu_Water-Drop-Game.png",
  medium: "img/helpMenu_Water-Drop-Game_MEDIUM.png",
  hard: "img/helpMenu_Water-Drop-Game_HARD.png"
};

function setDifficulty(level) {
  currentDifficulty = level;
  helpMenuImage.src = helpMenuImages[level] || helpMenuImages.easy;
  updateDifficultyButtons();
  const wasRunning = gameRunning;
  resetGame();
  if (wasRunning) {
    startGame();
  }
  difficultyPopup.classList.add("hidden");
}

function startGame() {
  if (gameRunning) return;

  clearInterval(confettiInterval);
  stopWinMusic();

  score = 0;
  timeRemaining = 30;
  scoreDisplay.textContent = score;
  timeDisplay.textContent = timeRemaining;
  resetMilestones();
  hideGameOverPopup();

  clearInterval(dropMaker);
  clearInterval(contaminatedDropMaker);
  clearInterval(addTimeClockMaker);
  clearUmbrellaSpawnTimers();
  clearInterval(timerInterval);
  document.querySelectorAll(".water-drop, .umbrella-drop, .add-time-clock").forEach((drop) => drop.remove());

  gameRunning = true;
  umbrellaProtectionUntil = 0;
  stopUmbrellaProtectionCountdown();

  const difficultySettings = getDifficultySettings();
  dropMaker = setInterval(createDrop, difficultySettings.goodDropInterval);
  contaminatedDropMaker = setInterval(createContaminatedDrop, difficultySettings.spawnInterval);
  createAddTimeClock();
  addTimeClockMaker = setInterval(createAddTimeClock, addTimeClockSpawnIntervalMs);
  scheduleUmbrellaSpawns();
  timerInterval = setInterval(updateTimer, 1000);
}

function resetGame() {
  clearInterval(dropMaker);
  clearInterval(contaminatedDropMaker);
  clearInterval(addTimeClockMaker);
  clearUmbrellaSpawnTimers();
  clearInterval(timerInterval);
  clearInterval(confettiInterval);
  stopWinMusic();
  gameRunning = false;
  umbrellaProtectionUntil = 0;
  stopUmbrellaProtectionCountdown();

  document.querySelectorAll(".water-drop, .umbrella-drop, .add-time-clock").forEach((drop) => drop.remove());
  score = 0;
  timeRemaining = 30;
  scoreDisplay.textContent = score;
  timeDisplay.textContent = timeRemaining;
  resetMilestones();
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
  clearInterval(addTimeClockMaker);
  clearUmbrellaSpawnTimers();
  clearInterval(timerInterval);
  gameRunning = false;
  umbrellaProtectionUntil = 0;
  stopUmbrellaProtectionCountdown();

  showOutcomeMessage();
  popup.classList.remove("hidden");
}

function showOutcomeMessage() {
  if (score > WIN_SCORE_THRESHOLD) {
    const randomWinMessage = winMessages[Math.floor(Math.random() * winMessages.length)];
    popupMessage.textContent = randomWinMessage;
    popupContent.style.backgroundColor = "#4CAF50";
    popupContent.style.color = "white";
    popupContent.classList.add("win-state");
    startConfettiLoop();
    playWinMusic();
  } else {
    const randomLossMessage = lossMessages[Math.floor(Math.random() * lossMessages.length)];
    popupMessage.textContent = randomLossMessage;
    popupContent.style.backgroundColor = "#f44336";
    popupContent.style.color = "white";
    popupContent.classList.remove("win-state");
    clearInterval(confettiInterval);
    stopWinMusic();
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
  const difficultySettings = getDifficultySettings();
  const animationDuration = type === "bad"
    ? `${difficultySettings.contaminatedDuration}ms`
    : "6s";
  drop.style.left = xPosition + "px";
  drop.style.setProperty("--drop-distance", `${gameContainer.clientHeight + size + 40}px`);
  drop.style.animationDuration = animationDuration;

  const pointsAwarded = type === "bad"
    ? (size >= 70 ? -3 : -1)
    : (size >= 38 && size <= 46 ? 1 : size >= 47 && size <= 54 ? 2 : size >= 55 && size <= 62 ? 3 : 4);

  drop.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    if (!gameRunning) return;

    score += pointsAwarded;
    scoreDisplay.textContent = score;
    updateMilestones();
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

function createAddTimeClock() {
  if (!gameRunning) return;

  const clock = document.createElement("img");
  clock.className = "add-time-clock";
  clock.src = "img/addTimeClock_Water-Drop-Game.png";
  clock.alt = "Add time clock";
  clock.draggable = false;

  const baseSize = Math.min(86, Math.max(48, gameContainer.clientWidth * 0.09));
  const size = baseSize;

  const gameWidth = gameContainer.clientWidth;
  const maxX = Math.max(0, gameWidth - size);
  clock.style.width = `${size}px`;
  clock.style.left = `${Math.random() * maxX}px`;
  clock.style.setProperty("--drop-distance", `${gameContainer.clientHeight + size + 40}px`);
  clock.style.animationDuration = "6s";

  clock.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    if (!gameRunning) return;
    timeRemaining += 3;
    timeDisplay.textContent = timeRemaining;
    clock.remove();
  });

  gameContainer.appendChild(clock);

  clock.addEventListener("animationend", () => {
    clock.remove();
  });
}

function clearUmbrellaSpawnTimers() {
  umbrellaSpawnTimers.forEach((timerId) => clearTimeout(timerId));
  umbrellaSpawnTimers = [];
}

function scheduleUmbrellaSpawns() {
  clearUmbrellaSpawnTimers();

  // Spawn one umbrella immediately, then at most two more during the 30s round.
  createUmbrellaDrop();
  const additionalSpawnDelays = [10000, 20000];

  additionalSpawnDelays.forEach((delay) => {
    const timerId = setTimeout(() => {
      if (gameRunning) {
        createUmbrellaDrop();
      }
    }, delay);
    umbrellaSpawnTimers.push(timerId);
  });
}

function activateUmbrellaProtection() {
  umbrellaProtectionUntil = Date.now() + umbrellaProtectionDurationMs;
  startUmbrellaProtectionCountdown();
}

function updateUmbrellaTimerPosition() {
  const xOffset = 16;
  const yOffset = -24;
  const maxX = window.innerWidth - 80;
  const maxY = window.innerHeight - 32;
  const displayX = Math.max(8, Math.min(maxX, cursorX + xOffset));
  const displayY = Math.max(8, Math.min(maxY, cursorY + yOffset));
  umbrellaTimer.style.left = `${displayX}px`;
  umbrellaTimer.style.top = `${displayY}px`;
}

function updateUmbrellaProtectionCountdown() {
  const remainingMs = umbrellaProtectionUntil - Date.now();

  if (!gameRunning || remainingMs <= 0) {
    umbrellaProtectionUntil = 0;
    stopUmbrellaProtectionCountdown();
    return;
  }

  umbrellaTimer.textContent = `${(remainingMs / 1000).toFixed(1)}s`;
  updateUmbrellaTimerPosition();
}

function startUmbrellaProtectionCountdown() {
  clearInterval(umbrellaProtectionTimerId);
  umbrellaTimer.classList.remove("hidden");
  updateUmbrellaProtectionCountdown();
  umbrellaProtectionTimerId = setInterval(updateUmbrellaProtectionCountdown, 50);
}

function stopUmbrellaProtectionCountdown() {
  clearInterval(umbrellaProtectionTimerId);
  umbrellaTimer.classList.add("hidden");
}

function handleCursorProtection(event) {
  latestPointerX = event.clientX;
  latestPointerY = event.clientY;

  if (pointerProtectionFrameId) return;

  pointerProtectionFrameId = requestAnimationFrame(() => {
    pointerProtectionFrameId = 0;
    cursorX = latestPointerX;
    cursorY = latestPointerY;
    updateUmbrellaTimerPosition();

    if (!gameRunning || Date.now() > umbrellaProtectionUntil) return;

    const hoveredElement = document.elementFromPoint(cursorX, cursorY);
    const contaminatedDrop = hoveredElement?.closest?.(".water-drop.bad-drop");

    if (contaminatedDrop && gameContainer.contains(contaminatedDrop)) {
      contaminatedDrop.remove();
    }
  });
}

function createUmbrellaDrop() {
  if (!gameRunning) return;

  const umbrella = document.createElement("img");
  umbrella.className = "umbrella-drop";
  umbrella.src = "img/playerUmbrella_Water-Drop-Game.png";
  umbrella.alt = "Falling umbrella";
  umbrella.draggable = false;

  const baseSize = Math.min(94, Math.max(52, gameContainer.clientWidth * 0.1));
  const sizeMultiplier = Math.random() * 0.5 + 0.75;
  const size = baseSize * sizeMultiplier;

  const gameWidth = gameContainer.clientWidth;
  const gameHeight = gameContainer.clientHeight;
  const maxX = Math.max(0, gameWidth - size);
  const maxY = Math.max(0, gameHeight - size);
  umbrella.style.width = `${size}px`;
  umbrella.style.left = `${Math.random() * maxX}px`;
  umbrella.style.top = `${Math.random() * maxY}px`;
  umbrella.style.animationDuration = "1.2s";

  gameContainer.appendChild(umbrella);

  umbrella.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    if (!gameRunning) return;
    cursorX = event.clientX;
    cursorY = event.clientY;
    activateUmbrellaProtection();
    umbrella.remove();
  });

  setTimeout(() => {
    umbrella.remove();
  }, 6000);
}

gameContainer.addEventListener("mousemove", handleCursorProtection);
gameContainer.addEventListener("selectstart", (event) => {
  event.preventDefault();
});
gameContainer.addEventListener("dragstart", (event) => {
  event.preventDefault();
});
