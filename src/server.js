import express from 'express';
import { createServer } from 'http';
import { Server as socketio } from 'socket.io';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { selectGame, getMeta, getConfig } from './games/gameSelector.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Initialize empty game object
let game = {};

// TODO: This will eventually be defined via a configuration page.
const MAX_PLAYERS = 2;
const MAX_NUM_ROUNDS = 10;

// Our express application handles all incoming requests
const app = express();

// GET route for configuration page
// TODO: Protect this with basic auth
app.use('/assets', express.static(__dirname + '/../views/assets'));
app.use('/css', express.static(__dirname + '/../views/css'));
app.use('/js/third', express.static(__dirname + '/../node_modules/micromodal/dist'));
app.use('/js', express.static(__dirname + '/../views/js'));
app.set('view engine', 'ejs');
app.get('/', (req, res) => {
  res.render('configuration-page', {
    meta: getMeta(),
    config: getConfig()
  });
});

// GET route for current game stats
app.get('/status', (req, res) => {
  // TODO: Don't respond until game is actually started
  let jsonResp = {};
  if ('getGameStatus' in game) {
    jsonResp = game.getGameStatus();
  }
  res.json(jsonResp);
});

// POST route for starting a new game
app.use(express.json());
app.post('/start', (req, res) => {
  console.log(req.body);
  let selectedGame = req.body.selectedGame; // TODO: Validate!!!
  game = selectGame(selectedGame); // Get a mutable reference to gameCore
  game = game.nextPhase(); // boot --> setup
});

// Create an HTTP server using our app
const httpServer = createServer(app);

// Attach a socket.io instance to our server
const io = new socketio(httpServer, {
  cors: {
    origin: 'http://localhost:8080',
    methods: ["GET"]
  }
});

// Listen for incoming HTTP and WS requests
httpServer.listen(3000);
console.log('Listening on port 3000');

// When a player's client makes the socket.io connection
io.on('connection', socket => { // TODO: Reject if we already have all the players
  console.log('Player connected!', socket.id);

  // When a player sends their name
  // NOTE: We may want to generalize this in case setup is more than just 
  //       picking a name. What if players need to take turns placing pieces 
  //       in the game?
  socket.on('send-user-name', (username, callback) => {
    // TODO: Throw error on null or empty name?
    socket.username = username === null ? '' : username;
    console.log('username', username);

    // TODO: Upgrade to Node 14 so we can use nullish coalescing
    if (game.phase && game.phase === 'boot') {
      callback({status: 'Setup has not started yet'});
    } else if (game.phase && game.phase == 'setup') {
      // Add them to the game
      // TODO: Test on more than 2 players
      game = game.addPlayer(username, socket.id);
      callback({status: 'You have been added'});
    
      if (game.phase === 'play') {
        // TODO: Also announce start of game?
        io.emit('game-state', // TODO: Rename message to 'game-status'
          game.getGameStatus()
        );
        // Tell player 1 it's their turn
        io.to(game.firstPlayerId).emit('start-your-turn', {});

        // This is a point where things could break (if player 1 doesn't get the message, we're stuck)
        // How to ensure we get confirmation?
        // Send with acknowledgement: https://socket.io/docs/v3/emitting-events/
      }

    } else if (game.phase && game.phase == 'play') {
      callback({status: 'Game has already started'});
    } else {
      callback({status: 'Game has not booted yet'});
    }

  });

  // When a player sends their action(s)
  socket.on('player-actions', actions => {
    if (game.phase === 'play') {
      if (socket.id === game.activePlayerId) {
        game = game.processActions(actions);
      } else {
        socket.emit('It is not your turn', {});
      }
    } else {
      socket.emit('Play has not started yet', {});
    }
  }); 

  // When a player ends their turn
  socket.on('end-my-turn', () => {
    if (game.phase === 'play') {
      if (socket.id === game.activePlayerId) {
        console.log('Player is done:', game.activePlayerId);
        // But first let's just go to the next player
        game = game.nextPlayer();
        io.emit('game-state', // TODO: Rename message to 'game-status'
          game.getGameStatus()
        );
        io.to(game.activePlayerId).emit('start-your-turn', {});
      } else {
        socket.emit('It is not your turn', {});
      }
    } else {
      socket.emit('Play has not started yet', {});
    }
  });

});