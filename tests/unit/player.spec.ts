import { Kazuma } from '../../src/classes/Player';
import { PlayerAction } from '../../src/objects/enums/player/PlayerAction';

describe('Player mechanics', () => {
  it('initializes with expected default stats', () => {
    const player = new Kazuma();

    expect(player.hp).toEqual(player.hpMax);
    expect(player.name[0]).toEqual(Kazuma.name);
    expect(player.defending).toBe(false);
  });

  it('changes sprite set on attack/defend/hug action', () => {
    const player = new Kazuma();

    player.performAction(PlayerAction.Atk);
    expect(player.images[0]).toContain('02');

    player.performAction(PlayerAction.Def);
    expect(player.images[0]).toContain('03');

    player.performAction(PlayerAction.Hug);
    expect(player.images[0]).toContain('04');
  });
});
