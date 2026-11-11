import { ElementType, ItemStack, Recipe, PlayerStats } from './types';

// Elemental chart (Fire > Grass, Grass > Water, Water > Fire, Electric > Water, Rock > Fire/Flying, Flying > Grass)
export const ELEMENT_MULTIPLIERS: Record<ElementType, Partial<Record<ElementType, number>>> = {
  fire: { grass: 1.5, water: 0.7, rock: 0.7 },
  grass: { water: 1.5, fire: 0.7, flying: 0.7 },
  water: { fire: 1.5, grass: 0.7, rock: 1.5 },
  electric: { water: 1.5, grass: 0.7 },
  rock: { fire: 1.5, flying: 1.5 },
  flying: { grass: 1.5, rock: 0.7, electric: 0.7 },
  normal: {},
};

export function getElementMultiplier(attacker: ElementType, defender: ElementType): number {
  return ELEMENT_MULTIPLIERS[attacker]?.[defender] ?? 1.0;
}

export function calculateDamage(
  attackerAtk: number,
  defenderDef: number,
  attackerElement: ElementType = 'normal',
  defenderElement: ElementType = 'normal'
): { damage: number; isCrit: boolean; multiplier: number } {
  const multiplier = getElementMultiplier(attackerElement, defenderElement);
  const baseDmg = Math.max(1, attackerAtk - Math.floor(defenderDef * 0.4));
  // deterministic or controlled variance
  const isCrit = multiplier > 1.0;
  const finalDamage = Math.max(1, Math.round(baseDmg * multiplier));
  return { damage: finalDamage, isCrit, multiplier };
}

/**
 * Calculates capture chance percentage (0 - 100).
 * Ark / Palworld style: lower creature HP drastically increases catch chance.
 * Higher ball quality increases it.
 */
export function calculateCaptureChance(
  maxHp: number,
  currentHp: number,
  orbBonus: number = 1.0,
  creatureLevel: number = 1
): number {
  const hpRatio = Math.max(0.01, currentHp / Math.max(1, maxHp));
  // Weakened pokemon (e.g. 10% hp remaining) gives massive boost
  const baseChance = (1 - hpRatio * 0.75) * 60;
  const levelPenalty = Math.max(0, (creatureLevel - 1) * 3);
  const rawChance = (baseChance - levelPenalty) * orbBonus;
  return Math.min(99, Math.max(5, Math.round(rawChance)));
}

/**
 * Checks if the player has all required ingredients in their inventory.
 */
export function canCraft(recipe: Recipe, inventory: ItemStack[]): boolean {
  for (const ingredient of recipe.ingredients) {
    const item = inventory.find((inv) => inv.itemId === ingredient.itemId);
    if (!item || item.count < ingredient.count) {
      return false;
    }
  }
  return true;
}

/**
 * Deducts recipe ingredients from inventory and adds crafted item.
 * Returns a new inventory array.
 */
export function executeCraft(recipe: Recipe, inventory: ItemStack[]): ItemStack[] {
  if (!canCraft(recipe, inventory)) {
    return inventory;
  }

  const newInventory: ItemStack[] = inventory.map((slot) => ({ ...slot }));

  for (const ingredient of recipe.ingredients) {
    let remaining = ingredient.count;
    for (const slot of newInventory) {
      if (slot.itemId === ingredient.itemId) {
        const take = Math.min(slot.count, remaining);
        slot.count -= take;
        remaining -= take;
        if (remaining <= 0) break;
      }
    }
  }

  // Filter out depleted items
  const filtered = newInventory.filter((slot) => slot.count > 0);

  // Add crafted item
  const existingSlot = filtered.find((slot) => slot.itemId === recipe.resultItemId);
  if (existingSlot) {
    existingSlot.count += recipe.resultCount;
  } else {
    filtered.push({ itemId: recipe.resultItemId, count: recipe.resultCount });
  }

  return filtered;
}

/**
 * Calculates harvest yields based on node type and equipped tool.
 */
export function getHarvestYield(
  nodeType: 'tree' | 'rock' | 'bush' | 'boulder',
  toolType?: 'axe' | 'pickaxe' | 'fists' | 'spear'
): { primaryItem: string; primaryCount: number; secondaryItem?: string; secondaryCount?: number } {
  if (nodeType === 'tree') {
    if (toolType === 'axe') {
      return { primaryItem: 'wood', primaryCount: 3, secondaryItem: 'thatch', secondaryCount: 2 };
    }
    if (toolType === 'pickaxe') {
      return { primaryItem: 'thatch', primaryCount: 4, secondaryItem: 'wood', secondaryCount: 1 };
    }
    return { primaryItem: 'wood', primaryCount: 1, secondaryItem: 'thatch', secondaryCount: 1 };
  }

  if (nodeType === 'rock' || nodeType === 'boulder') {
    if (toolType === 'pickaxe') {
      return { primaryItem: 'flint', primaryCount: 3, secondaryItem: 'stone', secondaryCount: 2 };
    }
    if (toolType === 'axe') {
      return { primaryItem: 'stone', primaryCount: 3, secondaryItem: 'flint', secondaryCount: 1 };
    }
    return { primaryItem: 'stone', primaryCount: 1 };
  }

  // bush
  return { primaryItem: 'fiber', primaryCount: 2, secondaryItem: 'berry', secondaryCount: 2 };
}

/**
 * Updates survival stats (hunger, stamina, health, torpor) over delta time.
 */
export function updateSurvivalStats(
  stats: PlayerStats,
  dt: number,
  isRunning: boolean,
  isHarvesting: boolean
): { updatedStats: PlayerStats; tookHungerDamage: boolean } {
  let { hp, maxHp, stamina, maxStamina, hunger, maxHunger, torpor, maxTorpor, level, xp, xpToNextLevel } = stats;

  // Stamina drain
  if (isRunning) {
    stamina = Math.max(0, stamina - 15 * dt);
  } else if (isHarvesting) {
    stamina = Math.max(0, stamina - 8 * dt);
  } else {
    stamina = Math.min(maxStamina, stamina + 12 * dt);
  }

  // Hunger drain: higher when running or working
  const hungerDrainRate = isRunning ? 1.5 : isHarvesting ? 1.0 : 0.4;
  hunger = Math.max(0, hunger - hungerDrainRate * dt);

  let tookHungerDamage = false;
  if (hunger <= 0) {
    // Starving!
    hp = Math.max(0, hp - 4 * dt);
    tookHungerDamage = true;
  } else if (hunger > maxHunger * 0.5 && stamina > maxStamina * 0.5 && hp < maxHp) {
    // Passive regeneration when well-fed
    hp = Math.min(maxHp, hp + 2 * dt);
  }

  // Torpor naturally decays back to 0
  torpor = Math.max(0, torpor - 5 * dt);

  return {
    updatedStats: {
      hp: Math.round(hp * 10) / 10,
      maxHp,
      stamina: Math.round(stamina * 10) / 10,
      maxStamina,
      hunger: Math.round(hunger * 10) / 10,
      maxHunger,
      torpor: Math.round(torpor * 10) / 10,
      maxTorpor,
      level,
      xp,
      xpToNextLevel,
    },
    tookHungerDamage,
  };
}

/**
 * Calculates mounted movement speed.
 * Gives a significant speed boost when riding faster pokemon.
 */
export function calculateMountedSpeed(basePlayerSpeed: number, companionSpeed: number): number {
  return Math.round((basePlayerSpeed * 0.7 + companionSpeed * 1.3) * 10) / 10;
}

/**
 * Checks if the player can mount a companion.
 * Requires a saddle in inventory or companion already unlocked.
 */
export function canRideCompanion(hasSaddle: boolean, companionState: 'wild' | 'captured' | 'assigned_base'): boolean {
  return hasSaddle && companionState === 'captured';
}

/**
 * Calculates stamina cost and invulnerability duration for a dodge roll.
 */
export function calculateDodgeRoll(currentStamina: number): { canDodge: boolean; staminaCost: number; invulnDuration: number } {
  const cost = 20;
  if (currentStamina < cost) {
    return { canDodge: false, staminaCost: 0, invulnDuration: 0 };
  }
  return { canDodge: true, staminaCost: cost, invulnDuration: 0.35 };
}

/**
 * Check XP and level up.
 */
export function addExperience(
  stats: PlayerStats,
  amount: number
): { stats: PlayerStats; leveledUp: boolean } {
  let { level, xp, xpToNextLevel, maxHp, maxStamina, maxHunger } = stats;
  xp += amount;
  let leveledUp = false;

  while (xp >= xpToNextLevel) {
    xp -= xpToNextLevel;
    level += 1;
    xpToNextLevel = Math.round(xpToNextLevel * 1.5);
    maxHp += 10;
    maxStamina += 10;
    maxHunger += 5;
    leveledUp = true;
  }

  return {
    stats: {
      ...stats,
      level,
      xp,
      xpToNextLevel,
      maxHp,
      maxStamina,
      maxHunger,
      hp: leveledUp ? maxHp : stats.hp,
      stamina: leveledUp ? maxStamina : stats.stamina,
    },
    leveledUp,
  };
}
