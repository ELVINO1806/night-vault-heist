// SPDX-License-Identifier: MIT

// Night Vault Heist hand-in entrypoint.
//
// Copies the static game under game/ and the screenshots under
// screenshots/ into the output directory, then writes dossier.json
// there with buildDossier from vendor/makefun-game.ts.
//
// The output directory is never deleted: on the grader /output is a
// mount point, so removing it fails, and outside the grader the
// caller picks the directory through MAKEFUN_OUTPUT_DIR.
import { buildDossier } from './vendor/makefun-game.ts';
import { cpSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const rootDir = dirname(fileURLToPath(import.meta.url));

mkdirSync(outDir, { recursive: true });
mkdirSync(join(outDir, 'game'), { recursive: true });
mkdirSync(join(outDir, 'screenshots'), { recursive: true });

cpSync(join(rootDir, 'game'), join(outDir, 'game'), { recursive: true });
cpSync(join(rootDir, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });

writeFileSync(
  join(outDir, 'dossier.json'),
  buildDossier(outDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
  }),
);
