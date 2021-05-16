import { gameCore } from '../gameCore.js';
import { setupGameBoard } from './hexagonGameBoard.js';

/** Array of possible player colors */
let colorArray = [
  '#8b0000', // darkred
  '#00008b', // darkblue
  '#006400', // darkgreen
  '#ff8c00', // darkorange
  '#9932cc', // darkorchid
  '#008b8b', // darkcyan
  '#a9a9a9', // darkgrey
  '#bdb76b', // darkkhaki
  '#8b008b', // darkmagenta
  '#556b2f', // darkolivegreen
  '#e9967a', // darksalmon
  '#9400d3', // darkviolet
  '#add8e6', // lightblue
  '#e0ffff', // lightcyan
  '#90ee90', // lightgreen
  '#d3d3d3', // lightgrey
  '#ffb6c1', // lightpink
  '#ffffe0', // lightyellow
];

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
      rollResult: 0,
      playerResources: []
    },

    /**
     * 
     */
    setup(numCentroidsAcross = 5, game = this) {
      let updatedGame = game;

      const centroidSpacing = 100;

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

    let updatedGame = game;

    let roads = updatedGame.state.roads;

    // TODO: Throw error if invalid parameters
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
   * 
   */
   makeBuilding(nodeIndex, playerId, buildingType, game = this) {

    let updatedGame = game;

    let nodes = updatedGame.state.nodes;

    // TODO: Throw error if invalid parameters
    nodes[nodeIndex].playerId = playerId;
    nodes[nodeIndex].buildingType = buildingType;

    return {
      ...updatedGame,
      state: {
        ...updatedGame.state,
        nodes: nodes
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

      let updatedPlayerList = gameToDecorate.players
        .map((p,i) => ({
          ...p,
          color: colorArray[i]
        }));

      // let currentActions = gameToDecorate.currentActions;

      // Do we have the configured number of players yet?
      // Skip setup and move directly to the play phase and the first round.
      if (gameToDecorate.numPlayers == configNumPlayers) {
        let boardWidth = Math.max(5, configNumPlayers + 1);
        gameToDecorate = gameToDecorate.nextPhase().setup(boardWidth);
        gameToDecorate = gameToDecorate.nextPhase().nextRound();
        // currentActions = ['make-initial-bet'];

        // TODO: Allow player order to be randomized here
      }


      // Return the updated game with the updated players mixed in.
      return {
        ...gameToDecorate,
        players: updatedPlayerList
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