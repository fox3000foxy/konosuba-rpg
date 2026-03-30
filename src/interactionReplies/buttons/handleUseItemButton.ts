import { Context } from 'hono';
import { Lang } from '../../objects/enums/Lang';
import { getInventoryItems } from '../../services/inventoryService';

const EPHEMERAL_FLAG = 1 << 6;

export async function handleUseItemButton(
  c: Context,
  userId: string,
  lang: Lang,
  fr: boolean
) {
  // Get inventory
  const inventoryItems = await getInventoryItems(userId);
  const consumables = inventoryItems.filter(
    item => item.category === 'consumable'
  );

  if (consumables.length === 0) {
    return c.json({
      type: 4,
      data: {
        content: fr
          ? 'Tu n\'as aucun consommable disponible.'
          : 'You have no consumables available.',
        flags: EPHEMERAL_FLAG,
      },
    });
  }

  // Display consumable usage menu (ephemeral)
  // For now, just show the list - full integration coming next
  const consumableList = consumables
    .slice(0, 10)
    .map(
      (item, idx) =>
        `${idx + 1}. ${fr ? item.nameFr : item.nameEn} x${item.quantity}`
    )
    .join('\n');

  const moreCount = Math.max(0, consumables.length - 10);
  const moreLine =
    moreCount > 0
      ? fr
        ? `\n... et ${moreCount} autre(s)`
        : `\n... and ${moreCount} more`
      : '';

  const content = fr
    ? `# Utiliser un consommable\n\n${consumableList}${moreLine}\n\nFonctionnalité complète: bientôt disponible`
    : `# Use a consumable\n\n${consumableList}${moreLine}\n\nFull feature: coming soon`;

  return c.json({
    type: 4,
    data: {
      content,
      flags: EPHEMERAL_FLAG,
    },
  });
}

