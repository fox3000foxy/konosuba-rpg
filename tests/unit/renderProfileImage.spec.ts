import { CharacterKey } from '../../src/objects/enums/CharacterKey';
import { buildProfileSvg, getMonsterIconKey } from '../../src/utils/renderProfileImage';

describe('renderProfileImage helper', () => {
  it('resolves a monster icon key by name', () => {
    expect(getMonsterIconKey('Slime')).toMatch(/enemy_image_/);
    expect(getMonsterIconKey('UnknownMonster')).toBe('enemy_image_17700');
  });

  it('buildProfileSvg returns SVG with player and characters', async () => {
    const profile = { userId: 'u1', level: 3, xp: 270, gold: 120 };
    const progresses = [
      { userId: 'u1', characterKey: CharacterKey.Darkness, xp: 120, level: 2, affinity: 30 },
      { userId: 'u1', characterKey: CharacterKey.Megumin, xp: 100, level: 2, affinity: 40 },
      { userId: 'u1', characterKey: CharacterKey.Aqua, xp: 60, level: 1, affinity: 10 },
    ];
    const runSummary = { totalRuns: 4, killedMonsters: [{ name: 'Slime', count: 2 }] };

    const svg = await buildProfileSvg(
      profile,
      progresses,
      runSummary,
      2,
      5,
      false
    );

    expect(svg).toContain('Profile');
    expect(svg).toContain('Player stats');
    expect(svg).toContain('Level: 3');
    expect(svg).toContain('Darkness');
    expect(svg).toContain('Lv. 2 | XP 120');
  });
});
