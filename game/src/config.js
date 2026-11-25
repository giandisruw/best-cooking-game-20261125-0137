// Ember Lane Kitchen — every tuning number, ingredient, recipe and colour in one place.
// The playfield is a fixed 1280x720 logical area; the renderer scales it to the window,
// so no rule below depends on the screen size.

export const FIELD = { width: 1280, height: 720 };

/** The simulation's fixed step, in seconds: 60 updates a second whatever the display's rate. */
export const STEP = 1 / 60;

export const CHEF = {
  radius: 22,
  speed: 300,
  carryOffsetY: -34,
};

export const DAY = {
  /** Seconds a shift lasts. */
  lengthSeconds: 150,
  hearts: 3,
  /** A new level every this many seconds of the shift. */
  levelEverySeconds: 40,
  maxLevel: 3,
};

export const ORDER = {
  maxOpen: 3,
  /** Seconds between new orders at level 1; multiplied by 0.85 per extra level. */
  spawnIntervalSeconds: 14,
  spawnIntervalPerLevel: 0.85,
  /** Seconds of patience at level 1; minus 4 per extra level. */
  patienceSeconds: 52,
  patiencePerLevel: -4,
  /** Base coins and score for serving a dish. */
  baseScore: 100,
  baseCoins: 12,
  /** Extra score for serving with patience still left (up to this much). */
  maxTipScore: 60,
};

export const CHOP = { seconds: 1.1 };

export const STOVE = {
  slots: 2,
  /** Seconds on the burner before a dish is done. */
  cookSeconds: 3.6,
  /** Seconds after done before it burns. */
  burnAfterSeconds: 5,
};

/** How close the chef must be to a station's edge to use it, in pixels. */
export const REACH = 78;

/**
 * Every ingredient. `step` is what turns it from raw into plate-ready:
 * "chop" on the chopping board, "cook" on the stove, "none" straight onto the plate.
 * `key` is the pantry shortcut (1-8) and `station` names where its step happens.
 */
export const INGREDIENTS = [
  { id: 'tomato', name: 'Tomato', step: 'chop', station: 'chop', key: '1', colour: '#e5484d', dark: '#b3272e' },
  { id: 'lettuce', name: 'Lettuce', step: 'chop', station: 'chop', key: '2', colour: '#5cb85c', dark: '#3d8b40' },
  { id: 'mushroom', name: 'Mushroom', step: 'chop', station: 'chop', key: '3', colour: '#c98f5f', dark: '#9a6a42' },
  { id: 'bread', name: 'Bread', step: 'none', station: 'plate', key: '4', colour: '#e8b96a', dark: '#b98a3e' },
  { id: 'patty', name: 'Patty', step: 'cook', station: 'stove', key: '5', colour: '#8a5a3b', dark: '#6b4229' },
  { id: 'egg', name: 'Egg', step: 'cook', station: 'stove', key: '6', colour: '#fff3c4', dark: '#e8c95a' },
  { id: 'noodle', name: 'Noodle', step: 'cook', station: 'stove', key: '7', colour: '#f2c94c', dark: '#c79a1e' },
  { id: 'cheese', name: 'Cheese', step: 'cook', station: 'stove', key: '8', colour: '#f5b81d', dark: '#d18f06' },
];

export const INGREDIENT_BY_ID = Object.fromEntries(INGREDIENTS.map((item) => [item.id, item]));

/**
 * Recipes. `needs` lists plate-ready ingredient ids; the plate matches an order
 * when it holds exactly these (order does not matter). `unlockLevel` gates the
 * recipe until the shift reaches that level, so pressure grows without new chores.
 */
export const RECIPES = [
  { id: 'salad', name: 'Garden Salad', needs: ['tomato', 'lettuce'], unlockLevel: 1, blurb: 'Fresh & crunchy' },
  { id: 'burger', name: 'Ember Burger', needs: ['patty', 'bread', 'tomato'], unlockLevel: 1, blurb: 'Grilled & juicy' },
  { id: 'noodles', name: 'Sunny Noodles', needs: ['noodle', 'egg', 'mushroom'], unlockLevel: 2, blurb: 'Slurpy & sunny' },
  { id: 'toast', name: 'Melt Toast', needs: ['cheese', 'bread', 'tomato'], unlockLevel: 3, blurb: 'Gooey & golden' },
];

export const RECIPE_BY_ID = Object.fromEntries(RECIPES.map((recipe) => [recipe.id, recipe]));

/** Where each station sits on the 1280x720 floor. */
export const STATIONS = {
  pantry: { x: 36, y: 190, w: 348, h: 84, label: 'PANTRY — pick ingredients (1-8)' },
  chop: { x: 470, y: 190, w: 172, h: 84, label: 'CHOP BOARD' },
  stove: { x: 728, y: 190, w: 330, h: 84, label: 'STOVE — grill & boil' },
  bin: { x: 36, y: 566, w: 150, h: 96, label: 'BIN' },
  plate: { x: 470, y: 566, w: 340, h: 96, label: 'PLATING COUNTER' },
  serve: { x: 896, y: 566, w: 348, h: 96, label: 'SERVE HATCH' },
};

export const PALETTE = {
  floor: '#3a2e24',
  floorTile: '#443729',
  wall: '#f2e3c6',
  wallTrim: '#d94f30',
  hud: '#241a12',
  hudText: '#ffe9b8',
  accent: '#ffb03a',
  accentDark: '#d94f30',
  panel: '#fff6e0',
  panelEdge: '#d9c49a',
  textDark: '#33261a',
  muted: '#8a7a63',
  good: '#3fae5a',
  bad: '#e5484d',
  warn: '#f5a623',
  chefShirt: '#f4f1e8',
  chefHat: '#ffffff',
  chefSkin: '#f2c79b',
  apron: '#d94f30',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Where the best shift score is kept between visits (this browser only). */
export const BEST_KEY = 'ember-lane-kitchen.best';
