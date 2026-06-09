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
  const priceTen = getBulkPrice(item, currentQuan, 10);
  
  // ★ 枠外にある所持数テキストを更新
  if (ownedDiv) {
    let maxText = item.max !== -1 ? ` / 最大${item.max}個` : '';
    ownedDiv.textContent = `所持数: ${currentQuan}個${maxText}`;
  }

  const priceDiv = card.querySelector('.price');
  if (priceDiv) {
    priceDiv.innerHTML = `1個: <b>${priceOne} C</b> <br> <span style="font-size: 0.85rem; color: #a7f3d0;">10個: ${priceTen} C</span>`;
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

  // ▼ 10個購入ボタンの制御 ▼
  if (item.max !== -1 && item.max < 10) {
    // 上限がそもそも10個未満のアイテムは、10個買いボタンを完全に消す
    btnTen.style.display = 'none';
  } else if (item.max !== -1 && currentQuan + 10 > item.max) {
    // 10個買うと上限をオーバーしてしまう場合
    btnTen.textContent = "上限超過";
    btnTen.disabled = true;
    btnTen.classList.add('sold-out');
    btnTen.style.display = 'block';
  } else {
    btnTen.textContent = "10個購入";
    btnTen.disabled = false;
    btnTen.classList.remove('sold-out');
    btnTen.style.display = 'block';
  }
}

// --- 購入処理の共通化 ---
function handlePurchase(item, amount, clickedBtn, card, ownedDiv) {
  const currentQuan = GameSystem.getItemCount(item.id);
  
  // ★ 購入時に上限を超えないか最終チェック
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
    
    // 【オプション】実績判定を呼ぶ（「アイテムを10回買う」などの実績のため）
    if (typeof GameSystem.unlockAchievement === 'function') {
      let totalBought = 0;
      const items = GameSystem.getOwnedItems();
      for (const key in items) {
        totalBought += items[key];
      }
      if (totalBought >= 1) GameSystem.unlockAchievement('achieve_shop_buy_1');
      if (totalBought >= 10) GameSystem.unlockAchievement('achieve_shop_buy_10');
      if (totalBought >= 100) GameSystem.unlockAchievement('achieve_shop_buy_100');
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('shop-list');

  shopData.forEach(item => {
    // 1. ラッパー（外箱）
    const wrapper = document.createElement('div');
    wrapper.className = 'shop-item-wrapper';
    wrapper.style.height = '100%';
    wrapper.style.display = 'flex';
    wrapper.style.flexDirection = 'column';

    // 2. 実際のカード枠
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

    // 3. カードの外（真下）に置く所持数テキスト
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

    // 組み立てる
    wrapper.appendChild(card);
    wrapper.appendChild(ownedDiv);
    container.appendChild(wrapper);

    const btnOne = card.querySelector('.buy-one');
    const btnTen = card.querySelector('.buy-ten');
    
    updateItemUI(card, btnOne, btnTen, ownedDiv, item);

    btnOne.addEventListener('click', () => handlePurchase(item, 1, btnOne, card, ownedDiv));
    btnTen.addEventListener('click', () => handlePurchase(item, 10, btnTen, card, ownedDiv));
  });
});
