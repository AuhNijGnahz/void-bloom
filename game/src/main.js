// VOID BLOOM — boot, the game loop and the rules that connect the modules.
// Input is polled every frame, the world advances in fixed 1/60 s steps, and
// the renderer paints whatever state results. This file owns the run's state
// machine (title -> play -> level-up pauses -> win / lose -> restart) and the
// collision rules; each system it calls lives in its own module.
//
// Screenshot scenes: ?shot=title|boss|upgrade|win stages that scene with the
// real factories (see shots.js), paints it, and sets window.__shotReady.

import { RUN_DURATION, STEP, WIN_SCORE_BONUS, xpForLevel } from './config.js';
import { createAudioEngine } from './audio.js';
import { ACTION_CONFIRM, ACTION_PAUSE, createInput } from './input.js';
import { clampPlayerToField, createPlayer, updatePlayer } from './player.js';
import { separateEnemies, spawnEnemy, updateEnemies } from './enemies.js';
import { circlesOverlap, fireBossSporeBurst, firePlayerVolley, updateProjectiles } from './projectiles.js';
import { dropShards, updatePickups } from './pickups.js';
import { rollUpgradeChoices } from './upgrades.js';
import { createWaveDirector, updateWaves } from './waves.js';
import {
  createStarfield, drawBackground, drawBloom, drawEffects, drawEnemy,
  drawPickups, drawPlayer, drawProjectiles,
} from './render.js';
import {
  SCREEN_LEVELUP, SCREEN_LOSE, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN,
  drawHud, drawLevelUpScreen, drawLoseScreen, drawPausedScreen, drawTitleScreen,
  drawWinScreen, pointInRect, upgradeCardRects,
} from './ui.js';
import { stageShotScene } from './shots.js';

const BEST_KEY = 'void-bloom-best-score';
const MAX_FRAME = 0.25;

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const status = document.getElementById('status');
const audio = createAudioEngine();

const field = { width: 1280, height: 800 };

function resizeCanvas() {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  field.width = window.innerWidth;
  field.height = window.innerHeight;
  canvas.width = Math.round(field.width * dpr);
  canvas.height = Math.round(field.height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Private windows may refuse storage; the best score then lasts the visit.
  }
}

function announce(message) {
  status.textContent = message;
}

/** A fresh run state; `best` and the starfield survive between runs. */
function createState() {
  return {
    field,
    screen: SCREEN_TITLE,
    screenAge: 0,
    time: 0,
    elapsed: 0,
    score: 0,
    best: readBest(),
    level: 1,
    xp: 0,
    kills: 0,
    player: createPlayer(field.width / 2, field.height / 2),
    enemies: [],
    projectiles: [],
    pickups: [],
    particles: [],
    rings: [],
    choices: [],
    pendingLevels: 0,
    director: createWaveDirector(),
    boss: null,
    starfield: createStarfield(field, Math.random),
    bloomProgress: 0,
    shake: 0,
    pickupSoundAt: 0,
  };
}

const state = createState();

function resetRun() {
  const fresh = createState();
  fresh.best = state.best;
  fresh.starfield = state.starfield;
  Object.assign(state, fresh);
  state.screen = SCREEN_PLAY;
  announce('A new seed is planted. Survive five minutes.');
}

/** Particle burst helper shared by kills, hits and the screenshot kit. */
function burstAt(target, x, y, color, count) {
  for (let i = 0; i < count; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 40 + Math.random() * 190;
    target.particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0.35 + Math.random() * 0.4,
      maxLife: 0.75,
      color,
      size: 2 + Math.random() * 3,
    });
  }
}

function ringAt(x, y, color) {
  state.rings.push({ x, y, radius: 46, life: 0.32, maxLife: 0.32, color });
}

// ---------------------------------------------------------------------------
// Rules: damage, death, XP and the end of the run.
// ---------------------------------------------------------------------------

function damagePlayer(amount) {
  const player = state.player;
  if (player.invulnerableTimer > 0 || state.screen !== SCREEN_PLAY) return;
  if (player.shieldReady) {
    player.shieldReady = false;
    player.shieldTimer = player.stats.shieldCooldown;
    player.invulnerableTimer = 0.7;
    ringAt(player.x, player.y, '#ffd94d');
    audio.shieldPop();
    announce('Shield blocked a hit.');
    return;
  }
  player.hp -= amount;
  player.invulnerableTimer = 0.55;
  state.shake = 7;
  burstAt(state, player.x, player.y, '#ff5d5d', 8);
  audio.hurt();
  if (player.hp <= 0) {
    player.hp = 0;
    loseRun();
  }
}

function killEnemy(enemy) {
  enemy.alive = false;
  state.score += enemy.score;
  state.kills += 1;
  dropShards(state.pickups, enemy.x, enemy.y, enemy.xp);
  burstAt(state, enemy.x, enemy.y, enemy.color, enemy.kind === 'boss' ? 42 : 10);
  ringAt(enemy.x, enemy.y, enemy.color);
  audio.kill();
  if (enemy.kind === 'boss') {
    state.boss = null;
    state.shake = 12;
    announce('The Bloom Eater bursts! Survive to the Bloom.');
  }
}

function gainXp(amount) {
  state.xp += amount;
  while (state.xp >= xpForLevel(state.level)) {
    state.xp -= xpForLevel(state.level);
    state.level += 1;
    state.pendingLevels += 1;
  }
  if (state.pendingLevels > 0 && state.screen === SCREEN_PLAY) {
    state.choices = rollUpgradeChoices(state.player, Math.random);
    state.screen = SCREEN_LEVELUP;
    state.screenAge = 0;
    audio.levelUp();
    announce(`Level ${state.level}. Choose an upgrade.`);
  }
}

function applyUpgradeChoice(index) {
  const upgrade = state.choices[index];
  if (!upgrade) return;
  upgrade.apply(state.player);
  state.pendingLevels -= 1;
  burstAt(state, state.player.x, state.player.y, '#39d5ff', 14);
  audio.pickup();
  if (state.pendingLevels > 0) {
    state.choices = rollUpgradeChoices(state.player, Math.random);
    state.screenAge = 0;
  } else {
    state.screen = SCREEN_PLAY;
    state.screenAge = 0;
    announce('Back into the garden.');
  }
}

function winRun() {
  state.score += WIN_SCORE_BONUS + Math.ceil(state.player.hp);
  state.screen = SCREEN_WIN;
  state.screenAge = 0;
  for (const enemy of state.enemies) burstAt(state, enemy.x, enemy.y, enemy.color, 6);
  state.enemies = [];
  state.projectiles = [];
  if (state.score > state.best) {
    state.best = state.score;
    saveBest(state.best);
  }
  audio.win();
  announce(`The Bloom opens! Final score ${state.score}.`);
}

function loseRun() {
  state.screen = SCREEN_LOSE;
  state.screenAge = 0;
  burstAt(state, state.player.x, state.player.y, '#5dffb0', 30);
  ringAt(state.player.x, state.player.y, '#5dffb0');
  if (state.score > state.best) {
    state.best = state.score;
    saveBest(state.best);
  }
  audio.lose();
  announce(`The seed falls. Score ${state.score}. Best ${state.best}.`);
}

// ---------------------------------------------------------------------------
// One simulation tick.
// ---------------------------------------------------------------------------

function stepWorld(dt) {
  state.time += dt;
  state.screenAge += dt;
  // Effects always animate, even behind menus.
  for (const particle of state.particles) {
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.vx *= 0.94;
    particle.vy *= 0.94;
    particle.life -= dt;
  }
  state.particles = state.particles.filter((particle) => particle.life > 0);
  for (const ring of state.rings) ring.life -= dt;
  state.rings = state.rings.filter((ring) => ring.life > 0);
  state.shake = Math.max(0, state.shake - dt * 26);

  if (state.screen === SCREEN_WIN) {
    state.bloomProgress = Math.min(1, state.bloomProgress + dt / 1.5);
  }
  if (state.screen !== SCREEN_PLAY) return;

  state.elapsed += dt;
  if (state.elapsed >= RUN_DURATION) {
    winRun();
    return;
  }

  const waveEvent = updateWaves(state.director, dt, state.elapsed, field, state.player, state.enemies, Math.random);
  if (waveEvent === 'boss') {
    state.boss = state.director.bossRef;
    ringAt(state.boss.x, state.boss.y, '#ff3860');
    state.shake = 9;
    audio.bossRoar();
    announce('The Bloom Eater rises!');
  }

  const input = gameInput;
  const shouldFire = updatePlayer(state.player, dt, input.moveDirection(), input.mouse);
  clampPlayerToField(state.player, field);
  if (shouldFire) {
    firePlayerVolley(state.projectiles, state.player);
    audio.shoot();
  }

  const enemyEvents = {};
  updateEnemies(state.enemies, dt, state.player, state.elapsed, enemyEvents);
  if (enemyEvents.bossSporeBurst && state.boss && state.boss.alive) {
    fireBossSporeBurst(state.projectiles, state.boss, state.player);
  }
  if (enemyEvents.bossShedMites && state.boss && state.boss.alive) {
    for (let i = 0; i < 3; i += 1) {
      state.enemies.push(spawnEnemy('mite', state.boss.x + (Math.random() - 0.5) * 90, state.boss.y + (Math.random() - 0.5) * 90, state.elapsed));
    }
  }
  separateEnemies(state.enemies);

  updateProjectiles(state.projectiles, dt, field);
  resolveCollisions();

  const collected = updatePickups(state.pickups, dt, state.player);
  if (collected > 0) {
    if (state.time - state.pickupSoundAt > 0.06) {
      audio.pickup();
      state.pickupSoundAt = state.time;
    }
    gainXp(collected);
  }

  state.enemies = state.enemies.filter((enemy) => enemy.alive);
  state.projectiles = state.projectiles.filter((shot) => shot.alive);
  state.pickups = state.pickups.filter((shard) => shard.alive);
}

function resolveCollisions() {
  const player = state.player;
  for (const shot of state.projectiles) {
    if (!shot.alive) continue;
    if (shot.hostile) {
      if (circlesOverlap(shot, player)) {
        shot.alive = false;
        damagePlayer(shot.damage);
      }
      continue;
    }
    for (const enemy of state.enemies) {
      if (!enemy.alive || shot.hitIds.has(enemy.id)) continue;
      if (!circlesOverlap(shot, enemy)) continue;
      enemy.hp -= shot.damage;
      enemy.flashTimer = 0.08;
      burstAt(state, shot.x, shot.y, enemy.color, 3);
      audio.hit();
      if (enemy.hp <= 0) {
        killEnemy(enemy);
      }
      if (shot.pierceLeft > 0) {
        shot.pierceLeft -= 1;
        shot.hitIds.add(enemy.id);
      } else {
        shot.alive = false;
        break;
      }
    }
  }
  if (state.screen !== SCREEN_PLAY) return;
  for (const enemy of state.enemies) {
    if (enemy.alive && circlesOverlap(enemy, player)) {
      damagePlayer(enemy.damage);
      if (state.screen !== SCREEN_PLAY) return;
    }
  }
}

// ---------------------------------------------------------------------------
// Painting.
// ---------------------------------------------------------------------------

function render() {
  ctx.save();
  if (state.shake > 0) {
    ctx.translate((Math.random() - 0.5) * state.shake, (Math.random() - 0.5) * state.shake);
  }
  drawBackground(ctx, field, state.starfield, state.time);
  if (state.screen === SCREEN_WIN) drawBloom(ctx, field, state.time, state.bloomProgress, field.height * 0.42);
  drawPickups(ctx, state.pickups);
  for (const enemy of state.enemies) drawEnemy(ctx, enemy, state.time);
  drawProjectiles(ctx, state.projectiles);
  if (state.screen !== SCREEN_LOSE) drawPlayer(ctx, state.player, state.time);
  drawEffects(ctx, state.particles, state.rings);
  ctx.restore();

  if (state.screen === SCREEN_PLAY || state.screen === SCREEN_LEVELUP || state.screen === SCREEN_PAUSED) {
    drawHud(ctx, state);
  }
  if (state.screen === SCREEN_TITLE) drawTitleScreen(ctx, state);
  else if (state.screen === SCREEN_LEVELUP) drawLevelUpScreen(ctx, state);
  else if (state.screen === SCREEN_PAUSED) drawPausedScreen(ctx, state);
  else if (state.screen === SCREEN_WIN) drawWinScreen(ctx, state);
  else if (state.screen === SCREEN_LOSE) drawLoseScreen(ctx, state);
}

// ---------------------------------------------------------------------------
// Input routing between screens.
// ---------------------------------------------------------------------------

const gameInput = createInput(canvas, (clientX, clientY) => {
  const rect = canvas.getBoundingClientRect();
  return { x: clientX - rect.left, y: clientY - rect.top };
});

function handleFrameInput() {
  const actions = gameInput.takeActions();
  const click = gameInput.takeClick();
  const picked = gameInput.takePickedCard();
  if (actions !== 0 || click) audio.unlock();

  if (state.screen === SCREEN_TITLE) {
    if (actions & ACTION_CONFIRM) resetRun();
  } else if (state.screen === SCREEN_PLAY) {
    if (actions & ACTION_PAUSE) {
      state.screen = SCREEN_PAUSED;
      state.screenAge = 0;
      announce('Paused.');
    }
  } else if (state.screen === SCREEN_PAUSED) {
    if (actions & (ACTION_PAUSE | ACTION_CONFIRM)) {
      state.screen = SCREEN_PLAY;
      state.screenAge = 0;
      announce('Playing.');
    }
  } else if (state.screen === SCREEN_LEVELUP) {
    if (picked >= 0 && picked < state.choices.length) {
      applyUpgradeChoice(picked);
    } else if (click) {
      const rects = upgradeCardRects(field);
      const index = rects.findIndex((rect) => pointInRect(click, rect));
      if (index >= 0) applyUpgradeChoice(index);
    }
  } else if (state.screen === SCREEN_WIN || state.screen === SCREEN_LOSE) {
    if (state.screenAge < 0.5) return;
    if (actions & ACTION_CONFIRM) resetRun();
  }
}

// ---------------------------------------------------------------------------
// Boot: screenshot mode stages one scene; otherwise the live loop runs.
// ---------------------------------------------------------------------------

const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');

if (shotName) {
  const kit = {
    spawnEnemy,
    dropShards,
    firePlayerVolley,
    fireBossSporeBurst,
    burstAt: (target, x, y, color, count) => burstAt(target, x, y, color, count),
  };
  stageShotScene(shotName, state, kit);
  state.time = 2.4;
  let painted = 0;
  const paintShot = () => {
    render();
    painted += 1;
    if (painted < 3) requestAnimationFrame(paintShot);
    else window.__shotReady = true;
  };
  requestAnimationFrame(paintShot);
} else {
  let accumulator = 0;
  let last = performance.now();
  const frame = (now) => {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    handleFrameInput();
    while (accumulator >= STEP) {
      stepWorld(STEP);
      accumulator -= STEP;
      if (state.screen === SCREEN_LEVELUP || state.screen === SCREEN_PAUSED) {
        accumulator = 0;
        break;
      }
    }
    render();
  };
  requestAnimationFrame(frame);
}

// A small handle for automated play-testing in a local browser.
window.__voidBloom = { state, startRun: resetRun };
