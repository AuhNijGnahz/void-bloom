// Screenshot scenes behind ?shot=title|boss|upgrade|win. Each scene builds a
// real game state with the game's own factories — real enemies, real shards,
// real upgrade cards, the real boss — and the normal renderer paints it, so a
// screenshot is the game exactly as a player sees it, never a mock-up. The
// positions are staged by hand so every scene is busy and readable at a glance.

import { UPGRADES } from './upgrades.js';
import { SCREEN_LEVELUP, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './ui.js';

function scatterShards(state, kit, points) {
  for (const [x, y, count] of points) kit.dropShards(state.pickups, x, y, count);
}

function addEnemy(state, kit, kind, x, y, hpFraction = 1) {
  const enemy = kit.spawnEnemy(kind, x, y, state.elapsed);
  if (hpFraction < 1) enemy.hp = enemy.maxHp * hpFraction;
  // Scenes are frozen moments mid-fight: arrivals have long since bloomed in.
  enemy.spawnAge = 99;
  state.enemies.push(enemy);
  return enemy;
}

/** Title: the ship at rest under the half-open Bloom, the garden stirring. */
function stageTitle(state, kit) {
  state.screen = SCREEN_TITLE;
  const w = state.field.width;
  const h = state.field.height;
  state.player.x = w / 2;
  state.player.y = h * 0.87;
  state.player.angle = -0.5;
  state.player.shieldReady = true;
  state.player.stats.shieldCooldown = 9;
  addEnemy(state, kit, 'mite', w * 0.16, h * 0.24);
  addEnemy(state, kit, 'mite', w * 0.84, h * 0.2);
  addEnemy(state, kit, 'mite', w * 0.68, h * 0.1, 0.7);
  addEnemy(state, kit, 'dart', w * 0.78, h * 0.78);
  addEnemy(state, kit, 'dart', w * 0.2, h * 0.82);
  addEnemy(state, kit, 'brute', w * 0.08, h * 0.55, 0.85);
  scatterShards(state, kit, [
    [w * 0.3, h * 0.7, 3], [w * 0.88, h * 0.52, 2], [w * 0.42, h * 0.16, 3],
    [w * 0.6, h * 0.88, 2], [w * 0.12, h * 0.38, 2],
  ]);
  kit.burstAt(state, w * 0.68, h * 0.1, '#ff4d8d', 8);
}

/** Boss fight at 3:16: the Eater raging, a mixed swarm, bolts in flight. */
function stageBoss(state, kit) {
  state.screen = SCREEN_PLAY;
  state.elapsed = 196;
  state.score = 2840;
  state.kills = 132;
  state.level = 7;
  state.xp = 9;
  state.combo = 23;
  state.comboTimer = 2.5;
  state.player.x = state.field.width * 0.38;
  state.player.y = state.field.height * 0.62;
  state.player.hp = 74;
  state.player.stats.maxHp = 125;
  state.player.shieldReady = true;
  state.player.stats.shieldCooldown = 9;
  state.player.angle = Math.atan2(state.field.height * 0.36 - state.player.y, state.field.width * 0.63 - state.player.x);
  const boss = addEnemy(state, kit, 'boss', state.field.width * 0.63, state.field.height * 0.36, 0.3);
  boss.enraged = true;
  state.boss = boss;
  state.director.bossSpawned = true;
  state.director.bossRef = boss;
  const w = state.field.width;
  const h = state.field.height;
  addEnemy(state, kit, 'mite', w * 0.55, h * 0.72, 0.7);
  addEnemy(state, kit, 'mite', w * 0.47, h * 0.2);
  addEnemy(state, kit, 'mite', w * 0.85, h * 0.62, 0.4);
  addEnemy(state, kit, 'mite', w * 0.2, h * 0.3);
  addEnemy(state, kit, 'mite', w * 0.3, h * 0.85, 0.5);
  addEnemy(state, kit, 'mite', w * 0.78, h * 0.12);
  addEnemy(state, kit, 'mite', w * 0.12, h * 0.68);
  addEnemy(state, kit, 'dart', w * 0.6, h * 0.12);
  addEnemy(state, kit, 'dart', w * 0.9, h * 0.3, 0.8);
  addEnemy(state, kit, 'dart', w * 0.18, h * 0.12, 0.6);
  addEnemy(state, kit, 'brute', w * 0.82, h * 0.82, 0.55);
  addEnemy(state, kit, 'brute', w * 0.08, h * 0.28, 0.75);
  // Volleys in flight toward the boss, and spores drifting back.
  for (let i = 0; i < 5; i += 1) kit.firePlayerVolley(state.projectiles, state.player);
  for (const shot of state.projectiles) {
    shot.x += shot.vx * (0.12 + Math.random() * 0.3);
    shot.y += shot.vy * (0.12 + Math.random() * 0.3);
  }
  kit.fireBossSporeBurst(state.projectiles, boss, state.player);
  kit.fireBossSporeBurst(state.projectiles, boss, state.player);
  scatterShards(state, kit, [[w * 0.5, h * 0.48, 4], [w * 0.28, h * 0.78, 3], [w * 0.72, h * 0.55, 3], [w * 0.44, h * 0.3, 3]]);
  kit.burstAt(state, w * 0.52, h * 0.4, '#ff4d8d', 10);
  kit.burstAt(state, w * 0.6, h * 0.3, '#ffb02e', 8);
  // The moment frozen: damage numbers on the Eater, and its rage announced.
  state.floaters.push(
    { x: w * 0.6, y: h * 0.24, life: 0.65, maxLife: 0.7, text: '26', color: '#c8ffe9', size: 13 },
    { x: w * 0.68, y: h * 0.28, life: 0.65, maxLife: 0.7, text: '26', color: '#c8ffe9', size: 13 },
    { x: w * 0.64, y: h * 0.18, life: 0.65, maxLife: 0.7, text: '31', color: '#c8ffe9', size: 13 },
  );
  state.banner = { title: 'THE EATER RAGES', sub: 'Wounded — and far more dangerous.', from: 2.0, until: 99, color: '#ffb02e' };
}

/** Level-up at 1:14: the game paused behind three real upgrade cards. */
function stageUpgrade(state, kit) {
  state.screen = SCREEN_LEVELUP;
  state.elapsed = 74;
  state.score = 860;
  state.kills = 41;
  state.level = 4;
  state.xp = 1;
  state.player.hp = 82;
  const w = state.field.width;
  const h = state.field.height;
  state.player.x = w / 2;
  state.player.y = h * 0.68;
  addEnemy(state, kit, 'mite', w * 0.2, h * 0.25);
  addEnemy(state, kit, 'mite', w * 0.8, h * 0.22, 0.6);
  addEnemy(state, kit, 'dart', w * 0.86, h * 0.6);
  addEnemy(state, kit, 'brute', w * 0.12, h * 0.62, 0.8);
  addEnemy(state, kit, 'mite', w * 0.62, h * 0.84);
  addEnemy(state, kit, 'mite', w * 0.34, h * 0.12, 0.5);
  addEnemy(state, kit, 'dart', w * 0.06, h * 0.3, 0.7);
  scatterShards(state, kit, [[w * 0.42, h * 0.6, 3], [w * 0.58, h * 0.3, 2], [w * 0.7, h * 0.85, 3]]);
  kit.burstAt(state, w / 2, h * 0.68, '#39d5ff', 12);
  const wanted = ['damage', 'multishot', 'shield'];
  state.choices = UPGRADES.filter((upgrade) => wanted.includes(upgrade.id));
}

/** Victory: five minutes survived, the Bloom open, final stats on show. */
function stageWin(state, kit) {
  state.screen = SCREEN_WIN;
  state.elapsed = 300;
  state.score = 6420;
  state.kills = 268;
  state.level = 11;
  state.bloomProgress = 1;
  state.player.x = state.field.width / 2;
  state.player.y = state.field.height / 2 + 168;
  state.player.hp = 57;
  state.player.stats.maxHp = 150;
  state.player.shieldReady = true;
  state.player.stats.shieldCooldown = 9;
  scatterShards(state, kit, [[state.field.width * 0.3, state.field.height * 0.75, 3], [state.field.width * 0.7, state.field.height * 0.78, 3], [state.field.width * 0.5, state.field.height * 0.85, 4]]);
  kit.burstAt(state, state.field.width * 0.4, state.field.height * 0.3, '#ffd94d', 10);
  kit.burstAt(state, state.field.width * 0.62, state.field.height * 0.24, '#ff7ac0', 10);
  kit.burstAt(state, state.field.width * 0.52, state.field.height * 0.42, '#5dffb0', 8);
  kit.burstAt(state, state.field.width * 0.34, state.field.height * 0.5, '#39d5ff', 8);
}

const SCENES = { title: stageTitle, boss: stageBoss, upgrade: stageUpgrade, win: stageWin };

/** Stage the named scene into a fresh state; unknown names fall back to title. */
export function stageShotScene(name, state, kit) {
  const scene = SCENES[name] ?? stageTitle;
  scene(state, kit);
}
