
/** @typedef {object} game */

export const gameCore = {

  /** Metadata for describing a particular game */
  meta: {
    name: 'Game Core',
    /** @type {string} */
    avatar: null
  },

  /** Game-specific configuration */
  config: {},

  /** 
   * The phase of the game.
   * Can take on four values: boot, setup, play, and end.
   */
  phase: 'boot',

  /** Once game enters 'play' phase, this will start incrementing. */
  round: 0,

  /** An array of objects describing each player. */
  players: [],

  /** This will increment as players are added. */
  numPlayers: 0,

  /**
   * The socket ID of the active player.
   * @type {string}
   */
  activePlayerId: null,

  /**
   * The socket ID of the first player.
   * @type {string}
   */
  firstPlayerId: null,

  /** 
   * Game-specific state information.
   * Changes via player actions.
   */
  state: {},

  /** Decorators are used overide core game properties and methods. */
  decorators: {},

  /** Game-specific actions players can take. */
  actions: {},

  /**
   * Reset the game.
   * @function
   * @returns {game}
   * @deprecated There is a better way to do this.
   */
  reset(game = this) {
    return {
      ...game,
      phase: 'boot',
      round: 0,
      players: [],
      state: {},
      actions: {}
    };
  },

  /** 
   * Return information meant to summarize a game in progress. 
   * @param {string} playerId - The ID of player this summary is meant for.
   * @returns {object} gameStatus - The status of the game
   * */
  getGameStatus(playerId = null, game = this) {
    // Core game status
    const gameStatus =  {
      name: game.meta.name,
      phase: game.phase, // NOTE: game = this (object calling this method)
      round: game.round,
      activePlayer: game.activePlayerId,
      players: game.players,
      state: game.state
    };

    // Games can define a decorator to augment/overide the game status
    const decorators = game.decorators['getGameStatus'] ?? function(){};

    return {
      ...gameStatus,
      ...decorators(playerId, game)
    };
  },

  /**
   * Sets game configuration.
   * @returns {game}
   */
  configureGame(config, game = this) {
    // You can only configure during the boot phase
    if (game.phase == 'boot') {
      let newGame = {...game}; // shallow copy
      // TODO: Check for valid configuration keys
      for (const cfg in config) {
        newGame.config[cfg] = config[cfg];
      }
      return newGame;
    } else {
      throw new Error('Cannot set configuration outside of boot phase.');
    }
  },

  /** 
   * Moves the game to the next round.
   * @returns {game} 
   */
  nextRound(game = this) {
    return {
      ...game, // NOTE: game = this (object calling this method)
      round: game.round + 1 // TODO: test this
    };
  },

  /** 
   * Moves the game to the next phase.
   * @returns {game} 
   */
  nextPhase(game = this) { // TODO: Refactor with phase array
    let theNextPhase;
    if (game.phase === 'end') {
      return game; // TODO: Throw error? Reset the game?
    }
    // These phases are really just for enabling and disabling functionality.
    switch(game.phase) {
      case 'boot': // Boot is when players can join the game
        theNextPhase = 'setup';
        break;
      case 'setup': // Setup is where players take any setup actions
        theNextPhase = 'play';
        break;
      case 'play': // Play is the actual game
        theNextPhase = 'end';
        break; 
    }
    return {
      ...game, // NOTE: game = this (object calling this method)
      phase: theNextPhase
    };
  },

  /**
   * Add a player to the game.
   * @function
   * @param {string} username - The name to the player being added
   * @param {string} id - The socket ID of the player being added
   * @returns {game}
   */
  addPlayer(username, id, game = this) {
    // If this is the first player, grab their id
    // Otherwise grab the id of the first player
    const firstId = game.players.length === 0 ? 
      id : 
      game.firstPlayerId;

    // Form an update to the core properties
    const updateWithNewPlayer = {
      players: [
        ...game.players, {
          name: username,
          id: id
        }
      ],
      numPlayers: game.numPlayers + 1, // TODO: test this
      activePlayerId: firstId,
      firstPlayerId: firstId
    };

    // Games can define a decorator to augment/overide what happens when 
    // players are added.
    const decorators = game.decorators['addPlayer'] ?? function(){};

    // Return a copy of the game with our updates mixed in
    const returnObject = {
      ...game, // NOTE: game = this (object calling this method)
      ...updateWithNewPlayer
    };

    return {
      ...returnObject,
      ...decorators(returnObject)
    };
  },

  /**
   * Set the active player by socket ID.
   * This is not needed if you are using `nextPlayer()`.
   * @function
   * @param {string} id - The socket ID of the player being added
   * @returns {game}
   */
  setActivePlayer(id, game = this) { // TODO: Test
    // First check that id is valid
    if (game.players.map(p => p.id).includes(id)) {
      return {
        ...game, // NOTE: game = this (object calling this method)
        activePlayerId: id // TODO: Check that we're in the play phase (how to make sure things are couopled?)
      }
    } else {
      throw new Error('Cannot set an invalid ID as the active player.');
    }
  },

  /**
   * Go to the next player.
   * This may increment the round.
   * @returns {game}
   */
  nextPlayer(game = this) { // TODO: Test
    // TODO: Error out if there is not active player
    // TODO: Check that we're in the play phase (how to make sure things are coupled?)
    // NOTE: This assumes players go once per round (may need to relax in the future)
    let activePlayerIndex = game.players.findIndex(p => p.id === game.activePlayerId);
    let nextPlayerIndex = (activePlayerIndex + 1) % game.numPlayers;

    // Games can define a decorator to augment/overide what happens when play 
    // transitions to the next player.
    const decorators = game.decorators['nextPlayer'] ?? function(){};

    // Return a copy of the game with our updates mixed in
    const returnObject = {
      ...game, // NOTE: game = this (object calling this method)
      activePlayerId: game.players[nextPlayerIndex].id
    };

    return {
      ...returnObject,
      ...decorators(returnObject)
    }
  },

  /** 
   * For handling actions defined as a key:value dictionary.
   * @function
   * @param {object} actions - Actions defined by key:value pairs.
   * @returns {game}
   */
  processActions(actions, game = this) {
    // Games must define a decorator to implement player actions.
    const decorators = game.decorators['processActions'] ?? function(){};

    // If a game does not define any processAction decorators, 
    const returnObject = {
      ...game, // NOTE: game = this (object calling this method)
      actions: actions // This is how actions are passed to decorator
    };

    return {
      ...game, // NOTE: game = this (object calling this method)
      ...decorators(returnObject)
    };
  }
  
};
