// Night Vault Heist — canvas rendering.
// One draw function per thing on screen. The palette is a night job:
// deep-navy floors, amber loot, yellow guard cones, red camera cones and
// a green getaway door, so cover, danger and value read at a glance.

import { LOOT_KINDS, HUD_H } from './levels.js';
import { alarmColor, alarmState } from './detection.js';

const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawFloor(ctx) {
  ctx.fillStyle = '#101223';
  ctx.fillRect(0, HUD_H, 1280, 800 - HUD_H);
  ctx.strokeStyle = 'rgba(120, 130, 180, 0.07)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= 1280; x += 64) {
    ctx.beginPath();
    ctx.moveTo(x, HUD_H);
    ctx.lineTo(x, 800);
    ctx.stroke();
  }
  for (let y = HUD_H; y <= 800; y += 64) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(1280, y);
    ctx.stroke();
  }
  // Worn carpet runner down the middle of each floor.
  ctx.fillStyle = 'rgba(90, 40, 60, 0.16)';
  ctx.fillRect(600, HUD_H, 80, 800 - HUD_H);
}

function drawLoot(ctx, item, timeSec) {
  const kind = LOOT_KINDS[item.kind];
  const pulse = 0.55 + 0.25 * Math.sin(timeSec * 3 + item.x);
  ctx.save();
  ctx.globalAlpha = pulse;
  ctx.fillStyle = kind.color;
  ctx.beginPath();
  ctx.arc(item.x, item.y, kind.size + 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = kind.color;
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.55)';
  ctx.lineWidth = 2;
  if (item.kind === 'cash') {
    ctx.fillRect(item.x - 11, item.y - 7, 22, 14);
    ctx.strokeRect(item.x - 11, item.y - 7, 22, 14);
    ctx.fillStyle = '#0d2b12';
    ctx.font = 'bold 9px ' + FONT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('$', item.x, item.y + 0.5);
  } else if (item.kind === 'gold') {
    ctx.beginPath();
    ctx.moveTo(item.x - 11, item.y + 7);
    ctx.lineTo(item.x - 7, item.y - 7);
    ctx.lineTo(item.x + 7, item.y - 7);
    ctx.lineTo(item.x + 11, item.y + 7);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (item.kind === 'gem') {
    ctx.beginPath();
    ctx.moveTo(item.x, item.y - 10);
    ctx.lineTo(item.x + 9, item.y);
    ctx.lineTo(item.x, item.y + 10);
    ctx.lineTo(item.x - 9, item.y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else {
    ctx.fillRect(item.x - 9, item.y - 11, 18, 22);
    ctx.strokeRect(item.x - 9, item.y - 11, 18, 22);
    ctx.fillStyle = '#2b0d2b';
    ctx.beginPath();
    ctx.arc(item.x, item.y - 2, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#e8eaf2';
  ctx.font = 'bold 10px ' + FONT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('$' + kind.value, item.x, item.y + kind.size + 4);
}

function drawExit(ctx, exit, open, timeSec) {
  const glow = open ? 0.5 + 0.3 * Math.sin(timeSec * 4) : 0.15;
  ctx.save();
  ctx.globalAlpha = glow;
  ctx.fillStyle = '#2ee66b';
  ctx.fillRect(exit.x - 8, exit.y - 8, exit.w + 16, exit.h + 16);
  ctx.restore();
  ctx.fillStyle = open ? '#12351f' : '#1d2b22';
  ctx.fillRect(exit.x, exit.y, exit.w, exit.h);
  ctx.strokeStyle = open ? '#2ee66b' : '#3f7a52';
  ctx.lineWidth = 3;
  ctx.strokeRect(exit.x, exit.y, exit.w, exit.h);
  ctx.fillStyle = open ? '#2ee66b' : '#9fb8a6';
  ctx.font = 'bold 13px ' + FONT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(open ? 'GETAWAY OPEN' : 'GETAWAY', exit.x + exit.w / 2, exit.y + exit.h / 2);
}

function drawDoors(ctx, doors) {
  for (const door of doors) {
    if (!door.locked) {
      ctx.strokeStyle = '#5a6a8a';
      ctx.lineWidth = 2;
      ctx.strokeRect(door.x, door.y, door.w, door.h);
      ctx.fillStyle = '#8b90a5';
      ctx.font = 'bold 10px ' + FONT;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('OPEN', door.x + door.w / 2, door.y + door.h / 2);
      continue;
    }
    ctx.fillStyle = '#4a3416';
    ctx.fillRect(door.x, door.y, door.w, door.h);
    ctx.strokeStyle = '#f5c542';
    ctx.lineWidth = 2;
    ctx.strokeRect(door.x, door.y, door.w, door.h);
    ctx.fillStyle = '#f5c542';
    ctx.font = 'bold 10px ' + FONT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('LOCKED [3]', door.x + door.w / 2, door.y + door.h / 2);
  }
}

function drawWalls(ctx, walls) {
  for (const w of walls) {
    ctx.fillStyle = '#232839';
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.fillStyle = '#3d4468';
    ctx.fillRect(w.x, w.y, w.w, 2);
  }
}

function drawCone(ctx, x, y, angle, fov, range, color, hot) {
  ctx.save();
  ctx.globalAlpha = hot ? 0.42 : 0.2;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, angle - fov / 2, angle + fov / 2);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.globalAlpha = hot ? 0.9 : 0.5;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + Math.cos(angle - fov / 2) * range, y + Math.sin(angle - fov / 2) * range);
  ctx.moveTo(x, y);
  ctx.lineTo(x + Math.cos(angle + fov / 2) * range, y + Math.sin(angle + fov / 2) * range);
  ctx.stroke();
  ctx.restore();
}

function drawGuard(ctx, guard) {
  drawCone(ctx, guard.x, guard.y, guard.angle, guard.fov, guard.range, '#ffc93c', guard.seesThief);
  ctx.fillStyle = '#c93a3a';
  ctx.beginPath();
  ctx.arc(guard.x, guard.y, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#5d1010';
  ctx.lineWidth = 2;
  ctx.stroke();
  // Cap brim in the facing direction.
  ctx.fillStyle = '#5d1010';
  ctx.beginPath();
  ctx.arc(guard.x + Math.cos(guard.angle) * 7, guard.y + Math.sin(guard.angle) * 7, 4, 0, Math.PI * 2);
  ctx.fill();
  if (guard.seesThief) {
    ctx.fillStyle = '#ff4d4d';
    ctx.font = 'bold 22px ' + FONT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('!', guard.x, guard.y - 16);
  }
}

function drawCamera(ctx, camera, timeSec) {
  const disabled = timeSec < camera.disabledUntil;
  const color = disabled ? '#5a6478' : '#ff4d4d';
  drawCone(ctx, camera.x, camera.y, camera.angle, camera.fov, camera.range, color, camera.seesThief && !disabled);
  ctx.fillStyle = '#1c2030';
  ctx.fillRect(camera.x - 9, camera.y - 7, 18, 14);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.strokeRect(camera.x - 9, camera.y - 7, 18, 14);
  ctx.fillStyle = disabled ? '#3a4152' : '#ff4d4d';
  ctx.beginPath();
  ctx.arc(camera.x + Math.cos(camera.angle) * 8, camera.y + Math.sin(camera.angle) * 8, 3.5, 0, Math.PI * 2);
  ctx.fill();
  if (disabled) {
    ctx.fillStyle = '#8b90a5';
    ctx.font = 'bold 10px ' + FONT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('EMP ' + Math.ceil(camera.disabledUntil - timeSec) + 's', camera.x, camera.y + 12);
  }
}

function drawSmoke(ctx, clouds) {
  for (const cloud of clouds) {
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = '#b8bcc9';
    ctx.beginPath();
    ctx.arc(cloud.x, cloud.y, cloud.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#d7dae2';
    ctx.font = 'bold 10px ' + FONT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SMOKE', cloud.x, cloud.y);
  }
}

function drawPlayer(ctx, player, grabProgress, grabTarget) {
  // Hooded thief: dark cloak triangle, pale face, direction nose.
  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.rotate(player.angle);
  ctx.fillStyle = '#20242e';
  ctx.beginPath();
  ctx.moveTo(14, 0);
  ctx.lineTo(-10, -11);
  ctx.lineTo(-7, 0);
  ctx.lineTo(-10, 11);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#7ee787';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = '#e8d9b0';
  ctx.beginPath();
  ctx.arc(2, 0, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#e8eaf2';
  ctx.font = 'bold 10px ' + FONT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('YOU', player.x, player.y - 16);
  if (grabTarget) {
    ctx.save();
    ctx.strokeStyle = '#f5c542';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(player.x, player.y, 22, -Math.PI / 2, -Math.PI / 2 + grabProgress * Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = '#f5c542';
    ctx.font = 'bold 11px ' + FONT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('LIFTING…', player.x, player.y + 24);
  }
}

function drawHud(ctx, state) {
  ctx.fillStyle = '#0a0c14';
  ctx.fillRect(0, 0, 1280, HUD_H);
  ctx.fillStyle = '#2a2f45';
  ctx.fillRect(0, HUD_H - 2, 1280, 2);
  ctx.textBaseline = 'middle';

  ctx.fillStyle = '#f5c542';
  ctx.font = 'bold 20px ' + FONT;
  ctx.textAlign = 'left';
  ctx.fillText('LOOT $' + state.loot.toLocaleString('en-US'), 16, 26);
  ctx.fillStyle = state.loot >= state.target ? '#2ee66b' : '#8b90a5';
  ctx.font = '14px ' + FONT;
  ctx.fillText('/ $' + state.target.toLocaleString('en-US') + ' to open the getaway', 16, 48);

  const alarm = state.alarm;
  ctx.fillStyle = '#8b90a5';
  ctx.font = 'bold 13px ' + FONT;
  ctx.textAlign = 'left';
  ctx.fillText('ALARM', 330, 20);
  ctx.fillStyle = '#1c2030';
  ctx.fillRect(330, 30, 220, 16);
  ctx.fillStyle = alarmColor(alarm);
  ctx.fillRect(330, 30, 220 * (alarm / 100), 16);
  ctx.strokeStyle = '#3d4468';
  ctx.lineWidth = 1;
  ctx.strokeRect(330, 30, 220, 16);
  ctx.fillStyle = '#e8eaf2';
  ctx.font = 'bold 12px ' + FONT;
  ctx.fillText(Math.round(alarm) + '%', 556, 38);
  const aState = alarmState(alarm);
  ctx.fillStyle = aState === 'calm' ? '#7ee787' : alarmColor(alarm);
  ctx.font = 'bold 12px ' + FONT;
  ctx.fillText(aState.toUpperCase(), 330, 54);

  ctx.fillStyle = '#e8eaf2';
  ctx.font = 'bold 15px ' + FONT;
  ctx.textAlign = 'center';
  ctx.fillText(state.levelName, 640, 22);
  const timeLeft = Math.max(0, Math.ceil(state.timeLeft));
  ctx.fillStyle = timeLeft <= 30 ? '#ff4d4d' : '#e8eaf2';
  ctx.font = 'bold 15px ' + FONT;
  ctx.fillText('TIME ' + Math.floor(timeLeft / 60) + ':' + String(timeLeft % 60).padStart(2, '0'), 640, 46);

  // Tool buttons (clickable, keys 1/2/3).
  const tools = [
    { key: 'smoke', label: 'SMOKE [1]', x: 980, w: 80, count: state.tools.smoke },
    { key: 'emp', label: 'EMP [2]', x: 1065, w: 80, count: state.tools.emp },
    { key: 'lockpick', label: 'PICK [3]', x: 1150, w: 95, count: state.tools.lockpick },
  ];
  for (const tool of tools) {
    ctx.fillStyle = tool.count > 0 ? '#1c2030' : '#14161f';
    roundRect(ctx, tool.x, 12, tool.w, 40, 5);
    ctx.fill();
    ctx.strokeStyle = tool.count > 0 ? '#5a6a8a' : '#2a2f45';
    ctx.stroke();
    ctx.fillStyle = tool.count > 0 ? '#e8eaf2' : '#5a6076';
    ctx.font = 'bold 12px ' + FONT;
    ctx.textAlign = 'center';
    ctx.fillText(tool.label + ' x' + tool.count, tool.x + tool.w / 2, 32);
  }
}

function drawBanner(ctx, text, sub, color) {
  ctx.save();
  ctx.globalAlpha = 0.92;
  ctx.fillStyle = '#0a0c14';
  ctx.fillRect(340, 300, 600, 92);
  ctx.restore();
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.strokeRect(340, 300, 600, 92);
  ctx.fillStyle = color;
  ctx.font = 'bold 30px ' + FONT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 640, 332);
  ctx.fillStyle = '#e8eaf2';
  ctx.font = '15px ' + FONT;
  ctx.fillText(sub, 640, 366);
}

function drawMenu(ctx) {
  ctx.fillStyle = 'rgba(7, 8, 13, 0.88)';
  ctx.fillRect(0, HUD_H, 1280, 800 - HUD_H);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#f5c542';
  ctx.font = 'bold 54px ' + FONT;
  ctx.fillText('NIGHT VAULT HEIST', 640, 220);
  ctx.fillStyle = '#e8eaf2';
  ctx.font = '20px ' + FONT;
  ctx.fillText('Three floors. One crew. Get in, lift the loot, get out before the alarm blows.', 640, 280);
  ctx.font = '17px ' + FONT;
  ctx.fillStyle = '#b8bcc9';
  ctx.fillText('WASD / arrows or click to move  ·  walk over loot to lift it  ·  stay out of the yellow cones', 640, 330);
  ctx.fillText('Red cones are cameras — EMP kills them. Smoke blinds everyone. Lockpick opens shortcuts.', 640, 360);
  ctx.fillText('Reach the green GETAWAY door with enough loot. Alarm 100% means caught.', 640, 390);
  ctx.fillStyle = '#2ee66b';
  ctx.font = 'bold 22px ' + FONT;
  ctx.fillText('Press ENTER or click to start the job', 640, 470);
  ctx.fillStyle = '#8b90a5';
  ctx.font = '14px ' + FONT;
  ctx.fillText('Tools: [1] smoke  [2] EMP  [3] lockpick  ·  [M] mute  ·  [R] retry floor', 640, 520);
}

function drawEnd(ctx, title, lines, color) {
  ctx.fillStyle = 'rgba(7, 8, 13, 0.88)';
  ctx.fillRect(0, HUD_H, 1280, 800 - HUD_H);
  ctx.textAlign = 'center';
  ctx.fillStyle = color;
  ctx.font = 'bold 48px ' + FONT;
  ctx.fillText(title, 640, 260);
  ctx.fillStyle = '#e8eaf2';
  ctx.font = '20px ' + FONT;
  let y = 330;
  for (const line of lines) {
    ctx.fillText(line, 640, y);
    y += 36;
  }
  ctx.fillStyle = '#2ee66b';
  ctx.font = 'bold 20px ' + FONT;
  ctx.fillText('Press R to retry, ENTER to continue', 640, y + 40);
}

// state: the full live game state from main.js.
export function drawGame(ctx, state) {
  drawFloor(ctx);
  for (const item of state.level.loot) {
    if (!item.taken) drawLoot(ctx, item, state.timeSec);
  }
  drawExit(ctx, state.level.exit, state.loot >= state.target, state.timeSec);
  drawDoors(ctx, state.level.doors);
  drawWalls(ctx, state.level.walls);
  drawSmoke(ctx, state.smokeClouds);
  for (const camera of state.cameras) drawCamera(ctx, camera, state.timeSec);
  for (const guard of state.guards) drawGuard(ctx, guard);
  drawPlayer(ctx, state.player, state.grabProgress, state.grabTarget);
  drawHud(ctx, state);

  if (state.phase === 'menu') {
    drawMenu(ctx);
  } else if (state.phase === 'caught') {
    drawBanner(ctx, 'CAUGHT!', state.caughtReason, '#ff4d4d');
  } else if (state.phase === 'floorClear') {
    drawEnd(ctx, 'FLOOR CLEAR', [
      'Haul this floor: $' + state.loot.toLocaleString('en-US'),
      'Total so far: $' + state.totalHaul.toLocaleString('en-US'),
      'Alarm at the getaway: ' + Math.round(state.alarm) + '%',
    ], '#2ee66b');
  } else if (state.phase === 'win') {
    drawEnd(ctx, 'THE GETAWAY', [
      'Total haul: $' + state.totalHaul.toLocaleString('en-US'),
      'Floors cleared: 3 / 3   ·   Time left on the clock: ' + Math.max(0, Math.ceil(state.timeLeft)) + 's',
      'The crew vanishes into the night. Clean job.',
    ], '#f5c542');
  } else if (state.phase === 'playing' && alarmState(state.alarm) === 'suspicious') {
    ctx.fillStyle = '#ffb02e';
    ctx.font = 'bold 18px ' + FONT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('! SUSPICIOUS — they heard something. Break line of sight !', 640, 76);
  }
}
