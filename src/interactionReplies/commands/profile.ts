import { Context } from 'hono';
import {
  ensurePlayerProfile,
  getPlayerProfile,
} from '../../services/progressionService';

export async function handleProfileCommand(
  c: Context,
  userID: string,
  fr: boolean
) {
  await ensurePlayerProfile(userID);
  const profile = await getPlayerProfile(userID);

  if (!profile) {
    return c.json({
      type: 4,
      data: {
        content: fr
          ? 'Profil indisponible pour le moment. Reessaie plus tard.'
          : 'Profile is unavailable right now. Please try again later.',
        flags: 1 << 6,
      },
    });
  }

  const nextLevelXp = profile.level * 100;
  const description = fr
    ? `# Profil de <@${userID}>\n\n**Niveau**: ${profile.level}\n**XP**: ${profile.xp}/${nextLevelXp}\n**Or**: ${profile.gold}`
    : `# <@${userID}> profile\n\n**Level**: ${profile.level}\n**XP**: ${profile.xp}/${nextLevelXp}\n**Gold**: ${profile.gold}`;

  return c.json({
    type: 4,
    data: {
      embeds: [
        {
          description,
          color: 0x2b2d31,
        },
      ],
    },
  });
}
