"use strict";

//ゲーム内の座標はこのサイズを基準にする
const Game_Width = 480;
const Game_Height = 720;

//canvasだけを高解像度で描くための倍率
//ゲーム内の座標やスピードは変えず、見た目の細かさだけ上げる
const Canvas_Pixel_Ratio = 3;

//Phaserの文字を高解像度で作る
function Add_Text(scene, x, y, text, style) {
  const textObject = scene.add.text(x, y, text, style);

  //Phaserのバージョンによっては setResolution がないので、ある時だけ使う
  if (typeof textObject.setResolution === "function") {
    textObject.setResolution(Canvas_Pixel_Ratio);
  }

  return textObject;
}

//プレイヤーとレーンの位置
const Player_Y = 590;
const Left_Lane_X = 145;
const Right_Lane_X = 335;

//初期人数と保存に使う名前
const Start_Population = 5;
const Best_Time_Key = "simpleGateRunnerBestTime";
const Time_Attack_Unlocked_Key = "simpleGateRunnerTimeAttackUnlocked";
const Time_Attack_Best_Time_Key = "simpleGateRunnerTimeAttackBestTime";
const Game_System_Id = "lastwar";
const Speed_Down_Item_Id = "l_plus";
const Speed_Down_Per_Item = 0.1;
const Minimum_Speed_Multiplier = 0.1;

// 入力・移動で使うレーン名
const Lane = {
  Left: "left",
  Right: "right",
};

//通常プレイかタイムアタックかを表す値
const Play_Mode = {
  Normal: "normal",
  Time_Attack: "timeAttack",
};

function Get_Play_Mode_Label(playMode) {
  if (playMode === Play_Mode.Time_Attack) {
    return "TIME ATTACK";
  }

  return "NORMAL";
}


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
    gateCount: 5,
    randomLevel: 2,
  },
  {
    name: "PHASE 3",
    speed: 470,
    fogAlpha: 0.08,
    noiseCount: 1,
    gateCount: 5,
    randomLevel: 3,
  },
  {
    name: "PHASE 4",
    speed: 560,
    fogAlpha: 0.13,
    noiseCount: 2,
    gateCount: 5,
    randomLevel: 4,
  },
  {
    name: "PHASE 5",
    speed: 650,
    fogAlpha: 0.18,
    noiseCount: 3,
    gateCount: 5,
    randomLevel: 5,
  },
];

//ゲートを通った後の人数を計算する。マイナスゲートは負の数を足す形で扱う
function Calculate_Population(currentPopulation, gate) {
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
