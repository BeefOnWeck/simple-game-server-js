import { assignResources } from './resources.js';
import { getRoadLengths } from './roads.js';

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
    updatedGame.possibleActions = ['moveScorpion'];
  }

  const rolledHexagons = updatedGame.state.hexagons.reduce((acc, h, ind) => {
    // If this hexagon's number matches the roll and the scorpion isn't here...
    if (h.number == rollSum && ind != updatedGame.state.scorpionIndex) {
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
    'endTurn',
    'buyBug'
  ],
  moveScorpion: [
    'trade',
    'buildStuff',
    'endTurn',
    'buyBug'
  ],
  trade: [
    'trade',
    'buildStuff',
    'endTurn',
    'buyBug'
  ],
  buyBug: [
    'moveScorpion'
  ],
  buildStuff: [
    'trade',
    'buildStuff',
    'endTurn',
    'buyBug'
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

  // Using De Morgan's Law, update possibleActions only if a moveScorpion action 
  // has been triggered but not acted upon yet.
  if (
    currentActionName == 'moveScorpion' || 
    possibleActions.includes('moveScorpion') == false
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
    const longestRoadBonus = updatedGame.hasTheLongestRoad == p.id ? 1 : 0;
    const mostBugsBonus = updatedGame.hasTheMostBugs == p.id ? 1 : 0;
    const score = buildingScore + longestRoadBonus;
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

/**
 * 
 * @param {*} game 
 * @returns 
 */
export function findTheLongestRoad(game=this) {

  // NOTE: game = this (the object calling this method)
  let updatedGame = {...game};

  let hasTheLongestRoad = null;

  const roadLengths = getRoadLengths(updatedGame);

  // Find the player with the longest road
  const roadLengthArray = Object.entries(roadLengths);
  const eligibleRoads = roadLengthArray.filter(r => r[1] >= 3);
  if (eligibleRoads.length > 0) {
    hasTheLongestRoad = eligibleRoads.sort((a,b) => a[1] >= b[1] ? -1 : 1)[0][0];
  }

  // If there was already a player with the longest road and the player we found is different, 
  // then make sure the new player has at least one more road to break the tie and steal the title.
  const titleHolder = updatedGame.hasTheLongestRoad;
  if (
    titleHolder != null &&
    titleHolder != hasTheLongestRoad &&
    roadLengths[titleHolder] == roadLengths[hasTheLongestRoad]
  ) hasTheLongestRoad = titleHolder;

  return {
    ...updatedGame,
    hasTheLongestRoad: hasTheLongestRoad
  };

}

/**
 * 
 * @param {*} game 
 * @returns 
 */
 export function findTheMostBugs(game=this) {

  // NOTE: game = this (the object calling this method)
  let updatedGame = {...game};

  let hasTheMostBugs = null;

  // Find the player with the most bugs
  const bugs = updatedGame.state.bugs;
  const bugArray = Object.entries(bugs);
  const eligibleBugs = bugArray.filter(r => r[1] >= 3);
  if (eligibleBugs.length > 0) {
    hasTheMostBugs = eligibleBugs.sort((a,b) => a[1] >= b[1] ? -1 : 1)[0][0];
  }

  const titleHolder = updatedGame.hasTheMostBugs;
  if (
    titleHolder != null &&
    titleHolder != hasTheMostBugs &&
    bugs[titleHolder] == bugs[hasTheMostBugs]
  ) hasTheMostBugs = titleHolder;

  return {
    ...updatedGame,
    hasTheMostBugs: hasTheMostBugs
  };

}