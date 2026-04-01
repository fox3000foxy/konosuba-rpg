import {
    computeLevelFromXp,
    getAffinityFactor,
    getAffinityStars,
    getLevelFactor,
} from '../../src/services/characterService';

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

  it('maps affinity points to stars with 20 points per star', () => {
    expect(getAffinityStars(-10)).toBe(0);
    expect(getAffinityStars(0)).toBe(0);
    expect(getAffinityStars(19)).toBe(0);
    expect(getAffinityStars(20)).toBe(1);
    expect(getAffinityStars(59)).toBe(2);
    expect(getAffinityStars(100)).toBe(5);
    expect(getAffinityStars(999)).toBe(5);
  });

  it('computes affinity factor with x1.2 per star', () => {
    expect(getAffinityFactor(0)).toBeCloseTo(1, 5);
    expect(getAffinityFactor(20)).toBeCloseTo(1.2, 5);
    expect(getAffinityFactor(40)).toBeCloseTo(1.44, 5);
    expect(getAffinityFactor(80)).toBeCloseTo(2.0736, 5);
    expect(getAffinityFactor(100)).toBeCloseTo(2.48832, 5);
  });
});
