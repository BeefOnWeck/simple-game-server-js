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
      playerResources: {}
    },

    /**
     * 
     */
    setup(numCentroidsAcross = 5, game = this) {
      let updatedGame = {...game};

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
    let updatedGame = {...game};

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
  requiredResources: {
    road: {
      block: 1,
      timber: 1
    },
    village: {
      block: 1,
      timber: 1,
      fiber: 1,
      cereal: 1
    },
    burgh: {
      rock: 3,
      cereal: 2
    }
  },

  /**
   * 
   */
  buildRoad(roadIndex, playerId, game = this) {

    let updatedGame = {...game};

    updatedGame = updatedGame.deductResources(playerId,['block','timber']);

    let roads = updatedGame.state.roads;
    let nodes = updatedGame.state.nodes;

    if (roads[roadIndex].playerId != null) {
      throw new Error('Cannot build a road on top of an existing road.');
    }

    // Do either of the nodes connected by this road contain a building by this player?
    let noAdjacentBuilding = true;
    let thisRoad = roads[roadIndex];
    let [node1,node2] = thisRoad.inds;
    if ((nodes[node1].playerId == playerId) || (nodes[node2].playerId == playerId)) noAdjacentBuilding = false;

    // Is there an adjacent road owned by this player?
    let adjacentRoads = roads.filter(r => {
      return ((r.inds[0] == node1)
          || (r.inds[1] == node1)
          || (r.inds[0] == node2)
          || (r.inds[1] == node2))
        && (r.playerId == playerId);
    });

    if (noAdjacentBuilding && adjacentRoads.length == 0) {
      throw new Error('Roads have to be built next to other roads or buildings you own.');
    }

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

    let updatedGame = {...game};
    let nodes = updatedGame.state.nodes;

    if (buildingType == 'village') {
      updatedGame = updatedGame.deductResources(playerId,['block','timber','fiber','cereal']);
    } else if (buildingType == 'burgh') {
      updatedGame = updatedGame.deductResources(playerId,['rock','rock','rock','cereal','cereal']);
    } // TODO: Else throw error

    if (buildingType == 'village' && nodes[nodeIndex].buildingType == 'village') {
      throw new Error('Cannot place a village on a space that already has a village.');
    }

    // Finding adjacent nodes
    let roads = updatedGame.state.roads;
    let adjacentNodes = roads.filter(r => {
      // returns true for roads that include nodeIndex
      return (r.inds[0] == nodeIndex) || (r.inds[1] == nodeIndex);
    }).map(r => {
      // returns the index connecting to nodeIndex
      let rv = (r.inds[0] == nodeIndex) ? r.inds[1] : r.inds[0];
      return rv;
    });

    // Check if there are buildings in adjacent spaces
    let adjacentBuilding = false;
    adjacentNodes.forEach(n => {
      if (nodes[n].buildingType != null) adjacentBuilding = true;
    });

    if (adjacentBuilding == true) {
      throw new Error('Cannot place a building there; you must respect the two-space rule.')
    }

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
   * 
   */
  assignResources(playerId, resourceTypes=[], game = this) {

    if (Array.isArray(resourceTypes) == false) {
      resourceTypes = [resourceTypes];
    }

    let updatedGame = {...game};

    let playerResources = updatedGame.state.playerResources;

    if (playerId in playerResources) {
      resourceTypes.forEach(rt => {
        // TODO: Throw error on else or if invalid resourceType
        playerResources[playerId][rt] += 1;
      })
    } 

    return {
      ...updatedGame,
      state: {
        ...updatedGame.state,
        playerResources: playerResources
      }
    };

  },

  /**
   * 
   */
   deductResources(playerId, resourceTypes=[], game = this) {

    if (Array.isArray(resourceTypes) == false) {
      resourceTypes = [resourceTypes];
    }

    let updatedGame = {...game};

    let playerResources = updatedGame.state.playerResources;

    if (playerId in playerResources) {
      resourceTypes.forEach(rt => {
        // TODO: Throw error on else or if invalid resourceType
        if (playerResources[playerId][rt] > 0) {
          playerResources[playerId][rt] -= 1;
        } else {
          throw new Error('Cannot deduct resource.');
        }
      })
    } // TODO: Else

    return {
      ...updatedGame,
      state: {
        ...updatedGame.state,
        playerResources: playerResources
      }
    };

  },

  /**
   * 
   */
  findNeighboringNodes(hexagonIndex, game=this) {

    let vertices = game.state.hexagons[hexagonIndex].poly;

    return game.state.nodes.reduce((acc, n, ind) => {
      let updatedAccumulator = [...acc];
      if (vertices.some(v => { return v.x === n.x && v.y === n.y; })) {
        updatedAccumulator = [
          ...updatedAccumulator,
          ind
        ];
      }

      return updatedAccumulator;

    },[]);

  },

  /**
   * 
   */
   findNeighboringHexagons(nodeIndex, game=this) {

    let nodeCoordinates = {
      x: game.state.nodes[nodeIndex].x,
      y: game.state.nodes[nodeIndex].y
    };

    return game.state.hexagons.reduce((acc, h, ind) => {
      let updatedAccumulator = [...acc];
      if (h.poly.some(v => { 
        return v.x === nodeCoordinates.x && v.y === nodeCoordinates.y; 
      })) {
        updatedAccumulator = [
          ...updatedAccumulator,
          ind
        ];
      }

      return updatedAccumulator;

    },[]);

  },

  /**
   * 
   */
  resolveRoll(game = this) {

    let updatedGame = {...game};

    const rollResult = updatedGame.state.rollResult;

    const rolledHexagons = updatedGame.state.hexagons.reduce((acc, h, ind) => {
      let updatedAccumulator = [...acc];
      if (h.number == rollResult) {
        updatedAccumulator = [
          ...updatedAccumulator,
          {
            ind: ind,
            resource: h.resource
          }
        ];
      }
      return updatedAccumulator;
    },[]);

    rolledHexagons.forEach(h => {
      const neighborNodes = updatedGame.findNeighboringNodes(h.ind);
      neighborNodes.forEach(n => {
        const pid = updatedGame.state.nodes[n].playerId;
        updatedGame = updatedGame.assignResources(pid,h.resource);
      });
    });

    return {
      ...updatedGame
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
          roads: [],
          rollResult: 0,
          playerResources: {}
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

      let playerResources = updatedPlayerList.reduce((acc,cv) => {
        return {
          ...acc,
          [cv.id]: {
            block: 0,
            timber: 0,
            fiber: 0,
            cereal: 0,
            rock: 0
          }
        }
      }, {});

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
        players: updatedPlayerList,
        state: {
          ...gameToDecorate.state,
          playerResources: playerResources
        }
      };
    },

    /** 
     * 
     */
     getGameStatus(playerId, gameToDecorate) {
      return {
        theWinner: gameToDecorate.theWinner ?? null
      };
    },

    /**
     * Players are only allowed to adjust the game via a set of pre-defined actions.
     */
     processActions(gameToDecorate) {
      // TODO: Handle multiple actions
      let actions = gameToDecorate.actions;
      let actionName = Object.keys(actions)[0];
      let action = actions[actionName];

      if (actionName == 'roll-dice') {
        return gameToDecorate
          .rollDice()
          .resolveRoll();
      }

    }

   }
};