"use strict";

//画面上部の数値、モード選択、開始・終了表示を管理するクラス
class HudView {
  constructor(scene) {
    this.scene = scene;
    this.overlayGroup = null;
    this.outsidePopulation = document.getElementById("outside-population");
    this.outsidePhase = document.getElementById("outside-phase");
    this.outsideTime = document.getElementById("outside-time");
    this.outsideBest = document.getElementById("outside-best");
    this.normalModeRadio = document.getElementById("normal-mode");
    this.timeAttackModeRadio = document.getElementById("time-attack-mode");
    this.modeMessage = document.getElementById("mode-message");
  }

  //画面上部の数値表示を更新する
  update(population, phaseIndex, elapsedSeconds, bestTime) {
    const phaseNumber = Math.min(phaseIndex + 1, Phases.length);
    const populationText = `${population}`;

    this.outsidePopulation.textContent = populationText;
    const populationLength = populationText.length;
    this.outsidePopulation.classList.toggle("compact", populationLength >= 5);
    this.outsidePopulation.classList.toggle("very-compact", populationLength >= 8);
    this.outsidePhase.textContent = `${phaseNumber} / ${Phases.length}`;
    this.outsideTime.textContent = `${elapsedSeconds.toFixed(2)}s`;
    this.outsideBest.textContent = bestTime > 0 ? `${bestTime.toFixed(2)}s` : "--";
  }

  //画面下のモード選択をゲーム進行へ伝えるための処理
  setModeInputHandler(onModeSelected) {
    this.normalModeRadio.addEventListener("change", () => {
      if (this.normalModeRadio.checked) {
        onModeSelected(Play_Mode.Normal);
      }
    });

    this.timeAttackModeRadio.addEventListener("change", () => {
      if (this.timeAttackModeRadio.checked) {
        onModeSelected(Play_Mode.Time_Attack);
      }
    });
  }

  //選択中のモードと、プレイ中に変更できない状態を表示へ反映する
  updateModeSelection(playMode, isPlaying) {
    this.normalModeRadio.checked = playMode === Play_Mode.Normal;
    this.timeAttackModeRadio.checked = playMode === Play_Mode.Time_Attack;
    this.normalModeRadio.disabled = isPlaying;
    this.timeAttackModeRadio.disabled = isPlaying;
  }

  //モードを選べない時の案内を表示・消去する
  setModeMessage(message) {
    this.modeMessage.textContent = message;
  }

  //開始画面を表示する
  showStartScreen() {
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

    const start = Add_Text(this.scene, Game_Width / 2, 294, "SPACE START", {
      fontFamily: "sans-serif",
      fontSize: `${24}px`,
      color: "#3ddc97",
      fontStyle: "bold",
      stroke: "#0b1017",
      strokeThickness: 4,
    });
    start.setOrigin(0.5);

    this.overlayGroup.addMultiple([title, start]);
    this.overlayGroup.setDepth(200);
  }

  //クリア・ゲームオーバー画面を表示する
  showEndScreen(didClear, reason, elapsedSeconds, population, playMode, didUnlockTimeAttack) {
    this.clearOverlay();

    this.overlayGroup = this.scene.add.group();
    this.overlayGroup.add(this.scene.add.rectangle(Game_Width / 2, Game_Height / 2, Game_Width, Game_Height, 0x111820, 0.94));

    const titleText = didClear ? "CLEAR!" : "GAME OVER";
    const titleColor = didClear ? "#3ddc97" : "#ef476f";

    const title = Add_Text(this.scene, Game_Width / 2, 202, titleText, {
      fontFamily: "sans-serif",
      fontSize: `${44}px`,
      color: titleColor,
      fontStyle: "bold",
      stroke: "#0b1017",
      strokeThickness: 5,
    });
    title.setOrigin(0.5);

    const mode = Add_Text(this.scene, Game_Width / 2, 258, Get_Play_Mode_Label(playMode), {
      fontFamily: "sans-serif",
      fontSize: `${18}px`,
      color: "#9cf2d7",
      fontStyle: "bold",
      stroke: "#0b1017",
      strokeThickness: 3,
    });
    mode.setOrigin(0.5);

    const detailFontSize = `${population}`.length >= 8 ? 17 : 22;
    const detail = Add_Text(this.scene, 
      Game_Width / 2,
      338,
      `${reason}\nTIME ${elapsedSeconds.toFixed(2)}s\n人数 ${population}`,
      {
        fontFamily: "sans-serif",
        fontSize: `${detailFontSize}px`,
        color: "#ffffff",
        fontStyle: "bold",
        align: "center",
        lineSpacing: 8,
        stroke: "#0b1017",
        strokeThickness: 4,
      },
    );
    detail.setOrigin(0.5);

    const restartLabel = "SPACE RETRY";
    const restart = Add_Text(this.scene, Game_Width / 2, didUnlockTimeAttack ? 492 : 458, restartLabel, {
      fontFamily: "sans-serif",
      fontSize: `${20}px`,
      color: "#ffd166",
      fontStyle: "bold",
      stroke: "#0b1017",
      strokeThickness: 4,
    });
    restart.setOrigin(0.5);

    this.overlayGroup.addMultiple([title, mode, detail, restart]);

    if (didUnlockTimeAttack) {
      const unlock = Add_Text(this.scene, Game_Width / 2, 444, "TIME ATTACK UNLOCKED", {
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

  //人数が変わった瞬間の表示
  showFloatingResult(text, x) {
    let floatingFontSize = 30;

    if (text.length >= 15) {
      floatingFontSize = 18;
    } else if (text.length >= 11) {
      floatingFontSize = 22;
    }

    const floatingText = Add_Text(this.scene, x, Player_Y - 88, text, {
      fontFamily: "sans-serif",
      fontSize: `${floatingFontSize}px`,
      color: "#ffffff",
      fontStyle: "bold",
      stroke: "#0b1017",
      strokeThickness: 5,
    });
    floatingText.setOrigin(0.5);
    floatingText.setScale(0.82);
    floatingText.setDepth(90);

    this.scene.tweens.add({
      targets: floatingText,
      y: floatingText.y - 42,
      scale: 1.08,
      alpha: 0,
      duration: 650,
      ease: "Back.easeOut",
      onComplete: () => floatingText.destroy(),
    });
  }

  //タイトル画面や終了画面を消す
  clearOverlay() {
    if (this.overlayGroup) {
      this.overlayGroup.clear(true, true);
      this.overlayGroup = null;
    }
  }
}
