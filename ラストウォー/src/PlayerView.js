"use strict";

//プレイヤーの見た目と左右移動を担当するクラス
class PlayerView {
  constructor(scene) {
    this.scene = scene;
    this.currentLane = Lane.Left;

    this.container = this.scene.add.container(Left_Lane_X, Player_Y);
    this.container.setDepth(40);

    this.shadow = this.scene.add.ellipse(4, 8, 54, 24, 0x000000, 0.24);
    this.outerRing = this.scene.add.circle(0, 0, 29, 0xffffff, 0.24);
    this.body = this.scene.add.circle(0, 0, 23, 0x4fe3a1);
    this.dots = this.scene.add.graphics();
    this.populationText = Add_Text(this.scene, 0, 36, "", {
      fontFamily: "sans-serif",
      fontSize: `${20}px`,
      color: "#ffffff",
      fontStyle: "bold",
      stroke: "#13261f",
      strokeThickness: 3,
    });
    this.populationText.setOrigin(0.5);

    this.container.add([this.shadow, this.outerRing, this.body, this.dots, this.populationText]);
  }

  resetLane() {
    //新しいプレイでは左レーンから始める
    this.scene.tweens.killTweensOf(this.container);
    this.currentLane = Lane.Left;
    this.container.x = Left_Lane_X;
    this.container.setAngle(0);
    this.container.setScale(1);
  }

  moveToLane(lane) {
    this.currentLane = lane;
    const targetX = lane === Lane.Left ? Left_Lane_X : Right_Lane_X;
    const direction = targetX > this.container.x ? 1 : -1;

    this.scene.tweens.killTweensOf(this.container);
    this.container.setAngle(direction * -10);
    this.container.setScale(1.12, 0.9);
    this.scene.tweens.add({
      targets: this.container,
      x: targetX,
      angle: 0,
      scaleX: 1,
      scaleY: 1,
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
    //プレイヤー周囲の点と人数表示を更新する
    this.populationText.setText(`${population}`);
    const populationLength = `${population}`.length;

    if (populationLength >= 8) {
      this.populationText.setFontSize(13);
    } else if (populationLength >= 5) {
      this.populationText.setFontSize(16);
    } else {
      this.populationText.setFontSize(20);
    }

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
