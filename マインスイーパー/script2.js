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

  let currentLv = skills[skillName];

  // 必要コスト
  let cost = 1;

  if (skillSeeds < cost) {
    alert("スキルの種が足りません！");
    return;
  }

  // 消費
  skillSeeds -= cost;

  // 共通保存
  if (typeof GameSystem !== 'undefined') {
    GameSystem.skillSeeds = skillSeeds;
  }

  // レベルアップ
  skills[skillName]++;

  // 効果適用
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

  let damage = attack;

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

//ここを一番最後にする
function updateUI() {

  // 共通データから取得
  if (typeof GameSystem !== 'undefined') {
    skillSeeds = GameSystem.skillSeeds || 0;
  }

  hpEl.textContent = hp + " / " + maxHp;
  hpBarEl.max = maxHp;
  hpBarEl.value = hp;

  atkEl.textContent = attack;
  autoEl.textContent = auto;
  coinEl.textContent = coin;

  // スキルUI
  document.getElementById("seedCount").textContent = skillSeeds;

  document.getElementById("attackSkillLv").textContent =
    skills.attackSkill;

  document.getElementById("autoSkillLv").textContent =
    skills.autoSkill;

  document.getElementById("critSkillLv").textContent =
    skills.critSkill;

  document.getElementById("coinSkillLv").textContent =
    skills.coinSkill;


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
  if (attack >= 1) GameSystem.unlockAchievement("achieve_c_manual_10");
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