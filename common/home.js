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
// 🏆 称号の表示システム（カスタム対応版）
// =========================================
function updatePlayerTitle() {
  if (typeof GameSystem === 'undefined' || typeof GameMasterData === 'undefined') return;
  
  const data = GameSystem._loadAll();
  const unlockedIds = data.common.achievements || [];
  const titleContainer = document.getElementById('player-title');
  const titleNameEl = document.getElementById('player-title-name');
  
  if (!titleContainer || !titleNameEl) return;

  // まだ1つも実績を解除していない場合は隠す
  if (unlockedIds.length === 0) {
    titleContainer.style.display = 'none';
    return;
  }

  titleContainer.style.display = 'block';

  // ★ 変更：まずは自分で選んだ称号（selectedTitle）があるかチェックする
  let targetId = GameSystem.getSelectedTitle();

  // もし「まだ自分で選んでいない」か「データがおかしい」場合は、ランダムに選ぶ
  if (!targetId || !unlockedIds.includes(targetId)) {
    targetId = unlockedIds[Math.floor(Math.random() * unlockedIds.length)];
  }
  
  // マスターデータから名前を探して表示する
  const achData = GameMasterData.achievements.find(a => a.id === targetId);
  if (achData) {
    titleNameEl.textContent = "🏆 " + achData.name;
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
