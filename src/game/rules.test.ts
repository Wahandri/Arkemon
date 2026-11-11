import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateDamage,
  calculateCaptureChance,
  canCraft,
  executeCraft,
  getHarvestYield,
  updateSurvivalStats,
  addExperience,
  getElementMultiplier,
  calculateMountedSpeed,
  canRideCompanion,
  calculateDodgeRoll,
} from './rules';
import { Recipe, ItemStack, PlayerStats } from './types';

test('elemental multipliers match Pokemon rules', () => {
  assert.equal(getElementMultiplier('water', 'fire'), 1.5);
  assert.equal(getElementMultiplier('fire', 'grass'), 1.5);
  assert.equal(getElementMultiplier('fire', 'water'), 0.7);
  assert.equal(getElementMultiplier('electric', 'water'), 1.5);
  assert.equal(getElementMultiplier('normal', 'grass'), 1.0);
});

test('calculateDamage applies stats and elemental advantage', () => {
  const result = calculateDamage(20, 10, 'water', 'fire');
  assert.equal(result.isCrit, true);
  assert.ok(result.damage > 20);

  const weakResult = calculateDamage(20, 10, 'fire', 'water');
  assert.equal(weakResult.isCrit, false);
  assert.ok(weakResult.damage < result.damage);
});

test('calculateCaptureChance gives higher chance for lower HP', () => {
  const fullHpChance = calculateCaptureChance(100, 100, 1.0, 1);
  const lowHpChance = calculateCaptureChance(100, 15, 1.0, 1);
  assert.ok(lowHpChance > fullHpChance, 'Low HP creature must be easier to catch');
  assert.ok(lowHpChance >= 40, 'Near-death creature should have >= 40% catch rate');
});

test('crafting checks and deductions work accurately', () => {
  const axeRecipe: Recipe = {
    id: 'primitive_axe',
    resultItemId: 'stone_axe',
    resultCount: 1,
    category: 'tools',
    ingredients: [
      { itemId: 'wood', count: 3 },
      { itemId: 'stone', count: 2 },
    ],
  };

  const insufficientInv: ItemStack[] = [
    { itemId: 'wood', count: 2 },
    { itemId: 'stone', count: 5 },
  ];
  assert.equal(canCraft(axeRecipe, insufficientInv), false);

  const sufficientInv: ItemStack[] = [
    { itemId: 'wood', count: 5 },
    { itemId: 'stone', count: 2 },
  ];
  assert.equal(canCraft(axeRecipe, sufficientInv), true);

  const newInv = executeCraft(axeRecipe, sufficientInv);
  assert.deepEqual(newInv, [
    { itemId: 'wood', count: 2 },
    { itemId: 'stone_axe', count: 1 },
  ]);
});

test('harvest yield adapts to tool type', () => {
  const axeWood = getHarvestYield('tree', 'axe');
  assert.equal(axeWood.primaryItem, 'wood');
  assert.equal(axeWood.primaryCount, 3);

  const pickaxeStone = getHarvestYield('rock', 'pickaxe');
  assert.equal(pickaxeStone.primaryItem, 'flint');

  const bushYield = getHarvestYield('bush');
  assert.equal(bushYield.primaryItem, 'fiber');
  assert.equal(bushYield.secondaryItem, 'berry');
});

test('survival stats deplete and trigger starvation damage at 0 hunger', () => {
  const baseStats: PlayerStats = {
    hp: 100,
    maxHp: 100,
    stamina: 100,
    maxStamina: 100,
    hunger: 0,
    maxHunger: 100,
    torpor: 0,
    maxTorpor: 100,
    level: 1,
    xp: 0,
    xpToNextLevel: 50,
  };

  const { updatedStats, tookHungerDamage } = updateSurvivalStats(baseStats, 1.0, false, false);
  assert.equal(tookHungerDamage, true);
  assert.ok(updatedStats.hp < 100);
});

test('addExperience levels up player and increases max stats', () => {
  const baseStats: PlayerStats = {
    hp: 80,
    maxHp: 100,
    stamina: 70,
    maxStamina: 100,
    hunger: 90,
    maxHunger: 100,
    torpor: 0,
    maxTorpor: 100,
    level: 1,
    xp: 0,
    xpToNextLevel: 50,
  };

  const { stats, leveledUp } = addExperience(baseStats, 60);
  assert.equal(leveledUp, true);
  assert.equal(stats.level, 2);
  assert.equal(stats.maxHp, 110);
  assert.equal(stats.hp, 110);
});

test('calculateMountedSpeed grants speed bonus based on companion speed', () => {
  const normalSpeed = 7.0;
  const fastSpeed = calculateMountedSpeed(normalSpeed, 5.8);
  assert.ok(fastSpeed > normalSpeed, 'Mounted speed must be faster than base walking speed');

  assert.equal(canRideCompanion(true, 'captured'), true);
  assert.equal(canRideCompanion(false, 'captured'), false);
  assert.equal(canRideCompanion(true, 'wild'), false);

  const rollOk = calculateDodgeRoll(50);
  assert.equal(rollOk.canDodge, true);
  assert.equal(rollOk.staminaCost, 20);

  const rollFail = calculateDodgeRoll(10);
  assert.equal(rollFail.canDodge, false);
});
