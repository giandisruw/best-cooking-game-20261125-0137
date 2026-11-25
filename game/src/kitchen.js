// Ember Lane Kitchen — the rules, and nothing else: orders, chopping, cooking,
// plating and serving. It knows nothing about drawing or sound; it returns events
// ("serve", "expire", "burnt" ...) and the caller plays them.

import {
  FIELD, CHEF, DAY, ORDER, CHOP, STOVE, REACH, STATIONS,
  INGREDIENTS, INGREDIENT_BY_ID, RECIPES, RECIPE_BY_ID, BEST_KEY,
} from './config.js';

/** A small seeded generator, so a staged scene always deals the same orders. */
export function mulberry32(seed) {
  let state = seed >>> 0;
  return function nextRandom() {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

/** A fresh kitchen: title screen, no shift running yet. */
export function createKitchen(seed = 20261125) {
  return {
    screen: 'title',
    seed,
    random: mulberry32(seed),
    elapsed: 0,
    timeLeft: DAY.lengthSeconds,
    level: 1,
    score: 0,
    coins: 0,
    combo: 0,
    bestCombo: 0,
    hearts: DAY.hearts,
    served: 0,
    expiredCount: 0,
    burntCount: 0,
    chef: { x: 640, y: 430, face: 1, moving: false, walkPhase: 0 },
    moveTarget: null,
    carrying: null,
    plate: [],
    orders: [],
    stove: [null, null],
    chopping: null,
    spawnTimer: 6,
    lastRecipeId: null,
    message: { text: '', until: 0 },
    banner: { text: '', until: 0 },
    best: 0,
    stars: 0,
    dayOverReason: '',
  };
}

/** Start (or restart) a shift: fresh orders, empty counters, full patience. */
export function startShift(state, seed = (Date.now() % 2147483647) || 1) {
  const fresh = createKitchen(seed);
  fresh.screen = 'play';
  fresh.best = state.best || 0;
  Object.assign(state, fresh);
  state.best = fresh.best;
  spawnOrder(state);
  state.spawnTimer = ORDER.spawnIntervalSeconds;
  showBanner(state, 'SHIFT START! Serve every order!');
  return state;
}

export function loadBest(state) {
  try { state.best = Number(window.localStorage.getItem(BEST_KEY) || 0) || 0; } catch (error) { state.best = 0; }
  return state.best;
}

export function saveBest(state) {
  if (state.score <= state.best) return;
  state.best = state.score;
  try { window.localStorage.setItem(BEST_KEY, String(state.best)); } catch (error) { /* private mode */ }
}

export function showMessage(state, text, seconds = 2.2) {
  state.message = { text, until: state.elapsed + seconds };
}

export function showBanner(state, text, seconds = 2.4) {
  state.banner = { text, until: state.elapsed + seconds };
}

/** The station whose rect contains the point, or null. */
export function stationAtPoint(x, y) {
  for (const [id, rect] of Object.entries(STATIONS)) {
    if (x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h) return id;
  }
  return null;
}

/** Distance from a point to a rectangle's edge (0 when inside it). */
function distanceToRect(x, y, rect) {
  const dx = Math.max(rect.x - x, 0, x - (rect.x + rect.w));
  const dy = Math.max(rect.y - y, 0, y - (rect.y + rect.h));
  return Math.hypot(dx, dy);
}

/** The station the chef can reach right now, or null. */
export function nearestStation(state) {
  let bestId = null;
  let bestDistance = Infinity;
  for (const [id, rect] of Object.entries(STATIONS)) {
    const distance = distanceToRect(state.chef.x, state.chef.y, rect);
    if (distance < bestDistance) { bestDistance = distance; bestId = id; }
  }
  return bestDistance <= REACH ? bestId : null;
}

/** Does the plate hold exactly the recipe's ingredients, in any order? */
export function plateMatchesRecipe(plate, recipe) {
  if (plate.length !== recipe.needs.length) return false;
  const remaining = [...recipe.needs];
  for (const item of plate) {
    const index = remaining.indexOf(item);
    if (index === -1) return false;
    remaining.splice(index, 1);
  }
  return true;
}

/** The open order this plate completes, or null. */
export function matchingOrder(state) {
  for (const order of state.orders) {
    if (plateMatchesRecipe(state.plate, RECIPE_BY_ID[order.recipeId])) return order;
  }
  return null;
}

export function isPlateComplete(state) {
  return state.plate.length > 0 && matchingOrder(state) !== null;
}

function unlockedRecipes(state) {
  return RECIPES.filter((recipe) => recipe.unlockLevel <= state.level);
}

function pickRecipe(state) {
  const pool = unlockedRecipes(state);
  let recipe = pool[Math.floor(state.random() * pool.length)];
  if (pool.length > 1 && recipe.id === state.lastRecipeId) {
    recipe = pool[(pool.indexOf(recipe) + 1) % pool.length];
  }
  state.lastRecipeId = recipe.id;
  return recipe;
}

export function spawnOrder(state, recipeId = null, patienceSeconds = null) {
  const recipe = recipeId ? RECIPE_BY_ID[recipeId] : pickRecipe(state);
  const patience = patienceSeconds ?? Math.max(30, ORDER.patienceSeconds + (state.level - 1) * ORDER.patiencePerLevel);
  const order = {
    id: state.orders.length + state.served + state.expiredCount + 1,
    recipeId: recipe.id,
    timeLeft: patience,
    patienceMax: patience,
  };
  state.orders.push(order);
  return order;
}

/** Grab a raw ingredient from the pantry; hands must be empty and chef near it. */
export function grabIngredient(state, ingredientId) {
  const ingredient = INGREDIENT_BY_ID[ingredientId];
  if (!ingredient) return 'error';
  if (state.carrying) { showMessage(state, 'Hands full! Serve or bin it first (Q).'); return 'error'; }
  if (nearestStation(state) !== 'pantry') { showMessage(state, 'Go to the PANTRY to grab ingredients.'); return 'error'; }
  state.carrying = { kind: 'item', id: ingredientId, state: 'raw' };
  return 'grab';
}

function startChopping(state) {
  const carried = state.carrying;
  if (!carried || carried.kind !== 'item' || carried.state !== 'raw') {
    showMessage(state, 'Bring a raw tomato, lettuce or mushroom here.');
    return 'error';
  }
  const ingredient = INGREDIENT_BY_ID[carried.id];
  if (ingredient.step !== 'chop') {
    showMessage(state, `${ingredient.name} does not need chopping — it goes on the stove.`);
    return 'error';
  }
  state.chopping = { id: carried.id, done: 0, total: CHOP.seconds };
  return 'chop-start';
}

function useStove(state) {
  const carried = state.carrying;
  if (carried && carried.kind === 'item' && carried.state === 'raw') {
    const ingredient = INGREDIENT_BY_ID[carried.id];
    if (ingredient.step !== 'cook') {
      showMessage(state, `${ingredient.name} does not cook — chop it or plate it raw.`);
      return 'error';
    }
    const slot = state.stove.findIndex((item) => item === null);
    if (slot === -1) { showMessage(state, 'Both burners are busy!'); return 'error'; }
    state.stove[slot] = { id: carried.id, state: 'cooking', done: 0 };
    state.carrying = null;
    return 'cook-start';
  }
  if (state.carrying) { showMessage(state, 'Hands full — the stove needs an empty hand to collect.'); return 'error'; }
  const slot = state.stove.findIndex((item) => item && item.state !== 'cooking');
  if (slot === -1) { showMessage(state, 'Nothing ready yet — wait for the sizzle to finish.'); return 'error'; }
  const item = state.stove[slot];
  state.stove[slot] = null;
  state.carrying = { kind: 'item', id: item.id, state: item.state === 'burnt' ? 'burnt' : 'ready' };
  return item.state === 'burnt' ? 'pickup-burnt' : 'pickup-cooked';
}

function usePlateCounter(state) {
  const carried = state.carrying;
  if (carried && carried.kind === 'item') {
    if (carried.state === 'burnt') { showMessage(state, 'Burnt! Bin it (Q) — nobody eats that.'); return 'error'; }
    // Raw food needs its step first — except bread, which plates as it is.
    if (carried.state === 'raw' && INGREDIENT_BY_ID[carried.id].step !== 'none') {
      showMessage(state, 'Chop or cook it first — raw food never goes on the plate.');
      return 'error';
    }
    if (state.plate.length >= 3) { showMessage(state, 'The plate is full.'); return 'error'; }
    if (state.plate.includes(carried.id)) { showMessage(state, 'That is already on the plate.'); return 'error'; }
    state.plate.push(carried.id);
    state.carrying = null;
    if (isPlateComplete(state)) showMessage(state, 'Plate complete — pick it up and SERVE it!');
    return 'plate';
  }
  if (carried && carried.kind === 'plate') { showMessage(state, 'You are already carrying a plate.'); return 'error'; }
  if (!isPlateComplete(state)) {
    showMessage(state, state.plate.length === 0
      ? 'Bring chopped or cooked food here to build a plate.'
      : 'This plate does not match any order yet — check the tickets!');
    return 'error';
  }
  state.carrying = { kind: 'plate', items: [...state.plate] };
  state.plate = [];
  return 'pickup-plate';
}

function useServeHatch(state) {
  const carried = state.carrying;
  if (!carried || carried.kind !== 'plate') {
    showMessage(state, 'Bring a finished plate to the SERVE HATCH.');
    return 'error';
  }
  const order = state.orders.find((item) => plateMatchesRecipe(carried.items, RECIPE_BY_ID[item.recipeId]));
  if (!order) { showMessage(state, 'No open order wants this plate!'); return 'error'; }
  state.orders.splice(state.orders.indexOf(order), 1);
  state.carrying = null;
  state.combo += 1;
  state.bestCombo = Math.max(state.bestCombo, state.combo);
  const tip = Math.round(ORDER.maxTipScore * (order.timeLeft / order.patienceMax));
  const multiplier = Math.min(3, 1 + 0.25 * (state.combo - 1));
  const earned = Math.round((ORDER.baseScore + tip) * multiplier);
  const coins = ORDER.baseCoins + Math.round(tip / 6) + state.combo * 2;
  state.score += earned;
  state.coins += coins;
  state.served += 1;
  showMessage(state, `Served ${RECIPE_BY_ID[order.recipeId].name}! +${earned} pts, +${coins} coins${state.combo > 1 ? ` — COMBO x${state.combo}!` : ''}`);
  return 'serve';
}

function useBin(state) {
  if (!state.carrying) { showMessage(state, 'Nothing to throw away.'); return 'error'; }
  state.carrying = null;
  return 'bin';
}

/** Use the named station; returns an event name for the caller to sound. */
export function interactWithStation(state, stationId) {
  if (state.chopping) return 'error';
  switch (stationId) {
    case 'pantry': showMessage(state, 'Pick an ingredient: click a bin or press 1-8.'); return 'hint';
    case 'chop': return startChopping(state);
    case 'stove': return useStove(state);
    case 'plate': return usePlateCounter(state);
    case 'serve': return useServeHatch(state);
    case 'bin': return useBin(state);
    default: return 'error';
  }
}

/** Throw away whatever is carried (the Q key). */
export function binCarried(state) {
  if (!state.carrying) return 'error';
  state.carrying = null;
  return 'bin';
}

/** One fixed simulation step while the shift is running. Returns event names. */
export function updateKitchen(state, dt, actions) {
  const events = [];
  if (state.screen !== 'play') return events;
  state.elapsed += dt;
  state.timeLeft = Math.max(0, DAY.lengthSeconds - state.elapsed);

  const level = Math.min(DAY.maxLevel, Math.floor(state.elapsed / DAY.levelEverySeconds) + 1);
  if (level !== state.level) {
    state.level = level;
    showBanner(state, `LEVEL ${level}! New recipes, faster orders!`);
    events.push('levelup');
  }

  // Chopping finishes on its own; the chef stands still while the knife works.
  if (state.chopping) {
    state.chopping.done += dt;
    if (state.chopping.done >= state.chopping.total) {
      state.carrying = { kind: 'item', id: state.chopping.id, state: 'ready' };
      state.chopping = null;
      events.push('chopped');
    }
  } else {
    moveChef(state, dt, actions);
  }

  // The stove keeps cooking while the chef runs around.
  let anythingCooking = false;
  for (const slot of state.stove) {
    if (!slot) continue;
    slot.done += dt;
    if (slot.state === 'cooking') {
      anythingCooking = true;
      if (slot.done >= STOVE.cookSeconds) { slot.state = 'done'; slot.done = 0; events.push('cooked'); }
    } else if (slot.state === 'done') {
      if (slot.done >= STOVE.burnAfterSeconds) {
        slot.state = 'burnt';
        slot.done = 0;
        state.burntCount += 1;
        showMessage(state, 'Something burnt on the stove!');
        events.push('burnt');
      }
    }
  }
  events.push(anythingCooking ? 'sizzle-on' : 'sizzle-off');

  // Orders lose patience; an expired ticket costs a heart and the combo.
  for (let i = state.orders.length - 1; i >= 0; i -= 1) {
    const order = state.orders[i];
    order.timeLeft -= dt;
    if (order.timeLeft <= 0) {
      state.orders.splice(i, 1);
      state.expiredCount += 1;
      state.hearts -= 1;
      state.combo = 0;
      showMessage(state, `Order expired! A customer walked out. (${state.hearts} hearts left)`);
      events.push('expire');
    }
  }

  // New orders arrive on a timer, faster as the shift heats up.
  state.spawnTimer -= dt;
  if (state.spawnTimer <= 0 && state.orders.length < ORDER.maxOpen) {
    spawnOrder(state);
    state.spawnTimer = ORDER.spawnIntervalSeconds * Math.pow(ORDER.spawnIntervalPerLevel, state.level - 1);
  }

  if (state.timeLeft <= 0 || state.hearts <= 0) {
    state.screen = 'over';
    state.dayOverReason = state.hearts <= 0 ? 'The customers all walked out...' : 'Shift over!';
    state.stars = state.served >= 12 ? 3 : state.served >= 8 ? 2 : state.served >= 4 ? 1 : 0;
    saveBest(state);
    events.push('dayover');
  }
  return events;
}

/** Walk the chef: arrow keys / WASD first, otherwise toward a clicked target. */
export function moveChef(state, dt, actions) {
  const chef = state.chef;
  let vx = actions.move.x;
  let vy = actions.move.y;
  if (vx === 0 && vy === 0 && state.moveTarget) {
    const dx = state.moveTarget.x - chef.x;
    const dy = state.moveTarget.y - chef.y;
    const distance = Math.hypot(dx, dy);
    if (distance < 6) {
      const target = state.moveTarget;
      state.moveTarget = null;
      if (target.station && STATIONS[target.station]) interactWithStation(state, target.station);
      vx = 0;
      vy = 0;
    } else {
      vx = dx / distance;
      vy = dy / distance;
    }
  }
  if (vx !== 0 || vy !== 0) {
    chef.face = vx < 0 ? -1 : vx > 0 ? 1 : chef.face;
    chef.moving = true;
    chef.walkPhase += dt * 10;
    chef.x = Math.min(FIELD.width - 30, Math.max(30, chef.x + vx * CHEF.speed * dt));
    chef.y = Math.min(556, Math.max(282, chef.y + vy * CHEF.speed * dt));
  } else {
    chef.moving = false;
  }
}

/** A click on the floor: walk there; a click on a station: walk to it, then use it. */
export function clickFloor(state, x, y) {
  const stationId = stationAtPoint(x, y);
  if (stationId) {
    const rect = STATIONS[stationId];
    const targetX = Math.min(Math.max(x, rect.x), rect.x + rect.w);
    const targetY = rect.y < 300 ? rect.y + rect.h + 34 : rect.y - 34;
    if (distanceToRect(state.chef.x, state.chef.y, rect) <= REACH) {
      if (stationId === 'pantry') { showMessage(state, 'Pick an ingredient: click a bin or press 1-8.'); return 'hint'; }
      return interactWithStation(state, stationId);
    }
    state.moveTarget = { x: targetX, y: targetY, station: stationId };
    return 'walk';
  }
  state.moveTarget = { x: Math.min(1250, Math.max(30, x)), y: Math.min(556, Math.max(282, y)) };
  return 'walk';
}

/** A click on a pantry bin: grab that ingredient when close enough. */
export function clickPantryBin(state, ingredientId) {
  if (nearestStation(state) !== 'pantry') {
    state.moveTarget = { x: 210, y: 308 };
    showMessage(state, 'Walking to the pantry — click the bin again when close.');
    return 'walk';
  }
  return grabIngredient(state, ingredientId);
}

export { INGREDIENTS, INGREDIENT_BY_ID };
