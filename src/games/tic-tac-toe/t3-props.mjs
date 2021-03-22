import { gameState } from './t3-state.mjs';

// If there are any game properties we want to define or overide
export const gameProps = (game = gameState) => {
  return {
    ...game, // Copy game object and mixin (last in wins)

    // Metadata should include at least a name and avatar
    meta: {
      name: 'Tic Tac Toe',
      avatar: 't3.png' // Filename for a 100x100 png
    },

    config: {
      maxTurns: 10
    },

    theWinner: null,

    decorators: {

      // Add `theWinner` to the list of game stats
      getGameStatus(gameToDecorate) {
        return {
          theWinner: gameToDecorate.theWinner ? gameToDecorate.theWinner : null
        };
      },

      // When adding a player, assign them a mark to use ('x' or 'o')
      addPlayer(gameToDecorate) {
        let updatedGame = gameToDecorate.numPlayers == 2 ?
          gameToDecorate.nextPhase().nextRound() :
          gameToDecorate;

        let updatedPlayerList = gameToDecorate.numPlayers <= 2 ?
          gameToDecorate.players.map((p,i) => ({
            ...p,
            mark: gameToDecorate.state.marks[i] // TODO: Throw error when i > 1
          })) : 
          gameToDecorate.players.slice(0,1);

        console.log(updatedPlayerList);

        return {
          ...updatedGame,
          players: updatedPlayerList
        };
      }
    }

  }
}