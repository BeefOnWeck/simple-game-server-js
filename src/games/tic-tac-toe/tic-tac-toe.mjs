import { gameCore } from '../gameCore.mjs';
import { gameState } from './t3-state.mjs';
import { gameProps } from './t3-props.mjs';
import { gameActions } from './t3-actions.mjs';

// TODO: Describe functional approach to game composition
const pipe = (...fns) => x => fns.reduce((y, f) => f(y), x);

// This function composition goes from top to bottom.
// It is then applied to `gameCore`.
export const game0 = pipe(
  gameState,
  gameProps,
  gameActions
)(gameCore);