const shopData = GameMasterData.shop;
const gameOrder = { 'l': 1, 'c': 2, 's': 3, 'i': 4, 'common': 5 };

shopData.sort((a, b) => {
  if (gameOrder[a.game] !== gameOrder[b.game]) return gameOrder[a.game] - gameOrder[b.game];
  if (a.category !== b.category) return a.category.localeCompare(b.category);
  return a.tier - b.tier;
});

// --- 複数個買った時の「合計金額」を計算する ---
function getBulkPrice(item, currentQuan, amount) {
  let total = 0;
  for (let i = 0; i < amount; i++) {
    total += item.calcPrice(item.basePrice, currentQuan + i);
  }
  return total;
}

// --- UI更新関数 ---
function updateItemUI(card, btnOne, btnTen, ownedDiv, item) {
  const currentQuan = GameSystem.getItemCount(item.id);
  const priceOne = item.calcPrice(item.basePrice, currentQuan);
  
  // ★ 追加：まとめ買いの個数を計算（最大10個、または残り買える限界まで）
  let bulkAmount = 10;
  if (item.max !== -1) {
    bulkAmount = Math.min(10, item.max - currentQuan);
  }

  // ★ 枠外にある所持数テキストを更新
  if (ownedDiv) {
    let maxText = item.max !== -1 ? ` / 最大${item.max}個` : '';
    ownedDiv.textContent = `所持数: ${currentQuan}個${maxText}`;
  }

  const priceDiv = card.querySelector('.price');
  if (priceDiv) {
    // ★ 修正：残り2個以上の時はその個数での値段を、残り1個以下の時は1個の値段だけを表示
    if (bulkAmount > 1) {
      const priceBulk = getBulkPrice(item, currentQuan, bulkAmount);
      priceDiv.innerHTML = `1個: <b>${priceOne} C</b> <br> <span style="font-size: 0.85rem; color: #a7f3d0;">${bulkAmount}個: ${priceBulk} C</span>`;
    } else {
      priceDiv.innerHTML = `1個: <b>${priceOne} C</b>`;
    }
  }
  
  // ▼ 1個購入ボタンの制御 ▼
  btnOne.textContent = "1個購入";
  if (item.max !== -1 && currentQuan >= item.max) {
    btnOne.textContent = "SOLD OUT";
    btnOne.disabled = true;
    btnOne.classList.add('sold-out');
    if (priceDiv) priceDiv.innerHTML = "<b style='color: #ef4444; font-size: 1.1rem;'>売り切れ！</b>";
  } else {
    btnOne.disabled = false;
    btnOne.classList.remove('sold-out');
  }

  // ▼ まとめ買いボタンの制御 ▼
  if (bulkAmount > 1) {
    // 買える数が2個以上なら、その個数をボタンに表示する
    btnTen.textContent = `${bulkAmount}個購入`;
    btnTen.disabled = false;
    btnTen.classList.remove('sold-out');
    btnTen.style.display = 'block';
  } else {
    // 残り1個しか買えない、または売り切れの時はまとめ買いボタンを完全に消す
    btnTen.style.display = 'none';
  }
}

// ==========================================
// 🏆 実績判定の専用関数（超強力な修復機能付き）
// ==========================================
function checkShopAchievements() {
  if (typeof GameSystem.unlockAchievement !== 'function') return;
  
  const items = GameSystem.getOwnedItems();
  let shopStats = GameSystem.loadGameData('shop_stats');
  
  if (!shopStats.boughtItems) shopStats.boughtItems = {};
  if (!shopStats.totalBought) shopStats.totalBought = 0;

  let updated = false;

  // 【自己修復】今持っているアイテムは強制的に「購入済み」として履歴に書き込む
  for (const key in items) {
    if (items[key] !== undefined && !shopStats.boughtItems[key]) {
      shopStats.boughtItems[key] = true;
      updated = true;
    }
  }

  if (updated) {
    GameSystem.saveGameData('shop_stats', shopStats);
  }

  let allBoughtAtLeastOnce = true;
  let missingItems = []; // デバッグ用：何が足りないか記録する箱

  for (let i = 0; i < shopData.length; i++) {
    if (!shopStats.boughtItems[shopData[i].id]) {
      allBoughtAtLeastOnce = false;
      missingItems.push(shopData[i].name); // 買っていないアイテムの名前を記録
    }
  }

  // コンソールに状況を報告させる
  if (!allBoughtAtLeastOnce) {
    console.log("【実績チェック】コンプリートまであと: ", missingItems.join(", "));
  } else {
    console.log("【実績チェック】全種類購入済みです！");
  }

  // 実績解除の実行
  const total = shopStats.totalBought;
  if (total >= 1) GameSystem.unlockAchievement('achieve_shop_buy_1');
  if (total >= 10) GameSystem.unlockAchievement('achieve_shop_buy_10');
  if (total >= 100) GameSystem.unlockAchievement('achieve_shop_buy_100');
  
  if (allBoughtAtLeastOnce) {
    GameSystem.unlockAchievement('achieve_shop_buy_all');
  }
}

// --- 購入処理の共通化 ---
function handlePurchase(item, amount, clickedBtn, card, ownedDiv) {
  const currentQuan = GameSystem.getItemCount(item.id);
  
  if (item.max !== -1 && currentQuan + amount > item.max) return;

  const actualPrice = getBulkPrice(item, currentQuan, amount);
  const status = GameSystem.tryPurchaseItem(item.id, actualPrice, amount);

  const btnOne = card.querySelector('.buy-one');
  const btnTen = card.querySelector('.buy-ten');

  if (status === 'NO_COINS') {
    clickedBtn.textContent = "コイン不足！";
    clickedBtn.style.backgroundColor = "#ef4444";
    clickedBtn.style.color = "white";
    setTimeout(() => {
      updateItemUI(card, btnOne, btnTen, ownedDiv, item);
      clickedBtn.style.backgroundColor = "";
      clickedBtn.style.color = "";
    }, 1500);
  } else if (status === 'SUCCESS') {
    updateItemUI(card, btnOne, btnTen, ownedDiv, item);
    
    const coinDisplay = document.getElementById('ui-coin');
    if (coinDisplay) {
      const latestData = GameSystem._loadAll();
      coinDisplay.textContent = latestData.common.coins;
    }
    
    // ★ 購入したことを確実に「購入履歴」に記録する
    let shopStats = GameSystem.loadGameData('shop_stats');
    if (!shopStats.boughtItems) shopStats.boughtItems = {};
    if (!shopStats.totalBought) shopStats.totalBought = 0;

    shopStats.totalBought += amount;
    shopStats.boughtItems[item.id] = true;
    GameSystem.saveGameData('shop_stats', shopStats);

    // 購入直後に実績チェック
    checkShopAchievements();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('shop-list');

  shopData.forEach(item => {
    const wrapper = document.createElement('div');
    wrapper.className = 'shop-item-wrapper';
    wrapper.style.height = '100%';
    wrapper.style.display = 'flex';
    wrapper.style.flexDirection = 'column';

    const card = document.createElement('div');
    card.className = 'shop-item';
    card.dataset.id = item.id;
    card.style.flexGrow = '1';
    
    card.innerHTML = `
      <div class="item-info">
        <h3>${item.name}</h3>
        <p>${item.desc}</p>
      </div>
      
      <div class="item-actions">
        <div class="price" style="margin-bottom: 12px;"></div>
        <div style="display: flex; gap: 10px;">
          <button class="btn buy-btn buy-one" style="margin: 0; flex: 1;">1個</button>
          <button class="btn buy-btn buy-ten" style="margin: 0; flex: 1; background: #38bdf8; color: #0f172a;">10個</button>
        </div>
      </div>
    `;

    const ownedDiv = document.createElement('div');
    ownedDiv.className = 'owned-count';
    Object.assign(ownedDiv.style, {
      fontSize: '0.82rem',
      color: 'rgba(247, 251, 255, 0.45)',
      textAlign: 'right',
      paddingRight: '4px',
      marginTop: '6px',
      fontWeight: '700',
      letterSpacing: '0.5px'
    });

    wrapper.appendChild(card);
    wrapper.appendChild(ownedDiv);
    container.appendChild(wrapper);

    const btnOne = card.querySelector('.buy-one');
    const btnTen = card.querySelector('.buy-ten');
    
    updateItemUI(card, btnOne, btnTen, ownedDiv, item);

    btnOne.addEventListener('click', () => handlePurchase(item, 1, btnOne, card, ownedDiv));
    
    // ★ 修正：ボタンが押された瞬間に「今買える個数」を再計算して処理に渡す
    btnTen.addEventListener('click', () => {
      const currentQuan = GameSystem.getItemCount(item.id);
      let bulkAmount = 10;
      if (item.max !== -1) {
        bulkAmount = Math.min(10, item.max - currentQuan);
      }
      if (bulkAmount > 1) {
        handlePurchase(item, bulkAmount, btnTen, card, ownedDiv);
      }
    });
  });

  // ショップ画面を開いた時にも実績をチェックする
  checkShopAchievements();
});
