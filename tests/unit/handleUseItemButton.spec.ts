/* eslint-disable @typescript-eslint/no-explicit-any */
import { handleUseItemButton } from '../../src/interactionReplies/buttons/handleUseItemButton';
import { Lang } from '../../src/objects/enums/Lang';

describe('handleUseItemButton', () => {
  it('returns ephemeral response without consumables', async () => {
    // Mock Hono context
    const mockContext = {
      json: jest.fn((data) => data),
    } as any;

    // Call with user that has no items
    await handleUseItemButton(mockContext, 'test-user-no-items', Lang.English, false);

    expect(mockContext.json).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 4,
        data: expect.objectContaining({
          flags: 1 << 6,
          content: expect.stringContaining('no consumables'),
        }),
      })
    );
  });

  it('displays French text when fr flag is true', async () => {
    const mockContext = {
      json: jest.fn((data) => data),
    } as any;

    await handleUseItemButton(mockContext, 'test-user', Lang.French, true);

    expect(mockContext.json).toHaveBeenCalled();
    const data = mockContext.json.mock.calls[0][0];
    
    // Should have French text even if no items
    expect(data.data.content.toLowerCase()).toContain('consomm');
  });

  it('sets ephemeral flag for responses', async () => {
    const mockContext = {
      json: jest.fn((data) => data),
    } as any;

    await handleUseItemButton(mockContext, 'test-user', Lang.English, false);

    const response = mockContext.json.mock.calls[0][0];
    expect(response.data.flags).toBe(1 << 6); // Ephemeral
  });
});
