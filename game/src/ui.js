// User interface: the in-run HUD (hull, XP, timer, score, wave, boss bar) and
// the full-screen states — title, level-up cards, pause, victory and defeat.
// Buttons and cards report their rectangles through the layout helpers at the
// bottom, so main can route clicks without duplicating geometry.

import { BOSS_TIME, COLORS, RUN_DURATION, xpForLevel } from './config.js';
import { waveNumberAt } from './waves.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_LEVELUP = 'levelup';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_WIN = 'win';
export const SCREEN_LOSE = 'lose';

function formatClock(seconds) {
  const clamped = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(clamped / 60)}:${String(clamped % 60).padStart(2, '0')}`;
}

function bar(ctx, x, y, width, height, fraction, color) {
  ctx.fillStyle = 'rgba(255,255,255,0.14)';
  ctx.fillRect(x, y, width, height);
  ctx.fillStyle = color;
  ctx.fillRect(x, y, width * Math.min(1, Math.max(0, fraction)), height);
}

/** The always-on HUD drawn over the field while a run is live. */
export function drawHud(ctx, state) {
  const { field, player } = state;
  ctx.save();
  ctx.font = '600 14px system-ui, sans-serif';
  ctx.textBaseline = 'middle';
  // Hull, top left.
  ctx.fillStyle = COLORS.text;
  ctx.textAlign = 'left';
  ctx.fillText('HULL', 18, 24);
  const hpFraction = player.hp / player.stats.maxHp;
  bar(ctx, 62, 17, 190, 13, hpFraction, hpFraction < 0.3 ? COLORS.hpLow : COLORS.hp);
  ctx.fillText(`${Math.ceil(player.hp)} / ${player.stats.maxHp}`, 262, 24);
  // Timer, top centre, with the boss warning folded in.
  ctx.textAlign = 'center';
  ctx.font = '700 26px system-ui, sans-serif';
  ctx.fillStyle = COLORS.text;
  ctx.fillText(formatClock(RUN_DURATION - state.elapsed), field.width / 2, 26);
  ctx.font = '600 12px system-ui, sans-serif';
  ctx.fillStyle = COLORS.dim;
  const phase = state.boss && state.boss.alive
    ? 'THE BLOOM EATER STIRS'
    : state.elapsed < BOSS_TIME
      ? `BOSS AT ${formatClock(BOSS_TIME)}`
      : 'SURVIVE TO THE BLOOM';
  ctx.fillText(phase, field.width / 2, 48);
  // Score and wave, top right.
  ctx.textAlign = 'right';
  ctx.font = '700 20px system-ui, sans-serif';
  ctx.fillStyle = COLORS.gold;
  ctx.fillText(`${state.score}`, field.width - 18, 22);
  ctx.font = '600 13px system-ui, sans-serif';
  ctx.fillStyle = COLORS.text;
  ctx.fillText(`WAVE ${waveNumberAt(state.elapsed)}`, field.width - 18, 45);
  // XP bar along the very top, with the level badge.
  bar(ctx, 0, 0, field.width, 6, state.xp / xpForLevel(state.level), COLORS.xp);
  ctx.textAlign = 'left';
  ctx.font = '700 13px system-ui, sans-serif';
  ctx.fillStyle = COLORS.xp;
  ctx.fillText(`LV ${state.level}`, 18, 46);
  ctx.restore();
  // Boss hull bar, bottom centre, while the Eater lives.
  if (state.boss && state.boss.alive) {
    const width = Math.min(560, field.width - 160);
    const x = (field.width - width) / 2;
    const y = field.height - 34;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = '700 13px system-ui, sans-serif';
    ctx.fillStyle = '#ff8fab';
    ctx.fillText('☠ THE BLOOM EATER', field.width / 2, y - 6);
    bar(ctx, x, y + 4, width, 10, state.boss.hp / state.boss.maxHp, '#ff3860');
    ctx.restore();
  }
  // Low-hull vignette pulse.
  if (state.screen === SCREEN_PLAY && player.hp / player.stats.maxHp < 0.3) {
    ctx.save();
    ctx.strokeStyle = `rgba(255,60,60,${0.35 + 0.25 * Math.sin(state.time * 6)})`;
    ctx.lineWidth = 10;
    ctx.strokeRect(0, 0, field.width, field.height);
    ctx.restore();
  }
}

function dimField(ctx, field, alpha = 0.62) {
  ctx.fillStyle = `rgba(3,5,12,${alpha})`;
  ctx.fillRect(0, 0, field.width, field.height);
}

function centredText(ctx, field, text, y, font, color) {
  ctx.save();
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, field.width / 2, y);
  ctx.restore();
}

/** Rectangle of the one big button on menu screens (start / restart). */
export function menuButtonRect(field) {
  return { x: field.width / 2 - 130, y: field.height / 2 + 108, width: 260, height: 54 };
}

function drawMenuButton(ctx, field, label) {
  const rect = menuButtonRect(field);
  ctx.save();
  ctx.fillStyle = '#173d2a';
  ctx.strokeStyle = COLORS.player;
  ctx.lineWidth = 2;
  ctx.shadowColor = COLORS.player;
  ctx.shadowBlur = 14;
  ctx.beginPath();
  ctx.roundRect(rect.x, rect.y, rect.width, rect.height, 12);
  ctx.fill();
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.font = '700 20px system-ui, sans-serif';
  ctx.fillStyle = '#eafff3';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, field.width / 2, rect.y + rect.height / 2 + 1);
  ctx.restore();
}

export function drawTitleScreen(ctx, state) {
  const { field } = state;
  dimField(ctx, field, 0.45);
  centredText(ctx, field, 'VOID BLOOM', field.height / 2 - 150, '800 64px system-ui, sans-serif', '#eafff3');
  centredText(ctx, field, 'a seed ship · a hungry garden · five minutes', field.height / 2 - 104, '500 17px system-ui, sans-serif', COLORS.xp);
  centredText(ctx, field, 'Void mites swarm the last seed ship. Survive until 5:00 and the Bloom opens.', field.height / 2 - 52, '400 16px system-ui, sans-serif', COLORS.text);
  centredText(ctx, field, 'At 3:00 the Bloom Eater rises. Burst mites, gather their light, grow stronger.', field.height / 2 - 26, '400 16px system-ui, sans-serif', COLORS.text);
  centredText(ctx, field, 'MOVE  WASD / Arrow keys        AIM  Mouse (auto-fire)        PAUSE  P / Esc', field.height / 2 + 22, '600 15px system-ui, sans-serif', COLORS.gold);
  centredText(ctx, field, 'Collect light shards to level up — pick 1 of 3 upgrade cards each level.', field.height / 2 + 52, '400 14px system-ui, sans-serif', COLORS.dim);
  drawMenuButton(ctx, field, '▶  PLANT THE SEED');
  centredText(ctx, field, 'or press Enter', field.height / 2 + 184, '400 13px system-ui, sans-serif', COLORS.dim);
}

/** Rectangles of the three upgrade cards, centred in a row. */
export function upgradeCardRects(field) {
  const width = 230;
  const height = 190;
  const gap = 26;
  const total = width * 3 + gap * 2;
  const startX = (field.width - total) / 2;
  const y = field.height / 2 - height / 2 + 26;
  return [0, 1, 2].map((i) => ({ x: startX + i * (width + gap), y, width, height }));
}

export function drawLevelUpScreen(ctx, state) {
  const { field } = state;
  dimField(ctx, field, 0.66);
  centredText(ctx, field, `LEVEL ${state.level} — THE SEED GROWS`, field.height / 2 - 168, '800 30px system-ui, sans-serif', '#eafff3');
  centredText(ctx, field, 'Choose one upgrade (click, or press 1 · 2 · 3)', field.height / 2 - 132, '400 15px system-ui, sans-serif', COLORS.dim);
  const rects = upgradeCardRects(field);
  state.choices.forEach((upgrade, i) => {
    const rect = rects[i];
    ctx.save();
    ctx.fillStyle = COLORS.card;
    ctx.strokeStyle = COLORS.cardEdge;
    ctx.lineWidth = 2;
    ctx.shadowColor = COLORS.cardEdge;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.roundRect(rect.x, rect.y, rect.width, rect.height, 14);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '34px system-ui, sans-serif';
    ctx.fillStyle = COLORS.gold;
    ctx.fillText(upgrade.icon, rect.x + rect.width / 2, rect.y + 42);
    ctx.font = '700 19px system-ui, sans-serif';
    ctx.fillStyle = COLORS.text;
    ctx.fillText(upgrade.name, rect.x + rect.width / 2, rect.y + 86);
    ctx.font = '400 14px system-ui, sans-serif';
    ctx.fillStyle = COLORS.xp;
    wrapText(ctx, upgrade.describe(state.player), rect.x + rect.width / 2, rect.y + 118, rect.width - 32, 19);
    ctx.font = '600 12px system-ui, sans-serif';
    ctx.fillStyle = COLORS.dim;
    ctx.fillText(`[ ${i + 1} ]`, rect.x + rect.width / 2, rect.y + rect.height - 18);
    ctx.restore();
  });
}

function wrapText(ctx, text, centreX, startY, maxWidth, lineHeight) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    const trial = line ? `${line} ${word}` : word;
    if (ctx.measureText(trial).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = trial;
    }
  }
  if (line) lines.push(line);
  lines.forEach((entry, i) => ctx.fillText(entry, centreX, startY + i * lineHeight));
}

export function drawPausedScreen(ctx, state) {
  dimField(ctx, state.field, 0.55);
  centredText(ctx, state.field, 'PAUSED', state.field.height / 2 - 20, '800 40px system-ui, sans-serif', COLORS.text);
  centredText(ctx, state.field, 'Press P, Esc or Enter to keep growing', state.field.height / 2 + 26, '400 15px system-ui, sans-serif', COLORS.dim);
}

function drawStatsLine(ctx, state, y) {
  const minutes = Math.floor(state.elapsed / 60);
  const seconds = Math.floor(state.elapsed % 60);
  const survived = `${minutes}:${String(seconds).padStart(2, '0')}`;
  centredText(ctx, state.field, `Score ${state.score}   ·   Kills ${state.kills}   ·   Level ${state.level}   ·   Survived ${survived}   ·   Wave ${waveNumberAt(state.elapsed)}`, y, '600 17px system-ui, sans-serif', COLORS.text);
}

/** Rectangle of the victory screen's button, lower than the menu screens'. */
export function winButtonRect(field) {
  return { x: field.width / 2 - 130, y: field.height * 0.72, width: 260, height: 54 };
}

function drawButtonAt(ctx, field, rect, label) {
  ctx.save();
  ctx.fillStyle = '#173d2a';
  ctx.strokeStyle = COLORS.player;
  ctx.lineWidth = 2;
  ctx.shadowColor = COLORS.player;
  ctx.shadowBlur = 14;
  ctx.beginPath();
  ctx.roundRect(rect.x, rect.y, rect.width, rect.height, 12);
  ctx.fill();
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.font = '700 20px system-ui, sans-serif';
  ctx.fillStyle = '#eafff3';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, field.width / 2, rect.y + rect.height / 2 + 1);
  ctx.restore();
}

export function drawWinScreen(ctx, state) {
  const { field } = state;
  centredText(ctx, field, 'THE BLOOM OPENS', field.height * 0.15, '800 44px system-ui, sans-serif', '#fff3b0');
  centredText(ctx, field, 'Five minutes survived — the void garden flowers again.', field.height * 0.15 + 40, '400 16px system-ui, sans-serif', COLORS.text);
  drawStatsLine(ctx, state, field.height * 0.635);
  if (state.score >= state.best) {
    centredText(ctx, field, '★ NEW BEST SCORE ★', field.height * 0.635 + 30, '700 15px system-ui, sans-serif', COLORS.gold);
  }
  drawButtonAt(ctx, field, winButtonRect(field), '↻  BLOOM AGAIN');
  centredText(ctx, field, 'or press Enter', field.height * 0.72 + 72, '400 13px system-ui, sans-serif', COLORS.dim);
}

export function drawLoseScreen(ctx, state) {
  const { field } = state;
  dimField(ctx, field, 0.6);
  centredText(ctx, field, 'THE SEED FALLS', field.height / 2 - 120, '800 44px system-ui, sans-serif', '#ff8fab');
  centredText(ctx, field, 'The mites scatter your light across the void.', field.height / 2 - 78, '400 16px system-ui, sans-serif', COLORS.text);
  drawStatsLine(ctx, state, field.height / 2 - 24);
  centredText(ctx, field, `Best score ${state.best}`, field.height / 2 + 8, '400 14px system-ui, sans-serif', COLORS.dim);
  drawMenuButton(ctx, field, '↻  TRY AGAIN');
  centredText(ctx, field, 'or press Enter', field.height / 2 + 184, '400 13px system-ui, sans-serif', COLORS.dim);
}

/** Is a world point inside a rectangle? Shared by every click route. */
export function pointInRect(point, rect) {
  return point.x >= rect.x && point.x <= rect.x + rect.width && point.y >= rect.y && point.y <= rect.y + rect.height;
}
