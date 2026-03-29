import { performance } from 'node:perf_hooks';
import { Random } from '../../src/classes/Random';
import { Lang } from '../../src/objects/enums/Lang';
import processGame from '../../src/utils/processGame';


describe('Performance - processGame simulation only', () => {
  it('runs batch simulations under a practical threshold', async () => {
    const iterations = 1;
    const moves = ['ATK', 'DEF', 'HUG', 'ATK', 'ATK', 'DEF', 'HUG'];

    const t0 = performance.now();
    for (let i = 0; i < iterations; i++) {
      await processGame(new Random(), moves, 'Troll', Lang.English);
    }
    const elapsedMs = performance.now() - t0;

    expect(elapsedMs).toBeLessThan(12000);
  });
});
