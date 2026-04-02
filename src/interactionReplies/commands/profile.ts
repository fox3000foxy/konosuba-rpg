import { Context } from 'hono';
import { BASE_URL } from '../../objects/config';
import { InteractionDataOption } from '../../objects/types/InteractionDataOption';
import {
    ensurePlayerProfile,
    getPlayerProfile,
} from '../../services/progressionService';
import { addImageVersion } from '../../utils/imageUtils';

export async function handleProfileCommand(
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

  const profile = await getPlayerProfile(targetUserId);

  if (!profile) {
    return c.json({
      type: 4,
      data: {
        content: fr
          ? `Profil de <@${targetUserId}> introuvable pour le moment.`
          : `<@${targetUserId}> profile is unavailable right now.`,
        flags: 1 << 6,
      },
    });
  }

  const profileImageUrl = addImageVersion(
    `${BASE_URL}/profile/${targetUserId}?lang=${fr ? 'fr' : 'en'}`
  );

  const description = fr
    ? `# Profil de <@${targetUserId}>`
    : `# <@${targetUserId}> profile`;

  return c.json({
    type: 4,
    data: {
      embeds: [
        {
          description,
          image: { url: profileImageUrl },
          color: 0x2b2d31,
        },
      ],
    },
  });
}
