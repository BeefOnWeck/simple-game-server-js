import express from 'express';
import { createServer } from 'http';
import { Server as socketio } from 'socket.io';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import process from 'process';
import dotenv from 'dotenv';
import { selectGame, getMeta, getConfig, bindToGame } from './games/gameSelector.js';
import { joinHandler, rejoinHandler, actionHandler, endTurnHandler } from './socketHandlers.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config();

// Bind empty game object to a function scope so we can access and update game state
// from anywhere we pass the returned hooks getGame() and setGame().
const [getGame,setGame] = bindToGame({});

// Our express application handles all incoming requests
const app = express();

// GET route for configuration page
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
  let game = getGame();
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
  let game = selectGame(selectedGame, gameConfiguration);
  setGame(game);
  res.send('Game started');
});

// Create an HTTP server using our app
const httpServer = createServer(app);

// Attach a socket.io instance to our server
const io = new socketio(httpServer, {
  cors: {
    origin: process.env.CLIENT_ORIGIN,
    methods: ["GET"]
  },
  transports: ['websocket']
});

// Listen for incoming HTTP and WS requests
const port = process.env.PORT || 3000;
httpServer.listen(port);
console.log('Listening on port', port);

// Bind socket.io event handlers to the io server and the game state hooks.
const join = joinHandler(io, getGame, setGame);
const rejoin = rejoinHandler(io, getGame, setGame);
const action = actionHandler(io, getGame, setGame);
const endTurn = endTurnHandler(io, getGame, setGame);

// When a player's client makes the socket.io connection
io.on('connection', socket => { // TODO: Reject if we already have all the players
  console.log('Player connected!', socket.id);

  // Link socket.io event handlers to specific incoming message types
  socket.on('send-user-name', join(socket));
  socket.on('reconnect-user-name', rejoin(socket));
  socket.on('player-actions', action(socket)); 
  socket.on('end-my-turn', endTurn(socket));
});
