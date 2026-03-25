import processUrl from '../../src/utils/processUrl';

describe('processUrl', () => {
  it('extracts valid moves and seed from URL path', () => {
    const [rand, moves, seed, monster] = processUrl('https://host/konosuba-rpg/en/ABC123/atk/def/hug');

    expect(rand).toBeDefined();
    expect(moves).toEqual(['ATK', 'DEF', 'HUG']);
    expect(seed).toBe('abc123');
    expect(monster).toBeNull();
  });

  it('extracts training monster query parameter', () => {
    const [, , , monster] = processUrl('https://host/konosuba-rpg/en/seed/atk/?training=true&monster=Troll');

    expect(monster).toBe('Troll');
  });

  it('sanitizes forbidden seed markers', () => {
    const [, , seed] = processUrl('https://host/konosuba-rpg/en/vieord123/atk');
    expect(seed).toBe('');
  });
});
