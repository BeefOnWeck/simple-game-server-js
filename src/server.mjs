import express from 'express';
import { createServer } from 'http';
import { Server as socketio } from 'socket.io';
import { game } from './game.mjs';

let game1 = game; // Get a mutable reference to game
game1 = game1.nextPhase(); // boot --> setup
// TODO: Players can't join until setup phase begins

// TODO: This will eventually be defined via a configuration page.
const MAX_PLAYERS = 2;
const MAX_NUM_ROUNDS = 10;

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

io.on('connection', socket => { // TODO: Reject if we already have all the players
  console.log('Player connected!', socket.id);

  // After connecting, each player sends us their user name
  socket.on('send-user-name', username => {
    socket.username = username;
    game1 = game1.addPlayer(username, socket.id);
    if (game1.numPlayers === MAX_PLAYERS) { // We have all the players, start the game
      // TODO: Once we enter the play phase, players can't join anymore
      game1 = game1.nextPhase().nextRound(); // setup --> play (turn 1)
      // TODO: Refactor and send complete state
      io.emit('game-state', [game1.phase, game1.turn, game1.activePlayerId]);
      // Tell player 1 it's their turn
      io.to(game1.firstPlayerId).emit('start-your-turn', {}); // TODO: Consider sending list of actions here? Also send state
      // This is a point where things could break (if player 1 doesn't get the message, we're stuck)
      // How to ensure we get confirmation?
      // Send with acknowledgement: https://socket.io/docs/v3/emitting-events/
    }
  });

  // Respond to player actions here
  // When a player ends their turn, tell the next player it's their turn
  // Broadcast state at the end of each player's turn
  socket.on('player-actions', actions =>{
    console.log('Player is done:', game1.activePlayerId); // TODO: Confirm this message is actually from the active player
    // TODO: Process the actiosn in a meaningful way
    // But first let's just go to the next player
    game1 = game1.nextPlayer();
    io.emit('game-state', [game1.phase, game1.round, game1.activePlayerId]);
    io.to(game1.activePlayerId).emit('start-your-turn', {});
  });
});


// This is how things get set in motion. We pass the game object into this module.
// We define [emitting-events](https://socket.io/docs/v3/emitting-events/) for 
// when players respond with their actions. We respond by sending the updated state 
// to all players and then move to the next player (possibly incrementing the turn).
// We will have to wait until we get all players connected before we start the play phase.
