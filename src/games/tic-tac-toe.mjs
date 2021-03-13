import { corePropsAtBoot, coreTransitionLogic, corePlayerLogic } from '../game.mjs';

const initialState = {
  grid: Array.from({length:9}, (v,i) => {
    return {
      mark: null,
      row: Math.floor(i / 3),
      col: i % 3
    }
  }),
  marks: ['x','o']
}

// The game state is defined here
const gameState = g => {
  return {
    ...g,

    state: initialState,

  }
}

// If there are any top-level properties we want to define or overide
const gameProps = g => {
  return {
    ...g,

    decorators: {
      addPlayer(gameToDecorate) {
        return {
          players: gameToDecorate.players.map((p,i) => ({
            ...p,
            mark: gameToDecorate.state.marks[i]
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
      return {
        ...this,
        state: {
          ...this.state,
          grid: this.state.grid.map((g,i) => {
            if (g.row === row && g.col === col) {
              g.mark = playerMark;
            }
            return g;
          })
        }
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