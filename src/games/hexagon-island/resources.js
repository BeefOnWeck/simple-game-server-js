/**
 * Object containing the resources necessary for building different structures.
 * @type {Object}
 */
const requiredResources = {
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
};

/**
 * Assigns one or more resources to a player.
 * @param {string} playerId The ID of the player getting the resources
 * @param {Array.<string>} resourceTypes An array of resource types to give the player
 * @param {game} game 
 * @returns {game}
 */
export function assignResources(playerId, resourceTypes=[], game = this) { // TODO: Move to resources.js

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

};

/**
 * Deduct resources from a player.
 * @param {string} playerId The ID of player
 * @param {Array.<string>} resourceTypes An array of resource types to deduct
 * @param {game} game 
 * @returns 
 */
export function deductResources(playerId, resourceTypes=[], game = this) { // TODO: Move to resources.js

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

};

/**
 * 
 * @param {*} playerId 
 * @param {*} resourceTypes 
 * @param {*} game 
 * @returns {boolean}
 */
export function creditCheck(playerId, resourceTypes=[], game = this) { // TODO: Move to resources.js
  // TODO: Test this

  if (Array.isArray(resourceTypes) == false) {
    resourceTypes = [resourceTypes];
  }

  const requiredResources = resourceTypes.reduce((acc,rt) => {
    acc[rt] += 1;
    return acc;
  }, {
    block: 0,
    timber: 0,
    fiber: 0,
    cereal: 0,
    rock: 0
  });

  const playerResources = game.state.playerResources;

  let canPayTheBill = true;

  if (playerId in playerResources) {
    for (const rR in requiredResources) {
      if (playerResources[playerId][rR] < requiredResources[rR]) canPayTheBill = false;
    }
  } // TODO: Else

  return canPayTheBill;

};