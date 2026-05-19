// common/main.js

// セーブデータを保存するたった1つのキー名
const SAVE_KEY = 'good_game_save_data';

// 誰もセーブデータを持っていない時の「初期データ」
const DEFAULT_SAVE_DATA = {
  common: {
    coins: 0,
    ownedItems: []
  },
  games: {} // 各ゲームのデータは最初カラッポ
};

// ゲーム全体の共通システム
const GameSystem = {
  // ==========================================
  // 【基盤】 セーブデータの読み書き（ここですべてを管理）
  // ==========================================
  
  // セーブデータ全体をロードする（なければ初期データを返す）
  _loadAll: function() {
    const dataString = localStorage.getItem(SAVE_KEY);
    return dataString ? JSON.parse(dataString) : JSON.parse(JSON.stringify(DEFAULT_SAVE_DATA));
  },

  // セーブデータ全体を保存する
  _saveAll: function(dataObj) {
    localStorage.setItem(SAVE_KEY, JSON.stringify(dataObj));
  },

  // ==========================================
  // 【共通機能】 コイン・アイテム管理
  // ==========================================
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

  getOwnedItems: function() {
    return this._loadAll().common.ownedItems;
  },

  hasItem: function(itemId) {
    return this.getOwnedItems().includes(itemId);
  },

  tryPurchaseItem: function(itemId, price) {
    const data = this._loadAll();
    
    if (data.common.ownedItems.includes(itemId)) return 'ALREADY_OWNED';
    if (data.common.coins < price) return 'NO_COINS';

    // 決済とアイテム付与を1つのデータセット内で同時に行う
    data.common.coins -= price;
    data.common.ownedItems.push(itemId);
    
    this._saveAll(data); // 一気にセーブ
    this.updateUIDisplay();
    return 'SUCCESS';
  },

  // ==========================================
  // 【ゲーム個別】 自由なデータの保存・読み込み
  // ==========================================
  
  // 特定のゲームのデータを取得する
  loadGameData: function(gameId) {
    const data = this._loadAll();
    // もしそのゲームのデータがまだ無ければ、空のオブジェクトを返す
    return data.games[gameId] || {};
  },

  // 特定のゲームのデータを保存する（コイン等には一切影響しない）
  saveGameData: function(gameId, gameDataObj) {
    const data = this._loadAll();
    data.games[gameId] = gameDataObj; // そのゲームの箱の中身を丸ごと上書き
    this._saveAll(data);
  }
};

// HTML読み込み時の自動処理
document.addEventListener('DOMContentLoaded', () => {
  GameSystem.updateUIDisplay();
});

// 通信の窓口（変更なし）
window.addEventListener('message', function(event) {
  const data = event.data;
  if (!data) return;
  if (data.type === 'ADD_COINS') {
    GameSystem.addCoins(data.amount || 0);
  }
});
