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
      roads: []
    },

    /**
     * 
     */
    setup(centroidSpacing = 100, numCentroidsAcross = 5, game = this) {
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
   * Decorators allow methods defined in gameCore to be modified.
   * NOTE: These are called from gameCore.
   * Alternatively you can overwrite gameCore methods, but that usually 
   * requires more code.
   */
   decorators: {

   }
};