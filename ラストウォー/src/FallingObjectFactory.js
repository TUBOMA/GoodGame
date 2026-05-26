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

    const leftGate = this.createGateVisual(Left_Lane_X, gatePair[0], 0x4fe3a1);
    const rightGate = this.createGateVisual(Right_Lane_X, gatePair[1], 0xf4d06f);

    container.add(leftGate.parts);
    container.add(rightGate.parts);
    this.addVisualNoise(container, phase, gatePairIndex);

    return {
      type: "gate",
      y: -90,
      container,
      isAlreadyUsed: false,
      gates: gatePair,
      leftBox: leftGate.box,
      rightBox: rightGate.box,
      leftGlow: leftGate.glow,
      rightGlow: rightGate.glow,
    };
  }
  //指定した位置に指定した色のゲートを一つ作り出すやつ
  createGateVisual(x, gate, color) {
    const shadow = this.scene.add.rectangle(x + 6, 8, 148, 88, 0x000000, 0.24);
    const glow = this.scene.add.rectangle(x, 0, 156, 96, color, 0.16);
    const box = this.scene.add.rectangle(x, 0, 145, 86, color, 0.96);
    const shine = this.scene.add.rectangle(x, -30, 132, 12, 0xffffff, 0.23);
    box.setStrokeStyle(3, 0xffffff, 0.88);

    const text = Add_Text(this.scene, x, 0, gate.label, {
      fontFamily: "sans-serif",
      fontSize: `${34}px`,
      color: "#111820",
      fontStyle: "bold",
      stroke: "#ffffff",
      strokeThickness: 2,
    });
    text.setOrigin(0.5);

    return { box, glow, parts: [shadow, glow, box, shine, text] };
  }

  //視認性を悪くするためのやつ
  addVisualNoise(container, phase, gatePairIndex) {
    //noisecountが0なら処理せずそのまま終了させる
    if (phase.noiseCount === 0) {
      return;
    }

    const fakeLabels = ["+?", "x?", "-?", "?"];

    for (let i = 0; i < phase.noiseCount; i += 1) {
      const x = 95 + i * 95;
      const y = -55 + i * 24;
      const label = fakeLabels[(gatePairIndex + i) % fakeLabels.length];
      const fakeText = Add_Text(this.scene, x, y, label, {
        fontFamily: "sans-serif",
        fontSize: `${18}px`,
        color: "#d6dee8",
        fontStyle: "bold",
      });
      fakeText.setOrigin(0.5);
      fakeText.setAlpha(0.42);
      container.add(fakeText);
    }
  }
  
  //フェーズごとの最後の数字を生成
  //
  createWall(cost) {
    const container = this.scene.add.container(0, -90);
    container.setDepth(20);

    const shadow = this.scene.add.rectangle(Game_Width / 2 + 7, 8, 338, 78, 0x000000, 0.24);
    const wall = this.scene.add.rectangle(Game_Width / 2, 0, 335, 76, 0xe84f74, 0.98);
    const shine = this.scene.add.rectangle(Game_Width / 2, -25, 312, 10, 0xffffff, 0.2);
    wall.setStrokeStyle(3, 0xffffff, 0.85);

    const text = Add_Text(this.scene, Game_Width / 2, 0, `WALL -${cost}`, {
      fontFamily: "sans-serif",
      fontSize: `${30}px`,
      color: "#ffffff",
      fontStyle: "bold",
      stroke: "#6d1830",
      strokeThickness: 3,
    });
    text.setOrigin(0.5);

    container.add([shadow, wall, shine, text]);

    return {
      type: "wall",
      y: -90,
      container,
      isAlreadyUsed: false,
      cost,
    };
  }

  createGoal() {
    // ゴールを作る
    const container = this.scene.add.container(0, -90);
    container.setDepth(20);

    const shadow = this.scene.add.rectangle(Game_Width / 2 + 7, 8, 362, 92, 0x000000, 0.22);
    const line = this.scene.add.rectangle(Game_Width / 2, 0, 360, 90, 0xffffff, 0.98);
    const shine = this.scene.add.rectangle(Game_Width / 2, -29, 330, 12, 0xfff1b2, 0.45);
    line.setStrokeStyle(5, 0xffd166, 1);

    const text = Add_Text(this.scene, Game_Width / 2, 0, "GOAL", {
      fontFamily: "sans-serif",
      fontSize: `${38}px`,
      color: "#111820",
      fontStyle: "bold",
      stroke: "#ffd166",
      strokeThickness: 2,
    });
    text.setOrigin(0.5);

    //
    container.add([shadow, line, shine, text]);

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
    const selectedGlow = selectedLane === Lane.Left ? fallingObject.leftGlow : fallingObject.rightGlow;

    selectedBox.setStrokeStyle(6, 0xffffff, 1);
    selectedGlow.setAlpha(0.42);
    otherBox.setAlpha(0.35);
  }
}
