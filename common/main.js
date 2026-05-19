// セーブデータを保存するたった1つのキー名
const SAVE_KEY = 'good_game_save_data';

// ★変更：ownedItems を []（配列）から {}（辞書・オブジェクト）に変更しました
const DEFAULT_SAVE_DATA = {
  common: {
    coins: 0,
    ownedItems: {}
  },
  games: {}
};

const GameSystem = {
  _loadAll: function() {
    const dataString = localStorage.getItem(SAVE_KEY);
    return dataString ? JSON.parse(dataString) : JSON.parse(JSON.stringify(DEFAULT_SAVE_DATA));
  },

  _saveAll: function(dataObj) {
    localStorage.setItem(SAVE_KEY, JSON.stringify(dataObj));
  },

  getCoins: function() {
    return this._loadAll().common.coins;
  },

  updateUIDisplay: function() {
    const coinElement = document.getElementById('ui-coin');
    if (coinElement) {
      coinElement.textContent = this.getCoins();
    }
  },

  addCoins: function(amount) {
    const data = this._loadAll();
    data.common.coins += amount;
    this._saveAll(data);
    this.updateUIDisplay();
  },

  consumeCoins: function(amount) {
    const data = this._loadAll();
    if (data.common.coins < amount) return false;
    data.common.coins -= amount;
    this._saveAll(data);
    this.updateUIDisplay();
    return true;
  },

  // --- ★アイテム管理が個数対応に進化 ---
  getOwnedItems: function() {
    const items = this._loadAll().common.ownedItems;
    // 過去の配列データが残っていたらバグを防ぐために空にする（リセット推奨）
    if (Array.isArray(items)) return {};
    return items || {};
  },

  // ★新規：指定したアイテムを「何個」持っているか返す（0なら未所持）
  getItemCount: function(itemId) {
    return this.getOwnedItems()[itemId] || 0;
  },

  // 1個以上持っていれば true
  hasItem: function(itemId) {
    return this.getItemCount(itemId) > 0;
  },

  // ★変更：購入時に個数を +1 する処理に変更
  tryPurchaseItem: function(itemId, actualPrice) {
    const data = this._loadAll();
    
    // 過去の配列データ保護
    if (Array.isArray(data.common.ownedItems)) data.common.ownedItems = {};

    if (data.common.coins < actualPrice) return 'NO_COINS';

    // 支払い
    data.common.coins -= actualPrice;
    
    // 所持数を +1 する（初めて買う時は 0 + 1 になる）
    data.common.ownedItems[itemId] = (data.common.ownedItems[itemId] || 0) + 1;
    
    this._saveAll(data);
    this.updateUIDisplay();
    return 'SUCCESS';
  },
    
    // GameSystem の中（hasItem や tryPurchaseItem の下あたり）に追加します

      // ★新規：アイテムを1つ消費する（成功すれば true、持っていなければ false を返す）
      useItem: function(itemId) {
        const data = this._loadAll();
        
        // アイテムを持っていない、または0個以下の場合は失敗
        if (!data.common.ownedItems[itemId] || data.common.ownedItems[itemId] <= 0) {
          return false;
        }

        // 所持数を1減らす
        data.common.ownedItems[itemId] -= 1;
        this._saveAll(data);
        
        // ※もし消費アイテムを使った時に画面上のUI（所持数など）を更新したい場合は、
        // ここに更新用の処理やイベントを飛ばすこともできます。
        return true; // 消費成功！
},

  loadGameData: function(gameId) {
    const data = this._loadAll();
    return data.games[gameId] || {};
  },

  saveGameData: function(gameId, gameDataObj) {
    const data = this._loadAll();
    data.games[gameId] = gameDataObj;
    this._saveAll(data);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  GameSystem.updateUIDisplay();
});

window.addEventListener('message', function(event) {
  const data = event.data;
  if (!data) return;
  if (data.type === 'ADD_COINS') {
    GameSystem.addCoins(data.amount || 0);
  }
});
