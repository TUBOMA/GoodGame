"use strict";

//Phaserの起動

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
