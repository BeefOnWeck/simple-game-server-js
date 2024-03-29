// import all games here
import { game0 as t3 } from './tic-tac-toe/tic-tac-toe.js';
import { game0 as blackjack } from './blackjack/blackjack.js';
import { game0 as hexagon } from './hexagon-island/hexagon-island.js'

const games = [
  t3,
  blackjack,
  hexagon
];

export const selectGame = function(name, config = {}) {
  // TODO: Check for valid key and throw error if necessary
  let newGame = games.filter(g => g.meta.name === name)[0].reset();
  // Apply any configuration
  newGame = newGame.configureGame(config);

  return newGame;
}

export const getMeta = function() {
  return games.map(g => g.meta);
}

export const getConfig = function() {
  return games.map(g => ({name: g.meta.name, conf: g.config}));
}

export const bindToGame = function(gameToBind) {
  const getGame = () => gameToBind;
  const setGame = (newGame) => gameToBind = newGame;
  return [getGame,setGame];
};