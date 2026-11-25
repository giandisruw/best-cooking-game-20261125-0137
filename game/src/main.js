// Ember Lane Kitchen — the entry point: the frame loop, input wiring and sound.
// It owns the canvas and the clock; the rules live in kitchen.js, the drawing in
// render.js, the sounds in audio.js. `?shot=title|play|serve|rush` stages a fixed
// scene for screenshots instead of starting a live shift.

import { FIELD, STEP, INGREDIENTS } from './config.js';
import {
  createKitchen, startShift, loadBest, updateKitchen, interactWithStation,
  grabIngredient, binCarried, clickFloor, clickPantryBin, nearestStation,
} from './kitchen.js';
import { createSoundBank } from './audio.js';
import { createInput } from './input.js';
import { renderGame, pantryBinAt } from './render.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const context = canvas.getContext('2d');
const statusLine = document.getElementById('status');
const input = createInput(canvas);
const sounds = createSoundBank();
const state = createKitchen();
loadBest(state);

const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
if (shotName) {
  stageShot(shotName, state);
  state.screen = state.screen === 'title' ? 'title' : 'play';
} else {
  state.screen = 'title';
}

/** Fit the 1280x720 field into the window, letterboxed, with crisp pixels. */
function resizeCanvas() {
  const scale = Math.min(window.innerWidth / FIELD.width, window.innerHeight / FIELD.height);
  canvas.width = Math.round(FIELD.width * scale);
  canvas.height = Math.round(FIELD.height * scale);
  canvas.style.width = `${canvas.width}px`;
  canvas.style.height = `${canvas.height}px`;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

const SOUND_FOR_EVENT = {
  grab: () => sounds.playGrab(),
  'chop-start': () => sounds.playChop(),
  chopped: () => sounds.playChopped(),
  'cook-start': () => sounds.playCookStart(),
  cooked: () => sounds.playCookDone(),
  burnt: () => sounds.playBurnt(),
  'pickup-cooked': () => sounds.playGrab(),
  'pickup-burnt': () => sounds.playError(),
  plate: () => sounds.playPlate(),
  'pickup-plate': () => sounds.playGrab(),
  serve: () => sounds.playServe(),
  bin: () => sounds.playClick(),
  error: () => sounds.playError(),
  expire: () => sounds.playExpire(),
  levelup: () => sounds.playLevelUp(),
  dayover: () => sounds.playDayEnd(),
};

function playEvents(events) {
  let sizzle = false;
  for (const event of events) {
    if (event === 'sizzle-on') { sizzle = true; continue; }
    if (event === 'sizzle-off') continue;
    const play = SOUND_FOR_EVENT[event];
    if (play) play();
  }
  if (sizzle) sounds.startSizzle();
  else sounds.stopSizzle();
}

/** The E / Space / click-on-a-station action, routed to the nearest station. */
function useNearestStation() {
  const stationId = nearestStation(state);
  if (!stationId) {
    if (state.carrying) { /* standing in the open with food: nothing to use */ }
    return;
  }
  playEvents([interactWithStation(state, stationId)]);
}

/** Handle one frame of input while a shift is running. */
function handlePlayInput() {
  if (input.wasPressed('p') || input.wasPressed('Escape')) {
    state.screen = 'paused';
    sounds.stopSizzle();
    sounds.stopMusic();
    return;
  }
  if (input.wasPressed('m')) {
    const muted = sounds.toggleMute();
    state.message = { text: muted ? 'Sound off (M to turn back on)' : 'Sound on', until: state.elapsed + 2 };
  }
  if (input.wasPressed('r')) { startShift(state); sounds.startMusic(); return; }
  if (input.wasPressed('q')) playEvents([binCarried(state)]);
  if (input.wasPressed('e') || input.wasPressed(' ')) useNearestStation();
  for (const ingredient of INGREDIENTS) {
    if (input.wasPressed(ingredient.key)) playEvents([grabIngredient(state, ingredient.id)]);
  }
  const click = input.consumeClick();
  if (click) {
    sounds.unlock();
    // The canvas is scaled to the window; clicks arrive in canvas pixels, so
    // convert them back to the 1280x720 logical field the stations live in.
    const logical = { x: (click.x * FIELD.width) / canvas.width, y: (click.y * FIELD.height) / canvas.height };
    const binId = pantryBinAt(logical.x, logical.y);
    if (binId) { playEvents([clickPantryBin(state, binId)]); return; }
    playEvents([clickFloor(state, logical.x, logical.y)]);
  }
}

function handleTitleInput() {
  const click = input.consumeClick();
  if (input.wasPressed('Enter') || input.wasPressed(' ') || click) {
    sounds.unlock();
    sounds.playClick();
    startShift(state);
    sounds.startMusic();
  }
}

function handlePausedInput() {
  if (input.wasPressed('p') || input.wasPressed('Escape') || input.wasPressed('Enter')) {
    state.screen = 'play';
    sounds.startMusic();
  }
  if (input.wasPressed('r')) { startShift(state); sounds.startMusic(); }
}

function handleOverInput() {
  if (input.wasPressed('r') || input.wasPressed('Enter') || input.consumeClick()) {
    sounds.playClick();
    startShift(state);
    sounds.startMusic();
  }
}

function updateStatusLine() {
  if (!statusLine) return;
  if (state.screen === 'title') {
    statusLine.textContent = 'Ember Lane Kitchen. Press Enter to start cooking.';
  } else if (state.screen === 'play') {
    statusLine.textContent = `Score ${state.score}, ${state.orders.length} orders open, `
      + `${Math.ceil(state.timeLeft)} seconds left in the shift.`;
  } else if (state.screen === 'over') {
    statusLine.textContent = `Shift over. Score ${state.score}, ${state.served} dishes served. Press R to cook again.`;
  }
}

/** The fixed-step loop: simulate, then draw, sixty times a second. */
let lastTime = performance.now();
let accumulator = 0;
function frame(now) {
  const deltaSeconds = Math.min(0.1, (now - lastTime) / 1000);
  lastTime = now;
  if (!shotName) {
    if (state.screen === 'title') handleTitleInput();
    else if (state.screen === 'play') handlePlayInput();
    else if (state.screen === 'paused') handlePausedInput();
    else if (state.screen === 'over') handleOverInput();
    accumulator += deltaSeconds;
    while (accumulator >= STEP) {
      const actions = { move: input.moveVector() };
      const events = updateKitchen(state, STEP, actions);
      playEvents(events);
      sounds.tickMusic(STEP);
      accumulator -= STEP;
    }
    updateStatusLine();
  }
  context.setTransform(canvas.width / FIELD.width, 0, 0, canvas.height / FIELD.height, 0, 0);
  renderGame(context, state);
  input.endFrame();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

/**
 * A small hook for automated play-testing: the page's own state, exposed so a
 * test driver can move the chef, use stations and read the score. It changes
 * nothing about the game; it only reads and drives the same public functions.
 */
window.__ember = {
  state,
  startShift: (seed) => startShift(state, seed),
  teleport(x, y) { state.chef.x = x; state.chef.y = y; state.moveTarget = null; },
  grab: (id) => grabIngredient(state, id),
  use: (stationId) => interactWithStation(state, stationId),
  step(seconds) {
    const events = [];
    let remaining = seconds;
    while (remaining > 0) {
      const dt = Math.min(STEP, remaining);
      events.push(...updateKitchen(state, dt, { move: { x: 0, y: 0 } }));
      remaining -= dt;
    }
    return events;
  },
};
