# VOID BLOOM

A top-down arena survival game for the browser. You pilot the last seed ship
in a void garden: void mites swarm in growing waves, the Bloom Eater boss
rises at 3:00, and if you are still alive at 5:00 the Bloom opens and you win.
Burst mites, gather the light shards they drop, and spend each level-up on one
of three upgrade cards — damage, fire rate, speed, magnet range, hull, an
energy shield, multishot, piercing bolts, regeneration — so every run grows a
different ship.

## Play

```sh
node serve.ts
```

Then open http://localhost:8080 in a desktop browser. The game is plain
static files under `game/` with no build step and no network requests: all
art is drawn in code on Canvas 2D and all sound is synthesised with WebAudio.

- **Move:** WASD or arrow keys
- **Aim:** mouse (the ship fires on its own)
- **Upgrade:** click a card, or press 1 / 2 / 3 when the choice appears
- **Pause:** P or Esc · **Restart:** Enter on the end screens

Survive to 5:00 to win; if your hull reaches zero the seed falls. The HUD
always shows hull, XP and level, the countdown, score and current wave, and
the boss gets its own hull bar.

## Layout

- `game/index.html` — the page; `game/src/` holds the game, one job per file:
  `main.js` (loop and rules), `config.js` (tuning), `input.js`, `player.js`,
  `enemies.js`, `projectiles.js`, `pickups.js`, `upgrades.js`, `waves.js`
  (spawn director), `audio.js` (synth sound), `render.js` (world art),
  `ui.js` (HUD and screens), `shots.js` (screenshot scenes).
- `main.ts` — the entry program: copies `game/` and `screenshots/` to the
  output directory and writes `dossier.json` via `vendor/makefun-game.ts`.
  Run it with `mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts`.
- `screenshots/` — four real renders of the game (title, boss fight,
  upgrade choice, victory), in play order; the first by name is the cover.

## License

MIT — see `LICENSE`.
