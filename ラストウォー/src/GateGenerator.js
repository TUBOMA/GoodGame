"use strict";

//ランダムなゲート問題を作るファイル
//速度・霧・壁などは settings.js の Phases をそのまま使い、gates だけ毎プレイ作る
const Max_Phase_Create_Try_Count = 200;

function Create_Random_Phases() {
  const randomPhases = [];
  //ステージ作成は基本の初期人数だけを使う
  //将来、初期人数ボーナスを追加しても、ここではその増加分を考えない
  let expectedPopulation = Start_Population;

  for (const phaseSetting of Phases) {
    const phase = Create_One_Strict_Phase(phaseSetting, expectedPopulation);
    randomPhases.push(phase);
    //各フェーズは「正解ルートなら壁を越えて1人残る」前提で次を作る
    expectedPopulation = 1;
  }

  return randomPhases;
}

function Create_One_Strict_Phase(phaseSetting, startPopulation) {
  for (let tryCount = 0; tryCount < Max_Phase_Create_Try_Count; tryCount += 1) {
    const phase = Create_One_Phase_Once(phaseSetting, startPopulation);

    if (Set_Phase_Wall_For_One_Person_Clear(phase, startPopulation)) {
      return phase;
    }
  }

  //設定を変えた結果、条件を満たす問題を作れない場合に気づけるようにする
  throw new Error(`${phaseSetting.name} の問題生成に失敗しました`);
}

//主なゲート生成の場所
function Create_One_Phase_Once(phaseSetting, startPopulation) {
  const phase = Copy_Phase_Setting(phaseSetting);
  phase.gates = [];
  let expectedPopulation = startPopulation;

  for (let i = 0; i < phase.gateCount; i += 1) {
    const gatePair = Make_Gate_Pair(phase.randomLevel, expectedPopulation);

    phase.gates.push(gatePair);
    expectedPopulation = Get_Better_Result(expectedPopulation, gatePair);
  }

  return phase;
}

function Set_Phase_Wall_For_One_Person_Clear(phase, startPopulation) {
  const populations = Get_Phase_Populations_Before_Wall(phase, startPopulation);

  if (populations.length === 0) {
    return false;
  }

  const bestPopulation = Math.max(...populations);
  const bestRouteCount = populations.filter((population) => population === bestPopulation).length;

  //最善ルートが複数あると「正解以外でもクリア」になってしまうので作り直す
  if (bestPopulation <= 1 || bestRouteCount !== 1) {
    return false;
  }

  //このフェーズの壁で、最善ルートだけがちょうど1人残るようにする
  phase.wallCost = bestPopulation - 1;
  return true;
}

function Get_Phase_Populations_Before_Wall(phase, startPopulation) {
  //全ルートを試すため、人数の候補を配列で持つ
  //同じ人数が複数あっても「別ルート」として数えたいので、重複は消さない
  let populations = [startPopulation];

  for (const gatePair of phase.gates) {
    populations = Get_Populations_After_Gate_Pair(populations, gatePair);
  }

  return populations;
}

function Get_Populations_After_Gate_Pair(populations, gatePair) {
  const nextPopulations = [];

  for (const population of populations) {
    for (const gate of gatePair) {
      const nextPopulation = Calculate_Population(population, gate);

      if (nextPopulation > 0) {
        nextPopulations.push(nextPopulation);
      }
    }
  }

  return nextPopulations;
}

function Copy_Phase_Setting(phaseSetting) {
  return {
    name: phaseSetting.name,
    speed: phaseSetting.speed,
    fogAlpha: phaseSetting.fogAlpha,
    noiseCount: phaseSetting.noiseCount,
    wallCost: phaseSetting.wallCost,
    gateCount: phaseSetting.gateCount,
    randomLevel: phaseSetting.randomLevel,
  };
}

function Make_Gate_Pair(randomLevel, currentPopulation) {
  //ぱっと見で判断しにくい組み合わせを多めに作る
  if (Math.random() < Get_Thinking_Gate_Chance(randomLevel)) {
    return Make_Thinking_Gate_Pair(randomLevel, currentPopulation);
  }

  const firstGate = Make_Random_Gate(randomLevel);
  let secondGate = Make_Random_Gate(randomLevel);

  //完全に同じ表示が並ぶと選択問題として弱いので、もう一度作り直す
  for (let tryCount = 0; tryCount < 3 && firstGate.label === secondGate.label; tryCount += 1) {
    secondGate = Make_Random_Gate(randomLevel);
  }

  const gatePair = Shuffle_Gates([firstGate, secondGate]);
  return Fix_Gate_Pair_If_Needed(gatePair, randomLevel, currentPopulation);
}

function Get_Thinking_Gate_Chance(randomLevel) {
  if (randomLevel === 1) {
    return 0.7;
  }

  return 0.85;
}

function Make_Thinking_Gate_Pair(randomLevel, currentPopulation) {
  const pairTypes = ["addMultiply", "addMultiply"];

  //人数が少ない時に - と ÷ を出すとすぐ0になりやすいので、少し増えてから出す
  if (randomLevel >= 2 && currentPopulation >= 4) {
    pairTypes.push("subtractDivide");
    pairTypes.push("subtractDivide");
    pairTypes.push("subtractDivide");
  }

  const pairType = Pick_Random(pairTypes);

  if (pairType === "subtractDivide") {
    return Make_Subtract_Divide_Gate_Pair(randomLevel, currentPopulation);
  }

  return Make_Add_Multiply_Gate_Pair(randomLevel, currentPopulation);
}

function Make_Add_Multiply_Gate_Pair(randomLevel, currentPopulation) {
  const multiplyValue = Random_Int(2, Math.min(5, 2 + randomLevel));
  let addValue = currentPopulation * multiplyValue - currentPopulation;
  let adjustment = Random_Int(-randomLevel - 1, randomLevel + 1);

  if (adjustment === 0) {
    adjustment = Pick_Random([-1, 1]);
  }

  //足し算した結果と掛け算した結果が近くなるように、少しだけずらす
  addValue += adjustment;
  addValue = Math.max(1, addValue);

  let addGate = Make_Add_Gate(addValue);
  const multiplyGate = Make_Multiply_Gate(multiplyValue);

  if (Calculate_Population(currentPopulation, addGate) === Calculate_Population(currentPopulation, multiplyGate)) {
    addGate = Make_Add_Gate(addValue + 1);
  }

  return Shuffle_Gates([addGate, multiplyGate]);
}

function Make_Subtract_Divide_Gate_Pair(randomLevel, currentPopulation) {
  const divideValue = Random_Int(2, Math.min(4, randomLevel));
  const divideResult = Math.floor(currentPopulation / divideValue);
  let subtractValue = currentPopulation - divideResult;

  //引き算した結果と割り算した結果が近くなるように、少しだけずらす
  subtractValue += Random_Int(-randomLevel, randomLevel);
  subtractValue = Math.max(1, Math.min(currentPopulation - 1, subtractValue));

  let subtractGate = Make_Add_Gate(-subtractValue);
  const divideGate = Make_Divide_Gate(divideValue);

  if (Calculate_Population(currentPopulation, subtractGate) === Calculate_Population(currentPopulation, divideGate)) {
    subtractGate = Make_Add_Gate(-(subtractValue - 1));
  }

  return Shuffle_Gates([subtractGate, divideGate]);
}

function Make_Random_Gate(randomLevel) {
  const gateTypes = Get_Gate_Types(randomLevel);
  const gateType = Pick_Random(gateTypes);

  if (gateType === "addGood") {
    return Make_Add_Gate(Random_Int(3 + randomLevel * 2, 8 + randomLevel * 8));
  }

  if (gateType === "addBad") {
    return Make_Add_Gate(-Random_Int(1 + randomLevel, 4 + randomLevel * 5));
  }

  if (gateType === "multiply") {
    return Make_Multiply_Gate(Random_Int(2, 2 + randomLevel));
  }

  if (gateType === "divide") {
    return Make_Divide_Gate(Random_Int(2, Math.min(4, randomLevel)));
  }

  //二桁足し算。後半フェーズで判断を少し難しくする
  return Make_Add_Gate(Random_Int(12, 18 + randomLevel * 10));
}

function Get_Gate_Types(randomLevel) {
  if (randomLevel === 1) {
    return ["addGood", "addGood", "addBad"];
  }

  if (randomLevel === 2) {
    return ["addGood", "addBig", "multiply", "addBad"];
  }

  if (randomLevel === 3) {
    return ["addBig", "multiply", "multiply", "divide", "addBad"];
  }

  if (randomLevel === 4) {
    return ["addBig", "multiply", "multiply", "divide", "addBad", "addBad"];
  }

  return ["addBig", "multiply", "multiply", "multiply", "divide", "addBad", "addBad"];
}

function Fix_Gate_Pair_If_Needed(gatePair, randomLevel, currentPopulation) {
  const betterResult = Get_Better_Result(currentPopulation, gatePair);

  //どちらを選んでも人数が増えない問題だと、ランダム運だけで詰むので補正する
  if (betterResult > currentPopulation) {
    return gatePair;
  }

  const supportGate = Make_Add_Gate(Random_Int(3 + randomLevel * 2, 8 + randomLevel * 8));
  gatePair[0] = supportGate;
  return Shuffle_Gates(gatePair);
}

function Get_Better_Result(currentPopulation, gatePair) {
  const leftResult = Calculate_Population(currentPopulation, gatePair[0]);
  const rightResult = Calculate_Population(currentPopulation, gatePair[1]);
  return Math.max(leftResult, rightResult);
}

function Make_Add_Gate(value) {
  const label = value >= 0 ? `+${value}` : `${value}`;
  return { label, type: "add", value };
}

function Make_Multiply_Gate(value) {
  return { label: `x${value}`, type: "multiply", value };
}

function Make_Divide_Gate(value) {
  return { label: `÷${value}`, type: "divide", value };
}

function Shuffle_Gates(gates) {
  if (Math.random() < 0.5) {
    return [gates[1], gates[0]];
  }

  return gates;
}

function Pick_Random(items) {
  const index = Random_Int(0, items.length - 1);
  return items[index];
}

function Random_Int(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
