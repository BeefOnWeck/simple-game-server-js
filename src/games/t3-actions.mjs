import { gameProps } from './t3-props.mjs';

// The game actions are defined here
export const gameActions = (game = gameProps) => {
  return {
    ...game, // Copy game object and mixin (last in wins)

    makeMark(playerId, row, col, game = this) {
      const playerMark = game.players.filter(p => p.id === playerId).map(p => p.mark)[0];

      const updatedGrid = game.state.grid.map(grd => {
        if (grd.row === row && grd.col === col) {
          grd.mark = playerMark;
        }
        return grd;
      });

      return {
        ...game, // NOTE: game = this (the object calling this method)
        state: {
          ...game.state,
          grid: updatedGrid
        }
      }
    },

    findTheWinner(game = this) {
      const possibleThreeInARows = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6]
      ];

      const winningCells = possibleThreeInARows.reduce((acc,p3r) => {
        const possibleCells = game.state.grid.reduce((pc,cc,ci) => {
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

      const winningPlayer = game.players.filter(p => p.mark === winningMark).map(p => p.id)[0];

      return {
        ...game, // NOTE: game = this (the object calling this method)
        theWinner: winningPlayer
      }
    },

    decorators: {
      ...game.decorators,

      processActions(gameToDecorate) { // TODO: Should this be under gameActions?
        // TODO: Handle multiple actions
        if ('make-mark' in gameToDecorate.actions) {
          let pid = gameToDecorate.actions['make-mark'].pid;
          let ind = gameToDecorate.actions['make-mark'].ind;
          let row = Math.floor(ind / 3);
          let col = ind % 3;
          return gameToDecorate.makeMark(pid, row, col).findTheWinner();
        }
      }
    }
  }
}