const prompts = [
  "Press A",
  "Press B",
  "Press X",
  "Press Y",
  "Press Start",
  "Flick Left Stick Up",
  "Flick Left Stick Down",
  "Flick Left Stick Left",
  "Flick Left Stick Right",
  "Flick Right Stick Up",
  "Flick Right Stick Down",
  "Flick Right Stick Left",
  "Flick Right Stick Right"
];

let score = 0;
let currentPrompt = "";
let totalAttempts = 0;
let mistakes = 0;
let gameStartTime = Date.now();
let timeLeft = 30;
let timerInterval;

const promptElement = document.getElementById("prompt");
const scoreElement = document.getElementById("score");

function startTimer() {
  timerInterval = setInterval(() => {
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      endGame();
    } else {
      document.getElementById("timeLeft").innerText = `Time: ${timeLeft}s`;
      timeLeft--;
    }
  }, 1000);
}

function endGame() {
  const container = document.querySelector('.container');
  const statsPage = document.querySelector('.stats-page');

  container.style.display = 'none';
  statsPage.style.display = 'flex';
  updateStats();
}

function updateStats() {
  // Calculate accuracy
  const accuracy = totalAttempts > 0 ? Math.min(Math.round((score / totalAttempts) * 100), 100) : 0;

  // Calculate APM (actions per minute)
  const minutesElapsed = (Date.now() - gameStartTime) / 60000;
  const speed = Math.round(score / minutesElapsed);

  // Update stats display
  document.getElementById("accuracy").innerText = `${accuracy}%`;
  document.getElementById("speed").innerText = `${speed} APM`;
  document.getElementById("mistakes").innerText = `${mistakes} Mistakes`;
}

const buttonMap = {
  0: "A",
  1: "B",
  2: "X",
  3: "Y",
  4: "LB",
  5: "RB",
  6: "LT",
  7: "RT",
  8: "Back",
  9: "Start",
  10: "L3",
  11: "R3"
};

// Randomly select a prompt to show
function getRandomPrompt() {
  return prompts[Math.floor(Math.random() * prompts.length)];
}

// Track button states
let buttonStates = {};
let readyToAccept = {};

// Check if the input matches the prompt
function checkInput(gamepad) {
  // Check buttons
  for (let i = 0; i < gamepad.buttons.length; i++) {
    let isPressed = gamepad.buttons[i].pressed;
    let buttonPrompt = `Press ${buttonMap[i]}`;

    // Initialize state tracking for this button if needed
    if (buttonStates[i] === undefined) {
      buttonStates[i] = false;
      readyToAccept[i] = true;
    }

    // Wait until button is released before allowing scoring again
    if (!isPressed) {
      readyToAccept[i] = true;
    }

    // Only count press if it's a new press, we're ready to accept, and it matches the prompt
    if (isPressed && !buttonStates[i] && readyToAccept[i]) {
      totalAttempts++;
      if (buttonPrompt === currentPrompt) {
        score++;
        scoreElement.innerText = `Score: ${score}`;
        currentPrompt = getRandomPrompt();
        promptElement.innerText = currentPrompt;
      } else {
        mistakes++;
      }
      updateStats();
      readyToAccept[i] = false; // Block until released again
    }

    // Update button state
    buttonStates[i] = isPressed;
  }
}

// Listen for gamepad connections and handle input
window.addEventListener("gamepadconnected", (e) => {
  console.log("Gamepad connected!", e.gamepad);
  currentPrompt = getRandomPrompt();
  promptElement.innerText = currentPrompt;
  startTimer();
  requestAnimationFrame(gameLoop);
});

// Update gamepad inputs every frame
let lastLeft = { x: 0, y: 0 };
let lastRight = { x: 0, y: 0 };
const threshold = 0.5;  // Flick strength sensitivity

function checkFlicks(gamepad) {
  let lsX = gamepad.axes[0];
  let lsY = gamepad.axes[1];
  let rsX = gamepad.axes[2];
  let rsY = gamepad.axes[3];

  // Handle successful flick
  function handleFlick() {
    score++;
    scoreElement.innerText = `Score: ${score}`;
    currentPrompt = getRandomPrompt();
    promptElement.innerText = currentPrompt;
  }

  // Detect LEFT stick flicks
  if (lsX > threshold && lastLeft.x <= threshold && currentPrompt === "Flick Left Stick Right") handleFlick();
  if (lsX < -threshold && lastLeft.x >= -threshold && currentPrompt === "Flick Left Stick Left") handleFlick();
  if (lsY > threshold && lastLeft.y <= threshold && currentPrompt === "Flick Left Stick Down") handleFlick();
  if (lsY < -threshold && lastLeft.y >= -threshold && currentPrompt === "Flick Left Stick Up") handleFlick();

  // Detect RIGHT stick flicks
  if (rsX > threshold && lastRight.x <= threshold && currentPrompt === "Flick Right Stick Right") handleFlick();
  if (rsX < -threshold && lastRight.x >= -threshold && currentPrompt === "Flick Right Stick Left") handleFlick();
  if (rsY > threshold && lastRight.y <= threshold && currentPrompt === "Flick Right Stick Down") handleFlick();
  if (rsY < -threshold && lastRight.y >= -threshold && currentPrompt === "Flick Right Stick Up") handleFlick();

  // Store the current state for the next check
  lastLeft.x = lsX;
  lastLeft.y = lsY;
  lastRight.x = rsX;
  lastRight.y = rsY;
}

function gameLoop() {
  const gamepads = navigator.getGamepads();
  if (gamepads[0]) {
    checkInput(gamepads[0]);
    checkFlicks(gamepads[0]);
  }
  requestAnimationFrame(gameLoop);
}

gameLoop(); // Start the game loop
