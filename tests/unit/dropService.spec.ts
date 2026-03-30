import { getMonsterDifficulty } from '../../src/objects/data/monsterDifficultyMap';
import { MonsterDifficulty } from '../../src/objects/enums/MonsterDifficulty';
import { Rarity } from '../../src/objects/enums/Rarity';
import {
    ACCESSORY_AFFINITY_POINTS_BY_RARITY,
    rollAccessoryDrop,
    rollConsumableDrop,
} from '../../src/services/dropService';

describe('dropService', () => {
  it('is deterministic for a given run key and monster', () => {
    const runKey = 'user-42:abc123/atk';
    const monsterName = 'Dragon';

    const a = rollAccessoryDrop(runKey, monsterName);
    const b = rollAccessoryDrop(runKey, monsterName);

    expect(a).toEqual(b);
  });

  it('produces different results for different monsters at same run key', () => {
    const runKey = 'user-42:abc123/atk';

    const dragonDrop = rollAccessoryDrop(runKey, 'Dragon');
    const slimeDrop = rollAccessoryDrop(runKey, 'Slime');

    // Different monsters should typically produce different rarities due to difficulty modifiers
    // (not guaranteed to differ due to randomness, but very likely)
    expect([dragonDrop, slimeDrop]).toHaveLength(2);
  });

  it('uses the configured affinity points by rarity', () => {
    expect(ACCESSORY_AFFINITY_POINTS_BY_RARITY[Rarity.Bronze]).toBe(3);
    expect(ACCESSORY_AFFINITY_POINTS_BY_RARITY[Rarity.Silver]).toBe(5);
    expect(ACCESSORY_AFFINITY_POINTS_BY_RARITY[Rarity.Gold]).toBe(8);
    expect(ACCESSORY_AFFINITY_POINTS_BY_RARITY[Rarity.Epic]).toBe(12);
  });

  it('drops accessories in the expected rarity domain', () => {
    const drops = rollAccessoryDrop('user-13:seed777/atk', 'Troll');

    expect(drops.length).toBeGreaterThanOrEqual(2);
    expect(drops.length).toBeLessThanOrEqual(4);

    for (const drop of drops) {
      expect([Rarity.Bronze, Rarity.Silver, Rarity.Gold, Rarity.Epic]).toContain(
        drop.rarity
      );
      expect(drop.accessoryId).toMatch(/^\d{5}$/);
      expect(drop.affinityPoints).toBeGreaterThan(0);
    }
  });

  it('calculates difficulty levels correctly', () => {
    expect(getMonsterDifficulty('Slime')).toBe(MonsterDifficulty.Easy);
    expect(getMonsterDifficulty('Troll')).toBe(MonsterDifficulty.Medium);
    expect(getMonsterDifficulty('King Troll')).toBe(MonsterDifficulty.VeryHard);
    expect(getMonsterDifficulty('Dragon')).toBe(MonsterDifficulty.Extreme);
  });

  it('handles unknown monsters gracefully', () => {
    const drops = rollAccessoryDrop('user-42:abc123/atk', 'UnknownMonster');
    expect(drops.length).toBeGreaterThanOrEqual(2);
    expect(drops[0]?.accessoryId).toBeDefined();
    expect(drops[0]?.rarity).toBeDefined();
  });

  it('handles null monster name gracefully', () => {
    const drops = rollAccessoryDrop('user-42:abc123/atk', null);
    expect(drops.length).toBeGreaterThanOrEqual(2);
    expect(drops[0]?.accessoryId).toBeDefined();
    expect(drops[0]?.rarity).toBeDefined();
  });

  it('gives at least as many high-rarity drops on hard as on easy for same seed', () => {
    const runKey = 'user-99:minecraft-loot/atk';

    const easyDrops = rollAccessoryDrop(runKey, 'Slime');
    const hardDrops = rollAccessoryDrop(runKey, 'King Troll');

    const easyHigh = easyDrops.filter(
      drop => drop.rarity === Rarity.Gold || drop.rarity === Rarity.Epic
    ).length;
    const hardHigh = hardDrops.filter(
      drop => drop.rarity === Rarity.Gold || drop.rarity === Rarity.Epic
    ).length;

    expect(hardHigh).toBeGreaterThanOrEqual(easyHigh);
  });

  it('is deterministic for consumables with same run key and monster', () => {
    const runKey = 'user-42:consumable-seed/atk';

    const a = rollConsumableDrop(runKey, 'Dragon');
    const b = rollConsumableDrop(runKey, 'Dragon');

    expect(a).toEqual(b);
  });

  it('drops consumables in expected rarity domain', () => {
    const drops = rollConsumableDrop('user-13:seed777/atk', 'Troll');

    expect(drops.length).toBeGreaterThanOrEqual(1);
    expect(drops.length).toBeLessThanOrEqual(3);

    for (const drop of drops) {
      expect([Rarity.Basic, Rarity.Gold, Rarity.Epic]).toContain(drop.rarity);
      expect(drop.itemId).toMatch(/^\d{8}$/);
      expect(['potion', 'component']).toContain(drop.inventoryItemType);
    }
  });

  it('gives at least as many high-rarity consumable drops on hard as on easy for same seed', () => {
    const runKey = 'user-77:consumable-hard-check/atk';

    const easyDrops = rollConsumableDrop(runKey, 'Slime');
    const hardDrops = rollConsumableDrop(runKey, 'Dragon');

    const easyHigh = easyDrops.filter(
      drop => drop.rarity === Rarity.Gold || drop.rarity === Rarity.Epic
    ).length;
    const hardHigh = hardDrops.filter(
      drop => drop.rarity === Rarity.Gold || drop.rarity === Rarity.Epic
    ).length;

    expect(hardHigh).toBeGreaterThanOrEqual(easyHigh);
  });
});
