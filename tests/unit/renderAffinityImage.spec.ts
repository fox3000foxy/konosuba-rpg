import {
    getAffinityStars,
    getAffinityTier,
} from '../../src/utils/renderAffinityImage';

describe('renderAffinityImage helpers', () => {
  it('maps affinity points to stars with 20-point thresholds', () => {
    expect(getAffinityStars(-4)).toBe(0);
    expect(getAffinityStars(0)).toBe(0);
    expect(getAffinityStars(19)).toBe(0);
    expect(getAffinityStars(20)).toBe(1);
    expect(getAffinityStars(59)).toBe(2);
    expect(getAffinityStars(60)).toBe(3);
    expect(getAffinityStars(80)).toBe(4);
    expect(getAffinityStars(100)).toBe(5);
    expect(getAffinityStars(999)).toBe(5);
  });

  it('maps stars to expected tiers', () => {
    expect(getAffinityTier(0)).toBe('basic');
    expect(getAffinityTier(1)).toBe('basic');
    expect(getAffinityTier(3)).toBe('basic');
    expect(getAffinityTier(4)).toBe('gold');
    expect(getAffinityTier(5)).toBe('epic');
  });
});
