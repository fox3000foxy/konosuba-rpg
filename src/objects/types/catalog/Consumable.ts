import { type ItemId } from "../../enums/ItemId";
import { type Rarity } from "../../enums/Rarity";
import { type TypeItem } from "../../enums/TypeItem";

export type ConsumableDefinition = {
  id: ItemId;
  fileName: string;
  rarity: Rarity;
  type: TypeItem;
  nameFr: string;
  nameEn: string;
};

export type ConsumableCombinationRule = {
  sourceA: ItemId;
  sourceB: ItemId;
  result: ItemId;
};
