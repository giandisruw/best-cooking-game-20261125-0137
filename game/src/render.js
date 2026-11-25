// Ember Lane Kitchen — everything the player sees: the kitchen, the order board,
// the chef, the plate and every screen. Canvas vector art only, drawn fresh each
// frame from the kitchen state; no images, no fonts fetched, nothing from a network.

import { FIELD, STATIONS, INGREDIENTS, INGREDIENT_BY_ID, RECIPE_BY_ID, PALETTE, FONT } from './config.js';
import { isPlateComplete, matchingOrder, nearestStation } from './kitchen.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';

/** The pantry's eight bins, laid out across its counter, for clicks and drawing. */
export function pantryBins() {
  const rect = STATIONS.pantry;
  const binWidth = (rect.w - 16) / INGREDIENTS.length;
  return INGREDIENTS.map((ingredient, index) => ({
    id: ingredient.id,
    x: rect.x + 8 + index * binWidth,
    y: rect.y + 26,
    w: binWidth - 4,
    h: 44,
  }));
}

/** Which pantry bin the point falls in, or null. */
export function pantryBinAt(x, y) {
  for (const bin of pantryBins()) {
    if (x >= bin.x && x <= bin.x + bin.w && y >= bin.y && y <= bin.y + bin.h) return bin.id;
  }
  return null;
}

function roundRect(ctx, x, y, w, h, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function text(ctx, value, x, y, size, colour, weight = 700, align = 'left') {
  ctx.fillStyle = colour;
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(value, x, y);
}

/** One ingredient's vector icon: tomato, lettuce, mushroom, bread, patty, egg, noodle, cheese. */
export function drawIngredientIcon(ctx, id, cx, cy, size) {
  const r = size / 2;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.lineWidth = Math.max(1.5, size * 0.05);
  switch (id) {
    case 'tomato': {
      ctx.fillStyle = '#e5484d';
      ctx.beginPath(); ctx.arc(0, r * 0.1, r * 0.85, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#3fae5a';
      ctx.beginPath();
      for (let i = 0; i < 5; i += 1) {
        const a = -Math.PI / 2 + (i * Math.PI * 2) / 5;
        ctx.moveTo(0, -r * 0.55);
        ctx.lineTo(Math.cos(a) * r * 0.5, -r * 0.55 + Math.sin(a) * r * 0.4);
      }
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.beginPath(); ctx.arc(-r * 0.3, -r * 0.25, r * 0.22, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'lettuce': {
      ctx.fillStyle = '#5cb85c';
      for (let i = -1; i <= 1; i += 1) {
        ctx.beginPath(); ctx.arc(i * r * 0.5, r * 0.15, r * 0.55, 0, Math.PI * 2); ctx.fill();
      }
      ctx.strokeStyle = '#3d8b40';
      ctx.beginPath(); ctx.moveTo(0, -r * 0.5); ctx.quadraticCurveTo(r * 0.2, r * 0.2, 0, r * 0.7); ctx.stroke();
      break;
    }
    case 'mushroom': {
      ctx.fillStyle = '#c98f5f';
      ctx.beginPath(); ctx.arc(0, -r * 0.1, r * 0.9, Math.PI, 0); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#f2e3c6';
      ctx.fillRect(-r * 0.28, -r * 0.15, r * 0.56, r * 0.85);
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(-r * 0.4, -r * 0.45, r * 0.18, 0, Math.PI * 2); ctx.arc(r * 0.35, -r * 0.3, r * 0.14, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'bread': {
      ctx.fillStyle = '#e8b96a';
      roundRect(ctx, -r * 0.85, -r * 0.55, r * 1.7, r * 1.2, r * 0.45);
      ctx.fill();
      ctx.fillStyle = '#c98f3e';
      ctx.beginPath(); ctx.arc(-r * 0.4, r * 0.1, r * 0.09, 0, Math.PI * 2); ctx.arc(0, -r * 0.1, r * 0.09, 0, Math.PI * 2); ctx.arc(r * 0.4, r * 0.15, r * 0.09, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'patty': {
      ctx.fillStyle = '#8a5a3b';
      roundRect(ctx, -r * 0.9, -r * 0.45, r * 1.8, r * 0.9, r * 0.4);
      ctx.fill();
      ctx.strokeStyle = '#6b4229';
      ctx.beginPath(); ctx.moveTo(-r * 0.6, 0); ctx.lineTo(r * 0.6, 0); ctx.stroke();
      break;
    }
    case 'egg': {
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(0, 0, r * 0.85, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#f5b81d';
      ctx.beginPath(); ctx.arc(r * 0.1, r * 0.05, r * 0.42, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'noodle': {
      ctx.strokeStyle = '#f2c94c';
      ctx.lineWidth = size * 0.12;
      ctx.lineCap = 'round';
      for (let i = -1; i <= 1; i += 1) {
        ctx.beginPath();
        ctx.moveTo(-r * 0.8, i * r * 0.45);
        ctx.bezierCurveTo(-r * 0.3, i * r * 0.45 - r * 0.4, r * 0.3, i * r * 0.45 + r * 0.4, r * 0.8, i * r * 0.45);
        ctx.stroke();
      }
      break;
    }
    case 'cheese': {
      ctx.fillStyle = '#f5b81d';
      ctx.beginPath(); ctx.moveTo(-r * 0.85, r * 0.6); ctx.lineTo(0, -r * 0.75); ctx.lineTo(r * 0.85, r * 0.6); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#d18f06';
      ctx.beginPath(); ctx.arc(-r * 0.2, r * 0.15, r * 0.14, 0, Math.PI * 2); ctx.arc(r * 0.35, r * 0.3, r * 0.11, 0, Math.PI * 2); ctx.fill();
      break;
    }
    default: {
      ctx.fillStyle = '#999';
      ctx.beginPath(); ctx.arc(0, 0, r * 0.8, 0, Math.PI * 2); ctx.fill();
    }
  }
  ctx.restore();
}

function drawWallAndFloor(ctx) {
  ctx.fillStyle = PALETTE.wall;
  ctx.fillRect(0, 0, FIELD.width, 190);
  ctx.fillStyle = PALETTE.wallTrim;
  ctx.fillRect(0, 176, FIELD.width, 14);
  ctx.fillStyle = PALETTE.floor;
  ctx.fillRect(0, 190, FIELD.width, FIELD.height - 190);
  ctx.strokeStyle = PALETTE.floorTile;
  ctx.lineWidth = 2;
  for (let x = 0; x <= FIELD.width; x += 80) {
    ctx.beginPath(); ctx.moveTo(x, 178); ctx.lineTo(x, FIELD.height); ctx.stroke();
  }
  for (let y = 262; y < FIELD.height; y += 84) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(FIELD.width, y); ctx.stroke();
  }
  text(ctx, 'EMBER LANE  •  STREET-FOOD STALL', 640, 30, 15, '#b98a3e', 800, 'center');
}

function drawHud(ctx, state) {
  ctx.fillStyle = PALETTE.hud;
  ctx.fillRect(0, 36, FIELD.width, 40);
  text(ctx, 'EMBER LANE KITCHEN', 16, 63, 20, PALETTE.hudText, 800);
  const minutes = Math.floor(state.timeLeft / 60);
  const seconds = Math.floor(state.timeLeft % 60);
  const timerColour = state.timeLeft <= 20 ? PALETTE.bad : PALETTE.hudText;
  text(ctx, `⏱ ${minutes}:${String(seconds).padStart(2, '0')}`, 640, 64, 26, timerColour, 800, 'center');
  text(ctx, `LEVEL ${state.level}`, 470, 63, 18, PALETTE.accent, 800, 'center');
  text(ctx, `SCORE ${state.score}`, 820, 63, 18, PALETTE.hudText, 800);
  text(ctx, `🪙 ${state.coins}`, 980, 63, 18, '#ffd76a', 800);
  text(ctx, state.combo > 1 ? `COMBO x${state.combo}` : 'COMBO —', 1090, 63, 18, state.combo > 1 ? '#ff9d5c' : PALETTE.muted, 800);
  let hearts = '';
  for (let i = 0; i < DAY_HEARTS; i += 1) hearts += i < state.hearts ? '♥ ' : '♡ ';
  text(ctx, hearts.trim(), 1240, 63, 18, '#ff6b81', 800, 'right');
}

const DAY_HEARTS = 3;

function drawOrderTicket(ctx, order, x, y, state) {
  const recipe = RECIPE_BY_ID[order.recipeId];
  const urgent = order.timeLeft <= 12;
  const plateMatch = state.plate.length > 0 && matchingOrder(state) && matchingOrder(state).id === order.id;
  const carryingMatch = state.carrying && state.carrying.kind === 'plate'
    && state.carrying.items.length === recipe.needs.length
    && recipe.needs.every((id) => state.carrying.items.includes(id));
  const matched = plateMatch || carryingMatch;
  ctx.fillStyle = urgent ? '#ffe1de' : PALETTE.panel;
  roundRect(ctx, x, y, 300, 76, 10);
  ctx.fill();
  ctx.lineWidth = matched ? 4 : 2;
  ctx.strokeStyle = matched ? PALETTE.good : PALETTE.panelEdge;
  ctx.stroke();
  text(ctx, recipe.name.toUpperCase(), x + 12, y + 20, 17, PALETTE.textDark, 800);
  text(ctx, recipe.blurb, x + 12, y + 36, 12, PALETTE.muted, 600);
  recipe.needs.forEach((ingredientId, index) => {
    const ix = x + 24 + index * 44;
    const iy = y + 56;
    drawIngredientIcon(ctx, ingredientId, ix, iy, 30);
    if (state.plate.includes(ingredientId)) {
      ctx.fillStyle = PALETTE.good;
      ctx.beginPath(); ctx.arc(ix + 12, iy - 12, 9, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(ix + 7, iy - 12); ctx.lineTo(ix + 11, iy - 8); ctx.lineTo(ix + 18, iy - 16); ctx.stroke();
    }
  });
  const barX = x + 170;
  const barW = 118;
  const fraction = Math.max(0, order.timeLeft / order.patienceMax);
  ctx.fillStyle = '#e5d9bd';
  roundRect(ctx, barX, y + 48, barW, 12, 6);
  ctx.fill();
  ctx.fillStyle = urgent ? PALETTE.bad : fraction < 0.45 ? PALETTE.warn : PALETTE.good;
  roundRect(ctx, barX, y + 48, barW * fraction, 12, 6);
  ctx.fill();
  text(ctx, `${Math.ceil(order.timeLeft)}s`, barX + barW / 2, y + 44, 15, urgent ? PALETTE.bad : PALETTE.textDark, 800, 'center');
  if (matched) text(ctx, '✓ READY', x + 288, y + 20, 14, PALETTE.good, 800, 'right');
}

function drawOrderBoard(ctx, state) {
  text(ctx, 'ORDER BOARD', 16, 94, 15, '#7a5c2e', 800);
  for (let i = 0; i < 3; i += 1) {
    const order = state.orders[i];
    const x = 16 + i * 316;
    if (order) {
      drawOrderTicket(ctx, order, x, 100, state);
    } else {
      ctx.fillStyle = 'rgba(255,246,224,0.35)';
      roundRect(ctx, x, 100, 300, 76, 10);
      ctx.fill();
      ctx.setLineDash([6, 5]);
      ctx.strokeStyle = 'rgba(122,92,46,0.6)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.setLineDash([]);
      text(ctx, 'waiting for the next order…', x + 150, 142, 14, '#7a5c2e', 600, 'center');
    }
  }
  text(ctx, state.orders.length === 0 ? 'No orders yet — the lunch rush is coming!' : `${state.orders.length} order${state.orders.length > 1 ? 's' : ''} on the board`, 1000, 94, 14, '#7a5c2e', 600, 'right');
}

function drawStationBase(ctx, rect, label, highlight, glowColour) {
  ctx.fillStyle = highlight ? '#fff3d0' : '#e9dcc0';
  roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 8);
  ctx.fill();
  ctx.lineWidth = highlight ? 4 : 2;
  ctx.strokeStyle = highlight ? glowColour : '#c9b183';
  ctx.stroke();
  text(ctx, label, rect.x + rect.w / 2, rect.y + 16, 12, '#6b4e2a', 800, 'center');
}

function drawPantry(ctx, state, near) {
  const rect = STATIONS.pantry;
  drawStationBase(ctx, rect, 'PANTRY — PICK INGREDIENTS  (keys 1-8 or click)', near, PALETTE.accent);
  for (const bin of pantryBins()) {
    const ingredient = INGREDIENT_BY_ID[bin.id];
    ctx.fillStyle = '#fffaf0';
    roundRect(ctx, bin.x, bin.y, bin.w, bin.h, 6);
    ctx.fill();
    ctx.strokeStyle = '#d9c49a';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    drawIngredientIcon(ctx, bin.id, bin.x + bin.w / 2, bin.y + 19, 26);
    text(ctx, ingredient.key, bin.x + bin.w / 2, bin.y + 41, 11, PALETTE.muted, 700, 'center');
  }
}

function drawChopBoard(ctx, state, near) {
  const rect = STATIONS.chop;
  drawStationBase(ctx, rect, 'CHOP BOARD  (E)', near, PALETTE.accent);
  ctx.fillStyle = '#b98a3e';
  roundRect(ctx, rect.x + 22, rect.y + 28, rect.w - 44, 40, 6);
  ctx.fill();
  if (state.chopping) {
    const fraction = state.chopping.done / state.chopping.total;
    drawIngredientIcon(ctx, state.chopping.id, rect.x + rect.w / 2, rect.y + 48, 30);
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(rect.x + 22, rect.y + 66, rect.w - 44, 8);
    ctx.fillStyle = PALETTE.accent;
    ctx.fillRect(rect.x + 22, rect.y + 66, (rect.w - 44) * fraction, 8);
    text(ctx, 'CHOPPING…', rect.x + rect.w / 2, rect.y + 30, 12, '#fff', 800, 'center');
  } else {
    text(ctx, '🔪', rect.x + rect.w / 2, rect.y + 58, 26, '#fff', 700, 'center');
  }
}

function drawStove(ctx, state, near) {
  const rect = STATIONS.stove;
  drawStationBase(ctx, rect, 'STOVE — GRILL & BOIL  (E to cook / collect)', near, PALETTE.accent);
  state.stove.forEach((slot, index) => {
    const bx = rect.x + 30 + index * 150;
    const by = rect.y + 30;
    ctx.fillStyle = '#3a3a3a';
    ctx.beginPath(); ctx.arc(bx + 55, by + 22, 34, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#555';
    ctx.beginPath(); ctx.arc(bx + 55, by + 22, 26, 0, Math.PI * 2); ctx.fill();
    if (!slot) {
      text(ctx, 'empty burner', bx + 55, by + 26, 11, '#999', 600, 'center');
      return;
    }
    if (slot.state === 'burnt') {
      ctx.fillStyle = '#222';
      ctx.beginPath(); ctx.arc(bx + 55, by + 22, 22, 0, Math.PI * 2); ctx.fill();
      text(ctx, 'BURNT!', bx + 55, by + 26, 13, '#ff8a80', 800, 'center');
      return;
    }
    drawIngredientIcon(ctx, slot.id, bx + 55, by + 22, 40);
    const fraction = slot.state === 'done' ? 1 : Math.min(1, slot.done / 3.6);
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(bx + 8, by + 52, 94, 8);
    ctx.fillStyle = slot.state === 'done' ? PALETTE.good : '#ff8a3d';
    ctx.fillRect(bx + 8, by + 52, 94 * fraction, 8);
    text(ctx, slot.state === 'done' ? 'READY!' : 'cooking…', bx + 55, by + 44, 12, slot.state === 'done' ? PALETTE.good : '#8a5a2a', 800, 'center');
  });
}

function drawBin(ctx, state, near) {
  const rect = STATIONS.bin;
  drawStationBase(ctx, rect, 'BIN  (E / Q)', near, PALETTE.bad);
  ctx.fillStyle = '#6b7280';
  roundRect(ctx, rect.x + 45, rect.y + 28, 60, 52, 6);
  ctx.fill();
  ctx.fillStyle = '#4b5563';
  ctx.fillRect(rect.x + 40, rect.y + 22, 70, 10);
  text(ctx, 'trash it', rect.x + rect.w / 2, rect.y + 92, 12, PALETTE.muted, 600, 'center');
}

function drawPlateCounter(ctx, state, near) {
  const rect = STATIONS.plate;
  const complete = isPlateComplete(state);
  drawStationBase(ctx, rect, 'PLATING COUNTER  (E)', near, complete ? PALETTE.good : PALETTE.accent);
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.ellipse(rect.x + rect.w / 2, rect.y + 58, 120, 26, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = complete ? PALETTE.good : '#d9c49a';
  ctx.lineWidth = complete ? 4 : 2;
  ctx.stroke();
  state.plate.forEach((ingredientId, index) => {
    drawIngredientIcon(ctx, ingredientId, rect.x + rect.w / 2 - (state.plate.length - 1) * 26 + index * 52, rect.y + 52, 36);
  });
  if (state.plate.length === 0) {
    text(ctx, 'empty plate — add food here', rect.x + rect.w / 2, rect.y + 62, 13, PALETTE.muted, 600, 'center');
  } else if (complete) {
    text(ctx, '✓ PLATE READY TO SERVE!', rect.x + rect.w / 2, rect.y + 92, 15, PALETTE.good, 800, 'center');
  } else {
    const match = matchingOrder(state);
    text(ctx, 'dish mid-assembly…', rect.x + rect.w / 2, rect.y + 92, 13, '#8a5a2a', 700, 'center');
  }
}

function drawServeHatch(ctx, state, near) {
  const rect = STATIONS.serve;
  const carryingPlate = state.carrying && state.carrying.kind === 'plate';
  drawStationBase(ctx, rect, 'SERVE HATCH  (E to serve)', near, carryingPlate ? PALETTE.good : PALETTE.accent);
  ctx.fillStyle = carryingPlate ? '#e6f7ea' : '#f7e8c8';
  roundRect(ctx, rect.x + 20, rect.y + 26, rect.w - 40, 56, 8);
  ctx.fill();
  ctx.strokeStyle = carryingPlate ? PALETTE.good : '#d9a441';
  ctx.lineWidth = 2;
  ctx.stroke();
  text(ctx, carryingPlate ? '🍽  SERVE IT NOW!' : 'customers wait here', rect.x + rect.w / 2, rect.y + 60, 17, carryingPlate ? PALETTE.good : '#8a5a2a', 800, 'center');
}

function drawChef(ctx, state) {
  const chef = state.chef;
  const bob = chef.moving ? Math.sin(chef.walkPhase) * 3 : 0;
  ctx.save();
  ctx.translate(chef.x, chef.y + bob);
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath(); ctx.ellipse(0, 20, 20, 7, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = PALETTE.apron;
  roundRect(ctx, -18, -6, 36, 26, 10);
  ctx.fill();
  ctx.fillStyle = PALETTE.chefShirt;
  roundRect(ctx, -18, -6, 36, 14, 8);
  ctx.fill();
  ctx.fillStyle = PALETTE.chefSkin;
  ctx.beginPath(); ctx.arc(0, -16, 13, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = PALETTE.chefHat;
  roundRect(ctx, -14, -34, 28, 12, 6);
  ctx.fill();
  ctx.beginPath(); ctx.arc(0, -32, 12, Math.PI, 0); ctx.fill();
  ctx.fillStyle = '#33261a';
  ctx.beginPath(); ctx.arc(chef.face * 4, -17, 1.8, 0, Math.PI * 2); ctx.arc(chef.face * 4 + 6, -17, 1.8, 0, Math.PI * 2); ctx.fill();
  if (state.chopping) {
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(18, -8); ctx.lineTo(30, -20 + Math.sin(chef.walkPhase * 3) * 4); ctx.stroke();
  }
  ctx.restore();
  if (state.carrying) {
    const cy = chef.y - 52 + bob;
    if (state.carrying.kind === 'plate') {
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.ellipse(chef.x, cy + 6, 30, 9, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#d9c49a';
      ctx.lineWidth = 2;
      ctx.stroke();
      state.carrying.items.forEach((ingredientId, index) => {
        drawIngredientIcon(ctx, ingredientId, chef.x - (state.carrying.items.length - 1) * 13 + index * 26, cy, 22);
      });
    } else {
      const ingredient = INGREDIENT_BY_ID[state.carrying.id];
      if (state.carrying.state === 'burnt') {
        ctx.fillStyle = '#222';
        ctx.beginPath(); ctx.arc(chef.x, cy, 14, 0, Math.PI * 2); ctx.fill();
        text(ctx, 'BURNT', chef.x, cy - 18, 11, '#ff8a80', 800, 'center');
      } else {
        drawIngredientIcon(ctx, state.carrying.id, chef.x, cy, 30);
        const label = state.carrying.state === 'raw' ? ingredient.name : `${ingredient.name} ✓`;
        text(ctx, label, chef.x, cy - 20, 12, '#fff', 700, 'center');
      }
    }
  }
  if (state.moveTarget) {
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(state.moveTarget.x, state.moveTarget.y, 8, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(state.moveTarget.x - 4, state.moveTarget.y); ctx.lineTo(state.moveTarget.x + 4, state.moveTarget.y); ctx.moveTo(state.moveTarget.x, state.moveTarget.y - 4); ctx.lineTo(state.moveTarget.x, state.moveTarget.y + 4); ctx.stroke();
  }
}

function drawHints(ctx, state) {
  const near = nearestStation(state);
  const hints = [
    'WASD / arrows: move   •   click: walk & use   •   E: use station   •   1-8: grab from pantry',
    'Q: bin what you carry   •   P: pause   •   M: mute   •   R: restart shift',
  ];
  text(ctx, hints[0], 640, 688, 13, '#cbb693', 600, 'center');
  text(ctx, hints[1], 640, 706, 13, '#cbb693', 600, 'center');
  if (near) {
    const names = { pantry: 'PANTRY', chop: 'CHOP BOARD', stove: 'STOVE', bin: 'BIN', plate: 'PLATING COUNTER', serve: 'SERVE HATCH' };
    text(ctx, `Near: ${names[near]} — press E`, 640, 646, 14, PALETTE.accent, 800, 'center');
  }
  if (state.message.text && state.elapsed < state.message.until) {
    const width = ctx.measureText(state.message.text).width + 36;
    ctx.fillStyle = 'rgba(36,26,18,0.92)';
    roundRect(ctx, 640 - width / 2 - 100, 300, width + 200, 34, 17);
    ctx.fill();
    text(ctx, state.message.text, 640, 323, 15, '#ffe9b8', 700, 'center');
  }
}

function drawBanner(ctx, state) {
  if (!state.banner.text || state.elapsed >= state.banner.until) return;
  ctx.fillStyle = 'rgba(217,79,48,0.95)';
  roundRect(ctx, 390, 380, 500, 56, 12);
  ctx.fill();
  text(ctx, state.banner.text, 640, 417, 24, '#fff', 800, 'center');
}

function drawTitleScreen(ctx, state) {
  ctx.fillStyle = 'rgba(20,12,6,0.72)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  text(ctx, 'EMBER LANE KITCHEN', 640, 250, 56, '#ffb03a', 800, 'center');
  text(ctx, 'A tiny street-food stall. A very hungry lunch rush.', 640, 292, 20, '#ffe9b8', 600, 'center');
  text(ctx, 'Grab ingredients → chop or grill them → build the plate → SERVE before the ticket runs out!', 640, 330, 18, '#fff', 700, 'center');
  text(ctx, 'WASD / arrows to move  •  click to walk & use  •  E to use a station  •  1-8 to grab from the pantry', 640, 366, 16, '#e8d9b8', 600, 'center');
  const pulse = 0.75 + 0.25 * Math.sin(Date.now() / 300);
  ctx.globalAlpha = pulse;
  text(ctx, '▶  PRESS ENTER OR CLICK TO START COOKING', 640, 430, 24, '#fff', 800, 'center');
  ctx.globalAlpha = 1;
  if (state.best > 0) text(ctx, `Best shift so far: ${state.best} points`, 640, 470, 16, '#ffd76a', 700, 'center');
  text(ctx, '4 recipes  •  3 hearts  •  150-second shifts  •  combos pay extra', 640, 510, 15, '#cbb693', 600, 'center');
}

function drawPausedScreen(ctx) {
  ctx.fillStyle = 'rgba(20,12,6,0.7)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  text(ctx, 'PAUSED', 640, 330, 52, '#fff', 800, 'center');
  text(ctx, 'Press P to keep cooking — the tickets wait for no one.', 640, 380, 18, '#ffe9b8', 600, 'center');
}

function drawOverScreen(ctx, state) {
  ctx.fillStyle = 'rgba(20,12,6,0.78)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  text(ctx, state.dayOverReason || 'Shift over!', 640, 230, 40, '#ffb03a', 800, 'center');
  const stars = '★'.repeat(state.stars) + '☆'.repeat(3 - state.stars);
  text(ctx, stars, 640, 300, 48, '#ffd76a', 800, 'center');
  text(ctx, `SCORE  ${state.score}    •    DISHES SERVED  ${state.served}    •    BEST COMBO  x${state.bestCombo}`, 640, 360, 22, '#fff', 800, 'center');
  text(ctx, `Coins earned: ${state.coins}   •   Orders expired: ${state.expiredCount}   •   Burnt: ${state.burntCount}`, 640, 400, 17, '#e8d9b8', 600, 'center');
  if (state.score >= state.best && state.score > 0) text(ctx, '★ NEW BEST SHIFT! ★', 640, 440, 20, '#ffd76a', 800, 'center');
  else if (state.best > 0) text(ctx, `Best shift: ${state.best}`, 640, 440, 17, '#cbb693', 600, 'center');
  const pulse = 0.75 + 0.25 * Math.sin(Date.now() / 300);
  ctx.globalAlpha = pulse;
  text(ctx, 'Press R to cook another shift', 640, 500, 22, '#fff', 800, 'center');
  ctx.globalAlpha = 1;
}

/** Draw one frame of the game from the kitchen state. */
export function renderGame(ctx, state) {
  ctx.clearRect(0, 0, FIELD.width, FIELD.height);
  drawWallAndFloor(ctx);
  drawHud(ctx, state);
  drawOrderBoard(ctx, state);
  const near = state.screen === 'play' ? nearestStation(state) : null;
  drawPantry(ctx, state, near === 'pantry');
  drawChopBoard(ctx, state, near === 'chop');
  drawStove(ctx, state, near === 'stove');
  drawBin(ctx, state, near === 'bin');
  drawPlateCounter(ctx, state, near === 'plate');
  drawServeHatch(ctx, state, near === 'serve');
  drawChef(ctx, state);
  if (state.screen === 'play') {
    drawHints(ctx, state);
    drawBanner(ctx, state);
  } else if (state.screen === 'title') {
    drawTitleScreen(ctx, state);
  } else if (state.screen === 'paused') {
    drawHints(ctx, state);
    drawPausedScreen(ctx);
  } else if (state.screen === 'over') {
    drawOverScreen(ctx, state);
  }
}
