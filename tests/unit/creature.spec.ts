import { Creature } from '../../src/classes/Creature';
import { Random } from '../../src/classes/Random';
import { mobMap } from '../../src/data/mobMap';

describe('Creature base mechanics', () => {
  it('giveHug decreases love by expected range', () => {
    const creature = new Creature(new Random(10));
    const before = creature.love;

    creature.giveHug();

    expect(creature.love).toBeLessThan(before);
    expect(creature.love).toBeGreaterThanOrEqual(before - 4);
  });

  it('turn returns damage tuple and localized message', () => {
    const creature = new Creature(new Random(7));
    creature.attack = [2, 3];
    creature.name = 'Demo';

    const [msgEn, dmgEn] = creature.turn('en');
    const [msgFr, dmgFr] = creature.turn('fr');

    expect(dmgEn).toBe(2);
    expect(msgEn).toContain('Demo');
    expect(msgFr).toContain('Demo');
    expect(dmgFr).toBeGreaterThanOrEqual(2);
  });
});

describe('All mobs wiring', () => {
  it('every mob in mobMap can be instantiated and has valid defaults', () => {
    for (const MobClass of Object.values(mobMap)) {
      const mob = new MobClass(new Random(123));
      expect(mob.hpMax).toBeGreaterThan(0);
      expect(mob.hp).toBe(mob.hpMax);
      expect(mob.images.length).toBeGreaterThan(0);
      expect(typeof mob.name).toBe('string');
    }
  });
});
