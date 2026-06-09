"use strict";

//BGMと効果音のファイル場所をまとめる
const Audio_Files = {
  Home_Bgm: "assets/audio/bgm_home.mp3",
  Play_Bgm: "assets/audio/bgm_play.mp3",
  Start: "assets/audio/start.mp3",
  Gate: "assets/audio/gate.mp3",
  Wall: "assets/audio/wall.mp3",
  Fail: "assets/audio/fail.mp3",
  Clear: "assets/audio/clear.mp3",
};

//ゲーム中の音を管理するクラス
class AudioManager {
  static preload(scene) {
    //普通にフォルダ共有して開く時も止まらないよう、Phaserのロード待ちは使わない
  }

  constructor(scene) {
    this.scene = scene;
    this.delayedHomeBgmEvent = null;
    this.delayedPlayBgmEvent = null;

    this.homeBgm = this.createSound(Audio_Files.Home_Bgm, true, 0.28);
    this.playBgm = this.createSound(Audio_Files.Play_Bgm, true, 0.33);
    this.startSound = this.createSound(Audio_Files.Start, false, 0.75);
    this.gateSound = this.createSound(Audio_Files.Gate, false, 0.55);
    this.wallSound = this.createSound(Audio_Files.Wall, false, 0.7);
    this.failSound = this.createSound(Audio_Files.Fail, false, 0.75);
    this.clearSound = this.createSound(Audio_Files.Clear, false, 0.8);
  }

  createSound(filePath, shouldLoop, volume) {
    const sound = new Audio(filePath);
    sound.loop = shouldLoop;
    sound.volume = volume;
    sound.preload = "auto";
    return sound;
  }

  //プレイ前のBGMを流す
  playHomeBgm() {
    this.cancelDelayedHomeBgm();
    this.stopSound(this.playBgm);
    this.playLoop(this.homeBgm);
  }

  //開始音が終わってからプレイ中BGMを流す
  playStartThenPlayBgm() {
    this.stopAllBgm();
    this.stopEffectSounds();
    this.cancelDelayedPlayBgm();
    this.playEffect(this.startSound);

    const startDuration = Number.isFinite(this.startSound.duration) ? this.startSound.duration : 0.35;
    const startDelay = Math.max(350, startDuration * 1000);
    this.delayedPlayBgmEvent = this.scene.time.delayedCall(startDelay, () => {
      if (this.scene.gameState === "playing") {
        this.playGameBgm();
      }
    });
  }

  playGameBgm() {
    this.stopSound(this.homeBgm);
    this.playLoop(this.playBgm);
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
    this.cancelDelayedHomeBgm();
    this.cancelDelayedPlayBgm();
    this.stopSound(this.homeBgm);
    this.stopSound(this.playBgm);
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
    this.stopSound(sound);
    this.playSound(sound);
  }

  stopEffectSounds() {
    this.stopSound(this.startSound);
    this.stopSound(this.gateSound);
    this.stopSound(this.wallSound);
    this.stopSound(this.failSound);
    this.stopSound(this.clearSound);
  }

  playLoop(sound) {
    if (sound.paused) {
      this.playSound(sound);
    }
  }

  playSound(sound) {
    const playResult = sound.play();

    //自動再生制限などで鳴らせない時も、ゲーム本体は止めない
    if (playResult && typeof playResult.catch === "function") {
      playResult.catch(() => {});
    }
  }

  stopSound(sound) {
    sound.pause();

    try {
      sound.currentTime = 0;
    } catch (error) {
      //読み込み前の音は currentTime を戻せないことがある
    }
  }
}
