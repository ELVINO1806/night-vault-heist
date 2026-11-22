// SPDX-License-Identifier: MIT
// Night Vault Heist — make.fun entrypoint.
// Copies game/ and screenshots/ from this repository into the output
// directory and writes dossier.json with buildDossier from the kit's
// vendor/makefun-game.ts. The output directory may already hold files
// from an earlier run; they are tolerated, never deleted, because on the
// grader /output is a mount and deleting it fails the run.
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
writeFileSync(join(outDir, 'dossier.json'), buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
}));
