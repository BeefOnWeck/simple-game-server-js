import { gameCore } from '../gameCore.js';
import { standardDeck52, shuffle } from './standardDeck52.js'

/** @typedef {object} game */

/** Tic Tac Toe */
export const game0 = {
  ...gameCore, // Copy core game object and mixin (last in wins)

  /** Metadata for describing a particular game */
  meta: {
    name: 'Blackjack',
    avatar: 'https://upload.wikimedia.org/wikipedia/commons/e/e4/BlackJack6.jpg' // public domain image
  },

  /** Game-specific configuration */
  config: {

    configNumPlayers: 2,

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

    playerHands: {
      DEALER: {
        faceDown: [],
        faceUp: []
      }
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
    if (playerId in playerHands) {
      // Add card to player hand (faceDown by default)
      playerHands[playerId][faceUpOrDown].unshift(card);
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
  discardCards(playerId, game = this) {

    let playerHands = game.state.playerHands;
    let discardPile = game.state.discardPile;
    let card = {};

    if (playerId in playerHands) {
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
      ...game,
      state: {
        ...game.state,
        playerHands: playerHands,
        discardPile: discardPile
      }
    }
  },

  /**
   * 
   */
  showHand(playerId, game = this) {
    // TODO: Refactor to allow methods to share common code
    let playerHands = game.state.playerHands;
    let card = {};

    if (playerId in playerHands) {
      while( (card = playerHands[playerId]['faceDown'].shift()) != undefined ) {
        playerHands[playerId]['faceUp'].unshift(card);
      }
    } else {
      // TODO: Throw error.
    }

    return {
      ...game,
      state: {
        ...game.state,
        playerHands: playerHands
      }
    }
  },

  /**
   * 
   */
  turnAllCardsFaceUp(game = this) {

    let updatedGame = {...game};

    game.players.forEach(player => {
      updatedGame = updatedGame.showHand(player.id);
    });
    updatedGame = updatedGame.showHand('DEALER');

    return {
      ...updatedGame
    }
  },

  /**
   * 
   */
  resolvePlayerBets(game = this) {
    let updatedGame = {...game};

    const dealerScore = updatedGame.scoreHand('DEALER');

    const playerFundArray = updatedGame.players.reduce((acc,player) => {
      const playerScore = updatedGame.scoreHand(player.id);
      const playerBet = updatedGame.state.playerBets
        .filter(bet => bet.id == player.id)[0].amount;

      let playersFundAmount = updatedGame.state.playerFunds
        .filter(fund => fund.id == player.id)[0].amount;

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
        playerFunds: playerFundArray
      }
    };
  },

  /**
   * 
   */
  makeBet(playerId, betAmount, game = this) {

    // TODO: Bet cannot be larger than what the player has

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
        // TODO: Throw error
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
        gameToDecorate = gameToDecorate.nextPhase().nextPhase().nextRound();
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

      if (activePlayerIndex == 0) {
        if (currentActions.includes('make-move')) {
          
          gameToDecorate = gameToDecorate.resolveDealerHand()
            .turnAllCardsFaceUp()
            .resolvePlayerBets();

          currentActions = [
            'make-initial-bet'
          ];

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

      // Increment the round if we're back to the first player
      return {
        ...gameToDecorate,
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