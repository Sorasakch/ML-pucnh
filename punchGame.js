let health = 100;
let timeLeft = 60;
let intervalId;
let isGameActive = false;

// โหลดไฟล์เสียงต่อย
const punchSound = new Audio('punch_sound.mp3');

const healthBar = document.getElementById("health-bar");
const healthNumber = document.getElementById("health-number");
const timerElement = document.getElementById("timer");
const gameResult = document.getElementById("game-result");
const resultMessage = document.getElementById("result-message");
const restartButton = document.getElementById("restart-button");
const target = document.getElementById("target"); // HTML element สำหรับเป้าหมาย

let punchCooldown = false;
let targetPosition = { x: 0, y: 0 };

function setRandomTargetPosition() {
  const webcamContainer = document.getElementById("webcam-container");
  const areaWidth = webcamContainer.offsetWidth;
  const areaHeight = webcamContainer.offsetHeight;

  targetPosition.x = Math.random() * (areaWidth - 50); // -50 เพื่อให้อยู่ในขอบ
  targetPosition.y = Math.random() * (areaHeight - 50);

  target.style.left = `${targetPosition.x}px`;
  target.style.top = `${targetPosition.y}px`;
}

function punchDetected(handX, handY) {
  if (!isGameActive) return;

  const distance = Math.sqrt(
    Math.pow(handX - targetPosition.x, 2) + Math.pow(handY - targetPosition.y, 2)
  );

  if (distance < 50 && health > 0) {
    health -= 10;

    healthBar.style.width = health + "%";
    healthNumber.textContent = health;

    punchSound.play();
    setRandomTargetPosition();

    if (health <= 0) {
      endGame(true);
    }
  }
}

function startTimer() {
  intervalId = setInterval(() => {
    if (timeLeft > 0) {
      timeLeft--;
      timerElement.textContent = timeLeft;
    } else {
      endGame(false);
    }
  }, 1000);
}

function showResult(message) {
  resultMessage.textContent = message;
  gameResult.style.display = 'flex';
}

function resetGame() {
  health = 100;
  timeLeft = 60;
  healthBar.style.width = health + "%";
  healthNumber.textContent = health;
  timerElement.textContent = timeLeft;
  gameResult.style.display = 'none';

  clearInterval(intervalId);
  setRandomTargetPosition();
  startTimer();
  punchCooldown = false;
  isGameActive = true;
}

function endGame(playerWon) {
  clearInterval(intervalId);
  const message = playerWon ? 'คุณชนะ! ศัตรูเลือดหมดแล้ว!' : 'หมดเวลาแล้ว! คุณแพ้!';
  showResult(message);
  isGameActive = false;
}

window.addEventListener('DOMContentLoaded', () => {
  resetGame();
});

const videoElement = document.getElementById('webcam');
const canvasElement = document.getElementById('overlay');
const canvasCtx = canvasElement.getContext('2d');

const hands = new Hands({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});

hands.setOptions({
  maxNumHands: 2,
  modelComplexity: 1,
  minDetectionConfidence: 0.7,
  minTrackingConfidence: 0.7
});

hands.onResults(onResults);

const camera = new Camera(videoElement, {
  onFrame: async () => {
    await hands.send({ image: videoElement });
  },
  width: 1280,
  height: 720
});

camera.start(); // เริ่มกล้อง

function onResults(results) {
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

  if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
    for (const landmarks of results.multiHandLandmarks) {
      drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, { color: '#00FF00', lineWidth: 2 });
      drawLandmarks(canvasCtx, landmarks, { color: '#FF0000', lineWidth: 4 });

      const wrist = landmarks[0];
      const handX = wrist.x * canvasElement.width;
      const handY = wrist.y * canvasElement.height;

      punchDetected(handX, handY);
    }
  }

  canvasCtx.restore();
}



restartButton.addEventListener('click', resetGame);
