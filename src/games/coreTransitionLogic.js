import {corePropsAndState} from './corePropsAndState.js';

// This module defines the core logic for transitioning between 
// phases and rounds in the game.

// The default argument is just there to explicitly show the dependency; 
// it is expected that this function will be applied to a game object.

export const coreTransitionLogic = (game = corePropsAndState) => {
  return {
    ...game, // Copy input game object and mixin changes (last in wins)

    // DEPRECATED: There is a better way to reset the game
    reset() {
      return game;
    },

    // Return information meant to summarize a game in progress
    getGameStatus(game = this) {
      // Core game status
      const gameStatus =  {
        phase: game.phase, // NOTE: game = this (object calling this method)
        round: game.round,
        activePlayer: game.activePlayerId,
        players: game.players,
        state: game.state
      };

      // Games can define a decorator to augment/overide the game status
      const decorators = game.decorators['getGameStatus'] ? 
        game.decorators['getGameStatus'] : 
        () => ({});

      return {
        ...gameStatus,
        ...decorators(game)
      };
    },

    // Moves the game to the next round
    nextRound(game = this) {
      return {
        ...game, // NOTE: game = this (object calling this method)
        round: game.round + 1 // TODO: test this
      };
    },

    // Moves the game to the next phase
    nextPhase(game = this) { // TODO: Change so that we have to specify what phase to move to, with checks for allowable transition
      let theNextPhase;
      if (game.phase === 'end') {
        return game; // TODO: Throw error? Reset the game?
      }
      // These phases are really just for enabling and disabling functionality.
      switch(game.phase) {
        case 'boot': // Boot is when players can join the game
          theNextPhase = 'setup';
          break;
        case 'setup': // Setup is where players take any setup actions
          theNextPhase = 'play';
          break;
        case 'play': // Play is the actual game
          theNextPhase = 'end';
          break; 
      }
      return {
        ...game, // NOTE: game = this (object calling this method)
        phase: theNextPhase
      };
    }

  }
};