import { CanvasRenderingContext2D, createCanvas, loadImage } from 'canvas';
import fs from 'fs';
import { Random } from './Random';

const images: Record<string, any> = {};

function loadFolderImages(path: string): void {
  console.log(`Loading images from ${path}...`);
  fs.readdirSync(path).forEach((file) => {
    const img = fs.readFileSync(`${path}/${file}`);
    images[file.slice(0, -4)] = img;
    console.log(`Loaded image: ${file}`);
  });
}

loadFolderImages(process.cwd() + '/assets/swordgame/art');
loadFolderImages(process.cwd() + '/assets/mobs');
loadFolderImages(process.cwd() + '/assets/player');

const loadPromises = Object.keys(images).map((imgName) => {
  return new Promise<void>((resolve, reject) => {
    loadImage(images[imgName])
      .then((img) => {
        images[imgName] = img;
        resolve();
      })
      .catch((err) => {
        reject(err);
      });
  });
});
Promise.all(loadPromises);

function roundedImage(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

export default async function renderImage(
  state: any,
  messages: string[],
  player: any,
  creature: any,
  rand: Random,
  training = false,
  lang = 'en'
): Promise<Buffer> {
  const canvas = createCanvas(1000, 600);
  const ctx = canvas.getContext('2d');

  ctx.drawImage(images['board'], 0, 0, canvas.width, canvas.height);
  console.log(ctx)

  ctx.transform(-1, 0, 0, 1, canvas.width, 0);

  creature.hp = Math.max(creature.hp, 0)
  if (creature.hp == 0)
    player.images = [
      ["character_kazuma04"],
      ["character_daku04"],
      ["character_meg04"],
      ["character_aqua04"]
    ];

  if (player.hp[3] > 0) ctx.drawImage(images[player.images[3][0]], canvas.width - (canvas.width * 2 / 8) - 45, (canvas.height / 2 - (52) * 2) - 45, 184 * images[player.images[3][0]].width / images[player.images[3][0]].height, 184);
  if (player.hp[2] > 0) ctx.drawImage(images[player.images[2][0]], canvas.width - (canvas.width * 2 / 8) + 75, (canvas.height / 2 - (52) * 2) - 45, 184 * images[player.images[2][0]].width / images[player.images[2][0]].height, 184);
  if (player.hp[1] > 0) ctx.drawImage(images[player.images[1][0]], canvas.width - (canvas.width * 2 / 8) - 75, (canvas.height / 2 - (52) * 2) + 45, 184 * images[player.images[1][0]].width / images[player.images[1][0]].height, 184);
  if (player.hp[0] > 0) ctx.drawImage(images[player.images[0][0]], canvas.width - (canvas.width * 2 / 8) + 50, (canvas.height / 2 - (52) * 2) + 45, 184 * images[player.images[0][0]].width / images[player.images[0][0]].height, 184);
  if (creature.hp > 0) ctx.drawImage(images[creature.images[0]], (canvas.width * 1 / 8) - 140, canvas.height / 2 - 240, 400, 400);
  ctx.transform(1, 0, 0, 1, 0, 0);

  // Draw frame
  ctx.drawImage(images['frameless'], 0, 0, canvas.width, canvas.height);

  // Messages
  ctx.font = '20px "Ginto Nord Black"';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#000000';
  for (let i = 0; i < messages.length; i++) {
    ctx.fillStyle = '#666666';
    ctx.fillText(messages[i], 104 + 1.5, (192 + i * 16) * 2 + 135 + 1.5);
    ctx.fillStyle = '#000000';
    ctx.fillText(messages[i], 104, (192 + i * 16) * 2 + 135);
  }

  // Infoboxes
  ctx.font = '20px "Ginto Nord Black"';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#000000';
  ctx.fillText(player.name[player.currentPlayerId] + " (" + Math.max(player.hp[player.currentPlayerId], 0) + " " + (lang == "fr" ? "PV" : "HP") + ")", 40 * 2 + 40, 42 * 2 - 38);
  ctx.font = '18px "Ginto Nord Medium"';
  ctx.textAlign = 'right';
  ctx.fillText(`${player.attack[player.currentPlayerId][0]}-${player.attack[player.currentPlayerId][1]}ATK`, 210 * 2, 42 * 2 - 38);

  ctx.font = '12px "Ginto Nord Black"';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#000000';
  ctx.fillText(player.name[(player.currentPlayerId + 1) % 4] + " (" + Math.max(player.hp[(player.currentPlayerId + 1) % 4], 0) + " " + (lang == "fr" ? "PV" : "HP") + ")", 230 * 2 + 40, 36 * 2 - 38);

  ctx.font = '12px "Ginto Nord Black"';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#000000';
  ctx.fillText(player.name[(player.currentPlayerId + 2) % 4] + " (" + Math.max(player.hp[(player.currentPlayerId + 2) % 4], 0) + " " + (lang == "fr" ? "PV" : "HP") + ")", 230 * 2 + 40 + 200, 36 * 2 - 38);

  ctx.font = '12px "Ginto Nord Black"';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#000000';
  ctx.fillText(player.name[(player.currentPlayerId + 3) % 4] + " (" + Math.max(player.hp[(player.currentPlayerId + 1) % 4], 0) + " " + (lang == "fr" ? "PV" : "HP") + ")", 230 * 2 + 40, 55 * 2 - 38);

  ctx.drawImage([images['thmb_in_1001100'], images['thmb_in_1031100'], images['thmb_in_1021100'], images['thmb_in_1011100']][player.currentPlayerId], 40 * 1.5 + 10, 40 + 10 - 38, 50, 50)
  ctx.drawImage([images['thmb_in_1001100'], images['thmb_in_1031100'], images['thmb_in_1021100'], images['thmb_in_1011100']][(player.currentPlayerId + 1) % 4], 300 * 1.5 + 10, 40 - 38, 40, 40)
  ctx.drawImage([images['thmb_in_1001100'], images['thmb_in_1031100'], images['thmb_in_1021100'], images['thmb_in_1011100']][(player.currentPlayerId + 2) % 4], 300 * 1.5 + 10 + 200, 40 - 38, 40, 40)
  ctx.drawImage([images['thmb_in_1001100'], images['thmb_in_1031100'], images['thmb_in_1021100'], images['thmb_in_1011100']][(player.currentPlayerId + 3) % 4], 300 * 1.5 + 10, 70 + 10 - 38, 40, 40)

  ctx.font = '20px "Ginto Nord Black"';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#000000';
  ctx.fillText(creature.name + " (" + creature.hp + " " + (lang == "fr" ? "PV" : "HP") + ")", 288 * 2, 148 * 2 + 139);
  ctx.font = '18px "Ginto Nord Medium"';
  ctx.textAlign = 'right';
  ctx.fillText(`${creature.attack[0]}-${creature.attack[1]}ATK`, 460 * 2, 148 * 2 + 139);

  // Health bars
  let [healthPosX, healthPosY, healthEntity] = [38 * 2, 46.25 * 2 - 38, player];
  let healthSize = [173.5 * 2, 8.5 * 2];
  let healthDelta = Math.max(173.5 * 2 * healthEntity.hp[player.currentPlayerId] / healthEntity.hpMax[player.currentPlayerId], 0);
  ctx.fillStyle = '#00FF00';
  ctx.fillRect(healthPosX, healthPosY, healthDelta, healthSize[1]);

  [healthPosX, healthPosY, healthEntity] = [234 * 2, 75 - 38, player];
  healthSize = [173, 8.5];
  healthDelta = Math.max(173 * healthEntity.hp[(player.currentPlayerId + 1) % 4] / healthEntity.hpMax[(player.currentPlayerId + 1) % 4], 0);
  ctx.fillStyle = '#00FF00';
  ctx.fillRect(healthPosX, healthPosY, healthDelta, healthSize[1]);

  [healthPosX, healthPosY, healthEntity] = [332 * 2, 75 - 38, player];
  healthSize = [173, 8.5];
  healthDelta = Math.max(173.5 * healthEntity.hp[(player.currentPlayerId + 2) % 4] / healthEntity.hpMax[(player.currentPlayerId + 2) % 4], 0);
  ctx.fillStyle = '#00FF00';
  ctx.fillRect(healthPosX, healthPosY, healthDelta, healthSize[1]);

  [healthPosX, healthPosY, healthEntity] = [234 * 2, 56.25 * 2 - 38, player];
  healthSize = [173, 8.5];
  healthDelta = Math.max(173.5 * healthEntity.hp[(player.currentPlayerId + 3) % 4] / healthEntity.hpMax[(player.currentPlayerId + 3) % 4], 0);
  ctx.fillStyle = '#00FF00';
  ctx.fillRect(healthPosX, healthPosY, healthDelta, healthSize[1]);


  [healthPosX, healthPosY, healthEntity] = [286.5 * 2, 152 * 2 + 139, creature];
  healthSize = [173.5 * 2, 8.5 * 2];
  healthDelta = Math.max(173.5 * 2 * healthEntity.hp / healthEntity.hpMax, 0);
  ctx.fillStyle = '#00FF00';
  ctx.fillRect(healthPosX, healthPosY, healthDelta, healthSize[1]);

  // Draw end state if applicable
  if (state) {
    // ctx.save();
    // roundedImage(ctx,0,0,canvas.width,canvas.height,100);
    // ctx.clip();
    ctx.drawImage(images['end_' + state], 0, 0, canvas.width, canvas.height);
    // ctx.restore();
    ctx.font = '32px "Ginto Nord Medium"';
    ctx.fillStyle = '#FFFFFF';
    const msg = {
      "good": lang == "fr" ? `Vous avez réussi à vaincre le ${creature.name} !\nArriverez vous a faire mieux ?` : `You won from ${creature.name} !\nWill you get it better ?`,
      "bad": lang == "fr" ? "L'adversaire vous a vaincu...\nRententez votre chance." : "The adversary has defeated you...\nRetry.",
      "giveup": lang == "fr" ? "Vous avez déclaré forfait.\nPeut être une prochaine fois ?" : "You have withdrawn.\nMaybe next time?",
      "best": lang == "fr" ? `Vous avez réussi à être ami avec le ${creature.name} !\nPourrez vous être ami avec d'autres créatures ?` : `You managed to be friends with the ${creature.name}!\nCan you be friends with other creatures?`,
    }[state as "good" | "bad" | "giveup" | "best"];
    const lines = msg.split("\n");
    for (let i = 0; i < lines.length; i++) {
      ctx.textAlign = "center";
      ctx.fillText(lines[i], canvas.width / 2, (135 + i * 15) * 2 + 100);
    }
  }

  // Return the image to the client

  return canvas.toBuffer();
}
