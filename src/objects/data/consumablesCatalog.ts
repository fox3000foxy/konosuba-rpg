import { ItemId } from '../enums/ItemId';
import { Rarity } from '../enums/Rarity';
import { TypeItem } from '../enums/TypeItem';

export type ConsumableDefinition = {
  id: ItemId;
  fileName: string;
  rarity: Rarity;
  type: TypeItem;
};

export type ConsumableCombinationRule = {
  sourceA: ItemId;
  sourceB: ItemId;
  result: ItemId;
};

const ELEMENTAL_POTION_BASIC: ConsumableDefinition[] = [
  { id: ItemId.I20001000, fileName: '20001000.webp', rarity: Rarity.Basic, type: TypeItem.Potion },
  { id: ItemId.I20001001, fileName: '20001001.webp', rarity: Rarity.Basic, type: TypeItem.Potion },
  { id: ItemId.I20001002, fileName: '20001002.webp', rarity: Rarity.Basic, type: TypeItem.Potion },
  { id: ItemId.I20001003, fileName: '20001003.webp', rarity: Rarity.Basic, type: TypeItem.Potion },
  { id: ItemId.I20001004, fileName: '20001004.webp', rarity: Rarity.Basic, type: TypeItem.Potion },
  { id: ItemId.I20001005, fileName: '20001005.webp', rarity: Rarity.Basic, type: TypeItem.Potion },
  { id: ItemId.I20001006, fileName: '20001006.webp', rarity: Rarity.Basic, type: TypeItem.Potion },
  { id: ItemId.I20001007, fileName: '20001007.webp', rarity: Rarity.Basic, type: TypeItem.Potion },
];

const ELEMENTAL_POTION_GOLD: ConsumableDefinition[] = [
  { id: ItemId.I20002000, fileName: '20002000.webp', rarity: Rarity.Gold, type: TypeItem.Potion },
  { id: ItemId.I20002001, fileName: '20002001.webp', rarity: Rarity.Gold, type: TypeItem.Potion },
  { id: ItemId.I20002002, fileName: '20002002.webp', rarity: Rarity.Gold, type: TypeItem.Potion },
  { id: ItemId.I20002003, fileName: '20002003.webp', rarity: Rarity.Gold, type: TypeItem.Potion },
  { id: ItemId.I20002004, fileName: '20002004.webp', rarity: Rarity.Gold, type: TypeItem.Potion },
  { id: ItemId.I20002005, fileName: '20002005.webp', rarity: Rarity.Gold, type: TypeItem.Potion },
  { id: ItemId.I20002006, fileName: '20002006.webp', rarity: Rarity.Gold, type: TypeItem.Potion },
  { id: ItemId.I20002007, fileName: '20002007.webp', rarity: Rarity.Gold, type: TypeItem.Potion },
];

const CHRONO_AND_SPECIAL_GOLD: ConsumableDefinition[] = [
  { id: ItemId.I20003000, fileName: '20003000.webp', rarity: Rarity.Gold, type: TypeItem.Chrono },
  { id: ItemId.I20003001, fileName: '20003001.webp', rarity: Rarity.Gold, type: TypeItem.Chrono },
  { id: ItemId.I20003002, fileName: '20003002.webp', rarity: Rarity.Gold, type: TypeItem.Chrono },
  { id: ItemId.I20003003, fileName: '20003003.webp', rarity: Rarity.Gold, type: TypeItem.Chrono },
  { id: ItemId.I20003004, fileName: '20003004.webp', rarity: Rarity.Gold, type: TypeItem.Chrono },
  { id: ItemId.I20003005, fileName: '20003005.webp', rarity: Rarity.Gold, type: TypeItem.Potion },
  { id: ItemId.I20003006, fileName: '20003006.webp', rarity: Rarity.Gold, type: TypeItem.Chrono },
  { id: ItemId.I20003007, fileName: '20003007.webp', rarity: Rarity.Gold, type: TypeItem.Chrono },
];

const STONES_AND_SCROLLS_EPIC: ConsumableDefinition[] = [
  { id: ItemId.I20004001, fileName: '20004001.webp', rarity: Rarity.Epic, type: TypeItem.Stone },
  { id: ItemId.I20004002, fileName: '20004002.webp', rarity: Rarity.Epic, type: TypeItem.Stone },
  { id: ItemId.I20004003, fileName: '20004003.webp', rarity: Rarity.Epic, type: TypeItem.Stone },
  { id: ItemId.I20004004, fileName: '20004004.webp', rarity: Rarity.Epic, type: TypeItem.Stone },
  { id: ItemId.I20004005, fileName: '20004005.webp', rarity: Rarity.Epic, type: TypeItem.Stone },
  { id: ItemId.I20004006, fileName: '20004006.webp', rarity: Rarity.Epic, type: TypeItem.Stone },
  { id: ItemId.I20004007, fileName: '20004007.webp', rarity: Rarity.Epic, type: TypeItem.Stone },
  { id: ItemId.I20004008, fileName: '20004008.webp', rarity: Rarity.Epic, type: TypeItem.Scroll },
  { id: ItemId.I20004009, fileName: '20004009.webp', rarity: Rarity.Epic, type: TypeItem.Scroll },
  { id: ItemId.I20004010, fileName: '20004010.webp', rarity: Rarity.Epic, type: TypeItem.Scroll },
  { id: ItemId.I20004011, fileName: '20004011.webp', rarity: Rarity.Epic, type: TypeItem.Scroll },
  { id: ItemId.I20004012, fileName: '20004012.webp', rarity: Rarity.Epic, type: TypeItem.Scroll },
  { id: ItemId.I20004013, fileName: '20004013.webp', rarity: Rarity.Epic, type: TypeItem.Scroll },
  { id: ItemId.I20004014, fileName: '20004014.webp', rarity: Rarity.Epic, type: TypeItem.Scroll },
];

export const CONSUMABLE_DEFINITIONS: ConsumableDefinition[] = [
  ...ELEMENTAL_POTION_BASIC,
  ...ELEMENTAL_POTION_GOLD,
  ...CHRONO_AND_SPECIAL_GOLD,
  ...STONES_AND_SCROLLS_EPIC,
];

export const CONSUMABLE_COMBINATION_RULES: ConsumableCombinationRule[] = [
  // basic potion -> gold potion
  { sourceA: ItemId.I20001000, sourceB: ItemId.I20001000, result: ItemId.I20002000 },
  { sourceA: ItemId.I20001001, sourceB: ItemId.I20001001, result: ItemId.I20002001 },
  { sourceA: ItemId.I20001002, sourceB: ItemId.I20001002, result: ItemId.I20002002 },
  { sourceA: ItemId.I20001003, sourceB: ItemId.I20001003, result: ItemId.I20002003 },
  { sourceA: ItemId.I20001004, sourceB: ItemId.I20001004, result: ItemId.I20002004 },
  { sourceA: ItemId.I20001005, sourceB: ItemId.I20001005, result: ItemId.I20002005 },
  { sourceA: ItemId.I20001006, sourceB: ItemId.I20001006, result: ItemId.I20002006 },
  { sourceA: ItemId.I20001007, sourceB: ItemId.I20001007, result: ItemId.I20002007 },

  // gold potion -> epic stone
  { sourceA: ItemId.I20002000, sourceB: ItemId.I20002000, result: ItemId.I20004001 },
  { sourceA: ItemId.I20002001, sourceB: ItemId.I20002001, result: ItemId.I20004002 },
  { sourceA: ItemId.I20002002, sourceB: ItemId.I20002002, result: ItemId.I20004003 },
  { sourceA: ItemId.I20002003, sourceB: ItemId.I20002003, result: ItemId.I20004004 },
  { sourceA: ItemId.I20002004, sourceB: ItemId.I20002004, result: ItemId.I20004005 },
  { sourceA: ItemId.I20002005, sourceB: ItemId.I20002005, result: ItemId.I20004006 },
  { sourceA: ItemId.I20002006, sourceB: ItemId.I20002006, result: ItemId.I20004007 },

  // epic stone -> epic scroll
  { sourceA: ItemId.I20004001, sourceB: ItemId.I20004001, result: ItemId.I20004008 },
  { sourceA: ItemId.I20004002, sourceB: ItemId.I20004002, result: ItemId.I20004009 },
  { sourceA: ItemId.I20004003, sourceB: ItemId.I20004003, result: ItemId.I20004010 },
  { sourceA: ItemId.I20004004, sourceB: ItemId.I20004004, result: ItemId.I20004011 },
  { sourceA: ItemId.I20004005, sourceB: ItemId.I20004005, result: ItemId.I20004012 },
  { sourceA: ItemId.I20004006, sourceB: ItemId.I20004006, result: ItemId.I20004013 },
  { sourceA: ItemId.I20004007, sourceB: ItemId.I20004007, result: ItemId.I20004014 },
];

const pairKey = (left: ItemId, right: ItemId): string =>
  left < right ? `${left}+${right}` : `${right}+${left}`;

export const CONSUMABLE_COMBINATION_MAP: Record<string, ItemId> =
  CONSUMABLE_COMBINATION_RULES.reduce<Record<string, ItemId>>((acc, rule) => {
    acc[pairKey(rule.sourceA, rule.sourceB)] = rule.result;
    return acc;
  }, {});

export function getConsumableCombinationResult(
  sourceA: ItemId,
  sourceB: ItemId
): ItemId | null {
  return CONSUMABLE_COMBINATION_MAP[pairKey(sourceA, sourceB)] || null;
}
