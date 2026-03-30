import { Context } from 'hono';
import { BASE_URL } from '../../objects/config/constants';
import { Interaction } from '../../objects/enums/Interaction';
import { Lang } from '../../objects/enums/Lang';
import { RawButton } from '../../objects/enums/RawButton';
import { followUpTimeout } from '../../utils/discordUtils';
import { buildImageUrl } from '../../utils/imageUtils';

const GIFS_BY_PLAYER: Record<string, string> = {
  kazuma: 'kazuma',
  aqua: 'aqua',
  megumin: 'meg',
  darkness: 'daku',
};

export async function handleSpecialButton(
  interaction: Interaction,
  c: Context,
  payload: string,
  userID: string,
  lang: Lang,
  fr: boolean,
  monsterName: string,
  activePlayerName: string | null,
  embedDescription: string[],
  buttons: RawButton[]
) {
  const imageUrl = buildImageUrl(payload, lang, undefined, userID);
  const title = fr
    ? `Entraînement contre ${monsterName}`
    : `Training vs ${monsterName}`;
  const description =
    embedDescription.length > 0
      ? `${title}\n\n${embedDescription.join('\n')}`
      : title;

  followUpTimeout(
    interaction,
    {
      type: interaction.data.custom_id.split(':')[1] === userID ? 7 : 4,
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
    },
    2000
  );

  const playerName = activePlayerName || 'Kazuma';

  const specialAttackUrl = `${BASE_URL}/assets/player/${GIFS_BY_PLAYER[playerName.toLowerCase()] || 'kazuma'}.gif`;

  console.log(
    `Special attack triggered by ${playerName}, using animation from ${specialAttackUrl}`
  );
  return c.json({
    type: 7,
    data: {
      embeds: [
        {
          image: { url: specialAttackUrl },
          description,
          color: 0x2b2d31,
        },
      ],
      components: buttons,
    },
  });
}
