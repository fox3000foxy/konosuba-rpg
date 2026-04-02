import { Context } from 'hono';
import { BASE_URL } from '../../objects/config';
import { AchievementOverviewItem } from '../../objects/types/AchievementOverviewItem';
import { ensurePlayerProfile, getAchievementsOverview } from '../../services/progressionService';
import { addImageVersion } from '../../utils/imageUtils';

const ACHIEVEMENTS_PAGE_SIZE = 5;

export function buildAchievementsComponents(page: number, pageCount: number, userId: string, fr: boolean) {
  const canGoBack = page > 1;
  const canGoNext = page < pageCount;

  return [
    {
      type: 1,
      components: [
        {
          type: 2,
          label: fr ? 'Page precedente' : 'Previous page',
          style: 2,
          custom_id: `achievements_page:${page - 1}:${userId}`,
          disabled: !canGoBack,
        },
        {
          type: 2,
          label: fr ? 'Page suivante' : 'Next page',
          style: 1,
          custom_id: `achievements_page:${page + 1}:${userId}`,
          disabled: !canGoNext,
        },
      ],
    },
  ];
}

function getPagedAchievements(
  achievements: AchievementOverviewItem[],
  page: number
): {
  page: number;
  pageCount: number;
  items: AchievementOverviewItem[];
} {
  const pageCount = Math.max(1, Math.ceil(achievements.length / ACHIEVEMENTS_PAGE_SIZE));
  const safePage = Math.min(pageCount, Math.max(1, page));
  const start = (safePage - 1) * ACHIEVEMENTS_PAGE_SIZE;

  return {
    page: safePage,
    pageCount,
    items: achievements.slice(start, start + ACHIEVEMENTS_PAGE_SIZE),
  };
}

export async function handleAchievementsCommand(c: Context, userID: string, fr: boolean) {
  await ensurePlayerProfile(userID);
  const achievements = await getAchievementsOverview(userID, fr);

  if (!achievements) {
    return c.json({
      type: 4,
      data: {
        content: fr ? 'Achievements indisponibles pour le moment.' : 'Achievements are unavailable right now.',
        flags: 1 << 6,
      },
    });
  }

  const { page, pageCount, items } = getPagedAchievements(achievements, 1);
  const unlockedCount = achievements.filter(item => item.unlocked).length;
  const imageUrl = addImageVersion(`${BASE_URL}/achievements/${userID}?lang=${fr ? 'fr' : 'en'}&page=${page}`);

  const description = fr ? `# Achievements de <@${userID}>\n\nProgression: **${unlockedCount}/${achievements.length}**\nPage: **${page}/${pageCount}**` : `# <@${userID}> achievements\n\nProgress: **${unlockedCount}/${achievements.length}**\nPage: **${page}/${pageCount}**`;

  const components = buildAchievementsComponents(page, pageCount, userID, fr);

  return c.json({
    type: 4,
    data: {
      embeds: [
        {
          description,
          image: { url: imageUrl },
          color: 0x2b2d31,
        },
      ],
      components: items.length > 0 ? components : [],
    },
  });
}
