import { ItemId } from '../../enums/ItemId';
import { Rarity } from '../../enums/Rarity';
import { TypeItem } from '../../enums/TypeItem';

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
