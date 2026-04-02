import Dragon from '../../src/classes/mobs/Dragon';
import KingTroll from '../../src/classes/mobs/KingTroll';
import { Lang } from '../../src/objects/enums/Lang';
import { getBattleMonsterNames } from '../../src/utils/componentsBuilder';

describe('getBattleMonsterNames', () => {
  it('separates localized display name from record name', () => {
    const dragon = new Dragon();

    expect(getBattleMonsterNames(dragon, Lang.English)).toEqual({
      displayName: 'dragon',
      recordName: 'dragon',
    });
    expect(getBattleMonsterNames(dragon, Lang.French)).toEqual({
      displayName: 'dragon',
      recordName: 'dragon',
    });
  });

  it('uses the localized monster name when available', () => {
    const kingTroll = new KingTroll();

    expect(getBattleMonsterNames(kingTroll, Lang.English)).toEqual({
      displayName: 'king troll',
      recordName: 'King Troll',
    });
    expect(getBattleMonsterNames(kingTroll, Lang.French)).toEqual({
      displayName: 'roi troll',
      recordName: 'Roi Troll',
    });
  });
});