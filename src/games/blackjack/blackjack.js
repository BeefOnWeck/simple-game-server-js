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

    maxNumPlayers: 2,

    maxRounds: 10

  },

  /** 
   * Game-specific state information.
   * Changes via player actions.
   */
  state: {

    deck: standardDeck52,

    playerFunds: [],

    playerBets: [],

    playerHands: {},

    dealerHand: {
      faceDown: [],
      faceUp: []
    },

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

  /**
   * 
   */
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
   * 
   */
  makeBet(playerId, betAmount, game = this) {

    let updatedPlayerBets = [
      ...game.state.playerBets,
      {
        id: playerId,
        amount: betAmount
      }
    ];
    
    return {
      ...game,
      state: {
        ...game.state,
        playerBets: updatedPlayerBets
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

      const maxNumPlayers = gameToDecorate.config.maxNumPlayers;

      if (gameToDecorate.numPlayers > maxNumPlayers) {
        throw new Error('Cannot add player; exceeds maximum number of players.');
      }

      // Do we have two players yet?
      // Skip setup and move directly to the play phase and the first round.
      let updatedGame = gameToDecorate.numPlayers == maxNumPlayers ?
        gameToDecorate.nextPhase().nextPhase().nextRound() :
        gameToDecorate;

      let playerList = updatedGame.players;

      let playerHands = playerList.reduce((acc, cv, ci) => {
        return {
          ...acc,
          [cv.id]: {
            faceDown: [],
            faceUp: []
          }
        }
      }, {});

      let playerFunds = playerList.map((cv, ci) => {
        return {
          id: cv.id,
          amount: 100 // TODO: Should this be configurable?
        }
      });

      // Return the updated game with the updated players mixed in.
      return {
        ...updatedGame,
        state: {
          ...updatedGame.state,
          playerHands: playerHands,
          playerFunds: playerFunds
        }
      };
    },

    /** 
     * Replaces game.state with a sanitized version where other player 
     * faceDown cards are replaced with just the number of cards they 
     * have facedown. The deck and discard pile are similarly sanitized.
     */
    getGameStatus(playerId, gameToDecorate) {

      // Get a reference to playerHands
      const playerHands = gameToDecorate.state.playerHands;

      // Make a copy, but protect the faceDown cards in other player hands
      let privatePlayerHands = {};
      for (const pid in playerHands) {
        let faceUp = playerHands[pid]['faceUp'];
        let faceDown = pid == playerId ?
          playerHands[pid]['faceDown'] :
          playerHands[pid]['faceDown'].length;

        privatePlayerHands[pid] = {
          faceUp: faceUp,
          faceDown: faceDown
        };
      }

      // Return the player hands, with other player faceDown cards replaced 
      // with the number of cards face down.
      // Also just return the number of cards in the deck and discard pile.
      return {
        state: {
          ...gameToDecorate.state,
          deck: gameToDecorate.state.deck.length,
          discardPile: gameToDecorate.state.discardPile.length,
          playerHands: privatePlayerHands
        }
      };
    },

  }

};