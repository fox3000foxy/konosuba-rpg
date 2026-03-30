import {
    decodeGameplayPayload,
    extractBattleKeyFromPayload,
} from '../../src/services/gameSessionService';

describe('gameSessionService', () => {
  it('keeps passthrough payloads for non-token ids', async () => {
    const payload = await decodeGameplayPayload('abc123/a4', 'user-1');
    expect(payload).toBe('abc123/a4');
  });

  it('rejects empty token payloads', async () => {
    const payload = await decodeGameplayPayload('gs.', 'user-1');
    expect(payload).toBeNull();
  });

  it('extracts the stable battle key from payload with actions', () => {
    expect(extractBattleKeyFromPayload('abc123/a4h10')).toBe('abc123');
  });

  it('extracts the stable battle key from payload with difficulty', () => {
    expect(extractBattleKeyFromPayload('abc123/a4h10[hard]')).toBe('abc123');
  });

  it('keeps payload as battle key when no action section exists', () => {
    expect(extractBattleKeyFromPayload('train.troll.seed123')).toBe(
      'train.troll.seed123'
    );
  });
});