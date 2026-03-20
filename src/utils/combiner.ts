import combineImage from 'combine-image';

combineImage(['../assets/player/meg.gif', '../assets/player/daku.gif'])
  .then((img) => {
    img.write('out.gif', () => console.log('done'));
  });