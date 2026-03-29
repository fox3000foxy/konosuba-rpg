import { Context } from 'hono';
import {
    ensurePlayerProfile,
    getAchievementsOverview,
} from '../../services/progressionService';

export async function handleAchievementsCommand(
  c: Context,
  userID: string,
  fr: boolean
) {
  await ensurePlayerProfile(userID);
  const achievements = await getAchievementsOverview(userID, fr);

  if (!achievements) {
    return c.json({
      type: 4,
      data: {
        content: fr
          ? 'Achievements indisponibles pour le moment.'
          : 'Achievements are unavailable right now.',
        flags: 1 << 6,
      },
    });
  }

  const unlockedCount = achievements.filter(item => item.unlocked).length;
  const lines = achievements.map(item => {
    const icon = item.unlocked ? '✅' : '🔒';
    return `${icon} **${item.title}** - ${item.description}`;
  });

  const description = fr
    ? `# Achievements de <@${userID}>\n\nProgression: **${unlockedCount}/${achievements.length}**\n\n${lines.join('\n')}`
    : `# <@${userID}> achievements\n\nProgress: **${unlockedCount}/${achievements.length}**\n\n${lines.join('\n')}`;

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
