const DICE_COUNT = 5;
const CATEGORY_COUNT = 13;
const MAX_ROLL_COUNT = 3;

let scores = new Array(CATEGORY_COUNT).fill(null).map(() => [null, null]);
let diceValues = new Array(DICE_COUNT).fill(0);
let diceLocked = new Array(DICE_COUNT).fill(false);
let rollCount = 0;
let currentRound = 1;

function toggleLock(index) {
    diceLocked[index] = !diceLocked[index];
    updateDice();
}

function rollDice() {
    if (rollCount < MAX_ROLL_COUNT) {
        for (let i = 0; i < DICE_COUNT; i++) {
            if (!diceLocked[i]) {
                diceValues[i] = Math.floor(Math.random() * 6) + 1;
            }
        }
        rollCount++;
        updateDice();
        updateTemporaryScores();
        updateRemainingRolls();
    }
}

function createDot(className) {
    const dot = document.createElement('div');
    dot.className = `dot ${className}`;
    return dot;
}

function updateDice() {
    const diceContainer = document.getElementById("diceContainer");
    diceContainer.innerHTML = "";
    diceValues.forEach((value, index) => {
        const dice = document.createElement("div");
        dice.classList.add("dice");
        if (diceLocked[index]) {
            dice.classList.add("locked");
        }

        const dotPositions = [
            [],
            ['dot1'],
            ['dot2', 'dot5'],
            ['dot2', 'dot1', 'dot5'],
            ['dot2', 'dot4', 'dot3', 'dot5'],
            ['dot2', 'dot4', 'dot1', 'dot3', 'dot5'],
            ['dot2', 'dot4', 'dot6', 'dot7', 'dot3', 'dot5']
        ];

        dotPositions[value].forEach(pos => {
            dice.appendChild(createDot(pos));
        });

        dice.addEventListener("click", () => {
            toggleLock(index);
        });
        diceContainer.appendChild(dice);
    });
}

function calculateBonus(playerIndex) {
    const upperSectionSum = scores.slice(0, 6).reduce((sum, score) => sum + (score[playerIndex] || 0), 0);
    return upperSectionSum >= 63 ? 35 : 0;
}

function updateScoreboard() {
    document.getElementById("scoreboard").innerHTML = "";

    let table = document.createElement("table");
    table.style.margin = "0 auto";
    let headerRow = table.insertRow();
    headerRow.innerHTML = "<th>役名</th><th>説明</th><th>プレイヤー1</th><th>プレイヤー2</th>";

    const categories = [
        { name: "1", description: "1の目の合計" },
        { name: "2", description: "2の目の合計" },
        { name: "3", description: "3の目の合計" },
        { name: "4", description: "4の目の合計" },
        { name: "5", description: "5の目の合計" },
        { name: "6の目", description: "6の目の合計" },
        { name: "ボーナス", description: "合計得点が63点以上の場合、35点が加算される" },
        { name: "チョイス", description: "すべての目の合計" },
        { name: "フォーナンバーズ", description: "同じ目を4つ以上揃える、すべての目の合計" },
        { name: "フルハウス", description: "3つの同じ目と2つの同じ目を揃える、全ての目の合計" },
        { name: "Sストレート", description: "4つ以上の目が連続している、15点" },
        { name: "Bストレート", description: "5つの目が連続している、30点" },
        { name: "ヨット", description: "5つの目がすべて同じ、50点" }
    ];

    for (let i = 0; i < categories.length; i++) {
        let row = table.insertRow();
        if (i === 6) { // ボーナスの行
            row.innerHTML = `
                <td>${categories[i].name}</td>
                <td>${categories[i].description}</td>
                <td id="bonus1"></td>
                <td id="bonus2"></td>
            `;
        } else {
            row.innerHTML = `
                <td>${categories[i].name}</td>
                <td>${categories[i].description}</td>
                <td>
                    <input type="number" id="scoreInput${i}_1" min="0" readonly
                    value="${scores[i][0] !== null ? scores[i][0] : ''}"
                    ${scores[i][0] !== null ? 'disabled' : (currentRound === 2 ? 'disabled' : '')}
                    onclick="autoFillScore(${i}, 1)">
                    <span class="temporary-score" id="tempScore${i}_1" style="opacity: 0.8;">0</span>
                </td>
                <td>
                    <input type="number" id="scoreInput${i}_2" min="0" readonly
                    value="${scores[i][1] !== null ? scores[i][1] : ''}"
                    ${scores[i][1] !== null ? 'disabled' : (currentRound === 1 ? 'disabled' : '')}
                    onclick="autoFillScore(${i}, 2)">
                    <span class="temporary-score" id="tempScore${i}_2" style="opacity: 0.8;">0</span>
                </td>
            `;
        }
    }

    const totalRow = table.insertRow();
    totalRow.innerHTML = `
        <td colspan="2">合計点</td>
        <td id="totalScore1"></td>
        <td id="totalScore2"></td>
    `;

    document.getElementById("scoreboard").appendChild(table);

    updateTotalScores();
}

function updateTemporaryScores() {
    for (let i = 0; i < CATEGORY_COUNT; i++) {
        const tempScore1 = calculateTemporaryScore(i, 0);
        const tempScore2 = calculateTemporaryScore(i, 1);

        document.getElementById(`tempScore${i}_1`).textContent = tempScore1;
        document.getElementById(`tempScore${i}_2`).textContent = tempScore2;
    }
}

function calculateTemporaryScore(index, playerIndex) {
    const counts = diceValues.reduce((acc, value) => {
        acc[value - 1]++;
        return acc;
    }, new Array(6).fill(0));

    if (index < 6) {
        return counts[index] * (index + 1);
    } else if (index === 7) { // チョイス
        return diceValues.reduce((sum, value) => sum + value, 0);
    } else if (index === 8) { // フォーナンバーズ
        return counts.some(count => count >= 4) ? diceValues.reduce((sum, value) => sum + value, 0) : 0;
    } else if (index === 9) { // フルハウス
        return (counts.includes(3) && counts.includes(2)) ? diceValues.reduce((sum, value) => sum + value, 0) : 0;
    } else if (index === 10) { // Sストレート
        const straight1 = [1, 2, 3, 4].every(num => counts[num - 1] > 0);
        const straight2 = [2, 3, 4, 5].every(num => counts[num - 1] > 0);
        const straight3 = [3, 4, 5, 6].every(num => counts[num - 1] > 0);
        return (straight1 || straight2 || straight3) ? 15 : 0;
    } else if (index === 11) { // Bストレート
        const straight1 = [1, 2, 3, 4, 5].every(num => counts[num - 1] > 0);
        const straight2 = [2, 3, 4, 5, 6].every(num => counts[num - 1] > 0);
        return (straight1 || straight2) ? 30 : 0;
    } else if (index === 12) { // ヨット
        return counts.some(count => count === 5) ? 50 : 0;
    }
    return 0;
}

function updateScore(index, playerIndex, value) {
    scores[index][playerIndex - 1] = value === '' ? null : parseInt(value);
    if (currentRound === 1) {
        currentRound = 2;
    } else {
        currentRound = 1;
    }

    if (index < 6) {
        scores[6][0] = calculateBonus(0);
        scores[6][1] = calculateBonus(1);
    }

    updateTotalScores();
    endTurn();
}

function updateTotalScores() {
    const upperSectionSum1 = scores.slice(0, 6).reduce((sum, score) => sum + (score[0] !== null ? score[0] : 0), 0);
    const upperSectionSum2 = scores.slice(0, 6).reduce((sum, score) => sum + (score[1] !== null ? score[1] : 0), 0);
    const totalScore1 = scores.reduce((sum, score) => sum + (score[0] !== null ? score[0] : 0), 0);
    const totalScore2 = scores.reduce((sum, score) => sum + (score[1] !== null ? score[1] : 0), 0);

    const remainingForBonus1 = Math.max(63 - upperSectionSum1, 0);
    const remainingForBonus2 = Math.max(63 - upperSectionSum2, 0);

    document.getElementById("bonus1").textContent = `${scores[6][0]} (${upperSectionSum1}/63)`;
    document.getElementById("bonus2").textContent = `${scores[6][1]} (${upperSectionSum2}/63)`;

    document.getElementById("totalScore1").textContent = totalScore1;
    document.getElementById("totalScore2").textContent = totalScore2;
}

function autoFillScore(index, playerIndex) {
    const score = calculateTemporaryScore(index, playerIndex - 1);
    document.getElementById(`scoreInput${index}_${playerIndex}`).value = score;
    updateScore(index, playerIndex, score);
}

function initializeGame() {
    scores = new Array(CATEGORY_COUNT).fill(null).map(() => [null, null]);
    updateScoreboard();
    rollDice();
}

function endTurn() {
    updateScoreboard();
    diceLocked.fill(false);
    rollCount = 0;
    diceValues.fill(0);
    rollDice();
}

document.getElementById("rollButton").addEventListener("click", () => {
    rollDice();
    updateTemporaryScores();
    updateRemainingRolls();
});

initializeGame();
