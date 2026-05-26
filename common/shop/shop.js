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

// --- UI更新関数 ---
// --- UI更新関数 ---
function updateItemUI(itemDiv, btn, item) {
  const currentQuan = GameSystem.getItemCount(item.id);
  
  // ★ ここで master_data.js に書いた式を直接実行する！
  const nextPrice = item.calcPrice(item.basePrice, currentQuan);
  
  const priceDiv = itemDiv.querySelector('.price');
  if (priceDiv) priceDiv.textContent = nextPrice + ' C';
  
  btn.textContent = currentQuan > 0 ? `購入する (所持: ${currentQuan}個)` : "購入する";

  if (item.max > 0 && currentQuan >= item.max) {
    btn.textContent = "購入上限（SOLD OUT）";
    btn.disabled = true;
    btn.classList.add('sold-out');
    if (priceDiv) priceDiv.textContent = "-";
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('shop-list');

  // shopData はそのままソート済みのものを使う
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

    const btn = card.querySelector('.buy-btn');
    
    // 初期表示の更新（itemを丸ごと渡す）
    updateItemUI(card, btn, item);

    btn.addEventListener('click', () => {
      const currentQuan = GameSystem.getItemCount(item.id);
      if (item.max > 0 && currentQuan >= item.max) return;

      // ★ 実際の値段計算も、直接式を呼び出す
      const actualPrice = item.calcPrice(item.basePrice, currentQuan);
      const status = GameSystem.tryPurchaseItem(item.id, actualPrice);

      if (status === 'NO_COINS') {
        btn.textContent = "コイン不足！";
        btn.style.backgroundColor = "#e74c3c";
        btn.style.color = "white";
        setTimeout(() => {
          updateItemUI(card, btn, item);
          btn.style.backgroundColor = "";
          btn.style.color = "";
        }, 1500);
      } else if (status === 'SUCCESS') {
        updateItemUI(card, btn, item);
      }
    });
  });
});
