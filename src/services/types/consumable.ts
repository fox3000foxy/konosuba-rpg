import { Rarity } from "../../objects/enums/Rarity";
import { TypeItem } from "../../objects/enums/TypeItem";

export type ConsumableQuery = {
  rarity?: Rarity;
  type?: TypeItem;
  name?: string;
  id?: string;
  ids?: string[];
  limit?: number;
};
