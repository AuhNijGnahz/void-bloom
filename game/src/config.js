// VOID BLOOM tuning: every balance number lives here so the rest of the code
// reads as rules, not magic numbers. Times are seconds, distances are pixels,
// speeds are pixels per second.

/** Fixed simulation step: the world advances in 1/60 s ticks. */
export const STEP = 1 / 60;

/** A run lasts five minutes. Reach the end alive and the Bloom opens. */
export const RUN_DURATION = 300;

/** The Bloom Eater (boss) rises at the three-minute mark. */
export const BOSS_TIME = 180;

/** A new wave starts this often; each wave spawns faster and hits harder. */
export const WAVE_SECONDS = 20;

/** Player seed ship base stats, before any upgrade card is taken. */
export const PLAYER_BASE = {
  maxHp: 100,
  speed: 265,
  radius: 15,
  damage: 12,
  fireInterval: 0.24,
  boltSpeed: 640,
  magnetRadius: 90,
  projectiles: 1,
  pierce: 0,
  regenPerSecond: 0,
  shieldCooldown: 0,
};

/** Enemy archetypes. hp/speed scale with elapsed time in waves.js. */
export const ENEMY_TYPES = {
  mite: { hp: 18, speed: 92, radius: 13, damage: 10, score: 10, xp: 1, color: '#ff4d8d' },
  dart: { hp: 10, speed: 178, radius: 10, damage: 8, score: 15, xp: 1, color: '#ffb02e' },
  brute: { hp: 85, speed: 52, radius: 24, damage: 18, score: 30, xp: 3, color: '#b26bff' },
  boss: { hp: 1450, speed: 34, radius: 58, damage: 24, score: 500, xp: 30, color: '#ff3860' },
};

/** XP needed to go from `level` to `level + 1`. */
export function xpForLevel(level) {
  return 6 + (level - 1) * 5;
}

/** Score bonus for winning, plus one point per HP left at the Bloom. */
export const WIN_SCORE_BONUS = 1000;

/** Neon palette shared by renderer and UI so the game reads as one world. */
export const COLORS = {
  void: '#05070f',
  star: '#8ea2ff',
  player: '#5dffb0',
  playerCore: '#eafff3',
  bolt: '#7dffce',
  spore: '#ff5d7a',
  shard: '#39d5ff',
  hp: '#5dffb0',
  hpLow: '#ff5d5d',
  xp: '#39d5ff',
  text: '#e8ecff',
  dim: '#8b93b8',
  card: '#121830',
  cardEdge: '#39d5ff',
  gold: '#ffd94d',
};
