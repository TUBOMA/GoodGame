"use strict";

// main.js は「Phaser を起動するだけ」の入口です。
// 実際のゲーム処理は src/RunnerScene.js にあります。

const Game_Config = {
  type: Phaser.AUTO,
  parent: "game",
  width: Game_Width,
  height: Game_Height,
  backgroundColor: "#111820",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: RunnerScene,
};

new Phaser.Game(Game_Config);
