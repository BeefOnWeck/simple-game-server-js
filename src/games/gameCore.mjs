import {corePropsAndState} from './corePropsAndState.mjs';
import {coreTransitionLogic} from './coreTransitionLogic.mjs';
import {corePlayerLogic} from './corePlayerLogic.mjs';

// The game object is created using a composition of functions we call 
// a "pipeline."
// Each function in the composition takes the game object as input and returns 
// a new game object with additional and/or modified properties and methods.
// For more information, see: 
// https://medium.com/javascript-scene/composing-software-an-introduction-27b72500d6ea

// `pipe` is a function that allows us to form the composition.
// `pipe` returns a function which is then applied to another object.
const pipe = (...fns) => x => fns.reduce((y, f) => f(y), x);

// The function composition or "pipeline" is read from top to bottom.
// That is, the first function is applied first, the second function is then 
// applied to the output of the first function, and so on.
// Remember that `pipe` is a function that returns another function, which must 
// be then applied to something.

// Our core game object.
export const gameCore = pipe(
  coreTransitionLogic,
  corePlayerLogic
)(corePropsAndState);
// NOTE: This could also be written as:
// gameCore = corePlayerLogic(coreTransitionLogic(corePropsAndState))
