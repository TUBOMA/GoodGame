"use strict";

//道路とタイムアタック時の加速演出を管理するクラス
class RoadView {
  constructor(scene) {
    this.scene = scene;
    this.roadStripes = [];
    this.boostTimeRemaining = 0;
    this.boostLines = [];

    this.createRoad();
  }

  //道路を描画する
  createRoad() {
    this.scene.add.rectangle(Game_Width / 2, Game_Height / 2, Game_Width, Game_Height, 0x0f1720);
    this.scene.add.rectangle(Game_Width / 2, Game_Height / 2, 386, Game_Height, 0x10151c, 0.55);
    this.scene.add.rectangle(Game_Width / 2, Game_Height / 2, 360, Game_Height, 0x263442);
    this.scene.add.rectangle(Game_Width / 2, Game_Height / 2, 336, Game_Height, 0x2d3f4b, 0.45);

    this.scene.add.rectangle(59, Game_Height / 2, 3, Game_Height, 0xffffff, 0.12);
    this.scene.add.rectangle(421, Game_Height / 2, 3, Game_Height, 0xffffff, 0.12);

    this.leftLaneHighlight = this.scene.add.rectangle(Left_Lane_X, Game_Height / 2, 166, Game_Height, 0x4de0a5, 0.09);
    this.rightLaneHighlight = this.scene.add.rectangle(Right_Lane_X, Game_Height / 2, 166, Game_Height, 0x4de0a5, 0.02);

    this.scene.add.rectangle(Game_Width / 2 - 3, Game_Height / 2, 2, Game_Height, 0x0b1017, 0.38);
    this.scene.add.rectangle(Game_Width / 2 + 3, Game_Height / 2, 2, Game_Height, 0xffffff, 0.08);
    this.scene.add.rectangle(Game_Width / 2, Game_Height / 2, 4, Game_Height, 0xe8edf2, 0.18);
    
    for (let i = 0; i < 9; i += 1) {
      const stripe = this.scene.add.rectangle(Game_Width / 2, i * 95, 7, 54, 0xf7fbff, 0.28);
      this.roadStripes.push(stripe);
    }

    this.fog = this.scene.add.rectangle(Game_Width / 2, Game_Height / 2, Game_Width, Game_Height, 0xf0f6ff, 0);
    this.fog.setDepth(50);
  }

  //プレイヤーがいるレーンを明るく表示する
  updateLaneHighlight(currentLane) {
    const leftAlpha = currentLane === Lane.Left ? 0.12 : 0.02;
    const rightAlpha = currentLane === Lane.Right ? 0.12 : 0.02;

    this.leftLaneHighlight.setFillStyle(0x3ddc97, leftAlpha);
    this.rightLaneHighlight.setFillStyle(0x3ddc97, rightAlpha);
  }

  //フェーズに応じた霧の濃さを反映する
  setFog(alpha) {
    this.fog.setAlpha(alpha);
  }

  //タイムアタックで即座に選んだ時の加速演出
  showBoostEffect(lane) {
    this.boostTimeRemaining = 230;

    const laneX = lane === Lane.Left ? Left_Lane_X : Right_Lane_X;
    const activeHighlight = lane === Lane.Left ? this.leftLaneHighlight : this.rightLaneHighlight;
    const linePositions = [
      { x: -64, y: 130 },
      { x: 64, y: 210 },
      { x: -64, y: 320 },
      { x: 64, y: 410 },
    ];

    //前回選んだレーンの光が残らないよう、左右両方の明滅を止める
    this.scene.tweens.killTweensOf(this.leftLaneHighlight);
    this.scene.tweens.killTweensOf(this.rightLaneHighlight);
    activeHighlight.setFillStyle(0x3ddc97, 0.27);
    this.scene.tweens.add({
      targets: activeHighlight,
      fillAlpha: 0.12,
      duration: 230,
    });

    for (const position of linePositions) {
      const speedLine = this.scene.add.rectangle(laneX + position.x, position.y, 5, 70, 0xa8f5ff, 0.82);
      speedLine.setDepth(20);
      this.boostLines.push(speedLine);

      this.scene.tweens.add({
        targets: speedLine,
        y: position.y + 190,
        scaleY: 1.8,
        alpha: 0,
        duration: 230,
        ease: "Quad.easeIn",
        onComplete: () => {
          speedLine.destroy();
          this.boostLines = this.boostLines.filter((line) => line !== speedLine);
        },
      });
    }
  }

  //リトライ時などに、前回プレイの加速演出を残さない
  resetBoostEffect() {
    this.boostTimeRemaining = 0;
    this.scene.tweens.killTweensOf(this.leftLaneHighlight);
    this.scene.tweens.killTweensOf(this.rightLaneHighlight);

    for (const speedLine of this.boostLines) {
      this.scene.tweens.killTweensOf(speedLine);
      speedLine.destroy();
    }

    this.boostLines = [];
  }

  //道路中央の線を流して前進感を表示する
  moveStripes(speed, delta) {
    if (this.boostTimeRemaining > 0) {
      speed *= 2.6;
      this.boostTimeRemaining -= delta;
    }

    const distance = speed * (delta / 1000);

    for (const stripe of this.roadStripes) {
      stripe.y += distance;

      if (stripe.y > Game_Height + 40) {
        stripe.y = -40;
      }
    }
  }
}
