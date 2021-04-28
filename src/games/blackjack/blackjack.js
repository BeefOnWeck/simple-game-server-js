import { gameCore } from '../gameCore.js';
import { standardDeck52, shuffle } from './standardDeck52.js'

/** @typedef {object} game */

/** Blackjack */
export const game0 = {
  ...gameCore, // Copy core game object and mixin (last in wins)

  /** Metadata for describing a particular game */
  meta: {
    name: 'Blackjack',
    avatar: 'https://upload.wikimedia.org/wikipedia/commons/e/e4/BlackJack6.jpg' // public domain image
  },

  /** Game-specific configuration */
  config: {

    /** The number of players that will join the game. */
    configNumPlayers: 2,

    /** The maximum number of rounds before declaring a winner. */
    maxRounds: 10

  },

  /** 
   * Game-specific state information.
   * Changes via player actions.
   */
  state: {

    /** A standard deck of 52 playing cards. */
    deck: standardDeck52,

    /** An array of how much money each player has. */
    playerFunds: [],

    /** An array of the current player bets. */
    playerBets: [],

    /** 
     * Object of face up and face down cards for dealer and all players. 
     */
    playerHands: {
      DEALER: {
        faceDown: [],
        faceUp: []
      }
    },

    /** An array to hold the discarded cards. */
    discardPile: []

  },

  /**
   * Shuffle the deck.
   * @function
   * @returns {game}
   */
  shuffleDeck(game = this) {

    const shuffledDeck = shuffle(game.state.deck);

    return {
      ...game, // NOTE: game = this (the object calling this method)
      state: {
        ...game.state,
        deck: shuffledDeck
      }
    };
  },

  // TODO: Consider allowing the first player to cut the deck at a specified position.

  /**
   * Draws a card, face up or down, for a player.
   * @function
   * @param {string} playerId - The socket ID of the player
   * @param {string} faceUpOrDown - Is the card drawn face up or down
   * @returns {game}
   */
  drawCard(playerId, faceUpOrDown = 'faceDown', game = this) {
    let deck = game.state.deck;
    const card = deck.shift(); // Remove top card
    
    let playerHands = game.state.playerHands;
    let discardPile = game.state.discardPile;
    // TODO: Throw errors for failed checks
    if (playerId in playerHands) {
      // Add card to player hand (faceDown by default)
      playerHands[playerId][faceUpOrDown].unshift(card);
    } else {
      // Add card to discard pile
      discardPile.unshift(card);
    }

    return {
      ...game, // NOTE: game = this (the object calling this method)
      state: {
        ...game.state,
        deck: deck,
        playerHands: playerHands,
        discardPile: discardPile
      }
    }
  },

  /**
   * Discards a player's cards
   * @function
   * @param {string} playerId - The socket ID of the player
   * @returns {game}
   */
  discardCards(playerId, game = this) {

    let playerHands = game.state.playerHands;
    let discardPile = game.state.discardPile;
    let card = {};

    if (playerId in playerHands) {
      // Loop over the face up and face down cards in the player's hand;
      // remove them from the hand and add to the discard pile.
      while( (card = playerHands[playerId]['faceUp'].shift()) != undefined ) {
        discardPile.shift(card);
      }
      while( (card = playerHands[playerId]['faceDown'].shift()) != undefined ) {
        discardPile.shift(card);
      }
    } else {
      // TODO: Throw error.
    }

    return {
      ...game, // NOTE: game = this (the object calling this method)
      state: {
        ...game.state,
        playerHands: playerHands,
        discardPile: discardPile
      }
    }
  },

  /**
   * Turn a player's hand face up.
   * @function
   * @param {string} playerId - The socket ID of the player
   * @returns {game}
   */
  showHand(playerId, game = this) {
    // TODO: Refactor to allow methods to share common code
    let playerHands = game.state.playerHands;
    let card = {};

    if (playerId in playerHands) {
      // Loop over face down cards and make them face up
      while( (card = playerHands[playerId]['faceDown'].shift()) != undefined ) {
        playerHands[playerId]['faceUp'].unshift(card);
      }
    } else {
      // TODO: Throw error.
    }

    return {
      ...game, // NOTE: game = this (the object calling this method)
      state: {
        ...game.state,
        playerHands: playerHands
      }
    }
  },

  /**
   * Turn all player hands face up.
   * @function
   * @returns {game}
   */
  turnAllCardsFaceUp(game = this) {

    // NOTE: game = this (the object calling this method)
    let updatedGame = {...game};

    // Loop over all players and turn their cards face up
    game.players.forEach(player => {
      updatedGame = updatedGame.showHand(player.id);
    });
    updatedGame = updatedGame.showHand('DEALER');

    return {
      ...updatedGame
    }
  },

  /**
   * Compares each player's hand with the dealer's and resolves 
   * their bets accordingly.
   * @function
   * @returns {game}
   */
  resolvePlayerBets(game = this) {
    // NOTE: game = this (the object calling this method)
    let updatedGame = {...game};

    // Get the dealer's score
    const dealerScore = updatedGame.scoreHand('DEALER');

    // Evaluate each player's hand and resolve their bets accordingly.
    const playerFundArray = updatedGame.players.reduce((acc,player) => {

      // Get the player score and their bet
      const playerScore = updatedGame.scoreHand(player.id);
      const playerBet = updatedGame.state.playerBets
        .filter(bet => bet.id == player.id)[0].amount;

      // How much funds does the player have?
      let playersFundAmount = updatedGame.state.playerFunds
        .filter(fund => fund.id == player.id)[0].amount;

      // Adjust player fund based upon their bet and how their 
      // score compared with the dealer's.
      if (playerScore > 21) {
        playersFundAmount = playersFundAmount - playerBet;
      } else {
        if (dealerScore > 21) {
          playersFundAmount = playersFundAmount + playerBet;
        } else {
          if (playerScore > dealerScore) {
            playersFundAmount = playersFundAmount + playerBet;
          } else {
            playersFundAmount = playersFundAmount - playerBet;
          }
        }
      }

      // Each iteration of this reduce() concatenates the player's 
      // adjusted funds.
      return [
        ...acc,
        {
          id: player.id,
          amount: playersFundAmount
        }
      ];
      
    },[]);

    return {
      ...updatedGame,
      state: {
        ...updatedGame.state,
        playerBets: [],
        playerFunds: playerFundArray
      }
    };
  },

  /**
   * 
   */
  makeBet(playerId, betAmount, game = this) {

    // TODO: Bet cannot be larger than what the player has
    if (game.currentActions != 'make-initial-bet') {
      throw new Error('It is not the time for making bets.')
    }

    let updatedPlayerBets = [
      ...game.state.playerBets,
      {
        id: playerId,
        amount: betAmount
      }
    ];
    
    return {
      ...game, // NOTE: game = this (the object calling this method)
      state: {
        ...game.state,
        playerBets: updatedPlayerBets
      }
    }
  },

  /**
   * 
   */
  makeMove(playerId, move, game = this) {

    let updatedGame = {...game};
    let playerBetAmount = updatedGame.state.playerBets
      .filter(bet => bet.id == playerId)[0]['amount'];

    switch(move) {
      case 'Hit':
        updatedGame = updatedGame.drawCard(playerId, 'faceUp');
        break;
      case 'Stand':
        // Do nothing
        break;
      case 'Double':
        updatedGame = updatedGame.drawCard(playerId, 'faceUp');
        playerBetAmount = playerBetAmount * 2;
        break;
      case 'Surrender':
        updatedGame = updatedGame.discardCards(playerId);
        playerBetAmount = playerBetAmount * 0.5;
        break;
      default:
        throw new Error('Unsupported move (note all moves must be capitalized).');
    }

    let playerBets = updatedGame.state.playerBets.map(bet => {
      if (bet.id == playerId) {
        return {
          id: playerId,
          amount: playerBetAmount
        };
      } else {
        return bet;
      }
    })

    return {
      ...updatedGame,
      state: {
        ...updatedGame.state,
        playerBets: playerBets
      }
    };

  },

  /**
   * 
   */
  scoreHand(playerId, game = this) {
    let playerHands = game.state.playerHands;
    let cards;

    if (playerId in playerHands) {
      cards = playerHands[playerId]['faceUp'].concat(
        playerHands[playerId]['faceDown']
      );
    } else {
      // TODO: Throw error.
    }

    return game.scoreCards(cards);
  },

  /**
   * 
   */
  scoreCards(cards, game = this) {
    let aces = cards.filter(card => card.rank == 'A');
    let nonAces = cards.filter(card => card.rank != 'A');

    let initialScore = nonAces.reduce((score, card) => {
      return score + game.scoreOfNonAceCard(card);
    },0);

    let finalScore = aces.reduce((score, card) => {
      if (score <= 10) {
        return score + 11;
      } else {
        return score + 1;
      }
    },initialScore);

    return finalScore;
  },

  /**
   * 
   */
  scoreOfNonAceCard(card) {
    // TODO: Is it worth even having this as a separate function?
    // TODO: Throw error if card is an ace
    if (['J', 'Q', 'K'].includes(card.rank)) {
      return 10;
    } else {
      return parseInt(card.rank);
    }
  },

  /**
   * 
   */
  resolveDealerHand(game = this) {
    let dealerScore;
    while( (dealerScore = game.scoreHand('DEALER')) < 17 ) {
      game = game.drawCard('DEALER', 'faceUp');
    }

    return game;
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
      // TODO: Throw an error if someone tries to pick "DEALER" as their username

      const configNumPlayers = gameToDecorate.config.configNumPlayers;

      if (gameToDecorate.numPlayers > configNumPlayers) {
        throw new Error('Cannot add player; exceeds maximum number of players.');
      }

      let currentActions = gameToDecorate.currentActions;

      // Do we have the configured number of players yet?
      // Skip setup and move directly to the play phase and the first round.
      if (gameToDecorate.numPlayers == configNumPlayers) {
        gameToDecorate = gameToDecorate.nextPhase().shuffleDeck();
        gameToDecorate = gameToDecorate.nextPhase().nextRound();
        currentActions = ['make-initial-bet'];
      }

      let playerList = gameToDecorate.players;

      let playerHands = playerList.reduce((acc,cv) => {
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
        ...gameToDecorate,
        currentActions: currentActions,
        state: {
          ...gameToDecorate.state,
          playerHands: {
            ...gameToDecorate.state.playerHands,
            ...playerHands
          },
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

    /**  */
    nextPlayer(gameToDecorate) {
      // NOTE: We do not need to create a copy of game since that has 
      //       already been done in gameCore.nextPlayer().

      // Note this is the "next player" set in gameCore.nextPlayer().
      let activePlayerIndex = gameToDecorate.players.findIndex(p => {
        return p.id === gameToDecorate.activePlayerId
      });

      let currentActions = gameToDecorate.currentActions;
      let round = gameToDecorate.round;

      // If we're back at the first player
      if (activePlayerIndex == 0) {
        // If currentActions is already set to 'make-move' this means that 
        // all players have already made their moves for the last round.
        if (currentActions.includes('make-move')) {
          
          // So we need to finish up the last round, ...
          gameToDecorate = gameToDecorate.resolveDealerHand()
            .turnAllCardsFaceUp()
            .resolvePlayerBets();

          // ...reset currentActions to 'make-initial-bet', ...
          currentActions = [
            'make-initial-bet'
          ];

          // ...and increment the round.
          round = round + 1;

        } else if (currentActions.includes('make-initial-bet')) {
          // If we have moved back to the first player and all players have placed 
          // their bets, that means it is time for players to make their moves.
          if (gameToDecorate.state.playerBets.length == gameToDecorate.numPlayers) {
            // But first, the dealer gets to draw their cards.
            gameToDecorate = gameToDecorate.drawCard('DEALER').drawCard('DEALER', 'faceUp');

            currentActions = [
              'make-move'
            ];
            
          }
        }
      }

      return {
        ...gameToDecorate,
        round: round,
        currentActions: currentActions
      }
    },

    /**  */
    processActions(gameToDecorate) {
      // TODO: Handle multiple actions
      let actions = gameToDecorate.actions;
      let actionName = Object.keys(actions)[0];
      let action = actions[actionName];

      if (actionName == 'make-initial-bet') {
        let pid = action.pid;
        let amount = action.amount;
        return gameToDecorate
          .makeBet(pid, amount)
          .drawCard(pid)
          .drawCard(pid, 'faceUp');
      }

      if (actionName = 'make-move') {
        let pid = action.pid;
        let move = action.move;
        return gameToDecorate
          .makeMove(pid, move);
      }

    }

  }

};