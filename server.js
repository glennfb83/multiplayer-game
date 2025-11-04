const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

// Game State (for 2 players)
let players = {};
let scores = {};

function randomPosition() {
  return {
    x: Math.floor(Math.random() * 400),
    y: Math.floor(Math.random() * 400),
  };
}

io.on('connection', (socket) => {
  if (Object.keys(players).length < 2) {
    players[socket.id] = {
      ...randomPosition(),
      color: Object.keys(players).length === 0 ? "red" : "blue",
      id: socket.id
    };
    scores[socket.id] = 0;
  }

  socket.emit('init', { players, scores, yourId: socket.id });

  io.emit('update', { players, scores });

  socket.on('move', (data) => {
    if (players[socket.id]) {
      players[socket.id].x = data.x;
      players[socket.id].y = data.y;

      // Tagging logic
      const ids = Object.keys(players);
      if (ids.length === 2 && ids[0] !== ids[1]) {
        const [a, b] = [players[ids[0]], players[ids[1]]];
        const dx = a.x - b.x, dy = a.y - b.y;
        if (Math.sqrt(dx*dx + dy*dy) < 40) {
          scores[socket.id]++;
          // Reset positions
          players[ids[0]] = { ...randomPosition(), color: a.color, id: ids[0] };
          players[ids[1]] = { ...randomPosition(), color: b.color, id: ids[1] };
          io.emit('tagged', { scores });
          if (scores[socket.id] >= 10) {
            io.emit('winner', { winner: players[socket.id].color });
            // Reset
            scores = {};
            players = {};
          }
        }
      }
      io.emit('update', { players, scores });
    }
  });

  socket.on('disconnect', () => {
    delete players[socket.id];
    delete scores[socket.id];
    io.emit('update', { players, scores });
  });
});

http.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
