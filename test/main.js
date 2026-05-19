// コインをゲットした時に呼ばれる関数
function gainCoins(amount) {
  // common/main.js の中にある GameSystem が存在するかチェック
  if (typeof GameSystem !== 'undefined') {
    
    // 安全に用意された関数を使ってコインを増やす
    GameSystem.addCoins(amount);
    
    console.log(`テストゲーム内で ${amount} コイン獲得しました！`);
  } else {
    console.error("GameSystemが見つかりません。HTMLでの読み込み順を確認してください。");
  }
}
