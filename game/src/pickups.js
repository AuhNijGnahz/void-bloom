// Light shards: the XP that mites drop when they burst. Shards drift, sparkle,
// and fly to the ship once it comes within magnet range. Collecting them is
// what levels the ship up, so their motion is generous and readable.

/** Drop `value` shards in a small burst around a dead enemy. */
export function dropShards(pickups, x, y, value) {
  for (let i = 0; i < value; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * 22;
    pickups.push({
      x: x + Math.cos(angle) * distance,
      y: y + Math.sin(angle) * distance,
      vx: Math.cos(angle) * 40,
      vy: Math.sin(angle) * 40,
      radius: 7,
      value: 1,
      magnetised: false,
      sparklePhase: Math.random() * Math.PI * 2,
      alive: true,
    });
  }
}

/**
 * Move shards one tick. Returns how much XP reached the ship this tick:
 * shards inside the magnet radius accelerate toward it, and a shard that
 * touches the hull is collected.
 */
export function updatePickups(pickups, dt, player) {
  let collectedXp = 0;
  for (const shard of pickups) {
    shard.sparklePhase += dt * 6;
    const dx = player.x - shard.x;
    const dy = player.y - shard.y;
    const distance = Math.hypot(dx, dy) || 1;
    if (distance < player.stats.magnetRadius) shard.magnetised = true;
    if (shard.magnetised) {
      const pull = 560;
      shard.vx = (dx / distance) * pull;
      shard.vy = (dy / distance) * pull;
    } else {
      shard.vx *= 0.92;
      shard.vy *= 0.92;
    }
    shard.x += shard.vx * dt;
    shard.y += shard.vy * dt;
    if (distance < player.radius + shard.radius + 4) {
      shard.alive = false;
      collectedXp += shard.value;
    }
  }
  return collectedXp;
}
