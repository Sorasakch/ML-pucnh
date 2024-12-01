let health = 100;
let timeLeft = 60;
let intervalId;
let isGameActive = false; // สถานะเกมกำลังดำเนินอยู่

// โหลดไฟล์เสียงต่อย
const punchSound = new Audio('punch_sound.mp3');

const healthBar = document.getElementById("health-bar");
const healthNumber = document.getElementById("health-number");
const timerElement = document.getElementById("timer");
const gameResult = document.getElementById("game-result");
const resultMessage = document.getElementById("result-message");
const restartButton = document.getElementById("restart-button");

let punchCooldown = false;

function punchDetected() {
  if (!isGameActive) return; // หยุดการทำงานหากเกมไม่ได้ดำเนินอยู่

  if (health > 0) {
    health -= 10;
    console.log("Health reduced to:", health);

    healthBar.style.width = health + "%";
    healthNumber.textContent = health;

    // เล่นเสียงต่อย
    punchSound.play();

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
  startTimer();
  punchCooldown = false;
  isGameActive = true; // เปิดสถานะเกมเมื่อเริ่มใหม่
}

function endGame(playerWon) {
  clearInterval(intervalId);
  const message = playerWon ? 'คุณชนะ! ศัตรูเลือดหมดแล้ว!' : 'หมดเวลาแล้ว! คุณแพ้!';
  showResult(message);
  isGameActive = false; // ปิดสถานะเกมเมื่อจบ
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
  maxNumHands: 1,
  modelComplexity: 1,
  minDetectionConfidence: 0.7,
  minTrackingConfidence: 0.7
});

hands.onResults(onResults);

const camera = new Camera(videoElement, {
  onFrame: async () => {
    await hands.send({ image: videoElement });
  },
  width: 640,
  height: 480
});

camera.start();

function onResults(results) {
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

  if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
    for (const landmarks of results.multiHandLandmarks) {
      // วาดเส้นเชื่อมและจุดข้อต่อนิ้วมือ
      drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, { color: '#00FF00', lineWidth: 2 });
      drawLandmarks(canvasCtx, landmarks, { color: '#FF0000', lineWidth: 4 });

      const wrist = landmarks[0];
      const indexFingerTip = landmarks[8];
      const thumbTip = landmarks[4];

      // ตรวจจับการกำหมัด
      const isFist = Math.abs(indexFingerTip.x - thumbTip.x) < 0.05 &&
        Math.abs(indexFingerTip.y - thumbTip.y) < 0.05;

      if (isFist && !punchCooldown) {
        punchDetected();
        punchCooldown = true;

        setTimeout(() => {
          punchCooldown = false;
        }, 500);
      }
    }
  }

  canvasCtx.restore();
}

restartButton.addEventListener('click', resetGame);
