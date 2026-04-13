import { type Context } from "hono";
import { type RawButton } from "../../objects/enums/RawButton";

function buildMenuComponents(userID: string, fr: boolean): RawButton[] {
  const owner = `:${userID}`;

  return [
    {
      type: 1,
      components: [
        {
          type: 2,
          style: 3,
          label: fr ? "Jouer maintenant" : "Play now",
          custom_id: `menu.start${owner}`,
        },
        {
          type: 2,
          style: 1,
          label: fr ? "Train Troll" : "Train Troll",
          custom_id: `menu.train.troll${owner}`,
        },
        {
          type: 2,
          style: 1,
          label: fr ? "Train aleatoire" : "Random train",
          custom_id: `menu.train.random${owner}`,
        },
      ],
    },
    {
      type: 1,
      components: [
        {
          type: 2,
          style: 2,
          label: fr ? "Infos persos" : "Player infos",
          custom_id: `menu.players${owner}`,
        },
        {
          type: 2,
          style: 2,
          label: fr ? "Infos monstres" : "Monster infos",
          custom_id: `menu.monsters${owner}`,
        },
        {
          type: 2,
          style: 2,
          label: fr ? "Aide" : "Help",
          custom_id: `menu.help${owner}`,
        },
      ],
    },
  ];
}

export async function handleMenuCommand(c: Context, userID: string, fr: boolean) {
  return c.json({
    type: 4,
    data: {
      embeds: [
        {
          description: fr ? `# Menu RPG\n\nChoisis une action pour lancer une partie rapidement ou consulter des infos.` : `# RPG Menu\n\nChoose an action to quickly start a game or inspect data.`,
          color: 0x2b2d31,
        },
      ],
      components: buildMenuComponents(userID, fr),
    },
  });
}
