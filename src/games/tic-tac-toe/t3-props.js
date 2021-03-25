import { gameState } from './t3-state.js';

// If there are any game properties we want to define or overide
export const gameProps = (game = gameState) => {
  return {
    ...game, // Copy game object and mixin (last in wins)

    // Metadata should include at least a name and avatar.
    meta: {
      name: 'Tic Tac Toe',
      avatar: 't3.png' // Filename for a 100x100 png
    },

    // Configuration that will get passed to the game selector.
    config: {
      maxTurns: 10
    },

    theWinner: null,

    // These allow methods defined in gameCore to be modified.
    // Alternatively you can overwrite gameCore methods, but that usually 
    // requires more code.
    decorators: {

      // Add `theWinner` to the list of game stats
      getGameStatus(gameToDecorate) {
        return {
          theWinner: gameToDecorate.theWinner ? gameToDecorate.theWinner : null
        };
      },

      // When adding a player, assign them a mark to use ('x' or 'o')
      addPlayer(gameToDecorate) {
        // Do we have two players yet?
        // If so, move to the next phase and the first round.
        let updatedGame = gameToDecorate.numPlayers == 2 ?
          gameToDecorate.nextPhase().nextRound() :
          gameToDecorate;

        // If we somehow have more than two players, remove the extra.
        // Otherwise, assign each player a mark.
        let updatedPlayerList = gameToDecorate.numPlayers <= 2 ?
          gameToDecorate.players.map((p,i) => ({
            ...p,
            mark: gameToDecorate.state.marks[i]
          })) : 
          gameToDecorate.players.slice(0,1);

        // Return the updated game with the updated players mixed in.
        return {
          ...updatedGame,
          players: updatedPlayerList
        };
      }
    }

  }
}