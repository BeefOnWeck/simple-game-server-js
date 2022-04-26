import { gameCore } from '../gameCore.js';
import { setup } from './gameBoard.js';
import { rollDice, buildRoad, makeBuilding, moveScorpion, buyBug } from './actions.js';
import { assignResources, deductResources } from './resources.js';
import { resolveRoll, updatePossibleActions, findTheWinner, findTheLongestRoad } from './resolutions.js';
import { reset, addPlayer, reconnectPlayer, getGameStatus, nextPlayer, processAction } from './decorators.js';

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
   * 
   */
  hasTheLongestRoad: null,

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
    rollResult: [0,0],
    playerResources: {},
    bugs: {},
    scorpionIndex: null
  },

  // gameboard setup
  setup,

  // actions
  rollDice,
  buildRoad,
  makeBuilding,
  moveScorpion,
  buyBug,

  // resources
  assignResources,
  deductResources,

  // resolutions
  resolveRoll,
  updatePossibleActions,
  findTheWinner,
  findTheLongestRoad,

  /** 
   * Decorators allow methods defined in gameCore to be modified.
   * NOTE: These are called from gameCore.
   * NOTE: These are defined in decorators.js
   */
   decorators: {
    reset, 
    addPlayer, 
    reconnectPlayer, 
    getGameStatus,
    nextPlayer, 
    processAction
   }
};