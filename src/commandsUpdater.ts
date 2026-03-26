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
