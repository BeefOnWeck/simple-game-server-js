import { gameCore } from '../gameCore.js';

/** @typedef {object} game */

/** Tic Tac Toe */
export const game0 = {
  ...gameCore, // Copy core game object and mixin (last in wins)

  /** Metadata for describing a particular game */
  meta: {
    name: 'Tic Tac Toe',
    avatar: 'https://upload.wikimedia.org/wikipedia/commons/3/32/Tic_tac_toe.svg' // public domain image
  },

  /** Game-specific configuration */
  config: {
    /** Only two possile marks in this two player game. */
    marks: ['x','o']
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
    /** A 3x3 grid of cells capable of holding a mark from a player. */
    grid: Array.from({length:9}, (v,i) => {
      return {
        /** @type {string} */
        mark: null,
        row: Math.floor(i / 3),
        col: i % 3
      }
    })
  },

  /**
   * Apply a player's mark to the grid.
   * @function
   * @param {string} playerId - The socket ID of the player
   * @param {number} row - The row to add the mark
   * @param {number} col - The column to add the mark
   * @returns {game}
   */
  makeMark(playerId, row, col, game = this) {
    const playerMark = game.players.filter(p => p.id === playerId).map(p => p.mark)[0];

    const updatedGrid = game.state.grid.map(grd => {
      if (grd.row === row && grd.col === col) {
        grd.mark = playerMark; // TODO: Check that there isn't mark here already
      }
      return grd;
    });

    return {
      ...game, // NOTE: game = this (the object calling this method)
      state: {
        ...game.state,
        grid: updatedGrid
      }
    }
  },

  /** 
   * Examines the grid and tries to find a winning player
   * @returns {game} 
   */
  findTheWinner(game = this) {
    // The indices of the 1x9 grid array which correspond with three in a row
    const possibleThreeInARows = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
      [0, 4, 8], [2, 4, 6] // diags
    ];

    // Find the winning cells by reducing over the possibilities and the grid.
    const winningCells = possibleThreeInARows.reduce((acc,p3r) => {
      const possibleCells = game.state.grid.reduce((pc,cc,ci) => {
        if (ci === p3r[0] || ci === p3r[1] || ci === p3r[2]) {
          return pc.length === 0 ?
            [cc] :
            pc[pc.length-1].mark === cc.mark  && cc.mark != null ?
            pc.concat(cc) :
            [cc];
        } else {
          return pc;
        }
      },[]);
      return possibleCells.length === 3 ?
        acc.concat(possibleCells) :
        acc;
    },[]);

    const winningMark = winningCells.length === 3 ?
      winningCells[0].mark :
      null;

    const winningPlayer = game.players.filter(
      p => p.mark === winningMark).map(
      p => p.id
    )[0];

    if (winningPlayer) {
      game = game.nextPhase(); // play --> end
    }

    return {
      ...game, // NOTE: game = this (the object calling this method)
      theWinner: winningPlayer
    }
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
      let grid = gameToDecorate.state.grid;
      grid = grid.map(g => {
        return {
          ...g,
          mark: null
        }
      });
      return {
        config: {
          marks: ['x', 'o']
        },
        theWinner: null,
        state: {
          grid
        }
      }
    },

    /** Add `theWinner` to the list of game stats */
    getGameStatus(_playerId, gameToDecorate) {
      return {
        theWinner: gameToDecorate.theWinner ?? null
      };
    },

    /** When adding a player, assign them a mark to use ('x' or 'o') */
    addPlayer(gameToDecorate) {

      if (gameToDecorate.numPlayers > 2) {
        throw new Error('Cannot add player; exceeds maximum number of players.');
      }

      // Do we have two players yet?
      // Skip setup and move directly to the play phase and the first round.
      let updatedGame = gameToDecorate.numPlayers == 2 ?
        gameToDecorate.nextPhase().nextPhase().nextRound() :
        gameToDecorate;

      let updatedPlayerList = gameToDecorate.players
        .map((p,i) => ({
          ...p,
          mark: gameToDecorate.config.marks[i]
        }));

      // Return the updated game with the updated players mixed in.
      return {
        ...updatedGame,
        players: updatedPlayerList
      };
    },

    /** Auto-increment the round when going back to the first player. */
    nextPlayer(gameToDecorate) {
      // Note this is the next player set in gameCore.nextPlayer().
      let activePlayerIndex = gameToDecorate.players.findIndex(p => {
        return p.id === gameToDecorate.activePlayerId
      });
      // Increment the round if we're back to the first player
      return {
        round: activePlayerIndex === 0 ? 
          gameToDecorate.round + 1 : 
          gameToDecorate.round,
      }
    },

    /** Handle make-mark action */
    processActions(gameToDecorate) {
      // TODO: Handle multiple actions
      if ('make-mark' in gameToDecorate.actions) {
        let pid = gameToDecorate.actions['make-mark'].pid;
        let ind = gameToDecorate.actions['make-mark'].ind;
        let row = Math.floor(ind / 3);
        let col = ind % 3;
        return gameToDecorate.makeMark(pid, row, col).findTheWinner();
      }
    }

  }
};
