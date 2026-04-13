import { type Rarity } from "../../objects/enums/Rarity";
import { type TypeItem } from "../../objects/enums/TypeItem";

export type ConsumableQuery = {
  rarity?: Rarity;
  type?: TypeItem;
  name?: string;
  id?: string;
  ids?: string[];
  limit?: number;
};
