// Ember Lane Kitchen — keyboard and mouse input, kept apart from the rules:
// it only reports what the player pressed, clicked or held, never what it means.

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';

export function createInput(canvas) {
  const keys = new Set();
  const pressed = new Set();
  const mouse = { x: 0, y: 0, clicked: false, clickX: 0, clickY: 0, down: false };

  function toLogical(event) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return { x: (event.clientX - rect.left) * scaleX, y: (event.clientY - rect.top) * scaleY };
  }

  window.addEventListener('keydown', (event) => {
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(event.key)) event.preventDefault();
    if (!event.repeat) pressed.add(key);
    keys.add(key);
  });
  window.addEventListener('keyup', (event) => {
    keys.delete(event.key.length === 1 ? event.key.toLowerCase() : event.key);
  });
  window.addEventListener('blur', () => { keys.clear(); });
  canvas.addEventListener('mousemove', (event) => {
    const point = toLogical(event);
    mouse.x = point.x;
    mouse.y = point.y;
  });
  canvas.addEventListener('mousedown', (event) => {
    const point = toLogical(event);
    mouse.x = point.x;
    mouse.y = point.y;
    mouse.down = true;
    mouse.clicked = true;
    mouse.clickX = point.x;
    mouse.clickY = point.y;
  });
  window.addEventListener('mouseup', () => { mouse.down = false; });

  return {
    keys,
    mouse,

    /** True only on the frame the key went down. */
    wasPressed(key) { return pressed.has(key); },

    /** True while the key is held. */
    isDown(key) { return keys.has(key); },

    /** The movement vector from WASD or the arrow keys, normalised. */
    moveVector() {
      let x = 0;
      let y = 0;
      if (keys.has('a') || keys.has('ArrowLeft')) x -= 1;
      if (keys.has('d') || keys.has('ArrowRight')) x += 1;
      if (keys.has('w') || keys.has('ArrowUp')) y -= 1;
      if (keys.has('s') || keys.has('ArrowDown')) y += 1;
      if (x !== 0 && y !== 0) { x *= Math.SQRT1_2; y *= Math.SQRT1_2; }
      return { x, y };
    },

    /** True only on the frame the mouse was clicked; call once per frame. */
    consumeClick() {
      if (!mouse.clicked) return null;
      mouse.clicked = false;
      return { x: mouse.clickX, y: mouse.clickY };
    },

    /** Call at the end of each frame so single-press keys do not repeat. */
    endFrame() { pressed.clear(); },
  };
}
