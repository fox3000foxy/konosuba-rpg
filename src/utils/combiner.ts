import combineImage from 'combine-image';

combineImage([process.cwd() + '/assets/player/meg.gif', process.cwd() + '/assets/player/daku.gif'])
  .then((img) => {
    img.write('out.gif', () => console.log('done'));
  });