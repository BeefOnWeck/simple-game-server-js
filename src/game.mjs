
const pipe = (...fns) => x => fns.reduce((y, f) => f(y), x);

const initialGameShell = {
  currentPhase: 'boot',
  turn: 1,
  players: [],
  numPlayers: 0, 
  state: {},
  actions: {}
};

const coreCapabilities = g => {
  return {
    ...g,
    reset() {
      return initialGameShell;
    },
    nextPhase() {
      let theNextPhase;
      if (this.currentPhase === 'end') {
        return initialGameShell;
      }
      switch(this.currentPhase) { // These phases are really just for enabling and disabling functionality.
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
        currentPhase: theNextPhase
      };
    },
    nextTurn() {
      return {
        ...this,
        turn: this.turn + 1 // TODO: test this
      };
    }
  }
};

const networking = g => {
  return {
    ...g,
    addPlayer(name, socket) {
      return {
        ...this,
        players: [...this.players, { [name]: socket }],
        numPlayers: this.numPlayers + 1 // TODO: test this
      }
    }
  };
};

// const coreActions = g => {
  //
  // }

// TODO:
// - Action: Player ends turn
// - Action: Player leaves game
// - State: Where to keep who the active player is?
// - Set active player


export const game = pipe(
  coreCapabilities,
  networking
)(initialGameShell);

