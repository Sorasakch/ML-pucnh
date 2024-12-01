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

let targetPosition = { x: 0, y: 0 };

function setRandomTargetPosition() {
  const canvasRect = canvasElement.getBoundingClientRect(); // ขอบเขตของ canvas
  const areaWidth = canvasRect.width;
  const areaHeight = canvasRect.height;

  const margin = 100; // ระยะห่างจากขอบ canvas
  targetPosition.x = Math.random() * (areaWidth - margin * 2) + margin;
  targetPosition.y = Math.random() * (areaHeight - margin * 2) + margin;

  // อัปเดตตำแหน่งของเป้าหมาย
  target.style.left = `${targetPosition.x}px`; // ใช้พิกัดสัมพัทธ์ใน canvas
  target.style.top = `${targetPosition.y}px`;
}

function punchDetected(handX, handY) {
  if (!isGameActive) return;

  const canvasRect = canvasElement.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();

  // แปลงตำแหน่งมือจาก canvas ไปยัง DOM
  const adjustedHandX = handX + canvasRect.left;
  const adjustedHandY = handY + canvasRect.top;

  // ขยาย hitbox ของเป้าหมาย
  const margin = 50; // เพิ่มระยะการตรวจจับ
  if (
    adjustedHandX >= targetRect.left - margin &&
    adjustedHandX <= targetRect.right + margin &&
    adjustedHandY >= targetRect.top - margin &&
    adjustedHandY <= targetRect.bottom + margin
  ) {
    console.log("Punch detected!");
    if (health > 0) {
      health -= 1;
      healthBar.style.width = health + "%";
      healthNumber.textContent = health;

      punchSound.play();
      setRandomTargetPosition();

      if (health <= 0) {
        endGame(true);
      }
    }
  }

  // Debug: วาดกรอบเป้าหมาย
  const canvasScaleX = canvasElement.width / canvasRect.width; // อัตราส่วนการย่อ/ขยายแนวนอน
  const canvasScaleY = canvasElement.height / canvasRect.height; // อัตราส่วนการย่อ/ขยายแนวตั้ง

  // แปลงตำแหน่งและขนาดของเป้าหมายจาก DOM ไปยัง canvas
  const targetCanvasX = (targetRect.left - canvasRect.left) * canvasScaleX;
  const targetCanvasY = (targetRect.top - canvasRect.top) * canvasScaleY;
  const targetCanvasWidth = targetRect.width * canvasScaleX;
  const targetCanvasHeight = targetRect.height * canvasScaleY;
  // Debug: วาดกรอบเป้าหมาย
  canvasCtx.fillStyle = "rgba(255, 255, 0, 0.5)";
  canvasCtx.fillRect(
    targetRect.left - canvasRect.left,
    targetRect.top - canvasRect.top,
    targetRect.width,
    targetRect.height
  );

  // Debug: วาดจุดตำแหน่งมือ
  canvasCtx.beginPath();
  canvasCtx.arc(handX, handY, 10, 0, 2 * Math.PI);
  canvasCtx.fillStyle = "blue";
  canvasCtx.fill();
  canvasCtx.closePath();
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
  if (videoElement.videoWidth && videoElement.videoHeight) {
    canvasElement.width = videoElement.videoWidth;
    canvasElement.height = videoElement.videoHeight;
  }
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
    if (videoElement.videoWidth && videoElement.videoHeight) {
      canvasElement.width = videoElement.videoWidth;
      canvasElement.height = videoElement.videoHeight;
    }
    await hands.send({ image: videoElement });
  },
  width: 854,
  height: 480
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

      // ใช้จุดปลายนิ้วชี้แทนข้อมือ
      const indexFingerTip = landmarks[8]; // จุดปลายนิ้วชี้
      const handX = indexFingerTip.x * canvasElement.width;
      const handY = indexFingerTip.y * canvasElement.height;

      punchDetected(handX, handY);
    }
  }

  canvasCtx.restore();
}

restartButton.addEventListener('click', resetGame);
