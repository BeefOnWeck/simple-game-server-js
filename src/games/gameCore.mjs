
// These are the core properties that the game starts with.
// Additional properties and functionality are added by mixing them in.
const corePropsAndState = {
  meta: {
    name: 'Game Core',
    avatar: null
  },
  config: {},
  phase: 'boot',
  round: 0,
  players: [],
  numPlayers: 0,
  activePlayerId: null,
  firstPlayerId: null,
  state: {},
  decorators: {},
  actions: {}
};

// This is the logic for handling phases and rounds.
const coreTransitionLogic = (game = corePropsAndState) => {
  return {
    ...game, // Copy game object and mixin (last in wins)

    reset() {
      return corePropsAndState; // TODO: Decorate this
    },

    getGameStatus(game = this) {
      // The basic information meant to summarize a game in progress:
      const gameStatus =  {
        phase: game.phase, 
        round: game.round,
        activePlayer: game.activePlayerId,
        players: game.players,
        state: game.state
      };

      // Games can define a decorator to augment/overide the game status:
      const decorators = game.decorators['getGameStatus'] ? 
        game.decorators['getGameStatus'] : 
        () => ({});

      return {
        ...gameStatus,
        ...decorators(game)
      };
    },

    nextRound(game = this) {
      return {
        ...game, // NOTE: game = this (the object calling this method)
        round: game.round + 1 // TODO: test this
      };
    },

    nextPhase(game = this) { // TODO: Change so that we have to specify what phase to move to, with checks for allowable transition
      let theNextPhase;
      if (game.phase === 'end') {
        return corePropsAndState; // TODO: Handle functional decorators
      }
      switch(game.phase) { // These phases are really just for enabling and disabling functionality.
        case 'boot':
          theNextPhase = 'setup';
          break;
        case 'setup': // TODO: How to trigger setup effects? We don't, it happens in server.
          theNextPhase = 'play';
          break;
        case 'play': // TODO: How to set play in motion? It happens in the server.
          theNextPhase = 'end';
          break; 
      }
      return {
        ...game, // NOTE: game = this (the object calling this method)
        phase: theNextPhase
      };
    }

  }
};

// This is the logic for handling player actions and turns.
const corePlayerLogic = (game = coreTransitionLogic) => {
  return {
    ...game, // Copy game object and mixin (last in wins)

    addPlayer(username, id, game = this) {
      const firstId = game.players.length === 0 ? 
        id : 
        game.firstPlayerId;

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

      const decorators = game.decorators['addPlayer'] ? 
        game.decorators['addPlayer'] : 
        () => ({});

      const returnObject = {
        ...game, // NOTE: game = this (the object calling this method)
        ...updateWithNewPlayer
      };

      return {
        ...returnObject,
        ...decorators(returnObject)
      };
    },

    setActivePlayer(id, game = this) { // TODO: Test
      return {
        ...game, // NOTE: game = this (the object calling this method)
        activePlayerId: id // TODO: Check that we're in the play phase (how to make sure things are couopled?)
      }
    },

    nextPlayer(game = this) { // TODO: Test
      // TODO: Error out if there is not active player
      // TODO: Check that we're in the play phase (how to make sure things are coupled?)
      // NOTE: This assumes players go once per round (may need to relax in the future)
      let activePlayerIndex = game.players.findIndex(p => p.id === game.activePlayerId);
      let nextPlayerIndex = (activePlayerIndex + 1) % game.numPlayers;
      return {
        ...game, // NOTE: game = this (the object calling this method)
        round: nextPlayerIndex === 0 ? game.round + 1 : game.round, // increment the round if we're back to the first player
        activePlayerId: game.players[nextPlayerIndex].id
      }
    },

    processActions(actions, game = this) {
      const decorators = game.decorators['processActions'] ? 
        game.decorators['processActions'] : 
        () => ({});

      const returnObject = {
        ...game, // NOTE: game = this (the object calling this method)
        actions: actions
      };

      return {
        ...game, // NOTE: game = this (the object calling this method)
        ...decorators(returnObject)
      };
    }

  };
};

// TODO: Describe functional approach to game composition
const pipe = (...fns) => x => fns.reduce((y, f) => f(y), x);

// This function composition goes from top to bottom.
// It is then applied to `corePropsAndState`.
export const gameCore = pipe(
  coreTransitionLogic,
  corePlayerLogic
)(corePropsAndState);
