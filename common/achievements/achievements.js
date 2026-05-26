document.addEventListener('DOMContentLoaded', () => {
  // 画面上のすべての実績カードを取得
  const achCards = document.querySelectorAll('.achievement-card');

  achCards.forEach(card => {
    const achId = card.dataset.id; // HTMLに書いた data-id を取得

    // もしその実績をまだ解除していなければ
    if (!GameSystem.hasAchievement(achId)) {
      // CSSで用意した「ロック状態」のクラスを付与する
      card.classList.add('locked');
      
      // ※もし条件を秘密にしたい実績（シークレット実績）を作るなら、
      // ここで card.querySelector('.ach-desc').textContent = "???";
      // のように書き換えることも可能です。
    }
  });
});
