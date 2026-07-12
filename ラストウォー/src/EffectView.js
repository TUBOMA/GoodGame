"use strict";

//移動、ゲート通過、壁突破などの気持ちよさを出す演出を管理するクラス
class EffectView {
  constructor(scene) {
    this.scene = scene;
  }

  //左右移動時に残像と光のラインを出す
  playLaneMove(fromX, toX) {
    if (fromX === toX) {
      return;
    }

    const direction = toX > fromX ? 1 : -1;
    const centerX = (fromX + toX) / 2;
    const trailColor = 0x9cf2d7;

    for (let i = 0; i < 3; i += 1) {
      const afterImageX = fromX + direction * i * 26;
      const afterImage = this.scene.add.circle(afterImageX, Player_Y, 23, trailColor, 0.34 - i * 0.08);
      afterImage.setDepth(35);
      this.scene.tweens.add({
        targets: afterImage,
        x: afterImageX - direction * 18,
        scale: 1.5 + i * 0.12,
        alpha: 0,
        duration: 190,
        ease: "Quad.easeOut",
        onComplete: () => afterImage.destroy(),
      });
    }

    const streak = this.scene.add.rectangle(centerX, Player_Y, Math.abs(toX - fromX) + 48, 9, trailColor, 0.62);
    streak.setDepth(34);
    streak.setAngle(direction * -4);
    this.scene.tweens.add({
      targets: streak,
      scaleX: 1.12,
      alpha: 0,
      duration: 150,
      ease: "Sine.easeOut",
      onComplete: () => streak.destroy(),
    });

    const landingRing = this.scene.add.circle(toX, Player_Y, 18, trailColor, 0);
    landingRing.setStrokeStyle(4, trailColor, 0.7);
    landingRing.setDepth(69);
    this.scene.tweens.add({
      targets: landingRing,
      radius: 44,
      alpha: 0,
      duration: 150,
      ease: "Quad.easeOut",
      onComplete: () => landingRing.destroy(),
    });
    this.scene.cameras.main.shake(55, 0.002);
  }

  //ゲート通過時にリング、火花、短いフラッシュを出す
  playGatePass(x, didGainPopulation) {
    const effectColor = didGainPopulation ? 0x5df4b4 : 0xffd166;
    const ring = this.scene.add.circle(x, Player_Y, 34, effectColor, 0);
    ring.setStrokeStyle(5, effectColor, 0.86);
    ring.setDepth(70);

    this.scene.tweens.add({
      targets: ring,
      radius: 70,
      alpha: 0,
      duration: 220,
      ease: "Cubic.easeOut",
      onComplete: () => ring.destroy(),
    });
    this.scene.cameras.main.flash(70, 80, 244, 180, false);

    const laneFlash = this.scene.add.rectangle(x, Game_Height / 2, 166, Game_Height, effectColor, 0.16);
    laneFlash.setDepth(32);
    this.scene.tweens.add({
      targets: laneFlash,
      alpha: 0,
      duration: 240,
      ease: "Sine.easeOut",
      onComplete: () => laneFlash.destroy(),
    });

    for (let i = 0; i < 4; i += 1) {
      const speedLine = this.scene.add.rectangle(x - 52 + i * 35, Player_Y - 120 - i * 42, 5, 70, 0xa8f5ff, 0.68);
      speedLine.setDepth(71);
      this.scene.tweens.add({
        targets: speedLine,
        y: speedLine.y + 190,
        scaleY: 1.7,
        alpha: 0,
        duration: 260,
        ease: "Quad.easeIn",
        onComplete: () => speedLine.destroy(),
      });
    }

    for (let i = 0; i < 14; i += 1) {
      const angle = (-150 + i * 23) * (Math.PI / 180);
      const particle = this.scene.add.rectangle(x, Player_Y, 8, 4, effectColor, 0.9);
      particle.setDepth(72);
      particle.setRotation(angle);

      this.scene.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * 82,
        y: Player_Y + Math.sin(angle) * 42,
        alpha: 0,
        duration: 300,
        ease: "Quad.easeOut",
        onComplete: () => particle.destroy(),
      });
    }

    this.flashLane(x, effectColor);
  }

  //壁突破時に中央から衝撃波を出す
  playWallBreak() {
    const shockWave = this.scene.add.rectangle(Game_Width / 2, Player_Y - 20, 330, 18, 0xffffff, 0.62);
    shockWave.setDepth(73);
    this.scene.tweens.add({
      targets: shockWave,
      scaleX: 1.25,
      scaleY: 3.2,
      alpha: 0,
      duration: 260,
      ease: "Quad.easeOut",
      onComplete: () => shockWave.destroy(),
    });

    this.scene.cameras.main.shake(90, 0.004);
  }

  flashLane(x, color) {
    const flash = this.scene.add.rectangle(x, Player_Y, 152, 126, color, 0.22);
    flash.setDepth(33);
    this.scene.tweens.add({
      targets: flash,
      scaleY: 1.5,
      alpha: 0,
      duration: 220,
      ease: "Sine.easeOut",
      onComplete: () => flash.destroy(),
    });
  }
}
