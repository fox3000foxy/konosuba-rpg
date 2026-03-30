import { AccessoryId } from '../../src/objects/enums/AccessoryId';
import { AccessoryType } from '../../src/objects/enums/AccessoryType';
import { Rarity } from '../../src/objects/enums/Rarity';
import {
  getItemById,
  getItemByName,
  getItems,
} from '../../src/services/accessoryService';

describe('accessoryService', () => {
  it('finds item by id', () => {
    const item = getItemById(AccessoryId.I21110);
    expect(item).not.toBeNull();
    expect(item?.fileName).toBe('21110.webp');
  });

  it('finds item by localized name', () => {
    const item = getItemByName('bague cristal en bronze');
    expect(item).not.toBeNull();
    expect(item?.id).toBe(AccessoryId.I21110);
  });

  it('filters items by rarity and type', () => {
    const items = getItems({ rarity: Rarity.Epic, type: AccessoryType.Charm });
    expect(items.length).toBeGreaterThan(0);
    expect(items.every(item => item.rarity === Rarity.Epic)).toBe(true);
    expect(items.every(item => item.type === AccessoryType.Charm)).toBe(true);
  });
});
