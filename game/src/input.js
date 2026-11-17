// Keyboard and mouse input: held movement keys, the mouse aim point in world
// coordinates, and one-shot actions (confirm, pause, upgrade picks, clicks).
// The game polls held state every tick and drains actions once per frame.

export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;

const MOVE_KEYS = {
  KeyW: 'up', ArrowUp: 'up',
  KeyS: 'down', ArrowDown: 'down',
  KeyA: 'left', ArrowLeft: 'left',
  KeyD: 'right', ArrowRight: 'right',
};

/**
 * Attach listeners to the canvas and window. `toWorld(clientX, clientY)`
 * converts a mouse event position into world coordinates.
 */
export function createInput(canvas, toWorld) {
  const held = { up: false, down: false, left: false, right: false };
  const mouse = { x: 0, y: 0, down: false };
  let actions = 0;
  let pickedCard = -1;
  let clickedAt = null;

  window.addEventListener('keydown', (event) => {
    const move = MOVE_KEYS[event.code];
    if (move) {
      held[move] = true;
      event.preventDefault();
    } else if (event.code === 'Enter' || event.code === 'Space') {
      actions |= ACTION_CONFIRM;
      event.preventDefault();
    } else if (event.code === 'Escape' || event.code === 'KeyP') {
      actions |= ACTION_PAUSE;
    } else if (event.code === 'Digit1') {
      pickedCard = 0;
    } else if (event.code === 'Digit2') {
      pickedCard = 1;
    } else if (event.code === 'Digit3') {
      pickedCard = 2;
    }
  });
  window.addEventListener('keyup', (event) => {
    const move = MOVE_KEYS[event.code];
    if (move) held[move] = false;
  });
  window.addEventListener('mousemove', (event) => {
    const point = toWorld(event.clientX, event.clientY);
    mouse.x = point.x;
    mouse.y = point.y;
  });
  canvas.addEventListener('mousedown', (event) => {
    mouse.down = true;
    const point = toWorld(event.clientX, event.clientY);
    mouse.x = point.x;
    mouse.y = point.y;
    clickedAt = { x: point.x, y: point.y };
    actions |= ACTION_CONFIRM;
  });
  window.addEventListener('mouseup', () => {
    mouse.down = false;
  });
  window.addEventListener('blur', () => {
    held.up = held.down = held.left = held.right = false;
    mouse.down = false;
  });

  return {
    mouse,
    /** Normalised movement direction from the held keys (diagonals are unit length). */
    moveDirection() {
      const x = (held.right ? 1 : 0) - (held.left ? 1 : 0);
      const y = (held.down ? 1 : 0) - (held.up ? 1 : 0);
      if (x === 0 && y === 0) return { x: 0, y: 0 };
      const length = Math.hypot(x, y);
      return { x: x / length, y: y / length };
    },
    /** Drain the one-shot action flags raised since the last frame. */
    takeActions() {
      const taken = actions;
      actions = 0;
      return taken;
    },
    /** Drain the upgrade card index chosen by number key, or -1 for none. */
    takePickedCard() {
      const taken = pickedCard;
      pickedCard = -1;
      return taken;
    },
    /** Drain the last click position in world coordinates, or null. */
    takeClick() {
      const taken = clickedAt;
      clickedAt = null;
      return taken;
    },
  };
}
