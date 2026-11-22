// Night Vault Heist — guards and cameras.
// Guards walk their patrol waypoints. When the alarm is high they hurry
// toward the last place the thief was seen. Cameras sit on the wall and
// sweep their cone back and forth; an EMP freezes them for a while.

export function makeGuard(def) {
  return {
    path: def.path,
    speed: def.speed,
    range: def.range,
    fov: def.fov,
    x: def.path[0][0],
    y: def.path[0][1],
    waypoint: 1,
    angle: 0,
    alert: false,
    lastSeen: null,
    seesThief: false,
  };
}

export function makeCamera(def) {
  return {
    x: def.x,
    y: def.y,
    baseAngle: def.baseAngle,
    sweep: def.sweep,
    speed: def.speed,
    range: def.range,
    fov: def.fov,
    angle: def.baseAngle,
    phase: 0,
    disabledUntil: 0,
    seesThief: false,
  };
}

export function updateGuard(guard, dt, timeSec, suspicious) {
  const pace = suspicious ? guard.speed * 1.45 : guard.speed;
  let tx;
  let ty;
  if (guard.alert && guard.lastSeen) {
    tx = guard.lastSeen.x;
    ty = guard.lastSeen.y;
  } else {
    const wp = guard.path[guard.waypoint];
    tx = wp[0];
    ty = wp[1];
  }
  const dx = tx - guard.x;
  const dy = ty - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 4) {
    if (guard.alert && guard.lastSeen) {
      guard.alert = false;
      guard.lastSeen = null;
    } else {
      guard.waypoint = (guard.waypoint + 1) % guard.path.length;
    }
    return;
  }
  const step = Math.min(dist, pace * dt);
  const nx = guard.x + (dx / dist) * step;
  const ny = guard.y + (dy / dist) * step;
  guard.angle = Math.atan2(ny - guard.y, nx - guard.x);
  guard.x = nx;
  guard.y = ny;
  void timeSec;
}

export function updateCamera(camera, dt, timeSec) {
  if (timeSec < camera.disabledUntil) return;
  camera.phase += dt * camera.speed;
  camera.angle = camera.baseAngle + camera.sweep * Math.sin(camera.phase);
}

export function cameraDisabled(camera, timeSec) {
  return timeSec < camera.disabledUntil;
}
