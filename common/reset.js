// common/reset.js
document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('reset-modal');
  const title = document.getElementById('modal-title');
  const text = document.getElementById('modal-text');
  const btnNext = document.getElementById('btn-next-reset');
  const btnCancel = document.getElementById('btn-cancel-reset');
  
  let resetStep = 0; // 何回目の確認かを記録する変数

  // 初期状態に戻してモーダルを閉じる関数
  function closeModal() {
    modal.style.display = 'none';
    resetStep = 0;
    title.innerText = "⚠️ 警告";
    text.innerText = "すべてのデータ（所持コイン、購入したアイテム）を消去します。本当によろしいですか？";
    btnNext.innerText = "はい、消去します";
    btnCancel.style.display = 'inline-block'; // キャンセルボタンを復活
    btnNext.style.display = 'inline-block';
  }

  // 「データを初期化する」ボタンを押した時
  const triggerBtn = document.getElementById('btn-trigger-reset');
  if (triggerBtn) {
    triggerBtn.addEventListener('click', () => {
      modal.style.display = 'flex'; // モーダルを表示
    });
  }

  // 「やめる」ボタンを押した時
  if (btnCancel) {
    btnCancel.addEventListener('click', closeModal);
  }

  // 「はい」系のボタンを押した時
  if (btnNext) {
    btnNext.addEventListener('click', () => {
      if (resetStep === 0) {
        // 1回目の「はい」を押した直後（最終確認へ移行）
        resetStep = 1;
        title.innerText = "🚨 最終確認 🚨";
        text.innerText = "この操作は絶対に取り消せません。これまでの苦労がすべて水の泡になりますが、本当に後悔しませんか？";
        btnNext.innerText = "すべてを無に帰す";
        
      } else if (resetStep === 1) {
        // 2回目の「はい（すべてを無に帰す）」を押した時（実行）
        localStorage.clear(); // データを完全消去！
        
        // 完了メッセージに切り替えて、1.5秒後にページをリロードする
        title.innerText = "✅ 完了";
        text.innerText = "データを初期化しました。再読み込みします...";
        btnCancel.style.display = 'none'; // ボタンを隠す
        btnNext.style.display = 'none';
        
        setTimeout(() => {
          window.location.reload(); // ページを自動更新して0コインを反映
        }, 1500);
      }
    });
  }
});
