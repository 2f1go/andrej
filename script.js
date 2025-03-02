const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const gridSize = 15; // Уменьшим размер поля для простоты
let cellSize;

const words = yakutWords; // Используем слова из words.js
let grid = [];
let foundWords = [];

let selected = [];
let isDragging = false;

const foundCountSpan = document.getElementById('foundCount');
const totalCountSpan = document.getElementById('totalCount');
const wordListDiv = document.getElementById('wordList');
const resetButton = document.getElementById('resetButton');

const highlightColors = ["green", "yellow", "orange", "purple", "cyan", "magenta", "red", "violet", "brown", "blue", "pink"];
let currentHighlightIndex = 0;

class Cell {
    constructor(row, col) {
        this.row = row;
        this.col = col;
        this.found = false;
    }
}

function calculateCellSize() {
    cellSize = canvas.width / gridSize;
}

function drawGrid() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize; col++) {
            const x = col * cellSize;
            const y = row * cellSize;

            let isSelected = false;
            let highlightColor = null;

            isSelected = selected.find(cell => cell.row === row && cell.col === col);

            for (let i = 0; i < foundWords.length; i++) {
                const foundWord = foundWords[i];
                if (foundWord.cells.find(cell => cell.row === row && cell.col === col)) {
                    highlightColor = highlightColors[i % highlightColors.length];
                    break;
                }
            }

            if (highlightColor) {
                ctx.fillStyle = highlightColor;
            } else if (isSelected) {
                ctx.fillStyle = 'lightblue';
            } else {
                ctx.fillStyle = 'white';
            }

            ctx.fillRect(x, y, cellSize, cellSize);
            ctx.strokeRect(x, y, cellSize, cellSize);

            ctx.fillStyle = 'black';
            ctx.font = cellSize * 0.7 + 'px Arial Unicode MS';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(grid[row][col], x + cellSize / 2, y + cellSize / 2);
        }
    }
}

function generateGrid() {
    grid = Array(gridSize).fill(null).map(() => Array(gridSize).fill(''));
    const alphabet = "аиоуыдьнг".toLowerCase();

    // Размещение слов
    words.forEach(word => {
        placeWord(word, alphabet);
    });

    // Заполнение пустых ячеек
    for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize; col++) {
            if (grid[row][col] === '') {
                grid[row][col] = alphabet[Math.floor(Math.random() * alphabet.length)];
            }
        }
    }
}

function placeWord(word, alphabet) {
    const directions = [{row: 0, col: 1}, {row: 1, col: 0}]; // Только вправо и вниз
    let placed = false;
    let attempts = 0;

    while (!placed && attempts < 100) {
        attempts++;
        const direction = directions[Math.floor(Math.random() * directions.length)];
        const rowIncrement = direction.row;
        const colIncrement = direction.col;
        let row = Math.floor(Math.random() * gridSize);
        let col = Math.floor(Math.random() * gridSize);

        if (rowIncrement === 0 && col + word.length > gridSize) continue;
        if (colIncrement === 0 && row + word.length > gridSize) continue;

        let canPlace = true;
        for (let i = 0; i < word.length; i++) {
            const newRow = row + rowIncrement * i;
            const newCol = col + colIncrement * i;

            if (grid[newRow][newCol] !== '' && grid[newRow][newCol] !== word[i]) {
                canPlace = false;
                break;
            }
        }

        if (canPlace) {
            for (let i = 0; i < word.length; i++) {
                const newRow = row + rowIncrement * i;
                const newCol = col + colIncrement * i;
                grid[newRow][newCol] = word[i];
            }
            placed = true;
        }
    }

    if (!placed) {
        console.warn(`Не удалось разместить слово: ${word}`);
    }
}

function checkWord() {
    let wordStr = "";
    for (const cell of selected) {
        wordStr += grid[cell.row][cell.col];
    }

    wordStr = wordStr.toLowerCase();

    if (words.includes(wordStr) && !foundWords.find(w => w.word === wordStr)) {
        // Сохраняем слово как объект: {word, cells}
        foundWords.push({word: wordStr, cells: [...selected]});

        updateFoundWords();

        // Увеличиваем индекс текущего цвета
        currentHighlightIndex = (currentHighlightIndex + 1) % highlightColors.length;
    }

    selected = [];
    drawGrid();
}

function updateFoundWords() {
    foundCountSpan.textContent = foundWords.length;
    totalCountSpan.textContent = words.length;

    wordListDiv.innerHTML = '';
    words.forEach(word => {
        const p = document.createElement('p');
        p.textContent = word;
        if (foundWords.find(w => w.word === word)) {
            p.classList.add('found');
        }
        wordListDiv.appendChild(p);
    });
}

function handleMouseDown(e) {
    isDragging = true;
    selectCell(e);
}

function handleMouseMove(e) {
    if (!isDragging) return;
    selectCell(e);
}

function handleMouseUp() {
    isDragging = false;
    checkWord();
}

function selectCell(e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const col = Math.floor(x / cellSize);
    const row = Math.floor(y / cellSize);

    if (row < 0 || row >= gridSize || col < 0 || col >= gridSize) return;

    if (isCellPartOfFoundWord(row, col)) return;

    // Проверяем, что ячейка еще не выбрана
    if (selected.find(cell => cell.row === row && cell.col === col)) return;

    if (selected.length > 0) {
        const last = selected[selected.length - 1];
        const rowDiff = Math.abs(row - last.row);
        const colDiff = Math.abs(col - last.col);
        if (rowDiff > 1 || colDiff > 1 || (rowDiff === 0 && colDiff === 0)) return;
    }
    const newCell = new Cell(row, col);
    selected.push(newCell);
    drawGrid();
}

function isCellPartOfFoundWord(row, col) {
    for (const foundWord of foundWords) {
        if (foundWord.cells.find(cell => cell.row === row && cell.col === col)) {
            return true;
        }
    }
    return false;
}

function resetGame() {
    foundWords = [];
    selected = [];
    currentHighlightIndex = 0;
    generateGrid();
    drawGrid();
    updateFoundWords();
}

// Инициализация
calculateCellSize();
generateGrid();
drawGrid();
updateFoundWords();

canvas.addEventListener('mousedown', handleMouseDown);
canvas.addEventListener('mousemove', handleMouseMove);
canvas.addEventListener('mouseup', handleMouseUp);

resetButton.addEventListener('click', resetGame);