import { Creature } from '../classes/Creature';
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
};

/**
 * Applies a consumable effect to a target creature
 * Returns effect result with messages and changes made
 */
export function applyConsumableEffect(
  itemId: ItemId,
  targetCreature: Creature
): ConsumableEffectResult {
  const item = getItemById(itemId);
  const targetName = targetCreature.name[0]; // English name

  if (!item) {
    return {
      applied: false,
      message: {
        fr: 'Objet non trouvé',
        en: 'Item not found',
      },
      targetName,
    };
  }

  // Potions: Healing effect
  if (item.type === TypeItem.Potion) {
    return applyPotionEffect(targetCreature, item.rarity);
  }

  // Other types: not yet implemented
  return {
    applied: false,
    message: {
      fr: `${item.nameFr} n'est pas encore utilisable en combat.`,
      en: `${item.nameEn} is not yet usable in combat.`,
    },
    targetName,
  };
}

/**
 * Applies potion healing based on rarity
 * Basic = 25%, Gold = 50%, Epic = 75% of max HP
 */
function applyPotionEffect(
  targetCreature: Creature,
  rarity: string
): ConsumableEffectResult {
  const maxHp = targetCreature.hpMax;
  let healPercentage = 0.25; // default basic

  if (rarity === 'gold') {
    healPercentage = 0.5;
  } else if (rarity === 'epic') {
    healPercentage = 0.75;
  }

  const healAmount = Math.ceil(maxHp * healPercentage);
  const previousHp = targetCreature.hp;
  targetCreature.hp = Math.min(maxHp, previousHp + healAmount);

  const actualHealed = targetCreature.hp - previousHp;
  const targetNameEn = targetCreature.name[0]; // English name
  const targetNameFr = targetCreature.name[1]; // French name

  return {
    applied: true,
    message: {
      fr: `${targetNameFr} a regagné ${actualHealed} HP`,
      en: `${targetNameEn} healed for ${actualHealed} HP`,
    },
    targetName: targetNameEn,
    healedAmount: actualHealed,
  };
}
