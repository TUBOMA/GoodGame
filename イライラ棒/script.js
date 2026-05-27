// HTMLからゲームで使う要素を取得します。
const gameArea = document.getElementById("gameArea");
const startZone = document.getElementById("startZone");
const goalZone = document.getElementById("goalZone");
const cursor = document.getElementById("cursor");
const scoreText = document.getElementById("score");
const timeText = document.getElementById("time");
const bestTimeText = document.getElementById("bestTime");
const restartButton = document.getElementById("restartButton");

// ゲーム全体の状態を保存する変数です。
let score = 0;
let startTime = 0;
let currentElapsedTime = 0;
let bestRecord = null;
let isTimerRunning = false;
let isPlaying = false;
let isGameClear = false;
let resizeTimer = 0;
let animationId = 0;
let lastFrameTime = 0;
let playerX = 0;
let playerY = 0;
let playerRect = null;
const pressedKeys = new Set();
const playerSpeed = 210;
const playerRadius = 11;
const playerHitRadius = 10;

// WASDと矢印キーを、同じ方向名に変換します。
const keyMap = {
  w: "up",
  arrowup: "up",
  s: "down",
  arrowdown: "down",
  a: "left",
  arrowleft: "left",
  d: "right",
  arrowright: "right"
};

// --- 追加機能：セーブデータの読み込み ---
function loadGameData() {
  if (typeof GameSystem !== "undefined") {
    let savedData = GameSystem.loadGameData('irairabou');
    if (savedData && savedData.highScore && savedData.highScore < 9999) {
      bestRecord = savedData.highScore;
      bestTimeText.textContent = bestRecord.toFixed(2);
    }
  }
}

// --- 追加機能：セーブデータの保存 ---
function saveirairabouResult(currentScore, isCleared) {
  if (typeof GameSystem !== "undefined") {
    let myData = GameSystem.loadGameData('irairabou');
    if (!myData) { myData = { highScore: 9999, clearCount: 0 }; }
    
    if (currentScore < myData.highScore) {
      myData.highScore = currentScore;
    }
    if (isCleared) {
      myData.clearCount = (myData.clearCount || 0) + 1;
    }
    GameSystem.saveGameData('irairabou', myData);
  }
}

// GameSystemが読み込まれている時だけ、指定した数のコインを追加します。
function gainCoins(amount) {
  if (typeof GameSystem !== "undefined") {
    GameSystem.addCoins(amount);
  }
}

// 障害物を消すアイテムの所持数を取得します（安全性を強化）
function getHazardRemovalCount() {
  if (typeof GameSystem === "undefined") {
    return 0;
  }

  if (typeof GameSystem.getItemCount === "function") {
    return GameSystem.getItemCount("i_bougai_ikkokesu");
  }

  if (typeof GameSystem.hasItem === "function" && GameSystem.hasItem("i_bougai_ikkokesu")) {
    return 1;
  }

  return 0;
}

function cellKey(column, row) {
  return `${column},${row}`;
}

// 配列の順番をランダムに入れ替えます。コースや障害物のランダム生成で使います。
function shuffle(items) {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }

  return shuffled;
}

function addOpenCell(openCells, column, row, columns, rows) {
  if (column >= 0 && column < columns && row >= 0 && row < rows) {
    openCells.add(cellKey(column, row));
  }
}

// 大きめのマスでランダムな一本道を作ります。
function tryMakeCoarsePath(coarseColumns, coarseRows) {
  const goal = { column: coarseColumns - 1, row: coarseRows - 1 };
  const startCell = { column: 0, row: 0 };
  const stack = [startCell];
  const visited = new Set([cellKey(startCell.column, startCell.row)]);
  const directions = [
    { column: 1, row: 0 },
    { column: -1, row: 0 },
    { column: 0, row: 1 },
    { column: 0, row: -1 }
  ];

  while (stack.length > 0) {
    const current = stack[stack.length - 1];

    if (current.column === goal.column && current.row === goal.row) {
      return stack;
    }

    const candidates = shuffle(directions)
      .map((direction) => ({
        column: current.column + direction.column,
        row: current.row + direction.row
      }))
      .filter((next) => (
        next.column >= 0 &&
        next.column < coarseColumns &&
        next.row >= 0 &&
        next.row < coarseRows &&
        !visited.has(cellKey(next.column, next.row))
      ));

    if (candidates.length === 0) {
      stack.pop();
      continue;
    }

    const next = candidates[0];
    visited.add(cellKey(next.column, next.row));
    stack.push(next);
  }

  return null;
}

// ランダム生成に失敗した時用の予備ルートです。
function makeFallbackCoarsePath(coarseColumns, coarseRows) {
  const path = [];

  for (let row = 0; row < coarseRows; row += 1) {
    if (row % 2 === 0) {
      for (let column = 0; column < coarseColumns; column += 1) {
        path.push({ column, row });
      }
    } else {
      for (let column = coarseColumns - 1; column >= 0; column -= 1) {
        path.push({ column, row });
      }
    }
  }

  return path;
}

// 大きめのマスで道を、実際のゲーム画面のマス位置に変換します。
function coarseToActual(cell, columns, rows) {
  return {
    column: Math.min(columns - 1, cell.column * 2),
    row: Math.max(0, rows - 1 - cell.row * 2)
  };
}

// 現在地から目的地まで、1マスずつ直線で道をつなぎます。
function addLineToPath(path, target) {
  const last = path[path.length - 1];
  let column = last.column;
  let row = last.row;

  while (column !== target.column || row !== target.row) {
    if (column !== target.column) {
      column += Math.sign(target.column - column);
    } else {
      row += Math.sign(target.row - row);
    }

    path.push({ column, row });
  }
}

// 大きめの道データを、実際に壁を置くための1マス幅の道データに変換します。
function makeActualPath(coarsePath, columns, rows) {
  const path = [coarseToActual(coarsePath[0], columns, rows)];

  coarsePath.slice(1).forEach((cell) => {
    addLineToPath(path, coarseToActual(cell, columns, rows));
  });

  addLineToPath(path, { column: columns - 1, row: 0 });

  return path;
}

// 複数回ランダム生成して、長すぎない一本道を採用します。
function makePath(columns, rows) {
  const coarseColumns = Math.ceil(columns / 2);
  const coarseRows = Math.ceil(rows / 2);
  let selectedPath = null;
  const targetLength = Math.round((coarseColumns + coarseRows) * 1.9);

  for (let attempt = 0; attempt < 160; attempt += 1) {
    const coarsePath = tryMakeCoarsePath(coarseColumns, coarseRows);

    if (!coarsePath) {
      continue;
    }

    if (!selectedPath || Math.abs(coarsePath.length - targetLength) < Math.abs(selectedPath.length - targetLength)) {
      selectedPath = coarsePath;
    }
  }

  return makeActualPath(selectedPath || makeFallbackCoarsePath(coarseColumns, coarseRows), columns, rows);
}

// STARTやGOALを配置します。（枠サイズ拡大と中央配置）
// STARTやGOALを配置します。（枠サイズ拡大と中央配置）
function placeZone(zone, column, row, cellWidth, cellHeight, areaHeight) {
  const padding = 8;
  // 枠のサイズをセル幅に合わせて調整（最小48px）
  const width = Math.max(48, cellWidth - padding * 2);
  const height = Math.max(48, cellHeight - padding * 2);
  
  // マスの中央に配置するための計算
  const left = column * cellWidth + (cellWidth - width) / 2;
  const top = row * cellHeight + (cellHeight - height) / 2;

  zone.style.width = `${width}px`;
  zone.style.height = `${height}px`;
  zone.style.left = `${left}px`;
  zone.style.top = `${top}px`;
  
 // 枠が小さいときは小さく、大きいときは最大1remまで拡大します
 zone.style.fontSize = `${Math.min(0.75, width / 75)}rem`;
  
 // 文字を完璧に中央寄せするための設定を追加
 zone.style.display = "flex";
 zone.style.alignItems = "center";
 zone.style.justifyContent = "center";
 zone.style.textAlign = "center";
}

// コース全体を作り直します。壁を置きます。
function generateCourse() {
  const oldObstacles = gameArea.querySelectorAll(".wall, .hazard");

  oldObstacles.forEach((obstacle) => {
    obstacle.remove();
  });

  const areaWidth = gameArea.clientWidth;
  const areaHeight = gameArea.clientHeight;
  const columns = areaWidth < 420 ? 8 : 10;
  const rows = areaHeight < 560 ? 10 : 12;
  const cellWidth = areaWidth / columns;
  const cellHeight = areaHeight / rows;
  const pathCells = makePath(columns, rows);
  const openCells = new Set();

  pathCells.forEach((cell) => {
    addOpenCell(openCells, cell.column, cell.row, columns, rows);
  });

  placeZone(startZone, 0, rows - 1, cellWidth, cellHeight, areaHeight);
  placeZone(goalZone, columns - 1, 0, cellWidth, cellHeight, areaHeight);

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      if (openCells.has(cellKey(column, row))) {
        continue;
      }

      const wall = document.createElement("div");
      wall.className = "wall";
      wall.style.left = `${column * cellWidth}px`;
      wall.style.top = `${row * cellHeight}px`;
      wall.style.width = `${cellWidth + 1}px`;
      wall.style.height = `${cellHeight + 1}px`;
      gameArea.appendChild(wall);
    }
  }

  addHazards(pathCells, cellWidth, cellHeight);
  resetPlayerToStart();
}

function getPathDirection(pathCells, index) {
  const previous = pathCells[index - 1];
  const next = pathCells[index + 1];

  if (!previous || !next) {
    return "horizontal";
  }

  if (previous.row === next.row) {
    return "horizontal";
  }

  if (previous.column === next.column) {
    return "vertical";
  }

  return "corner";
}

function isStraightPathCell(pathCells, index) {
  const previous = pathCells[index - 1];
  const current = pathCells[index];
  const next = pathCells[index + 1];

  if (!previous || !current || !next) {
    return false;
  }

  return (
    previous.row === current.row &&
    current.row === next.row
  ) || (
    previous.column === current.column &&
    current.column === next.column
  );
}

function isNextToHazard(cell, selectedCells) {
  return selectedCells.some((selected) => {
    const columnDistance = Math.abs(cell.column - selected.column);
    const rowDistance = Math.abs(cell.row - selected.row);

    return columnDistance + rowDistance <= 1;
  });
}

function addHazards(pathCells, cellWidth, cellHeight) {
  const baseHazardCount = 6;
  const hazardCount = Math.max(0, baseHazardCount - getHazardRemovalCount());

  if (hazardCount === 0) return;

  const candidateCells = pathCells
    .map((cell, index) => ({ ...cell, index }))
    .slice(4, -4)
    .filter((cell) => isStraightPathCell(pathCells, cell.index));

  const selectedHazards = [];
  const shuffledCandidates = shuffle(candidateCells);

  for (const cell of shuffledCandidates) {
    if (selectedHazards.length >= hazardCount) break;

    if (!isNextToHazard(cell, selectedHazards)) {
      selectedHazards.push(cell);
    }
  }

  selectedHazards.forEach((cell, index) => {
    const size = Math.max(22, Math.min(32, Math.min(cellWidth, cellHeight) * 0.37));
    const hazard = document.createElement("div");
    const pathDirection = getPathDirection(pathCells, cell.index);
    const cutterDirection = pathDirection === "horizontal" ? "is-vertical" : "is-horizontal";

    hazard.className = `hazard ${cutterDirection}`;
    hazard.style.left = `${cell.column * cellWidth + (cellWidth - size) / 2}px`;
    hazard.style.top = `${cell.row * cellHeight + (cellHeight - size) / 2}px`;
    hazard.style.width = `${size}px`;
    hazard.style.height = `${size}px`;
    hazard.style.animationDuration = `${1.15 + index * 0.12 + Math.random() * 0.45}s`;

    const blade = document.createElement("div");
    blade.className = "cutter-blade";
    hazard.appendChild(blade);
    gameArea.appendChild(hazard);
  });
}

function updateScore(nextScore) {
  score = nextScore;
  scoreText.textContent = String(score);
}

// プレイ状態を初期状態に戻します。
function resetRound() {
  isPlaying = false;
  isGameClear = false;
  
  isTimerRunning = false;
  currentElapsedTime = 0;
  timeText.textContent = "0.00";

  pressedKeys.clear();
  gameArea.classList.remove("is-playing", "is-danger");
  cursor.style.display = "block";
}

function restartGame() {
  updateScore(0);
  resetRound();
  generateCourse();
}

function rectsOverlap(a, b) {
  const margin = 3;

  return (
    a.left < b.right - margin &&
    a.right > b.left + margin &&
    a.top < b.bottom - margin &&
    a.bottom > b.top + margin
  );
}

function movePlayerTo(x, y) {
  const areaRect = gameArea.getBoundingClientRect();
  playerX = Math.min(areaRect.right - playerRadius, Math.max(areaRect.left + playerRadius, x));
  playerY = Math.min(areaRect.bottom - playerRadius, Math.max(areaRect.top + playerRadius, y));
  
  playerRect = {
    left: playerX - playerHitRadius,
    right: playerX + playerHitRadius,
    top: playerY - playerHitRadius,
    bottom: playerY + playerHitRadius
  };

  cursor.style.left = `${playerX - areaRect.left}px`;
  cursor.style.top = `${playerY - areaRect.top}px`;
}

function resetPlayerToStart() {
  const startRect = startZone.getBoundingClientRect();

  movePlayerTo(
    startRect.left + startRect.width / 2,
    startRect.top + startRect.height / 2
  );
}

function hitObstacle(cursorRect) {
  const obstacles = document.querySelectorAll(".wall, .hazard");

  for (const obstacle of obstacles) {
    if (rectsOverlap(cursorRect, obstacle.getBoundingClientRect())) {
      return true;
    }
  }

  return false;
}

// ミスした時の処理（タイマーをリセットしないよう修正）
function failRound() {
  resetPlayerToStart();
  gameArea.classList.add("is-danger");

  window.setTimeout(() => {
    gameArea.classList.remove("is-danger");
  }, 260);
}

// ゴールした時の処理
function clearRound() {
  isGameClear = true;
  isPlaying = false;
  isTimerRunning = false;
  
  if (bestRecord === null || currentElapsedTime < bestRecord) {
    bestRecord = currentElapsedTime;
    bestTimeText.textContent = bestRecord.toFixed(2);
  }

  saveirairabouResult(bestRecord, true);

  let addedScore = 1000;
  if (currentElapsedTime > 10) {
    addedScore = Math.max(0, Math.round(1000 - (currentElapsedTime - 10) * 10));
  }

  pressedKeys.clear();
  updateScore(score + addedScore);
  gainCoins(addedScore);

  gameArea.classList.remove("is-playing");

  window.setTimeout(() => {
    resetRound();
    generateCourse();
  }, 450);
}

restartButton.addEventListener("click", restartGame);

function hasMovementInput() {
  return (
    pressedKeys.has("up") ||
    pressedKeys.has("down") ||
    pressedKeys.has("left") ||
    pressedKeys.has("right")
  );
}

// 毎フレーム呼ばれるゲームのメイン処理
function updateGame(currentTime) {
  const deltaTime = Math.min(0.04, (currentTime - lastFrameTime) / 1000 || 0);
  lastFrameTime = currentTime;

  let moveX = 0;
  let moveY = 0;

  if (pressedKeys.has("up")) moveY -= 1;
  if (pressedKeys.has("down")) moveY += 1;
  if (pressedKeys.has("left")) moveX -= 1;
  if (pressedKeys.has("right")) moveX += 1;

  if (!isGameClear && hasMovementInput()) {
    if (!isPlaying) {
      isPlaying = true;
      
      if (!isTimerRunning) {
        isTimerRunning = true;
        startTime = currentTime;
      }

      gameArea.classList.add("is-playing");
    }

    const length = Math.hypot(moveX, moveY) || 1;
    movePlayerTo(
      playerX + (moveX / length) * playerSpeed * deltaTime,
      playerY + (moveY / length) * playerSpeed * deltaTime
    );
  }

  if (isTimerRunning) {
    currentElapsedTime = (currentTime - startTime) / 1000;
    timeText.textContent = currentElapsedTime.toFixed(2);
  }

  if (isPlaying && playerRect && hitObstacle(playerRect)) {
    failRound();
  }

  if (isPlaying && playerRect && rectsOverlap(playerRect, goalZone.getBoundingClientRect())) {
    clearRound();
  }

  animationId = window.requestAnimationFrame(updateGame);
}

window.addEventListener("keydown", (event) => {
  const key = keyMap[event.key.toLowerCase()];

  if (key) {
    event.preventDefault();
    pressedKeys.add(key);
  }
});

window.addEventListener("keyup", (event) => {
  const key = keyMap[event.key.toLowerCase()];

  if (key) {
    pressedKeys.delete(key);
  }
});

window.addEventListener("resize", () => {
  window.clearTimeout(resizeTimer);
  resizeTimer = window.setTimeout(() => {
    resetRound();
    generateCourse();
  }, 180);
});

loadGameData();
resetRound();
generateCourse();
animationId = window.requestAnimationFrame(updateGame);