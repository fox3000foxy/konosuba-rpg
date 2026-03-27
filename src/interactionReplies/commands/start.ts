import { Context } from 'hono';
import { Lang } from '../../enums/Lang';
import { buildComponents } from '../../utils/componentsBuilder';
import { makeid } from '../../utils/idUtils';
import { buildImageUrl } from '../../utils/imageUtils';

export async function handleStartCommand(c: Context, userID: string, lang: Lang, fr: boolean) {
  const id = makeid(15);
  const imageUrl = buildImageUrl(id, lang);
  const buildedComponents = await buildComponents(id, userID, lang);
  const { embedDescription, buttons } = buildedComponents;
  return c.json({
    type: 4,
    data: {
      embeds: [{
        image: { url: imageUrl },
        description: (fr ? `**Partie de <@${userID}>**` : `**<@${userID}> game**`) + (embedDescription.length > 0 ? `\n\n${embedDescription.join('\n')}` : ''),
        color: 0x2b2d31,
      }],
      components: buttons,
    },
  });
}