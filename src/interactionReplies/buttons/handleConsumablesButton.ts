import type { Button } from "discord-interactions";
import type { Context } from "hono";
import { BASE_URL } from "../../objects/config";
import { TypeItem } from "../../objects/enums/TypeItem";
import type { InventoryItemView } from "../../objects/types/InventoryItemView";
import { getInventoryItems } from "../../services/inventoryService";

const DISPLAY_LIMIT = 12;

function formatRarity(rarity: string | null, fr: boolean): string {
  if (!rarity) {
    return fr ? "inconnue" : "unknown";
  }

  if (!fr) {
    return rarity;
  }

  switch (rarity) {
    case "basic":
      return "basique";
    case "gold":
      return "doré";
    case "epic":
      return "epique";
    case "silver":
      return "argent";
    case "bronze":
      return "bronze";
    default:
      return rarity;
  }
}

function formatType(type: TypeItem | null, fr: boolean): string {
  if (!type) {
    return fr ? "inconnu" : "unknown";
  }

  if (fr) {
    switch (type) {
      case TypeItem.Potion:
        return "potion";
      case TypeItem.Chrono:
        return "chrono";
      case TypeItem.Stone:
        return "pierre";
      case TypeItem.Scroll:
        return "parchemin";
      default:
        return "inconnu";
    }
  }

  return type;
}

function styleForConsumableType(type: TypeItem | null): number {
  switch (type) {
    case TypeItem.Potion:
      return 3; // green
    case TypeItem.Chrono:
      return 1; // blurple
    case TypeItem.Stone:
      return 2; // gray
    case TypeItem.Scroll:
      return 4; // red
    default:
      return 1;
  }
}

function emojiForConsumableType(type: TypeItem | null): string {
  switch (type) {
    case TypeItem.Potion:
      return "🧪";
    case TypeItem.Chrono:
      return "⏳";
    case TypeItem.Stone:
      return "🪨";
    case TypeItem.Scroll:
      return "📜";
    default:
      return "🎒";
  }
}

export function buildConsumablesDescription(items: InventoryItemView[], fr: boolean, userId: string): string {
  const consumables = items.filter((item) => item.category === "consumable");

  if (consumables.length === 0) {
    return fr ? `# Consommables\n\nAucun consommable disponible pour le moment.\n\nTu peux consulter ton inventaire complet ici:\n${BASE_URL}/inventory/${userId}?lang=fr` : `# Consumables\n\nNo consumables available right now.\n\nYou can view your full inventory here:\n${BASE_URL}/inventory/${userId}?lang=en`;
  }

  const rows = consumables.slice(0, DISPLAY_LIMIT).map((item) => {
    const name = fr ? item.nameFr : item.nameEn;
    const rarity = formatRarity(item.rarity, fr);
    const type = formatType(item.consumableType, fr);
    return `- ${name} x${item.quantity} (${type}, ${rarity})`;
  });

  const moreCount = Math.max(0, consumables.length - DISPLAY_LIMIT);
  const moreLine = moreCount > 0 ? (fr ? `\n... et ${moreCount} autre(s)` : `\n... and ${moreCount} more`) : "";

  const header = fr ? `# Consommables (${consumables.length})` : `# Consumables (${consumables.length})`;
  const footer = fr ? `\n\nInventaire complet:\n${BASE_URL}/inventory/${userId}?lang=fr` : `\n\nFull inventory:\n${BASE_URL}/inventory/${userId}?lang=en`;

  return `${header}\n\n${rows.join("\n")}${moreLine}${footer}`;
}

export async function handleConsumablesButton(c: Context, userId: string, fr: boolean, payload: string) {
  const items = await getInventoryItems(userId);
  const consumables = items.filter((item) => item.category === "consumable");

  if (consumables.length === 0) {
    // Ack interaction without followup/update when there is nothing to show.
    return c.json({
      type: 6,
    });
  }

  // Remove the 'c' action from payload (since we're showing a menu, not executing)
  const cleanPayload = payload.endsWith("c") ? payload.slice(0, -1) : payload;

  // Create buttons for each consumable (max 25 to respect Discord limits)
  const consumableButtons: Button[] = consumables.slice(0, 25).map((item) => {
    return {
      type: 2,
      label: `${emojiForConsumableType(item.consumableType)} ${fr ? item.nameFr : item.nameEn} x${item.quantity}`,
      style: styleForConsumableType(item.consumableType),
      custom_id: `consumable_item:${cleanPayload}:${item.itemKey}:${userId}`,
    };
  });

  // Group buttons in rows (5 per row)
  const components: Array<{ type: number; components: Button[] }> = [];
  for (let i = 0; i < consumableButtons.length; i += 5) {
    components.push({
      type: 1,
      components: consumableButtons.slice(i, i + 5),
    });
  }

  components.push({
    type: 1,
    components: [
      {
        type: 2,
        label: fr ? "Retour en jeu" : "Back to game",
        style: 2,
        custom_id: `${cleanPayload}:${userId}`,
      },
    ],
  });

  return c.json({
    type: 7,
    data: {
      components,
    },
  });
}
