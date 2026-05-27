// セーブデータを保存するたった1つのキー名
const SAVE_KEY = 'good_game_save_data';

// ★変更：ownedItems を []（配列）から {}（辞書・オブジェクト）に変更しました
const DEFAULT_SAVE_DATA = {
  common: {
    coins: 0,
    ownedItems: {},
    unlockedAchievements: [] // ★新規：解除済み実績のIDを入れる箱
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
    // main.js
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
      // ★ ここの this._updateCoinUI(...) は不要なので削除しました ★
      return 'SUCCESS';
    },

    useItem: function(itemId, num = 1) { // ← ここがポイント！
      const data = this._loadAll();
                  if (!data.common.ownedItems[itemId] || data.common.ownedItems[itemId] < num) {
        return false;
      }

      // 所持数を要求数(num)だけ減らす
      data.common.ownedItems[itemId] -= num;
      this._saveAll(data);
            
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
  },
    
    hasAchievement: function(achId) {
        const data = this._loadAll();
        const achs = data.common.unlockedAchievements || [];
        return achs.includes(achId);
      },

      // 実績を解除する関数（各ゲームから呼び出される）
    // 引数は achId だけに変更
    // =========================================
      // 実績を解除する関数（通知機能つき）
      // =========================================
      unlockAchievement: function(achId) {
        const data = this._loadAll();
        
        // すでに解除済みの場合は何もしない
        if (data.common.achievements && data.common.achievements.includes(achId)) {
          return false;
        }

        // 配列がなければ初期化
        if (!data.common.achievements) {
          data.common.achievements = [];
        }

        // 実績を追加してセーブ
        data.common.achievements.push(achId);
        this._saveAll(data);

        // ★ 1. master_data.js から実績の名前を取得する
        let achName = "謎の実績";
        if (typeof GameMasterData !== 'undefined' && GameMasterData.achievements) {
          const foundAch = GameMasterData.achievements.find(ach => ach.id === achId);
          if (foundAch) achName = foundAch.name;
        }

        // ★ 2. トースト通知を表示する（共通UI）
        this._showAchievementToast(achName);

        return true; // 新しく解除された場合は true を返す
      },

      // =========================================
      // 【新設】トースト通知を画面に出す裏方関数
      // =========================================
      _showAchievementToast: function(achName) {
        // 通知用の枠（div）を動的に作る
        const toast = document.createElement('div');
        
        // 通知の中身（アイコンと実績名）
        toast.innerHTML = `<span style="font-size: 1.2rem; margin-right: 8px;">🏆</span> 実績解除: <strong style="color: #fde047;">${achName}</strong>`;
        
        // ★ どの画面から呼ばれてもデザインが崩れないように、CSSをJSから直接当てる
        Object.assign(toast.style, {
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          background: 'rgba(15, 23, 42, 0.95)', // ちょっと透ける濃紺
          color: '#f7fbff',
          border: '1px solid rgba(56, 189, 248, 0.5)', // 水色の枠線
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), 0 0 15px rgba(56, 189, 248, 0.2)', // 光る影
          padding: '16px 24px',
          borderRadius: '8px',
          fontSize: '1rem',
          fontWeight: 'bold',
          zIndex: '99999', // どんな要素よりも一番手前に出す
          transition: 'opacity 0.4s ease, transform 0.4s ease',
          opacity: '0',
          transform: 'translateY(20px)' // 最初は少し下の方に隠しておく
        });

        // 画面(body)に追加する
        document.body.appendChild(toast);

        // 追加した直後にアニメーションをスタート（フワッと浮き上がってくる）
        setTimeout(() => {
          toast.style.opacity = '1';
          toast.style.transform = 'translateY(0)';
        }, 10);

        // 3.5秒後にフワッと消して、完全に消えたらHTMLから削除する
        setTimeout(() => {
          toast.style.opacity = '0';
          toast.style.transform = 'translateY(10px)';
          
          setTimeout(() => {
            if (toast.parentNode) {
              toast.parentNode.removeChild(toast);
            }
          }, 400); // 消えるアニメーションが終わるのを待つ
        }, 3500);
      },

      // 画面に一時的な通知（トースト）を出す機能
      showToast: function(message) {
        const toast = document.createElement('div');
        toast.textContent = message;
        
        // CSSを書かなくてもJS側でデザインを当てる
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

        // ちょっと待ってからフワッと表示
        setTimeout(() => {
          toast.style.opacity = '1';
          toast.style.transform = 'translateY(0)';
        }, 10);

        // 3秒後に消す
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
