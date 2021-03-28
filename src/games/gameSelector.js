import cloneDeep from 'lodash.clonedeep';

// import all games here
import { game0 } from './tic-tac-toe/tic-tac-toe.js';

const games = [
  game0
];

export const selectGame = function(name, config = {}) {
  // TODO: Check for valid key and throw error if necessary
  let newGame = cloneDeep(games.filter(g => g.meta.name === name)[0]);
  // Apply any configuration
  // TODO: Check for valid configuration keys
  for (const cfg in config) {
    newGame.config[cfg] = config[cfg];
  }
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