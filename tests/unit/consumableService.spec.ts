import { ItemId } from '../../src/objects/enums/ItemId';
import { Rarity } from '../../src/objects/enums/Rarity';
import { TypeItem } from '../../src/objects/enums/TypeItem';
import {
    getItemById,
    getItemByName,
    getItems,
} from '../../src/services/consumableService';

describe('consumableService', () => {
  it('finds item by id', () => {
    const item = getItemById(ItemId.I20001000);
    expect(item).not.toBeNull();
    expect(item?.fileName).toBe('20001000.webp');
  });

  it('finds item by localized name', () => {
    const item = getItemByName('potion feu basique');
    expect(item).not.toBeNull();
    expect(item?.id).toBe(ItemId.I20001000);
  });

  it('filters items by rarity and type', () => {
    const items = getItems({ rarity: Rarity.Epic, type: TypeItem.Scroll });
    expect(items.length).toBeGreaterThan(0);
    expect(items.every(item => item.rarity === Rarity.Epic)).toBe(true);
    expect(items.every(item => item.type === TypeItem.Scroll)).toBe(true);
  });
});
