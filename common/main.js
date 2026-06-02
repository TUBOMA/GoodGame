// セーブデータを保存するたった1つのキー名
const SAVE_KEY = 'good_game_save_data';

// ★変更：unlockedAchievements をやめ、旧来の achievements に統一！
const DEFAULT_SAVE_DATA = {
  common: {
    coins: 0,
    ownedItems: {},
    achievements: [] // 解除済み実績のIDを入れる箱
  },
  games: {}
};

const GameSystem = {
  _loadAll: function() {
    const dataString = localStorage.getItem(SAVE_KEY);
    return dataString ? JSON.parse(dataString) : JSON.parse(JSON.stringify(DEFAULT_SAVE_DATA));
  },

  // =========================================
  // データをセーブする（鉄壁のセキュリティ版）
  // =========================================
  _saveAll: function(dataObj) {
    // ★ 余計な箱を弾くセキュリティは残しつつ、箱の名前を achievements に変更
    const cleanData = {
      common: {
        coins: typeof dataObj.common?.coins === 'number' ? dataObj.common.coins : 0,
        ownedItems: dataObj.common?.ownedItems || {},
        achievements: dataObj.common?.achievements || []
      },
      games: dataObj.games || {} // 各ゲームの個別セーブデータエリア
    };

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

  loadGameData: function(gameId) {
    const data = this._loadAll();
    return data.games[gameId] || {};
  },

  saveGameData: function(gameId, gameDataObj) {
    const data = this._loadAll();
    data.games[gameId] = gameDataObj;
    this._saveAll(data);
  },
    
    // =========================================
      // セーブデータの出力・引き継ぎ（Base64暗号化）
      // =========================================
      exportSaveData: function() {
        const dataString = localStorage.getItem(SAVE_KEY);
        if (!dataString) return "";
        // 文字化けを防ぎつつ、解読不能なコード（Base64）に変換する
        return btoa(unescape(encodeURIComponent(dataString)));
      },

      importSaveData: function(base64Str) {
        try {
          // 暗号化されたコードを元のデータ（JSON）に復元
          const decodedStr = decodeURIComponent(escape(atob(base64Str)));
          const parsed = JSON.parse(decodedStr);
          
          // 正しいセーブデータの形をしているかチェック
          if (parsed && parsed.common) {
            this._saveAll(parsed); // 鉄壁のセキュリティ関数を通して保存
            return true;
          }
        } catch (e) {
          console.error("不正なセーブコードです", e);
        }
        return false;
      },
    
  // =========================================
  // 実績判定も超シンプル
  // =========================================
  hasAchievement: function(achId) {
    const data = this._loadAll();
    const achs = data.common.achievements || [];
    return achs.includes(achId);
  },

  // =========================================
  // 実績解除も素直に書くだけ
  // =========================================
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
        // ★ 1. 通知を縦に並べるための「透明な箱」を画面上に探す（無ければ作る）
        let container = document.getElementById('toast-container');
        if (!container) {
          container = document.createElement('div');
          container.id = 'toast-container';
          Object.assign(container.style, {
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            display: 'flex',
            flexDirection: 'column-reverse', // 下から上に向かって積み上げる
            gap: '12px',                     // 通知同士のスキマ
            zIndex: '99999',
            pointerEvents: 'none'            // 箱自体がマウスクリックを邪魔しないようにする
          });
          document.body.appendChild(container);
        }

        // ★ 2. 通知本体を作る
        const toast = document.createElement('div');
        toast.innerHTML = `<span style="font-size: 1.2rem; margin-right: 8px;">🏆</span> 実績解除: <strong style="color: #fde047;">${achName}</strong>`;
        
        // （元の position: fixed や bottom, right は箱に任せるので削除）
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
          transform: 'translateX(50px)' // ★ 右からスライドインさせるための初期位置
        });

        // bodyではなく、用意した箱(container)の中に追加する
        container.appendChild(toast);

        // 追加直後にアニメーション開始（右からスッと入ってくる）
        setTimeout(() => {
          toast.style.opacity = '1';
          toast.style.transform = 'translateX(0)';
        }, 10);

        // 3.5秒後に消すアニメーション
        setTimeout(() => {
          toast.style.opacity = '0';
          toast.style.transform = 'translateX(50px)'; // 右へスッと帰っていく
          
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
