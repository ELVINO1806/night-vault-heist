// Night Vault Heist — detection.
// Vision cones, line of sight and the alarm meter. A guard or a camera
// sees the thief only when the thief is inside its cone, inside its range
// and no wall (and no smoke cloud) blocks the straight line between them.

export function pointInRect(px, py, rect) {
  return px >= rect.x && px <= rect.x + rect.w && py >= rect.y && py <= rect.y + rect.h;
}

export function pointInCircle(px, py, cx, cy, r) {
  const dx = px - cx;
  const dy = py - cy;
  return dx * dx + dy * dy <= r * r;
}

function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

// True when the segment from (x0,y0) to (x1,y1) is not cut by any solid
// rectangle or any smoke cloud. Sampled in small steps; cheap and exact
// enough for a 2D top-down game.
export function lineOfSightClear(x0, y0, x1, y1, blockers, smokeClouds) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const dist = Math.hypot(dx, dy);
  const steps = Math.max(1, Math.ceil(dist / 8));
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const px = x0 + dx * t;
    const py = y0 + dy * t;
    for (const rect of blockers) {
      if (pointInRect(px, py, rect)) return false;
    }
    for (const cloud of smokeClouds) {
      if (pointInCircle(px, py, cloud.x, cloud.y, cloud.r)) return false;
    }
  }
  return true;
}

// One observer (guard or camera) against the thief. Returns the distance
// when the thief is spotted, or null when not.
export function spotCheck(observer, tx, ty, blockers, smokeClouds) {
  const dx = tx - observer.x;
  const dy = ty - observer.y;
  const dist = Math.hypot(dx, dy);
  if (dist > observer.range) return null;
  if (dist < 26) return dist; // Point blank: caught in the act, cone or not.
  const targetAngle = Math.atan2(dy, dx);
  if (Math.abs(angleDiff(targetAngle, observer.angle)) > observer.fov / 2) return null;
  if (!lineOfSightClear(observer.x, observer.y, tx, ty, blockers, smokeClouds)) return null;
  return dist;
}

// The alarm meter: 0..100. Being seen fills it fast, grabbing loot bumps
// it, and it drains slowly when nobody sees the thief. Returns the new
// alarm value plus what caused the change, for the HUD and the banners.
export function updateAlarm(alarm, seenByGuard, seenByCamera, dt) {
  let next = alarm;
  let cause = 'none';
  if (seenByGuard) {
    next += 26 * dt;
    cause = 'guard';
  } else if (seenByCamera) {
    next += 20 * dt;
    cause = 'camera';
  } else {
    next -= 5 * dt;
  }
  if (next < 0) next = 0;
  if (next > 100) next = 100;
  return { alarm: next, cause };
}

export function alarmState(alarm) {
  if (alarm >= 100) return 'caught';
  if (alarm >= 50) return 'suspicious';
  if (alarm >= 25) return 'noticed';
  return 'calm';
}

export function alarmColor(alarm) {
  if (alarm >= 75) return '#ff4d4d';
  if (alarm >= 50) return '#ffb02e';
  if (alarm >= 25) return '#ffe14d';
  return '#7ee787';
}
