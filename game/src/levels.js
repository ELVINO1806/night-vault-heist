// Night Vault Heist — floor layouts.
// One floor is a small data object: walls (solid rectangles), locked doors
// (solid until lockpicked), loot (kind + dollar value), guard patrols,
// sweeping cameras, the getaway exit and the loot target that opens it.
// Coordinates live in the 1280x800 canvas; the HUD occupies y 0..64 and
// the play area runs y 72..800. All numbers below were laid out by hand
// so every loot item is reachable and every room has at least two routes.

export const FLOOR_W = 1280;
export const FLOOR_H = 800;
export const HUD_H = 64;
export const PLAY_TOP = 72;

export const LOOT_KINDS = {
  cash: { value: 250, label: 'CASH', color: '#7ee787', size: 13 },
  gold: { value: 600, label: 'GOLD', color: '#f5c542', size: 15 },
  gem: { value: 1000, label: 'GEM', color: '#5ac8fa', size: 14 },
  art: { value: 800, label: 'ART', color: '#e58ae5', size: 16 },
};

function wall(x, y, w, h) {
  return { x, y, w, h };
}

function loot(kind, x, y) {
  return { kind, x, y, taken: false };
}

function guard(path, speed, range, fov) {
  return { path, speed, range, fov };
}

function camera(x, y, baseAngle, sweep, speed, range, fov) {
  return { x, y, baseAngle, sweep, speed, range, fov };
}

function door(x, y, w, h) {
  return { x, y, w, h, locked: true };
}

// Floor 1 — the bank lobby. Two guards, one camera, one locked shortcut.
const floor1 = {
  name: 'FLOOR 1 — THE LOBBY',
  target: 2000,
  timeLimit: 180,
  start: { x: 60, y: 130 },
  exit: { x: 1186, y: 730, w: 74, h: 56 },
  tools: { smoke: 2, emp: 1, lockpick: 2 },
  walls: [
    wall(0, 72, 1280, 10),
    wall(0, 72, 10, 728),
    wall(1270, 72, 10, 728),
    wall(0, 790, 1280, 10),
    // West wing divider, door gap at y 380..440.
    wall(420, 72, 12, 308),
    wall(420, 440, 12, 80),
    // Mid hall divider, door gap at x 640..700.
    wall(420, 520, 220, 12),
    wall(700, 520, 200, 12),
    // East divider, door gap at y 560..620.
    wall(900, 200, 12, 360),
    wall(900, 620, 12, 170),
    // Vault room north wall, door gap at x 1000..1060.
    wall(900, 200, 100, 12),
    wall(1060, 200, 210, 12),
  ],
  doors: [
    // Locked shortcut through the mid hall divider.
    door(640, 508, 60, 24),
  ],
  loot: [
    loot('cash', 200, 200),
    loot('cash', 600, 150),
    loot('gold', 1050, 130),
    loot('art', 1150, 700),
    loot('cash', 300, 680),
    loot('gem', 760, 650),
  ],
  guards: [
    guard([[200, 300], [200, 700], [690, 700], [690, 300]], 55, 180, 1.31),
    guard([[1000, 300], [1150, 300], [1150, 650], [1000, 650]], 50, 175, 1.31),
  ],
  cameras: [
    camera(640, 84, Math.PI / 2, 0.9, 0.55, 220, 0.7),
  ],
};

// Floor 2 — the vault hall. Three guards, two cameras, two locked doors.
const floor2 = {
  name: 'FLOOR 2 — THE VAULT HALL',
  target: 3500,
  timeLimit: 180,
  start: { x: 60, y: 740 },
  exit: { x: 1186, y: 96, w: 74, h: 56 },
  tools: { smoke: 2, emp: 2, lockpick: 2 },
  walls: [
    wall(0, 72, 1280, 10),
    wall(0, 72, 10, 728),
    wall(1270, 72, 10, 728),
    wall(0, 790, 1280, 10),
    // Central cross walls, gaps at the corridor crossings.
    wall(320, 72, 12, 300),
    wall(320, 432, 12, 358),
    wall(320, 366, 300, 12),
    wall(680, 366, 280, 12),
    // South-east room, door gap at y 560..620.
    wall(960, 430, 12, 130),
    wall(960, 620, 12, 170),
    wall(960, 430, 310, 12),
    // North vault antechamber, door gap at x 1080..1140.
    wall(960, 200, 120, 12),
    wall(1140, 200, 130, 12),
  ],
  doors: [
    door(620, 354, 60, 24),
    door(1080, 188, 60, 24),
  ],
  loot: [
    loot('cash', 180, 180),
    loot('gold', 500, 250),
    loot('gem', 820, 180),
    loot('art', 1120, 320),
    loot('gold', 1120, 700),
    loot('cash', 700, 700),
    loot('gem', 480, 620),
    loot('cash', 180, 480),
  ],
  guards: [
    guard([[180, 250], [180, 700], [280, 700], [280, 250]], 62, 185, 1.31),
    guard([[700, 150], [1100, 150], [1100, 320], [700, 320]], 58, 185, 1.31),
    guard([[1000, 500], [1200, 500], [1200, 740], [1000, 740]], 66, 170, 1.31),
  ],
  cameras: [
    camera(640, 84, Math.PI / 2, 1.0, 0.7, 230, 0.7),
    camera(1260, 420, Math.PI, 0.8, 0.6, 220, 0.7),
  ],
};

// Floor 3 — the vault core. Faster patrols, three cameras, tight cover.
const floor3 = {
  name: 'FLOOR 3 — THE VAULT CORE',
  target: 4500,
  timeLimit: 210,
  start: { x: 640, y: 740 },
  exit: { x: 603, y: 96, w: 74, h: 56 },
  tools: { smoke: 3, emp: 2, lockpick: 3 },
  walls: [
    wall(0, 72, 1280, 10),
    wall(0, 72, 10, 728),
    wall(1270, 72, 10, 728),
    wall(0, 790, 1280, 10),
    // Two guard-post blocks with corridor gaps between them.
    wall(240, 200, 240, 12),
    wall(240, 200, 12, 320),
    wall(240, 520, 240, 12),
    wall(800, 200, 240, 12),
    wall(1028, 200, 12, 320),
    wall(800, 520, 240, 12),
    // Central vault island, door gap at x 600..680 on its south face.
    wall(480, 300, 320, 12),
    wall(480, 300, 12, 160),
    wall(788, 300, 12, 160),
    wall(480, 460, 120, 12),
    wall(680, 460, 120, 12),
  ],
  doors: [
    door(600, 448, 80, 24),
  ],
  loot: [
    loot('cash', 130, 150),
    loot('gold', 350, 380),
    loot('gem', 640, 380),
    loot('art', 930, 380),
    loot('gold', 1150, 150),
    loot('gem', 1150, 680),
    loot('gold', 130, 680),
    loot('art', 640, 620),
    loot('cash', 930, 640),
    loot('cash', 350, 640),
  ],
  guards: [
    guard([[130, 150], [1150, 150], [1150, 680], [130, 680]], 78, 195, 1.31),
    guard([[520, 150], [760, 150], [760, 260], [520, 260]], 72, 190, 1.31),
    guard([[520, 560], [760, 560], [760, 680], [520, 680]], 70, 190, 1.31),
  ],
  cameras: [
    camera(640, 84, Math.PI / 2, 1.1, 0.8, 240, 0.7),
    camera(20, 420, 0, 0.9, 0.65, 230, 0.7),
    camera(1260, 420, Math.PI, 0.9, 0.65, 230, 0.7),
  ],
};

export const LEVELS = [floor1, floor2, floor3];

export function totalLootValue(level) {
  return level.loot.reduce((sum, item) => sum + LOOT_KINDS[item.kind].value, 0);
}
