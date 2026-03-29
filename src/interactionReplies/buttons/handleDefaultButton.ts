import { Context } from 'hono';
import { RawButton } from '../../enums/RawButton';
import { buildImageUrl } from '../../utils/imageUtils';

export async function handleDefaultButton(
  c: Context,
  payload: string,
  userID: string,
  lang: string,
  fr: boolean,
  monsterName: string,
  embedDescription: string[],
  buttons: RawButton[]
) {
  const imageUrl = buildImageUrl(payload, lang);
  const title = fr
    ? `Entraînement contre ${monsterName}`
    : `Training vs ${monsterName}`;
  const description =
    embedDescription.length > 0
      ? `${title}\n\n${embedDescription.join('\n')}`
      : title;

  return c.json({
    type: 7,
    data: {
      embeds: [
        {
          image: { url: imageUrl },
          description,
          color: 0x2b2d31,
        },
      ],
      components: buttons,
    },
  });
}
