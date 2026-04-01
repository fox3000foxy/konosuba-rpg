/* eslint-disable @typescript-eslint/no-explicit-any */
import { handleCharacterCommand } from '../../src/interactionReplies/commands/character';
import { CharacterKey } from '../../src/objects/enums/CharacterKey';
import * as progressionService from '../../src/services/progressionService';

jest.mock('../../src/services/progressionService', () => ({
  ensurePlayerProfile: jest.fn(),
  getCharacterProgresses: jest.fn(),
  getCharacterStatsSnapshot: jest.fn(),
}));

describe('handleCharacterCommand', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows character details for all characters when no specific option passed', async () => {
    const mockContext: any = { json: jest.fn() };

    (progressionService.getCharacterProgresses as jest.Mock).mockResolvedValue([
      { userId: 'u1', characterKey: CharacterKey.Darkness, xp: 50, level: 3, affinity: 10 },
      { userId: 'u1', characterKey: CharacterKey.Megumin, xp: 30, level: 2, affinity: 5 },
      { userId: 'u1', characterKey: CharacterKey.Aqua, xp: 40, level: 2, affinity: 7 },
    ]);

    (progressionService.getCharacterStatsSnapshot as jest.Mock).mockResolvedValue([
      { characterKey: CharacterKey.Darkness, level: 3, factor: 1.5 },
      { characterKey: CharacterKey.Megumin, level: 2, factor: 1.3 },
      { characterKey: CharacterKey.Aqua, level: 2, factor: 1.4 },
    ]);

    await handleCharacterCommand(mockContext, 'u1', true, []);

    expect(mockContext.json).toHaveBeenCalled();
    const response = mockContext.json.mock.calls[0][0];
    expect(response.data.embeds[0].description).toBeUndefined();
    expect(response.data.embeds[0].image.url).toContain('/affinity/u1?lang=fr');
  });

  it('shows only selected character when option supplied', async () => {
    const mockContext: any = { json: jest.fn() };

    (progressionService.getCharacterProgresses as jest.Mock).mockResolvedValue([
      { userId: 'u1', characterKey: CharacterKey.Darkness, xp: 80, level: 4, affinity: 12 },
      { userId: 'u1', characterKey: CharacterKey.Megumin, xp: 60, level: 3, affinity: 9 },
      { userId: 'u1', characterKey: CharacterKey.Aqua, xp: 70, level: 3, affinity: 10 },
    ]);

    (progressionService.getCharacterStatsSnapshot as jest.Mock).mockResolvedValue([
      { characterKey: CharacterKey.Darkness, level: 4, factor: 1.8 },
      { characterKey: CharacterKey.Megumin, level: 3, factor: 1.6 },
      { characterKey: CharacterKey.Aqua, level: 3, factor: 1.7 },
    ]);

    await handleCharacterCommand(mockContext, 'u1', false, [{ name: 'character', value: 'aqua' }]);

    const response = mockContext.json.mock.calls[0][0];
    expect(response.data.embeds[0].description).toBeUndefined();
    expect(response.data.embeds[0].image.url).toContain('/affinity/u1?lang=en');
  });
});
