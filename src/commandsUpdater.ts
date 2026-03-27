// import { Client } from 'discord.js';
// import fs from 'fs';

// const client = new Client({ intents: [] });

// if (!process.env.DISCORD_TOKEN) {
//   throw new Error("DISCORD_TOKEN manquant dans les variables d'environnement");
// }

// client.on('ready', async () => {
//   const commands = JSON.parse(fs.readFileSync(__dirname + '/commands.json', 'utf-8'));
//   await client.application?.commands.set(commands);
//   console.log('Commandes appliquées');
//   client.destroy();
// });

// client.login(process.env.DISCORD_TOKEN);

export const applicationCommandIndex = {
  applications: [
    {
      id: "1228368274488819792",
      name: "KonosubaRPG",
      description:
        "This is a pocket interaction game themed on Konosuba.\nType /start to play a game. /infos-player and /infos-monster are availiable too.\nBy **fox3000foxy**.",
      icon: "056324dadd8630bd56e85dc922c35215",
      bot_id: "1228368274488819792",
      flags: "8388608",
    },
  ],
  application_commands: [
    {
      id: "1228369685729247344",
      type: 1,
      application_id: "1228368274488819792",
      version: "1230139017845280828",
      name: "start",
      description: "Commencer une partie",
      dm_permission: true,
      contexts: [0, 1, 2],
      integration_types: [0, 1],
      global_popularity_rank: 1,
    },
    {
      id: "1228792471102820483",
      type: 1,
      application_id: "1228368274488819792",
      version: "1230139017845280830",
      name: "infos-monster",
      description: "Donne des précisions sur un monstre particulier",
      options: [
        {
          type: 3,
          name: "monster",
          description: "Le monstre que vous voulez afficher",
          required: true,
        },
      ],
      dm_permission: true,
      contexts: [0, 1, 2],
      integration_types: [0, 1],
      global_popularity_rank: 3,
    },
    {
      id: "1228813727462064240",
      type: 1,
      application_id: "1228368274488819792",
      version: "1230139017845280831",
      name: "infos-player",
      description: "Donne des précisions sur un monstre particulier",
      options: [
        {
          type: 4,
          name: "character",
          description: "Le monstre que vous voulez afficher",
          required: true,
          choices: [
            {
              name: "Kazuma",
              value: 0,
            },
            {
              name: "Darkness",
              value: 1,
            },
            {
              name: "Megumin",
              value: 2,
            },
            {
              name: "Aqua",
              value: 3,
            },
          ],
        },
      ],
      dm_permission: true,
      contexts: [0, 1, 2],
      integration_types: [0, 1],
      global_popularity_rank: 2,
    },
    {
      id: "1228849012946370560",
      type: 1,
      application_id: "1228368274488819792",
      version: "1230139017845280829",
      name: "train",
      description: "Permet de s'entraîner sur un monstre",
      options: [
        {
          type: 3,
          name: "monster",
          description: "Le monstre que vous voulez combattre",
          required: true,
        },
      ],
      dm_permission: true,
      contexts: [0, 1, 2],
      integration_types: [0, 1],
      global_popularity_rank: 4,
    },
  ],
  version: "1230139017845280832",
};
