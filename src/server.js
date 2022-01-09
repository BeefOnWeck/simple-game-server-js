import express from 'express';
import { createServer } from 'http';
import { Server as socketio } from 'socket.io';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import process from 'process';
import dotenv from 'dotenv';
import { selectGame, getMeta, getConfig } from './games/gameSelector.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config();

// Initialize empty game object
let game = {};

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
  let gameConfiguration = req.body.configuration; // TODO: Validate!!!
  game = selectGame(selectedGame, gameConfiguration); // Get a mutable reference to gameCore
  res.send('Game started');
});

// Create an HTTP server using our app
const httpServer = createServer(app);

// Attach a socket.io instance to our server
const io = new socketio(httpServer, {
  cors: {
    origin: process.env.CLIENT_ORIGIN,
    methods: ["GET"]
  }
});

// Listen for incoming HTTP and WS requests
const port = process.env.PORT || 3000;
httpServer.listen(port);
console.log('Listening on port', port);

// When a player's client makes the socket.io connection
io.on('connection', socket => { // TODO: Reject if we already have all the players
  console.log('Player connected!', socket.id);

  // When a player sends their name
  // NOTE: We may want to generalize this in case setup is more than just 
  //       picking a name. What if players need to take turns placing pieces 
  //       in the game?
  socket.on('send-user-name', (username, callback) => {
    // TODO: Throw error on null or empty name? That should happen in game.
    socket.username = username ?? '';
    console.log('username', username);

    if (game.phase && game.phase == 'boot') {
      // Add them to the game
      try {
        game = game.addPlayer(username, socket.id);
        callback({status: 'You have been added'});
      } catch (e) {
        callback({status: e.message});
      }
    
      if (game.phase == 'setup' || game.phase == 'play') {
        // Send game status to each player
        game.players.forEach(player => {
          io.to(player.id).emit('game-state',
            game.getGameStatus(player.id)
          );
        });
        // Tell player 1 it's their turn
        io.to(game.firstPlayerId).emit('it-is-your-turn', 
          game.possibleActions
        );

        // This is a point where things could break (if player 1 doesn't get the message, we're stuck)
        // How to ensure we get confirmation?
        // Send with acknowledgement: https://socket.io/docs/v3/emitting-events/
      }

    } else if (game.phase && (game.phase == 'setup' || game.phase == 'play')) {
      callback({status: 'Game has already booted'});
    } else {
      callback({status: 'Game has not booted yet'});
    }

  });

  // When a player sends their action(s)
  socket.on('player-actions', (actions, callback) => {
    if (game.phase == 'setup' || game.phase === 'play') {
      if (socket.id === game.activePlayerId) {
        try {
          game = game.processAction(actions);
          game.players.forEach(player => {
            io.to(player.id).emit('game-state',
              game.getGameStatus(player.id)
            );
          });
          io.to(game.activePlayerId).emit('it-is-your-turn',
            game.possibleActions
          );
        } catch (e) {
          callback({status: e.message});
        }
      } else {
        callback({status: 'It is not your turn'});
      }
    } else {
      callback({status: 'Play has not started yet'});
    }
  }); 

  // When a player ends their turn
  socket.on('end-my-turn', (_, callback) => {
    if (game.phase === 'setup' || game.phase === 'play') {
      if (socket.id === game.activePlayerId) {
        try {
          game = game.nextPlayer();
          game.players.forEach(player => {
            io.to(player.id).emit('game-state',
              game.getGameStatus(player.id)
            );
          });
          io.to(game.activePlayerId).emit('it-is-your-turn',
            game.possibleActions
          );
        } catch (e) {
          callback({status: e.message});
        }
      } else {
        callback({status: 'It is not your turn'});
      }
    } else {
      callback({status: 'Play has not started yet'});
    }
  });

});
