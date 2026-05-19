//いつもの勝手な変数設定を防ぐためのやつ
"use strict";

//シーン
class RunnerScene extends Phaser.Scene {
  //コンストラクタでこのシーンを初期化する
  constructor() {
    super("RunnerScene");
  }
  
  create() {
    //ローカルストレージ内からベストスコアの情報を持ってくる
    this.bestTime = Number(localStorage.getItem(Best_Time_Key) || 0);

    //各種クラスをここで初期化
    this.roadView = new RoadView(this);
    this.playerView = new PlayerView(this);
    this.hudView = new HudView(this);
    this.fallingObjectFactory = new FallingObjectFactory(this);

    //入力内容を管理する関数
    this.createInput();
    //スタート画面用の処理
    this.showStartScreen();
  }


  //ゲームプレイ中の進行を行う
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

  //各種入力を処理する
  createInput() {
    this.input.keyboard.on("keydown-LEFT", () => this.handleLaneInput(Lane.Left));
    this.input.keyboard.on("keydown-A", () => this.handleLaneInput(Lane.Left));
    this.input.keyboard.on("keydown-RIGHT", () => this.handleLaneInput(Lane.Right));
    this.input.keyboard.on("keydown-D", () => this.handleLaneInput(Lane.Right));
    this.input.keyboard.on("keydown-SPACE", () => this.handleRestartInput());
  }
  //スタート画面の処理
  showStartScreen() {
    this.gameState = "ready";
    this.playPhases = null;
    this.population = this.getStartPopulation();
    this.phaseIndex = 0;
    this.currentGatePairIndex = 0;
    this.elapsedSeconds = 0;

    this.playerView.resetLane();
    this.playerView.updatePopulation(this.population);
    this.roadView.updateLaneHighlight(this.playerView.getCurrentLane());
    this.hudView.showStartScreen();
    this.updateHud();
  }

  //ゲームの実プレイ中の処理
  startGame() {
    this.hudView.clearOverlay();
    this.clearFallingObject();

    this.gameState = "playing";
    //ゲーム開始時に、今回のプレイで使う全フェーズの数字を先に作る
    //ステージ生成はアイテムで増えた人数を考えず、基本の Start_Population で作る
    this.playPhases = Create_Random_Phases();
    this.population = this.getStartPopulation();
    this.phaseIndex = 0;
    this.currentGatePairIndex = 0;
    this.elapsedSeconds = 0;

    this.playerView.resetLane();
    this.playerView.updatePopulation(this.population);
    this.roadView.updateLaneHighlight(this.playerView.getCurrentLane());

    this.hudView.showCenterMessage("PHASE 1");
    this.spawnNextObject();
    this.updateHud();
  }
  
  //左右入力をもらった時の処理
  handleLaneInput(lane) {
    //まだゲームが始まってなかったらゲームスタート
    //入力も受け付けとく
    if (this.gameState !== "playing") {
      this.startGame();
      this.movePlayerToLane(lane);
      return;
    }
    //左右入力通り動かす
    this.movePlayerToLane(lane);
  }

  //リスタートボタンの処理
  handleRestartInput() {
    if (this.gameState !== "playing") {
      this.startGame();
    }
  }

   //左右移動
  movePlayerToLane(lane) {
    this.playerView.moveToLane(lane);
    this.roadView.updateLaneHighlight(lane);
  }

  spawnNextObject() {
    //もしフェーズの最大値ならゴールを返す
    if (this.phaseIndex >= this.playPhases.length) {
      this.fallingObject = this.fallingObjectFactory.createGoal();
      return;
    }
    //現在のフェーズを取得
    const phase = this.getCurrentPhase();
    this.roadView.setFog(phase.fogAlpha);

    if (this.currentGatePairIndex < phase.gates.length) {
      const gatePair = phase.gates[this.currentGatePairIndex];
      this.fallingObject = this.fallingObjectFactory.createGatePair(gatePair, phase, this.currentGatePairIndex);
      return;
    }

    this.fallingObject = this.fallingObjectFactory.createWall(phase.wallCost);
  }

  //ものを下に流すやつ
  moveFallingObject(delta) {
    if (!this.fallingObject) {
      return;
    }

    const phase = this.getCurrentPhase();
    const distance = phase.speed * (delta / 1000);

    this.fallingObject.y += distance;
    this.fallingObject.container.y = this.fallingObject.y;

    //isAlreadyUsed がないと、同じゲートに当たっている数フレーム分、何度も計算される
    //isAlreadyUsedがtrueの時だけ処理を行う
    if (!this.fallingObject.isAlreadyUsed && this.fallingObject.y >= Player_Y - 38) {
      this.handleFallingObject();
    }

    //十分手前側に流れたら削除し、その後次のイブジェウトを追加する
    if (this.fallingObject.y > Game_Height + 120) {
      this.fallingObject.container.destroy();
      this.fallingObject = null;
      //
      if (this.gameState === "playing") {
        this.spawnNextObject();
      }
    }
  }

  handleFallingObject() {
    // 流れてきたものに当たったときの分岐
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

    const selectedGate = this.getSelectedGate();
    const oldPopulation = this.population;
    this.population = Calculate_Population(this.population, selectedGate);

    this.fallingObjectFactory.markSelectedGate(this.fallingObject, this.playerView.getCurrentLane());
    this.playerView.updatePopulation(this.population);
    this.hudView.showFloatingResult(`${oldPopulation} -> ${this.population}`, this.playerView.getX());

    this.currentGatePairIndex += 1;

    if (this.population <= 0) {
      this.finishGame(false, "人数が0になった");
    }
  }

  getSelectedGate() {
    //今いるレーンのゲートを取り出す処理
    if (this.playerView.getCurrentLane() === Lane.Left) {
      return this.fallingObject.gates[0];
    }

    return this.fallingObject.gates[1];
  }

  //フェーズ最後の壁チェック
  applyWallDamage() {
    this.fallingObject.isAlreadyUsed = true;

    const oldPopulation = this.population;
    this.population -= this.fallingObject.cost;

    this.playerView.updatePopulation(this.population);
    this.hudView.showFloatingResult(`${oldPopulation} -> ${this.population}`, this.playerView.getX());

    //ゲームオーバー時の動き
    //死亡メッセージと一緒に終了を送信
    if (this.population <= 0) {
      this.finishGame(false, "壁を突破できなかった");
      return;
    }

    //フェーズを進める
    this.phaseIndex += 1;
    this.currentGatePairIndex = 0;

    //フェーズ終了時に
    if (this.phaseIndex < this.playPhases.length) {
      this.hudView.showCenterMessage(this.playPhases[this.phaseIndex].name);
    }
  }

  finishGame(didClear, reason) {
    // クリア・ゲームオーバー
    this.gameState = didClear ? "clear" : "gameover";

    if (didClear) {
      this.saveBestTime();
      this.addClearCoins();
      this.saveGameSystemScore();
    }

    this.hudView.showEndScreen(didClear, reason, this.elapsedSeconds, this.population);
    this.updateHud();
  }

  //ベストタイム保存
  saveBestTime() {
    const isFirstClear = this.bestTime === 0;
    const isNewRecord = this.elapsedSeconds < this.bestTime;

    //最初の0で更新し続けないように条件を組む
    if (isFirstClear || isNewRecord) {
      this.bestTime = this.elapsedSeconds;
      localStorage.setItem(Best_Time_Key, String(this.bestTime));
    }
  }

  getStartPopulation() {
    //GameSystem がある時だけ、アイテム効果で初期人数を増やす
    if (
      typeof GameSystem !== "undefined" &&
      typeof GameSystem.hasItem === "function" &&
      GameSystem.hasItem(Start_Plus_Item_Id)
    ) {
      return Start_Population + 1;
    }

    return Start_Population;
  }

  addClearCoins() {
    //クリア報酬として共通コインを100枚追加する
    if (typeof GameSystem !== "undefined" && typeof GameSystem.addCoins === "function") {
      GameSystem.addCoins(100);
    }
  }

  saveGameSystemScore() {
    //タイムが短いほど高いスコアになるようにする
    const currentScore = Math.max(1, Math.floor(100000 - this.elapsedSeconds * 1000));

    if (
      typeof GameSystem !== "undefined" &&
      typeof GameSystem.loadGameData === "function" &&
      typeof GameSystem.saveGameData === "function"
    ) {
      const myData = GameSystem.loadGameData(Game_System_Id) || {};
      myData.highScore = Math.max((myData.highScore || 0), currentScore);
      myData.bestTime = this.bestTime;
      GameSystem.saveGameData(Game_System_Id, myData);
    }
  }


  //基本的に何かしらの内部処理を行ったらこれを呼び出して各種数値の更新を行う
  updateHud() {
    //画面上の数値表示を更新
    const phase = this.getCurrentPhase();
    this.hudView.update(this.population, this.phaseIndex, phase, this.elapsedSeconds, this.bestTime);
  }

  getCurrentPhase() {
    //今のフェーズ設定を取得
    return Get_Phase_By_Index(this.phaseIndex, this.playPhases);
  }

  clearFallingObject() {
    //リトライ時などに古いゲート表示を消す処理
    if (this.fallingObject) {
      this.fallingObject.container.destroy();
      this.fallingObject = null;
    }
  }
}
