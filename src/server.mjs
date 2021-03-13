import express from 'express';
import { createServer } from 'http';
import { Server as socketio } from 'socket.io';
import { gameCore } from './game.mjs';

let game = gameCore; // Get a mutable reference to gameCore
game = game.nextPhase(); // boot --> setup
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
    game = game.addPlayer(username, socket.id);
    if (game.numPlayers === MAX_PLAYERS) { // We have all the players, start the game
      // TODO: Once we enter the play phase, players can't join anymore
      game = game.nextPhase().nextRound(); // setup --> play (turn 1)
      // TODO: Refactor and send complete state
      io.emit('game-state', [game.phase, game.turn, game.activePlayerId]);
      // Tell player 1 it's their turn
      io.to(game.firstPlayerId).emit('start-your-turn', {}); // TODO: Consider sending list of actions here? Also send state
      // This is a point where things could break (if player 1 doesn't get the message, we're stuck)
      // How to ensure we get confirmation?
      // Send with acknowledgement: https://socket.io/docs/v3/emitting-events/
    }
  });

  // Respond to player actions here
  // When a player ends their turn, tell the next player it's their turn
  // Broadcast state at the end of each player's turn
  socket.on('player-actions', actions =>{
    console.log('Player is done:', game.activePlayerId); // TODO: Confirm this message is actually from the active player
    // TODO: Process the actiosn in a meaningful way
    // But first let's just go to the next player
    game = game.nextPlayer();
    io.emit('game-state', [game.phase, game.round, game.activePlayerId]);
    io.to(game.activePlayerId).emit('start-your-turn', {});
  });
});
