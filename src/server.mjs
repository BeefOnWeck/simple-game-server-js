import express from 'express';
import { createServer } from 'http';
import { Server as socketio } from 'socket.io';
import { game } from './game.mjs';

const app = express();
const httpServer = createServer(app);

const io = new socketio(httpServer, {
  cors: {
    origin: 'http://localhost:8080',
    methods: ["GET"]
  }
});

httpServer.listen(3000);
console.log('Listening on port 3000');

io.on('connection', socket => {
  console.log('Player connected!', socket.id);
  
});

// This is how things get set in motion. We pass the game object into this module.
// We define [emitting-events](https://socket.io/docs/v3/emitting-events/) for 
// when players respond with their actions. We respond by sending the updated state 
// to all players and then move to the next player (possibly incrementing the turn).
// We will have to wait until we get all players connected before we start the play phase.
// Transition between boot and setup phases?
// We need the configuration page to send a POST request with the configuration parameters 
// (like number of players and what game we're playing).
// Initially, instead of a configuration page, we will just hard code them.