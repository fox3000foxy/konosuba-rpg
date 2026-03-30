import { decodeGameplayPayload } from '../../src/services/gameSessionService';

describe('gameSessionService', () => {
  it('keeps passthrough payloads for non-token ids', async () => {
    const payload = await decodeGameplayPayload('abc123/a4', 'user-1');
    expect(payload).toBe('abc123/a4');
  });

  it('rejects empty token payloads', async () => {
    const payload = await decodeGameplayPayload('gs.', 'user-1');
    expect(payload).toBeNull();
  });
});