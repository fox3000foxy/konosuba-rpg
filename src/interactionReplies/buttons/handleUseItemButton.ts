import type { Button } from "discord-interactions";
import type { Context } from "hono";
import type { Lang } from "../../objects/enums/Lang";
import { getInventoryItems } from "../../services/inventoryService";

const EPHEMERAL_FLAG = 1 << 6;

export async function handleUseItemButton(c: Context, userId: string, lang: Lang, fr: boolean) {
  // Get inventory
  const inventoryItems = await getInventoryItems(userId);
  const consumables = inventoryItems.filter((item) => item.category === "consumable");

  if (consumables.length === 0) {
    return c.json({
      type: 4,
      data: {
        content: fr ? "Tu n'as aucun consommable disponible." : "You have no consumables available.",
        flags: EPHEMERAL_FLAG,
      },
    });
  }

  // Create button groups for consumables (5 buttons per row max)
  const consumableButtons: Button[] = consumables.slice(0, 25).map((item) => ({
    type: 2,
    label: `${fr ? item.nameFr : item.nameEn} x${item.quantity}`,
    style: 1, // Blurple style
    custom_id: `consumable_use:${item.itemKey}:${userId}`,
  }));

  // Group buttons in rows (5 per row)
  const components: Array<{ type: number; components: Button[] }> = [];
  for (let i = 0; i < consumableButtons.length; i += 5) {
    components.push({
      type: 1,
      components: consumableButtons.slice(i, i + 5),
    });
  }

  const header = fr ? "# Utiliser un consommable" : "# Use a consumable";
  const moreCount = Math.max(0, consumables.length - 25);
  const footer = moreCount > 0 ? (fr ? `\n\n... et ${moreCount} autre(s) non affiché(s)` : `\n\n... and ${moreCount} more not shown`) : "";

  return c.json({
    type: 4,
    data: {
      content: header + footer,
      components,
      flags: EPHEMERAL_FLAG,
    },
  });
}
