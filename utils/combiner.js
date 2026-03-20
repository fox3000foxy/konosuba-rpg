const combineImage = require('combine-image');
 
combineImage(['../assets/player/meg.gif','../assets/player/daku.gif'])
  .then((img) => {
    // Save image as file
    img.write('out.gif', () => console.log('done'));
  });