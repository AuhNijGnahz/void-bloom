// Projectiles: the seed ship's light bolts and the boss's void spores.
// Bolts fly straight, can pierce a set number of mites, and die on the arena
// wall. Spores drift at the player and are destroyed on impact. Collision
// tests are exported so main's rules read in one place.

/** Spawn the player's volley: `stats.projectiles` bolts fanned around the aim. */
export function firePlayerVolley(projectiles, player) {
  const stats = player.stats;
  const count = stats.projectiles;
  const spreadStep = 0.11;
  for (let i = 0; i < count; i += 1) {
    const angle = player.angle + (i - (count - 1) / 2) * spreadStep;
    projectiles.push({
      x: player.x + Math.cos(player.angle) * (player.radius + 6),
      y: player.y + Math.sin(player.angle) * (player.radius + 6),
      vx: Math.cos(angle) * stats.boltSpeed,
      vy: Math.sin(angle) * stats.boltSpeed,
      radius: 5,
      damage: stats.damage,
      pierceLeft: stats.pierce,
      hostile: false,
      alive: true,
      hitIds: new Set(),
    });
  }
}

/** Spawn a ring of slow spores from the boss, aimed loosely at the player. */
export function fireBossSporeBurst(projectiles, boss, player) {
  const count = 10;
  const baseAngle = Math.atan2(player.y - boss.y, player.x - boss.x);
  for (let i = 0; i < count; i += 1) {
    const angle = baseAngle + (i / count) * Math.PI * 2;
    projectiles.push({
      x: boss.x + Math.cos(angle) * (boss.radius + 8),
      y: boss.y + Math.sin(angle) * (boss.radius + 8),
      vx: Math.cos(angle) * 148,
      vy: Math.sin(angle) * 148,
      radius: 7,
      damage: 12,
      pierceLeft: 0,
      hostile: true,
      alive: true,
      hitIds: new Set(),
    });
  }
}

/** Move every projectile one tick and retire the ones that leave the arena. */
export function updateProjectiles(projectiles, dt, field) {
  for (const shot of projectiles) {
    shot.x += shot.vx * dt;
    shot.y += shot.vy * dt;
    if (shot.x < -30 || shot.y < -30 || shot.x > field.width + 30 || shot.y > field.height + 30) {
      shot.alive = false;
    }
  }
}

/** Circle overlap test used for every hit in the game. */
export function circlesOverlap(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const radius = a.radius + b.radius;
  return dx * dx + dy * dy < radius * radius;
}
