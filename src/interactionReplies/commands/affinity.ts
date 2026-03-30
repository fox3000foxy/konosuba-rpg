import { Context } from 'hono';
import { BASE_URL } from '../../objects/config/constants';
import { InteractionDataOption } from '../../objects/types/InteractionDataOption';
import { ensurePlayerProfile } from '../../services/progressionService';

export async function handleAffinityCommand(
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

  const lang = fr ? 'fr' : 'en';
  const imageUrl = `${BASE_URL}/affinity/${targetUserId}?lang=${lang}&v=${Date.now()}`;
  console.log(`Generated affinity image URL: ${imageUrl}`);
  return c.json({
    type: 4,
    data: {
      embeds: [
        {
          description: fr
            ? `# Affinite de <@${targetUserId}>`
            : `# <@${targetUserId}> affinity`,
          image: { url: imageUrl },
          color: 0x2b2d31,
        },
      ],
    },
  });
}
