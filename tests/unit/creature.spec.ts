import Troll from '../../src/classes/mobs/Troll';
import { Kazuma } from '../../src/classes/Player';
import { Lang } from '../../src/objects/enums/Lang';

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
    const player = new Kazuma();
    creature.attack = [2, 3];
    creature.name = ['Troll', 'Troll'];

    const [msgEn, dmgEn] = creature.turn({
      lang: Lang.English,
      dmg: 2,
      player,
    });
    const [msgFr, dmgFr] = creature.turn({
      lang: Lang.French,
      dmg: 2,
      player,
    });

    expect(dmgEn).toBe(2);
    expect(msgEn).toContain('Troll');
    expect(msgFr).toContain('Troll');
    expect(dmgFr).toBe(2);
  });

  it('dealAttack decreases hp', () => {
    const creature = new Troll();
    const initialHp = creature.hp;

    creature.dealAttack(5);

    expect(creature.hp).toBe(initialHp - 5);
  });
});
