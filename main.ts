// VOID BLOOM — make.fun best-game-01 entry program (Node 22, standard library only).
//
// The game itself is the static site in game/: plain files, no build step, no network.
// This program is the hand-in step. It copies game/ and screenshots/ from beside this
// file into the output directory and writes dossier.json there with buildDossier from
// vendor/makefun-game.ts, exactly as the competition requires.
//
// Run it outside the grader like this:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// (MAKEFUN_OUTPUT_DIR stands in for /output, the grader's writable directory.)
// Play the game locally with: node serve.ts  ->  http://localhost:8080

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, 'game'), join(outputDir, 'game'), { recursive: true });
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });
}

// The caps below mirror the gate's own limits, so a local run refuses anything the
// scorer would refuse: dossier text capped at 160 KiB, at most 4 screenshots of at
// most 256 KiB each, and game/ at most 993 entries, 48 MiB in total, with no single
// path longer than 1000 bytes.
writeFileSync(
  join(outputDir, 'dossier.json'),
  buildDossier(outputDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
