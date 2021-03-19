import express from 'express';
import { createServer } from 'http';
import { Server as socketio } from 'socket.io';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { selectGame } from './games/gameSelector.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

let game = selectGame('tic-tac-toe'); // Get a mutable reference to gameCore
game = game.nextPhase(); // boot --> setup
// TODO: Players can't join until setup phase begins

// TODO: This will eventually be defined via a configuration page.
const MAX_PLAYERS = 2;
const MAX_NUM_ROUNDS = 10;

const app = express();

// Configuration page
// TODO: Protect this with basic auth
app.use('/css', express.static(__dirname + '/../public/css'));
app.use('/js', express.static(__dirname + '/../node_modules/micromodal/dist'));
console.log(__dirname + '/../node_modules/micromodal/dist');
app.set('view engine', 'ejs');
app.get('/', (req, res) => {
  res.render('configuration-page', {});
});

// TODO: Add a route for accessing current game state

// TODO: Add a POST route for starting a new game

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
    console.log('username', username);
    game = game.addPlayer(username, socket.id);
    if (game.numPlayers === MAX_PLAYERS) { // We have all the players, start the game
      // TODO: Once we enter the play phase, players can't join anymore
      game = game.nextPhase().nextRound(); // setup --> play (turn 1)
      io.emit('game-state', { // TODO: Refactor this so games can decide what gets sent
        phase: game.phase, 
        turn: game.turn,
        activePlayer: game.activePlayerId,
        players: game.players,
        state: game.state
      });
      // Tell player 1 it's their turn
      io.to(game.firstPlayerId).emit('start-your-turn', {}); // TODO: Consider sending list of actions here? Also send state
      // This is a point where things could break (if player 1 doesn't get the message, we're stuck)
      // How to ensure we get confirmation?
      // Send with acknowledgement: https://socket.io/docs/v3/emitting-events/
    }
  });

  // Respond to player actions here
  socket.on('player-actions', actions => {
    game = game.processActions(actions);
  });

  // When a player ends their turn, tell the next player it's their turn
  // Broadcast state at the end of each player's turn
  socket.on('end-my-turn', () => {
    console.log('Player is done:', game.activePlayerId); // TODO: Confirm this message is actually from the active player
    // TODO: Process the actions in a meaningful way
    // But first let's just go to the next player
    game = game.nextPlayer();
    io.emit('game-state', { // TODO: Refactor this so games can decide what gets sent
      phase: game.phase, 
      turn: game.turn,
      activePlayer: game.activePlayerId,
      players: game.players,
      state: game.state,
      winner: game.theWinner
    });
    io.to(game.activePlayerId).emit('start-your-turn', {});
  });
});
