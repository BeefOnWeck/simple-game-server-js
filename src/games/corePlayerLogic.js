import {coreTransitionLogic} from './coreTransitionLogic.js';

// This module defines the logic for handling player actions and turns.

// The default argument is just there to explicitly show the dependency; 
// it is expected that this function will be applied to a game object.
export const corePlayerLogic = (game = coreTransitionLogic) => {
  return {
    ...game, // Copy input game object and mixin changes (last in wins)

    // Adds a player to the game
    addPlayer(username, id, game = this) {
      // If this is the first player, grab their id
      // Otherwise grab the id of the first player
      const firstId = game.players.length === 0 ? 
        id : 
        game.firstPlayerId;

      // Form an update to the core properties
      const updateWithNewPlayer = {
        players: [
          ...game.players, {
            name: username,
            id: id
          }
        ],
        numPlayers: game.numPlayers + 1, // TODO: test this
        activePlayerId: firstId,
        firstPlayerId: firstId
      };

      // Games can define a decorator to augment/overide what happens when 
      // players are added.
      const decorators = game.decorators['addPlayer'] ? 
        game.decorators['addPlayer'] : 
        () => ({});

      // Return a copy of the game with our updates mixed in
      const returnObject = {
        ...game, // NOTE: game = this (object calling this method)
        ...updateWithNewPlayer
      };

      return {
        ...returnObject,
        ...decorators(returnObject)
      };
    },

    setActivePlayer(id, game = this) { // TODO: Test
      return {
        ...game, // NOTE: game = this (object calling this method)
        activePlayerId: id // TODO: Check that we're in the play phase (how to make sure things are couopled?)
      }
    },

    // Go to the next player
    // This may increment the round
    nextPlayer(game = this) { // TODO: Test
      // TODO: Error out if there is not active player
      // TODO: Check that we're in the play phase (how to make sure things are coupled?)
      // NOTE: This assumes players go once per round (may need to relax in the future)
      let activePlayerIndex = game.players.findIndex(p => p.id === game.activePlayerId);
      let nextPlayerIndex = (activePlayerIndex + 1) % game.numPlayers;
      return {
        ...game, // NOTE: game = this (object calling this method)
        round: nextPlayerIndex === 0 ? game.round + 1 : game.round, // increment the round if we're back to the first player
        activePlayerId: game.players[nextPlayerIndex].id
      }
    },

    // For handling actions defined as a key:value dictionary.
    // See corePropsAndState.js for more information.
    processActions(actions, game = this) {
      // Games must define a decorator to implement player actions.
      const decorators = game.decorators['processActions'] ? 
        game.decorators['processActions'] : 
        () => ({});

      // If a game does not define any processAction decorators, 
      const returnObject = {
        ...game, // NOTE: game = this (object calling this method)
        actions: actions
      };

      return {
        ...game, // NOTE: game = this (object calling this method)
        ...decorators(returnObject)
      };
    }

  };
};