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


const hitSound = new Audio("hit.mp3");
hitSound.volume = 0.4;

function getClickerToken() {
  if (typeof GameSystem === "undefined") return 0;
  return GameSystem.getItemCount("c");
}

// ===== 敵撃破 =====
function defeatEnemy() {

  let reward = Math.floor(100 * (1 + skills.coinSkill * 0.2));

  gainCoins(reward);

  if (typeof GameSystem !== 'undefined') {
    GameSystem.addCoins(reward);
  }

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

// ===== コイン加算 =====
function gainCoins(amount) {
  coin += amount;
  updateUI();
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

// ===== スキル =====
let skillSeeds = 5;

let skills = {
  attackSkill: 0,
  autoSkill: 0,
  critSkill: 0,
  coinSkill: 0
};

function upgradeSkill(skillName) {

  const cost = 1;

  if (getClickerToken() < cost) {
    alert("クリッカートークンが足りません！");
    return;
  }

  GameSystem.useItem("c", cost);

  skills[skillName]++;

  applySkills();
  updateUI();
}

function applySkills() {

  // 攻撃力
  attack = 1 + skills.attackSkill;

  // 自動攻撃
  auto = skills.autoSkill;

}

function doDamage() {

  addCombo();

  let damage = attack * getComboMultiplier();



  playHitSound();

  // クリ率
  let critChance = skills.critSkill * 0.1;

  if (Math.random() < critChance) {
    damage *= 3;

    enemyEl.style.filter =
      "drop-shadow(0 0 30px gold)";
      
    setTimeout(() => {
      enemyEl.style.filter = "";
    }, 100);
  }

  hp -= damage;

  // 被弾アニメ
  enemyEl.classList.remove("hit");
  void enemyEl.offsetWidth;
  enemyEl.classList.add("hit");

  if (hp <= 0) {
    defeatEnemy();
  } else {
    updateUI();
  }
}

document.getElementById("attackSkillBtn").onclick = () => {
  upgradeSkill("attackSkill");
};

document.getElementById("autoSkillBtn").onclick = () => {
  upgradeSkill("autoSkill");
};

document.getElementById("critSkillBtn").onclick = () => {
  upgradeSkill("critSkill");
};

document.getElementById("coinSkillBtn").onclick = () => {
  upgradeSkill("coinSkill");
};


function playHitSound() {
  const sound = hitSound.cloneNode();
  sound.volume = 0.4;
  sound.play();
}

//ここを一番最後にする
function updateUI() {


  hpEl.textContent = hp + " / " + maxHp;
  hpBarEl.max = maxHp;
  hpBarEl.value = hp;

  atkEl.textContent = attack;
  autoEl.textContent = auto;
  coinEl.textContent = coin;

  // スキルUI
  document.getElementById("seedCount").textContent =
  getClickerToken();

  document.getElementById("attackSkillLv").textContent =
    skills.attackSkill;

  document.getElementById("autoSkillLv").textContent =
    skills.autoSkill;

  document.getElementById("critSkillLv").textContent =
    skills.critSkill;

  document.getElementById("coinSkillLv").textContent =
    skills.coinSkill;


  document.getElementById("comboCount").textContent =
    combo;
  
  document.getElementById("comboBar").value =
    combo;

  document.getElementById("comboMulti").textContent =
    "x" + getComboMultiplier().toFixed(1);

    checkAchievements();
}

function addPlayCount() {
  if (typeof GameSystem !== "undefined") {
    GameSystem.playCount = (GameSystem.playCount || 0) + 1;
  }
}

function checkAchievements() {

  const playCount = (GameSystem?.playCount || 0);

  // プレイ回数系
  if (playCount >= 1) GameSystem.unlockAchievement("achieve_c_play_1");
  if (playCount >= 10) GameSystem.unlockAchievement("achieve_c_play_10");
  if (playCount >= 100) GameSystem.unlockAchievement("achieve_c_play_100");

  // 攻撃力
  if (attack >= 10) GameSystem.unlockAchievement("achieve_c_manual_10");
  if (attack >= 100) GameSystem.unlockAchievement("achieve_c_manual_100");
  if (attack >= 1000) GameSystem.unlockAchievement("achieve_c_manual_1000");

  // 自動攻撃
  if (auto >= 10) GameSystem.unlockAchievement("achieve_c_auto_10");
  if (auto >= 100) GameSystem.unlockAchievement("achieve_c_auto_100");
  if (auto >= 1000) GameSystem.unlockAchievement("achieve_c_auto_1000");
}
// =========================
// 🏆 実績システム
// =========================

let unlockedAchievements = new Set();

// 初期化（ロード）
function loadAchievements() {
  if (typeof GameSystem !== "undefined") {
    const saved = GameSystem.achievements || [];
    unlockedAchievements = new Set(saved);
  }
}

// 保存
function saveAchievements() {
  if (typeof GameSystem !== "undefined") {
    GameSystem.achievements = Array.from(unlockedAchievements);
  }
}

// 実績解除処理
function unlockAchievement(id) {
  if (unlockedAchievements.has(id)) return;

  unlockedAchievements.add(id);
  saveAchievements();

  const ach = GameMasterData.achievements.find(a => a.id === id);
  if (!ach) return;

  showAchievementPopup(ach);
}

// =========================
// 🔥 コンボシステム
// =========================

let combo = 0;

const MAX_COMBO = 100;

// 最後にクリックした時間
let lastComboTime = Date.now();

function getComboMultiplier() {

  if (combo >= 100) return 5.0;
  if (combo >= 80) return 4.0;
  if (combo >= 60) return 3.0;
  if (combo >= 40) return 2.5;
  if (combo >= 20) return 2.0;
  if (combo >= 10) return 1.5;

  return 1.0;
}

function addCombo() {

  combo += 2;

  if (combo > MAX_COMBO) {
    combo = MAX_COMBO;
  }

  lastComboTime = Date.now();

  updateUI();
}

setInterval(() => {

  const now = Date.now();

  // 1秒クリックしてなかったら減少開始
  if (now - lastComboTime > 1000) {

    if (combo > 0) {

      combo -= 1;

      if (combo < 0) {
        combo = 0;
      }

      updateUI();
    }
  }

}, 100);

// ポップアップ表示
function showAchievementPopup(ach) {
  const div = document.createElement("div");
  div.className = "achievement-popup";
  div.innerHTML = `
    <div class="ach-title">🏆 ${ach.name}</div>
    <div class="ach-desc">${ach.desc}</div>
    <div class="ach-flavor">${ach.flavor}</div>
  `;

  document.body.appendChild(div);

  setTimeout(() => {
    div.classList.add("show");
  }, 10);

  setTimeout(() => {
    div.remove();
  }, 3000);
}

updateUI();