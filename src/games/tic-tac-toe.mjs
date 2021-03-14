import { corePropsAtBoot, coreTransitionLogic, corePlayerLogic } from '../game.mjs';

// NOTE: This is pulled out in case we want to refer to it later.
// E.g., an updated reset() method.
const initialState = {
  // A 3x3 grid with cell capable of holding a mark from a player.
  grid: Array.from({length:9}, (v,i) => {
    return {
      mark: null,
      row: Math.floor(i / 3),
      col: i % 3
    }
  }),
  // Only two possile marks in this two player game.
  marks: ['x','o']
}

// The game state is defined here
const gameState = g => {
  return {
    ...g,

    state: initialState, // NOTE: Should we shallow copy?

  }
}

// If there are any game properties we want to define or overide
const gameProps = g => {
  return {
    ...g,

    theWinner: null,

    // NOTE: We don't have to just ammend the players property.
    // We could also, for instance, 
    decorators: {
      addPlayer(gameToDecorate) {
        return {
          players: gameToDecorate.players.map((p,i) => ({
            ...p,
            mark: gameToDecorate.state.marks[i] // TODO: Throw error when i > 1
          }))
        };
      }
    }

  }
}

// The game actions are defined here
const gameActions = g => {
  return {
    ...g,

    makeMark(playerId, row, col) {
      const playerMark = this.players.filter(p => p.id === playerId).map(p => p.mark)[0];

      const updatedGrid = this.state.grid.map(g => {
        if (g.row === row && g.col === col) {
          g.mark = playerMark;
        }
        return g;
      });

      return {
        ...this,
        state: {
          ...this.state,
          grid: updatedGrid
        }
      }
    },

    findTheWinner() {
      const possibleThreeInARows = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6]
      ];

      const winningCells = possibleThreeInARows.reduce((acc,p3r) => {
        const possibleCells = this.state.grid.reduce((pc,cc,ci) => {
          if (ci === p3r[0] || ci === p3r[1] || ci === p3r[2]) {
            return pc.length === 0 ?
              [cc] :
              pc[pc.length-1].mark === cc.mark  && cc.mark != null ?
              pc.concat(cc) :
              [cc];
          } else {
            return pc;
          }
        },[]);
        return possibleCells.length === 3 ?
          acc.concat(possibleCells) :
          acc;
      },[]);

      const winningMark = winningCells.length === 3 ?
        winningCells[0].mark :
        null;

      const winningPlayer = this.players.filter(p => p.mark === winningMark).map(p => p.id)[0];

      return {
        ...this,
        theWinner: winningPlayer
      }
    }
  }
}

// TODO: Describe functional approach to game composition
const pipe = (...fns) => x => fns.reduce((y, f) => f(y), x);

export const game0 = pipe(
  coreTransitionLogic,
  corePlayerLogic,
  gameProps,
  gameState,
  gameActions
)(corePropsAtBoot);