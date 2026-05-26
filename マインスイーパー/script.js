// ===== ステータス =====
let maxHp = 100;
let hp = maxHp;

let attack = 1;
let auto = 0;
let coin = 0;

// ===== UI =====
const hpEl = document.getElementById("hp");
const atkEl = document.getElementById("attack");
const autoEl = document.getElementById("auto");
const coinEl = document.getElementById("coin");

function updateUI() {
  hpEl.textContent = hp + " / " + maxHp;
  atkEl.textContent = attack;
  autoEl.textContent = auto;
  coinEl.textContent = coin;
}

updateUI();

// ===== 敵撃破 =====
function defeatEnemy() {
  coin += 5;

  // インフレ
  maxHp = Math.floor(maxHp * 1.2 + 10);

  hp = maxHp;
  if (typeof GameSystem !== 'undefined') {
    GameSystem.addCoins(100); // 数字は一旦100統一で 調整は後々
  }
  updateUI();
}

// ===== 攻撃 =====
document.getElementById("attackBtn").onclick = () => {
  hp -= attack;

  if (hp <= 0) {
    defeatEnemy();
  } else {
    updateUI();
  }
};

// 自動攻撃
setInterval(() => {
  hp -= auto;

  if (hp <= 0) {
    defeatEnemy();
  } else {
    updateUI();
  }
}, 1000);

// ===== ショップ =====
document.getElementById("atkUp").onclick = () => {
  if (coin >= 10) {
    coin -= 10;
    attack++;
    updateUI();
  }
};

document.getElementById("autoUp").onclick = () => {
  if (coin >= 20) {
    coin -= 20;
    auto++;
    updateUI();
  }
};

// ===== 画面切り替え =====
const mainGame = document.getElementById("mainGame");
const memoryGame = document.getElementById("memoryGame");
const dodgeGame = document.getElementById("dodgeGame");

// 神経衰弱へ
document.getElementById("toMemory").onclick = () => {
  mainGame.style.display = "none";
  memoryGame.style.display = "block";
  startMemoryGame();
};

// 戻る
document.getElementById("backFromMemory").onclick = () => {
  memoryGame.style.display = "none";
  mainGame.style.display = "block";
};

// 回避ゲームへ
document.getElementById("toDodge").onclick = () => {
  mainGame.style.display = "none";
  dodgeGame.style.display = "block";
  startDodgeGame();
};

document.getElementById("backFromDodge").onclick = () => {
  stopDodgeGame();
  dodgeGame.style.display = "none";
  mainGame.style.display = "block";
};

// ===== 神経衰弱 =====
const board = document.getElementById("board");
let cards = [];
let first = null;
let second = null;
let lock = false;
let miss = 0;

function startMemoryGame() {
  board.innerHTML = "";
  miss = 0;
  document.getElementById("miss").textContent = miss;

  cards = [...Array(8).keys()].flatMap(n => [n, n]);
  cards.sort(() => Math.random() - 0.5);

  cards.forEach(num => {
    const div = document.createElement("div");
    div.className = "card";
    div.dataset.value = num;

    div.onclick = () => flipCard(div);
    board.appendChild(div);
  });
}

function flipCard(card) {
  if (lock || card.classList.contains("open")) return;

  card.textContent = card.dataset.value;
  card.classList.add("open");

  if (!first) {
    first = card;
  } else {
    second = card;
    lock = true;

    if (first.dataset.value === second.dataset.value) {
      resetTurn();
      checkClear();
    } else {
      miss++;
      document.getElementById("miss").textContent = miss;

      setTimeout(() => {
        first.textContent = "";
        second.textContent = "";
        first.classList.remove("open");
        second.classList.remove("open");
        resetTurn();
      }, 700);

      if (miss >= 5) {
        setTimeout(() => {
          alert("ゲームオーバー");
          startMemoryGame();
        }, 300);
      }
    }
  }
}

function resetTurn() {
  first = null;
  second = null;
  lock = false;
}

function checkClear() {
  if (document.querySelectorAll(".open").length === 16) {
    coin += 150; // ←変更済み
    alert("クリア！コイン+150");
    startMemoryGame();
    updateUI();
  }
}

// ===== 回避ゲーム =====
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let player = { x: 50, y: 150, size: 10 };
let obstacles = [];
let gameRunning = false;
let time = 0;
let interval;

canvas.addEventListener("mousemove", (e) => {
  const rect = canvas.getBoundingClientRect();
  player.x = e.clientX - rect.left;
  player.y = e.clientY - rect.top;
});

function startDodgeGame() {
  obstacles = [];
  time = 0;
  gameRunning = true;
  interval = setInterval(updateDodge, 16);
}

function stopDodgeGame() {
  clearInterval(interval);
  gameRunning = false;
}

function updateDodge() {
  if (!gameRunning) return;

  time += 0.016;
  document.getElementById("time").textContent = time.toFixed(1);

  if (Math.random() < 0.05) {
    obstacles.push({
      x: canvas.width,
      y: Math.random() * canvas.height,
      w: 20,
      h: 40,
      speed: 3 + Math.random() * 2
    });
  }

  obstacles.forEach(o => o.x -= o.speed);

  for (let o of obstacles) {
    if (
      player.x < o.x + o.w &&
      player.x + player.size > o.x &&
      player.y < o.y + o.h &&
      player.y + player.size > o.y
    ) {
      endDodgeGame();
      return;
    }
  }

  drawDodge();
}

function drawDodge() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "lime";
  ctx.fillRect(player.x, player.y, player.size, player.size);

  ctx.fillStyle = "red";
  obstacles.forEach(o => {
    ctx.fillRect(o.x, o.y, o.w, o.h);
  });
}

function endDodgeGame() {
  stopDodgeGame();

  const reward = Math.floor(time * 2);
  coin += reward;

  alert("終了！コイン+" + reward);

  dodgeGame.style.display = "none";
  mainGame.style.display = "block";
  updateUI();
}
