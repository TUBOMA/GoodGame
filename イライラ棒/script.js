const gameArea = document.getElementById("gameArea");
const startZone = document.getElementById("startZone");
const goalZone = document.getElementById("goalZone");
const cursor = document.getElementById("cursor");
const scoreText = document.getElementById("score");
const restartButton = document.getElementById("restartButton");

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

function coarseToActual(cell, columns, rows) {
  return {
    column: Math.min(columns - 1, cell.column * 2),
    row: Math.max(0, rows - 1 - cell.row * 2)
  };
}

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

function makeActualPath(coarsePath, columns, rows) {
  const path = [coarseToActual(coarsePath[0], columns, rows)];

  coarsePath.slice(1).forEach((cell) => {
    addLineToPath(path, coarseToActual(cell, columns, rows));
  });

  addLineToPath(path, { column: columns - 1, row: 0 });

  return path;
}

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

function updateScore(nextScore) {
  score = nextScore;
  scoreText.textContent = String(score);
}

function resetRound() {
  isPlaying = false;
  isGameClear = false;
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
  return (
    a.left < b.right &&
    a.right > b.left &&
    a.top < b.bottom &&
    a.bottom > b.top
  );
}

function getCursorRect(x, y) {
  const radius = 9;
  return {
    left: x - radius,
    right: x + radius,
    top: y - radius,
    bottom: y + radius
  };
}

function updatePlayerRect() {
  playerRect = getCursorRect(playerX, playerY);
}

function movePlayerTo(x, y) {
  const areaRect = gameArea.getBoundingClientRect();
  playerX = Math.min(areaRect.right - 11, Math.max(areaRect.left + 11, x));
  playerY = Math.min(areaRect.bottom - 11, Math.max(areaRect.top + 11, y));
  updatePlayerRect();

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

function failRound() {
  resetRound();
  resetPlayerToStart();
  gameArea.classList.add("is-danger");

  window.setTimeout(() => {
    gameArea.classList.remove("is-danger");
  }, 260);
}

function clearRound() {
  isGameClear = true;
  isPlaying = false;
  pressedKeys.clear();
  updateScore(score + 100);
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

resetRound();
generateCourse();
animationId = window.requestAnimationFrame(updateGame);
