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
