"use strict";

//ゲームの開始、入力、進行、終了をまとめて管理するシーン
class RunnerScene extends Phaser.Scene {
  constructor() {
    super("RunnerScene");
  }
  
  create() {
    this.playMode = Play_Mode.Normal;

    //描画と保存判定を担当するクラスを用意する
    this.roadView = new RoadView(this);
    this.playerView = new PlayerView(this);
    this.hudView = new HudView(this);
    this.fallingObjectFactory = new FallingObjectFactory(this);
    this.progressManager = new ProgressManager();
    this.hudView.setModeInputHandler((playMode) => this.selectPlayMode(playMode));

    this.createInput();
    this.showStartScreen();
  }

  //ゲームプレイ中の時間と流れてくる物を進める
  update(time, delta) {
    if (this.gameState !== "playing") {
      return;
    }
    this.elapsedSeconds += delta / 1000;

    const phase = this.getCurrentPhase();
    this.roadView.moveStripes(phase.speed, delta);
    this.moveFallingObject(delta);
    this.updateHud();
  }

  //左右移動とゲーム開始のキー入力を登録する
  createInput() {
    this.input.keyboard.on("keydown-LEFT", (event) => this.handleLaneInput(Lane.Left, event));
    this.input.keyboard.on("keydown-A", (event) => this.handleLaneInput(Lane.Left, event));
    this.input.keyboard.on("keydown-RIGHT", (event) => this.handleLaneInput(Lane.Right, event));
    this.input.keyboard.on("keydown-D", (event) => this.handleLaneInput(Lane.Right, event));
    this.input.keyboard.on("keydown-SPACE", () => {
      if (this.gameState !== "playing") {
        this.startGame(this.playMode);
      }
    });
  }

  //スタート画面の状態を準備する
  showStartScreen() {
    this.gameState = "ready";
    this.playMode = Play_Mode.Normal;
    this.playPhases = null;
    this.population = this.progressManager.getStartPopulation();
    this.phaseIndex = 0;
    this.currentGatePairIndex = 0;
    this.elapsedSeconds = 0;

    this.playerView.resetLane();
    this.playerView.updatePopulation(this.population);
    this.roadView.updateLaneHighlight(this.playerView.getCurrentLane());
    this.hudView.setModeMessage("");
    this.hudView.updateModeSelection(this.playMode, false);
    this.hudView.showStartScreen();
    this.updateHud();
  }

  //選択中のモードで新しいプレイを開始する
  startGame(playMode) {
    this.hudView.clearOverlay();
    this.clearFallingObject();

    this.gameState = "playing";
    this.playMode = playMode || Play_Mode.Normal;
    //ゲーム開始時に、今回のプレイで使う全フェーズの数字を先に作る
    //ステージ生成は基本の Start_Population で作り、強化は速度だけに反映する
    const speedMultiplier = this.progressManager.getSpeedMultiplier();
    this.playPhases = Create_Random_Phases().map((phase) => ({
      ...phase,
      speed: Math.round(phase.speed * speedMultiplier),
    }));
    this.population = this.progressManager.getStartPopulation();
    this.progressManager.recordPlay(this.population);
    this.phaseIndex = 0;
    this.currentGatePairIndex = 0;
    this.elapsedSeconds = 0;

    this.playerView.resetLane();
    this.playerView.updatePopulation(this.population);
    this.roadView.updateLaneHighlight(this.playerView.getCurrentLane());
    this.roadView.resetBoostEffect();
    this.hudView.setModeMessage("");
    this.hudView.updateModeSelection(this.playMode, true);

    //フェーズ番号は上部HUDに表示する。道の上には文字を出さず、ゲートを読みやすくする
    this.spawnNextObject();
    this.updateHud();
  }
  
  //左右入力を通常移動またはタイムアタックの即時選択として扱う
  handleLaneInput(lane, event) {
    //タイムアタック中はキーを押しっぱなしにしても1問ずつ選ばせる
    if (this.isTimeAttackMode() && event && event.repeat) {
      return;
    }

    //ゲーム開始前は、画面下のモード選択とSPACEだけを受け付ける
    if (this.gameState !== "playing") {
      return;
    }

    if (this.isTimeAttackMode()) {
      this.handleTimeAttackLaneInput(lane);
      return;
    }

    //通常モードでは、入力はレーン移動だけを行う
    this.movePlayerToLane(lane);
  }

  //タイムアタックでは左右入力がそのまま現在のゲートの回答になる
  handleTimeAttackLaneInput(lane) {
    this.movePlayerToLane(lane);

    if (
      this.fallingObject &&
      this.fallingObject.type === "gate" &&
      !this.fallingObject.isAlreadyUsed
    ) {
      this.roadView.showBoostEffect(lane);
      this.applyTimeAttackChoice();
    }
  }

  //ゲーム開始前に画面下のラジオボタンで遊ぶモードを選ぶ
  selectPlayMode(playMode) {
    if (this.gameState === "playing") {
      return;
    }

    if (playMode === Play_Mode.Time_Attack && !this.progressManager.isTimeAttackUnlocked) {
      this.playMode = Play_Mode.Normal;
      this.hudView.updateModeSelection(this.playMode, false);
      this.hudView.setModeMessage("ノーマルモードを一度クリアしてね！");
      this.updateHud();
      return;
    }

    this.playMode = playMode;
    this.hudView.setModeMessage("");
    this.hudView.updateModeSelection(this.playMode, false);
    this.updateHud();
  }

  //プレイヤーを選んだレーンへ移動する
  movePlayerToLane(lane) {
    this.playerView.moveToLane(lane);
    this.roadView.updateLaneHighlight(lane);
  }

  spawnNextObject() {
    //全フェーズが終了したらゴールを流す
    if (this.phaseIndex >= this.playPhases.length) {
      this.fallingObject = this.fallingObjectFactory.createGoal();
      return;
    }
    const phase = this.getCurrentPhase();
    this.roadView.setFog(phase.fogAlpha);

    if (this.currentGatePairIndex < phase.gates.length) {
      const gatePair = phase.gates[this.currentGatePairIndex];
      this.fallingObject = this.fallingObjectFactory.createGatePair(gatePair, phase, this.currentGatePairIndex);
      return;
    }

    this.fallingObject = this.fallingObjectFactory.createWall(phase.wallCost);
  }

  //ゲート・壁・ゴールをプレイヤーへ向かって流す
  moveFallingObject(delta) {
    if (!this.fallingObject) {
      return;
    }

    const phase = this.getCurrentPhase();
    const distance = phase.speed * (delta / 1000);

    this.fallingObject.y += distance;
    this.fallingObject.container.y = this.fallingObject.y;

    //同じ物との接触判定は一度だけ行う
    if (!this.fallingObject.isAlreadyUsed && this.fallingObject.y >= Player_Y - 38) {
      this.handleFallingObject();
    }

    //通過した表示を消して次の物を流す
    if (this.fallingObject.y > Game_Height + 120) {
      this.fallingObject.container.destroy();
      this.fallingObject = null;
      if (this.gameState === "playing") {
        this.spawnNextObject();
      }
    }
  }

  handleFallingObject() {
    //流れてきた物の種類ごとに通過処理を行う
    if (this.fallingObject.type === "gate") {
      this.applySelectedGate();
    } else if (this.fallingObject.type === "wall") {
      this.applyWallDamage();
    } else if (this.fallingObject.type === "goal") {
      this.finishGame(true, "CLEAR");
    }
  }

  //ゲート通過時の人数変化
  applySelectedGate() {
    this.fallingObject.isAlreadyUsed = true;

    const selectedLane = this.playerView.getCurrentLane();
    const selectedGate = selectedLane === Lane.Left
      ? this.fallingObject.gates[0]
      : this.fallingObject.gates[1];
    const oldPopulation = this.population;
    this.population = Calculate_Population(this.population, selectedGate);

    this.fallingObjectFactory.markSelectedGate(this.fallingObject, selectedLane);
    this.playerView.updatePopulation(this.population);
    this.hudView.showFloatingResult(`${oldPopulation} -> ${this.population}`, this.playerView.getX());

    this.currentGatePairIndex += 1;

    if (this.population <= 0) {
      this.finishGame(false, "人数が0になった");
    }
  }

  //タイムアタック用: 選択を即座に確定して、次の問題へ進める
  applyTimeAttackChoice() {
    this.applySelectedGate();

    if (this.gameState !== "playing") {
      return;
    }

    this.clearFallingObject();
    this.spawnNextObject();
    this.processTimeAttackNonChoiceObjects();
  }

  //壁とゴールには左右の選択がないため、タイムアタックでは待たずに処理する
  processTimeAttackNonChoiceObjects() {
    while (
      this.gameState === "playing" &&
      this.fallingObject &&
      this.fallingObject.type !== "gate"
    ) {
      this.handleFallingObject();

      if (this.gameState !== "playing") {
        return;
      }

      this.clearFallingObject();
      this.spawnNextObject();
    }
  }

  //フェーズ最後の壁チェック
  applyWallDamage() {
    this.fallingObject.isAlreadyUsed = true;

    const oldPopulation = this.population;
    this.population -= this.fallingObject.cost;

    this.playerView.updatePopulation(this.population);
    this.hudView.showFloatingResult(`${oldPopulation} -> ${this.population}`, this.playerView.getX());

    if (this.population <= 0) {
      this.finishGame(false, "壁を突破できなかった");
      return;
    }

    this.progressManager.addPhaseReward(this.phaseIndex);

    //フェーズを進める
    this.phaseIndex += 1;
    this.currentGatePairIndex = 0;

  }

  finishGame(didClear, reason) {
    //クリア・ゲームオーバーの結果を保存して表示する
    this.gameState = didClear ? "clear" : "gameover";
    const didUnlockTimeAttack = this.progressManager.recordResult(
      didClear,
      this.elapsedSeconds,
      this.playMode,
    );

    this.hudView.showEndScreen(
      didClear,
      reason,
      this.elapsedSeconds,
      this.population,
      this.playMode,
      didUnlockTimeAttack,
    );
    this.hudView.updateModeSelection(this.playMode, false);
    this.updateHud();
  }

  //画面上部の人数・フェーズ・時間・ベストタイムを更新する
  updateHud() {
    this.hudView.update(
      this.population,
      this.phaseIndex,
      this.elapsedSeconds,
      this.getCurrentBestTime(),
    );
  }

  getCurrentBestTime() {
    return this.progressManager.getBestTime(this.playMode);
  }

  isTimeAttackMode() {
    return this.playMode === Play_Mode.Time_Attack;
  }

  getCurrentPhase() {
    //終了直後も最後のフェーズ設定を表示用に参照できるよう範囲内に収める
    const phaseList = this.playPhases || Phases;
    const safePhaseIndex = Math.min(this.phaseIndex, phaseList.length - 1);
    return phaseList[safePhaseIndex];
  }

  clearFallingObject() {
    //リトライ時などに古いゲート表示を消す処理
    if (this.fallingObject) {
      this.fallingObject.container.destroy();
      this.fallingObject = null;
    }
  }
}
