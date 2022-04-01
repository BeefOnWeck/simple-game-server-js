import { assignResources } from './resources.js';

/**
 * Given a hexagon, find the indices for the surrounding nodes (vertices).
 * @param {number} hexagonIndex The index of the hexagon in question
 * @param {game} game 
 * @returns 
 */
export function findNeighboringNodes(hexagonIndex, game=this) {

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

};

/**
 * Given a node, find the indices of the neighboring hexagons.
 * @param {number} nodeIndex 
 * @param {game} game 
 * @returns 
 */
export function findNeighboringHexagons(nodeIndex, game=this) {

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

};

/**
 * Resolve the effects from rolling the dice.
 * @param {game} game 
 * @returns {game}
 */
export function resolveRoll(game = this) {

  // NOTE: game = this (the object calling this method)
  let updatedGame = {...game};

  const rollSum = updatedGame.state.rollResult.reduce((pv,cv) => pv+cv, 0);

  if (rollSum == 7) {
    updatedGame.possibleActions = ['moveBrigand'];
  }

  const rolledHexagons = updatedGame.state.hexagons.reduce((acc, h, ind) => {
    // If this hexagon's number matches the roll and the brigand isn't here...
    if (h.number == rollSum && ind != updatedGame.state.brigandIndex) {
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
    const neighborNodes = findNeighboringNodes(h.ind, updatedGame);
    neighborNodes.forEach(n => {
      const pid = updatedGame.state.nodes[n].playerId;
      updatedGame = assignResources(pid, h.resource, updatedGame);
    });
  });

  return {
    ...updatedGame
  };

};

/**
 * 
 */
const actionStateTransition = {
  setupVillagesAndRoads: [
    'rollDice'
  ],
  rollDice: [
    'trade',
    'buildStuff',
    'endTurn'
  ],
  moveBrigand: [
    'trade',
    'buildStuff',
    'endTurn'
  ],
  trade: [
    'trade',
    'buildStuff',
    'endTurn'
  ],
  useDevCard: [
    'trade',
    'buildStuff',
    'endTurn'
  ],
  buildStuff: [
    'trade',
    'buildStuff',
    'endTurn'
  ],
  buyDevCard: [
    'buildStuff',
    'endTurn'
  ],
  endTurn: [
    'rollDice'
  ]
};

/**
 * Updates what actions are possible given the current action
 * @param {game} game 
 * @returns 
 */
export function updatePossibleActions(game=this) {

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
    possibleActions = actionStateTransition[currentActionName];
  }
  
  return {
    ...updatedGame,
    possibleActions: possibleActions
  };
};

/**
 * Called after each build action, this function checks to see if anyone has 
 * accumlated enough points to win the game.
 * @param {game} game 
 * @returns {game}
 */
export function findTheWinner(game=this) {

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

};

// TODO: Find longest road