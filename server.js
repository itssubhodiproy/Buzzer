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
  occupiedSeats: new Set(), // Set of occupied seat numbers
  adminLoggedIn: false, // Track if admin is logged in
  seatToWebSocket: {} // Map seat number to WebSocket connection
};

// Admin password (hardcoded)
const ADMIN_PASSWORD = 'admin123'; // Change this to your desired password

// Serve static files
app.use(express.static('public'));

// WebSocket connection handler
wss.on('connection', (ws) => {
  console.log('New client connected');
  
  // Track which seat/role this connection has
  ws.contestantNumber = null;
  ws.isAdmin = false;

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
      // Check if this WebSocket already has a seat
      if (ws.contestantNumber) {
        // Release old seat first
        gameState.occupiedSeats.delete(ws.contestantNumber);
        delete gameState.contestants[ws.contestantNumber];
        delete gameState.seatToWebSocket[ws.contestantNumber];
      }

      // Check if seat already occupied by another connection
      if (gameState.occupiedSeats.has(data.contestant)) {
        // Check if it's occupied by a disconnected client
        const existingWs = gameState.seatToWebSocket[data.contestant];
        if (existingWs && existingWs.readyState === WebSocket.CLOSED) {
          // Old connection is dead, allow takeover
          gameState.occupiedSeats.delete(data.contestant);
          delete gameState.contestants[data.contestant];
          delete gameState.seatToWebSocket[data.contestant];
        } else {
          // Seat genuinely taken by active connection
          ws.send(JSON.stringify({
            type: 'seat_taken',
            data: { contestant: data.contestant }
          }));
          return;
        }
      }

      // Register contestant
      ws.contestantNumber = data.contestant;
      gameState.occupiedSeats.add(data.contestant);
      gameState.contestants[data.contestant] = true;
      gameState.seatToWebSocket[data.contestant] = ws;
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
      delete gameState.seatToWebSocket[data.contestant];
      ws.contestantNumber = null;
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

    if (data.type === 'admin_login') {
      // Check password and admin availability
      if (gameState.adminLoggedIn) {
        ws.send(JSON.stringify({
          type: 'admin_taken',
          data: { message: 'Admin is already logged in' }
        }));
        return;
      }

      if (data.password === ADMIN_PASSWORD) {
        gameState.adminLoggedIn = true;
        ws.isAdmin = true;
        ws.send(JSON.stringify({
          type: 'admin_success',
          data: { message: 'Login successful' }
        }));
        console.log('Admin logged in');

        // Broadcast admin status
        broadcast({
          type: 'admin_status',
          data: { adminLoggedIn: true }
        });
      } else {
        ws.send(JSON.stringify({
          type: 'admin_failed',
          data: { message: 'Incorrect password' }
        }));
      }
    }

    if (data.type === 'admin_logout') {
      gameState.adminLoggedIn = false;
      ws.isAdmin = false;
      console.log('Admin logged out');

      // Broadcast admin status
      broadcast({
        type: 'admin_status',
        data: { adminLoggedIn: false }
      });
    }

    if (data.type === 'check_admin') {
      // Check if admin is logged in
      ws.send(JSON.stringify({
        type: 'admin_status',
        data: { adminLoggedIn: gameState.adminLoggedIn }
      }));
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    
    // Clean up on disconnect
    if (ws.contestantNumber) {
      gameState.occupiedSeats.delete(ws.contestantNumber);
      delete gameState.contestants[ws.contestantNumber];
      delete gameState.seatToWebSocket[ws.contestantNumber];
      console.log(`Contestant ${ws.contestantNumber} disconnected - seat released`);
      
      // Broadcast updated seats
      broadcast({
        type: 'seats_update',
        data: { occupiedSeats: Array.from(gameState.occupiedSeats) }
      });
    }
    
    if (ws.isAdmin) {
      gameState.adminLoggedIn = false;
      console.log('Admin disconnected - admin released');
      
      // Broadcast admin status
      broadcast({
        type: 'admin_status',
        data: { adminLoggedIn: false }
      });
    }
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