import Troll from '../../src/classes/mobs/Troll';
import { generateMob } from '../../src/data/mobMap';
import { Lang } from '../../src/enums/Lang';

describe('Creature base mechanics', () => {
  it('giveHug decreases love by expected range', () => {
    const creature = new Troll();
    const before = creature.love;

    creature.giveHug(1);

    expect(creature.love).toBeLessThan(before);
    expect(creature.love).toBeGreaterThanOrEqual(before - 4);
  });

  it('turn returns damage tuple and localized message', () => {
    const creature = new Troll();
    creature.attack = [2, 3];
    creature.name = 'Demo';

    const [msgEn, dmgEn] = creature.turn({lang: Lang.English, dmg: 2});
    const [msgFr, dmgFr] = creature.turn({lang: Lang.French, dmg: 2});

    expect(dmgEn).toBe(2);
    expect(msgEn).toContain('Demo');
    expect(msgFr).toContain('Demo');
    expect(dmgFr).toBeGreaterThanOrEqual(2);
  });
});

describe('All mobs wiring', () => {
  it('every mob in mobMap can be instantiated and has valid defaults', () => {
    const mobMap = generateMob();
    for (const mob of Object.values(mobMap)) {
      expect(mob.hpMax).toBeGreaterThan(0);
      expect(mob.hp).toBe(mob.hpMax);
      expect(mob.images.length).toBeGreaterThan(0);
      expect(typeof mob.name).toBe('string');
    }
  });
});
