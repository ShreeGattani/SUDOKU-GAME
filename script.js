// JavaScript logic goes here (from previous updates)

const grid = document.getElementById('sudokuGrid');
const numberPad = document.getElementById('numberPad');
const timerEl = document.getElementById('timer');
const solvedEl = document.getElementById('solved');
const fastestEl = document.getElementById('fastest');
const modal = document.getElementById('modal');
let startTime, timerInterval;
let currentPuzzle = [], solution = [];
let selectedCell = null;

// Event Listeners
['newGameBtn', 'resetBtn', 'checkBtn', 'hintBtn', 'toggleDark'].forEach(id => {
  document.getElementById(id).addEventListener('click', handleActions);
});
document.getElementById('confirmReset').addEventListener('click', resetGame);
document.getElementById('cancelReset').addEventListener('click', () => modal.classList.add('hidden'));

// Add number pad event listeners
numberPad.querySelectorAll('button').forEach(button => {
  button.addEventListener('click', () => {
    if (selectedCell && !selectedCell.classList.contains('prefilled')) {
      selectedCell.value = button.dataset.number;
      validateInput({ target: selectedCell });
    }
  });
});

// Close number pad when clicking outside
document.addEventListener('click', (e) => {
  if (!e.target.closest('.cell') && !e.target.closest('.number-pad')) {
    numberPad.classList.add('hidden');
    if (selectedCell) {
      selectedCell.classList.remove('selected');
      selectedCell = null;
    }
  }
});

function handleActions(e) {
  const id = e.target.id;
  if (id === 'newGameBtn') startNewGame();
  else if (id === 'resetBtn') modal.classList.remove('hidden');
  else if (id === 'checkBtn') checkSolution();
  else if (id === 'hintBtn') showHint();
  else if (id === 'toggleDark') document.body.classList.toggle('dark');
}

function startNewGame() {
  const difficulty = document.getElementById('difficulty').value;
  [solution, currentPuzzle] = generateSudoku(difficulty);
  renderGrid(currentPuzzle);
  resetTimer();
  startTimer();
}

function resetGame() {
  document.querySelectorAll('.cell').forEach(cell => {
    if (!cell.classList.contains('prefilled')) {
      cell.value = '';
      cell.classList.remove('invalid');
    }
  });
  modal.classList.add('hidden');
}

function renderGrid(puzzle) {
  grid.innerHTML = '';
  puzzle.forEach((row, r) => row.forEach((val, c) => {
    const input = document.createElement('input');
    input.classList.add('cell');
    input.setAttribute('maxlength', 1);
    input.dataset.row = r;
    input.dataset.col = c;
    input.addEventListener('input', validateInput);
    input.addEventListener('keydown', handleKeyNavigation);
    if (val !== 0) {
      input.value = val;
      input.classList.add('prefilled');
    }
    grid.appendChild(input);
  }));
}

function handleKeyNavigation(e) {
  const input = e.target;
  const r = +input.dataset.row;
  const c = +input.dataset.col;
  
  switch(e.key) {
    case 'ArrowUp':
      if (r > 0) focusCell(r - 1, c);
      break;
    case 'ArrowDown':
      if (r < 8) focusCell(r + 1, c);
      break;
    case 'ArrowLeft':
      if (c > 0) focusCell(r, c - 1);
      break;
    case 'ArrowRight':
      if (c < 8) focusCell(r, c + 1);
      break;
    case '1':
    case '2':
    case '3':
    case '4':
    case '5':
    case '6':
    case '7':
    case '8':
    case '9':
      input.value = e.key;
      validateInput({ target: input });
      break;
    case 'Backspace':
      input.value = '';
      validateInput({ target: input });
      break;
  }
}

function focusCell(row, col) {
  const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
  if (cell && !cell.classList.contains('prefilled')) {
    cell.focus();
  }
}

function validateInput(e) {
  const input = e.target;
  const val = parseInt(input.value);
  const r = +input.dataset.row;
  const c = +input.dataset.col;
  input.classList.remove('invalid');

  if (isNaN(val) || val < 1 || val > 9) {
    input.classList.add('invalid');
    return;
  }

  const inputs = document.querySelectorAll('.cell');
  let hasError = false;
  
  inputs.forEach(cell => {
    const vr = +cell.dataset.row, vc = +cell.dataset.col;
    if (cell !== input && cell.value == val &&
        (vr === r || vc === c || (Math.floor(vr/3) === Math.floor(r/3) && Math.floor(vc/3) === Math.floor(c/3)))) {
      cell.classList.add('invalid');
      input.classList.add('invalid');
      hasError = true;
    }
  });

  if (!hasError) {
    inputs.forEach(cell => cell.classList.remove('invalid'));
  }

  // Check if puzzle is complete
  if (!hasError && isPuzzleComplete()) {
    checkSolution();
  }
}

function isPuzzleComplete() {
  const inputs = document.querySelectorAll('.cell');
  for (const input of inputs) {
    if (input.value === '') return false;
  }
  return true;
}

function checkSolution() {
  const inputs = document.querySelectorAll('.cell');
  let correct = true;
  inputs.forEach(input => {
    const r = +input.dataset.row, c = +input.dataset.col;
    if (parseInt(input.value) !== solution[r][c]) {
      correct = false;
      input.classList.add('invalid');
    }
  });
  if (correct) {
    stopTimer();
    alert("🎉 Correct! Puzzle solved.");
    updateStats();
  } else {
    alert("❌ Incorrect values. Try again!");
  }
}

function showHint() {
  const emptyCells = Array.from(document.querySelectorAll('.cell'))
    .filter(cell => !cell.classList.contains('prefilled') && cell.value === '');
  
  if (emptyCells.length === 0) {
    alert('No empty cells to hint!');
    return;
  }

  const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  const r = +randomCell.dataset.row;
  const c = +randomCell.dataset.col;
  
  randomCell.value = solution[r][c];
  randomCell.classList.add('hinted');
  validateInput({ target: randomCell });
}

function startTimer() {
  startTime = Date.now();
  timerInterval = setInterval(() => {
    const t = Math.floor((Date.now() - startTime) / 1000);
    timerEl.textContent = `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
  }, 1000);
}

function resetTimer() {
  clearInterval(timerInterval);
  timerEl.textContent = '00:00';
}

function stopTimer() {
  clearInterval(timerInterval);
}

function updateStats() {
  const time = timerEl.textContent;
  let best = localStorage.getItem('fastest') || '--:--';
  let solved = +localStorage.getItem('solved') || 0;
  solved++;
  if (best === '--:--' || time < best) {
    localStorage.setItem('fastest', time);
    fastestEl.textContent = time;
  }
  updateLeaderboard(time);
  localStorage.setItem('solved', solved);
  solvedEl.textContent = solved;
}

function generateSudoku(difficulty = "medium") {
  const board = Array.from({ length: 9 }, () => Array(9).fill(0));

  function isSafe(board, row, col, num) {
    // Check row
    for (let x = 0; x < 9; x++) {
      if (board[row][x] === num) return false;
    }
    
    // Check column
    for (let x = 0; x < 9; x++) {
      if (board[x][col] === num) return false;
    }
    
    // Check 3x3 box
    const startRow = row - row % 3;
    const startCol = col - col % 3;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (board[i + startRow][j + startCol] === num) return false;
      }
    }
    
    return true;
  }

  function solveBoard(board) {
    let row = -1;
    let col = -1;
    let isEmpty = false;
    
    // Find empty cell
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        if (board[i][j] === 0) {
          row = i;
          col = j;
          isEmpty = true;
          break;
        }
      }
      if (isEmpty) break;
    }
    
    // No empty cell found
    if (!isEmpty) return true;
    
    // Try digits 1-9
    for (let num = 1; num <= 9; num++) {
      if (isSafe(board, row, col, num)) {
        board[row][col] = num;
        if (solveBoard(board)) return true;
        board[row][col] = 0;
      }
    }
    return false;
  }

  function removeNumbers(board, difficulty) {
    const cellsToRemove = {
      'easy': 35,    // Remove 35 numbers
      'medium': 45,  // Remove 45 numbers
      'hard': 55     // Remove 55 numbers
    }[difficulty];

    let attempts = 0;
    let removed = 0;
    
    while (removed < cellsToRemove && attempts < 100) {
      const row = Math.floor(Math.random() * 9);
      const col = Math.floor(Math.random() * 9);
      
      if (board[row][col] !== 0) {
        const temp = board[row][col];
        board[row][col] = 0;
        
        // Check if the puzzle still has a unique solution
        let solutions = 0;
        const boardCopy = board.map(row => [...row]);
        
        function countSolutions(board) {
          let row = -1;
          let col = -1;
          let isEmpty = false;
          
          for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
              if (board[i][j] === 0) {
                row = i;
                col = j;
                isEmpty = true;
                break;
              }
            }
            if (isEmpty) break;
          }
          
          if (!isEmpty) {
            solutions++;
            return;
          }
          
          for (let num = 1; num <= 9; num++) {
            if (isSafe(board, row, col, num)) {
              board[row][col] = num;
              countSolutions(board);
              if (solutions > 1) return;
              board[row][col] = 0;
            }
          }
        }
        
        countSolutions(boardCopy);
        
        if (solutions === 1) {
          removed++;
        } else {
          board[row][col] = temp;
        }
      }
      attempts++;
    }
    
    return board;
  }

  // Generate a solved board
  const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  for (let i = 0; i < 9; i++) {
    const randomIndex = Math.floor(Math.random() * numbers.length);
    board[0][i] = numbers[randomIndex];
    numbers.splice(randomIndex, 1);
  }
  
  solveBoard(board);
  const solution = board.map(row => [...row]);
  const puzzle = removeNumbers(board.map(row => [...row]), difficulty);
  
  return [solution, puzzle];
}

// Add reset stats button
const resetStatsBtn = document.createElement('button');
resetStatsBtn.textContent = 'Reset Stats';
resetStatsBtn.onclick = () => {
  localStorage.removeItem('solved');
  localStorage.removeItem('fastest');
  localStorage.removeItem('leaderboard');
  solvedEl.textContent = '0';
  fastestEl.textContent = '--';
  alert('Stats have been reset.');
};
document.querySelector('.controls').appendChild(resetStatsBtn);

// Add leaderboard functionality
function updateLeaderboard(time) {
  let leaderboard = JSON.parse(localStorage.getItem('leaderboard') || '[]');
  leaderboard.push({
    time: time,
    date: new Date().toLocaleDateString()
  });
  leaderboard.sort((a, b) => a.time.localeCompare(b.time));
  leaderboard = leaderboard.slice(0, 5); // Keep top 5
  localStorage.setItem('leaderboard', JSON.stringify(leaderboard));
}

// Add leaderboard display
function showLeaderboard() {
  const leaderboard = JSON.parse(localStorage.getItem('leaderboard') || '[]');
  const modal = document.getElementById('modal');
  const modalContent = modal.querySelector('.modal-content');
  
  modalContent.innerHTML = `
    <h3>🏆 Leaderboard</h3>
    ${leaderboard.length ? 
      leaderboard.map((entry, i) => `
        <p>${i + 1}. ${entry.time} - ${entry.date}</p>
      `).join('') :
      '<p>No records yet!</p>'
    }
    <button onclick="document.getElementById('modal').classList.add('hidden')">Close</button>
  `;
  
  modal.classList.remove('hidden');
}

// Add leaderboard button
const leaderboardBtn = document.createElement('button');
leaderboardBtn.textContent = '🏆 Leaderboard';
leaderboardBtn.onclick = showLeaderboard;
document.querySelector('.controls').appendChild(leaderboardBtn);
