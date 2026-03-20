import { CanvasRenderingContext2D, createCanvas, loadImage } from 'canvas';
import fs from 'fs';

const images: Record<string, any> = {};

function loadFolderImages(path: string): void {
  fs.readdirSync(path).forEach((file) => {
    const img = fs.readFileSync(`${path}/${file}`);
    images[file.slice(0, -4)] = img;
  });
}

loadFolderImages(__dirname + '/../swordgame/art');
loadFolderImages(__dirname + '/../assets/mobs');
loadFolderImages(__dirname + '/../assets/player');

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

  // Additional rendering logic here

  return canvas.toBuffer();
}
