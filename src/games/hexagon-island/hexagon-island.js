import { gameCore } from '../gameCore.js';
import { setupGameBoard } from './hexagonGameBoard.js';

/** @typedef {object} game */

/** Hexagon Island */
export const game0 = {
    ...gameCore, // Copy core game object and mixin (last in wins)
  
    /** Metadata for describing a particular game */
    meta: {
      name: 'Hexagon Island',
      avatar: 'https://upload.wikimedia.org/wikipedia/commons/7/7f/Giants_causeway_closeup.jpg' // public domain image
    },
  
    /** Game-specific configuration */
    config: {
      /** The number of players that will join the game. */
      configNumPlayers: 2,
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
      centroids: [],
      nodes: [],
      hexagons: [],
      numbers: [],
      roads: [],
      rollResult: 0
    },

    /**
     * 
     */
    setup(centroidSpacing = 1, numCentroidsAcross = 5, game = this) {
      let updatedGame = game;

      const { centroids, nodes, hexagons, numbers, roads } = 
        setupGameBoard(centroidSpacing, numCentroidsAcross);

      return {
        ...updatedGame,
        state: {
          ...updatedGame.state,
          centroids: centroids,
          nodes: nodes,
          hexagons: hexagons,
          numbers: numbers,
          roads: roads
        }
      }
    },

  /**
   * 
   */
  rollDice(game = this) {
    let updatedGame = game;

    const dieResult1 = Math.floor(Math.random() * 6) + 1;
    const dieResult2 = Math.floor(Math.random() * 6) + 1;

    const rollResult = dieResult1 + dieResult2;

    return {
      ...updatedGame,
      state: {
        ...updatedGame.state,
        rollResult: rollResult
      }
    };

  },

  /**
   * 
   */
  buildRoad(roadIndex, playerId, game = this) {

    // TODO: Throw error if invalid parameters
    let updatedGame = game;

    let roads = updatedGame.state.roads;

    roads[roadIndex].playerId = playerId;

    return {
      ...updatedGame,
      state: {
        ...updatedGame.state,
        roads: roads
      }
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
          configNumPlayers: 2
        },
        theWinner: null,
        state: {
          ...gameToDecorate.state,
          centroids: [],
          nodes: [],
          hexagons: [],
          numbers: [],
          roads: []
        }
      }
    },

    /** 
     * 
     */
     addPlayer(gameToDecorate) {
      // TODO: Throw an error if someone tries to pick "DEALER" as their username

      const configNumPlayers = parseInt(gameToDecorate.config.configNumPlayers);

      if (gameToDecorate.numPlayers > configNumPlayers) {
        throw new Error('Cannot add player; exceeds maximum number of players.');
      }

      // let currentActions = gameToDecorate.currentActions;

      // Do we have the configured number of players yet?
      // Skip setup and move directly to the play phase and the first round.
      if (gameToDecorate.numPlayers == configNumPlayers) {
        let boardWidth = Math.max(5, configNumPlayers + 1);
        gameToDecorate = gameToDecorate.nextPhase().setup(100, boardWidth);
        gameToDecorate = gameToDecorate.nextPhase().nextRound();
        // currentActions = ['make-initial-bet'];

        // TODO: Allow player order to be randomized here
      }


      // Return the updated game with the updated players mixed in.
      return {
        ...gameToDecorate
      };
    },

    /** 
     * 
     */
     getGameStatus(playerId, gameToDecorate) {
      return {
        theWinner: gameToDecorate.theWinner ?? null
      };
    }

   }
};