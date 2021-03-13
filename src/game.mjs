
// These are the core properties available when the game is booted
export const corePropsAtBoot = {
  phase: 'boot',
  round: 0,
  players: [],
  numPlayers: 0,
  activePlayerId: null,
  firstPlayerId: null,
  mixins: {},
  state: {},
  actions: {}
};

export const coreTransitionLogic = g => {
  return {

    ...g,

    reset() {
      return corePropsAtBoot; // TODO: Handle functional mixins
    },

    nextRound() {
      return {
        ...this,
        round: this.round + 1 // TODO: test this
      };
    },

    nextPhase() { // TODO: Change so that we have to specify what phase to move to, with checks for allowable transition
      let theNextPhase;
      if (this.phase === 'end') {
        return corePropsAtBoot; // TODO: Handle functional mixins
      }
      switch(this.phase) { // These phases are really just for enabling and disabling functionality.
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
        ...this,
        phase: theNextPhase
      };
    }

  }
};

export const corePlayerLogic = g => {
  return {

    ...g,

    addPlayer(username, id) {
      const firstId = this.players.length === 0 ? id : this.firstPlayerId;
      const updateWithNewPlayer = {
        players: [
          ...this.players, {
            name: username,
            id: id
          }
        ],
        numPlayers: this.numPlayers + 1, // TODO: test this
        activePlayerId: firstId,
        firstPlayerId: firstId
      };
      let playerMixins = this.mixins.hasOwnProperty('addPlayer') ? this.mixins['addPlayer'] : ()=>({});
      return {
        ...this,
        ...updateWithNewPlayer,
        ...playerMixins(updateWithNewPlayer)
      };
    },

    setActivePlayer(id) { // TODO: Test
      return {
        ...this,
        activePlayerId: id // TODO: Check that we're in the play phase (how to make sure things are couopled?)
      }
    },

    nextPlayer() { // TODO: Test
      // TODO: Error out if there is not active player
      // TODO: Check that we're in the play phase (how to make sure things are coupled?)
      // NOTE: This assumes players go once per round (may need to relax in the future)
      let activePlayerIndex = this.players.findIndex(p => p.id === this.activePlayerId);
      let nextPlayerIndex = (activePlayerIndex + 1) % this.numPlayers;
      return {
        ...this,
        round: nextPlayerIndex === 0 ? this.round + 1 : this.round, // increment the round if we're back to the first player
        activePlayerId: this.players[nextPlayerIndex].id
      }
    }
  };
};

// const coreActions = g => {
  //
  // }

// TODO:
// - Action: Player ends round
// - Action: Player leaves game

// TODO: Describe functional approach to game composition
const pipe = (...fns) => x => fns.reduce((y, f) => f(y), x);

export const gameCore = pipe(
  coreTransitionLogic,
  corePlayerLogic
)(corePropsAtBoot);

