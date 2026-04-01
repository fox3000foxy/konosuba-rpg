import { Player } from '../classes/Player';
import { ItemId } from '../objects/enums/ItemId';
import { TypeItem } from '../objects/enums/TypeItem';
import { getItemById } from './consumableService';

export type ConsumableEffectResult = {
  applied: boolean;
  message: {
    fr: string;
    en: string;
  };
  targetName: string;
  healedAmount?: number;
  maxHpIncrease?: number;
  defenseIncrease?: number;
  attackIncrease?: number;
};

/**
 * Applies a consumable effect to a player
 * Consumables only affect players, never creatures
 * Returns effect result with messages and changes made
 */
export function applyConsumableEffect(
  itemId: ItemId,
  player: Player
): ConsumableEffectResult {
  const item = getItemById(itemId);
  const playerName = player.name[0]; // English name

  if (!item) {
    return {
      applied: false,
      message: {
        fr: 'Objet non trouvé',
        en: 'Item not found',
      },
      targetName: playerName,
    };
  }

  // Potions: Healing effect
  if (item.type === TypeItem.Potion) {
    return applyPotionEffect(player, item.rarity);
  }

  // Chrono: Increase max HP
  if (item.type === TypeItem.Chrono) {
    return applyChronoEffect(player, item.rarity);
  }

  // Stones: Increase defense
  if (item.type === TypeItem.Stone) {
    return applyStoneEffect(player, item.rarity);
  }

  // Scrolls: Increase attack
  if (item.type === TypeItem.Scroll) {
    return applyScrollEffect(player, item.rarity);
  }

  // Unknown type: not implemented
  return {
    applied: false,
    message: {
      fr: `${item.nameFr} n'est pas encore utilisable en combat.`,
      en: `${item.nameEn} is not yet usable in combat.`,
    },
    targetName: playerName,
  };
}

/**
 * Applies potion healing based on rarity
 * Basic = 25%, Gold = 50%, Epic = 75% of max HP
 */
function applyPotionEffect(
  player: Player,
  rarity: string
): ConsumableEffectResult {
  const maxHp = player.hpMax;
  let healPercentage = 0.25; // default basic

  if (rarity === 'gold') {
    healPercentage = 0.5;
  } else if (rarity === 'epic') {
    healPercentage = 0.75;
  }

  const healAmount = Math.ceil(maxHp * healPercentage);
  const previousHp = player.hp;
  player.hp = Math.min(maxHp, previousHp + healAmount);

  const actualHealed = player.hp - previousHp;
  const playerNameEn = player.name[0]; // English name
  const playerNameFr = player.name[1]; // French name

  return {
    applied: true,
    message: {
      fr: `${playerNameFr} a regagné ${actualHealed} HP`,
      en: `${playerNameEn} healed for ${actualHealed} HP`,
    },
    targetName: playerNameEn,
    healedAmount: actualHealed,
  };
}

/**
 * Applies chrono effect to increase max HP based on rarity
 * Basic = +10%, Gold = +20%, Epic = +30% of current max HP
 * Also restores HP proportionally
 */
function applyChronoEffect(
  player: Player,
  rarity: string
): ConsumableEffectResult {
  let increasePercentage = 0.1; // default basic

  if (rarity === 'gold') {
    increasePercentage = 0.2;
  } else if (rarity === 'epic') {
    increasePercentage = 0.3;
  }

  const oldMaxHp = player.hpMax;
  const hpIncrease = Math.ceil(oldMaxHp * increasePercentage);
  const newMaxHp = oldMaxHp + hpIncrease;

  // Restore HP proportionally to maintain health percentage
  const healthRatio = player.hp / oldMaxHp;
  player.hpMax = newMaxHp;
  player.hp = Math.ceil(newMaxHp * healthRatio);

  const playerNameEn = player.name[0];
  const playerNameFr = player.name[1];

  return {
    applied: true,
    message: {
      fr: `${playerNameFr} a gagné ${hpIncrease} PV max`,
      en: `${playerNameEn} gained ${hpIncrease} max HP`,
    },
    targetName: playerNameEn,
    maxHpIncrease: hpIncrease,
  };
}

/**
 * Applies stone effect to increase defense based on rarity
 * Basic = +1, Gold = +2, Epic = +3
 */
function applyStoneEffect(
  player: Player,
  rarity: string
): ConsumableEffectResult {
  let defenseIncrease = 1; // default basic

  if (rarity === 'gold') {
    defenseIncrease = 2;
  } else if (rarity === 'epic') {
    defenseIncrease = 3;
  }

  player.defense += defenseIncrease;

  const playerNameEn = player.name[0];
  const playerNameFr = player.name[1];

  return {
    applied: true,
    message: {
      fr: `${playerNameFr} a gagné ${defenseIncrease} défense`,
      en: `${playerNameEn} gained ${defenseIncrease} defense`,
    },
    targetName: playerNameEn,
    defenseIncrease,
  };
}

/**
 * Applies scroll effect to increase attack based on rarity
 * Basic = +1 on both min/max, Gold = +2, Epic = +3
 */
function applyScrollEffect(
  player: Player,
  rarity: string
): ConsumableEffectResult {
  let attackIncrease = 1; // default basic

  if (rarity === 'gold') {
    attackIncrease = 2;
  } else if (rarity === 'epic') {
    attackIncrease = 3;
  }

  const oldAttackMin = player.attack[0];
  const oldAttackMax = player.attack[1];

  player.attack[0] = Math.max(0, oldAttackMin + attackIncrease);
  player.attack[1] = Math.max(player.attack[0], oldAttackMax + attackIncrease);

  const playerNameEn = player.name[0];
  const playerNameFr = player.name[1];

  return {
    applied: true,
    message: {
      fr: `${playerNameFr} a gagné ${attackIncrease} attaque`,
      en: `${playerNameEn} gained ${attackIncrease} attack`,
    },
    targetName: playerNameEn,
    attackIncrease,
  };
}
