import cloneDeep from 'lodash.clonedeep';

// import all games here
import { game0 } from './tic-tac-toe/tic-tac-toe.mjs';

export const selectGame = function(name) {
  let game = null;
  switch(name) {
    case 'tic-tac-toe':
      game = cloneDeep(game0);
      break;
    default:
      game = cloneDeep(game0);
  }

  return game;
}