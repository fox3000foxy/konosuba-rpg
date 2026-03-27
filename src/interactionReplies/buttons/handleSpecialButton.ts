import { Context } from 'hono';
import { Interaction } from '../../enums/Interaction';
import { Lang } from '../../enums/Lang';
import { RawButton } from '../../enums/RawButton';
import { followUpTimeout } from '../../utils/discordUtils';
import { buildImageUrl } from '../../utils/imageUtils';
import processGame from '../../utils/processGame';
import processUrl from '../../utils/processUrl';

export async function handleSpecialButton(interaction: Interaction, c: Context, payload: string, userID: string, lang: Lang, fr: boolean, monsterName: string, embedDescription: string[], buttons: RawButton[]) {
    followUpTimeout(interaction, {
        type: interaction.data.custom_id.split(":")[1] === userID ? 7 : 4,
        data: {
            embeds: [
                {
                    image: { url: buildImageUrl(payload, lang) },
                    description: (fr ? `Entraînement contre ${monsterName}` : `Training vs ${monsterName}`) + (embedDescription.length > 0 ? `\n\n${embedDescription.join('\n')}` : ''),
                    color: 0x2b2d31,
                },
            ],
            components: buttons,
        },
    }, 2000);

    const specialAttackLink = buildImageUrl(payload, lang).split('/konosuba-rpg/')[0];
    const [rand, moves, , monster] = processUrl(buildImageUrl(payload, lang));
    const { team } = await processGame(rand, moves, monster, lang, false);
    const langIndex = lang === Lang.French ? 1 : 0;
    const playerName = team.activePlayer?.name[langIndex] || 'Kazuma';

    const gifs: { [key: string]: string } = {
        kazuma: 'kazuma',
        aqua: 'aqua',
        megumin: 'meg',
        darkness: 'daku',
    };

    const specialAttackUrl = `${specialAttackLink}/assets/player/${gifs[playerName.toLowerCase()] || 'kazuma'}.gif`;

    console.log(`Special attack triggered by ${playerName}, using animation from ${specialAttackUrl}`);
    return c.json({
        type: 7,
        data: {
            embeds: [
                {
                    image: { url: specialAttackUrl },
                    description: (fr ? `Entraînement contre ${monsterName}` : `Training vs ${monsterName}`) + (embedDescription.length > 0 ? `\n\n${embedDescription.join('\n')}` : ''),
                    color: 0x2b2d31,
                },
            ],
            components: buttons,
        },
    });
}