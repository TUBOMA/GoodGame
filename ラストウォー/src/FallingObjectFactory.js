"use strict";

//ゲート上のものをつくるやつ
class FallingObjectFactory {
  constructor(scene) {
    this.scene = scene;
  }

  //指定した位置に指定した色のゲートを二つ作り出すやつ
  //どのゲートをどのフェーズの設定でどの距離感で作り出すか
  createGatePair(gatePair, phase, gatePairIndex) {
    const container = this.scene.add.container(0, -90);
    container.setDepth(20);

    const leftGate = this.createGateVisual(Left_Lane_X, gatePair[0], 0x3ddc97);
    const rightGate = this.createGateVisual(Right_Lane_X, gatePair[1], 0xffd166);

    container.add([leftGate.box, leftGate.text, rightGate.box, rightGate.text]);
    this.addVisualNoise(container, phase, gatePairIndex);

    return {
      type: "gate",
      y: -90,
      container,
      isAlreadyUsed: false,
      gates: gatePair,
      leftBox: leftGate.box,
      rightBox: rightGate.box,
    };
  }
  //指定した位置に指定した色のゲートを一つ作り出すやつ
  createGateVisual(x, gate, color) {
    const box = this.scene.add.rectangle(x, 0, 145, 86, color, 0.9);
    box.setStrokeStyle(4, 0xffffff, 0.75);

    const text = this.scene.add.text(x, 0, gate.label, {
      fontFamily: "sans-serif",
      fontSize: "34px",
      color: "#111820",
      fontStyle: "bold",
    });
    text.setOrigin(0.5);

    return { box, text };
  }

  //視認性を悪くするための
  addVisualNoise(container, phase, gatePairIndex) {
    if (phase.noiseCount === 0) {
      return;
    }

    const fakeLabels = ["+?", "x?", "-?", "?"];

    for (let i = 0; i < phase.noiseCount; i += 1) {
      const x = 95 + i * 95;
      const y = -55 + i * 24;
      const label = fakeLabels[(gatePairIndex + i) % fakeLabels.length];
      const fakeText = this.scene.add.text(x, y, label, {
        fontFamily: "sans-serif",
        fontSize: "18px",
        color: "#d6dee8",
        fontStyle: "bold",
      });
      fakeText.setOrigin(0.5);
      fakeText.setAlpha(0.42);
      container.add(fakeText);
    }
  }

  createWall(cost) {
    // フェーズ最後の壁を作る処理
    const container = this.scene.add.container(0, -90);
    container.setDepth(20);

    const wall = this.scene.add.rectangle(Game_Width / 2, 0, 335, 76, 0xef476f, 0.94);
    wall.setStrokeStyle(4, 0xffffff, 0.75);

    const text = this.scene.add.text(Game_Width / 2, 0, `WALL -${cost}`, {
      fontFamily: "sans-serif",
      fontSize: "30px",
      color: "#ffffff",
      fontStyle: "bold",
    });
    text.setOrigin(0.5);

    container.add([wall, text]);

    return {
      type: "wall",
      y: -90,
      container,
      isAlreadyUsed: false,
      cost,
    };
  }

  createGoal() {
    // ゴールを作る処理
    const container = this.scene.add.container(0, -90);
    container.setDepth(20);

    const line = this.scene.add.rectangle(Game_Width / 2, 0, 360, 90, 0xffffff, 0.95);
    line.setStrokeStyle(5, 0xffd166, 1);

    const text = this.scene.add.text(Game_Width / 2, 0, "GOAL", {
      fontFamily: "sans-serif",
      fontSize: "38px",
      color: "#111820",
      fontStyle: "bold",
    });
    text.setOrigin(0.5);

    container.add([line, text]);

    return {
      type: "goal",
      y: -90,
      container,
      isAlreadyUsed: false,
    };
  }

  markSelectedGate(fallingObject, selectedLane) {
    // 選んだゲートを強調する処理
    const selectedBox = selectedLane === Lane.Left ? fallingObject.leftBox : fallingObject.rightBox;
    const otherBox = selectedLane === Lane.Left ? fallingObject.rightBox : fallingObject.leftBox;

    selectedBox.setStrokeStyle(7, 0xffffff, 1);
    otherBox.setAlpha(0.35);
  }
}
