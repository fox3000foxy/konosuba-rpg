import { Context } from 'hono';
import { Interaction } from '../objects/enums/Interaction';
import { Lang } from '../objects/enums/Lang';
import { verifySignature } from '../utils/discordUtils';

export async function handleInteractions(c: Context) {
  // const date1 = new Date();
  const body = await c.req.text();
  const isVerified = await verifySignature(c, body);
  if (!isVerified) {
    return c.text('Invalid signature', 401);
  }

  const interaction: Interaction = JSON.parse(body);
  const langString = interaction?.guild?.features?.includes('COMMUNITY') ? interaction?.guild_locale : interaction?.locale;
  const lang = Object.values(Lang).includes(langString) ? (langString as Lang) : Lang.English;
  const userID = interaction?.member?.user?.id || interaction.user.id;
  const fr = lang === Lang.French;

  // const date2 = new Date();
  // const executionTime = date2.getTime() - date1.getTime();
  // console.log(`Interaction received: type=${interaction.type}, userID=${userID}, lang=${lang}, executionTime=${executionTime}ms`)

  if (interaction.type === 1) {
    return c.json({ type: 1 });
  }

  if (interaction.type === 4) {
    const { handleAutocomplete } = await import('../interactionReplies/autocomplete/router.js');
    return handleAutocomplete(c, interaction, fr);
  }

  if (interaction.type === 2) {
    const { handleSlashCommand } = await import('../interactionReplies/commands/router.js');
    return handleSlashCommand(c, interaction, userID, lang, fr);
  }

  if (interaction.type === 3) {
    const { handleButtonInteraction } = await import('../interactionReplies/buttons/router.js');
    return handleButtonInteraction(c, interaction, userID, lang, fr);
  }

  return c.json({ error: 'Unknown interaction' }, 400);
}
