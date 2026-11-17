// The wave director: decides what spawns and when. Pressure rises on three
// rails — spawn intervals shrink, the mite mix shifts toward darts and brutes,
// and a soft cap on live enemies climbs — and at BOSS_TIME the Bloom Eater
// rises once. Wave numbers tick every WAVE_SECONDS for the HUD.

import { BOSS_TIME, WAVE_SECONDS } from './config.js';
import { edgeSpawnPoint, spawnEnemy } from './enemies.js';

export function createWaveDirector() {
  return { spawnTimer: 1.2, bossSpawned: false, bossRef: null };
}

/** Wave number for a moment in the run (1-based). */
export function waveNumberAt(elapsed) {
  return Math.floor(elapsed / WAVE_SECONDS) + 1;
}

/** Seconds between spawns: 1.15 s at the start, tightening to ~0.3 s late. */
function spawnIntervalAt(elapsed) {
  return Math.max(0.3, 1.15 - elapsed * 0.0028);
}

/** How many enemies may hunt at once; the garden fills as the run goes on. */
function liveCapAt(elapsed) {
  return Math.min(90, 14 + Math.floor(elapsed / 9));
}

/** Pick the next kind from the time-shifted mix. */
function kindAt(elapsed, rng) {
  const roll = rng();
  const bruteChance = elapsed < 55 ? 0 : Math.min(0.2, 0.06 + elapsed / 2400);
  const dartChance = elapsed < 25 ? 0 : Math.min(0.38, 0.16 + elapsed / 1600);
  if (roll < bruteChance) return 'brute';
  if (roll < bruteChance + dartChance) return 'dart';
  return 'mite';
}

/**
 * Advance spawning one tick, pushing new enemies into `enemies`. Returns
 * 'boss' on the tick the Bloom Eater rises (so main can roar and warn),
 * otherwise null.
 */
export function updateWaves(director, dt, elapsed, field, player, enemies, rng) {
  let event = null;
  if (!director.bossSpawned && elapsed >= BOSS_TIME) {
    director.bossSpawned = true;
    const boss = spawnEnemy('boss', field.width / 2, 90, elapsed);
    director.bossRef = boss;
    enemies.push(boss);
    event = 'boss';
  }
  director.spawnTimer -= dt;
  if (director.spawnTimer <= 0) {
    director.spawnTimer += spawnIntervalAt(elapsed);
    if (enemies.length < liveCapAt(elapsed)) {
      const kind = kindAt(elapsed, rng);
      const point = edgeSpawnPoint(field, player, rng);
      enemies.push(spawnEnemy(kind, point.x, point.y, elapsed));
      // Late waves sometimes arrive in pairs.
      if (elapsed > 150 && rng() < 0.45 && enemies.length < liveCapAt(elapsed)) {
        const second = edgeSpawnPoint(field, player, rng);
        enemies.push(spawnEnemy(kindAt(elapsed, rng), second.x, second.y, elapsed));
      }
    }
  }
  return event;
}
