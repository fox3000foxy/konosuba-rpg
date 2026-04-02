import { AccessoryId } from '../../enums/AccessoryId';
import { AccessoryType } from '../../enums/AccessoryType';
import { Rarity } from '../../enums/Rarity';

export type AccessoryDefinition = {
  id: AccessoryId;
  fileName: string;
  rarity: Rarity;
  type: AccessoryType;
  nameFr: string;
  nameEn: string;
};

export type AccessoryCombinationRule = {
  sourceA: AccessoryId;
  sourceB: AccessoryId;
  result: AccessoryId;
};
