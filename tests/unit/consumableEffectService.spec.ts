import Troll from '../../src/classes/mobs/Troll';
import { ItemId } from '../../src/objects/enums/ItemId';
import {
    applyConsumableEffect
} from '../../src/services/consumableEffectService';

describe('consumableEffectService', () => {
  it('applies potion healing to creature', () => {
    const troll = new Troll();
    const initialHp = troll.hp;
    const maxHp = troll.hpMax;

    // Damage the creature
    troll.dealAttack(maxHp / 2);
    const damagedHp = troll.hp;
    expect(damagedHp).toBeLessThan(initialHp);

    // Apply basic potion (25% heal)
    const result = applyConsumableEffect(ItemId.I20001000, troll);

    expect(result.applied).toBe(true);
    expect(result.healedAmount).toBeGreaterThan(0);
    expect(result.message.en).toContain('healed for');
    expect(result.message.fr).toContain('regagné');
    expect(result.targetName).toBe(troll.name[0]);
  });

  it('prevents healing above max hp', () => {
    const troll = new Troll();
    const maxHp = troll.hpMax;

    // Damage slightly
    troll.dealAttack(maxHp * 0.1);
    const prevHp = troll.hp;

    // Apply epic potion (75% heal)
    const result = applyConsumableEffect(ItemId.I20002007, troll);

    expect(result.applied).toBe(true);
    expect(troll.hp).toBeLessThanOrEqual(maxHp);
    expect(result.healedAmount).toBe(maxHp - prevHp);
  });

  it('returns error for non-existent item', () => {
    const troll = new Troll();
    const fakeId = '99999999' as ItemId;

    const result = applyConsumableEffect(fakeId, troll);

    expect(result.applied).toBe(false);
    expect(result.message.en).toContain('not found');
  });

  it('returns not implemented for non-potion types', () => {
    const troll = new Troll();

    // Use a Chrono item (not implemented yet)
    const result = applyConsumableEffect(ItemId.I20003000, troll);

    expect(result.applied).toBe(false);
    expect(result.message.en).toContain('not yet usable');
  });

  it('respects rarity-based healing amounts', () => {
    const trollBasic = new Troll();
    const trollGold = new Troll();
    const damageAmount = trollBasic.hpMax / 2;

    trollBasic.dealAttack(damageAmount);
    trollGold.dealAttack(damageAmount);

    // Apply different rarity potions
    const basicResult = applyConsumableEffect(ItemId.I20001000, trollBasic);
    const goldResult = applyConsumableEffect(ItemId.I20002000, trollGold);

    expect(basicResult.healedAmount!).toBeGreaterThan(0);
    expect(goldResult.healedAmount!).toBeGreaterThan(basicResult.healedAmount!);

    // Gold should heal more than basic
    const basicHealPercent = basicResult.healedAmount! / trollBasic.hpMax;
    const goldHealPercent = goldResult.healedAmount! / trollGold.hpMax;
    expect(goldHealPercent).toBeGreaterThan(basicHealPercent);
  });
});
