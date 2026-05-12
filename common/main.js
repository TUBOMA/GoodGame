// ゲーム全体の共通システム
const GameSystem = {
  // 現在のコインを取得（なければ0）
  getCoins: function() {
    return parseInt(localStorage.getItem('total_coins')) || 0;
  },

  // 画面のコイン表示を更新する
  updateUIDisplay: function() {
    const coinElement = document.getElementById('ui-coin');
    if (coinElement) {
      coinElement.textContent = this.getCoins();
    }
  }
};

// HTMLの読み込みが完了したら自動で実行される処理
document.addEventListener('DOMContentLoaded', () => {
  GameSystem.updateUIDisplay();
});
