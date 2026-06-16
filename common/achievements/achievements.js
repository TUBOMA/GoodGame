// --- 実績のデータ一覧 ---
// game: 'l'(ラストウォー), 'c'(クリッカー), 's'(神経衰弱), 'i'(イライラ棒), 'common'(ショップ等共通)
// tier: 数字が大きいほど難しい（順番並び替え用）
const achievementData = GameMasterData.achievements;

// --- ソート（並び替え）のルール ---
// 1. ゲーム順 (ラストウォー -> クリッカー -> 神経衰弱 -> イライラ棒 -> 共通)
const gameOrder = { 'l': 1, 'c': 2, 's': 3, 'i': 4, 'common': 5 };

achievementData.sort((a, b) => {
  if (gameOrder[a.game] !== gameOrder[b.game]) {
    return gameOrder[a.game] - gameOrder[b.game]; // ゲーム順
  }
  if (a.category !== b.category) {
    return a.category.localeCompare(b.category); // カテゴリのアルファベット順
  }
  return a.tier - b.tier; // 1回 -> 10回 -> 100回 の順
});

// ==========================================
// 🏆 画面を最新の状態に作り直す関数
// ==========================================
function renderAchievements() {
  const container = document.getElementById('achievement-list');
  if (!container) return;
  
  // ★ポイント：古いカードがダブらないように、一旦中身を完全に空っぽにする
  container.innerHTML = '';

  const totalAchievements = achievementData.length;
  let unlockedCount = 0;

  achievementData.forEach(ach => {
    // 1. div要素（カード）を作る
    const card = document.createElement('div');
    card.className = 'achievement-card';
    card.dataset.id = ach.id;

    // 2. 解除済みかどうかの判定
    const isUnlocked = typeof GameSystem !== 'undefined' && GameSystem.hasAchievement(ach.id);
    
    // 解除済みならカウントを増やす
    if (isUnlocked) {
        unlockedCount++;
    }

    // 3. 中身のHTMLを組み立てる
    let htmlContent = `
      <h3>${ach.name}</h3>
      <p class="ach-desc">${ach.desc}</p>
    `;

    // 達成済みの場合のみ、フレーバーテキストと「ボタン」を追加する
    if (isUnlocked) {
      htmlContent += `<p class="ach-flavor" style="margin-top: 10px; font-style: italic; color: #555; font-size: 0.9em; border-top: 1px dashed #ccc; padding-top: 5px;">「${ach.flavor}」</p>`;
      
      // 現在の称号かどうかをチェックしてボタンを描画
      const currentTitle = GameSystem.getSelectedTitle();
      if (currentTitle === ach.id) {
        // 現在表示中の場合
        htmlContent += `<button class="btn set-title-btn" disabled style="margin-top: 15px; background-color: #facc15; color: #000; width: 100%; opacity: 1;">⭐ 現在の称号</button>`;
      } else {
        // 別の称号の場合
        htmlContent += `<button class="btn set-title-btn" style="margin-top: 15px; background-color: #38bdf8; color: #0f172a; width: 100%;">これを称号にする</button>`;
      }
    }

    card.innerHTML = htmlContent;

    // 4. 未達成ならロック状態の見た目にする
    if (!isUnlocked) {
      card.classList.add('locked');
    }

    // 5. コンテナに追加する
    container.appendChild(card);

    // ボタンを押した時の処理
    if (isUnlocked) {
      const btn = card.querySelector('.set-title-btn');
      if (btn && !btn.disabled) {
        btn.addEventListener('click', () => {
          GameSystem.setSelectedTitle(ach.id); // セーブデータに登録
          // ★変更：画面をリロードするのではなく、その場で最新状態に描き直す！
          renderAchievements();
        });
      }
    }
  });
    
  // 達成率を計算して画面に表示する
  const progressEl = document.getElementById('achievement-progress');
  if (progressEl) {
      // 小数点切り捨てでパーセンテージを計算
      const percentage = totalAchievements === 0 ? 0 : Math.floor((unlockedCount / totalAchievements) * 100);
      progressEl.textContent = `達成率: ${unlockedCount} / ${totalAchievements} (${percentage}%)`;
  }
}

// ==========================================
// 🚀 画面が表示されるたびに必ず実行する
// ==========================================
// ★変更：ブラウザの「戻る」ボタンなどで戻ってきた時にも必ず最新の情報を再計算させる
window.addEventListener('pageshow', () => {
  renderAchievements();
  
  // ついでに右上のコイン表示なども最新かチェックしておく
  if (typeof GameSystem !== 'undefined') {
    GameSystem.updateUIDisplay();
  }
});
