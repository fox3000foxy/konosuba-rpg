import type { AccessoryId } from "../../objects/enums/AccessoryId";
import type { AccessoryType } from "../../objects/enums/AccessoryType";
import type { Rarity } from "../../objects/enums/Rarity";

export type AccessoryQuery = {
  rarity?: Rarity;
  type?: AccessoryType;
  name?: string;
  id?: AccessoryId;
  ids?: AccessoryId[];
  limit?: number;
};
