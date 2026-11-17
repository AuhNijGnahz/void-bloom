// Void mites: the things that hunt the seed ship. Three lesser kinds with
// distinct movement — mites chase, darts lunge in straight bursts, brutes
// lumber and soak damage — and the Bloom Eater boss, which circles the ship,
// sprays spores and sheds mites. Spawning cadence lives in waves.js; this
// file owns what an enemy is and how it moves.

import { ENEMY_TYPES } from './config.js';

let nextEnemyId = 1;

/** Create one enemy of `kind` at a position, scaled for the run's elapsed time. */
export function spawnEnemy(kind, x, y, elapsed) {
  const base = ENEMY_TYPES[kind];
  const minutes = elapsed / 60;
  const hpScale = kind === 'boss' ? 1 : 1 + minutes * 0.38;
  const speedScale = kind === 'boss' ? 1 : 1 + minutes * 0.05;
  return {
    id: nextEnemyId++,
    kind, x, y,
    vx: 0, vy: 0,
    hp: base.hp * hpScale,
    maxHp: base.hp * hpScale,
    speed: base.speed * speedScale,
    radius: base.radius,
    damage: base.damage,
    score: base.score,
    xp: base.xp,
    color: base.color,
    wobblePhase: Math.random() * Math.PI * 2,
    lungeTimer: 1 + Math.random() * 1.5,
    lunging: 0,
    sporeTimer: 1.6,
    shedTimer: 5,
    flashTimer: 0,
    spawnAge: 0,
    enraged: false,
    alive: true,
  };
}

/** A point on the arena edge, at least a short run from the player. */
export function edgeSpawnPoint(field, player, rng) {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const side = Math.floor(rng() * 4);
    const point = {
      x: side === 0 ? 0 : side === 1 ? field.width : rng() * field.width,
      y: side === 2 ? 0 : side === 3 ? field.height : rng() * field.height,
    };
    if (Math.hypot(point.x - player.x, point.y - player.y) > 260) return point;
  }
  return { x: field.width / 2, y: 0 };
}

function steerToward(enemy, target, dt, speedFactor = 1) {
  const dx = target.x - enemy.x;
  const dy = target.y - enemy.y;
  const distance = Math.hypot(dx, dy) || 1;
  enemy.vx = (dx / distance) * enemy.speed * speedFactor;
  enemy.vy = (dy / distance) * enemy.speed * speedFactor;
  enemy.x += enemy.vx * dt;
  enemy.y += enemy.vy * dt;
}

/**
 * Move every enemy one tick. The boss additionally reports through `events`
 * when it wants spores fired or mites shed, so main can spawn them without
 * this file depending on projectiles or pickups.
 */
export function updateEnemies(enemies, dt, player, elapsed, events) {
  for (const enemy of enemies) {
    enemy.flashTimer = Math.max(0, enemy.flashTimer - dt);
    enemy.spawnAge += dt;
    enemy.wobblePhase += dt * 5;
    if (enemy.kind === 'mite') {
      const wobble = Math.sin(enemy.wobblePhase) * 26;
      steerToward(enemy, { x: player.x + -Math.sin(enemy.wobblePhase) * wobble, y: player.y + Math.cos(enemy.wobblePhase) * wobble }, dt);
    } else if (enemy.kind === 'dart') {
      enemy.lungeTimer -= dt;
      if (enemy.lunging > 0) {
        enemy.lunging -= dt;
        enemy.x += enemy.vx * dt;
        enemy.y += enemy.vy * dt;
      } else if (enemy.lungeTimer <= 0) {
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const distance = Math.hypot(dx, dy) || 1;
        enemy.vx = (dx / distance) * enemy.speed * 2.5;
        enemy.vy = (dy / distance) * enemy.speed * 2.5;
        enemy.lunging = 0.45;
        enemy.lungeTimer = 1.4 + Math.random() * 1.2;
      } else {
        steerToward(enemy, player, dt, 0.45);
      }
    } else if (enemy.kind === 'brute') {
      steerToward(enemy, player, dt);
    } else if (enemy.kind === 'boss') {
      // Wounded past a third of its hull, the Eater enrages: quicker, closer,
      // and spraying spores half again as often.
      if (!enemy.enraged && enemy.hp < enemy.maxHp * 0.35) {
        enemy.enraged = true;
        events.bossEnraged = true;
      }
      const pace = enemy.enraged ? 1.3 : 1;
      // The Eater keeps its distance and circles, closing in only slowly.
      const dx = player.x - enemy.x;
      const dy = player.y - enemy.y;
      const distance = Math.hypot(dx, dy) || 1;
      const orbit = enemy.enraged ? 190 : 230;
      const radial = distance > orbit + 30 ? 1 : distance < orbit - 30 ? -0.6 : 0;
      const tangentX = -dy / distance;
      const tangentY = dx / distance;
      enemy.vx = ((dx / distance) * radial + tangentX * 0.8) * enemy.speed * 2.1 * pace;
      enemy.vy = ((dy / distance) * radial + tangentY * 0.8) * enemy.speed * 2.1 * pace;
      enemy.x += enemy.vx * dt;
      enemy.y += enemy.vy * dt;
      enemy.sporeTimer -= dt;
      if (enemy.sporeTimer <= 0) {
        enemy.sporeTimer = Math.max(0.85, 1.7 - elapsed / 300) * (enemy.enraged ? 0.62 : 1);
        events.bossSporeBurst = true;
      }
      enemy.shedTimer -= dt;
      if (enemy.shedTimer <= 0) {
        enemy.shedTimer = 6;
        events.bossShedMites = true;
      }
    }
  }
}

/** Push overlapping enemies apart so a swarm reads as bodies, not one blob. */
export function separateEnemies(enemies) {
  for (let i = 0; i < enemies.length; i += 1) {
    for (let j = i + 1; j < enemies.length; j += 1) {
      const a = enemies[i];
      const b = enemies[j];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const minDistance = a.radius + b.radius;
      const distanceSq = dx * dx + dy * dy;
      if (distanceSq > 0 && distanceSq < minDistance * minDistance) {
        const distance = Math.sqrt(distanceSq);
        const push = ((minDistance - distance) / distance) * 0.32;
        a.x -= dx * push;
        a.y -= dy * push;
        b.x += dx * push;
        b.y += dy * push;
      }
    }
  }
}
