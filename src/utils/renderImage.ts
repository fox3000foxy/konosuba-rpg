import { Random } from './Random';
import { imageManifest } from './imageManifest';

let createCanvas: any;
let loadImage: any;

async function initializeCanvasBackend(): Promise<void> {
  console.log('Initializing canvas backend...');
  if (createCanvas && loadImage) return;

  const errors: string[] = [];

  try {
    const imp = await import('canvas');
    createCanvas = imp.createCanvas;
    loadImage = imp.loadImage;
    return;
  } catch (err) {
    errors.push(`canvas: ${err}`);
  }

  try {
    const imp = await import('@napi-rs/canvas');
    createCanvas = imp.createCanvas;
    loadImage = imp.loadImage;
    return;
  } catch (err) {
    errors.push(`@napi-rs/canvas: ${err}`);
  }

  throw new Error(
    'Unable to load canvas backend. Install either `canvas` or `@napi-rs/canvas` (recommended on Windows). Errors: ' + errors.join('; ')
  );
}

initializeCanvasBackend().catch((err) => {
  console.error('Error initializing canvas backend:', err);
  throw err;
});

// export async function preloadImages(): Promise<void> {
//   if (preloadPromise) return preloadPromise;

//   await initializeCanvasBackend();

//   const entries = Object.entries(imageManifest) as Array<[string, () => Promise<string>]>;
//   console.log(`Preloading ${entries.length} images...`);
//   preloadPromise = Promise.all(
//     entries.map(async ([key, loader]) => {
//       const uri = await loader();
//       const img = await loadImage(uri);
//       console.log(`Preloaded image: ${key}`);
//       images[key] = img;
//     })
//   ).then(() => undefined);

//   return preloadPromise;
// }

// preloadImages().catch((err) => {
//   console.error('Error preloading images:', err);
//   throw err;
// });

// function roundedImage(
//   ctx: CanvasRenderingContext2D,
//   x: number,
//   y: number,
//   width: number,
//   height: number,
//   radius: number
// ): void {
//   ctx.beginPath();
//   ctx.moveTo(x + radius, y);
//   ctx.lineTo(x + width - radius, y);
//   ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
//   ctx.lineTo(x + width, y + height - radius);
//   ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
//   ctx.lineTo(x + radius, y + height);
//   ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
//   ctx.lineTo(x, y + radius);
//   ctx.quadraticCurveTo(x, y, x + radius, y);
//   ctx.closePath();
// }

// class ImageLoader {
//   private cache: Record<string, Promise<any>> = {};
//   public images: Record<string, any> = {};
//   private loaders: Record<string, () => Promise<string>> = {};

//   constructor() {
//     this.images = new Proxy(this.images, {
//       get: (target, key: string) => {
//         if (typeof key !== "string") {
//           console.log("key is not a string:", key);
//           return target[key];
//         }
//         // déjà chargé → retourne direct
//         if (target[key]) {
//           console.log(`Image ${key} already loaded, returning from cache.`);
//           return target[key];
//         }

//         // déjà en cours → retourne la promise
//         // if (this.cache[key]) {
//         //   console.log(`Image ${key} is currently loading, returning existing promise.`);
//         //   return this.cache[key];
//         // }

//         // pas de loader → undefined
//         if (!this.loaders[key]) {
//           this.register(key, async () => {
//             //loadImage
//             const uri = imageManifest[key];
//             const img = await loadImage(uri);
//             console.log(`Loaded image: ${key}`);
//             console.log(img)
//             target[key] = img;
//             return img;
//           });
//         }

//         // sinon → on charge
//         // const promise = this.loaders[key]()
//         //   .then((uri) => loadImage(uri))
//         //   .then((img) => {
//         //     target[key] = img;
//         //     return img;
//         //   })
//         //   .catch((err) => {
//         //     console.error(`Error loading image ${key}:`, err);
//         //     throw err;
//         //   });

//         // this.cache[key] = promise;
//         // return promise;
//       },
//     });
//   }

//   register(key: string, loader: () => Promise<string>) {
//     this.loaders[key] = loader;
//   }
// }

const cache: Record<string, any> = {};
async function getImage(key: string): Promise<any> {
  if (cache[key]) return cache[key];
  const { uri } = await import(imageManifest[key]).then((mod) => (typeof mod === 'string' ? mod : mod.default))
    .catch((err) => {
      console.error(`Error importing image ${key} from manifest:`, err);
      return null;
    });
  if (!uri) {
    console.warn(`No URI found for image key: ${key}`);
    return null;
  }
  try {
    const img = await loadImage(uri);
    cache[key] = img;
    return img;
  } catch (err) {
    console.error(`Error loading image ${key} from URI ${uri}:`, err);
    return null;
  }
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
  if (!await getImage('board') || !await getImage('frameless')) {
    throw new Error('Images not loaded. Call preloadImages() first or verify imageManifest.');
  }

  const canvas = createCanvas(1000, 600);
  const ctx = canvas.getContext('2d');

  ctx.drawImage(await getImage('board'), 0, 0, canvas.width, canvas.height);

  creature.hp = Math.max(creature.hp, 0)
  if (creature.hp == 0)
    player.images = [
      ["character_kazuma04"],
      ["character_daku04"],
      ["character_meg04"],
      ["character_aqua04"]
    ];

  ctx.transform(-1, 0, 0, 1, canvas.width, 0);
  if (player.hp[3] > 0) ctx.drawImage(await getImage(player.images[3][0]), canvas.width - (canvas.width * 2 / 8) - 45, (canvas.height / 2 - (52) * 2) - 45, 184 * (await getImage(player.images[3][0])).width / (await getImage(player.images[3][0])).height, 184);
  if (player.hp[2] > 0) ctx.drawImage(await getImage(player.images[2][0]), canvas.width - (canvas.width * 2 / 8) + 75, (canvas.height / 2 - (52) * 2) - 45, 184 * (await getImage(player.images[2][0])).width / (await getImage(player.images[2][0])).height, 184);
  if (player.hp[1] > 0) ctx.drawImage(await getImage(player.images[1][0]), canvas.width - (canvas.width * 2 / 8) - 75, (canvas.height / 2 - (52) * 2) + 45, 184 * (await getImage(player.images[1][0])).width / (await getImage(player.images[1][0])).height, 184);
  if (player.hp[0] > 0) ctx.drawImage(await getImage(player.images[0][0]), canvas.width - (canvas.width * 2 / 8) + 50, (canvas.height / 2 - (52) * 2) + 45, 184 * (await getImage(player.images[0][0])).width / (await getImage(player.images[0][0])).height, 184);
  if (creature.hp > 0) ctx.drawImage(await getImage(creature.images[0]), (canvas.width * 1 / 8) - 140, canvas.height / 2 - 240, 400, 400);
  ctx.transform(-1, 0, 0, 1, canvas.width, 0);
  ctx.font = '20px "Ginto Nord Black"';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#000000';
  for (let i = 0; i < messages.length; i++) {
    ctx.fillStyle = '#666666'; ctx.fillText(messages[i], 104 + 1.5, (192 + i * 16) * 2 + 135 + 1.5);
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
  ctx.fillText(player.name[(player.currentPlayerId + 3) % 4] + " (" + Math.max(player.hp[(player.currentPlayerId + 3) % 4], 0) + " " + (lang == "fr" ? "PV" : "HP") + ")", 230 * 2 + 40, 55 * 2 - 38);

  ctx.drawImage([await getImage('thmb_in_1001100'), await getImage('thmb_in_1031100'), await getImage('thmb_in_1021100'), await getImage('thmb_in_1011100')][player.currentPlayerId], 40 * 1.5 + 10, 40 + 10 - 38, 50, 50)
  ctx.drawImage([await getImage('thmb_in_1001100'), await getImage('thmb_in_1031100'), await getImage('thmb_in_1021100'), await getImage('thmb_in_1011100')][(player.currentPlayerId + 1) % 4], 300 * 1.5 + 10, 40 - 38, 40, 40)
  ctx.drawImage([await getImage('thmb_in_1001100'), await getImage('thmb_in_1031100'), await getImage('thmb_in_1021100'), await getImage('thmb_in_1011100')][(player.currentPlayerId + 2) % 4], 300 * 1.5 + 10 + 200, 40 - 38, 40, 40)
  ctx.drawImage([await getImage('thmb_in_1001100'), await getImage('thmb_in_1031100'), await getImage('thmb_in_1021100'), await getImage('thmb_in_1011100')][(player.currentPlayerId + 3) % 4], 300 * 1.5 + 10, 70 + 10 - 38, 40, 40)
  
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
  ctx.fillStyle = '#ff0000';
  ctx.fillRect(healthPosX, healthPosY, healthSize[0], healthSize[1]);
  ctx.fillStyle = '#00FF00';
  ctx.fillRect(healthPosX, healthPosY, healthDelta, healthSize[1]);

  [healthPosX, healthPosY, healthEntity] = [234 * 2, 75 - 38, player];
  healthSize = [173, 8.5];
  healthDelta = Math.max(173 * healthEntity.hp[(player.currentPlayerId + 1) % 4] / healthEntity.hpMax[(player.currentPlayerId + 1) % 4], 0);
  ctx.fillStyle = '#ff0000';
  ctx.fillRect(healthPosX, healthPosY, healthSize[0], healthSize[1]);
  ctx.fillStyle = '#00FF00';
  ctx.fillRect(healthPosX, healthPosY, healthDelta, healthSize[1]);

  [healthPosX, healthPosY, healthEntity] = [332 * 2, 75 - 38, player];
  healthSize = [173, 8.5];
  healthDelta = Math.max(173.5 * healthEntity.hp[(player.currentPlayerId + 2) % 4] / healthEntity.hpMax[(player.currentPlayerId + 2) % 4], 0);
  ctx.fillStyle = '#ff0000';
  ctx.fillRect(healthPosX, healthPosY, healthSize[0], healthSize[1]);
  ctx.fillStyle = '#00FF00';
  ctx.fillRect(healthPosX, healthPosY, healthDelta, healthSize[1]);

  [healthPosX, healthPosY, healthEntity] = [234 * 2, 56.25 * 2 - 38, player];
  healthSize = [173, 8.5];
  healthDelta = Math.max(173.5 * healthEntity.hp[(player.currentPlayerId + 3) % 4] / healthEntity.hpMax[(player.currentPlayerId + 3) % 4], 0);
  ctx.fillStyle = '#ff0000';
  ctx.fillRect(healthPosX, healthPosY, healthSize[0], healthSize[1]);
  ctx.fillStyle = '#00FF00';
  ctx.fillRect(healthPosX, healthPosY, healthDelta, healthSize[1]);


  [healthPosX, healthPosY, healthEntity] = [286.5 * 2, 152 * 2 + 139, creature];
  healthSize = [173.5 * 2, 8.5 * 2];
  healthDelta = Math.max(173.5 * 2 * healthEntity.hp / healthEntity.hpMax, 0);
  ctx.fillStyle = '#ff0000';
  ctx.fillRect(healthPosX, healthPosY, healthSize[0], healthSize[1]);
  ctx.fillStyle = '#00FF00';
  ctx.fillRect(healthPosX, healthPosY, healthDelta, healthSize[1]);

  // Draw end state if applicable
  if (state) {
    // ctx.save();
    // roundedImage(ctx,0,0,canvas.width,canvas.height,100);
    // ctx.clip();
    ctx.drawImage(await getImage('end_' + state), 0, 0, canvas.width, canvas.height);
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
  // console.log(canvas.toDataURL());
  const dataURL = canvas.toDataURL();
  const base64Data = dataURL.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(base64Data, 'base64');
  return buffer;
}
