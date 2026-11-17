// Canvas renderer for the world itself: the void garden backdrop, shards,
// the seed ship, mites, bolts and burst effects. All art is drawn from code —
// layered glows, petals and spikes in one neon palette — with no image files.
// HUD text and full-screen menus live in ui.js; this file only paints the play
// field, so a screenshot of the field is the game and nothing else.

import { COLORS } from './config.js';

/** Pre-generate a starfield sized to the arena so frames stay cheap. */
export function createStarfield(field, rng) {
  const stars = [];
  for (let i = 0; i < 150; i += 1) {
    stars.push({
      x: rng() * field.width,
      y: rng() * field.height,
      size: rng() * 1.8 + 0.4,
      twinkle: rng() * Math.PI * 2,
      depth: 0.3 + rng() * 0.7,
    });
  }
  const nebulae = [];
  for (let i = 0; i < 5; i += 1) {
    nebulae.push({
      x: rng() * field.width,
      y: rng() * field.height,
      radius: 150 + rng() * 220,
      hue: ['#1b2a6b', '#3b1454', '#0d3d4d', '#14295e', '#2c1150'][i % 5],
    });
  }
  return { stars, nebulae };
}

/** Paint the deep-space garden: nebula washes, twinkling stars, faint spores. */
export function drawBackground(ctx, field, starfield, time) {
  ctx.fillStyle = COLORS.void;
  ctx.fillRect(0, 0, field.width, field.height);
  for (const nebula of starfield.nebulae) {
    const gradient = ctx.createRadialGradient(nebula.x, nebula.y, 0, nebula.x, nebula.y, nebula.radius);
    gradient.addColorStop(0, nebula.hue);
    gradient.addColorStop(1, 'rgba(5,7,15,0)');
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = gradient;
    ctx.fillRect(nebula.x - nebula.radius, nebula.y - nebula.radius, nebula.radius * 2, nebula.radius * 2);
  }
  ctx.globalAlpha = 1;
  for (const star of starfield.stars) {
    const alpha = 0.35 + 0.4 * Math.abs(Math.sin(time * 0.7 + star.twinkle));
    ctx.globalAlpha = alpha * star.depth;
    ctx.fillStyle = COLORS.star;
    ctx.fillRect(star.x, star.y, star.size, star.size);
  }
  ctx.globalAlpha = 1;
  // A faint dotted border marks the garden wall.
  ctx.strokeStyle = 'rgba(57,213,255,0.25)';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, field.width - 2, field.height - 2);
}

/** Draw XP shards as pulsing cyan diamonds. */
export function drawPickups(ctx, pickups) {
  for (const shard of pickups) {
    const pulse = 1 + Math.sin(shard.sparklePhase) * 0.25;
    const size = shard.radius * pulse;
    ctx.save();
    ctx.translate(shard.x, shard.y);
    ctx.rotate(shard.sparklePhase * 0.4);
    ctx.shadowColor = COLORS.shard;
    ctx.shadowBlur = 12;
    ctx.fillStyle = COLORS.shard;
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.lineTo(size * 0.7, 0);
    ctx.lineTo(0, size);
    ctx.lineTo(-size * 0.7, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

/** Draw the seed ship: a glowing seed hull with leaf fins and a petal shield. */
export function drawPlayer(ctx, player, time) {
  const blink = player.invulnerableTimer > 0 && Math.floor(time * 14) % 2 === 0;
  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.rotate(player.angle);
  ctx.globalAlpha = blink ? 0.35 : 1;
  // Engine glow while moving.
  if (player.thrust > 0) {
    const flame = 12 + Math.sin(time * 31) * 4;
    const gradient = ctx.createLinearGradient(-player.radius, 0, -player.radius - flame - 8, 0);
    gradient.addColorStop(0, 'rgba(125,255,206,0.9)');
    gradient.addColorStop(1, 'rgba(125,255,206,0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(-player.radius + 2, -5);
    ctx.lineTo(-player.radius - flame - 8, 0);
    ctx.lineTo(-player.radius + 2, 5);
    ctx.closePath();
    ctx.fill();
  }
  // Leaf fins.
  ctx.fillStyle = '#2ea86a';
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.rotate(side * 0.65);
    ctx.beginPath();
    ctx.ellipse(-8, side * 10, 11, 4.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  // Seed hull.
  ctx.shadowColor = COLORS.player;
  ctx.shadowBlur = 16;
  const hull = ctx.createLinearGradient(-player.radius, 0, player.radius, 0);
  hull.addColorStop(0, '#1d7a4c');
  hull.addColorStop(0.6, '#37d67a');
  hull.addColorStop(1, '#8dffc4');
  ctx.fillStyle = hull;
  ctx.beginPath();
  ctx.moveTo(player.radius + 5, 0);
  ctx.quadraticCurveTo(2, -player.radius, -player.radius, -player.radius * 0.55);
  ctx.quadraticCurveTo(-player.radius - 3, 0, -player.radius, player.radius * 0.55);
  ctx.quadraticCurveTo(2, player.radius, player.radius + 5, 0);
  ctx.fill();
  ctx.shadowBlur = 0;
  // Cockpit heart.
  ctx.fillStyle = COLORS.playerCore;
  ctx.beginPath();
  ctx.arc(3, 0, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // Aegis petal shield ring.
  if (player.shieldReady) {
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.strokeStyle = 'rgba(255,217,77,0.85)';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = COLORS.gold;
    ctx.shadowBlur = 10;
    ctx.setLineDash([10, 7]);
    ctx.lineDashOffset = -time * 24;
    ctx.beginPath();
    ctx.arc(0, 0, player.radius + 10, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

/** Draw one mite of any kind; each kind has its own silhouette. */
export function drawEnemy(ctx, enemy, time) {
  ctx.save();
  ctx.translate(enemy.x, enemy.y);
  const flash = enemy.flashTimer > 0;
  const body = flash ? '#ffffff' : enemy.color;
  ctx.shadowColor = enemy.color;
  ctx.shadowBlur = enemy.kind === 'boss' ? 26 : 12;
  if (enemy.kind === 'mite') {
    ctx.rotate(Math.sin(enemy.wobblePhase) * 0.4);
    ctx.strokeStyle = body;
    ctx.lineWidth = 2;
    for (let leg = 0; leg < 6; leg += 1) {
      const angle = (leg / 6) * Math.PI * 2 + Math.sin(enemy.wobblePhase * 2) * 0.2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * enemy.radius * 0.6, Math.sin(angle) * enemy.radius * 0.6);
      ctx.lineTo(Math.cos(angle) * (enemy.radius + 6), Math.sin(angle) * (enemy.radius + 6));
      ctx.stroke();
    }
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.arc(0, 0, enemy.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2b0a1a';
    ctx.beginPath();
    ctx.arc(0, 0, enemy.radius * 0.45, 0, Math.PI * 2);
    ctx.fill();
  } else if (enemy.kind === 'dart') {
    const angle = Math.atan2(enemy.vy, enemy.vx);
    ctx.rotate(angle);
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.moveTo(enemy.radius + 5, 0);
    ctx.lineTo(-enemy.radius, -enemy.radius * 0.8);
    ctx.lineTo(-enemy.radius * 0.4, 0);
    ctx.lineTo(-enemy.radius, enemy.radius * 0.8);
    ctx.closePath();
    ctx.fill();
  } else if (enemy.kind === 'brute') {
    ctx.rotate(time * 0.6);
    ctx.fillStyle = body;
    ctx.beginPath();
    for (let point = 0; point < 6; point += 1) {
      const angle = (point / 6) * Math.PI * 2;
      const px = Math.cos(angle) * enemy.radius;
      const py = Math.sin(angle) * enemy.radius;
      if (point === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.rotate(-time * 1.4);
    ctx.fillStyle = '#ffd94d';
    ctx.beginPath();
    ctx.arc(0, 0, enemy.radius * 0.32, 0, Math.PI * 2);
    ctx.fill();
  } else if (enemy.kind === 'boss') {
    // The Bloom Eater: a ring of dark petals around a burning core.
    for (let petal = 0; petal < 9; petal += 1) {
      const angle = (petal / 9) * Math.PI * 2 + time * 0.35;
      ctx.save();
      ctx.rotate(angle);
      ctx.fillStyle = flash ? '#ffffff' : '#8e1e46';
      ctx.beginPath();
      ctx.ellipse(enemy.radius * 0.95, 0, enemy.radius * 0.5, enemy.radius * 0.24, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.arc(0, 0, enemy.radius * 0.72, 0, Math.PI * 2);
    ctx.fill();
    const pulse = 1 + Math.sin(time * 4) * 0.12;
    ctx.fillStyle = '#ffe66d';
    ctx.beginPath();
    ctx.arc(0, 0, enemy.radius * 0.3 * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1a0510';
    ctx.beginPath();
    ctx.arc(0, 0, enemy.radius * 0.14 * pulse, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  // Lesser mites wear their damage as a small arc under the body.
  if (enemy.kind !== 'boss' && enemy.hp < enemy.maxHp) {
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(enemy.x - enemy.radius, enemy.y + enemy.radius + 5, enemy.radius * 2, 3);
    ctx.fillStyle = enemy.color;
    ctx.fillRect(enemy.x - enemy.radius, enemy.y + enemy.radius + 5, enemy.radius * 2 * (enemy.hp / enemy.maxHp), 3);
  }
}

/** Draw bolts as bright capsules and spores as sickly orbs. */
export function drawProjectiles(ctx, projectiles) {
  for (const shot of projectiles) {
    ctx.save();
    ctx.translate(shot.x, shot.y);
    if (shot.hostile) {
      ctx.shadowColor = COLORS.spore;
      ctx.shadowBlur = 10;
      ctx.fillStyle = COLORS.spore;
      ctx.beginPath();
      ctx.arc(0, 0, shot.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.beginPath();
      ctx.arc(-2, -2, 2.2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      const angle = Math.atan2(shot.vy, shot.vx);
      ctx.rotate(angle);
      ctx.shadowColor = COLORS.bolt;
      ctx.shadowBlur = 12;
      ctx.fillStyle = COLORS.bolt;
      ctx.beginPath();
      ctx.ellipse(0, 0, 10, 3.4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(2, 0, 4.5, 1.8, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

/** Draw burst particles and expanding shockwave rings. */
export function drawEffects(ctx, particles, rings) {
  for (const particle of particles) {
    const alpha = Math.max(0, particle.life / particle.maxLife);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = particle.color;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size * alpha + 0.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  for (const ring of rings) {
    const progress = 1 - ring.life / ring.maxLife;
    ctx.globalAlpha = (1 - progress) * 0.8;
    ctx.strokeStyle = ring.color;
    ctx.lineWidth = 3 * (1 - progress) + 0.5;
    ctx.beginPath();
    ctx.arc(ring.x, ring.y, ring.radius * progress + 6, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

/** The Bloom itself: a great flower opening over the garden on victory. */
export function drawBloom(ctx, field, time, bloomProgress, centerY = field.height / 2) {
  const cx = field.width / 2;
  const cy = centerY;
  const open = Math.min(1, bloomProgress);
  ctx.save();
  ctx.translate(cx, cy);
  for (let layer = 0; layer < 3; layer += 1) {
    const petals = 8 - layer * 2;
    const length = (120 - layer * 28) * open;
    const width = 44 - layer * 9;
    const colors = ['#ff7ac0', '#ffb3dd', '#fff3b0'];
    for (let petal = 0; petal < petals; petal += 1) {
      const angle = (petal / petals) * Math.PI * 2 + layer * 0.5 + time * 0.12;
      ctx.save();
      ctx.rotate(angle);
      ctx.fillStyle = colors[layer];
      ctx.shadowColor = colors[layer];
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.ellipse(length * 0.62, 0, length * 0.55, width * (0.4 + open * 0.6), 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
  const corePulse = 1 + Math.sin(time * 3) * 0.1;
  ctx.fillStyle = '#fff8d6';
  ctx.shadowColor = '#ffd94d';
  ctx.shadowBlur = 30;
  ctx.beginPath();
  ctx.arc(0, 0, 26 * open * corePulse, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
