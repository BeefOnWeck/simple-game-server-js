
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
      switch(this.currentPhase) {
        case 'boot':
          theNextPhase = 'setup';
          break;
        case 'setup':
          theNextPhase = 'play';
          break;
        case 'play':
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


export const game = pipe(
  coreCapabilities,
  networking
)(initialGameShell);

