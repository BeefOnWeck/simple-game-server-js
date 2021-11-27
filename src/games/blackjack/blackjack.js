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
   * The socket ID of the winning player.
   * @type {string}
   */
   theWinner: null,

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

  /**
   * Draws a card, face up or down, for a player.
   * @function
   * @param {string} playerId - The socket ID of the player
   * @param {string} faceUpOrDown - Is the card drawn face up or down
   * @returns {game}
   */
  drawCard(playerId, faceUpOrDown = 'faceDown', game = this) {
    let deck = game.state.deck;

    // If the deck is empty, reshuffle in the discards
    if (deck.length == 0) {
      game = game.reshuffleDiscards();
    }

    const card = deck.shift(); // Remove top card
    if (card == undefined) {
      throw new Error('There are no more cards left to draw.');
    }
    
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
        discardPile.unshift(card);
      }
      while( (card = playerHands[playerId]['faceDown'].shift()) != undefined ) {
        discardPile.unshift(card);
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
   * Reshuffles the discard pile back into the deck.
   * @param {game} game 
   * @returns {game}
   */
  reshuffleDiscards(game = this) {
    // NOTE: game = this (the object calling this method)
    let updatedGame = {...game};
    
    let discardPile = updatedGame.state.discardPile;
    let deck = updatedGame.state.deck;

    let card;
    while( (card = discardPile.shift()) != undefined ) {
      deck.unshift(card);
    }

    updatedGame = updatedGame.shuffleDeck();

    return {
      ...updatedGame,
      state: {
        ...updatedGame.state,
        deck: deck,
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
   * Sets a player's bet for the round.
   * @function
   * @param {string} playerId - The socket ID of the player
   * @param {number} betAmount - The amount of the player's bet
   * @returns {game} game
   */
  makeBet(playerId, betAmount, game = this) {

    // TODO: Bet cannot be larger than what the player has
    if (game.allowableActions != 'make-initial-bet') {
      throw new Error('It is not the time for making bets.')
    }

    let playersFundAmount = game.state.playerFunds
      .filter(fund => fund.id == playerId)[0].amount;

    if (betAmount > playersFundAmount) {
      throw new Error('You don\'t have enough money to cover that bet.')
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
   * Sets a player's move for the round.
   * @param {string} playerId - The socket ID of the player
   * @param {string} move - One of: Hit, Stand, Double, or Surrender
   * @returns {game} game
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

    // Adjust player bet, if necessary.
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
   * Scores the cards in the player's hand.
   * @function
   * @param {string} playerId - The socket ID of the player
   * @returns {number} - The total score of their hand 
   */
  scoreHand(playerId, game = this) {
    let playerHands = game.state.playerHands;
    let cards;

    // Go through player hand and select all the cards
    if (playerId in playerHands) {
      cards = playerHands[playerId]['faceUp'].concat(
        playerHands[playerId]['faceDown']
      );
    } else {
      // TODO: Throw error.
    }

    // Return their score
    return game.scoreCards(cards);
  },

  /**
   * Scores cards.
   * @param {array} cards - An array of cards
   * @returns {number} finalScore - The total score
   */
  scoreCards(cards, game = this) {
    // Treat aces differently since they can either count as 1 or 10
    let aces = cards.filter(card => card.rank == 'A');
    let nonAces = cards.filter(card => card.rank != 'A');

    // First find the score without the aces
    let initialScore = nonAces.reduce((score, card) => {
      return score + game.scoreOfNonAceCard(card);
    },0);

    // Then add the aces in one at a time
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
   * Get the score of a non-ace card.
   * @function
   * @param {object} card - The non-ace card.
   * @returns {number} The score
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
   * Resolve the dealer hand by drawing cards until the score is at least 17.
   * @function
   * @returns {game}
   */
  resolveDealerHand(game = this) {
    let dealerScore;
    while( (dealerScore = game.scoreHand('DEALER')) < 17 ) {
      game = game.drawCard('DEALER', 'faceUp');
    }

    return game;
  },

  /**
   * Finds the player with the most funds and sets them as the winner.
   * @function
   * @return {game}
   */
  findTheWinner(game = this) {
    let updatedGame = {...game};

    let playerFunds = updatedGame.state.playerFunds;

    // Reduce over player funds and select the one with the largest amount
    let theWinner = playerFunds.reduce( (acc, fund) => {
      if (fund.amount > acc.amount) {
        return fund;
      } else {
        return acc;
      }
    },{
      pid: null,
      amount: 0
    }).id; // <--

    return {
      ...updatedGame,
      theWinner: theWinner
    };
  },

  /** 
   * Decorators allow methods defined in gameCore to be modified.
   * NOTE: These are called from gameCore.
   * Alternatively you can overwrite gameCore methods, but that usually 
   * requires more code.
   */
   decorators: {

    /** 
     * Games are responsible for resetting state and any other 
     * properties they create.
     */
    reset(gameToDecorate) {
      return {
        config: {
          configNumPlayers: 2,
          maxRounds: 10
        },
        theWinner: null,
        state: {
          ...gameToDecorate.state,
          discardPile: [],
          playerFunds: [],
          playerBets: [],
          playerHands: {
            DEALER: {
              faceDown: [],
              faceUp: []
            }
          }
        }
      }
    },

    /** 
     * When adding a player, initialize their hand and funds. Also start 
     * the game once we have enough players.
     */
    addPlayer(gameToDecorate) {
      // TODO: Throw an error if someone tries to pick "DEALER" as their username

      const configNumPlayers = gameToDecorate.config.configNumPlayers;

      if (gameToDecorate.numPlayers > configNumPlayers) {
        throw new Error('Cannot add player; exceeds maximum number of players.');
      }

      let allowableActions = gameToDecorate.allowableActions;

      // Do we have the configured number of players yet?
      // Skip setup and move directly to the play phase and the first round.
      if (gameToDecorate.numPlayers == configNumPlayers) {
        gameToDecorate = gameToDecorate.nextPhase().shuffleDeck();
        gameToDecorate = gameToDecorate.nextPhase().nextRound();
        allowableActions = ['make-initial-bet'];
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
        allowableActions: allowableActions,
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
        theWinner: gameToDecorate.theWinner ?? null,
        state: {
          ...gameToDecorate.state,
          deck: gameToDecorate.state.deck.length,
          discardPile: gameToDecorate.state.discardPile.length,
          playerHands: privatePlayerHands
        }
      };
    },

    /**
     * Most of the game logic gets executed within this function:
     * - Each round consists of players betting and then making moves.
     * - After players make their bets they receive their cards.
     * - After all players have their cards, the dealer gets their cards.
     * - After all players have made their moves their hands can be scored
     * and their bets can be resolved.
     */
    nextPlayer(gameToDecorate) {
      // NOTE: We do not need to create a copy of game since that has 
      //       already been done in gameCore.nextPlayer().

      // Note this is the "next player" incremented in gameCore.nextPlayer().
      let activePlayerIndex = gameToDecorate.players.findIndex(p => {
        return p.id === gameToDecorate.activePlayerId
      });

      // Gather the allowableActions and round so we can update them
      let allowableActions = gameToDecorate.allowableActions;
      let round = gameToDecorate.round;

      // If we're back at the first player
      if (activePlayerIndex == 0) {
        // If allowableActions is already set to 'make-move' this means that 
        // all players have already made their moves for the last round and 
        // that we're starting a new round.
        if (allowableActions.includes('make-move')) {
          
          // So we need to finish up the last round, ...
          gameToDecorate = gameToDecorate.resolveDealerHand()
            .turnAllCardsFaceUp()
            .resolvePlayerBets();

          // ...reset allowableActions to 'make-initial-bet', ...
          allowableActions = [
            'make-initial-bet'
          ];

          // ...and increment the round.
          round = round + 1;
          
          // Check to see if the game is over and who the winner is
          if (round > gameToDecorate.config.maxRounds) {
            gameToDecorate = gameToDecorate.nextPhase(); // play --> end
            gameToDecorate = gameToDecorate.findTheWinner();
          }

        } else if (allowableActions.includes('make-initial-bet')) {
          // If we have moved back to the first player and all players have placed 
          // their bets, that means it is time for players to make their moves.
          if (gameToDecorate.state.playerBets.length == gameToDecorate.numPlayers) {
            // But first, the dealer gets to draw their cards.
            gameToDecorate = gameToDecorate.discardCards('DEALER');
            gameToDecorate = gameToDecorate.drawCard('DEALER').drawCard('DEALER', 'faceUp');
            // This will indicate to the players they need to make their move.
            allowableActions = [
              'make-move'
            ];
          }
        }
      }

      return {
        ...gameToDecorate,
        round: round,
        allowableActions: allowableActions
      }
    },

    /**
     * Players are only allowed to adjust the game via a set of pre-defined actions.
     */
    processAction(gameToDecorate) {
      let action = gameToDecorate.currentAction;
      let actionName = Object.keys(action)[0];
      let actionValue = action[actionName];

      if (actionName == 'make-initial-bet') {
        let pid = actionValue.pid;
        let amount = actionValue.amount;
        return gameToDecorate
          .discardCards(pid) // discard cards from last round
          .makeBet(pid, amount)
          .drawCard(pid)
          .drawCard(pid, 'faceUp');
      } else if (actionName == 'make-move') {
        let pid = actionValue.pid;
        let move = actionValue.move;
        return gameToDecorate
          .makeMove(pid, move);
      }

    }

  }

};