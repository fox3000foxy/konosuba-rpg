import { Context } from "hono";
import { getLeaderboard } from "../../services/progressionService";

export async function handleLeaderboardCommand(c: Context, fr: boolean) {
  const leaderboard = await getLeaderboard(10);

  if (!leaderboard) {
    return c.json({
      type: 4,
      data: {
        content: fr ? "Classement indisponible pour le moment." : "Leaderboard is unavailable right now.",
        flags: 1 << 6,
      },
    });
  }

  if (leaderboard.length === 0) {
    return c.json({
      type: 4,
      data: {
        embeds: [
          {
            description: fr ? "# Classement\n\nAucun joueur classe pour le moment." : "# Leaderboard\n\nNo ranked players yet.",
            color: 0x2b2d31,
          },
        ],
      },
    });
  }

  const lines = leaderboard.map((entry, index) => {
    const rank = index + 1;
    return `**${rank}.** <@${entry.userId}> - Lv.${entry.level} - ${entry.xp} XP`;
  });

  return c.json({
    type: 4,
    data: {
      embeds: [
        {
          description: `${fr ? "# Classement" : "# Leaderboard"}\n\n${lines.join("\n")}`,
          color: 0x2b2d31,
        },
      ],
    },
  });
}
