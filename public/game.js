const socket = io();
let myId = null;
let players = {};
let scores = {};
let gameboard = document.getElementById('gameboard');
let scoreboard = document.getElementById('scoreboard');
let statusDiv = document.getElementById('status');

function drawBoard() {
  gameboard.innerHTML = '';
  Object.values(players).forEach(player => {
    let sq = document.createElement('div');
    sq.className = 'square';
    sq.style.left = player.x + 'px';
    sq.style.top = player.y + 'px';
    sq.style.background = player.color;
    sq.innerText = player.color === 'red' ? "🟥" : "🟦";
    sq.style.color = "#fff";
    sq.style.textAlign = "center";
    sq.style.lineHeight = "40px";
    gameboard.appendChild(sq);
  });
}

function updateScore() {
  scoreboard.innerText = Object.values(players).map(player => {
    return `${player.color}: ${scores[player.id] || 0}`;
  }).join(' | ');
}

document.addEventListener('keydown', (e) => {
  if (!myId || !players[myId]) return;
  let dx = 0, dy = 0;
  switch (e.key) {
    case 'ArrowUp': dy = -20; break;
    case 'ArrowDown': dy = 20; break;
    case 'ArrowLeft': dx = -20; break;
    case 'ArrowRight': dx = 20; break;
  }
  let nx = Math.max(0, Math.min(410, players[myId].x + dx));
  let ny = Math.max(0, Math.min(410, players[myId].y + dy));
  socket.emit('move', { x: nx, y: ny });
});

socket.on('init', (data) => {
  myId = data.yourId;
  players = data.players;
  scores = data.scores;
  drawBoard();
  updateScore();
});

socket.on('update', (data) => {
  players = data.players;
  scores = data.scores;
  drawBoard();
  updateScore();
});

socket.on('tagged', (data) => {
  scores = data.scores;
  updateScore();
  statusDiv.innerText = "Tag!";
  setTimeout(()=> statusDiv.innerText = '', 400);
});

socket.on('winner', ({ winner }) => {
  statusDiv.innerHTML = `<span id="winnerMsg">${winner.toUpperCase()} WINS!</span>`;
  setTimeout(()=> statusDiv.innerHTML = '', 3000);
});
