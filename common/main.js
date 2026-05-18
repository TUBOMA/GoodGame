// ゲーム全体の共通システム
const GameSystem = {
  // --- コイン管理 ---
  getCoins: function() {
    return parseInt(localStorage.getItem('total_coins')) || 0;
  },

  updateUIDisplay: function() {
    const coinElement = document.getElementById('ui-coin');
    if (coinElement) {
      coinElement.textContent = this.getCoins();
    }
  },

  addCoins: function(amount) {
    const newCoins = this.getCoins() + amount;
    localStorage.setItem('total_coins', newCoins);
    this.updateUIDisplay();
  },

  // --- アイテム管理 ---
  getOwnedItems: function() {
    const items = localStorage.getItem('owned_items');
    return items ? JSON.parse(items) : [];
  },

  hasItem: function(itemId) {
    return this.getOwnedItems().includes(itemId);
  },

  // ★ここが新しくなった「安全なトランザクション処理」
  tryPurchaseItem: function(itemId, price) {
    const items = this.getOwnedItems();
    const currentCoins = this.getCoins();

    // 1. 事前チェック（ここなら途中でやめてもデータは壊れない）
    if (items.includes(itemId)) return 'ALREADY_OWNED';
    if (currentCoins < price) return 'NO_COINS';

    // 2. データ上の決済とアイテム追加
    const newCoins = currentCoins - price;
    items.push(itemId);

    // 3. 一気にセーブ（不整合を防ぐ）
    localStorage.setItem('total_coins', newCoins);
    localStorage.setItem('owned_items', JSON.stringify(items));
    this.updateUIDisplay();

    // アラートなどの「見た目」の処理はここでは一切やらない！
    return 'SUCCESS';
  }
};

// HTML読み込み時の自動処理
document.addEventListener('DOMContentLoaded', () => {
  GameSystem.updateUIDisplay();
});

// 通信の窓口
window.addEventListener('message', function(event) {
  const data = event.data;
  if (!data) return;
  if (data.type === 'ADD_COINS') {
    GameSystem.addCoins(data.amount || 0);
  }
});
