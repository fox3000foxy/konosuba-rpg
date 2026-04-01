import { Context } from 'hono';
import { BASE_URL } from '../../objects/config/constants';
import { InteractionDataOption } from '../../objects/types/InteractionDataOption';
import {
    ensurePlayerProfile,
    getCharacterProgresses,
    getCharacterStatsSnapshot
} from '../../services/progressionService';

export async function handleCharacterCommand(
  c: Context,
  userID: string,
  fr: boolean,
  options?: InteractionDataOption[]
) {
  const mentioned = options?.find(option => option.name === 'mention')?.value;
  const targetUserId = mentioned ? String(mentioned) : userID;

  if (targetUserId === userID) {
    await ensurePlayerProfile(userID);
  }

  const progresses = await getCharacterProgresses(targetUserId);
  const statsSnapshot = await getCharacterStatsSnapshot(targetUserId);

  if (!progresses || !statsSnapshot) {
    return c.json({
      type: 4,
      data: {
        content: fr
          ? `Profil de <@${targetUserId}> indisponible.`
          : `<@${targetUserId}> profile unavailable.`,
        flags: 1 << 6,
      },
    });
  }

  const affinityImageUrl = `${BASE_URL}/affinity/${targetUserId}?lang=${fr ? 'fr' : 'en'}`;

  return c.json({
    type: 4,
    data: {
      embeds: [
        {
          image: { url: affinityImageUrl },
          color: 0x2b2d31,
        },
      ],
    },
  });
}
