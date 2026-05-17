const gameBoard = document.getElementById('gameBoard');
const startButton = document.getElementById('startButton');
const resetButton = document.getElementById('resetButton');
const scoreDisplay = document.getElementById('scoreDisplay');
const missDisplay = document.getElementById('missDisplay');
const highScoreDisplay = document.getElementById('highScoreDisplay');
const messageDisplay = document.getElementById('message');
const HIGHSCORE_KEY = 'memoryGameHighScore';

let cardsFlipped = 0;
let turns = 0;
let miss = 0;
let scores = 0;
let combos = 0;
let firstCard = null;
let secondCard = null;
let newRecordTimer = null;
let boardLock = false;
let isGameActive = false;

function loadHighScore() {
    const savedScore = localStorage.getItem(HIGHSCORE_KEY);
    return savedScore ? parseInt(savedScore, 10) : 0;
}

function updateHighScoreDisplay(isNewRecord = false) {
    if (newRecordTimer) {
        clearTimeout(newRecordTimer);
        newRecordTimer = null;
    }

    const currentHighScore = loadHighScore();

    highScoreDisplay.textContent = currentHighScore === 0
        ? 'ベストスコア: -'
        : `ベストスコア: ${currentHighScore}${isNewRecord ? ' (新記録!)' : ''}`;

    if (isNewRecord) {
        newRecordTimer = setTimeout(() => {
            newRecordTimer = null;
            updateHighScoreDisplay();
        }, 2000);
    }
}

function generateAndShuffleCards() {
    let values = [];
    for (let i = 1; i <= 8; i++) {
        values.push(i, i);
    }

    for (let i = values.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [values[i], values[j]] = [values[j], values[i]];
    }

    return values;
}

function createBoard(values) {
    gameBoard.innerHTML = '';

    values.forEach(value => {
        const card = document.createElement('div');
        card.classList.add('card');
        card.dataset.value = value;

        const cardFront = document.createElement('div');
        cardFront.classList.add('card-face', 'card-front');
        cardFront.textContent = value;

        const cardBack = document.createElement('div');
        cardBack.classList.add('card-face', 'card-back');

        card.appendChild(cardFront);
        card.appendChild(cardBack);

        card.addEventListener('click', flipCard);
        gameBoard.appendChild(card);
    });
}

function flipCard(event) {
    if (!isGameActive || boardLock) return;

    const card = event.currentTarget;
    if (card.classList.contains('flipped')) return;

    card.classList.add('flipped');

    if (!firstCard) {
        firstCard = card;
        messageDisplay.textContent = '2枚目を選んでください';
        return;
    }

    secondCard = card;
    turns++;
    boardLock = true;
    messageDisplay.textContent = '判定中...';

    checkForMatch();
}

function checkForMatch() {
    const isMatch = firstCard.dataset.value === secondCard.dataset.value;

    if (isMatch) {
        matchCards();
    } else {
        unflipCards();
    }
}

function matchCards() {
    firstCard.classList.add('matched');
    secondCard.classList.add('matched');

    firstCard.removeEventListener('click', flipCard);
    secondCard.removeEventListener('click', flipCard);

    resetBoard();
    cardsFlipped++;

    messageDisplay.textContent = 'マッチ成功！';
    combos++;

    const baseScore = 100;
    const turnBonus = Math.max(0, 70 - turns * 5);
    const comboBonus = (combos - 1) * 100;

    scores += baseScore + turnBonus + comboBonus;
    scoreDisplay.textContent = `スコア: ${scores}`;

    if (cardsFlipped === 8) {
        gameClear();
    }
}

function unflipCards() {
    setTimeout(() => {
        firstCard.classList.remove('flipped');
        secondCard.classList.remove('flipped');
        resetBoard();
        messageDisplay.textContent = '一致しませんでした';

        miss++;
        combos = 0;
        missDisplay.textContent = `ミス: ${miss}`;

        if (miss >= 6) {
            messageDisplay.textContent = 'ゲームオーバー！';
            gameClear();
        }
    }, 500);
}

function resetBoard() {
    [firstCard, secondCard] = [null, null];
    boardLock = false;
}

function gameClear() {
    isGameActive = false;
    messageDisplay.textContent = `クリア！スコア: ${scores}点！`;
    startButton.disabled = false;
    resetButton.disabled = true;
    startButton.textContent = 'もう一度プレイ';

    const currentHighScore = loadHighScore();
    if (scores > currentHighScore) {
        localStorage.setItem(HIGHSCORE_KEY, scores);
        updateHighScoreDisplay(true);
    } else {
        updateHighScoreDisplay();
    }
}

function initializeGame() {
    updateHighScoreDisplay();

    const initialValues = generateAndShuffleCards();
    createBoard(initialValues);

    startButton.addEventListener('click', startGame);
    resetButton.addEventListener('click', resetGame);
}

function startGame() {
    isGameActive = true;
    turns = 0;
    scores = 0;
    miss = 0;
    combos = 0;
    cardsFlipped = 0;

    resetBoard();
    updateHighScoreDisplay();

    scoreDisplay.textContent = `スコア: ${scores}`;
    missDisplay.textContent = `ミス: ${miss}`;
    startButton.disabled = true;
    resetButton.disabled = false;
    messageDisplay.textContent = 'カードをめくってください';

    const shuffledValues = generateAndShuffleCards();
    createBoard(shuffledValues);
}

function resetGame() {
    startGame();
    messageDisplay.textContent = 'ゲームをリセットしました';
}

window.onload = initializeGame;