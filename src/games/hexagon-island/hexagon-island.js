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
    
    // Copy core game object and mixin (last in wins)
    ...gameCore,
  
    /** Metadata for describing a particular game */
    meta: {
      name: 'Hexagon Island',
      avatar: 'https://upload.wikimedia.org/wikipedia/commons/7/7f/Giants_causeway_closeup.jpg' // public domain image
    },
  
    /** Game-specific configuration */
    config: {
      /** The number of players that will join the game. */
      configNumPlayers: 2,
      /** */
      scoreToWin: 10,
      /** */
      gameBoardWidth: 5
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
      playerResources: {},
      brigandIndex: null
    },

    /**
     * Sets up the hexagon island gameboard and adds it to the game state.
     * @param {Number} numCentroidsAcross Width of island at center
     * @param {game} game 
     * @returns {game}
     */
    setup(numCentroidsAcross = 5, game = this) {
      
      // NOTE: game = this (the object calling this method)
      let updatedGame = {...game};

      const centroidSpacing = 100;

      const { centroids, nodes, hexagons, numbers, roads } = 
        setupGameBoard(centroidSpacing, numCentroidsAcross);

      const brigandIndex = hexagons
        .map((h,i) => ({ind: i, resource: h.resource}))
        .filter(h => h.resource === 'desert')
        .map(h => h.ind)[0];

      return {
        ...updatedGame,
        state: {
          ...updatedGame.state,
          centroids: centroids,
          nodes: nodes,
          hexagons: hexagons,
          numbers: numbers,
          roads: roads,
          brigandIndex: brigandIndex
        }
      }
    },

  /**
   * Roll two dice, combine the numbers, and add the result to the game state.
   * @param {game} game 
   * @returns {game}
   */
  rollDice(game = this) {
    
    // NOTE: game = this (the object calling this method)
    let updatedGame = {...game};

    if (!updatedGame.possibleActions.includes('rollDice')) {
      throw new Error('It is not time to roll the dice.');
    }

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
   * Object containing the resources necessary for building different structures.
   * @type {Object}
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
   * Builds a road for a particular player.
   * @param {number} roadIndex The index for the road being built
   * @param {string} playerId The ID for the player building the road
   * @param {boolean} requirePayment Is payment required?
   * @param {game} game 
   * @returns {game}
   */
  buildRoad(roadIndex, playerId, requirePayment = true, game = this) {
    
    // NOTE: game = this (the object calling this method)
    let updatedGame = {...game};

    if (updatedGame.activePlayerId && playerId != updatedGame.activePlayerId) {
      throw new Error('It is not your turn.');
    }

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

    if (requirePayment) {
      updatedGame = updatedGame.deductResources(playerId,['block','timber']);
    }

    return {
      ...updatedGame,
      state: {
        ...updatedGame.state,
        roads: roads
      }
    };

  },

  /**
   * Constructs a building for a particular player.
   * @param {number} roadIndex The index for the building being constructed
   * @param {string} playerId The ID for the player doing the construction
   * @param {string} buildingType The type of building to construct
   * @param {boolean} requirePayment Is payment required?
   * @param {game} game 
   * @returns {game}
   */
   makeBuilding(nodeIndex, playerId, buildingType, requirePayment = true, game = this) {

    // NOTE: game = this (the object calling this method)
    let updatedGame = {...game};

    let nodes = updatedGame.state.nodes;
    let roads = updatedGame.state.roads;

    if (updatedGame.activePlayerId && playerId != updatedGame.activePlayerId) {
      throw new Error('It is not your turn.');
    }

    if (buildingType == 'village' && nodes[nodeIndex]?.buildingType == 'village') {
      throw new Error('Cannot place a village on a space that already has a village.');
    }

    // Finding adjacent nodes
    let adjacentNodes = roads.filter(r => {
      // returns true for roads that include nodeIndex
      return (r.inds[0] == nodeIndex) || (r.inds[1] == nodeIndex);
    }).map(r => {
      // returns the index connecting to nodeIndex
      let rv = (r.inds[0] == nodeIndex) ? r.inds[1] : r.inds[0];
      return rv;
    });

    // Check if there are buildings on adjacent nodes
    let adjacentBuilding = false;
    adjacentNodes.forEach(n => {
      if (nodes[n]?.buildingType != null) adjacentBuilding = true;
    });

    if (adjacentBuilding == true) {
      throw new Error('Cannot place a building there; you must respect the two-space rule.')
    }

    // Is there an adjacent road owned by this player?
    let adjacentRoads = roads.filter(r => {
      return (
        (
          r.inds[0] == nodeIndex
          || r.inds[1] == nodeIndex
        ) 
        && r.playerId == playerId
      );
    });

    if (updatedGame.phase == 'play' && adjacentRoads.length == 0) {
      throw new Error('Must place building next to a road you own.');
    }

    // TODO: Throw error if invalid parameters
    nodes[nodeIndex].playerId = playerId;
    nodes[nodeIndex].buildingType = buildingType;

    if (requirePayment) {
      if (buildingType == 'village') {
        updatedGame = updatedGame.deductResources(playerId,['block','timber','fiber','cereal']);
      } else if (buildingType == 'burgh') {
        updatedGame = updatedGame.deductResources(playerId,['rock','rock','rock','cereal','cereal']);
      }
    }

    return {
      ...updatedGame,
      state: {
        ...updatedGame.state,
        nodes: nodes
      }
    };

  },

  /**
   * Assigns one or more resources to a player.
   * @param {string} playerId The ID of the player getting the resources
   * @param {Array.<string>} resourceTypes An array of resource types to give the player
   * @param {game} game 
   * @returns {game}
   */
  assignResources(playerId, resourceTypes=[], game = this) {

    // NOTE: game = this (the object calling this method)
    let updatedGame = {...game};
    
    if (Array.isArray(resourceTypes) == false) {
      resourceTypes = [resourceTypes];
    }

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
   * Deduct resources from a player.
   * @param {string} playerId The ID of player
   * @param {Array.<string>} resourceTypes An array of resource types to deduct
   * @param {game} game 
   * @returns 
   */
  deductResources(playerId, resourceTypes=[], game = this) {

    // NOTE: game = this (the object calling this method)
    let updatedGame = {...game};

    if (Array.isArray(resourceTypes) == false) {
      resourceTypes = [resourceTypes];
    }

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
   * Given a hexagon, find the indices for the surrounding nodes (vertices).
   * @param {number} hexagonIndex The index of the hexagon in question
   * @param {game} game 
   * @returns 
   */
  findNeighboringNodes(hexagonIndex, game=this) {

    const vertices = game.state.hexagons[hexagonIndex].vertices;

    return game.state.nodes.reduce((acc, n, ind) => {
      // If this node matches any of the vertices for this hexagon...
      if (vertices.some(v => { return v.x === n.x && v.y === n.y; })) {
        // ... add its index to the list.
        acc = [
          ...acc,
          ind
        ];
      }
      return acc;
    }, []);

  },


  /**
   * Given a node, find the indices of the neighboring hexagons.
   * @param {number} nodeIndex 
   * @param {game} game 
   * @returns 
   */
  findNeighboringHexagons(nodeIndex, game=this) {

    let nodeCoordinates = {
      x: game.state.nodes[nodeIndex].x,
      y: game.state.nodes[nodeIndex].y
    };

    return game.state.hexagons.reduce((acc, h, ind) => {
      // If one of the vertices for this hexagon matches the node...
      if (h.vertices.some(v => { 
        return v.x === nodeCoordinates.x && v.y === nodeCoordinates.y; 
      })) {
        // ... add its index to the list.
        acc = [
          ...acc,
          ind
        ];
      }
      return acc;
    }, []);

  },

  /**
   * Resolve the effects from rolling the dice.
   * @param {game} game 
   * @returns {game}
   */
  resolveRoll(game = this) {

    // NOTE: game = this (the object calling this method)
    let updatedGame = {...game};

    const rollResult = updatedGame.state.rollResult;

    if (rollResult == 7) {
      updatedGame.possibleActions = ['moveBrigand'];
    }

    const rolledHexagons = updatedGame.state.hexagons.reduce((acc, h, ind) => {
      // If this hexagon's number matches the roll and the brigand isn't here...
      if (h.number == rollResult && ind != updatedGame.state.brigandIndex) {
        // ... add it to the list.
        acc = [
          ...acc,
          {
            ind: ind,
            resource: h.resource
          }
        ];
      }
      return acc;
    }, []);

    // Loop over the hexagons with matching numbers and assign the appropriate 
    // resources to players on each node.
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
   * 
   */
  actionStateTransition: {
    setupVillagesAndRoads: [
      'rollDice'
    ],
    rollDice: [
      'trade',
      'useDevCard',
      'buildStuff',
      'buyDevCard',
      'endTurn'
    ],
    moveBrigand: [
      'trade',
      'useDevCard',
      'buildStuff',
      'buyDevCard',
      'endTurn'
    ],
    trade: [
      'trade',
      'useDevCard',
      'buildStuff',
      'endTurn'
    ],
    useDevCard: [
      'trade',
      'buildStuff',
      'endTurn'
    ],
    buildStuff: [
      'buyDevCard',
      'endTurn'
    ],
    buyDevCard: [
      'buildStuff',
      'endTurn'
    ],
    endTurn: [
      'rollDice'
    ]
  },

  /**
   * Updates what actions are possible given the current action
   * @param {game} game 
   * @returns 
   */
  updatePossibleActions(game=this) {

    // NOTE: game = this (the object calling this method)
    let updatedGame = {...game};

    let currentAction = updatedGame.currentAction;
    let currentActionName = Object.keys(currentAction)[0];
    let possibleActions = updatedGame.possibleActions;

    // Using De Morgan's Law, update possibleActions only if a moveBrigand action 
    // has been triggered but not acted upon yet.
    if (
      currentActionName == 'moveBrigand' || 
      possibleActions.includes('moveBrigand') == false
    ) {
      possibleActions = updatedGame.actionStateTransition[currentActionName];
    }
    
    return {
      ...updatedGame,
      possibleActions: possibleActions
    };

  },

  /**
   * Called after each build action, this function checks to see if anyone has 
   * accumlated enough points to win the game.
   * @param {game} game 
   * @returns {game}
   */
  findTheWinner(game=this) {

    // NOTE: game = this (the object calling this method)
    let updatedGame = {...game};

    const theWinner = updatedGame.players.reduce((acc,p) => {
      // The score for this player based upon their buildings and roads
      const buildingScore = updatedGame.state.nodes.filter(n => n.playerId == p.id).length;
      const score = buildingScore; // TODO: Add bonuses (e.g., longest road)
      if (score >= updatedGame.config.scoreToWin) return p.id;
      else return acc;
    }, null);

    if (theWinner != null) {
      updatedGame = updatedGame.nextPhase();
    }

    return {
      ...updatedGame,
      theWinner: theWinner
    };

  },

  /**
   * Moves the brigand to the specified index.
   * @param {number} index 
   * @param {game} game 
   * @returns 
   */
  moveBrigand(index, game=this) {
    const updatedGame = {...game};

    // TODO: Check that the new index fits

    return {
      ...updatedGame,
      state: {
        ...updatedGame.state,
        brigandIndex: index
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

    /** 
     * Games are responsible for resetting state and any other 
     * properties they create.
     */
     reset(gameToDecorate) {
      return {
        config: {
          configNumPlayers: 2,
          scoreToWin: 10,
          gameBoardWidth: 5
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
          playerResources: {},
          brigandIndex: null
        }
      }
    },

    /**
     * Hexagon Island specific `addPlayer()` logic.
     * @param {game} gameToDecorate game object to decorate
     * @returns {game}
     */
    addPlayer(gameToDecorate) {
      // TODO: Throw an error if someone tries to pick "DEALER" as their username

      const configNumPlayers = parseInt(gameToDecorate.config.configNumPlayers);
      const gameBoardWidth = parseInt(gameToDecorate.config.gameBoardWidth);

      if (gameToDecorate.numPlayers > configNumPlayers) {
        throw new Error('Cannot add player; exceeds maximum number of players.');
      }

      // Assign player colors
      let updatedPlayerList = gameToDecorate.players
        .map((p,i) => ({
          ...p,
          color: colorArray[i]
        }));

      // Initialize player resources
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

      let possibleActions = gameToDecorate.possibleActions;

      // Do we have the configured number of players yet?
      // If yes, setup the board and start the setup phase.
      if (gameToDecorate.numPlayers == configNumPlayers) {
        let boardWidth = gameBoardWidth; //Math.max(5, configNumPlayers + 5);
        gameToDecorate = gameToDecorate.setup(boardWidth).nextPhase();
        possibleActions = ['setupVillagesAndRoads'];
      }

      // Return the updated game with the updated players mixed in.
      return {
        ...gameToDecorate,
        possibleActions: possibleActions,
        players: updatedPlayerList,
        state: {
          ...gameToDecorate.state,
          playerResources: playerResources
        }
      };
    },

    /**
     * Hexagon Island specific `getGameStatus()` logic.
     * @param {string} playerId The ID of the player that this status is for
     * @param {game} gameToDecorate 
     * @returns {game}
     */
    getGameStatus(playerId, gameToDecorate) {

      // Each player only needs to see their own list of resources
      let prunedPlayerResources = gameToDecorate.state.playerResources[playerId];

      return {
        theWinner: gameToDecorate.theWinner ?? null,
        state: {
          ...gameToDecorate.state,
          playerResources: prunedPlayerResources
        }
      };
    },

    /**
     * Hexagon Island specific `nextPlayer()` logic.
     * @param {game} gameToDecorate 
     * @returns {game}
     */
    nextPlayer(gameToDecorate) {
      // NOTE: We do not need to create a copy of game since that has 
      //       already been done in gameCore.nextPlayer().

      // Gather game properties so we can update them
      let currentAction = gameToDecorate.currentAction;
      let currentActionName = Object.keys(currentAction)[0];
      let possibleActions = gameToDecorate.possibleActions ?? [];
      let phase = gameToDecorate.phase;
      let round = gameToDecorate.round;
      let players = gameToDecorate.players;
      let activePlayerId = gameToDecorate.activePlayerId;
      let playerResources = gameToDecorate.state.playerResources;

      // During setup the players take turns in order setting up a village and a road.
      // When the last player goes, they go again the rest of the players go in reverse 
      // order until we reach the first player again.
      if (phase == 'setup' && currentActionName == 'setupVillagesAndRoads') {
        // This should happen twice during setup, first when everyone has gone once 
        // and we return to the first player and again when we go back through a 
        // second time. The first time this gets triggered we reverse the order of 
        // the players so that last player can go twice in a row. The second time 
        // this gets triggered is when the first player makese the last action of 
        // the setup phase, which will put the players back in their original order.
        if (activePlayerId == gameToDecorate.firstPlayerId) {
          players = players.reverse();
          activePlayerId = players[0].id;
        }

        // If all players have two roads and two villages, that means setup is over.
        const allPlayersHaveSetup = players.reduce((acc, p) => {
          const hasTwoRoads = gameToDecorate.state.roads.filter(r => r.playerId == p.id).length == 2;
          const hasTwoVillages = gameToDecorate.state.nodes.filter(v => v.playerId == p.id).length == 2;
          return acc && hasTwoRoads && hasTwoVillages;
        }, true);

        if (allPlayersHaveSetup) {
          // Final step of setup is to assign players resources based upon where they 
          // have built their villages.
          playerResources = players.reduce((acc,p) => {
            // For each player figure out what resources they should get
            const resourcesToAdd = gameToDecorate.state.nodes
              .map((n,ind) => { return {id: n.playerId, ind: ind} })
              .filter(n => n.id == p.id)
              .reduce((r,n) => {
                const neighborHexs = gameToDecorate.findNeighboringHexagons(n.ind);
                neighborHexs.forEach(h => {
                  r.push(gameToDecorate.state.hexagons[h].resource);
                });
                return r;
              }, []);

            // Then assign these resources to them
            resourcesToAdd.forEach(r => {
              if (r in acc[p.id]) acc[p.id][r] = acc[p.id][r] + 1;
            });
            return acc;
          }, playerResources);

          phase = 'play';
          round = 1;
          possibleActions = ['rollDice'];
          activePlayerId = gameToDecorate.firstPlayerId;
        }
      } else if (phase == 'play') {
        if (possibleActions.includes('rollDice')) {
          // If we went to the next player but the possible action is still 
          // to roll the dice, that means the previous player never rolled.
          throw new Error('Cannot end your turn without at least rolling the dice');
        } else {
          possibleActions = ['rollDice'];
        }
        if (activePlayerId == gameToDecorate.firstPlayerId) {
          round = round + 1;
        }
      }

      return {
        ...gameToDecorate,
        phase: phase,
        round: round,
        players: players,
        possibleActions: possibleActions,
        activePlayerId: activePlayerId,
        state: {
          ...gameToDecorate.state,
          playerResources: playerResources
        }
      }
    },

    /**
     * Hexagon Island specific `processAction()` logic.
     * @param {game} gameToDecorate 
     * @returns {game}
     */
    processAction(gameToDecorate) {
      let action = gameToDecorate.currentAction;
      let actionName = Object.keys(action)[0];
      let actionValue = action[actionName];

      if (actionName == 'rollDice') {
        return gameToDecorate
          .rollDice()
          .resolveRoll()
          .updatePossibleActions();
      } else if (actionName == 'buildStuff') {

        const pid = actionValue.pid;
        const nodeIndices = actionValue.nodes;
        const roadIndices = actionValue.roads;
        nodeIndices.forEach(n => {
          gameToDecorate = gameToDecorate.makeBuilding(n, pid, 'village');
        });
        roadIndices.forEach(r => {
          gameToDecorate = gameToDecorate.buildRoad(r, pid);
        });

        return gameToDecorate
          .findTheWinner()
          .updatePossibleActions();

      } else if (actionName == 'setupVillagesAndRoads') {
        const pid = actionValue.pid;
        const oneNode = actionValue.nodes;
        const oneRoad = actionValue.roads;
        if (oneNode?.length == 1 && oneRoad?.length == 1) {
          return gameToDecorate
            .makeBuilding(oneNode[0], pid, 'village', false)
            .buildRoad(oneRoad[0], pid, false)
            .nextPlayer();
        } else {
          throw new Error('Must select one building and one road during setup.');
        }
      } else if (actionName == 'moveBrigand') {
        const hexagonIndex = actionValue.hexInd;
        return gameToDecorate
          .moveBrigand(hexagonIndex)
          .updatePossibleActions();
      } else if (actionName == 'trade') {
        const pid = actionValue.pid;
        const resourceToGive = actionValue.have;
        const resourceToGet = actionValue.want;
        gameToDecorate = gameToDecorate
          .deductResources(pid,[resourceToGive, resourceToGive, resourceToGive])
          .assignResources(pid, [resourceToGet]);
        return gameToDecorate.updatePossibleActions();
      } else if (actionName == 'endTurn') {
        return gameToDecorate
          .nextPlayer();
      } else {
        // TODO: Throw error on unsupported action
      }

    }

   }
};