import { type RawButton } from '../../src/objects/enums/RawButton';
import {
    decodeGameplayPayload,
    encodeGameplayButtons,
    extractBattleKeyFromPayload,
} from '../../src/services/gameSessionService';

function extractTokenPayload(customId: string): string {
  const colonIdx = customId.lastIndexOf(':');
  return colonIdx === -1 ? customId : customId.slice(0, colonIdx);
}

function getCustomId(component: unknown): string {
  if (
    component &&
    typeof component === 'object' &&
    'custom_id' in component &&
    typeof (component as { custom_id?: unknown }).custom_id === 'string'
  ) {
    return (component as { custom_id: string }).custom_id;
  }

  throw new Error('Expected button component with custom_id');
}

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

  it('invalidates previous turn buttons after next turn is generated', async () => {
    const userId = 'replay-user';
    const firstButtons: RawButton[] = [
      {
        type: 1,
        components: [
          {
            type: 2,
            label: 'Attack',
            style: 4,
            custom_id: `seed123/a:${userId}`,
          },
        ],
      },
    ];

    const secondButtons: RawButton[] = [
      {
        type: 1,
        components: [
          {
            type: 2,
            label: 'Defend',
            style: 3,
            custom_id: `seed123/ad:${userId}`,
          },
        ],
      },
    ];

    const firstEncoded = await encodeGameplayButtons(firstButtons);
    const secondEncoded = await encodeGameplayButtons(secondButtons);

    const firstTokenPayload = extractTokenPayload(
      getCustomId(firstEncoded[0].components[0])
    );
    const secondTokenPayload = extractTokenPayload(
      getCustomId(secondEncoded[0].components[0])
    );

    expect(firstTokenPayload.startsWith('gs.')).toBe(true);
    expect(secondTokenPayload.startsWith('gs.')).toBe(true);

    const stale = await decodeGameplayPayload(firstTokenPayload, userId);
    const fresh = await decodeGameplayPayload(secondTokenPayload, userId);

    expect(stale).toBeNull();
    expect(fresh).toBe('seed123/ad');
  });
});