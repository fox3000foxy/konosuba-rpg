import { AccessoryId } from '../objects/enums/AccessoryId';
import { AccessoryType } from '../objects/enums/AccessoryType';
import { Rarity } from '../objects/enums/Rarity';
import { getSupabaseAdminClient } from '../utils/supabaseClient';
import { getItemById } from './accessoryService';

type InventoryRow = {
  item_key: string;
  item_type: string;
  quantity: number;
};

export type InventoryItemView = {
  itemKey: string;
  itemType: string;
  quantity: number;
  rarity: Rarity | null;
  accessoryType: AccessoryType | null;
  nameFr: string;
  nameEn: string;
};

export async function getInventoryItems(userId: string): Promise<InventoryItemView[]> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from('inventory_items')
    .select('item_key, item_type, quantity')
    .eq('user_id', userId)
    .gt('quantity', 0);

  if (error) {
    console.error('[db] load inventory failed:', error.message);
    return [];
  }

  const rows = (data || []) as InventoryRow[];
  const mapped = rows.map(row => {
    const accessory = getItemById(row.item_key as AccessoryId);
    return {
      itemKey: row.item_key,
      itemType: row.item_type,
      quantity: Number(row.quantity || 0),
      rarity: accessory?.rarity || null,
      accessoryType: accessory?.type || null,
      nameFr: accessory?.nameFr || row.item_key,
      nameEn: accessory?.nameEn || row.item_key,
    };
  });

  const rarityWeight: Record<Rarity, number> = {
    [Rarity.Epic]: 4,
    [Rarity.Gold]: 3,
    [Rarity.Silver]: 2,
    [Rarity.Bronze]: 1,
    [Rarity.Basic]: 0,
  };

  return mapped.sort((a, b) => {
    if (b.quantity !== a.quantity) {
      return b.quantity - a.quantity;
    }

    const aw = a.rarity ? rarityWeight[a.rarity] : -1;
    const bw = b.rarity ? rarityWeight[b.rarity] : -1;
    if (bw !== aw) {
      return bw - aw;
    }

    return a.itemKey.localeCompare(b.itemKey);
  });
}