// ===== ステータス =====
let maxHp = 100;
let hp = maxHp;

let attack = 1;
let auto = 0;
let coin = 0;

// ===== UI要素 =====
const hpEl = document.getElementById("hp");
const hpBarEl = document.getElementById("hpBar");
const atkEl = document.getElementById("attack");
const autoEl = document.getElementById("auto");
const coinEl = document.getElementById("coin");
const enemyEl = document.getElementById("enemy"); // 敵画像

function updateUI() {
  hpEl.textContent = hp + " / " + maxHp;
  hpBarEl.max = maxHp;
  hpBarEl.value = hp;

  atkEl.textContent = attack;
  autoEl.textContent = auto;
  coinEl.textContent = coin;
}

updateUI();

// ===== 敵撃破 =====
function defeatEnemy() {
  coin += 5;

  // 撃破時に一瞬小さくする演出
  enemyEl.style.transform = "scale(0)";
  setTimeout(() => {
    enemyEl.style.transform = "scale(1)";
  }, 100);

  // インフレ
  maxHp = Math.floor(maxHp * 1.2 + 10);
  hp = maxHp;
  updateUI();
}

// ===== 攻撃処理（共通） =====
function doDamage() {
  hp -= attack;

  // 敵画像が揺れるアニメーションを適用
  enemyEl.classList.remove("hit");
  void enemyEl.offsetWidth; // リフローを起こしてアニメーションをリセット
  enemyEl.classList.add("hit");

  if (hp <= 0) {
    defeatEnemy();
  } else {
    updateUI();
  }
}

// 攻撃ボタンを押したとき
document.getElementById("attackBtn").onclick = doDamage;

// 敵の画像を直接クリックしたときも攻撃できるようにする
enemyEl.onclick = doDamage;

// 自動攻撃
setInterval(() => {
  if (auto > 0) {
    hp -= auto;
    if (hp <= 0) {
      defeatEnemy();
    } else {
      updateUI();
    }
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