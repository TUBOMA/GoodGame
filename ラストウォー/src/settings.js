"use strict";

//ゲーム内で使う画面サイズ
//座標はこの 480 x 720 の中で考える
const Game_Width = 480;
const Game_Height = 720;

//canvasだけを高解像度で描くための倍率
//ゲーム内の座標やスピードは変えず、見た目の細かさだけ上げる
const Canvas_Pixel_Ratio = 3;
const Canvas_Width = Game_Width * Canvas_Pixel_Ratio;
const Canvas_Height = Game_Height * Canvas_Pixel_Ratio;

//文字を高解像度で作るための共通関数
function Add_Text(scene, x, y, text, style) {
  const textObject = scene.add.text(x, y, text, style);

  //Phaserのバージョンによっては setResolution がないので、ある時だけ使う
  if (typeof textObject.setResolution === "function") {
    textObject.setResolution(Canvas_Pixel_Ratio);
  }

  return textObject;
}

//プレイヤーの高さ
const Player_Y = 590;
//それぞれのレーンの位置
const Left_Lane_X = 145;
const Right_Lane_X = 335;

//初期人数
const Start_Population = 5;
// ベストタイムをブラウザに保存するときの名前
const Best_Time_Key = "simpleGateRunnerBestTime";
//共通ゲームシステムで使う、このゲームのID
const Game_System_Id = "lastwar";
//最初の人数を1人増やすアイテムのID
const Start_Plus_Item_Id = "l_plus";

// 入力・移動で使うレーン名
const Lane = {
  Left: "left",
  Right: "right",
};


//各フェーズの内容を管理
//速度や霧など、計算問題以外の難易度はここで固定する
//実際に出るゲートの数字は GateGenerator.js で毎プレイ作る
const Phases = [
  {
    //呼び出す時の名前
    name: "PHASE 1",
    //流れる速度
    speed: 320,
    //視界を邪魔する効果の程度
    fogAlpha: 0,
    //ノイズの程度
    noiseCount: 0,
    //フェーズを超える時に減らされる人数
    wallCost: 12,
    //このフェーズ内で何組のゲートを出すか
    gateCount: 5,
    //ランダム生成する計算問題の難しさ
    randomLevel: 1,
  },
  {
    name: "PHASE 2",
    speed: 390,
    fogAlpha: 0.04,
    noiseCount: 0,
    wallCost: 16,
    gateCount: 5,
    randomLevel: 2,
  },
  {
    name: "PHASE 3",
    speed: 470,
    fogAlpha: 0.08,
    noiseCount: 1,
    wallCost: 25,
    gateCount: 5,
    randomLevel: 3,
  },
  {
    name: "PHASE 4",
    speed: 560,
    fogAlpha: 0.13,
    noiseCount: 2,
    wallCost: 22,
    gateCount: 5,
    randomLevel: 4,
  },
  {
    name: "PHASE 5",
    speed: 650,
    fogAlpha: 0.18,
    noiseCount: 3,
    wallCost: 40,
    gateCount: 5,
    randomLevel: 5,
  },
];

// ゲートに入ったときの人数計算
//もし人がゲートを通ったらの処理
function Calculate_Population(currentPopulation, gate) {
  //ゲートの種類によって計算を変える
  if (gate.type === "add") {
    return currentPopulation + gate.value;
  }
  if (gate.type === "multiply") {
    return currentPopulation * gate.value;
  }
  if (gate.type === "divide") {
    return Math.floor(currentPopulation / gate.value);
  }
  return currentPopulation;
}

//今のフェーズ設定を取り出す処理
//配列から取り出す処理をわざわざ関数を使ってやる必要があるのかはわからない
function Get_Phase_By_Index(phaseIndex, phaseList) {
  const targetPhases = phaseList || Phases;
  const safePhaseIndex = Math.min(phaseIndex, targetPhases.length - 1);
  return targetPhases[safePhaseIndex];
}
