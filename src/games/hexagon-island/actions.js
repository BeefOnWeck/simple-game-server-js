import { creditCheck, deductResources } from './resources.js';

/**
 * Roll two dice, combine the numbers, and add the result to the game state.
 * @param {game} game 
 * @returns {game}
 */
export function rollDice(game = this) {
    
  // NOTE: game = this (the object calling this method)
  let updatedGame = {...game};

  if (!updatedGame.possibleActions.includes('rollDice')) {
    throw new Error('It is not time to roll the dice.');
  }

  const dieResult1 = Math.floor(Math.random() * 6) + 1;
  const dieResult2 = Math.floor(Math.random() * 6) + 1;

  return {
    ...updatedGame,
    state: {
      ...updatedGame.state,
      rollResult: [dieResult1,dieResult2]
    }
  };

};

/**
 * Builds a road for a particular player.
 * @param {number} roadIndex The index for the road being built
 * @param {string} playerId The ID for the player building the road
 * @param {boolean} requirePayment Is payment required?
 * @param {game} game 
 * @returns {game}
 */
export function buildRoad(roadIndex, playerId, requirePayment = true, game = this) {
    
  // NOTE: game = this (the object calling this method)
  let updatedGame = {...game};

  if (updatedGame.activePlayerId && playerId != updatedGame.activePlayerId) {
    throw new Error('It is not your turn.');
  }

  if (requirePayment) {
    // TODO: Make this a game property
    const requiredResources = ['block','timber'];
    const canPayTheBill = creditCheck(playerId,requiredResources,updatedGame);
    if (canPayTheBill == false) {
      throw new Error('Not enough resources to build.')
    }
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

  // TODO: Test this error
  if (Number.isInteger(roadIndex) && roadIndex >=0 && roadIndex < roads.length) {
    roads[roadIndex].playerId = playerId;
  } else {
    throw new Error('Cannot build road; invalid road index.');
  }

  // TODO: Test to make sure resources are not deducted if there is an error above this
  if (requirePayment) {
    updatedGame = deductResources(playerId,['block','timber'],updatedGame);
  }

  return {
    ...updatedGame,
    state: {
      ...updatedGame.state,
      roads: roads
    }
  };

};

/**
 * Constructs a building for a particular player.
 * @param {number} roadIndex The index for the building being constructed
 * @param {string} playerId The ID for the player doing the construction
 * @param {string} buildingType The type of building to construct
 * @param {boolean} requirePayment Is payment required?
 * @param {game} game 
 * @returns {game}
 */
export function makeBuilding(nodeIndex, playerId, buildingType, requirePayment = true, game = this) {

  // NOTE: game = this (the object calling this method)
  let updatedGame = {...game};

  let nodes = updatedGame.state.nodes;
  let roads = updatedGame.state.roads;

  if (updatedGame.activePlayerId && playerId != updatedGame.activePlayerId) {
    throw new Error('It is not your turn.');
  }

  if (requirePayment) {
    // TODO: Make this a game property
    let requiredResources = [];
    if (buildingType == 'village') {
      requiredResources = ['block','timber','fiber','cereal'];
    } else if (buildingType == 'burgh') {
      requiredResources = ['rock','rock','rock','cereal','cereal'];
    }
    const canPayTheBill = creditCheck(playerId,requiredResources,updatedGame);
    if (canPayTheBill == false) {
      throw new Error('Not enough resources to build.')
    }
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

  // TODO: Test this error
  if (updatedGame.phase == 'play' && adjacentRoads.length == 0) {
    throw new Error('Must place building next to a road you own.');
  }

  // TODO: Test this error
  if (Number.isInteger(nodeIndex) && nodeIndex >=0 && nodeIndex < nodes.length) {
    nodes[nodeIndex].playerId = playerId;
    nodes[nodeIndex].buildingType = buildingType;
  } else {
    throw new Error('Cannot place building; invalid node index.')
  }
  
  // TODO: Test to make sure resources are not deducted if there is an error above this
  if (requirePayment) {
    if (buildingType == 'village') {
      updatedGame = deductResources(playerId,['block','timber','fiber','cereal'],updatedGame);
    } else if (buildingType == 'burgh') {
      updatedGame = deductResources(playerId,['rock','rock','rock','cereal','cereal'],updatedGame);
    }
  }

  return {
    ...updatedGame,
    state: {
      ...updatedGame.state,
      nodes: nodes
    }
  };
};

/**
 * Moves the scorpion to the specified index.
 * @param {number} index 
 * @param {game} game 
 * @returns 
 */
export function moveScorpion(index, game=this) {
  const updatedGame = {...game};

  // TODO: Check that the new index fits

  return {
    ...updatedGame,
    state: {
      ...updatedGame.state,
      scorpionIndex: index
    }
  }
};

/**
 * 
 * @param {*} playerId 
 * @param {*} game 
 */
export function buyBug(playerId, requirePayment = true, game=this) {
  let updatedGame = {...game};

  let updatedBugs = updatedGame.state.bugs;

  if (requirePayment) {
    const requiredResources = ['rock','cereal','fiber'];
    const canPayTheBill = creditCheck(playerId, requiredResources, updatedGame);
    if (canPayTheBill == false) {
      throw new Error('Not enough resources to buy bug.')
    } else {
      updatedGame = deductResources(playerId, ['rock','cereal','fiber'], updatedGame);
      updatedBugs[playerId]++;
    }
  }

  return {
    ...updatedGame,
    state: {
      ...updatedGame.state,
      bugs: updatedBugs
    }
  };

}