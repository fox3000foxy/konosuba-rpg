import * as fs from "fs";
import * as path from "path";
import sharp from "sharp";

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
const walkDir = (dir: string, callback: Function) => {
  fs.readdirSync(dir).forEach((f) => {
    const dirPath: string = path.join(dir, f);
    const isDirectory: boolean = fs.statSync(dirPath).isDirectory();
    return isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
  });
};

const convertPngToAvif = async (directory: string) => {
  console.log(`Starting conversion in: ${directory}`);

  walkDir(directory, async (filePath: string) => {
    if (filePath.toLowerCase().endsWith(".png") || filePath.toLowerCase().endsWith(".jpg") || filePath.toLowerCase().endsWith(".jpeg") || filePath.toLowerCase().endsWith(".webp")) {
      const avifPath = path.join(path.dirname(filePath), `${path.parse(filePath).name}.webp`);

      try {

        await sharp(filePath)
          .webp({
            lossless: false,
            effort: 4,
            quality: 90,
            // chromaSubsampling: "4:4:4"
          })
          .toFile(avifPath);


        fs.unlinkSync(filePath);
        console.log(`Converted and replaced: ${filePath} -> ${avifPath}`);
      } catch (err) {
        console.error(`Error processing ${filePath}:`, err);
      }
    }
  });
};

//const startingDirectory = "./assets";
convertPngToAvif("./assets");

