const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const walkDir = (dir, callback) => {
  fs.readdirSync(dir).forEach((f) => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
  });
};

const convertPngToAvif = async (directory) => {
  console.log(`Starting conversion in: ${directory}`);

  walkDir(directory, async (filePath) => {
    if (filePath.toLowerCase().endsWith(".png") || filePath.toLowerCase().endsWith(".jpg") || filePath.toLowerCase().endsWith(".jpeg") || filePath.toLowerCase().endsWith(".webp")) {
      const avifPath = path.join(path.dirname(filePath), `${path.parse(filePath).name}.webp`);

      try {

        await sharp(filePath)
          .webp({
            lossless: false,
            effort: 4,
            quality: 90,
            chromaSubsampling: "4:4:4"
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
convertPngToAvif("./swordgame");
convertPngToAvif("./future");

