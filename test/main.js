// コインをゲットした時に呼ばれる関数
function gainCoins(amount) {
  if (typeof GameSystem !== 'undefined') {
    GameSystem.addCoins(amount);
    console.log(`テストゲーム内で ${amount} コイン獲得しました！`);
  } else {
    console.error("GameSystemが見つかりません。HTMLでの読み込み順を確認してください。");
  }
}

// ★追加：実績を解除する関数
function testUnlockAchievement() {
  if (typeof GameSystem !== 'undefined') {
    // 共通システムの実績解除機能を呼び出す
    GameSystem.unlockAchievement('play_first', 'はじめての冒険');
  } else {
    console.error("GameSystemが見つかりません。");
  }
}
