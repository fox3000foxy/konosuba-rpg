import Player from '../../src/classes/Player';
import { Random } from '../../src/classes/Random';

describe('Player mechanics', () => {
  it('initializes with expected default stats', () => {
    const player = new Player(new Random(1));

    expect(player.hp).toEqual(player.hpMax);
    expect(player.name).toEqual(['Kazuma', 'Darkness', 'Megumin', 'Aqua']);
    expect(player.currentPlayerId).toBe(0);
    expect(player.defending).toBe(false);
  });

  it('changes sprite set on attack/defend/hug action', () => {
    const player = new Player(new Random(1));

    player.actionAtk('', 2);
    expect(player.images[2][0]).toContain('02');

    player.actionDef('', 1);
    expect(player.images[1][0]).toContain('03');

    player.actionHug('', 0);
    expect(player.images[0][0]).toContain('04');
  });
});
