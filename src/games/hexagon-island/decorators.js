import { colorArray } from './colorArray.js';
import { setup } from './gameBoard.js';
import { findNeighboringHexagons } from './resolutions.js';
import { rollDice, makeBuilding, buildRoad, moveBrigand } from './actions.js';
import { resolveRoll, updatePossibleActions, findTheWinner, findTheLongestRoad } from './resolutions.js';
import { assignResources, deductResources } from './resources.js';

/** 
 * Games are responsible for resetting state and any other 
 * properties they create.
 */
export function reset(gameToDecorate) {
  return {
    config: {
      configNumPlayers: 2,
      scoreToWin: 10,
      gameBoardWidth: 5
    },
    theWinner: null,
    hasTheLongestRoad: null,
    state: {
      ...gameToDecorate.state,
      centroids: [],
      nodes: [],
      hexagons: [],
      numbers: [],
      roads: [],
      rollResult: [0,0],
      playerResources: {},
      brigandIndex: null
    }
  }
};

/**
 * Hexagon Island specific `addPlayer()` logic.
 * @param {game} gameToDecorate game object to decorate
 * @returns {game}
 */
 export function addPlayer(gameToDecorate) {
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
    gameToDecorate = setup(boardWidth, gameToDecorate).nextPhase();
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
};

/**
 * 
 * @param oldId 
 * @param newId 
 * @param gameToDecorate 
 * @returns 
 */
export function reconnectPlayer(oldId, newId, gameToDecorate) {

  // Update playerId (oldId->newId) in roads array.
  let updatedRoads = gameToDecorate.state.roads.map(r => {
    return {
      ...r,
      playerId: r.playerId == oldId ? newId : r.playerId
    };
  });

  // Update playerId (oldId->newId) in nodes array.
  let updatedNoads = gameToDecorate.state.nodes.map(n => {
    return {
      ...n,
      playerId: n.playerId == oldId ? newId : n.playerId
    };
  });

  // Update playerId (oldId->newId) in playerResources object.
  let playerResources = gameToDecorate.state.playerResources;
  const {[oldId]: resourcesToReOwn, ...others} = playerResources;
  let updatedPlayerResources = {[newId]: resourcesToReOwn, ...others};

  const theWinner = gameToDecorate.theWinner == oldId ? 
    newId : 
    gameToDecorate.theWinner;
  const hasTheLongestRoad = gameToDecorate.hasTheLongestRoad == oldId ? 
    newId :
    gameToDecorate.hasTheLongestRoad;

  return {
    ...gameToDecorate,
    theWinner: theWinner,
    hasTheLongestRoad: hasTheLongestRoad,
    state: {
      ...gameToDecorate.state,
      roads: updatedRoads,
      nodes: updatedNoads,
      playerResources: updatedPlayerResources
    }
  }
};

/**
 * Hexagon Island specific `getGameStatus()` logic.
 * @param {string} playerId The ID of the player that this status is for
 * @param {game} gameToDecorate 
 * @returns {game}
 */
 export function getGameStatus(playerId, gameToDecorate) {

  // Each player only needs to see their own list of resources
  let prunedPlayerResources = gameToDecorate.state.playerResources[playerId];

  return {
    theWinner: gameToDecorate.theWinner ?? null,
    longestRoad: gameToDecorate.hasTheLongestRoad ?? null,
    state: {
      ...gameToDecorate.state,
      playerResources: prunedPlayerResources
    }
  };
};

/**
 * Hexagon Island specific `nextPlayer()` logic.
 * @param {game} gameToDecorate 
 * @returns {game}
 */
 export function nextPlayer(gameToDecorate) {
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
        // For each player, figure out what resources they should get.
        const resourcesToAdd = gameToDecorate.state.nodes
          .map((n,ind) => { return {id: n.playerId, ind: ind} })
          .filter(n => n.id == p.id)
          .reduce((r,n) => {
            const neighborHexs = findNeighboringHexagons(n.ind, gameToDecorate);
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
};

/**
 * Hexagon Island specific `processAction()` logic.
 * @param {game} gameToDecorate 
 * @returns {game}
 */
 export function processAction(gameToDecorate) {
  let action = gameToDecorate.currentAction;
  let actionName = Object.keys(action)[0];
  let actionValue = action[actionName];

  if (gameToDecorate.possibleActions.includes(actionName) == false) {
    throw new Error('That is not an allowed action right now.')
  }

  if (actionName == 'rollDice') {
    gameToDecorate = rollDice(gameToDecorate);
    gameToDecorate = resolveRoll(gameToDecorate);
    gameToDecorate = updatePossibleActions(gameToDecorate);
    return gameToDecorate;
  } else if (actionName == 'buildStuff') {

    const pid = actionValue.pid;
    const nodeIndices = actionValue.nodes;
    const roadIndices = actionValue.roads;

    if (nodeIndices.length == 0 && roadIndices.length == 0) {
      throw new Error('Must select something to build.')
    }

    nodeIndices.forEach(n => {
      gameToDecorate = makeBuilding(n, pid, 'village', true, gameToDecorate);
    });
    roadIndices.forEach(r => {
      gameToDecorate = buildRoad(r, pid, true, gameToDecorate);
    });

    gameToDecorate = findTheLongestRoad(gameToDecorate);
    gameToDecorate = findTheWinner(gameToDecorate);
    gameToDecorate = updatePossibleActions(gameToDecorate);
    return gameToDecorate;

  } else if (actionName == 'setupVillagesAndRoads') {
    const pid = actionValue.pid;
    const oneNode = actionValue.nodes;
    const oneRoad = actionValue.roads;
    if (oneNode?.length == 1 && oneRoad?.length == 1) {
      let thisRoad = gameToDecorate.state.roads[oneRoad];
      let [node1,node2] = thisRoad.inds;
      const buildAndRoadAreAdjacent = (node1 == oneNode) || (node2 == oneNode);
      if (buildAndRoadAreAdjacent) {
        gameToDecorate = makeBuilding(oneNode[0], pid, 'village', false, gameToDecorate);
        gameToDecorate = buildRoad(oneRoad[0], pid, false, gameToDecorate);
        gameToDecorate = gameToDecorate.nextPlayer();
        return gameToDecorate;
      } else {
        throw new Error('Selected building and road must be adjacent.');
      }
    } else {
      throw new Error('Must select one building and one road during setup.');
    }
  } else if (actionName == 'moveBrigand') {
    const hexagonIndex = actionValue.hexInd;
    gameToDecorate = moveBrigand(hexagonIndex, gameToDecorate);
    gameToDecorate = updatePossibleActions(gameToDecorate);
    return gameToDecorate;
  } else if (actionName == 'trade') {
    const pid = actionValue.pid;
    const resourceToGive = actionValue.have;
    const resourceToGet = actionValue.want;
    gameToDecorate = deductResources(pid,[resourceToGive, resourceToGive, resourceToGive], gameToDecorate);
    gameToDecorate = assignResources(pid, [resourceToGet], gameToDecorate);
    gameToDecorate = updatePossibleActions(gameToDecorate);
    return gameToDecorate;
  } else if (actionName == 'endTurn') {
    return gameToDecorate.nextPlayer();
  } else {
    // TODO: Throw error on unsupported action
  }

};