import { buildBattleTitle } from '../../src/utils/battleTitle';

describe('buildBattleTitle', () => {
  it('keeps the player mention title when the payload is not a training run', () => {
    expect(buildBattleTitle('abc123/atk', true, 'user-1', 'Troll')).toBe(
      '**Partie de <@user-1>**'
    );
    expect(buildBattleTitle('abc123/atk', false, 'user-1', 'Troll')).toBe(
      '**<@user-1> game**'
    );
  });

  it('uses the monster title for training runs', () => {
    expect(buildBattleTitle('train.Troll.abcd', true, 'user-1', 'Troll')).toBe(
      'Entraînement contre Troll'
    );
    expect(buildBattleTitle('train.Troll.abcd', false, 'user-1', 'Troll')).toBe(
      'Training vs Troll'
    );
  });
});