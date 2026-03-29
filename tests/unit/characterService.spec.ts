import { computeLevelFromXp, getLevelFactor } from '../../src/services/characterService';

describe('characterService level formulas', () => {
  it('computes level from xp with 100 xp per level', () => {
    expect(computeLevelFromXp(0)).toBe(1);
    expect(computeLevelFromXp(99)).toBe(1);
    expect(computeLevelFromXp(100)).toBe(2);
    expect(computeLevelFromXp(250)).toBe(3);
  });

  it('never returns level below 1', () => {
    expect(computeLevelFromXp(-100)).toBe(1);
  });

  it('computes factor with +0.2 per level', () => {
    expect(getLevelFactor(1)).toBeCloseTo(1.0, 5);
    expect(getLevelFactor(2)).toBeCloseTo(1.2, 5);
    expect(getLevelFactor(3)).toBeCloseTo(1.4, 5);
    expect(getLevelFactor(10)).toBeCloseTo(2.8, 5);
  });
});
