import { Kazuma } from '../../src/classes/Player';
import { ItemId } from '../../src/objects/enums/ItemId';
import {
  applyConsumableEffect
} from '../../src/services/consumableEffectService';

describe('consumableEffectService', () => {
  it('applies potion healing to player', () => {
    const player = new Kazuma();
    const initialHp = player.hp;
    const maxHp = player.hpMax;

    // Damage the player
    player.hp -= Math.floor(maxHp / 2);
    const damagedHp = player.hp;
    expect(damagedHp).toBeLessThan(initialHp);

    // Apply basic potion (25% heal)
    const result = applyConsumableEffect(ItemId.I20001000, player);

    expect(result.applied).toBe(true);
    expect(result.healedAmount).toBeGreaterThan(0);
    expect(result.message.en).toContain('healed for');
    expect(result.message.fr).toContain('regagné');
    expect(result.targetName).toBe(player.name[0]);
  });

  it('prevents healing above max hp', () => {
    const player = new Kazuma();
    const maxHp = player.hpMax;

    // Damage slightly
    player.hp -= Math.floor(maxHp * 0.1);
    const prevHp = player.hp;

    // Apply epic potion (75% heal)
    const result = applyConsumableEffect(ItemId.I20002007, player);

    expect(result.applied).toBe(true);
    expect(player.hp).toBeLessThanOrEqual(maxHp);
    expect(result.healedAmount).toBe(maxHp - prevHp);
  });

  it('returns error for non-existent item', () => {
    const player = new Kazuma();
    const fakeId = '99999999' as ItemId;

    const result = applyConsumableEffect(fakeId, player);

    expect(result.applied).toBe(false);
    expect(result.message.en).toContain('not found');
  });

  it('applies all consumable types successfully', () => {
    const player = new Kazuma();

    // Test Chrono (I20003000)
    const chronoResult = applyConsumableEffect(ItemId.I20003000, player);
    expect(chronoResult.applied).toBe(true);
    expect(chronoResult.message.en).toContain('max HP');

    // Test Stone (I20004001)
    const stoneResult = applyConsumableEffect(ItemId.I20004001, player);
    expect(stoneResult.applied).toBe(true);
    expect(stoneResult.message.en).toContain('defense');

    // Test Scroll (I20004008 - epic scroll)
    const scrollResult = applyConsumableEffect(ItemId.I20004008, player);
    expect(scrollResult.applied).toBe(true);
    expect(scrollResult.message.en).toContain('attack');
  });

  it('applies chrono effect to increase max hp', () => {
    const player = new Kazuma();
    const initialMaxHp = player.hpMax;

    // Damage the player
    player.hp -= Math.floor(initialMaxHp * 0.3);
    const healthRatio = player.hp / initialMaxHp;

    // Apply gold chrono (+20% max hp)
    const result = applyConsumableEffect(ItemId.I20003000, player);

    expect(result.applied).toBe(true);
    expect(result.maxHpIncrease).toBeGreaterThan(0);
    expect(player.hpMax).toBeGreaterThan(initialMaxHp);
    expect(result.message.en).toContain('gained');
    expect(result.message.en).toContain('max HP');
    // Health ratio should be maintained approximately
    expect(player.hp / player.hpMax).toBeCloseTo(healthRatio, 0);
  });

  it('applies stone effect to increase defense', () => {
    const player = new Kazuma();
    const initialDefense = player.defense;

    // Apply epic stone (+3 defense)
    const result = applyConsumableEffect(ItemId.I20004001, player);

    expect(result.applied).toBe(true);
    expect(result.defenseIncrease).toBe(3);
    expect(player.defense).toBe(initialDefense + 3);
    expect(result.message.en).toContain('defense');
  });

  it('applies scroll effect to increase attack', () => {
    const player = new Kazuma();
    const initialAttackMin = player.attack[0];
    const initialAttackMax = player.attack[1];

    // Apply epic scroll (+3 attack)
    const result = applyConsumableEffect(ItemId.I20004008, player);

    expect(result.applied).toBe(true);
    expect(result.attackIncrease).toBe(3);
    expect(player.attack[0]).toBe(initialAttackMin + 3);
    expect(player.attack[1]).toBe(initialAttackMax + 3);
    expect(result.message.en).toContain('attack');
  });

  it('maintains attack min <= attack max when applying scroll', () => {
    const player = new Kazuma();
    // Set attack to small values
    player.attack = [0, 1];

    const result = applyConsumableEffect(ItemId.I20004008, player);

    expect(result.applied).toBe(true);
    expect(player.attack[0]).toBeLessThanOrEqual(player.attack[1]);
  });

  it('respects rarity-based healing amounts', () => {
    const playerBasic = new Kazuma();
    const playerGold = new Kazuma();
    const damageAmount = Math.floor(playerBasic.hpMax / 2);

    playerBasic.hp -= damageAmount;
    playerGold.hp -= damageAmount;

    // Apply different rarity potions
    const basicResult = applyConsumableEffect(ItemId.I20001000, playerBasic);
    const goldResult = applyConsumableEffect(ItemId.I20002000, playerGold);

    expect(basicResult.healedAmount!).toBeGreaterThan(0);
    expect(goldResult.healedAmount!).toBeGreaterThan(basicResult.healedAmount!);

    // Gold should heal more than basic
    const basicHealPercent = basicResult.healedAmount! / playerBasic.hpMax;
    const goldHealPercent = goldResult.healedAmount! / playerGold.hpMax;
    expect(goldHealPercent).toBeGreaterThan(basicHealPercent);
  });
});
