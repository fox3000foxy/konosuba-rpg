import { AccessoryId } from "../enums/AccessoryId";
import { ItemId } from "../enums/ItemId";

export type ShopItem = {
  itemKey: AccessoryId | ItemId;
  itemType: "accessory" | "consumable" | "unknown";
  nameFr: string;
  nameEn: string;
  price: number;
  imagePath: string | null;
};
