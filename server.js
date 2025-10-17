// server.js
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Game state
let gameState = {
  locked: false,
  winner: null,
  contestants: {}, // Track occupied seats: { 1: true, 2: true, ... }
  occupiedSeats: new Set() // Set of occupied seat numbers
};

// Serve static files
app.use(express.static('public'));

// WebSocket connection handler
wss.on('connection', (ws) => {
  console.log('New client connected');

  // Send current state to newly connected client
  ws.send(JSON.stringify({
    type: 'state',
    data: gameState
  }));

  ws.on('message', (message) => {
    const data = JSON.parse(message);

    if (data.type === 'buzz' && !gameState.locked) {
      // First buzzer press
      gameState.locked = true;
      gameState.winner = data.contestant;
      
      // Broadcast to all clients
      broadcast({
        type: 'buzzed',
        data: {
          contestant: data.contestant,
          locked: true
        }
      });
    }

    if (data.type === 'reset') {
      // Admin reset
      gameState.locked = false;
      gameState.winner = null;
      
      broadcast({
        type: 'reset',
        data: { locked: false }
      });
    }

    if (data.type === 'register') {
      // Check if seat already occupied
      if (gameState.occupiedSeats.has(data.contestant)) {
        ws.send(JSON.stringify({
          type: 'seat_taken',
          data: { contestant: data.contestant }
        }));
        return;
      }

      // Register contestant
      gameState.occupiedSeats.add(data.contestant);
      gameState.contestants[data.contestant] = true;
      console.log(`Contestant ${data.contestant} registered`);

      // Broadcast updated occupied seats
      broadcast({
        type: 'seats_update',
        data: { occupiedSeats: Array.from(gameState.occupiedSeats) }
      });
    }

    if (data.type === 'leave_seat') {
      // Release seat
      gameState.occupiedSeats.delete(data.contestant);
      delete gameState.contestants[data.contestant];
      console.log(`Contestant ${data.contestant} left`);

      // Broadcast updated occupied seats
      broadcast({
        type: 'seats_update',
        data: { occupiedSeats: Array.from(gameState.occupiedSeats) }
      });
    }

    if (data.type === 'get_seats') {
      // Send current occupied seats to requesting client
      ws.send(JSON.stringify({
        type: 'seats_update',
        data: { occupiedSeats: Array.from(gameState.occupiedSeats) }
      }));
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

// Broadcast to all connected clients
function broadcast(message) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}

const PORT = 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Find your IP and share: http://YOUR_IP:${PORT}`);
});
