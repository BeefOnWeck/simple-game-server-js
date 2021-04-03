import { gameCore } from '../gameCore.js';
import { standardDeck52, shuffle } from './standardDeck52.js'

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

    deck: standardDeck52,

    playerHands: {},

    discardPile: []
  },

  shuffleDeck(game = this) {

    const shuffledDeck = shuffle(game.state.deck);

    return {
      ...game,
      state: {
        ...game.state,
        deck: shuffledDeck
      }
    };
  },

  // TODO: Consider allowing the first player to cut the deck at a specified position.

  drawCard(playerId, faceUpOrDown = 'faceDown', game = this) {
    let deck = game.state.deck;
    const card = deck.shift(); // Remove top card
    
    let playerHands = game.state.playerHands;
    let discardPile = game.state.discardPile;
    // TODO: Throw errors for failed checks
    if (playerId) {
      if (playerId in playerHands) {
        // Add card to player hand (faceDown by default)
        playerHands[playerId][faceUpOrDown].unshift(card);
      }
    } else {
      // Add card to discard pile
      discardPile.unshift(card);
    }

    return {
      ...game,
      state: {
        ...game.state,
        deck: deck,
        playerHands: playerHands,
        discardPile: discardPile
      }
    }
  },

  /** 
   * Decorators allow methods defined in gameCore to be modified.
   * NOTE: These are called from gameCore.
   * Alternatively you can overwrite gameCore methods, but that usually 
   * requires more code.
   */
   decorators: {

    /** When adding a player, initialize their hand. */
    addPlayer(gameToDecorate) {

      let playerList = gameToDecorate.players;

      let playerHands = playerList.reduce((acc, cv, ci) => {
        return {
          ...acc,
          [cv.id]: {
            faceDown: [],
            faceUp: []
          }
        }
      }, {});

      // Return the updated game with the updated players mixed in.
      return {
        ...gameToDecorate,
        state: {
          ...gameToDecorate.state,
          playerHands: playerHands
        }
      };
    },

  }

};