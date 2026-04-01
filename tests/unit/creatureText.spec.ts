import AliveTree from '../../src/classes/mobs/AliveTree';
import Troll from '../../src/classes/mobs/Troll';
import { Lang } from '../../src/objects/enums/Lang';
import { getCreatureNameAndPrefix } from '../../src/utils/creatureText';

describe('creatureText', () => {
  it('uses French elision for vowel-starting names', () => {
    const tree = new AliveTree();

    expect(getCreatureNameAndPrefix(tree, Lang.French)).toEqual({
      name: 'Arbre vivant',
      prefix: "l'",
    });
  });

  it('keeps the expected article for non-elided names', () => {
    const troll = new Troll();

    expect(getCreatureNameAndPrefix(troll, Lang.French)).toEqual({
      name: 'Troll',
      prefix: 'le ',
    });
  });
});