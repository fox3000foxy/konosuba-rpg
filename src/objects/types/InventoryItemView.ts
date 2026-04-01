import { AccessoryType } from '../enums/AccessoryType';
import { Rarity } from '../enums/Rarity';
import { TypeItem } from '../enums/TypeItem';

export type InventoryItemCategory = 'accessory' | 'consumable' | 'unknown';

export type InventoryItemView = {
  itemKey: string;
  itemType: string;
  quantity: number;
  rarity: Rarity | null;
  accessoryType: AccessoryType | null;
  consumableType: TypeItem | null;
  category: InventoryItemCategory;
  imagePath: string | null;
  nameFr: string;
  nameEn: string;
};