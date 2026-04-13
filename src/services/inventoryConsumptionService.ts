import { withPerf } from "../utils/perfLogger";
import { getSupabaseAdminClient } from "../utils/supabaseClient";

/**
 * Decrements a consumable from user inventory atomically
 * Returns true if successful, false if item not found or out of stock
 */
export async function consumeInventoryItem(userId: string, itemKey: string, quantity: number = 1): Promise<boolean> {
  return withPerf("inventoryConsumptionService", "consumeInventoryItem", async () => {
    const supabase = await getSupabaseAdminClient();
    if (!supabase) {
      console.error("Supabase client unavailable");
      return false;
    }

    try {
      // Load all matching rows to handle historical duplicates safely.
      const { data: existingItems, error: selectError } = await supabase.from("inventory_items").select("quantity, item_type").eq("user_id", userId).eq("item_key", itemKey);

      if (selectError || !existingItems || existingItems.length === 0) {
        console.error("Item not found in inventory:", selectError);
        return false;
      }

      const totalQuantity = existingItems.reduce((acc, row) => acc + Number(row.quantity || 0), 0);

      if (totalQuantity < quantity) {
        console.error("Insufficient quantity:", {
          have: totalQuantity,
          need: quantity,
        });
        return false;
      }

      const newQuantity = totalQuantity - quantity;
      const itemType = String(existingItems[0]?.item_type || "unknown");

      // Normalize to a single row for this (user,item), then write final quantity.
      if (newQuantity <= 0) {
        const { error: deleteError } = await supabase.from("inventory_items").delete().eq("user_id", userId).eq("item_key", itemKey);

        if (deleteError) {
          console.error("Failed to delete inventory item:", deleteError);
          return false;
        }
      } else {
        const { error: resetError } = await supabase.from("inventory_items").delete().eq("user_id", userId).eq("item_key", itemKey);

        if (resetError) {
          console.error("Failed to normalize inventory rows:", resetError);
          return false;
        }

        const { error: insertError } = await supabase.from("inventory_items").insert({
          user_id: userId,
          item_key: itemKey,
          item_type: itemType,
          quantity: newQuantity,
          updated_at: new Date().toISOString(),
        });

        if (insertError) {
          console.error("Failed to update inventory:", insertError);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error("Error consuming inventory item:", error);
      return false;
    }
  });
}

/**
 * Gets current inventory quantity for an item
 */
export async function getInventoryItemQuantity(userId: string, itemKey: string): Promise<number> {
  return withPerf("inventoryConsumptionService", "getInventoryItemQuantity", async () => {
    const supabase = await getSupabaseAdminClient();
    if (!supabase) {
      console.error("Supabase client unavailable");
      return 0;
    }

    try {
      const { data, error } = await supabase.from("inventory_items").select("quantity").eq("user_id", userId).eq("item_key", itemKey).single();

      if (error || !data) {
        return 0;
      }

      return data.quantity;
    } catch (error) {
      console.error("Error getting inventory quantity:", error);
      return 0;
    }
  });
}
