
// These are the core properties that the game starts with.
// Additional properties and functionality are added by mixing them in 
// via function composition.
// See gameCore.mjs for more information.

// This object literal is the basis for our final game object.
// Most of the values below are going to be overwritten by the pipeline 
// of functions defined by a game implementation.

export const corePropsAndState = {
  // Metadata for describing a particular game
  meta: {
    name: 'Game Core', // Human-friendly name of the game
    avatar: null // Should be the name of a 100x100 PNG file
  },
  config: {}, // Game-specific configuration
  phase: 'boot', // Four phases: boot, setup, play, and end
  round: 0, // Once game enters 'play' phase, this will start incrementing
  players: [], // An array of objects describing each player
  numPlayers: 0,
  activePlayerId: null,
  firstPlayerId: null,
  state: {}, // Game-specific state information (changes via player actions)
  decorators: {}, // Decorators used overide core game properties and methods
  actions: {} // Game-specific actions players can take
};