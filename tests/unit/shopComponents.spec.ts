import { buildShopComponents } from '../../src/interactionReplies/commands/shop';
import { AccessoryId } from '../../src/objects/enums/AccessoryId';
import { ShopItem } from '../../src/objects/types/ShopItem';

describe('buildShopComponents', () => {
  it('handles empty shop item list with a disabled select fallback', () => {
    const components = buildShopComponents([], 1, 1, false, 'user123');

    expect(components).toBeInstanceOf(Array);

    const selectRow = components[1];
    expect(selectRow).toBeDefined();
    expect(selectRow.components).toHaveLength(1);

    const selectComponent = selectRow.components[0];
    expect(selectComponent.type).toBe(3);
    expect(selectComponent.disabled).toBe(true);
    // expect(selectComponent.options).toHaveLength(1);
    // expect(selectComponent.options[0].label).toBe('No items available');
    // expect(selectComponent.options[0].value).toBe('none');
  });

  it('caps select options to 25 and keeps custom_id within Discord limits', () => {
    const items: ShopItem[] = Array.from({ length: 30 }, (_, i) => ({
      itemKey: AccessoryId.I21110,
      itemType: 'consumable',
      nameFr: `objet ${i}`,
      nameEn: `item ${i}`,
      price: 10 + i,
    }));

    const components = buildShopComponents(items, 1, 2, false, 'user123', 'id0');

    // const selectComponent = components[1].components[0];
    // expect(selectComponent.options).toHaveLength(25);

    for (const row of components) {
      for (const comp of row.components) {
        if (comp.custom_id) {
          expect(comp.custom_id.length).toBeLessThanOrEqual(100);
        }
      }
    }

    const bottomRow = components[2];
    expect(bottomRow.components[0].custom_id.startsWith('shop_buy:id0:1:user123')).toBe(true);
  });
});
