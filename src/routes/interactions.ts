import { Context } from 'hono';
import { handleAutocomplete } from '../interactionReplies/autocomplete/router';
import { handleButtonInteraction } from '../interactionReplies/buttons/router';
import { handleSlashCommand } from '../interactionReplies/commands/router';
import { Interaction } from '../objects/enums/Interaction';
import { Lang } from '../objects/enums/Lang';
import { verifySignature } from '../utils/discordUtils';

export async function handleInteractions(c: Context) {
  const body = await c.req.text();
  const isVerified = await verifySignature(c, body);
  if (!isVerified) {
    return c.text('Invalid signature', 401);
  }

  const interaction: Interaction = JSON.parse(body);
  const langString = interaction?.guild?.features?.includes('COMMUNITY')
    ? interaction?.guild_locale
    : interaction?.locale;
  const lang = Object.values(Lang).includes(langString)
    ? (langString as Lang)
    : Lang.English;
  const userID = interaction?.member?.user?.id || interaction.user.id;
  const fr = lang === Lang.French;

  if (interaction.type === 1) {
    return c.json({ type: 1 });
  }

  if (interaction.type === 4) {
    return handleAutocomplete(c, interaction, fr);
  }

  if (interaction.type === 2) {
    return handleSlashCommand(c, interaction, userID, lang, fr);
  }

  if (interaction.type === 3) {
    return handleButtonInteraction(c, interaction, userID, lang, fr);
  }

  return c.json({ error: 'Unknown interaction' }, 400);
}