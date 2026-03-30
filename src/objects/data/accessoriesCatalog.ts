import { AccessoryId } from '../enums/AccessoryId';
import { AccessoryType } from '../enums/AccessoryType';
import { Rarity } from '../enums/Rarity';

export type AccessoryDefinition = {
  id: AccessoryId;
  fileName: string;
  rarity: Rarity;
  type: AccessoryType;
  nameFr: string;
  nameEn: string;
};

type AccessoryDefinitionSeed = Omit<AccessoryDefinition, 'nameFr' | 'nameEn'>;

export type AccessoryCombinationRule = {
  sourceA: AccessoryId;
  sourceB: AccessoryId;
  result: AccessoryId;
};

const RINGS: AccessoryDefinitionSeed[] = [
  { id: AccessoryId.I21110, fileName: '21110.webp', rarity: Rarity.Basic, type: AccessoryType.Ring },
  { id: AccessoryId.I21120, fileName: '21120.webp', rarity: Rarity.Basic, type: AccessoryType.Ring },
  { id: AccessoryId.I21210, fileName: '21210.webp', rarity: Rarity.Gold, type: AccessoryType.Ring },
  { id: AccessoryId.I21220, fileName: '21220.webp', rarity: Rarity.Gold, type: AccessoryType.Ring },
  { id: AccessoryId.I21310, fileName: '21310.webp', rarity: Rarity.Epic, type: AccessoryType.Ring },
  { id: AccessoryId.I21320, fileName: '21320.webp', rarity: Rarity.Epic, type: AccessoryType.Ring },
];

const EARRINGS_BASIC: AccessoryDefinitionSeed[] = [
  { id: AccessoryId.I22201, fileName: '22201.webp', rarity: Rarity.Basic, type: AccessoryType.Earring },
  { id: AccessoryId.I22202, fileName: '22202.webp', rarity: Rarity.Basic, type: AccessoryType.Earring },
  { id: AccessoryId.I22203, fileName: '22203.webp', rarity: Rarity.Basic, type: AccessoryType.Earring },
  { id: AccessoryId.I22204, fileName: '22204.webp', rarity: Rarity.Basic, type: AccessoryType.Earring },
  { id: AccessoryId.I22205, fileName: '22205.webp', rarity: Rarity.Basic, type: AccessoryType.Earring },
  { id: AccessoryId.I22206, fileName: '22206.webp', rarity: Rarity.Basic, type: AccessoryType.Earring },
  { id: AccessoryId.I22207, fileName: '22207.webp', rarity: Rarity.Basic, type: AccessoryType.Earring },
];

const EARRINGS_GOLD: AccessoryDefinitionSeed[] = [
  { id: AccessoryId.I22311, fileName: '22311.webp', rarity: Rarity.Gold, type: AccessoryType.Earring },
  { id: AccessoryId.I22312, fileName: '22312.webp', rarity: Rarity.Gold, type: AccessoryType.Earring },
  { id: AccessoryId.I22313, fileName: '22313.webp', rarity: Rarity.Gold, type: AccessoryType.Earring },
  { id: AccessoryId.I22314, fileName: '22314.webp', rarity: Rarity.Gold, type: AccessoryType.Earring },
  { id: AccessoryId.I22315, fileName: '22315.webp', rarity: Rarity.Gold, type: AccessoryType.Earring },
  { id: AccessoryId.I22316, fileName: '22316.webp', rarity: Rarity.Gold, type: AccessoryType.Earring },
  { id: AccessoryId.I22317, fileName: '22317.webp', rarity: Rarity.Gold, type: AccessoryType.Earring },
  { id: AccessoryId.I22321, fileName: '22321.webp', rarity: Rarity.Gold, type: AccessoryType.Earring },
  { id: AccessoryId.I22322, fileName: '22322.webp', rarity: Rarity.Gold, type: AccessoryType.Earring },
  { id: AccessoryId.I22323, fileName: '22323.webp', rarity: Rarity.Gold, type: AccessoryType.Earring },
  { id: AccessoryId.I22324, fileName: '22324.webp', rarity: Rarity.Gold, type: AccessoryType.Earring },
  { id: AccessoryId.I22325, fileName: '22325.webp', rarity: Rarity.Gold, type: AccessoryType.Earring },
  { id: AccessoryId.I22326, fileName: '22326.webp', rarity: Rarity.Gold, type: AccessoryType.Earring },
  { id: AccessoryId.I22327, fileName: '22327.webp', rarity: Rarity.Gold, type: AccessoryType.Earring },
];

const EARRINGS_EPIC: AccessoryDefinitionSeed[] = [
  { id: AccessoryId.I22411, fileName: '22411.webp', rarity: Rarity.Epic, type: AccessoryType.Earring },
  { id: AccessoryId.I22412, fileName: '22412.webp', rarity: Rarity.Epic, type: AccessoryType.Earring },
  { id: AccessoryId.I22413, fileName: '22413.webp', rarity: Rarity.Epic, type: AccessoryType.Earring },
  { id: AccessoryId.I22414, fileName: '22414.webp', rarity: Rarity.Epic, type: AccessoryType.Earring },
  { id: AccessoryId.I22415, fileName: '22415.webp', rarity: Rarity.Epic, type: AccessoryType.Earring },
  { id: AccessoryId.I22416, fileName: '22416.webp', rarity: Rarity.Epic, type: AccessoryType.Earring },
  { id: AccessoryId.I22417, fileName: '22417.webp', rarity: Rarity.Epic, type: AccessoryType.Earring },
  { id: AccessoryId.I22421, fileName: '22421.webp', rarity: Rarity.Epic, type: AccessoryType.Earring },
  { id: AccessoryId.I22422, fileName: '22422.webp', rarity: Rarity.Epic, type: AccessoryType.Earring },
  { id: AccessoryId.I22423, fileName: '22423.webp', rarity: Rarity.Epic, type: AccessoryType.Earring },
  { id: AccessoryId.I22424, fileName: '22424.webp', rarity: Rarity.Epic, type: AccessoryType.Earring },
  { id: AccessoryId.I22425, fileName: '22425.webp', rarity: Rarity.Epic, type: AccessoryType.Earring },
  { id: AccessoryId.I22426, fileName: '22426.webp', rarity: Rarity.Epic, type: AccessoryType.Earring },
  { id: AccessoryId.I22427, fileName: '22427.webp', rarity: Rarity.Epic, type: AccessoryType.Earring },
];

const NECKLACES: AccessoryDefinitionSeed[] = [
  { id: AccessoryId.I23201, fileName: '23201.webp', rarity: Rarity.Basic, type: AccessoryType.Necklace },
  { id: AccessoryId.I23202, fileName: '23202.webp', rarity: Rarity.Basic, type: AccessoryType.Necklace },
  { id: AccessoryId.I23203, fileName: '23203.webp', rarity: Rarity.Basic, type: AccessoryType.Necklace },
  { id: AccessoryId.I23204, fileName: '23204.webp', rarity: Rarity.Basic, type: AccessoryType.Necklace },
  { id: AccessoryId.I23311, fileName: '23311.webp', rarity: Rarity.Gold, type: AccessoryType.Necklace },
  { id: AccessoryId.I23312, fileName: '23312.webp', rarity: Rarity.Gold, type: AccessoryType.Necklace },
  { id: AccessoryId.I23313, fileName: '23313.webp', rarity: Rarity.Gold, type: AccessoryType.Necklace },
  { id: AccessoryId.I23314, fileName: '23314.webp', rarity: Rarity.Gold, type: AccessoryType.Necklace },
  { id: AccessoryId.I23321, fileName: '23321.webp', rarity: Rarity.Gold, type: AccessoryType.Necklace },
  { id: AccessoryId.I23322, fileName: '23322.webp', rarity: Rarity.Gold, type: AccessoryType.Necklace },
  { id: AccessoryId.I23323, fileName: '23323.webp', rarity: Rarity.Gold, type: AccessoryType.Necklace },
  { id: AccessoryId.I23324, fileName: '23324.webp', rarity: Rarity.Gold, type: AccessoryType.Necklace },
  { id: AccessoryId.I23411, fileName: '23411.webp', rarity: Rarity.Epic, type: AccessoryType.Necklace },
  { id: AccessoryId.I23412, fileName: '23412.webp', rarity: Rarity.Epic, type: AccessoryType.Necklace },
  { id: AccessoryId.I23413, fileName: '23413.webp', rarity: Rarity.Epic, type: AccessoryType.Necklace },
  { id: AccessoryId.I23414, fileName: '23414.webp', rarity: Rarity.Epic, type: AccessoryType.Necklace },
  { id: AccessoryId.I23421, fileName: '23421.webp', rarity: Rarity.Epic, type: AccessoryType.Necklace },
  { id: AccessoryId.I23422, fileName: '23422.webp', rarity: Rarity.Epic, type: AccessoryType.Necklace },
  { id: AccessoryId.I23423, fileName: '23423.webp', rarity: Rarity.Epic, type: AccessoryType.Necklace },
  { id: AccessoryId.I23424, fileName: '23424.webp', rarity: Rarity.Epic, type: AccessoryType.Necklace },
];

const CHARMS: AccessoryDefinitionSeed[] = [
  { id: AccessoryId.I34400, fileName: '34400.webp', rarity: Rarity.Epic, type: AccessoryType.Charm },
  { id: AccessoryId.I34401, fileName: '34401.webp', rarity: Rarity.Epic, type: AccessoryType.Charm },
  { id: AccessoryId.I34402, fileName: '34402.webp', rarity: Rarity.Epic, type: AccessoryType.Charm },
  { id: AccessoryId.I34403, fileName: '34403.webp', rarity: Rarity.Epic, type: AccessoryType.Charm },
  { id: AccessoryId.I34404, fileName: '34404.webp', rarity: Rarity.Epic, type: AccessoryType.Charm },
  { id: AccessoryId.I34405, fileName: '34405.webp', rarity: Rarity.Epic, type: AccessoryType.Charm },
  { id: AccessoryId.I34406, fileName: '34406.webp', rarity: Rarity.Epic, type: AccessoryType.Charm },
  { id: AccessoryId.I34407, fileName: '34407.webp', rarity: Rarity.Epic, type: AccessoryType.Charm },
  { id: AccessoryId.I34408, fileName: '34408.webp', rarity: Rarity.Epic, type: AccessoryType.Charm },
  { id: AccessoryId.I34409, fileName: '34409.webp', rarity: Rarity.Epic, type: AccessoryType.Charm },
  { id: AccessoryId.I34410, fileName: '34410.webp', rarity: Rarity.Epic, type: AccessoryType.Charm },
  { id: AccessoryId.I34411, fileName: '34411.webp', rarity: Rarity.Epic, type: AccessoryType.Charm },
  { id: AccessoryId.I34412, fileName: '34412.webp', rarity: Rarity.Epic, type: AccessoryType.Charm },
  { id: AccessoryId.I34413, fileName: '34413.webp', rarity: Rarity.Epic, type: AccessoryType.Charm },
  { id: AccessoryId.I34414, fileName: '34414.webp', rarity: Rarity.Epic, type: AccessoryType.Charm },
  { id: AccessoryId.I34415, fileName: '34415.webp', rarity: Rarity.Epic, type: AccessoryType.Charm },
  { id: AccessoryId.I34416, fileName: '34416.webp', rarity: Rarity.Epic, type: AccessoryType.Charm },
];

const ORNAMENTS: AccessoryDefinitionSeed[] = [
  { id: AccessoryId.I36001, fileName: '36001.webp', rarity: Rarity.Epic, type: AccessoryType.Ornament },
  { id: AccessoryId.I36002, fileName: '36002.webp', rarity: Rarity.Epic, type: AccessoryType.Ornament },
  { id: AccessoryId.I36003, fileName: '36003.webp', rarity: Rarity.Epic, type: AccessoryType.Ornament },
  { id: AccessoryId.I36004, fileName: '36004.webp', rarity: Rarity.Epic, type: AccessoryType.Ornament },
  { id: AccessoryId.I36005, fileName: '36005.webp', rarity: Rarity.Epic, type: AccessoryType.Ornament },
  { id: AccessoryId.I36006, fileName: '36006.webp', rarity: Rarity.Epic, type: AccessoryType.Ornament },
  { id: AccessoryId.I36007, fileName: '36007.webp', rarity: Rarity.Epic, type: AccessoryType.Ornament },
  { id: AccessoryId.I36008, fileName: '36008.webp', rarity: Rarity.Epic, type: AccessoryType.Ornament },
  { id: AccessoryId.I36009, fileName: '36009.webp', rarity: Rarity.Epic, type: AccessoryType.Ornament },
  { id: AccessoryId.I36010, fileName: '36010.webp', rarity: Rarity.Epic, type: AccessoryType.Ornament },
  { id: AccessoryId.I36011, fileName: '36011.webp', rarity: Rarity.Epic, type: AccessoryType.Ornament },
  { id: AccessoryId.I36012, fileName: '36012.webp', rarity: Rarity.Epic, type: AccessoryType.Ornament },
  { id: AccessoryId.I36013, fileName: '36013.webp', rarity: Rarity.Epic, type: AccessoryType.Ornament },
  { id: AccessoryId.I36014, fileName: '36014.webp', rarity: Rarity.Epic, type: AccessoryType.Ornament },
];

const ELEMENT_NAME_BY_SUFFIX: Record<string, { fr: string; en: string }> = {
  '01': { fr: 'feu', en: 'fire' },
  '02': { fr: 'eau', en: 'water' },
  '03': { fr: 'terre', en: 'earth' },
  '04': { fr: 'vent', en: 'wind' },
  '05': { fr: 'foudre', en: 'lightning' },
  '06': { fr: 'lumiere', en: 'light' },
  '07': { fr: 'ombre', en: 'shadow' },
  '08': { fr: 'feu', en: 'fire' },
  '09': { fr: 'eau', en: 'water' },
  '10': { fr: 'terre', en: 'earth' },
  '11': { fr: 'vent', en: 'wind' },
  '12': { fr: 'foudre', en: 'lightning' },
  '13': { fr: 'lumiere', en: 'light' },
  '14': { fr: 'ombre', en: 'shadow' },
  '15': { fr: 'feu', en: 'fire' },
  '16': { fr: 'eau', en: 'water' },
  '17': { fr: 'terre', en: 'earth' },
  '21': { fr: 'vent', en: 'wind' },
  '22': { fr: 'foudre', en: 'lightning' },
  '23': { fr: 'lumiere', en: 'light' },
  '24': { fr: 'ombre', en: 'shadow' },
  '25': { fr: 'feu', en: 'fire' },
  '26': { fr: 'eau', en: 'water' },
  '27': { fr: 'terre', en: 'earth' },
};

const RARITY_LABEL: Record<Rarity, { fr: string; en: string }> = {
  [Rarity.Basic]: { fr: 'basique', en: 'basic' },
  [Rarity.Gold]: { fr: 'doré', en: 'gold' },
  [Rarity.Epic]: { fr: 'epique', en: 'epic' },
};

function localizedAccessoryName(seed: AccessoryDefinitionSeed): {
  nameFr: string;
  nameEn: string;
} {
  const id = seed.id;
  const suffix = id.slice(-2);
  const element = ELEMENT_NAME_BY_SUFFIX[suffix] || { fr: 'arcane', en: 'arcane' };
  const rarity = RARITY_LABEL[seed.rarity];

  if (seed.type === AccessoryType.Ring) {
    const variant = id.endsWith('10') ? { fr: 'cristal', en: 'crystal' } : { fr: 'goutte', en: 'drop' };
    return {
      nameFr: `bague ${variant.fr} ${rarity.fr}`,
      nameEn: `${rarity.en} ${variant.en} ring`,
    };
  }

  if (seed.type === AccessoryType.Earring) {
    const style = id.startsWith('2232') || id.startsWith('2242')
      ? { fr: 'coquille', en: 'shell' }
      : id.startsWith('2231') || id.startsWith('2241')
        ? { fr: 'plume', en: 'feather' }
        : { fr: 'pierre', en: 'stone' };
    return {
      nameFr: `boucles ${style.fr} ${element.fr} ${rarity.fr}`,
      nameEn: `${rarity.en} ${element.en} ${style.en} earrings`,
    };
  }

  if (seed.type === AccessoryType.Necklace) {
    return {
      nameFr: `collier ${element.fr} ${rarity.fr}`,
      nameEn: `${rarity.en} ${element.en} necklace`,
    };
  }

  if (seed.type === AccessoryType.Charm) {
    return {
      nameFr: `charme relique ${id}`,
      nameEn: `relic charm ${id}`,
    };
  }

  return {
    nameFr: `ornement legendaire ${id}`,
    nameEn: `legendary ornament ${id}`,
  };
}

export const ACCESSORY_DEFINITIONS: AccessoryDefinition[] = [
  ...RINGS,
  ...EARRINGS_BASIC,
  ...EARRINGS_GOLD,
  ...EARRINGS_EPIC,
  ...NECKLACES,
  ...CHARMS,
  ...ORNAMENTS,
].map(seed => ({
  ...seed,
  ...localizedAccessoryName(seed),
}));

export const ACCESSORY_COMBINATION_RULES: AccessoryCombinationRule[] = [
  // rings
  { sourceA: AccessoryId.I21110, sourceB: AccessoryId.I21110, result: AccessoryId.I21210 },
  { sourceA: AccessoryId.I21120, sourceB: AccessoryId.I21120, result: AccessoryId.I21220 },
  { sourceA: AccessoryId.I21210, sourceB: AccessoryId.I21210, result: AccessoryId.I21310 },
  { sourceA: AccessoryId.I21220, sourceB: AccessoryId.I21220, result: AccessoryId.I21320 },

  // earrings
  { sourceA: AccessoryId.I22201, sourceB: AccessoryId.I22201, result: AccessoryId.I22311 },
  { sourceA: AccessoryId.I22202, sourceB: AccessoryId.I22202, result: AccessoryId.I22312 },
  { sourceA: AccessoryId.I22203, sourceB: AccessoryId.I22203, result: AccessoryId.I22313 },
  { sourceA: AccessoryId.I22204, sourceB: AccessoryId.I22204, result: AccessoryId.I22314 },
  { sourceA: AccessoryId.I22205, sourceB: AccessoryId.I22205, result: AccessoryId.I22315 },
  { sourceA: AccessoryId.I22206, sourceB: AccessoryId.I22206, result: AccessoryId.I22316 },
  { sourceA: AccessoryId.I22207, sourceB: AccessoryId.I22207, result: AccessoryId.I22317 },

  { sourceA: AccessoryId.I22311, sourceB: AccessoryId.I22311, result: AccessoryId.I22411 },
  { sourceA: AccessoryId.I22312, sourceB: AccessoryId.I22312, result: AccessoryId.I22412 },
  { sourceA: AccessoryId.I22313, sourceB: AccessoryId.I22313, result: AccessoryId.I22413 },
  { sourceA: AccessoryId.I22314, sourceB: AccessoryId.I22314, result: AccessoryId.I22414 },
  { sourceA: AccessoryId.I22315, sourceB: AccessoryId.I22315, result: AccessoryId.I22415 },
  { sourceA: AccessoryId.I22316, sourceB: AccessoryId.I22316, result: AccessoryId.I22416 },
  { sourceA: AccessoryId.I22317, sourceB: AccessoryId.I22317, result: AccessoryId.I22417 },

  // necklaces
  { sourceA: AccessoryId.I23201, sourceB: AccessoryId.I23201, result: AccessoryId.I23311 },
  { sourceA: AccessoryId.I23202, sourceB: AccessoryId.I23202, result: AccessoryId.I23312 },
  { sourceA: AccessoryId.I23203, sourceB: AccessoryId.I23203, result: AccessoryId.I23313 },
  { sourceA: AccessoryId.I23204, sourceB: AccessoryId.I23204, result: AccessoryId.I23314 },

  { sourceA: AccessoryId.I23311, sourceB: AccessoryId.I23311, result: AccessoryId.I23411 },
  { sourceA: AccessoryId.I23312, sourceB: AccessoryId.I23312, result: AccessoryId.I23412 },
  { sourceA: AccessoryId.I23313, sourceB: AccessoryId.I23313, result: AccessoryId.I23413 },
  { sourceA: AccessoryId.I23314, sourceB: AccessoryId.I23314, result: AccessoryId.I23414 },
];

const pairKey = (left: AccessoryId, right: AccessoryId): string =>
  left < right ? `${left}+${right}` : `${right}+${left}`;

export const ACCESSORY_COMBINATION_MAP: Record<string, AccessoryId> =
  ACCESSORY_COMBINATION_RULES.reduce<Record<string, AccessoryId>>((acc, rule) => {
    acc[pairKey(rule.sourceA, rule.sourceB)] = rule.result;
    return acc;
  }, {});

export function getAccessoryCombinationResult(
  sourceA: AccessoryId,
  sourceB: AccessoryId
): AccessoryId | null {
  return ACCESSORY_COMBINATION_MAP[pairKey(sourceA, sourceB)] || null;
}
