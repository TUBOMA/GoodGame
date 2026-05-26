// --- ショップのデータ一覧 ---
// game: 'l'(ラストウォー), 'c'(クリッカー), 's'(神経衰弱), 'i'(イライラ棒), 'common'(全体)
const shopData = GameMasterData.shop;

// --- ソート（並び替え）のルール ---
// 1. ゲーム順 (ラストウォー -> クリッカー -> 神経衰弱 -> イライラ棒 -> 共通)
const gameOrder = { 'l': 1, 'c': 2, 's': 3, 'i': 4, 'common': 5 };

shopData.sort((a, b) => {
  if (gameOrder[a.game] !== gameOrder[b.game]) {
    return gameOrder[a.game] - gameOrder[b.game]; // ゲーム順
  }
  if (a.category !== b.category) {
    return a.category.localeCompare(b.category); // カテゴリのあいうえお順
  }
  return a.tier - b.tier; // 同じゲーム・カテゴリなら、度合い(tier)の低い順
});

// --- 値段計算ルール ---
function calculatePrice(basePrice, currentQuan, type, stepValue) {
  if (type === 'fixed') return basePrice;
  if (type === 'add') return basePrice + (stepValue * currentQuan);
  if (type === 'multiply') return Math.floor(basePrice * Math.pow(stepValue, currentQuan));
  return basePrice * (currentQuan + 1); // default
}

function updateItemUI(itemDiv, btn, itemId, basePrice, type, stepValue, max) {
  const currentQuan = GameSystem.getItemCount(itemId);
  const nextPrice = calculatePrice(basePrice, currentQuan, type, stepValue);
  const priceDiv = itemDiv.querySelector('.price');
  
  if (priceDiv) priceDiv.textContent = nextPrice + ' C';
  
  btn.textContent = currentQuan > 0 ? `購入する (所持: ${currentQuan}個)` : "購入する";

  if (max > 0 && currentQuan >= max) {
    btn.textContent = "購入上限（SOLD OUT）";
    btn.disabled = true;
    btn.classList.add('sold-out');
    if (priceDiv) priceDiv.textContent = "-";
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('shop-list');

  // ソート済みのデータを回してHTMLを作る
  shopData.forEach(item => {
    const card = document.createElement('div');
    card.className = 'shop-item';
    card.dataset.id = item.id;
    card.innerHTML = `
      <h3>${item.name}</h3>
      <p>${item.desc}</p>
      <div class="price">${item.basePrice} C</div>
      <button class="btn buy-btn">購入する</button>
    `;
    container.appendChild(card);

    // ボタンのイベントリスナーを設定
    const btn = card.querySelector('.buy-btn');
    
    // 初期表示の更新
    updateItemUI(card, btn, item.id, item.basePrice, item.priceType, item.stepValue, item.max);

    btn.addEventListener('click', () => {
      const currentQuan = GameSystem.getItemCount(item.id);
      if (item.max > 0 && currentQuan >= item.max) return;

      const actualPrice = calculatePrice(item.basePrice, currentQuan, item.priceType, item.stepValue);
      const status = GameSystem.tryPurchaseItem(item.id, actualPrice);

      if (status === 'NO_COINS') {
        btn.textContent = "コイン不足！";
        btn.style.backgroundColor = "#e74c3c";
        btn.style.color = "white";
        setTimeout(() => {
          updateItemUI(card, btn, item.id, item.basePrice, item.priceType, item.stepValue, item.max);
          btn.style.backgroundColor = "";
          btn.style.color = "";
        }, 1500);
      } else if (status === 'SUCCESS') {
        updateItemUI(card, btn, item.id, item.basePrice, item.priceType, item.stepValue, item.max);
      }
    });
  });
});
