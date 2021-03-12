
// TODO: Describe functional approach to game composition
const pipe = (...fns) => x => fns.reduce((y, f) => f(y), x);

// These are the core properties available when the game is booted
const corePropsAtBoot = {
  phase: 'boot',
  round: 0,
  players: [],
  numPlayers: 0,
  activePlayerId: null,
  firstPlayerId: null,
  state: {},
  actions: {}
};

const coreTransitionLogic = g => {
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

const corePlayerLogic = g => {
  return {

    ...g,

    addPlayer(username, socketId) {
      let firstPlayerSocketId = this.players.length === 0 ? socketId : this.firstPlayerId;
      return {
        ...this,
        players: [
          ...this.players, { 
            name: username,
            id: socketId 
          }
        ],
        numPlayers: this.numPlayers + 1, // TODO: test this
        activePlayerId: firstPlayerSocketId,
        firstPlayerId: firstPlayerSocketId
      }
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


export const game = pipe(
  coreTransitionLogic,
  corePlayerLogic
)(corePropsAtBoot);

