"use strict";

// プレイヤーの見た目と左右移動を担当するクラス
class PlayerView {
  constructor(scene) {
    //プレイヤー表示の作成
    this.scene = scene;
    this.currentLane = Lane.Left;

    this.container = this.scene.add.container(Left_Lane_X, Player_Y);
    this.container.setDepth(40);

    this.body = this.scene.add.circle(0, 0, 23, 0x3ddc97);
    this.dots = this.scene.add.graphics();
    this.populationText = this.scene.add.text(0, 36, "", {
      fontFamily: "sans-serif",
      fontSize: "20px",
      color: "#ffffff",
      fontStyle: "bold",
    });
    this.populationText.setOrigin(0.5);

    this.container.add([this.body, this.dots, this.populationText]);
  }

  resetLane() {
    //プレイヤーを左レーンに戻す処理
    this.currentLane = Lane.Left;
    this.container.x = Left_Lane_X;
  }

  moveToLane(lane) {
    //プレイヤーを指定レーンへ動かす処理
    this.currentLane = lane;

    const targetX = lane === Lane.Left ? Left_Lane_X : Right_Lane_X;
    this.scene.tweens.add({
      targets: this.container,
      x: targetX,
      duration: 80,
      ease: "Sine.easeOut",
    });
  }

  getCurrentLane() {
    return this.currentLane;
  }

  getX() {
    return this.container.x;
  }

  updatePopulation(population) {
    //プレイヤー周りの人数表示
    this.populationText.setText(`${population}`);
    this.dots.clear();

    const dotCount = Math.min(population, 18);
    const circleRadius = 4;
    const circleGap = 9;
    const firstX = -((dotCount - 1) * circleGap) / 2;

    this.dots.fillStyle(0xffffff, 0.92);

    for (let i = 0; i < dotCount; i += 1) {
      const x = firstX + i * circleGap;
      const y = -34 - (i % 2) * 8;
      this.dots.fillCircle(x, y, circleRadius);
    }
  }
}
