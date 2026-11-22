// Night Vault Heist — keyboard and mouse input.
// Arrow keys / WASD move, 1/2/3 use tools, Enter starts, R retries.
// A mouse click in the play area sets a walk target; clicking a HUD tool
// button uses that tool. Keys are tracked as a live set so the game loop
// can read held keys every frame.

export function createInput(canvas) {
  const keys = new Set();
  const state = {
    keys,
    moveTarget: null,
    toolClick: null, // 'smoke' | 'emp' | 'lockpick' | null, set by HUD clicks
    pressed: new Set(), // edge-triggered keys, consumed by the game loop
  };

  const KEY_ACTIONS = {
    Enter: 'start',
    KeyR: 'retry',
    KeyM: 'mute',
    Digit1: 'smoke',
    Digit2: 'emp',
    Digit3: 'lockpick',
    KeyQ: 'smoke',
    KeyE: 'emp',
    KeyF: 'lockpick',
  };

  function onKeyDown(event) {
    if (event.repeat) return;
    keys.add(event.code);
    const action = KEY_ACTIONS[event.code];
    if (action) state.pressed.add(action);
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) {
      event.preventDefault();
    }
  }

  function onKeyUp(event) {
    keys.delete(event.code);
  }

  function onMouseDown(event) {
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) * (canvas.width / rect.width);
    const y = (event.clientY - rect.top) * (canvas.height / rect.height);
    // HUD tool buttons live in the top bar; everything else is a walk target.
    if (y < 64) {
      if (x >= 980 && x < 1060) state.toolClick = 'smoke';
      else if (x >= 1065 && x < 1145) state.toolClick = 'emp';
      else if (x >= 1150 && x < 1245) state.toolClick = 'lockpick';
      return;
    }
    state.moveTarget = { x, y };
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('mousedown', onMouseDown);
  return state;
}

export function moveVector(input) {
  let x = 0;
  let y = 0;
  if (input.keys.has('ArrowLeft') || input.keys.has('KeyA')) x -= 1;
  if (input.keys.has('ArrowRight') || input.keys.has('KeyD')) x += 1;
  if (input.keys.has('ArrowUp') || input.keys.has('KeyW')) y -= 1;
  if (input.keys.has('ArrowDown') || input.keys.has('KeyS')) y += 1;
  if (x !== 0 && y !== 0) {
    const len = Math.hypot(x, y);
    x /= len;
    y /= len;
  }
  return { x, y };
}

export function consumePress(input, action) {
  if (!input.pressed.has(action)) return false;
  input.pressed.delete(action);
  return true;
}
