"use strict";

// 画面サイズ
const Game_Width = 480;
const Game_Height = 720;

//プレイヤーの高さ
const Player_Y = 590;
//それぞれのレーンの位置
const Left_Lane_X = 145;
const Right_Lane_X = 335;

//初期人数
const Start_Population = 5;
// ベストタイムをブラウザに保存するときの名前
const Best_Time_Key = "simpleGateRunnerBestTime";

// 入力・移動で使うレーン名
const Lane = {
  Left: "left",
  Right: "right",
};


//各フェーズの内容を管理
//ゲートそれぞれの設定をここで変更できる
//決まった問題しか出せないから問題の自動生成も行えるようにしたい
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
    gates: [
      [{ label: "+5", type: "add", value: 5 }, { label: "-2", type: "add", value: -2 }],
      [{ label: "x2", type: "multiply", value: 2 }, { label: "+4", type: "add", value: 4 }],
    ],
  },
  {
    name: "PHASE 2",
    speed: 390,
    fogAlpha: 0.04,
    noiseCount: 0,
    wallCost: 16,
    gates: [
      [{ label: "x3", type: "multiply", value: 3 }, { label: "+8", type: "add", value: 8 }],
      [{ label: "-5", type: "add", value: -5 }, { label: "÷2", type: "divide", value: 2 }],
    ],
  },
  {
    name: "PHASE 3",
    speed: 470,
    fogAlpha: 0.08,
    noiseCount: 1,
    wallCost: 25,
    gates: [
      [{ label: "+14", type: "add", value: 14 }, { label: "x4", type: "multiply", value: 4 }],
      [{ label: "x2", type: "multiply", value: 2 }, { label: "+11", type: "add", value: 11 }],
    ],
  },
  {
    name: "PHASE 4",
    speed: 560,
    fogAlpha: 0.13,
    noiseCount: 2,
    wallCost: 22,
    gates: [
      [{ label: "x5", type: "multiply", value: 5 }, { label: "+32", type: "add", value: 32 }],
      [{ label: "÷3", type: "divide", value: 3 }, { label: "-18", type: "add", value: -18 }],
    ],
  },
  {
    name: "PHASE 5",
    speed: 650,
    fogAlpha: 0.18,
    noiseCount: 3,
    wallCost: 40,
    gates: [
      [{ label: "x7", type: "multiply", value: 7 }, { label: "+28", type: "add", value: 28 }],
      [{ label: "x2", type: "multiply", value: 2 }, { label: "+41", type: "add", value: 41 }],
      [{ label: "÷2", type: "divide", value: 2 }, { label: "-33", type: "add", value: -33 }],
    ],
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
function Get_Phase_By_Index(phaseIndex) {
  return Phases[phaseIndex];
}
