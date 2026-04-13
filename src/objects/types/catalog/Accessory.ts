import type { AccessoryId } from "../../enums/AccessoryId";
import type { AccessoryType } from "../../enums/AccessoryType";
import type { Rarity } from "../../enums/Rarity";

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
