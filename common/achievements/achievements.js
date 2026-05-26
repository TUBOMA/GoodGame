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

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('achievement-list');

  achievementData.forEach(ach => {
    // 1. div要素（カード）を作る
    const card = document.createElement('div');
    card.className = 'achievement-card';
    card.dataset.id = ach.id;

    // 2. 解除済みかどうかの判定
    const isUnlocked = typeof GameSystem !== 'undefined' && GameSystem.hasAchievement(ach.id);

    // 3. 中身のHTMLを組み立てる
    let htmlContent = `
      <h3>${ach.name}</h3>
      <p class="ach-desc">${ach.desc}</p>
    `;

    // ★ポイント：達成済みの場合のみ、フレーバーテキストをHTMLに追加する
    if (isUnlocked) {
      // CSSを直接当てて、少し文字を小さく・斜体にしてフレーバー感を出しています
      htmlContent += `<p class="ach-flavor" style="margin-top: 10px; font-style: italic; color: #555; font-size: 0.9em; border-top: 1px dashed #ccc; padding-top: 5px;">「${ach.flavor}」</p>`;
    }

    card.innerHTML = htmlContent;

    // 4. 未達成ならロック状態の見た目にする
    if (!isUnlocked) {
      card.classList.add('locked');
    }

    // 5. コンテナに追加する
    container.appendChild(card);
  });
});
