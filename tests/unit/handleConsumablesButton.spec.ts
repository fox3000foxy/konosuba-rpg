import { buildConsumablesDescription } from '../../src/interactionReplies/buttons/handleConsumablesButton';
import { AccessoryType } from '../../src/objects/enums/AccessoryType';
import { Rarity } from '../../src/objects/enums/Rarity';
import { TypeItem } from '../../src/objects/enums/TypeItem';
import { InventoryItemView } from '../../src/objects/types/InventoryItemView';

describe('handleConsumablesButton', () => {
  it('returns empty-state message when no consumables are available', () => {
    const description = buildConsumablesDescription([], true, 'user-1');

    expect(description).toContain('Aucun consommable disponible');
    expect(description).toContain('/inventory/user-1?lang=fr');
  });

  it('lists consumables and excludes accessories', () => {
    const items: InventoryItemView[] = [
      {
        itemKey: 'consumable_1',
        itemType: 'combat',
        quantity: 3,
        rarity: Rarity.Gold,
        accessoryType: null,
        consumableType: TypeItem.Potion,
        category: 'consumable',
        imagePath: '/assets/consumables/20002000.webp',
        nameFr: 'potion feu doré',
        nameEn: 'gold fire potion',
      },
      {
        itemKey: 'accessory_1',
        itemType: 'affinity',
        quantity: 1,
        rarity: Rarity.Epic,
        accessoryType: AccessoryType.Ring,
        consumableType: null,
        category: 'accessory',
        imagePath: '/assets/accessories/21110.webp',
        nameFr: 'bague test',
        nameEn: 'test ring',
      },
    ];

    const descriptionFr = buildConsumablesDescription(items, true, 'user-2');
    const descriptionEn = buildConsumablesDescription(items, false, 'user-2');

    expect(descriptionFr).toContain('# Consommables (1)');
    expect(descriptionFr).toContain('potion feu doré x3');
    expect(descriptionFr).not.toContain('bague test');

    expect(descriptionEn).toContain('# Consumables (1)');
    expect(descriptionEn).toContain('gold fire potion x3');
    expect(descriptionEn).not.toContain('test ring');
  });
});
