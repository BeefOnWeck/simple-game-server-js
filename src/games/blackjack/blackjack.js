import { gameCore } from '../gameCore.js';
import { standardDeck52 } from './standardDeck52.js'

/** @typedef {object} game */

/** Tic Tac Toe */
export const game0 = {
  ...gameCore, // Copy core game object and mixin (last in wins)

  /** Metadata for describing a particular game */
  meta: {
    name: 'Blackjack',
    avatar: 'blackjack.png' // Filename for a 100x100 png
  },

  /** Game-specific configuration */
  config: {

  },

  /** 
   * Game-specific state information.
   * Changes via player actions.
   */
  state: {

    deck: standardDeck52
  }

};