"use strict";

//道路関係の見え方管理
class RoadView {
  constructor(scene) {
    this.scene = scene;
    this.roadStripes = [];

    this.createRoad();
  }

  //道路の表示設定
  createRoad() {
    this.scene.add.rectangle(Game_Width / 2, Game_Height / 2, Game_Width, Game_Height, 0x111820);
    this.scene.add.rectangle(Game_Width / 2, Game_Height / 2, 360, Game_Height, 0x25313d);

    this.leftLaneHighlight = this.scene.add.rectangle(Left_Lane_X, Game_Height / 2, 170, Game_Height, 0x3ddc97, 0.08);
    this.rightLaneHighlight = this.scene.add.rectangle(Right_Lane_X, Game_Height / 2, 170, Game_Height, 0x3ddc97, 0.02);

    this.scene.add.rectangle(Game_Width / 2, Game_Height / 2, 4, Game_Height, 0xe8edf2, 0.25);
    
    for (let i = 0; i < 9; i += 1) {
      const stripe = this.scene.add.rectangle(Game_Width / 2, i * 95, 8, 48, 0xe8edf2, 0.22);
      this.roadStripes.push(stripe);
    }

    this.fog = this.scene.add.rectangle(Game_Width / 2, Game_Height / 2, Game_Width, Game_Height, 0xf0f6ff, 0);
    this.fog.setDepth(50);
  }

  //いる方のレーンの色を変える
  updateLaneHighlight(currentLane) {
    const leftAlpha = currentLane === Lane.Left ? 0.12 : 0.02;
    const rightAlpha = currentLane === Lane.Right ? 0.12 : 0.02;

    this.leftLaneHighlight.setFillStyle(0x3ddc97, leftAlpha);
    this.rightLaneHighlight.setFillStyle(0x3ddc97, rightAlpha);
  }

  //なんかモヤモヤのやつ
  setFog(alpha) {
    this.fog.setAlpha(alpha);
  }

  //スピード感出すための線
  moveStripes(speed, delta) {
    //距離感の計算
    const distance = speed * (delta / 1000);
    //線を速度をもとに生成する
    for (const stripe of this.roadStripes) {
      stripe.y += distance;

      if (stripe.y > Game_Height + 40) {
        stripe.y = -40;
      }
    }
  }
}
