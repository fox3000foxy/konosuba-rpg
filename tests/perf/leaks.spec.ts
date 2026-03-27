import { Random } from '../../src/classes/Random';
import { Lang } from '../../src/enums/Lang';
import processGame from '../../src/utils/processGame';

function heapUsedMb() {
  return process.memoryUsage().heapUsed / 1024 / 1024;
}

describe('Leak smoke test - simulation loop', () => {
  it('does not show strong heap growth across repeated runs', async () => {
    if (typeof global.gc !== 'function') {
      return;
    }

    global.gc();
    const before = heapUsedMb();

    const rounds = 1200;
    const moves = ['ATK', 'DEF', 'HUG', 'ATK', 'DEF'];
    for (let i = 0; i < rounds; i++) {
      await processGame(new Random(), moves, 'Dragon', Lang.English, false);
    }

    global.gc();
    const after = heapUsedMb();
    const delta = after - before;

    expect(delta).toBeLessThan(20);
  });
});
