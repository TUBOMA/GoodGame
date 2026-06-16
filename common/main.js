// セーブデータを保存するたった1つのキー名
const SAVE_KEY = 'good_game_save_data';

const DEFAULT_SAVE_DATA = {
  common: {
    coins: 0,
    ownedItems: {},
    achievements: [],
    shopStats: {} // ★ 新しくcommonの中に正式な部屋を用意
  },
  games: {}
};

const GameSystem = {
  
  getSelectedTitle: function() {
    const data = this._loadAll();
    return data.common.selectedTitle || null;
  },

  setSelectedTitle: function(achId) {
    const data = this._loadAll();
    data.common.selectedTitle = achId;
    this._saveAll(data);
  },

  _loadAll: function() {
    const dataString = localStorage.getItem(SAVE_KEY);
    return dataString ? JSON.parse(dataString) : JSON.parse(JSON.stringify(DEFAULT_SAVE_DATA));
  },

  // =========================================
  // データをセーブする（鉄壁のセキュリティ＆自動お掃除版）
  // =========================================
  _saveAll: function(dataObj) {
    const cleanData = {
      common: {
        coins: typeof dataObj.common?.coins === 'number' ? dataObj.common.coins : 0,
        ownedItems: dataObj.common?.ownedItems || {},
        achievements: dataObj.common?.achievements || [],
        selectedTitle: dataObj.common?.selectedTitle || null,
        shopStats: dataObj.common?.shopStats || {} // ★ 共通データとして保存
      },
      games: dataObj.games || {}
    };

    // ★ 自動マイグレーション（お引っ越し）機能
    // もし過去の気持ち悪い `games.shop_stats` が残っていたら、綺麗に common に移して消す
    if (cleanData.games.shop_stats) {
      cleanData.common.shopStats = cleanData.games.shop_stats;
      delete cleanData.games.shop_stats;
    }

    localStorage.setItem(SAVE_KEY, JSON.stringify(cleanData));
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

  getOwnedItems: function() {
    const items = this._loadAll().common.ownedItems;
    if (Array.isArray(items)) return {};
    return items || {};
  },

  getItemCount: function(itemId) {
    return this.getOwnedItems()[itemId] || 0;
  },

  hasItem: function(itemId) {
    return this.getItemCount(itemId) > 0;
  },

  tryPurchaseItem: function(itemId, price, num = 1) {
    const data = this._loadAll();
    
    if (data.common.coins < price) {
      return 'NO_COINS';
    }
    
    data.common.coins -= price;
    
    if (!data.common.ownedItems[itemId]) {
      data.common.ownedItems[itemId] = 0;
    }
    data.common.ownedItems[itemId] += num;
    
    this._saveAll(data);
    return 'SUCCESS';
  },

  useItem: function(itemId, num = 1) {
    const data = this._loadAll();
    if (!data.common.ownedItems[itemId] || data.common.ownedItems[itemId] < num) {
      return false;
    }
    data.common.ownedItems[itemId] -= num;
    this._saveAll(data);
    return true;
  },

  // =========================================
  // ★ ゲームデータのロード＆セーブ（ルーター機能付き）
  // =========================================
  loadGameData: function(gameId) {
    const data = this._loadAll();
    // shop.js からの呼び出しだけ、こっそり common 階層に案内する
    if (gameId === 'shop_stats') {
      return data.common.shopStats || {};
    }
    return data.games[gameId] || {};
  },

  saveGameData: function(gameId, gameDataObj) {
    const data = this._loadAll();
    
    // shop.js からの保存は common 階層へ逃がす
    if (gameId === 'shop_stats') {
      data.common.shopStats = gameDataObj;
    } else {
      data.games[gameId] = gameDataObj;
    }
    
    this._saveAll(data);

    // ★ 共通実績の判定！
    // どこかのゲームでプレイ回数などがセーブされた「その瞬間」に、裏で合計値を計算して実績を出す！
    if (gameId !== 'shop_stats') {
      this._checkTotalPlayAchievements();
    }
  },

  // =========================================
  // ★ 全ゲームの合計プレイ回数を計算する裏処理
  // =========================================
  _checkTotalPlayAchievements: function() {
    const data = this._loadAll();
    let totalPlayCount = 0;

    if (data && data.games) {
      for (const id in data.games) {
        if (data.games[id].playCount) {
          totalPlayCount += data.games[id].playCount;
        }
      }
    }

    // すでに解除済みならスキップされるので、毎回呼ばれても一瞬で終わります
    if (totalPlayCount >= 1) this.unlockAchievement("achieve_all_play_1");
    if (totalPlayCount >= 10) this.unlockAchievement("achieve_all_play_10");
    if (totalPlayCount >= 100) this.unlockAchievement("achieve_all_play_100");
    if (totalPlayCount >= 1000) this.unlockAchievement("achieve_all_play_1000");
  },

  hasAchievement: function(achId) {
    const data = this._loadAll();
    const achs = data.common.achievements || [];
    return achs.includes(achId);
  },

  unlockAchievement: function(achId) {
    const data = this._loadAll();
    
    if (!data.common.achievements) {
      data.common.achievements = [];
    }

    if (data.common.achievements.includes(achId)) {
      return false;
    }

    data.common.achievements.push(achId);
    this._saveAll(data);

    let achName = "謎の実績";
    if (typeof GameMasterData !== 'undefined' && GameMasterData.achievements) {
      const foundAch = GameMasterData.achievements.find(ach => ach.id === achId);
      if (foundAch) achName = foundAch.name;
    }

    this._showAchievementToast(achName);
    return true;
  },

  _showAchievementToast: function(achName) {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      Object.assign(container.style, {
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        display: 'flex',
        flexDirection: 'column-reverse',
        gap: '12px',
        zIndex: '99999',
        pointerEvents: 'none'
      });
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.innerHTML = `<span style="font-size: 1.2rem; margin-right: 8px;">🏆</span> 実績解除: <strong style="color: #fde047;">${achName}</strong>`;
    
    Object.assign(toast.style, {
      background: 'rgba(15, 23, 42, 0.95)',
      color: '#f7fbff',
      border: '1px solid rgba(56, 189, 248, 0.5)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), 0 0 15px rgba(56, 189, 248, 0.2)',
      padding: '16px 24px',
      borderRadius: '8px',
      fontSize: '1rem',
      fontWeight: 'bold',
      transition: 'opacity 0.4s ease, transform 0.4s ease',
      opacity: '0',
      transform: 'translateX(50px)'
    });

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateX(0)';
    }, 10);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(50px)';
      
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 400);
    }, 3500);
  },

  showToast: function(message) {
    const toast = document.createElement('div');
    toast.textContent = message;
    
    Object.assign(toast.style, {
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      backgroundColor: '#f39c12',
      color: 'white',
      padding: '15px 25px',
      borderRadius: '8px',
      fontWeight: 'bold',
      boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
      zIndex: '10000',
      transition: 'opacity 0.5s, transform 0.5s',
      opacity: '0',
      transform: 'translateY(20px)'
    });

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateY(0)';
    }, 10);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(20px)';
      setTimeout(() => toast.remove(), 500);
    }, 3000);
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
