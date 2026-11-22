// Night Vault Heist — game state and loop.
// Owns the phases (menu, playing, caught, floor clear, win), the player,
// the alarm, the tools and the getaway. Rendering lives in render.js,
// detection in detection.js, guards in guard.js, input in input.js and
// sound in audio.js. The ?demo= parameter stages one frozen mid-game
// moment (cover, loot, near-caught, escape) through the game's own state
// setup, so screenshots are real renders of the game, never mock-ups.

import { LEVELS, LOOT_KINDS, PLAY_TOP } from './levels.js';
import { spotCheck, updateAlarm, alarmState, pointInRect } from './detection.js';
import { makeGuard, makeCamera, updateGuard, updateCamera, cameraDisabled } from './guard.js';
import { createInput, moveVector, consumePress } from './input.js';
import { createAudio } from './audio.js';
import { drawGame } from './render.js';

const PLAYER_R = 12;
const PLAYER_SPEED = 175;
const GRAB_RANGE = 30;
const GRAB_TIME = 0.6;
const DEMOS = ['cover', 'loot', 'near', 'escape'];

function freshLevel(index) {
  const def = LEVELS[index];
  const level = JSON.parse(JSON.stringify(def));
  return {
    def,
    level,
    guards: level.guards.map(makeGuard),
    cameras: level.cameras.map(makeCamera),
  };
}

function blockersOf(level) {
  const solids = level.walls.slice();
  for (const door of level.doors) {
    if (door.locked) solids.push(door);
  }
  return solids;
}

function circleHitsRect(x, y, r, rect) {
  const cx = Math.max(rect.x, Math.min(x, rect.x + rect.w));
  const cy = Math.max(rect.y, Math.min(y, rect.y + rect.h));
  const dx = x - cx;
  const dy = y - cy;
  return dx * dx + dy * dy < r * r;
}

function createState(canvas) {
  return {
    canvas,
    input: createInput(canvas),
    audio: createAudio(),
    phase: 'menu',
    levelIndex: 0,
    level: null,
    guards: [],
    cameras: [],
    player: { x: 60, y: 130, angle: 0 },
    alarm: 0,
    loot: 0,
    totalHaul: 0,
    timeLeft: 180,
    timeSec: 0,
    tools: { smoke: 2, emp: 1, lockpick: 2 },
    smokeClouds: [],
    grabTarget: null,
    grabProgress: 0,
    caughtReason: '',
    demo: null,
    lastTick: 0,
    alarmBeepAt: 0,
  };
}

function loadLevel(state, index) {
  const loaded = freshLevel(index);
  state.levelIndex = index;
  state.level = loaded.level;
  state.guards = loaded.guards;
  state.cameras = loaded.cameras;
  state.player.x = loaded.level.start.x;
  state.player.y = loaded.level.start.y;
  state.player.angle = 0;
  state.alarm = 0;
  state.loot = 0;
  state.timeLeft = loaded.level.timeLimit;
  state.tools = { ...loaded.level.tools };
  state.smokeClouds = [];
  state.grabTarget = null;
  state.grabProgress = 0;
  state.caughtReason = '';
  state.phase = 'playing';
}

function startGame(state) {
  state.totalHaul = 0;
  loadLevel(state, 0);
}

function retryFloor(state) {
  loadLevel(state, state.levelIndex);
}

function levelName(state) {
  return state.level ? state.level.name : '';
}

function targetOf(state) {
  return state.level ? state.level.target : 0;
}

function movePlayer(state, dt) {
  const vec = moveVector(state.input);
  let vx = vec.x;
  let vy = vec.y;
  const target = state.input.moveTarget;
  if (vx === 0 && vy === 0 && target) {
    const dx = target.x - state.player.x;
    const dy = target.y - state.player.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 6) {
      state.input.moveTarget = null;
    } else {
      vx = dx / dist;
      vy = dy / dist;
    }
  }
  if (vx === 0 && vy === 0) return;
  const solids = blockersOf(state.level);
  const stepX = vx * PLAYER_SPEED * dt;
  const stepY = vy * PLAYER_SPEED * dt;
  const nx = state.player.x + stepX;
  if (nx - PLAYER_R >= 0 && nx + PLAYER_R <= 1280 && !solids.some((r) => circleHitsRect(nx, state.player.y, PLAYER_R, r))) {
    state.player.x = nx;
  }
  const ny = state.player.y + stepY;
  if (ny - PLAYER_R >= PLAY_TOP && ny + PLAYER_R <= 800 && !solids.some((r) => circleHitsRect(state.player.x, ny, PLAYER_R, r))) {
    state.player.y = ny;
  }
  state.player.angle = Math.atan2(vy, vx);
}

function nearestLoot(state) {
  let best = null;
  let bestDist = GRAB_RANGE;
  for (const item of state.level.loot) {
    if (item.taken) continue;
    const dist = Math.hypot(item.x - state.player.x, item.y - state.player.y);
    if (dist < bestDist) {
      best = item;
      bestDist = dist;
    }
  }
  return best;
}

function updateGrab(state, dt) {
  const item = nearestLoot(state);
  if (!item) {
    state.grabTarget = null;
    state.grabProgress = 0;
    return;
  }
  if (state.grabTarget !== item) {
    state.grabTarget = item;
    state.grabProgress = 0;
  }
  state.grabProgress += dt / GRAB_TIME;
  if (state.grabProgress >= 1) {
    item.taken = true;
    state.loot += LOOT_KINDS[item.kind].value;
    state.alarm = Math.min(100, state.alarm + 4);
    state.audio.pickup();
    state.grabTarget = null;
    state.grabProgress = 0;
  }
}

function useTool(state, tool) {
  if (tool === 'smoke') {
    if (state.tools.smoke <= 0) return;
    state.tools.smoke -= 1;
    state.smokeClouds.push({ x: state.player.x, y: state.player.y, r: 95, until: state.timeSec + 6 });
    state.audio.smoke();
  } else if (tool === 'emp') {
    if (state.tools.emp <= 0) return;
    state.tools.emp -= 1;
    for (const camera of state.cameras) camera.disabledUntil = state.timeSec + 10;
    state.audio.emp();
  } else if (tool === 'lockpick') {
    if (state.tools.lockpick <= 0) return;
    for (const door of state.level.doors) {
      if (!door.locked) continue;
      const cx = door.x + door.w / 2;
      const cy = door.y + door.h / 2;
      if (Math.hypot(cx - state.player.x, cy - state.player.y) < 60) {
        door.locked = false;
        state.tools.lockpick -= 1;
        state.audio.unlock();
        return;
      }
    }
  }
}

function caught(state, reason) {
  state.phase = 'caught';
  state.caughtReason = reason;
  state.audio.caught();
}

function updatePlaying(state, dt) {
  state.timeLeft -= dt;
  if (state.timeLeft <= 0) {
    caught(state, 'Time ran out — the security sweep found you.');
    return;
  }
  const suspicious = alarmState(state.alarm) === 'suspicious' || alarmState(state.alarm) === 'caught';
  const solids = blockersOf(state.level);
  const clouds = state.smokeClouds.filter((c) => state.timeSec < c.until);
  state.smokeClouds = clouds;

  for (const guard of state.guards) {
    updateGuard(guard, dt, state.timeSec, suspicious);
  }
  for (const camera of state.cameras) {
    updateCamera(camera, dt, state.timeSec);
  }

  let seenByGuard = false;
  let seenByCamera = false;
  for (const guard of state.guards) {
    const dist = spotCheck(guard, state.player.x, state.player.y, solids, clouds);
    guard.seesThief = dist !== null;
    if (dist !== null) {
      seenByGuard = true;
      guard.alert = true;
      guard.lastSeen = { x: state.player.x, y: state.player.y };
      if (dist < 24) {
        caught(state, 'A guard grabbed you at point blank.');
        return;
      }
    }
  }
  for (const camera of state.cameras) {
    if (cameraDisabled(camera, state.timeSec)) {
      camera.seesThief = false;
      continue;
    }
    const dist = spotCheck(camera, state.player.x, state.player.y, solids, clouds);
    camera.seesThief = dist !== null;
    if (dist !== null) seenByCamera = true;
  }

  const result = updateAlarm(state.alarm, seenByGuard, seenByCamera, dt);
  state.alarm = result.alarm;
  if (state.alarm >= 100) {
    caught(state, 'The alarm hit 100% — the building locked down.');
    return;
  }
  if (state.alarm >= 75 && state.timeSec - state.alarmBeepAt > 0.9) {
    state.alarmBeepAt = state.timeSec;
    state.audio.alarmTick();
  }

  movePlayer(state, dt);
  updateGrab(state, dt);

  for (const tool of ['smoke', 'emp', 'lockpick']) {
    if (consumePress(state.input, tool)) useTool(state, tool);
  }
  if (state.input.toolClick) {
    const tool = state.input.toolClick;
    state.input.toolClick = null;
    useTool(state, tool);
  }

  if (state.loot >= targetOf(state) && pointInRect(state.player.x, state.player.y, state.level.exit)) {
    state.totalHaul += state.loot;
    if (state.levelIndex >= LEVELS.length - 1) {
      state.phase = 'win';
      state.audio.win();
    } else {
      state.phase = 'floorClear';
      state.audio.win();
    }
  }
}

// Stage one frozen mid-game moment for a screenshot. The guards hold
// their staged positions and the cameras keep sweeping, so the frame is
// a real render of the game at a dramatic instant.
function applyDemo(state, name) {
  state.demo = name;
  const take = (kind, x, y) => {
    const item = state.level.loot.find((l) => l.kind === kind && l.x === x && l.y === y);
    if (item) item.taken = true;
  };
  const lootSum = () => state.level.loot.filter((l) => l.taken).reduce((s, l) => s + LOOT_KINDS[l.kind].value, 0);

  if (name === 'cover') {
    loadLevel(state, 0);
    state.player.x = 640;
    state.player.y = 430;
    state.player.angle = Math.PI / 2;
    take('cash', 200, 200);
    take('cash', 600, 150);
    take('gold', 1050, 130);
    state.loot = lootSum();
    state.alarm = 28;
    state.timeLeft = 150;
    state.guards[0].x = 520;
    state.guards[0].y = 500;
    state.guards[0].angle = -0.53;
    state.guards[1].x = 1050;
    state.guards[1].y = 480;
    state.guards[1].angle = 2.4;
    state.cameras[0].phase = 0.9;
  } else if (name === 'loot') {
    loadLevel(state, 1);
    state.player.x = 795;
    state.player.y = 180;
    state.player.angle = 0;
    take('cash', 180, 180);
    take('gold', 500, 250);
    take('cash', 180, 480);
    take('gem', 480, 620);
    take('cash', 700, 700);
    state.loot = lootSum();
    state.alarm = 41;
    state.timeLeft = 122;
    const gem = state.level.loot.find((l) => l.kind === 'gem' && l.x === 820 && l.y === 180);
    state.grabTarget = gem;
    state.grabProgress = 0.65;
    state.guards[1].x = 900;
    state.guards[1].y = 220;
    state.guards[1].angle = Math.PI;
    state.cameras[0].phase = -0.6;
  } else if (name === 'near') {
    loadLevel(state, 1);
    state.player.x = 430;
    state.player.y = 400;
    state.player.angle = Math.PI;
    take('cash', 180, 180);
    take('gold', 500, 250);
    take('gem', 820, 180);
    take('art', 1120, 320);
    take('gem', 480, 620);
    take('cash', 700, 700);
    state.loot = lootSum();
    state.alarm = 82;
    state.timeLeft = 64;
    state.guards[0].x = 300;
    state.guards[0].y = 400;
    state.guards[0].angle = 0;
    state.guards[0].seesThief = true;
    state.guards[0].lastSeen = { x: 430, y: 400 };
    state.cameras[1].phase = 1.2;
  } else if (name === 'escape') {
    loadLevel(state, 2);
    state.player.x = 640;
    state.player.y = 168;
    state.player.angle = -Math.PI / 2;
    take('gem', 640, 380);
    take('art', 930, 380);
    take('gem', 1150, 680);
    take('gold', 1150, 150);
    take('gold', 350, 380);
    take('art', 640, 620);
    take('cash', 930, 640);
    take('cash', 350, 640);
    state.loot = lootSum();
    state.totalHaul = 7300;
    state.alarm = 42;
    state.timeLeft = 95;
    state.guards[0].x = 900;
    state.guards[0].y = 150;
    state.guards[0].angle = Math.PI;
    state.guards[1].x = 520;
    state.guards[1].y = 260;
    state.guards[1].angle = -Math.PI / 2;
    state.cameras[0].phase = 0.4;
  }
  state.phase = 'playing';
}

function drawState(ctx, state) {
  drawGame(ctx, {
    level: state.level,
    guards: state.guards,
    cameras: state.cameras,
    smokeClouds: state.smokeClouds,
    player: state.player,
    grabTarget: state.grabTarget,
    grabProgress: state.grabProgress,
    loot: state.loot,
    target: targetOf(state),
    alarm: state.alarm,
    levelName: levelName(state),
    timeLeft: state.timeLeft,
    tools: state.tools,
    timeSec: state.timeSec,
    phase: state.phase,
    totalHaul: state.totalHaul,
    caughtReason: state.caughtReason,
  });
}

function tick(state, ctx, now) {
  const dt = Math.min(0.05, (now - state.lastTick) / 1000 || 0.016);
  state.lastTick = now;
  state.timeSec += dt;

  if (consumePress(state.input, 'mute')) {
    state.audio.muted = !state.audio.muted;
  }

  if (state.demo) {
    // Frozen moment: cameras sweep, loot glows, nothing else advances.
    for (const camera of state.cameras) updateCamera(camera, dt, state.timeSec);
    drawState(ctx, state);
    requestAnimationFrame((t) => tick(state, ctx, t));
    return;
  }

  if (state.phase === 'menu') {
    state.audio.ensure();
    if (consumePress(state.input, 'start')) startGame(state);
  } else if (state.phase === 'playing') {
    updatePlaying(state, dt);
  } else if (state.phase === 'caught') {
    if (consumePress(state.input, 'retry')) retryFloor(state);
  } else if (state.phase === 'floorClear') {
    if (consumePress(state.input, 'start')) loadLevel(state, state.levelIndex + 1);
  } else if (state.phase === 'win') {
    if (consumePress(state.input, 'retry')) startGame(state);
  }
  drawState(ctx, state);
  requestAnimationFrame((t) => tick(state, ctx, t));
}

function boot() {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const state = createState(canvas);
  const params = new URLSearchParams(window.location.search);
  const demo = params.get('demo');
  if (demo && DEMOS.includes(demo)) {
    applyDemo(state, demo);
  } else {
    loadLevel(state, 0);
    state.phase = 'menu';
  }
  // Exposed for playtesting: the live state object, nothing more.
  window.__heist = state;
  state.lastTick = performance.now();
  requestAnimationFrame((t) => tick(state, ctx, t));
}

boot();
