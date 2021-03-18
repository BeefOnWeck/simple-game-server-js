import { gameState } from './t3-state.mjs';

// If there are any game properties we want to define or overide
export const gameProps = (game = gameState) => {
  return {
    ...game, // Copy game object and mixin (last in wins)

    theWinner: null,

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