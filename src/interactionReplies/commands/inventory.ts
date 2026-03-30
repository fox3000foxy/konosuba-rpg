import { Context } from 'hono';
import { BASE_URL } from '../../objects/config/constants';
import { InteractionDataOption } from '../../objects/types/InteractionDataOption';

export async function handleInventoryCommand(
  c: Context,
  userID: string,
  fr: boolean,
  options?: InteractionDataOption[]
) {
  const mentioned = options?.find(option => option.name === 'mention')?.value;
  const targetUserId = mentioned ? String(mentioned) : userID;
  const lang = fr ? 'fr' : 'en';
  const imageUrl = `${BASE_URL}/inventory/${targetUserId}?lang=${lang}&v=${Date.now()}`;

  return c.json({
    type: 4,
    data: {
      embeds: [
        {
          description: fr
            ? `# Inventaire de <@${targetUserId}>`
            : `# <@${targetUserId}> inventory`,
          image: { url: imageUrl },
          color: 0x2b2d31,
        },
      ],
    },
  });
}