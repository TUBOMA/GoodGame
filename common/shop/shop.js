document.addEventListener('DOMContentLoaded', () => {
  const buyButtons = document.querySelectorAll('.buy-btn');

  // ★新規：値段の計算ルールをまとめた関数
  function calculatePrice(basePrice, currentQuan, type, stepValue) {
    if (type === 'fixed') {
      // 1. 固定（何度買っても同じ値段）
      return basePrice;
      
    } else if (type === 'add') {
      // 2. 加算（買うたびに +〇〇コイン増える）
      return basePrice + (stepValue * currentQuan);
      
    } else if (type === 'multiply') {
      // 3. 掛け算（買うたびに 〇〇倍になる ※端数切り捨て）
      return Math.floor(basePrice * Math.pow(stepValue, currentQuan));
      
    } else {
      // 4. デフォルト（今まで通り: 1倍, 2倍, 3倍...）
      return basePrice * (currentQuan + 1);
    }
  }

  function updateItemUI(itemDiv, btn, itemId, basePrice, type, stepValue) {
    const currentQuan = GameSystem.getItemCount(itemId);
    
    // 計算関数を使って次の値段を出す
    const nextPrice = calculatePrice(basePrice, currentQuan, type, stepValue);

    const priceDiv = itemDiv.querySelector('.price');
    if (priceDiv) {
      priceDiv.textContent = nextPrice + ' C';
    }

    if (currentQuan > 0) {
      btn.textContent = `購入する (所持: ${currentQuan}個)`;
    } else {
      btn.textContent = "購入する";
    }

    const max = parseInt(itemDiv.dataset.max);
    if (max && currentQuan >= max) {
      btn.textContent = "購入上限（SOLD OUT）";
      btn.disabled = true;
      btn.classList.add('sold-out');
      if (priceDiv) priceDiv.textContent = "-";
    }
  }

  buyButtons.forEach(btn => {
    const itemDiv = btn.closest('.shop-item');
    const itemId = itemDiv.dataset.id;
    const basePrice = parseInt(itemDiv.dataset.price);

    // ★追加：HTMLから「上がり方の種類」と「数値」を読み取る
    const priceType = itemDiv.dataset.pricetype || 'default';
    const stepValue = parseFloat(itemDiv.dataset.step) || 0;

    // 初期表示
    updateItemUI(itemDiv, btn, itemId, basePrice, priceType, stepValue);

    btn.addEventListener('click', () => {
      const currentQuan = GameSystem.getItemCount(itemId);
      
      const max = parseInt(itemDiv.dataset.max);
      if (max && currentQuan >= max) return;

      // 実際の値段を計算する
      const actualPrice = calculatePrice(basePrice, currentQuan, priceType, stepValue);
      
      const status = GameSystem.tryPurchaseItem(itemId, actualPrice);

      if (status === 'NO_COINS') {
        const originalText = btn.textContent;
        btn.textContent = "コイン不足！";
        btn.style.backgroundColor = "#e74c3c";
        btn.style.color = "white";
        
        setTimeout(() => {
          updateItemUI(itemDiv, btn, itemId, basePrice, priceType, stepValue);
          btn.style.backgroundColor = "";
          btn.style.color = "";
        }, 1500);
        
      } else if (status === 'SUCCESS') {
        updateItemUI(itemDiv, btn, itemId, basePrice, priceType, stepValue);
      }
    });
  });
});
