import { type AccessoryId } from "../enums/AccessoryId";
import { type ItemId } from "../enums/ItemId";

export type ShopItem = {
  itemKey: AccessoryId | ItemId;
  itemType: "accessory" | "consumable" | "unknown";
  nameFr: string;
  nameEn: string;
  price: number;
  imagePath: string | null;
};
