import { Context } from 'hono';
import { RawButton } from '../../enums/RawButton';
import { buildImageUrl } from '../../utils/imageUtils';

export async function handleDefaultButton(c: Context, payload: string, userID: string, lang: string, fr: boolean, monsterName: string, embedDescription: string[], buttons: RawButton[]) {
  const imageUrl = buildImageUrl(payload, lang);

  return c.json({
    type: 7,
    data: {
      embeds: [
        {
          image: { url: imageUrl },
          description: (fr ? `Entraînement contre ${monsterName}` : `Training vs ${monsterName}`) + (embedDescription.length > 0 ? `\n\n${embedDescription.join('\n')}` : ''),
          color: 0x2b2d31,
        },
      ],
      components: buttons,
    },
  });
}