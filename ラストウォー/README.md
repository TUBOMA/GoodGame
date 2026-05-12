# Simple Gate Runner Phaser

Phaser 3 で作った、左右操作だけのゲート選択ランナーです。

## 動かし方

このフォルダで簡易サーバーを起動します。

```bash
python3 -m http.server 4173
```

ブラウザで開きます。

```text
http://localhost:4173
```

## 操作

- PC: 左右キー、または A / D
- 開始・クリア後・失敗後: Space

## 読む順番

1. `index.html`
   - どの JavaScript ファイルを、どの順番で読むかが書いてあります。
2. `main.js`
   - Phaser を起動する入口です。
3. `src/settings.js`
   - ゲームの数字、レーン、フェーズ、人数計算などの小さなルール関数があります。
4. `src/RunnerScene.js`
   - ゲーム全体の流れです。まずここを読むのがおすすめです。
5. `src/PlayerView.js`
   - プレイヤーの表示と左右移動です。
6. `src/RoadView.js`
   - 道路、レーンのハイライト、霧、流れる線です。
7. `src/HudView.js`
   - 人数、フェーズ、時間、開始/終了画面です。
8. `src/FallingObjectFactory.js`
   - 落ちてくるゲート、壁、ゴールを作る見た目担当のクラスです。

`RunnerScene` の中では、特に `startGame`、`spawnNextObject`、`applySelectedGate`、`applyWallDamage` を読むとゲームの流れがつかみやすいです。`spawnNextObject` には「ゲートが終わったら壁、全フェーズ後はゴール」という大事な進行ルールがあります。
