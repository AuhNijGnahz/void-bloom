// The seed ship: position, aim, hull, and the timers that pace its gun, its
// shield and its post-hit invulnerability. Upgrades mutate `stats`; nothing
// else in the game writes player fields except damagePlayer in main's rules.

import { PLAYER_BASE } from './config.js';

/** A fresh seed ship at the centre of the garden, facing up. */
export function createPlayer(x, y) {
  return {
    x, y,
    vx: 0, vy: 0,
    angle: -Math.PI / 2,
    radius: PLAYER_BASE.radius,
    hp: PLAYER_BASE.maxHp,
    stats: { ...PLAYER_BASE },
    fireTimer: 0,
    invulnerableTimer: 0,
    shieldTimer: 0,
    shieldReady: false,
    thrust: 0,
  };
}

/**
 * Advance the ship one tick: drift toward the input direction, face the mouse,
 * and count down gun, shield and invulnerability timers. Returns true on the
 * ticks where the gun should fire (main spawns the bolts, so spread and
 * multishot rules live in projectiles.js).
 */
export function updatePlayer(player, dt, move, aim) {
  const stats = player.stats;
  player.vx = move.x * stats.speed;
  player.vy = move.y * stats.speed;
  player.x += player.vx * dt;
  player.y += player.vy * dt;
  player.thrust = Math.hypot(move.x, move.y) > 0 ? 1 : Math.max(0, player.thrust - dt * 6);
  player.angle = Math.atan2(aim.y - player.y, aim.x - player.x);

  if (stats.regenPerSecond > 0) {
    player.hp = Math.min(stats.maxHp, player.hp + stats.regenPerSecond * dt);
  }
  player.invulnerableTimer = Math.max(0, player.invulnerableTimer - dt);

  if (stats.shieldCooldown > 0) {
    player.shieldTimer -= dt;
    if (player.shieldTimer <= 0 && !player.shieldReady) {
      player.shieldReady = true;
    }
  }

  player.fireTimer -= dt;
  if (player.fireTimer <= 0) {
    player.fireTimer += stats.fireInterval;
    return true;
  }
  return false;
}

/** Keep the ship inside the arena with a soft margin at the walls. */
export function clampPlayerToField(player, field) {
  player.x = Math.min(field.width - player.radius, Math.max(player.radius, player.x));
  player.y = Math.min(field.height - player.radius, Math.max(player.radius, player.y));
}
