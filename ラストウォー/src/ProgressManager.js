"use strict";

//セーブ、アイテム、報酬、実績などプレイ結果の保存を管理するクラス
class ProgressManager {
  constructor() {
    this.bestTime = Number(localStorage.getItem(Best_Time_Key) || 0);
    this.timeAttackBestTime = Number(localStorage.getItem(Time_Attack_Best_Time_Key) || 0);
    this.isTimeAttackUnlocked = localStorage.getItem(Time_Attack_Unlocked_Key) === "true";

    //以前に通常モードをクリアしているデータでも、タイムアタックを遊べるようにする
    if (this.bestTime > 0) {
      this.unlockTimeAttack();
    }
  }

  getStartPopulation() {
    return Start_Population;
  }

  getSpeedMultiplier() {
    if (
      typeof GameSystem !== "undefined" &&
      typeof GameSystem.hasItem === "function" &&
      typeof GameSystem.getItemCount === "function" &&
      GameSystem.hasItem(Speed_Down_Item_Id)
    ) {
      const itemCount = Math.max(0, Number(GameSystem.getItemCount(Speed_Down_Item_Id)) || 0);
      return Math.max(Minimum_Speed_Multiplier, 1 - itemCount * Speed_Down_Per_Item);
    }

    return 1;
  }

  getBestTime(playMode) {
    return playMode === Play_Mode.Time_Attack ? this.timeAttackBestTime : this.bestTime;
  }

  //ゲームを開始した時に、プレイ回数と初期人数の実績を確認する
  recordPlay(initialPopulation) {
    const data = this.loadGameData();

    if (!data) {
      return;
    }

    data.playCount = (data.playCount || 0) + 1;
    this.saveGameData(data);
    this.unlockAtCounts(data.playCount, [
      { count: 1, id: "achieve_l_play_1" },
      { count: 10, id: "achieve_l_play_10" },
      { count: 100, id: "achieve_l_play_100" },
    ]);

    if (initialPopulation >= 10) {
      this.unlockOnce("achieve_l_initial_10");
    }
  }

  //ゲーム終了時の回数記録と、クリア時の報酬・ベストタイムを保存する
  recordResult(didClear, elapsedSeconds, playMode) {
    const didUnlockTimeAttack = didClear && !this.isTimeAttackUnlocked;
    const data = this.loadGameData();

    if (data) {
      if (didClear) {
        data.clearCount = (data.clearCount || 0) + 1;
        data.clearStreak = (data.clearStreak || 0) + 1;
        this.saveGameData(data);

        this.unlockAtCounts(data.clearCount, [
          { count: 1, id: "achieve_l_clear_1" },
          { count: 10, id: "achieve_l_clear_10" },
          { count: 100, id: "achieve_l_clear_100" },
        ]);

        if (data.clearStreak >= 3) {
          this.unlockOnce("achieve_l_clear_streak_3");
        }
      } else {
        data.clearStreak = 0;
        this.saveGameData(data);
      }
    }

    if (didClear) {
      this.saveClearResult(elapsedSeconds, playMode);
    }

    return didUnlockTimeAttack;
  }

  addPhaseReward(phaseIndex) {
    GameSystem.addCoins(phaseIndex * 10 + 10);
  }

  saveClearResult(elapsedSeconds, playMode) {
    const oldBestTime = this.getBestTime(playMode);

    if (oldBestTime === 0 || elapsedSeconds < oldBestTime) {
      if (playMode === Play_Mode.Time_Attack) {
        this.timeAttackBestTime = elapsedSeconds;
        localStorage.setItem(Time_Attack_Best_Time_Key, String(elapsedSeconds));
      } else {
        this.bestTime = elapsedSeconds;
        localStorage.setItem(Best_Time_Key, String(elapsedSeconds));
      }
    }

    this.unlockTimeAttack();

    if (typeof GameSystem !== "undefined" && typeof GameSystem.addCoins === "function") {
      GameSystem.addCoins(100);
    }

    const data = this.loadGameData();
    if (data) {
      const currentScore = Math.max(1, Math.floor(100000 - elapsedSeconds * 1000));
      data.highScore = Math.max((data.highScore || 0), currentScore);
      data.bestTime = this.bestTime;
      data.timeAttackBestTime = this.timeAttackBestTime;
      this.saveGameData(data);
    }
  }

  unlockTimeAttack() {
    this.isTimeAttackUnlocked = true;
    localStorage.setItem(Time_Attack_Unlocked_Key, "true");
  }

  unlockAtCounts(currentCount, achievements) {
    for (const achievement of achievements) {
      if (currentCount >= achievement.count) {
        this.unlockOnce(achievement.id);
      }
    }
  }

  unlockOnce(achievementId) {
    if (
      typeof GameSystem === "undefined" ||
      typeof GameSystem.unlockAchievement !== "function"
    ) {
      return;
    }

    if (
      typeof GameSystem.hasAchievement === "function" &&
      GameSystem.hasAchievement(achievementId)
    ) {
      return;
    }

    GameSystem.unlockAchievement(achievementId);
  }

  loadGameData() {
    if (
      typeof GameSystem === "undefined" ||
      typeof GameSystem.loadGameData !== "function" ||
      typeof GameSystem.saveGameData !== "function"
    ) {
      return null;
    }

    return GameSystem.loadGameData(Game_System_Id) || {};
  }

  saveGameData(data) {
    GameSystem.saveGameData(Game_System_Id, data);
  }
}
