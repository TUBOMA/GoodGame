// HTMLからゲームで使う要素を取得します。
const gameArea = document.getElementById("gameArea");
const startZone = document.getElementById("startZone");
const goalZone = document.getElementById("goalZone");
const cursor = document.getElementById("cursor");
const scoreText = document.getElementById("score");
const restartButton = document.getElementById("restartButton");

// ゲーム全体の状態を保存する変数です。
let score = 0;
let isPlaying = false;
let isGameClear = false;
let resizeTimer = 0;
let animationId = 0;
let lastFrameTime = 0;
let playerX = 0;
let playerY = 0;
let playerRect = null;
const pressedKeys = new Set();
const playerSpeed = 190;

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
// ここではまだ実際のゲーム画面の細かいマスには変換していません。
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

// 大きめのマスで作った道を、実際のゲーム画面のマス位置に変換します。
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

// 複数回ランダム生成して、できるだけ長い一本道を採用します。
function makePath(columns, rows) {
  const coarseColumns = Math.ceil(columns / 2);
  const coarseRows = Math.ceil(rows / 2);
  let bestPath = null;

  for (let attempt = 0; attempt < 180; attempt += 1) {
    const coarsePath = tryMakeCoarsePath(coarseColumns, coarseRows);

    if (coarsePath && (!bestPath || coarsePath.length > bestPath.length)) {
      bestPath = coarsePath;
    }
  }

  return makeActualPath(bestPath || makeFallbackCoarsePath(coarseColumns, coarseRows), columns, rows);
}

// STARTやGOALを、対応するマスの中に配置します。
function placeZone(zone, column, row, cellWidth, cellHeight, areaHeight) {
  const padding = 6;
  const width = Math.max(34, cellWidth - padding * 2);
  const height = Math.max(34, cellHeight - padding * 2);
  const left = column * cellWidth + padding;
  const top = Math.min(
    areaHeight - height - padding,
    Math.max(padding, row * cellHeight + (cellHeight - height) / 2)
  );

  zone.style.width = `${width}px`;
  zone.style.height = `${height}px`;
  zone.style.left = `${left}px`;
  zone.style.top = `${top}px`;
  zone.style.fontSize = `${Math.max(0.58, Math.min(0.86, cellWidth / 82))}rem`;
}

// コース全体を作り直します。道以外のマスには壁を置きます。
function generateCourse() {
  const oldObstacles = gameArea.querySelectorAll(".wall, .hazard");

  oldObstacles.forEach((obstacle) => {
    obstacle.remove();
  });

  const areaWidth = gameArea.clientWidth;
  const areaHeight = gameArea.clientHeight;
  const columns = areaWidth < 520 ? 8 : areaWidth < 720 ? 12 : 16;
  const rows = areaHeight < 500 ? 9 : 11;
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

// 指定した道のマスが横方向・縦方向・曲がり角のどれかを調べます。
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

// 障害物を置いてよい「直線部分」かどうかを調べます。
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

// 障害物が隣同士に並ばないようにチェックします。
function isNextToHazard(cell, selectedCells) {
  return selectedCells.some((selected) => {
    const columnDistance = Math.abs(cell.column - selected.column);
    const rowDistance = Math.abs(cell.row - selected.row);

    return columnDistance + rowDistance <= 1;
  });
}

// 道の直線部分にカッターを置きます。曲がり角と隣接配置は避けます。
function addHazards(pathCells, cellWidth, cellHeight) {
  const candidateCells = pathCells
    .map((cell, index) => ({ ...cell, index }))
    .slice(4, -4)
    .filter((cell) => isStraightPathCell(pathCells, cell.index));
  const hazardCells = shuffle(candidateCells);
  const hazardCount = Math.min(5, hazardCells.length, Math.max(2, Math.floor(pathCells.length / 8)));
  const selectedHazards = [];

  for (const cell of hazardCells) {
    if (selectedHazards.length >= hazardCount) {
      break;
    }

    if (!isNextToHazard(cell, selectedHazards)) {
      selectedHazards.push(cell);
    }
  }

  selectedHazards.forEach((cell, index) => {
    const size = Math.max(22, Math.min(34, Math.min(cellWidth, cellHeight) * 0.44));
    const hazard = document.createElement("div");
    const pathDirection = getPathDirection(pathCells, cell.index);
    const cutterDirection = pathDirection === "horizontal" ? "is-vertical" : "is-horizontal";

    hazard.className = `hazard ${cutterDirection}`;
    hazard.style.left = `${cell.column * cellWidth + (cellWidth - size) / 2}px`;
    hazard.style.top = `${cell.row * cellHeight + (cellHeight - size) / 2}px`;
    hazard.style.width = `${size}px`;
    hazard.style.height = `${size}px`;
    hazard.style.animationDuration = `${0.75 + index * 0.12 + Math.random() * 0.45}s`;

    const blade = document.createElement("div");
    blade.className = "cutter-blade";
    hazard.appendChild(blade);
    gameArea.appendChild(hazard);
  });
}

// スコア表示を更新します。
function updateScore(nextScore) {
  score = nextScore;
  scoreText.textContent = String(score);
}

// プレイ状態を初期状態に戻します。スコアはここでは変えません。
function resetRound() {
  isPlaying = false;
  isGameClear = false;
  pressedKeys.clear();
  gameArea.classList.remove("is-playing", "is-danger");
  cursor.style.display = "block";
}

// リスタートボタン用です。スコアを0にしてコースも作り直します。
function restartGame() {
  updateScore(0);
  resetRound();
  generateCourse();
}

// 2つの四角形が重なっているかを判定します。
function rectsOverlap(a, b) {
  return (
    a.left < b.right &&
    a.right > b.left &&
    a.top < b.bottom &&
    a.bottom > b.top
  );
}

// プレイヤーの当たり判定用の四角形を作ります。
function getCursorRect(x, y) {
  const radius = 9;
  return {
    left: x - radius,
    right: x + radius,
    top: y - radius,
    bottom: y + radius
  };
}

// プレイヤーの現在位置から当たり判定を更新します。
function updatePlayerRect() {
  playerRect = getCursorRect(playerX, playerY);
}

// プレイヤーを指定位置へ移動します。ゲームエリア外には出ないように制限します。
function movePlayerTo(x, y) {
  const areaRect = gameArea.getBoundingClientRect();
  playerX = Math.min(areaRect.right - 11, Math.max(areaRect.left + 11, x));
  playerY = Math.min(areaRect.bottom - 11, Math.max(areaRect.top + 11, y));
  updatePlayerRect();

  cursor.style.left = `${playerX - areaRect.left}px`;
  cursor.style.top = `${playerY - areaRect.top}px`;
}

// プレイヤーをSTARTの中央に戻します。
function resetPlayerToStart() {
  const startRect = startZone.getBoundingClientRect();

  movePlayerTo(
    startRect.left + startRect.width / 2,
    startRect.top + startRect.height / 2
  );
}

// 壁やカッターに触れているかを調べます。
function hitObstacle(cursorRect) {
  const obstacles = document.querySelectorAll(".wall, .hazard");

  for (const obstacle of obstacles) {
    if (rectsOverlap(cursorRect, obstacle.getBoundingClientRect())) {
      return true;
    }
  }

  return false;
}

// ミスした時の処理です。STARTに戻して画面を少し揺らします。
function failRound() {
  resetRound();
  resetPlayerToStart();
  gameArea.classList.add("is-danger");

  window.setTimeout(() => {
    gameArea.classList.remove("is-danger");
  }, 260);
}

// ゴールした時の処理です。スコアを増やして次のコースを生成します。
function clearRound() {
  isGameClear = true;
  isPlaying = false;
  pressedKeys.clear();
  updateScore(score + 100);

  // ホーム側のゲームシステムがある時だけ、クリア報酬のコインを追加します。
  if (typeof GameSystem !== "undefined") {
    GameSystem.addCoins(100);
  }

  gameArea.classList.remove("is-playing");

  window.setTimeout(() => {
    resetRound();
    generateCourse();
  }, 450);
}

restartButton.addEventListener("click", restartGame);

// 何か移動キーが押されているかを調べます。
function hasMovementInput() {
  return (
    pressedKeys.has("up") ||
    pressedKeys.has("down") ||
    pressedKeys.has("left") ||
    pressedKeys.has("right")
  );
}

// 毎フレーム呼ばれるゲームのメイン処理です。
// キー入力、移動、壁/障害物/ゴール判定をここで行います。
function updateGame(currentTime) {
  const deltaTime = Math.min(0.04, (currentTime - lastFrameTime) / 1000 || 0);
  lastFrameTime = currentTime;

  let moveX = 0;
  let moveY = 0;

  if (pressedKeys.has("up")) {
    moveY -= 1;
  }

  if (pressedKeys.has("down")) {
    moveY += 1;
  }

  if (pressedKeys.has("left")) {
    moveX -= 1;
  }

  if (pressedKeys.has("right")) {
    moveX += 1;
  }

  if (!isGameClear && hasMovementInput()) {
    if (!isPlaying) {
      isPlaying = true;
      gameArea.classList.add("is-playing");
    }

    const length = Math.hypot(moveX, moveY) || 1;
    movePlayerTo(
      playerX + (moveX / length) * playerSpeed * deltaTime,
      playerY + (moveY / length) * playerSpeed * deltaTime
    );
  }

  if (isPlaying && playerRect && hitObstacle(playerRect)) {
    failRound();
  }

  if (isPlaying && playerRect && rectsOverlap(playerRect, goalZone.getBoundingClientRect())) {
    clearRound();
  }

  animationId = window.requestAnimationFrame(updateGame);
}

// キーを押した時、WASDまたは矢印キーなら移動状態として記録します。
window.addEventListener("keydown", (event) => {
  const key = keyMap[event.key.toLowerCase()];

  if (key) {
    event.preventDefault();
    pressedKeys.add(key);
  }
});

// キーを離した時、移動状態から外します。
window.addEventListener("keyup", (event) => {
  const key = keyMap[event.key.toLowerCase()];

  if (key) {
    pressedKeys.delete(key);
  }
});

// 画面サイズが変わったら、マスの大きさも変わるのでコースを作り直します。
window.addEventListener("resize", () => {
  window.clearTimeout(resizeTimer);
  resizeTimer = window.setTimeout(() => {
    resetRound();
    generateCourse();
  }, 180);
});

// 最初の準備です。コースを作り、ゲームループを開始します。
resetRound();
generateCourse();
animationId = window.requestAnimationFrame(updateGame);
