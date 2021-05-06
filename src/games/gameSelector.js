import cloneDeep from 'lodash.clonedeep';

// import all games here
import { game0 as t3 } from './tic-tac-toe/tic-tac-toe.js';
import { game0 as blackjack } from './blackjack/blackjack.js';

const games = [
  t3,
  blackjack
];

export const selectGame = function(name, config = {}) {
  // TODO: Check for valid key and throw error if necessary
  // TODO: If I implement a proper reset() function then the clone won't be necessary.
  // let newGame = cloneDeep(games.filter(g => g.meta.name === name)[0]);
  let newGame = games.filter(g => g.meta.name === name)[0].reset();
  // Apply any configuration
  newGame = newGame.configureGame(config);
  // TODO: Add a boot() function which will allow dynamic aspects of the game 
  // to be constructred. For instance, a gameboard whose size depends upon 
  // the number of players defined in configuration.
  return newGame;
}

export const getMeta = function() {
  return games.map(g => g.meta);
}

export const getConfig = function() {
  return games.map(g => ({name: g.meta.name, conf: g.config}));
}