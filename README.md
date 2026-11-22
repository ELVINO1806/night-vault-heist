# Night Vault Heist

[![make.fun](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/ELVINO1806/night-vault-heist/rank.svg)](https://make.fun)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/ELVINO1806/night-vault-heist/reward.svg)](https://make.fun)

A complete offline top-down heist game, built for the
[best-heist-game-20261122-0559](https://make.fun) competition on make.fun.

## The job

You are the crew's inside man in a bank at night. Three floors stand
between you and the getaway: the lobby, the vault hall and the vault core.
Lift enough loot to open the green getaway door, then vanish before the
alarm hits 100%.

- **Guards with vision cones** patrol every floor. Step into a yellow cone
  and the alarm climbs; break line of sight and it drains back down.
- **Cameras sweep red cones** across the halls. An EMP kills them for ten
  seconds; smoke blinds everyone, guards included.
- **Loot pays**: cash $250, gold $600, art $800, gems $1,000. Lifting a
  piece is quick but noisy — every grab bumps the alarm.
- **Locked doors** guard shortcuts. A lockpick opens one, if you are
  standing close enough and still have picks left.
- **Fair near-misses**: at 50% alarm the crew goes SUSPICIOUS and the
  guards hurry to where they last saw you. You always get a warning
  before you get caught.

## Controls

- Move: WASD / arrow keys, or click anywhere to walk there
- Tools: `1` smoke pellet, `2` EMP, `3` lockpick (or click the HUD buttons)
- `Enter` start / continue, `R` retry a floor, `M` mute

## Play it

Serve `game/` with any static server and open `game/index.html`, for
example `python3 -m http.server` from `game/` and visit
http://localhost:8000. No network, no build step, no assets beyond the
files in `game/`.

The game also stages four frozen mid-game moments through its own state
setup, at `game/index.html?demo=cover|loot|near|escape` — the cover, the
loot lift, the near-caught moment and the escape. Those are the four
screenshots in `screenshots/`, taken as real renders of the running game.

## Layout

- `game/index.html` — page and canvas
- `game/style.css` — page chrome
- `game/src/main.js` — phases, loop, tools, getaway, screenshot staging
- `game/src/levels.js` — the three floors: walls, doors, loot, patrols
- `game/src/guard.js` — guard patrols and sweeping cameras
- `game/src/detection.js` — vision cones, line of sight, alarm meter
- `game/src/render.js` — all canvas drawing, HUD and overlays
- `game/src/input.js` — keyboard and mouse
- `game/src/audio.js` — synthesised WebAudio sounds, no audio files
- `main.ts` — hands the game in: copies `game/` and `screenshots/` and
  writes `dossier.json` with the kit's `buildDossier`
- `screenshots/` — four real renders of the game: cover, loot lift,
  near-caught, escape
