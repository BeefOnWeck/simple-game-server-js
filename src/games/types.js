
/**
 * @typedef {{
 *  meta:Object,
 *  config: Object,
 *  phase: number,
 *  round: number,
 *  players: Array,
 *  numPlayers: number,
 *  activePlayerId: string,
 *  firstPlayerId: string,
 *  state: Object
 *  decorators: Object
 *  actions: Object
 * }} CT1
 */

/**
 * @typedef {{
 *  reset: Function,
 *  getGameStatus: Function,
 *  nextRound: Function,
 *  nextPhase: Function
 * }} CT2
 */

/** @typedef {(CT1 | CT2)} CC */