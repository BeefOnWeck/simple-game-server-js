import { gameCore } from '../gameCore.mjs';


// The game state is defined here
export const gameState = (game = gameCore) => {
  return {
    ...game, // Copy game object and mixin (last in wins)

    state: {
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

  }
}