"use strict";

//BGMと効果音の読み込み名をまとめる
const Audio_Keys = {
  Home_Bgm: "homeBgm",
  Play_Bgm: "playBgm",
  Start: "startSound",
  Gate: "gateSound",
  Wall: "wallSound",
  Fail: "failSound",
  Clear: "clearSound",
};

//ゲーム中の音を管理するクラス
class AudioManager {
  static preload(scene) {
    scene.load.audio(Audio_Keys.Home_Bgm, "assets/audio/bgm_home.mp3");
    scene.load.audio(Audio_Keys.Play_Bgm, "assets/audio/bgm_play.mp3");
    scene.load.audio(Audio_Keys.Start, "assets/audio/start.mp3");
    scene.load.audio(Audio_Keys.Gate, "assets/audio/gate.mp3");
    scene.load.audio(Audio_Keys.Wall, "assets/audio/wall.mp3");
    scene.load.audio(Audio_Keys.Fail, "assets/audio/fail.mp3");
    scene.load.audio(Audio_Keys.Clear, "assets/audio/clear.mp3");
  }

  constructor(scene) {
    this.scene = scene;
    this.delayedHomeBgmEvent = null;
    this.delayedPlayBgmEvent = null;
    this.shouldPlayHomeWhenUnlocked = false;

    this.homeBgm = scene.sound.add(Audio_Keys.Home_Bgm, { loop: true, volume: 0.28 });
    this.playBgm = scene.sound.add(Audio_Keys.Play_Bgm, { loop: true, volume: 0.33 });
    this.startSound = scene.sound.add(Audio_Keys.Start, { volume: 0.75 });
    this.gateSound = scene.sound.add(Audio_Keys.Gate, { volume: 0.55 });
    this.wallSound = scene.sound.add(Audio_Keys.Wall, { volume: 0.7 });
    this.failSound = scene.sound.add(Audio_Keys.Fail, { volume: 0.75 });
    this.clearSound = scene.sound.add(Audio_Keys.Clear, { volume: 0.8 });

    //ブラウザの自動再生制限で、最初の入力まで音を鳴らせない場合に備える
    if (scene.sound.locked) {
      scene.sound.once("unlocked", () => {
        if (this.shouldPlayHomeWhenUnlocked && this.scene.gameState === "ready") {
          this.playHomeBgm();
        }
      });
    }
  }

  //プレイ前のBGMを流す
  playHomeBgm() {
    this.cancelDelayedHomeBgm();

    if (this.scene.sound.locked) {
      this.shouldPlayHomeWhenUnlocked = true;
      return;
    }

    this.shouldPlayHomeWhenUnlocked = false;
    this.playBgm.stop();

    if (!this.homeBgm.isPlaying) {
      this.homeBgm.play();
    }
  }

  //開始音が終わってからプレイ中BGMを流す
  playStartThenPlayBgm() {
    this.stopAllBgm();
    this.stopEffectSounds();
    this.cancelDelayedPlayBgm();
    this.playEffect(this.startSound);

    const startDuration = Number(this.startSound.duration) || 0.35;
    const startDelay = Math.max(350, startDuration * 1000);
    this.delayedPlayBgmEvent = this.scene.time.delayedCall(startDelay, () => {
      if (this.scene.gameState === "playing") {
        this.playGameBgm();
      }
    });
  }

  playGameBgm() {
    this.homeBgm.stop();

    if (!this.playBgm.isPlaying) {
      this.playBgm.play();
    }
  }

  playGate() {
    this.playEffect(this.gateSound);
  }

  playWall() {
    this.playEffect(this.wallSound);
  }

  //クリア・失敗時はBGMをすぐ止めて、結果音だけ鳴らす
  playEndSound(didClear) {
    this.stopAllBgm();
    this.stopEffectSounds();

    if (didClear) {
      this.playEffect(this.clearSound);
      return;
    }

    this.playEffect(this.failSound);
    this.startHomeBgmAfterGameOver();
  }

  //ゲームオーバー画面では少し待ってからプレイ前BGMを戻す
  startHomeBgmAfterGameOver() {
    this.cancelDelayedHomeBgm();
    this.delayedHomeBgmEvent = this.scene.time.delayedCall(10000, () => {
      if (this.scene.gameState === "gameover") {
        this.playHomeBgm();
      }
    });
  }

  stopAllBgm() {
    this.shouldPlayHomeWhenUnlocked = false;
    this.cancelDelayedHomeBgm();
    this.cancelDelayedPlayBgm();
    this.homeBgm.stop();
    this.playBgm.stop();
  }

  cancelDelayedHomeBgm() {
    if (this.delayedHomeBgmEvent) {
      this.delayedHomeBgmEvent.remove(false);
      this.delayedHomeBgmEvent = null;
    }
  }

  cancelDelayedPlayBgm() {
    if (this.delayedPlayBgmEvent) {
      this.delayedPlayBgmEvent.remove(false);
      this.delayedPlayBgmEvent = null;
    }
  }

  playEffect(sound) {
    if (sound.isPlaying) {
      sound.stop();
    }

    sound.play();
  }

  stopEffectSounds() {
    this.startSound.stop();
    this.gateSound.stop();
    this.wallSound.stop();
    this.failSound.stop();
    this.clearSound.stop();
  }
}
