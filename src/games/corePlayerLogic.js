import {coreTransitionLogic} from './coreTransitionLogic.js';

// This module defines the logic for handling player actions and turns.

// The default argument is just there to explicitly show the dependency; 
// it is expected that this function will be applied to a game object.

export const corePlayerLogic = (game = coreTransitionLogic) => {
  return {
    ...game, // Copy input game object and mixin changes (last in wins)

    addPlayer(username, id, game = this) {
      const firstId = game.players.length === 0 ? 
        id : 
        game.firstPlayerId;

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
    // See corePropsAndState.mjs for more information.
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