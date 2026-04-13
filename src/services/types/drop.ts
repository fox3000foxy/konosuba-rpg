import { CharacterKey } from "../../objects/enums/CharacterKey";
import { Rarity } from "../../objects/enums/Rarity";
import { TypeItem } from "../../objects/enums/TypeItem";

export type AccessoryDropResult = {
  accessoryId: string;
  rarity: Rarity;
  characterKey: CharacterKey;
  affinityPoints: number;
};

export type ConsumableDropResult = {
  itemId: string;
  rarity: Rarity;
  itemType: TypeItem;
  inventoryItemType: "potion" | "component";
};
