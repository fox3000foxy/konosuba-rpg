import { Random } from '../../src/classes/Random';

describe('Random', () => {
  it('produces deterministic sequence for the same seed', () => {
    const seed = 1337;
    const r1 = new Random(seed);
    const r2 = new Random(seed);

    const seq1 = Array.from({ length: 20 }, () => r1.next());
    const seq2 = Array.from({ length: 20 }, () => r2.next());

    expect(seq1).toEqual(seq2);
  });

  it('randint stays in [min, max)', () => {
    const r = new Random();

    for (let i = 0; i < 200; i++) {
      const n = r.randint(5, 10);
      expect(n).toBeGreaterThanOrEqual(5);
      expect(n).toBeLessThan(10);
    }
  });

  it('choice returns an existing item', () => {
    const r = new Random();
    const pool = ['atk', 'def', 'hug'];

    for (let i = 0; i < 50; i++) {
      expect(pool).toContain(r.choice(pool));
    }
  });
});
