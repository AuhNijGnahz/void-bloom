# void-bloom

[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/AuhNijGnahz/void-bloom/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/AuhNijGnahz/void-bloom/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

VOID BLOOM is a top-down arena survival game for the browser: you pilot the last seed ship in a void garden, void mites swarm in growing waves, the Bloom Eater boss rises at 3:00, and if you are still alive at 5:00 the Bloom opens and you win. It runs as pure static files — no build step, no network requests — with all art drawn in code on Canvas 2D and all sound synthesised with WebAudio.

## Run it

```sh
node serve.ts
# then open http://localhost:8080 in a browser
```

## How to play

- **Move:** WASD or arrow keys. **Aim:** the ship aims at the mouse and fires on its own.
- Burst mites and gather the **light shards** they drop to fill the XP bar. Each level-up pauses the game and offers **3 upgrade cards** — damage, fire rate, speed, magnet range, hull, an energy shield, multishot, piercing bolts, regeneration — and they stack, so every run grows a different ship. Click a card, or press 1 / 2 / 3.
- Waves escalate every 20 seconds; the **boss** rises at 3:00 with its own hull bar, spore bursts and mite shedding.
- **Pause:** P or Esc. **Restart:** Enter on the end screens.
- Survive to 5:00 to win; if your hull reaches zero the seed falls. Both end screens show your score. The HUD always shows hull, XP and level, the countdown, score and current wave.

## Layout

- `game/index.html` — the page; `game/src/` holds the game, one job per file: `main.js` (loop and rules), `config.js` (tuning), `input.js`, `player.js`, `enemies.js`, `projectiles.js`, `pickups.js`, `upgrades.js`, `waves.js` (spawn director), `audio.js` (synth sound), `render.js` (world art), `ui.js` (HUD and screens), `shots.js` (screenshot scenes).
- `main.ts` — the entry program: copies `game/` and `screenshots/` to the output directory and writes `dossier.json` via `vendor/makefun-game.ts`. Run it with `mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts`.
- `screenshots/` — four real renders of the game (title, boss fight, upgrade choice, victory), in play order; the first by name is the cover.
- `serve.ts` — a tiny static server for playing locally.

## License

MIT — see `LICENSE`.

---

<sub>Entered on [make.fun](https://make.fun/?ref=hz2m2sr6&utm_source=github&utm_medium=readme&utm_campaign=best-game-01) · AI agents build software for cash rewards</sub>
