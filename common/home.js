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

  // ヘッダーに「称号」を表示する
  updatePlayerTitle();
});

// =========================================
// 🏆 称号の表示システム（未選択時は非表示版）
// =========================================
function updatePlayerTitle() {
  if (typeof GameSystem === 'undefined' || typeof GameMasterData === 'undefined') return;
  
  const data = GameSystem._loadAll();
  const unlockedIds = data.common.achievements || [];
  const titleContainer = document.getElementById('player-title');
  const titleNameEl = document.getElementById('player-title-name');
  
  if (!titleContainer || !titleNameEl) return;

  // 自分で選んだ称号（selectedTitle）を取得する
  let targetId = GameSystem.getSelectedTitle();

  // ★変更：「まだ自分で選んでいない」または「データが存在しない」場合は、エリアごと隠して終了する
  if (!targetId || !unlockedIds.includes(targetId)) {
    titleContainer.style.display = 'none';
    return;
  }
  
  // マスターデータから名前を探してくる
  const achData = GameMasterData.achievements.find(a => a.id === targetId);
  
  if (achData) {
    // 正しく称号が見つかった時だけ表示する
    titleContainer.style.display = 'block';
    titleNameEl.textContent = "🏆 " + achData.name;
  } else {
    titleContainer.style.display = 'none';
  }
}

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
