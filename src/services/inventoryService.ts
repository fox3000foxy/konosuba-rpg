import { AccessoryId } from '../objects/enums/AccessoryId';
import { ItemId } from '../objects/enums/ItemId';
import { Rarity } from '../objects/enums/Rarity';
import { InventoryItemView } from '../objects/types/InventoryItemView';
import { getSupabaseAdminClient } from '../utils/supabaseClient';
import { getItemById } from './accessoryService';
import { getItemById as getConsumableById } from './consumableService';

export type { InventoryItemView } from '../objects/types/InventoryItemView';

type InventoryRow = {
  item_key: string;
  item_type: string;
  quantity: number;
};

export async function getInventoryItems(userId: string): Promise<InventoryItemView[]> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase.from('inventory_items').select('item_key, item_type, quantity').eq('user_id', userId).gt('quantity', 0);

  if (error) {
    console.error('[db] load inventory failed:', error.message);
    return [];
  }

  const rows = (data || []) as InventoryRow[];
  const mapped = rows.map(row => {
    const accessory = getItemById(row.item_key as AccessoryId);
    const consumable = accessory ? null : getConsumableById(row.item_key as ItemId);

    const category: InventoryItemView['category'] = accessory ? 'accessory' : consumable ? 'consumable' : 'unknown';

    const imagePath = accessory ? `/assets/accessories/${accessory.fileName}` : consumable ? `/assets/consumables/${consumable.fileName}` : null;

    return {
      itemKey: row.item_key,
      itemType: row.item_type,
      quantity: Number(row.quantity || 0),
      rarity: accessory?.rarity || consumable?.rarity || null,
      accessoryType: accessory?.type || null,
      consumableType: consumable?.type || null,
      category,
      imagePath,
      nameFr: accessory?.nameFr || consumable?.nameFr || row.item_key,
      nameEn: accessory?.nameEn || consumable?.nameEn || row.item_key,
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

export async function addInventoryItem(userId: string, itemKey: string, itemType: string, quantity = 1): Promise<boolean> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return false;
  }

  try {
    const { data: existing, error: existingError } = await supabase.from('inventory_items').select('quantity').eq('user_id', userId).eq('item_key', itemKey).maybeSingle();

    if (existingError) {
      console.error('[db] addInventoryItem select failed:', existingError.message);
      return false;
    }

    if (!existing) {
      const { error: insertError } = await supabase.from('inventory_items').insert({
        user_id: userId,
        item_key: itemKey,
        item_type: itemType,
        quantity,
        updated_at: new Date().toISOString(),
      });

      if (insertError) {
        console.error('[db] addInventoryItem insert failed:', insertError.message);
        return false;
      }

      return true;
    }

    const newQuantity = Number(existing.quantity || 0) + quantity;
    const { error: updateError } = await supabase.from('inventory_items').update({ quantity: newQuantity, updated_at: new Date().toISOString() }).eq('user_id', userId).eq('item_key', itemKey);

    if (updateError) {
      console.error('[db] addInventoryItem update failed:', updateError.message);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[db] addInventoryItem error:', error);
    return false;
  }
}
