import { getSupabaseAdminClient } from "../utils/supabaseClient";

/**
 * Decrements a consumable from user inventory atomically
 * Returns true if successful, false if item not found or out of stock
 */
export async function consumeInventoryItem(
  userId: string,
  itemKey: string,
  quantity: number = 1
): Promise<boolean> {
  const supabase = await getSupabaseAdminClient();
  if (!supabase) {
    console.error('Supabase client unavailable');
    return false;
  }

  try {
    // First check if item exists and has sufficient quantity
    const { data: existingItem, error: selectError } = await supabase
      .from('inventory_items')
      .select('quantity')
      .eq('user_id', userId)
      .eq('item_key', itemKey)
      .single();

    if (selectError || !existingItem) {
      console.error('Item not found in inventory:', selectError);
      return false;
    }

    if (existingItem.quantity < quantity) {
      console.error('Insufficient quantity:', {
        have: existingItem.quantity,
        need: quantity,
      });
      return false;
    }

    // Decrement or delete if quantity becomes 0
    const newQuantity = existingItem.quantity - quantity;

    if (newQuantity <= 0) {
      const { error: deleteError } = await supabase
        .from('inventory_items')
        .delete()
        .eq('user_id', userId)
        .eq('item_key', itemKey);

      if (deleteError) {
        console.error('Failed to delete inventory item:', deleteError);
        return false;
      }
    } else {
      const { error: updateError } = await supabase
        .from('inventory_items')
        .update({ quantity: newQuantity })
        .eq('user_id', userId)
        .eq('item_key', itemKey);

      if (updateError) {
        console.error('Failed to update inventory:', updateError);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Error consuming inventory item:', error);
    return false;
  }
}

/**
 * Gets current inventory quantity for an item
 */
export async function getInventoryItemQuantity(
  userId: string,
  itemKey: string
): Promise<number> {
  const supabase = await getSupabaseAdminClient();
  if (!supabase) {
    console.error('Supabase client unavailable');
    return 0;
  }

  try {
    const { data, error } = await supabase
      .from('inventory_items')
      .select('quantity')
      .eq('user_id', userId)
      .eq('item_key', itemKey)
      .single();

    if (error || !data) {
      return 0;
    }

    return data.quantity;
  } catch (error) {
    console.error('Error getting inventory quantity:', error);
    return 0;
  }
}
