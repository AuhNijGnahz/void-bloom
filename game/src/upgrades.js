// Upgrade cards: the choices offered each level-up. Every card changes a real
// number on the ship — damage, fire rate, speed, magnet, hull, shield,
// multishot, piercing, regeneration — and several stack, so two runs build
// different ships. `apply` mutates the player; `describe` shows the exact gain.

export const UPGRADES = [
  {
    id: 'damage', name: 'Thorn Rounds', icon: '✦',
    describe: () => 'Bolt damage +30%',
    canOffer: () => true,
    apply: (player) => { player.stats.damage *= 1.3; },
  },
  {
    id: 'fireRate', name: 'Rapid Bloom', icon: '≋',
    describe: () => 'Fire rate +22%',
    canOffer: () => true,
    apply: (player) => { player.stats.fireInterval /= 1.22; },
  },
  {
    id: 'speed', name: 'Tailwind Roots', icon: '➤',
    describe: () => 'Move speed +13%',
    canOffer: () => true,
    apply: (player) => { player.stats.speed *= 1.13; },
  },
  {
    id: 'magnet', name: 'Gravity Pollen', icon: '◎',
    describe: () => 'Shard magnet range +45%',
    canOffer: () => true,
    apply: (player) => { player.stats.magnetRadius *= 1.45; },
  },
  {
    id: 'hull', name: 'Thick Bark', icon: '❤',
    describe: () => 'Max hull +25 and repair 30',
    canOffer: () => true,
    apply: (player) => {
      player.stats.maxHp += 25;
      player.hp = Math.min(player.stats.maxHp, player.hp + 30);
    },
  },
  {
    id: 'shield', name: 'Aegis Petal', icon: '⛨',
    describe: (player) => (player.stats.shieldCooldown === 0
      ? 'Gain a shield that blocks one hit, recharging in 9s'
      : 'Shield recharges 25% faster'),
    canOffer: () => true,
    apply: (player) => {
      player.stats.shieldCooldown = player.stats.shieldCooldown === 0 ? 9 : player.stats.shieldCooldown * 0.75;
      player.shieldReady = true;
      player.shieldTimer = 0;
    },
  },
  {
    id: 'multishot', name: 'Twin Sprout', icon: '⋔',
    describe: () => '+1 bolt per volley',
    canOffer: (player) => player.stats.projectiles < 4,
    apply: (player) => { player.stats.projectiles += 1; },
  },
  {
    id: 'pierce', name: 'Lance Seeds', icon: '↣',
    describe: () => 'Bolts pierce +1 extra mite',
    canOffer: (player) => player.stats.pierce < 3,
    apply: (player) => { player.stats.pierce += 1; },
  },
  {
    id: 'regen', name: 'Deep Roots', icon: '✿',
    describe: () => 'Regenerate +0.7 hull per second',
    canOffer: () => true,
    apply: (player) => { player.stats.regenPerSecond += 0.7; },
  },
];

/** Pick three distinct cards the ship can still use, at random. */
export function rollUpgradeChoices(player, rng) {
  const pool = UPGRADES.filter((upgrade) => upgrade.canOffer(player));
  const choices = [];
  while (choices.length < 3 && pool.length > 0) {
    const index = Math.floor(rng() * pool.length);
    choices.push(pool.splice(index, 1)[0]);
  }
  return choices;
}
