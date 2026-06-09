// common/home.js
document.addEventListener('DOMContentLoaded', () => {
  // GameSystemを使って、テストアイテムを持っているかチェック
  if (typeof GameSystem !== 'undefined' && GameSystem.hasItem('test_message')) {
    const secretMsg = document.getElementById('secret-message');
    if (secretMsg) {
      // 持っていたら、隠しメッセージのブロックを表示(block)する
      secretMsg.style.display = 'block';
    }
  }
});

// --- セーブコードの出力 ---
const btnExport = document.getElementById('btn-export-save');
if (btnExport) {
  btnExport.addEventListener('click', () => {
    const code = GameSystem.exportSaveData();
    if (code) {
      prompt("あなたのセーブコードです。すべてコピーして大切に保管してください！", code);
    } else {
      alert("出力できるデータがありません。");
    }
  });
}

// --- セーブコードの読み込み ---
const btnImport = document.getElementById('btn-import-save');
if (btnImport) {
  btnImport.addEventListener('click', () => {
    const code = prompt("引き継ぎたいセーブコードを貼り付けてください:");
    if (code) {
      const isSuccess = GameSystem.importSaveData(code);
      if (isSuccess) {
        alert("データの引き継ぎに成功しました！画面を更新します。");
        location.reload();
      } else {
        alert("エラー：無効なセーブコードです。");
      }
    }
  });
}
