import { Random } from '../../src/classes/Random';
import { GameState } from '../../src/objects/enums/GameState';
import { Lang } from '../../src/objects/enums/Lang';
import * as inventoryConsumptionService from '../../src/services/inventoryConsumptionService';
import processGame from '../../src/utils/processGame';

describe('processGame core loop', () => {
  it('returns giveup state when move is GIV', async () => {
    const game = await processGame(new Random(), ['GIV'], 'Troll', Lang.English, false);

    expect(game.state).toBe(GameState.Giveup);
    expect(Array.isArray(game.messages)).toBe(true);
  });

  it('accepts lowercase moves by normalizing them once', async () => {
    const game = await processGame(new Random(), ['giv'], 'Troll', Lang.English, false);

    expect(game.state).toBe(GameState.Giveup);
  });

  it('is deterministic for same seed, moves, and monster when rendering is disabled', async () => {
    const moves = ['ATK', 'DEF', 'HUG', 'ATK', 'ATK'];
    const g1 = await processGame(new Random(1), moves, 'Dragon', Lang.French, false);
    const g2 = await processGame(new Random(1), moves, 'Dragon', Lang.French, false);

    expect(g1.state).toBe(g2.state);
    expect(g1.messages).toEqual(g2.messages);
    expect(g1.team.players[0].hp).toEqual(g2.team.players[0].hp);
    expect(g1.creature.hp).toBe(g2.creature.hp);
    expect(g1.creature.love).toBe(g2.creature.love);
  });

  it('supports unknown monster key by falling back to Troll class', async () => {
    const game = await processGame(new Random(), ['ATK'], 'UnknownBoss', Lang.English, false);

    expect(game.creature).toBeDefined();
    expect(game.training).toBe(true);
    expect(typeof game.creature.hp).toBe('number');
  });

  it('handles all available mobs for one move without crashing', async () => {
    const monsters = [
      'AliveTree', 'AngryShaman', 'Austrich', 'Beldia', 'DarkBat', 'DarkBear',
      'DarkRat', 'DarkWolf', 'Destroyer', 'Dragon', 'GeneralWinter', 'Ghoul',
      'GiantEarthworm', 'GiantOctopus', 'Golem', 'GolemQueen', 'HansSlime',
      'Hydra', 'Kamachi', 'KingTroll', 'Knight', 'LoveBunny', 'MaidBot',
      'MedusaMan', 'Milim', 'Minotaur', 'PigWoman', 'Quomodo', 'Ruijerd',
      'Samurai', 'SharkMan', 'Slime', 'Squall', 'Sylvia', 'Toad', 'Troll',
      'UglySpirit', 'Vanir', 'Wizard',
    ];

    for (const monster of monsters) {
      const game = await processGame(new Random(), ['ATK'], monster, Lang.English, false);
      expect(game.creature.name.length).toBeGreaterThan(0);
    }
  });

  it('uses consumable items and persists inventory when userId is provided', async () => {
    // Mock the consumeInventoryItem function
    const mockConsume = jest.spyOn(inventoryConsumptionService, 'consumeInventoryItem')
      .mockResolvedValue(true);

    const game = await processGame(
      new Random(42),
      ['USE'],
      'Troll',
      Lang.English,
      false,
      undefined,
      undefined,
      'user-123' // userId
    );

    // Verify game state is valid
    expect(game.creature).toBeDefined();
    expect(game.messages.length).toBeGreaterThan(0);

    // Verify consumeInventoryItem was called with userId
    expect(mockConsume).toHaveBeenCalled();
    const callArgs = mockConsume.mock.calls[0];
    expect(callArgs[0]).toBe('user-123');
    expect(callArgs[1]).toBeDefined(); // itemId

    mockConsume.mockRestore();
  });

  it('allows USE action without userId (no inventory persistence)', async () => {
    const game = await processGame(
      new Random(42),
      ['USE'],
      'Troll',
      Lang.English,
      false
      // no userId provided
    );

    // Verify game state is valid (no crash when userId not provided)
    expect(game.creature).toBeDefined();
    expect(game.messages.length).toBeGreaterThan(0);
  });
});
