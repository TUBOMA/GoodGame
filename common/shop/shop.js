document.addEventListener('DOMContentLoaded', () => {
  const buyButtons = document.querySelectorAll('.buy-btn');

  buyButtons.forEach(btn => {
    const itemDiv = btn.closest('.shop-item');
    const itemId = itemDiv.dataset.id;
    const price = parseInt(itemDiv.dataset.price);
    const name = itemDiv.dataset.name;

    // 画面を開いた時の初期表示
    if (GameSystem.hasItem(itemId)) {
      btn.textContent = "購入済み";
      btn.disabled = true;
      btn.classList.add('sold-out');
    }

    // クリックされた時の処理
    btn.addEventListener('click', () => {
      
      // main.js の安全な窓口に購入を依頼し、結果を受け取る
      const status = GameSystem.tryPurchaseItem(itemId, price);

      // 結果に応じて画面（UI）の処理を変える
      if (status === 'ALREADY_OWNED') {
        console.log("すでに持っています。");
        
      } else if (status === 'NO_COINS') {
        // お金が足りない時（一時的にボタンの文字を変えて教えてあげる）
        const originalText = btn.textContent;
        btn.textContent = "コイン不足！";
        btn.style.backgroundColor = "#e74c3c"; // 一瞬赤くする
        btn.style.color = "white";
        
        setTimeout(() => {
          btn.textContent = originalText;
          btn.style.backgroundColor = ""; // 元の色に戻す
          btn.style.color = "";
        }, 1500);
        
      } else if (status === 'SUCCESS') {
        // 購入成功！
        console.log(`「${name}」を購入しました。`);
        btn.textContent = "購入済み";
        btn.disabled = true;
        btn.classList.add('sold-out');
      }
    });
  });
});
