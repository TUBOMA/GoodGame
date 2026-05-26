"use strict";

//道関係以外の表示の管理のやつ
class HudView {
  constructor(scene) {
    this.scene = scene;
    this.overlayGroup = null;
    this.outsidePopulation = document.getElementById("outside-population");
    this.outsidePhase = document.getElementById("outside-phase");
    this.outsideTime = document.getElementById("outside-time");
    this.outsideBest = document.getElementById("outside-best");
    this.outsideMode = document.getElementById("outside-mode");

    this.populationText = Add_Text(this.scene, 18, 16, "", this.createTextStyle(24));
    this.phaseText = Add_Text(this.scene, 18, 48, "", this.createTextStyle(18));
    this.timeText = Add_Text(this.scene, 18, 76, "", this.createTextStyle(18));
    this.bestText = Add_Text(this.scene, Game_Width - 18, 16, "", this.createTextStyle(18));
    this.bestText.setOrigin(1, 0);

    this.messageText = Add_Text(this.scene, Game_Width / 2, 122, "", {
      fontFamily: "sans-serif",
      fontSize: `${22}px`,
      color: "#ffffff",
      fontStyle: "bold",
      align: "center",
    });
    this.messageText.setOrigin(0.5);

    this.populationText.setDepth(100);
    this.phaseText.setDepth(100);
    this.timeText.setDepth(100);
    this.bestText.setDepth(100);
    this.messageText.setDepth(100);

    //上部パネルに表示する数値は、ゲーム画面内では重複表示しない
    this.populationText.setVisible(false);
    this.phaseText.setVisible(false);
    this.timeText.setVisible(false);
    this.bestText.setVisible(false);
  }

  //文字生成のためのやつ
  createTextStyle(size) {
    return {
      fontFamily: "sans-serif",
      fontSize: `${size}px`,
      color: "#f5f7fb",
      fontStyle: "bold",
      stroke: "#0b1017",
      strokeThickness: 3,
    };
  }

  //各表示(画面上の数値)を更新するためのやつ
  update(population, phaseIndex, phase, elapsedSeconds, bestTime, playMode) {
    const phaseNumber = Math.min(phaseIndex + 1, Phases.length);
    const phaseCount = Phases.length;

    this.populationText.setText(`人数 ${population}`);
    this.phaseText.setText(`PHASE ${phaseNumber}/${phaseCount}  SPEED ${phase.speed}`);
    this.timeText.setText(`TIME ${elapsedSeconds.toFixed(2)}s`);

    this.outsidePopulation.textContent = `${population}`;
    this.outsidePhase.textContent = `${phaseNumber} / ${phaseCount}`;
    this.outsideTime.textContent = `${elapsedSeconds.toFixed(2)}s`;
    this.outsideMode.textContent = Get_Play_Mode_Label(playMode);
    this.outsideMode.classList.toggle("time-attack", playMode === Play_Mode.Time_Attack);

    //
    if (bestTime > 0) {
      this.bestText.setText(`BEST ${bestTime.toFixed(2)}s`);
      this.outsideBest.textContent = `${bestTime.toFixed(2)}s`;
    } else {
      this.bestText.setText("BEST --");
      this.outsideBest.textContent = "--";
    }
  }

  showStartScreen(isTimeAttackUnlocked) {
    // タイトル画面
    this.clearOverlay();

    this.overlayGroup = this.scene.add.group();
    this.overlayGroup.add(this.scene.add.rectangle(Game_Width / 2, Game_Height / 2, Game_Width, Game_Height, 0x111820, 0.82));

    const title = Add_Text(this.scene, Game_Width / 2, 226, "RUN!", {
      fontFamily: "sans-serif",
      fontSize: `${42}px`,
      color: "#ffffff",
      fontStyle: "bold",
      stroke: "#0b1017",
      strokeThickness: 5,
    });
    title.setOrigin(0.5);

    const start = Add_Text(this.scene, Game_Width / 2, 294, "SPACE NORMAL", {
      fontFamily: "sans-serif",
      fontSize: `${24}px`,
      color: "#3ddc97",
      fontStyle: "bold",
      stroke: "#0b1017",
      strokeThickness: 4,
    });
    start.setOrigin(0.5);



    this.overlayGroup.addMultiple([title, start]);

    if (isTimeAttackUnlocked) {
      const timeAttackStart = Add_Text(this.scene, Game_Width / 2, 350, "T  TIME ATTACK", {
        fontFamily: "sans-serif",
        fontSize: `${24}px`,
        color: "#ffd166",
        fontStyle: "bold",
        stroke: "#0b1017",
        strokeThickness: 4,
      });
      timeAttackStart.setOrigin(0.5);
      this.overlayGroup.add(timeAttackStart);
    }

    this.overlayGroup.setDepth(200);
  }

  showEndScreen(didClear, reason, elapsedSeconds, population, playMode, isTimeAttackUnlocked, didUnlockTimeAttack) {
    // クリア・ゲームオーバー画面
    this.clearOverlay();

    this.overlayGroup = this.scene.add.group();
    this.overlayGroup.add(this.scene.add.rectangle(Game_Width / 2, Game_Height / 2, Game_Width, Game_Height, 0x111820, 0.82));

    const titleText = didClear ? "CLEAR!" : "GAME OVER";
    const titleColor = didClear ? "#3ddc97" : "#ef476f";

    const title = Add_Text(this.scene, Game_Width / 2, 250, titleText, {
      fontFamily: "sans-serif",
      fontSize: `${44}px`,
      color: titleColor,
      fontStyle: "bold",
      stroke: "#0b1017",
      strokeThickness: 5,
    });
    title.setOrigin(0.5);

    const detail = Add_Text(this.scene, 
      Game_Width / 2,
      322,
      `${Get_Play_Mode_Label(playMode)}\n${reason}\nTIME ${elapsedSeconds.toFixed(2)}s\n人数 ${population}`,
      {
        fontFamily: "sans-serif",
        fontSize: `${22}px`,
        color: "#ffffff",
        fontStyle: "bold",
        align: "center",
        lineSpacing: 8,
        stroke: "#0b1017",
        strokeThickness: 4,
      },
    );
    detail.setOrigin(0.5);

    const restartLabel = isTimeAttackUnlocked ? "SPACE RETRY    T TIME ATTACK" : "SPACE RETRY";
    const restart = Add_Text(this.scene, Game_Width / 2, didUnlockTimeAttack ? 482 : 450, restartLabel, {
      fontFamily: "sans-serif",
      fontSize: `${20}px`,
      color: "#ffd166",
      fontStyle: "bold",
      stroke: "#0b1017",
      strokeThickness: 4,
    });
    restart.setOrigin(0.5);

    this.overlayGroup.addMultiple([title, detail, restart]);

    if (didUnlockTimeAttack) {
      const unlock = Add_Text(this.scene, Game_Width / 2, 432, "TIME ATTACK UNLOCKED", {
        fontFamily: "sans-serif",
        fontSize: `${20}px`,
        color: "#3ddc97",
        fontStyle: "bold",
        stroke: "#0b1017",
        strokeThickness: 4,
      });
      unlock.setOrigin(0.5);
      this.overlayGroup.add(unlock);
    }

    this.overlayGroup.setDepth(200);
  }

  // フェーズ開始メッセージ
  showCenterMessage(text) {
    this.messageText.setText(text);
    this.messageText.setAlpha(1);

    this.scene.tweens.add({
      targets: this.messageText,
      alpha: 0,
      duration: 900,
      delay: 500,
    });
  }

   // 人数が変わった瞬間の表示
  showFloatingResult(text, x) {
    const floatingText = Add_Text(this.scene, x, Player_Y - 78, text, {
      fontFamily: "sans-serif",
      fontSize: `${26}px`,
      color: "#ffffff",
      fontStyle: "bold",
      stroke: "#0b1017",
      strokeThickness: 4,
    });
    floatingText.setOrigin(0.5);
    floatingText.setDepth(90);

    this.scene.tweens.add({
      targets: floatingText,
      y: floatingText.y - 42,
      alpha: 0,
      duration: 650,
      onComplete: () => floatingText.destroy(),
    });
  }

    //タイトル画面や終了画面を消す処理
  clearOverlay() {
    if (this.overlayGroup) {
      this.overlayGroup.clear(true, true);
      this.overlayGroup = null;
    }
  }
}
