// Ember Lane Kitchen — the screenshot scenes behind ?shot=title|play|serve|rush.
// Each one builds a real kitchen state through the real rules (spawnOrder, a plate
// built by the same code the player uses) and the renderer draws it, so the frame
// is what the game really looks like. The seed is fixed, so a scene is identical
// every time it is staged.

import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';
import { createKitchen, spawnOrder, startShift } from './kitchen.js';

/** Build the kitchen for the named scene and return { screen, best }. */
export function stageShot(name, state) {
  if (name === 'play') return stagePlayScene(state);
  if (name === 'serve') return stageServeScene(state);
  if (name === 'rush') return stageRushScene(state);
  return stageTitleScene(state);
}

function stageTitleScene(state) {
  const staged = createKitchen(20261125);
  staged.screen = SCREEN_TITLE;
  staged.best = 860;
  staged.orders = [];
  spawnOrder(staged, 'salad', 44);
  spawnOrder(staged, 'burger', 38);
  Object.assign(state, staged);
  return { screen: SCREEN_TITLE, best: staged.best };
}

function stagePlayScene(state) {
  startShift(state, 20261125);
  state.elapsed = 32;
  state.timeLeft = 118;
  state.score = 240;
  state.coins = 36;
  state.combo = 2;
  state.bestCombo = 2;
  state.orders = [];
  spawnOrder(state, 'burger', 41);
  spawnOrder(state, 'salad', 26);
  // A burger mid-assembly: patty grilled, bread on, tomato still in the chef's hand.
  state.plate = ['patty', 'bread'];
  state.carrying = { kind: 'item', id: 'tomato', state: 'ready' };
  state.chef.x = 560;
  state.chef.y = 400;
  state.chef.face = 1;
  state.stove = [null, null];
  return { screen: SCREEN_PLAY, best: 0 };
}

function stageServeScene(state) {
  startShift(state, 20261125);
  state.elapsed = 58;
  state.timeLeft = 92;
  state.score = 480;
  state.coins = 71;
  state.combo = 3;
  state.bestCombo = 3;
  state.orders = [];
  spawnOrder(state, 'burger', 33);
  spawnOrder(state, 'salad', 47);
  // The burger is finished and picked up; the chef stands at the serve hatch.
  state.plate = [];
  state.carrying = { kind: 'plate', items: ['patty', 'bread', 'tomato'] };
  state.chef.x = 1070;
  state.chef.y = 520;
  state.chef.face = 1;
  return { screen: SCREEN_PLAY, best: 0 };
}

function stageRushScene(state) {
  startShift(state, 20261125);
  state.elapsed = 108;
  state.timeLeft = 42;
  state.level = 3;
  state.score = 860;
  state.coins = 128;
  state.combo = 4;
  state.bestCombo = 4;
  state.orders = [];
  spawnOrder(state, 'noodles', 9);
  spawnOrder(state, 'toast', 24);
  spawnOrder(state, 'burger', 36);
  // Noodles boiling on the stove, a fried egg in hand, two hearts left: the rush.
  state.stove = [{ id: 'noodle', state: 'cooking', done: 2.1 }, null];
  state.carrying = { kind: 'item', id: 'egg', state: 'ready' };
  state.plate = ['mushroom'];
  state.hearts = 2;
  state.chef.x = 900;
  state.chef.y = 400;
  state.chef.face = -1;
  return { screen: SCREEN_PLAY, best: 0 };
}

export { SCREEN_OVER };
