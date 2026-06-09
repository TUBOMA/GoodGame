const gameBoard = document.getElementById('gameBoard');
const startButton = document.getElementById('startButton');
const resetButton = document.getElementById('resetButton');
const scoreDisplay = document.getElementById('scoreDisplay');
const missDisplay = document.getElementById('missDisplay');
const volumeSlider = document.getElementById('volumeSlider');
const volumeValue = document.getElementById('volumeValue');
const highScoreDisplay = document.getElementById('highScoreDisplay');
const messageDisplay = document.getElementById('message');
const SOUND_VOLUME_KEY = 'memoryGameSoundVolume';
const flipSound = new Audio('Sounds/カードをめくる.mp3');
const matchSound = new Audio('Sounds/決定ボタンを押す33.mp3');
const missSound = new Audio('Sounds/ビープ音4.mp3');
const gameClearSound = new Audio('Sounds/成功音.mp3');
const gameOverSound = new Audio('Sounds/データ表示3.mp3');
const GAME_ID = 'sinnkeisuijyaku';

let cardsFlipped = 0;
let turns = 0;
let miss = 0;
let scores = 0;
let combos = 0;
let missLimit = 6;
let BASE_MISS_LIMIT = 6;
let playCount = 0;
let clearCount = 0;
let firstCard = null;
let secondCard = null;
let newRecordTimer = null;
let boardLock = false;
let isGameActive = false;

const soundEffects = [
    flipSound,
    matchSound,
    missSound,
    gameClearSound,
    gameOverSound
];

function loadHighScore() {
    if (typeof GameSystem === 'undefined') {
        return 0;
    }
    const myData = GameSystem.loadGameData(GAME_ID);
    return myData.highScore || 0;
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

function saveHighScore(newscore) {
    if (typeof GameSystem === 'undefined') {
        return;
    }

    const myData = GameSystem.loadGameData(GAME_ID);
    myData.highScore = Math.max(myData.highScore || 0, newscore);
    GameSystem.saveGameData(GAME_ID, myData);
}

function loadGameStats() {
    if (typeof GameSystem === 'undefined') {
        return {
            highScore: 0,
            playCount: 0,
            clearCount: 0
        };
    }

    const myData = GameSystem.loadGameData(GAME_ID);

    return {
        highScore: myData.highScore || 0,
        playCount: myData.playCount || 0,
        clearCount: myData.clearCount || 0
    };
}

function saveGameStats(stats) {
    if (typeof GameSystem === 'undefined') {
        return;
    }

    const myData = GameSystem.loadGameData(GAME_ID);

    myData.highScore = stats.highScore ?? myData.highScore ?? 0;
    myData.playCount = stats.playCount ?? myData.playCount ?? 0;
    myData.clearCount = stats.clearCount ?? myData.clearCount ?? 0;

    GameSystem.saveGameData(GAME_ID, myData);
}

function addPlayCount() {
    const stats = loadGameStats();
    stats.playCount++;
    playCount = stats.playCount;
    saveGameStats(stats);
}

function addClearCount() {
    const stats = loadGameStats();
    stats.clearCount++;
    clearCount = stats.clearCount;
    saveGameStats(stats);
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

function loadSoundVolume() {
    const savedVolume = localStorage.getItem(SOUND_VOLUME_KEY);
    return savedVolume !== null ? Number(savedVolume) : 0.6;
}

function updateVolumeDisplay() {
    const percent = Math.round(loadSoundVolume() * 100);
    volumeSlider.value = percent;
    volumeValue.textContent = `${percent}%`;
}

function applySoundVolume(volume) {
    soundEffects.forEach(sound => {
        sound.volume = volume;
    });
}

function handleVolumeChange() {
    const volume = Number(volumeSlider.value) / 100;
    localStorage.setItem(SOUND_VOLUME_KEY, volume);
    volumeValue.textContent = `${volumeSlider.value}%`;
    applySoundVolume(volume);
}

function updateMissDisplay() {
    missDisplay.textContent = `ミス: ${miss}/${missLimit}`;
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
    flipSound.currentTime = 0;
    flipSound.play();

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
    matchSound.currentTime = 0;
    matchSound.play();

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
        missSound.currentTime = 0;
        missSound.play();
        combos = 0;
        updateMissDisplay();

        if (miss >= missLimit) {
            messageDisplay.textContent = 'ゲームオーバー！';
            gameOver();
        }
    }, 500);
}

function resetBoard() {
    [firstCard, secondCard] = [null, null];
    boardLock = false;
}

function gameOver() {
    messageDisplay.textContent = `ゲームオーバー！スコア: ${scores}点！`;
    if (typeof GameSystem !== 'undefined') {
        GameSystem.addCoins(100); // 数字は一旦100統一で 調整は後々
        if (cardsFlipped === 0) {
            if(typeof GameSystem !== 'undefined') {
                GameSystem.unlockAchievement('achieve_s_zero_pair');
            }
        }
        gameOverSound.currentTime = 0;
        gameOverSound.play();
    }
    gameEnd();
}

function gameClear() {
    messageDisplay.textContent = `クリア！スコア: ${scores}点！`;
    if (typeof GameSystem !== 'undefined') {
        GameSystem.addCoins(200); // 数字は一旦100統一で 調整は後々
        addClearCount();
        if (miss === 0) {
            if(typeof GameSystem !== 'undefined') {
                GameSystem.unlockAchievement('achieve_s_perfect');
            }
        }
        gameClearSound.currentTime = 0;
        gameClearSound.play();
    }
    gameEnd();
}

function gameEnd() {
    isGameActive = false;
    startButton.disabled = false;
    resetButton.disabled = true;
    startButton.textContent = 'もう一度プレイ';

    const stats = loadGameStats();
    const currentPlayCount = stats.playCount;
    const currentClearCount = stats.clearCount;
    const currentHighScore = loadHighScore();
    if (playCount >= 1) {
        if(typeof GameSystem !== 'undefined') {
            GameSystem.unlockAchievement('achieve_s_play_1');
        }
    }
    if (playCount >= 10) {
        if(typeof GameSystem !== 'undefined') {
            GameSystem.unlockAchievement('achieve_s_play_10');
        }
    }
    if (playCount >= 100) {
        if(typeof GameSystem !== 'undefined') {
            GameSystem.unlockAchievement('achieve_s_play_100');
        }
    }
    if (clearCount >= 1) {
        if(typeof GameSystem !== 'undefined') {
            GameSystem.unlockAchievement('achieve_s_clear_1');
        }
    }
    if (clearCount >= 10) {
        if(typeof GameSystem !== 'undefined') {
            GameSystem.unlockAchievement('achieve_s_clear_10');
        }
    }
    if (clearCount >= 100) {
        if(typeof GameSystem !== 'undefined') {
            GameSystem.unlockAchievement('achieve_s_clear_100');
        }
    }
    if (scores > currentHighScore) {
        saveHighScore(scores);
        updateHighScoreDisplay(true);
    } else {
        updateHighScoreDisplay();
    }
}

function initializeGame() {
    const stats = loadGameStats();
    playCount = stats.playCount;
    clearCount = stats.clearCount;
    if (typeof GameSystem !== 'undefined') {
        // ★ここを一時的に追加して、ブラウザのコンソール（F12）に何が出るか見てみてください
        console.log("取得したアイテム数:", GameSystem.getItemCount('s_miss_plus'));
        // 未購入なら 0 が返ってくるので、何も起きず安全です
        missLimit = BASE_MISS_LIMIT + GameSystem.getItemCount('s_miss_plus');
    }

    applySoundVolume(loadSoundVolume());
    updateVolumeDisplay();
    updateMissDisplay();
    updateHighScoreDisplay();
    setTimeout(() => {
        updateMissDisplay();
    }, 0);

    const initialValues = generateAndShuffleCards();
    createBoard(initialValues);

    startButton.addEventListener('click', startGame);
    resetButton.addEventListener('click', resetGame);
    volumeSlider.addEventListener('input', handleVolumeChange);
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
    updateMissDisplay();
    startButton.disabled = true;
    resetButton.disabled = false;
    messageDisplay.textContent = 'カードをめくってください';
    if (typeof GameSystem !== 'undefined') {
        addPlayCount();
    }

    const shuffledValues = generateAndShuffleCards();
    createBoard(shuffledValues);
}

function resetGame() {
    startGame();
    messageDisplay.textContent = 'ゲームをリセットしました';
}

window.onload = initializeGame;