"use strict";

//Phaserを起動するやつ

const Game_Config = {
  type: Phaser.AUTO,
  parent: "game",
  width: Game_Width,
  height: Game_Height,
  zoom: Canvas_Pixel_Ratio,
  backgroundColor: "#111820",
  antialias: true,
  roundPixels: false,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: RunnerScene,
};

new Phaser.Game(Game_Config);
