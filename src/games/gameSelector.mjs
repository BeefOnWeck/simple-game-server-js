import cloneDeep from 'lodash.clonedeep';

// import all games here
import { game0 } from './tic-tac-toe/tic-tac-toe.mjs';

const games = [
  game0
];

export const selectGame = function(name) {
  // TODO: Check for valid key and throw error if necessary
  return cloneDeep(games.filter(g => g.meta.name === name)[0]);
}

export const getMeta = function() {
  return games.map(g => g.meta);
}

export const getConfig = function() {
  return games.map(g => ({name: g.meta.name, conf: g.config}));
}