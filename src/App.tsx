import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import confetti from 'canvas-confetti';
import {
  PlayerStats,
  ItemStack,
  PokemonInstance,
  ResourceNode,
  PlacedBuilding,
  BuildingType,
  Recipe,
  NotificationMsg,
  BossInstance,
  ElementalProjectile,
} from './game/types';
import { POKEMON_SPECIES, ITEMS, RECIPES } from './game/pokemonData';
import {
  calculateDamage,
  calculateCaptureChance,
  executeCraft,
  getHarvestYield,
  updateSurvivalStats,
  addExperience,
  calculateMountedSpeed,
  calculateDodgeRoll,
  canRideCompanion,
} from './game/rules';
import { sound } from './game/audio';
import { SceneManager } from './game/three/SceneManager';
import { TitleScreen } from './components/TitleScreen';
import { GameHUD } from './components/GameHUD';
import { InventoryModal } from './components/InventoryModal';
import { BuildingMenu } from './components/BuildingMenu';
import { CompanionModal } from './components/CompanionModal';
import { StructureModal } from './components/StructureModal';
import { PauseModal } from './components/PauseModal';
import { GameOverModal } from './components/GameOverModal';

// Initial Island Resource Distribution
const INITIAL_RESOURCES: ResourceNode[] = [
  // Trees
  { id: 'tree_1', type: 'tree', x: -6, z: -8, hp: 40, maxHp: 40 },
  { id: 'tree_2', type: 'tree', x: -10, z: -4, hp: 40, maxHp: 40 },
  { id: 'tree_3', type: 'tree', x: 8, z: -10, hp: 40, maxHp: 40 },
  { id: 'tree_4', type: 'tree', x: 12, z: 6, hp: 40, maxHp: 40 },
  { id: 'tree_5', type: 'tree', x: -14, z: 12, hp: 40, maxHp: 40 },
  { id: 'tree_6', type: 'tree', x: 16, z: -8, hp: 40, maxHp: 40 },
  { id: 'tree_7', type: 'tree', x: 4, z: 14, hp: 40, maxHp: 40 },
  // Rocks & Boulders
  { id: 'rock_1', type: 'rock', x: -5, z: 6, hp: 35, maxHp: 35 },
  { id: 'rock_2', type: 'rock', x: 7, z: -4, hp: 35, maxHp: 35 },
  { id: 'rock_3', type: 'rock', x: -12, z: -12, hp: 35, maxHp: 35 },
  { id: 'boulder_1', type: 'boulder', x: 14, z: 14, hp: 70, maxHp: 70 },
  { id: 'boulder_2', type: 'boulder', x: -16, z: 6, hp: 70, maxHp: 70 },
  // Bushes
  { id: 'bush_1', type: 'bush', x: -2, z: -4, hp: 15, maxHp: 15 },
  { id: 'bush_2', type: 'bush', x: 4, z: 3, hp: 15, maxHp: 15 },
  { id: 'bush_3', type: 'bush', x: -8, z: 2, hp: 15, maxHp: 15 },
  { id: 'bush_4', type: 'bush', x: 9, z: 10, hp: 15, maxHp: 15 },
  { id: 'bush_5', type: 'bush', x: -3, z: 11, hp: 15, maxHp: 15 },
];

// Initial Wild Pokemon roaming the island
const INITIAL_POKEMON: PokemonInstance[] = [
  {
    id: 'wild_char_1',
    speciesId: 'charmander',
    nickname: 'Charmander',
    level: 2,
    hp: 75,
    maxHp: 75,
    attack: 16,
    defense: 8,
    speed: 4.8,
    x: 6,
    z: -7,
    rotation: 0,
    state: 'wild',
    behavior: 'stay',
  },
  {
    id: 'wild_bulb_1',
    speciesId: 'bulbasaur',
    nickname: 'Bulbasaur',
    level: 2,
    hp: 90,
    maxHp: 90,
    attack: 13,
    defense: 12,
    speed: 4.2,
    x: -8,
    z: -6,
    rotation: 1.2,
    state: 'wild',
    behavior: 'stay',
  },
  {
    id: 'wild_squirt_1',
    speciesId: 'squirtle',
    nickname: 'Squirtle',
    level: 1,
    hp: 85,
    maxHp: 85,
    attack: 14,
    defense: 15,
    speed: 4.0,
    x: 12,
    z: 8,
    rotation: -0.8,
    state: 'wild',
    behavior: 'stay',
  },
  {
    id: 'wild_pika_1',
    speciesId: 'pikachu',
    nickname: 'Pikachu',
    level: 3,
    hp: 65,
    maxHp: 65,
    attack: 18,
    defense: 7,
    speed: 5.6,
    x: -5,
    z: 10,
    rotation: 2.1,
    state: 'wild',
    behavior: 'stay',
  },
  {
    id: 'wild_geo_1',
    speciesId: 'geodude',
    nickname: 'Geodude',
    level: 2,
    hp: 110,
    maxHp: 110,
    attack: 17,
    defense: 20,
    speed: 3.2,
    x: 10,
    z: -12,
    rotation: 0.5,
    state: 'wild',
    behavior: 'stay',
  },
  {
    id: 'wild_pidg_1',
    speciesId: 'pidgey',
    nickname: 'Pidgey',
    level: 1,
    hp: 60,
    maxHp: 60,
    attack: 12,
    defense: 6,
    speed: 5.8,
    x: -11,
    z: 4,
    rotation: -1.5,
    state: 'wild',
    behavior: 'stay',
  },
];

// Alpha Boss Titan Charizard (North Altar, Level 10)
const INITIAL_BOSS: BossInstance = {
  id: 'alpha_titan_charizard',
  name: 'Charizard Alfa',
  title: '🔥 Titán Dracónico Alfa',
  element: 'fire',
  level: 10,
  hp: 500,
  maxHp: 500,
  attack: 28,
  defense: 16,
  speed: 4.2,
  x: 0,
  z: -26,
  rotation: Math.PI,
  state: 'idle',
  attackTimer: 0,
};

export default function App() {
  // Game states: 'title' | 'playing' | 'paused' | 'gameover'
  const [gameState, setGameState] = useState<'title' | 'playing' | 'paused' | 'gameover'>('title');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Modals
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [isBuildingMenuOpen, setIsBuildingMenuOpen] = useState(false);
  const [isCompanionMenuOpen, setIsCompanionMenuOpen] = useState(false);
  const [activeStructure, setActiveStructure] = useState<PlacedBuilding | null>(null);
  const [activeBuildingType, setActiveBuildingType] = useState<BuildingType | null>(null);

  // Mounting & Boss State
  const [isMounted, setIsMounted] = useState(false);
  const [bossState, setBossState] = useState<BossInstance | null>(INITIAL_BOSS);
  const [playerPos, setPlayerPos] = useState({ x: 0, z: 0 });
  const [nearbyAction, setNearbyAction] = useState<string | null>(null);
  const [chestStash, setChestStash] = useState<Record<string, ItemStack[]>>({});

  // Survival Stats & Time
  const [playerStats, setPlayerStats] = useState<PlayerStats>({
    hp: 100,
    maxHp: 100,
    stamina: 100,
    maxStamina: 100,
    hunger: 100,
    maxHunger: 100,
    torpor: 0,
    maxTorpor: 100,
    level: 1,
    xp: 0,
    xpToNextLevel: 50,
  });

  const [dayCount, setDayCount] = useState(1);
  const [timeOfDay, setTimeOfDay] = useState(10); // 10:00 AM

  // Inventory & Hotbar (Includes starter items + primitive saddle for immediate riding!)
  const [inventory, setInventory] = useState<ItemStack[]>([
    { itemId: 'wood', count: 8 },
    { itemId: 'stone', count: 6 },
    { itemId: 'fiber', count: 8 },
    { itemId: 'berry', count: 10 },
    { itemId: 'primitive_sphere', count: 5 }, // Starter capture spheres!
    { itemId: 'stone_axe', count: 1 }, // Starter tool
    { itemId: 'primitive_saddle', count: 1 }, // Starter mount saddle!
  ]);
  const [activeHotbarIndex, setActiveHotbarIndex] = useState(0);

  // Pokemon & Companions (Start with faithful companion Ignis)
  const [capturedPokemon, setCapturedPokemon] = useState<PokemonInstance[]>([
    {
      id: 'starter_charmander',
      speciesId: 'charmander',
      nickname: 'Ignis',
      level: 2,
      hp: 75,
      maxHp: 75,
      attack: 16,
      defense: 8,
      speed: 4.8,
      x: 1.5,
      z: 1.5,
      rotation: 0,
      state: 'captured',
      behavior: 'follow',
    },
  ]);
  const [activeCompanionId, setActiveCompanionId] = useState<string | null>('starter_charmander');

  // Notifications feed
  const [notifications, setNotifications] = useState<NotificationMsg[]>([
    { id: 'init', text: '¡Bienvenido a PokéARK! Recolecta recursos, monta compañeros [R] y domina la isla.', icon: '🏝️', timestamp: Date.now() },
  ]);

  // Metrics for Game Over
  const [harvestCount, setHarvestCount] = useState(0);

  // 3D Canvas Reference
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const sceneManagerRef = useRef<SceneManager | null>(null);

  // Game Loop Mutable State (to avoid React render stalls in 60Hz animation)
  const playerState = useRef({
    x: 0,
    z: 0,
    rotation: 0,
    vx: 0,
    vz: 0,
    isMoving: false,
    speed: 7.0,
  });

  const keysPressed = useRef<Set<string>>(new Set());
  const wildPokemonRef = useRef<PokemonInstance[]>(INITIAL_POKEMON);
  const resourcesRef = useRef<ResourceNode[]>(INITIAL_RESOURCES);
  const buildingsRef = useRef<PlacedBuilding[]>([]);

  // Push notification helper
  const addNotification = useCallback((text: string, icon?: string) => {
    setNotifications((prev) => [
      ...prev.slice(-6),
      { id: Math.random().toString(36), text, icon, timestamp: Date.now() },
    ]);
  }, []);

  // Update body dataset state
  useEffect(() => {
    document.body.dataset.state = gameState;
  }, [gameState]);

  // Auto-start check (?autostart=1)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      setGameState('playing');
    }
  }, []);

  // Sound toggle sync
  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const next = !prev;
      sound.enabled = next;
      return next;
    });
  }, []);

  // Initialize Three.js Scene once
  useEffect(() => {
    if (!canvasMountRef.current) return;

    const sm = new SceneManager(canvasMountRef.current);
    sceneManagerRef.current = sm;

    // Capture success callback
    sm.onPokemonCaptured = (entityId, _speciesId, _level) => {
      const targetIndex = wildPokemonRef.current.findIndex((p) => p.id === entityId);
      if (targetIndex !== -1) {
        const captured = wildPokemonRef.current[targetIndex];
        const species = POKEMON_SPECIES[captured.speciesId];

        // Confetti celebration
        try {
          confetti({ particleCount: 45, spread: 60, origin: { y: 0.6 } });
        } catch {}

        addNotification(`¡${species?.name || 'Pokémon'} ha sido capturado!`, '🔴');

        // Add to captured team
        const newInstance: PokemonInstance = {
          ...captured,
          state: 'captured',
          behavior: 'follow',
        };

        setCapturedPokemon((prev) => [...prev, newInstance]);
        setActiveCompanionId(newInstance.id);

        // Remove from wild
        wildPokemonRef.current.splice(targetIndex, 1);
        sm.syncPokemon(wildPokemonRef.current);

        // Reward player XP
        setPlayerStats((s) => {
          const { stats: updatedStats, leveledUp } = addExperience(s, 35);
          if (leveledUp) {
            sound.playLevelUp();
            addNotification(`¡Has subido al Nivel ${updatedStats.level}!`, '⭐');
          }
          return updatedStats;
        });
      }
    };

    // Capture failed callback
    sm.onPokemonCaptureFailed = (entityId) => {
      addNotification('¡El Pokémon salvaje se ha liberado de la esfera!', '💢');
      const wild = wildPokemonRef.current.find((p) => p.id === entityId);
      if (wild) {
        // Enrage
        wild.behavior = 'aggressive';
      }
    };

    // Initial sync
    sm.syncResources(resourcesRef.current);
    sm.syncPokemon(wildPokemonRef.current);
    sm.syncBuildings(buildingsRef.current);

    return () => {
      sm.dispose();
      sceneManagerRef.current = null;
    };
  }, [addNotification]);

  // Synchronize equipped tool mesh whenever active hotbar changes
  useEffect(() => {
    const sm = sceneManagerRef.current;
    if (!sm) return;
    const currentItem = inventory[activeHotbarIndex];
    const toolId = currentItem ? currentItem.itemId : 'fists';
    sm.setEquippedTool(toolId);
  }, [activeHotbarIndex, inventory]);

  // Synchronize Ghost building preview
  useEffect(() => {
    const sm = sceneManagerRef.current;
    if (!sm) return;
    sm.setGhostPreview(activeBuildingType);
  }, [activeBuildingType]);

  // Toggle Mount Companion [R]
  const handleToggleMount = useCallback(() => {
    if (isMounted) {
      setIsMounted(false);
      playerState.current.speed = 7.0;
      addNotification('Te has desmontado de tu Pokémon.', '🚶');
    } else {
      if (!activeCompanionId) {
        addNotification('¡No tienes ningún compañero invocado para montar!', '⚠️');
        return;
      }
      const companion = capturedPokemon.find((c) => c.id === activeCompanionId);
      if (!companion) return;

      const hasSaddle = inventory.some((s) => s.itemId === 'primitive_saddle' && s.count > 0);
      if (!hasSaddle) {
        addNotification('Necesitas una Montura Primitiva [Fabrícala en TAB].', '🏇');
        return;
      }

      setIsMounted(true);
      sound.playMountWhistle();
      playerState.current.speed = calculateMountedSpeed(7.0, companion.speed);
      addNotification(
        `¡Montaste sobre ${companion.nickname}! Velocidad aumentada (+${Math.round(
          (companion.speed / 5) * 50
        )}%). Dispara ataques elementales con [Clic Izquierdo].`,
        '🏇'
      );
    }
  }, [isMounted, activeCompanionId, capturedPokemon, inventory, addNotification]);

  // Dodge Roll [Space]
  const handleDodgeRoll = useCallback(() => {
    const { canDodge, staminaCost } = calculateDodgeRoll(playerStats.stamina);
    if (!canDodge) return;

    setPlayerStats((s) => ({ ...s, stamina: Math.max(0, s.stamina - staminaCost) }));
    sound.playDodge();

    const sm = sceneManagerRef.current;
    if (sm) {
      sm.spawnParticles(
        new THREE.Vector3(playerState.current.x, 0.2, playerState.current.z),
        0xd1d5db,
        8,
        2.0
      );
    }

    const rot = playerState.current.rotation;
    playerState.current.vx = Math.sin(rot) * 14.0;
    playerState.current.vz = Math.cos(rot) * 14.0;
    playerState.current.x += Math.sin(rot) * 1.2;
    playerState.current.z += Math.cos(rot) * 1.2;
  }, [playerStats.stamina]);

  // Keyboard Input Listeners (WASD, 1-6, TAB, B, T, E, R, Space, ESC)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();

      // In title screen, don't trigger game inputs
      if (gameState === 'title') return;

      if (key === 'escape' || key === 'p') {
        if (isInventoryOpen || isBuildingMenuOpen || isCompanionMenuOpen || activeStructure) {
          setIsInventoryOpen(false);
          setIsBuildingMenuOpen(false);
          setIsCompanionMenuOpen(false);
          setActiveStructure(null);
          setActiveBuildingType(null);
        } else if (gameState === 'playing') {
          setGameState('paused');
        } else if (gameState === 'paused') {
          setGameState('playing');
        }
        return;
      }

      if (gameState !== 'playing') return;

      // Interact with nearby base structure [E]
      if (key === 'e') {
        const px = playerState.current.x;
        const pz = playerState.current.z;
        const struct = buildingsRef.current.find(
          (b) =>
            Math.hypot(b.x - px, b.z - pz) < 2.5 &&
            (b.type === 'campfire' || b.type === 'storage_chest')
        );
        if (struct) {
          e.preventDefault();
          setActiveStructure(struct);
          return;
        }
      }

      // Mount / Dismount companion [R]
      if (key === 'r') {
        e.preventDefault();
        handleToggleMount();
        return;
      }

      // Dodge roll [Space]
      if (e.code === 'Space') {
        e.preventDefault();
        handleDodgeRoll();
        return;
      }

      if (key === 'tab' || key === 'c') {
        e.preventDefault();
        setIsInventoryOpen((prev) => !prev);
        setIsBuildingMenuOpen(false);
        setIsCompanionMenuOpen(false);
        setActiveStructure(null);
        return;
      }

      if (key === 'b') {
        e.preventDefault();
        setIsBuildingMenuOpen((prev) => !prev);
        setIsInventoryOpen(false);
        setActiveStructure(null);
        return;
      }

      if (key === 't') {
        e.preventDefault();
        setIsCompanionMenuOpen((prev) => !prev);
        setIsInventoryOpen(false);
        setActiveStructure(null);
        return;
      }

      if (key === 'm') {
        toggleSound();
        return;
      }

      // Hotbar selection 1 - 6
      if (['1', '2', '3', '4', '5', '6'].includes(key)) {
        const slotIdx = parseInt(key, 10) - 1;
        setActiveHotbarIndex(slotIdx);
        return;
      }

      keysPressed.current.add(key);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.key.toLowerCase());
    };

    const handleBlur = () => {
      keysPressed.current.clear();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [
    gameState,
    isInventoryOpen,
    isBuildingMenuOpen,
    isCompanionMenuOpen,
    activeStructure,
    toggleSound,
    handleToggleMount,
    handleDodgeRoll,
  ]);

  // Player Harvest / Attack action handler (Left Click)
  const handlePlayerInteract = useCallback(() => {
    const sm = sceneManagerRef.current;
    if (!sm || gameState !== 'playing') return;

    // Trigger tool attack animation
    sm.triggerPlayerAttack();

    const px = playerState.current.x;
    const pz = playerState.current.z;

    // 1. MOUNTED COMBAT: If mounted, release elemental projectile towards mouse world position!
    if (isMounted && activeCompanionId) {
      const companion = capturedPokemon.find((c) => c.id === activeCompanionId);
      if (companion) {
        const species = POKEMON_SPECIES[companion.speciesId];
        const element = species?.element || 'fire';

        const mx = sm.mouseWorldPos.x;
        const mz = sm.mouseWorldPos.z;
        const dx = mx - px;
        const dz = mz - pz;
        const dist = Math.hypot(dx, dz) || 1;
        const speed = 20;

        // Play elemental audio
        if (element === 'fire') sound.playFireAttack();
        else if (element === 'water') sound.playWaterAttack();
        else if (element === 'grass') sound.playLeafAttack();
        else if (element === 'electric') sound.playElectricAttack();
        else {
          sound.playPickaxe();
          sm.addTrauma(0.2);
        }

        const projDmg = companion.attack * 2 + playerStats.level * 3;
        sm.spawnElementalProjectile({
          id: `proj_${Date.now()}`,
          element,
          x: px,
          y: 1.2,
          z: pz,
          vx: (dx / dist) * speed,
          vy: 0.3,
          vz: (dz / dist) * speed,
          damage: projDmg,
          fromPlayerOrCompanion: true,
          life: 0,
          maxLife: 1.6,
        });

        // Check if hits boss
        if (bossState && Math.hypot(bossState.x - mx, bossState.z - mz) < 4.0) {
          const bossDmg = Math.max(10, Math.round(projDmg * 1.2));
          bossState.hp = Math.max(0, bossState.hp - bossDmg);
          bossState.state = 'chase';
          sound.playDamage();
          sm.addTrauma(0.25);
          sm.spawnParticles(new THREE.Vector3(bossState.x, 2.0, bossState.z), 0xfacc15, 12, 3.0);

          if (bossState.hp <= 0) {
            // Boss Defeated!
            sound.playLevelUp();
            confetti({ particleCount: 70, spread: 80, origin: { y: 0.5 } });
            addNotification('¡HAS DERROTADO AL TITÁN CHARIZARD ALFA!', '🏆');

            setInventory((prev) => {
              const next = [...prev];
              next.push({ itemId: 'alpha_sphere', count: 2 });
              next.push({ itemId: 'raw_meat', count: 12 });
              return next;
            });

            setPlayerStats((s) => {
              const { stats: newStats, leveledUp } = addExperience(s, 150);
              if (leveledUp) sound.playLevelUp();
              return newStats;
            });

            setBossState(null);
            sm.syncBoss(null);
          }
        }

        // Check if hits wild pokemon
        for (const wild of wildPokemonRef.current) {
          if (Math.hypot(wild.x - mx, wild.z - mz) < 2.5) {
            wild.hp = Math.max(0, wild.hp - projDmg);
            wild.behavior = 'aggressive';
            sound.playDamage();
            sm.spawnParticles(new THREE.Vector3(wild.x, 0.5, wild.z), 0xf97316, 8, 2.0);

            if (wild.hp <= 0) {
              sound.playDamage();
              addNotification(`¡${wild.nickname} derrotado por ataque elemental!`, '⚡');
              wildPokemonRef.current = wildPokemonRef.current.filter((p) => p.id !== wild.id);
              sm.syncPokemon(wildPokemonRef.current);
            }
            break;
          }
        }
        return;
      }
    }

    // 2. Check if placing a building structure
    if (activeBuildingType) {
      const snapX = Math.round(sm.mouseWorldPos.x);
      const snapZ = Math.round(sm.mouseWorldPos.z);

      // Verify item in inventory
      const requiredItemId = `${activeBuildingType}_item`;
      const invSlot = inventory.find((slot) => slot.itemId === requiredItemId);

      if (invSlot && invSlot.count > 0) {
        // Place building!
        const newBuilding: PlacedBuilding = {
          id: `build_${Date.now()}`,
          type: activeBuildingType,
          x: snapX,
          z: snapZ,
          rotation: 0,
          hp: 100,
          maxHp: 100,
        };

        buildingsRef.current.push(newBuilding);
        sm.syncBuildings(buildingsRef.current);
        sound.playCraft();
        sm.spawnParticles(new THREE.Vector3(snapX, 0.5, snapZ), 0xca8a04, 10, 2.0);

        // Deduct from inventory
        setInventory((prev) => {
          return prev
            .map((s) => (s.itemId === requiredItemId ? { ...s, count: s.count - 1 } : s))
            .filter((s) => s.count > 0);
        });

        addNotification(`¡Estructura colocada en el campamento!`, '🏕️');
        setActiveBuildingType(null);
        setIsBuildingMenuOpen(false);
      } else {
        addNotification(`Necesitas fabricar ${ITEMS[requiredItemId]?.name || 'el objeto'} primero.`, '⚠️');
      }
      return;
    }

    // 3. Identify equipped item
    const currentItem = inventory[activeHotbarIndex];
    const toolDef = currentItem ? ITEMS[currentItem.itemId] : null;

    // If consuming food
    if (toolDef && toolDef.type === 'consumable') {
      sound.playBushGather();
      setPlayerStats((s) => ({
        ...s,
        hunger: Math.min(s.maxHunger, s.hunger + (toolDef.hungerAmount || 10)),
        hp: Math.min(s.maxHp, s.hp + (toolDef.healAmount || 0)),
      }));

      addNotification(`Consumiste ${toolDef.name}.`, toolDef.icon);

      // Deduct food item
      setInventory((prev) => {
        return prev
          .map((s, idx) => (idx === activeHotbarIndex ? { ...s, count: s.count - 1 } : s))
          .filter((s) => s.count > 0);
      });
      return;
    }

    // 4. Melee combat against Boss
    if (bossState && Math.hypot(bossState.x - px, bossState.z - pz) < 4.0) {
      const playerAtk = (toolDef?.damage || 5) + playerStats.level * 3;
      bossState.hp = Math.max(0, bossState.hp - playerAtk);
      bossState.state = 'chase';
      sound.playDamage();
      sm.addTrauma(0.2);
      sm.spawnParticles(new THREE.Vector3(bossState.x, 1.5, bossState.z), 0xef4444, 10, 2.5);

      if (bossState.hp <= 0) {
        sound.playLevelUp();
        confetti({ particleCount: 70, spread: 80, origin: { y: 0.5 } });
        addNotification('¡HAS DERROTADO AL TITÁN CHARIZARD ALFA!', '🏆');

        setInventory((prev) => {
          const next = [...prev];
          next.push({ itemId: 'alpha_sphere', count: 2 });
          next.push({ itemId: 'raw_meat', count: 12 });
          return next;
        });

        setPlayerStats((s) => {
          const { stats: newStats, leveledUp } = addExperience(s, 150);
          if (leveledUp) sound.playLevelUp();
          return newStats;
        });

        setBossState(null);
        sm.syncBoss(null);
      }
      return;
    }

    // 5. Melee attack or harvest nearest entity
    const reach = 2.6;

    // Check nearest wild Pokemon
    let nearestWild: PokemonInstance | null = null;
    let minWildDist = reach;

    for (const wild of wildPokemonRef.current) {
      const d = Math.hypot(wild.x - px, wild.z - pz);
      if (d < minWildDist) {
        minWildDist = d;
        nearestWild = wild;
      }
    }

    if (nearestWild) {
      // Attack wild Pokemon!
      const playerAtk = (toolDef?.damage || 5) + playerStats.level * 2;
      const { damage } = calculateDamage(
        playerAtk,
        nearestWild.defense,
        'normal',
        POKEMON_SPECIES[nearestWild.speciesId]?.element || 'normal'
      );

      nearestWild.hp = Math.max(0, nearestWild.hp - damage);
      sound.playDamage();
      sm.spawnParticles(new THREE.Vector3(nearestWild.x, 0.5, nearestWild.z), 0xef4444, 8, 2.5);

      // Retaliate
      nearestWild.behavior = 'aggressive';
      nearestWild.targetEntityId = 'player';

      // If defeated
      if (nearestWild.hp <= 0) {
        sound.playDamage();
        addNotification(`¡${nearestWild.nickname} ha caído! Obtuviste carne y XP.`, '🍖');

        // Drop raw meat
        setInventory((prev) => {
          const slot = prev.find((s) => s.itemId === 'raw_meat');
          if (slot) slot.count += 2;
          else prev.push({ itemId: 'raw_meat', count: 2 });
          return [...prev];
        });

        // Award XP
        setPlayerStats((s) => {
          const { stats: newStats, leveledUp } = addExperience(s, 25);
          if (leveledUp) {
            sound.playLevelUp();
            addNotification(`¡Subiste al Nivel ${newStats.level}!`, '⭐');
          }
          return newStats;
        });

        // Remove from world
        wildPokemonRef.current = wildPokemonRef.current.filter((p) => p.id !== nearestWild!.id);
        sm.syncPokemon(wildPokemonRef.current);
      }
      return;
    }

    // Check nearest resource node
    let nearestNode: ResourceNode | null = null;
    let minNodeDist = reach;

    for (const node of resourcesRef.current) {
      const d = Math.hypot(node.x - px, node.z - pz);
      if (d < minNodeDist) {
        minNodeDist = d;
        nearestNode = node;
      }
    }

    if (nearestNode) {
      const toolType = currentItem?.itemId.includes('axe')
        ? 'axe'
        : currentItem?.itemId.includes('pickaxe')
        ? 'pickaxe'
        : currentItem?.itemId.includes('spear')
        ? 'spear'
        : 'fists';

      const yieldData = getHarvestYield(nearestNode.type, toolType);

      // Play sound
      if (nearestNode.type === 'tree') sound.playAxeChop();
      else if (nearestNode.type === 'rock' || nearestNode.type === 'boulder') sound.playPickaxe();
      else sound.playBushGather();

      sm.spawnParticles(
        new THREE.Vector3(nearestNode.x, 0.6, nearestNode.z),
        nearestNode.type === 'tree' ? 0x854d0e : nearestNode.type === 'bush' ? 0x16a34a : 0x78716c,
        6,
        1.8
      );

      nearestNode.hp -= 10;

      // Add harvested items to inventory
      setInventory((prev) => {
        const next = [...prev];
        const pSlot = next.find((s) => s.itemId === yieldData.primaryItem);
        if (pSlot) pSlot.count += yieldData.primaryCount;
        else next.push({ itemId: yieldData.primaryItem, count: yieldData.primaryCount });

        if (yieldData.secondaryItem && yieldData.secondaryCount) {
          const sSlot = next.find((s) => s.itemId === yieldData.secondaryItem);
          if (sSlot) sSlot.count += yieldData.secondaryCount;
          else next.push({ itemId: yieldData.secondaryItem, count: yieldData.secondaryCount });
        }
        return next;
      });

      setHarvestCount((c) => c + 1);

      // Experience for harvesting
      setPlayerStats((s) => {
        const { stats: newStats, leveledUp } = addExperience(s, 2);
        if (leveledUp) {
          sound.playLevelUp();
          addNotification(`¡Subiste al Nivel ${newStats.level}!`, '⭐');
        }
        return newStats;
      });

      // Notification
      const primItem = ITEMS[yieldData.primaryItem];
      addNotification(`+${yieldData.primaryCount} ${primItem?.name || ''}`, primItem?.icon);

      // Node depleted?
      if (nearestNode.hp <= 0) {
        sm.spawnParticles(new THREE.Vector3(nearestNode.x, 0.5, nearestNode.z), 0x22c55e, 16, 3.0);
        resourcesRef.current = resourcesRef.current.filter((n) => n.id !== nearestNode!.id);
        sm.syncResources(resourcesRef.current);
      }
    } else {
      // Punch air
      sound.playPunch();
    }
  }, [
    isMounted,
    activeCompanionId,
    capturedPokemon,
    bossState,
    activeBuildingType,
    activeHotbarIndex,
    gameState,
    inventory,
    playerStats.level,
    addNotification,
  ]);

  // Throw Capture Sphere (Right Click)
  const handleThrowSphere = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const sm = sceneManagerRef.current;
    if (!sm || gameState !== 'playing') return;

    // Check if player has an orb equipped in hotbar or in inventory
    const equippedItem = inventory[activeHotbarIndex];
    let orbItemId: string | null = null;

    if (equippedItem?.itemId.includes('sphere')) {
      orbItemId = equippedItem.itemId;
    } else {
      // Find any sphere in backpack
      const anySphere = inventory.find((s) => s.itemId.includes('sphere') && s.count > 0);
      if (anySphere) orbItemId = anySphere.itemId;
    }

    if (!orbItemId) {
      addNotification('¡No tienes Poké-Esferas! Fabrícalas en el menú [TAB].', '🔴');
      return;
    }

    // Deduct 1 sphere from inventory
    setInventory((prev) => {
      return prev
        .map((s) => (s.itemId === orbItemId ? { ...s, count: s.count - 1 } : s))
        .filter((s) => s.count > 0);
    });

    // Start throwing trajectory
    const px = playerState.current.x;
    const pz = playerState.current.z;
    const startPos = new THREE.Vector3(px, 1.2, pz);
    const targetPos = sm.mouseWorldPos.clone();

    // Check if target is close to any wild Pokemon
    let targetWild: PokemonInstance | null = null;
    for (const wild of wildPokemonRef.current) {
      const d = Math.hypot(wild.x - targetPos.x, wild.z - targetPos.z);
      if (d < 3.0) {
        targetWild = wild;
        targetPos.set(wild.x, 0, wild.z);
        break;
      }
    }

    const orbBonus = orbItemId === 'mega_sphere' ? 1.8 : 1.0;
    const catchChance = targetWild
      ? calculateCaptureChance(targetWild.maxHp, targetWild.hp, orbBonus, targetWild.level)
      : 20;

    sm.throwSphere(
      startPos,
      targetPos,
      targetWild ? targetWild.id : '',
      orbItemId,
      catchChance
    );

    addNotification(`¡Lanzaste una ${ITEMS[orbItemId]?.name || 'Esfera'}!`, '🔴');
  }, [activeHotbarIndex, gameState, inventory, addNotification]);

  // Crafting handler from InventoryModal
  const handleCraftRecipe = useCallback((recipe: Recipe) => {
    setInventory((prev) => {
      const updated = executeCraft(recipe, prev);
      const resItem = ITEMS[recipe.resultItemId];
      addNotification(`¡Fabricaste ${resItem?.name} (x${recipe.resultCount})!`, resItem?.icon);

      // Award crafting XP
      setPlayerStats((s) => {
        const { stats: newStats, leveledUp } = addExperience(s, 15);
        if (leveledUp) {
          sound.playLevelUp();
          addNotification(`¡Subiste al Nivel ${newStats.level}!`, '⭐');
        }
        return newStats;
      });

      return updated;
    });
  }, [addNotification]);

  // Use consumable item
  const handleUseItem = useCallback((itemId: string) => {
    const item = ITEMS[itemId];
    if (!item) return;

    setPlayerStats((s) => ({
      ...s,
      hunger: Math.min(s.maxHunger, s.hunger + (item.hungerAmount || 10)),
      hp: Math.min(s.maxHp, s.hp + (item.healAmount || 0)),
    }));

    setInventory((prev) => {
      return prev
        .map((s) => (s.itemId === itemId ? { ...s, count: s.count - 1 } : s))
        .filter((s) => s.count > 0);
    });

    addNotification(`Consumiste ${item.name}.`, item.icon);
  }, [addNotification]);

  // Companion Management
  const handleSelectCompanion = useCallback((pokemonId: string) => {
    if (activeCompanionId === pokemonId) {
      setActiveCompanionId(null);
      addNotification('Compañero guardado en la esfera.', '⚪');
    } else {
      setActiveCompanionId(pokemonId);
      const p = capturedPokemon.find((c) => c.id === pokemonId);
      sound.playCaptureSuccess();
      addNotification(`¡${p?.nickname || 'Pokémon'} ahora te acompaña!`, '🐾');
    }
    setIsCompanionMenuOpen(false);
  }, [activeCompanionId, capturedPokemon, addNotification]);

  const handleCompanionBehavior = useCallback((behavior: 'follow' | 'stay' | 'work' | 'aggressive') => {
    setCapturedPokemon((prev) =>
      prev.map((p) => (p.id === activeCompanionId ? { ...p, behavior } : p))
    );
    addNotification(`Modo de compañero: ${behavior.toUpperCase()}`, '🐾');
  }, [activeCompanionId, addNotification]);

  // Respawn after game over
  const handleRespawn = useCallback(() => {
    playerState.current.x = 0;
    playerState.current.z = 0;
    setPlayerStats((s) => ({
      ...s,
      hp: s.maxHp,
      stamina: s.maxStamina,
      hunger: s.maxHunger,
      torpor: 0,
    }));
    setGameState('playing');
    addNotification('Reapareciste en la costa de la isla.', '🏝️');
  }, [addNotification]);

  // Structure interactions (Chest & Campfire)
  const handleTransferToChest = useCallback((itemId: string) => {
    if (!activeStructure) return;
    const structId = activeStructure.id;
    setInventory((prev) => {
      const slot = prev.find((s) => s.itemId === itemId);
      if (!slot) return prev;
      const take = 1;
      const updated = prev.map((s) => (s.itemId === itemId ? { ...s, count: s.count - take } : s)).filter((s) => s.count > 0);
      setChestStash((cs) => {
        const list = cs[structId] || [];
        const exist = list.find((s) => s.itemId === itemId);
        if (exist) exist.count += take;
        else list.push({ itemId, count: take });
        return { ...cs, [structId]: [...list] };
      });
      return updated;
    });
  }, [activeStructure]);

  const handleTransferToInventory = useCallback((itemId: string) => {
    if (!activeStructure) return;
    const structId = activeStructure.id;
    setChestStash((cs) => {
      const list = cs[structId] || [];
      const slot = list.find((s) => s.itemId === itemId);
      if (!slot) return cs;
      const take = 1;
      const updatedList = list.map((s) => (s.itemId === itemId ? { ...s, count: s.count - take } : s)).filter((s) => s.count > 0);
      setInventory((inv) => {
        const exist = inv.find((s) => s.itemId === itemId);
        if (exist) exist.count += take;
        else inv.push({ itemId, count: take });
        return [...inv];
      });
      return { ...cs, [structId]: updatedList };
    });
  }, [activeStructure]);

  const handleCookItem = useCallback((inputItemId: string, outputItemId: string) => {
    setInventory((prev) => {
      const inputSlot = prev.find((s) => s.itemId === inputItemId);
      const req = inputItemId === 'berry' ? 2 : 1;
      if (!inputSlot || inputSlot.count < req) return prev;
      const updated = prev.map((s) => (s.itemId === inputItemId ? { ...s, count: s.count - req } : s)).filter((s) => s.count > 0);
      const existOut = updated.find((s) => s.itemId === outputItemId);
      if (existOut) existOut.count += 1;
      else updated.push({ itemId: outputItemId, count: 1 });
      addNotification(`¡Alimento cocinado en la hoguera!`, '🍖');
      return updated;
    });
  }, [addNotification]);

  // Main 60Hz Simulation Loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    let animId: number;
    let lastTime = performance.now();
    let statsTimer = 0;

    const loop = () => {
      const now = performance.now();
      const rawDt = (now - lastTime) / 1000;
      const dt = Math.min(rawDt, 0.05); // clamped simulation step
      lastTime = now;

      const sm = sceneManagerRef.current;
      if (!sm) {
        animId = requestAnimationFrame(loop);
        return;
      }

      // 1. Process WASD Movement (True 2.5D Screen-Aligned Isometric Mapping)
      // Screen UP (W): isometric (-1, -1)
      // Screen DOWN (S): isometric (+1, +1)
      // Screen LEFT (A): isometric (-1, +1)
      // Screen RIGHT (D): isometric (+1, -1)
      let inputX = 0;
      let inputZ = 0;

      const keys = keysPressed.current;
      if (keys.has('w') || keys.has('arrowup')) {
        inputX -= 1;
        inputZ -= 1;
      }
      if (keys.has('s') || keys.has('arrowdown')) {
        inputX += 1;
        inputZ += 1;
      }
      if (keys.has('a') || keys.has('arrowleft')) {
        inputX -= 1;
        inputZ += 1;
      }
      if (keys.has('d') || keys.has('arrowright')) {
        inputX += 1;
        inputZ -= 1; // Fixed: was adding +1 to Z causing inverted diagonal drift
      }

      const isInputActive = inputX !== 0 || inputZ !== 0;
      const isSprinting = (keys.has('shift') || keys.has('shiftleft') || keys.has('shiftright')) && playerStats.stamina > 8;

      const companion = capturedPokemon.find((c) => c.id === activeCompanionId);
      let targetMaxSpeed = 6.2;

      if (isMounted && companion) {
        targetMaxSpeed = calculateMountedSpeed(6.2, companion.speed);
      } else if (isSprinting && isInputActive) {
        targetMaxSpeed = 9.2;
      }

      let targetVx = 0;
      let targetVz = 0;

      if (isInputActive) {
        const len = Math.hypot(inputX, inputZ);
        const normX = inputX / len;
        const normZ = inputZ / len;
        targetVx = normX * targetMaxSpeed;
        targetVz = normZ * targetMaxSpeed;
      }

      // Smooth acceleration and snappy braking
      const dampingRate = isInputActive ? 22.0 : 28.0;
      playerState.current.vx += (targetVx - playerState.current.vx) * Math.min(1.0, dampingRate * dt);
      playerState.current.vz += (targetVz - playerState.current.vz) * Math.min(1.0, dampingRate * dt);

      playerState.current.x += playerState.current.vx * dt;
      playerState.current.z += playerState.current.vz * dt;

      // Island boundaries clamp
      const distFromCenter = Math.hypot(playerState.current.x, playerState.current.z);
      if (distFromCenter > 36) {
        playerState.current.x = (playerState.current.x / distFromCenter) * 36;
        playerState.current.z = (playerState.current.z / distFromCenter) * 36;
        playerState.current.vx = 0;
        playerState.current.vz = 0;
      }

      const currentSpeed = Math.hypot(playerState.current.vx, playerState.current.vz);
      const isMoving = currentSpeed > 0.25;

      // Smooth rotation towards movement direction
      if (currentSpeed > 0.35) {
        const targetRot = Math.atan2(playerState.current.vx, playerState.current.vz);
        let diff = targetRot - playerState.current.rotation;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        playerState.current.rotation += diff * Math.min(1.0, 16.0 * dt);
      }

      playerState.current.isMoving = isMoving;

      // 2. Active Companion Follow & Mounted Lock
      if (companion) {
        if (isMounted) {
          // Lock companion position directly under player
          companion.x = playerState.current.x;
          companion.z = playerState.current.z;
          companion.rotation = playerState.current.rotation;
        } else if (companion.behavior === 'follow') {
          const dx = playerState.current.x - companion.x;
          const dz = playerState.current.z - companion.z;
          const dist = Math.hypot(dx, dz);

          if (dist > 2.5) {
            companion.x += (dx / dist) * companion.speed * 1.1 * dt;
            companion.z += (dz / dist) * companion.speed * 1.1 * dt;
            companion.rotation = Math.atan2(dx, dz);
          }
        }
      }

      // 3. Update 3D player mesh in SceneManager
      const mountScale = companion ? POKEMON_SPECIES[companion.speciesId]?.scale || 1.0 : 1.0;
      sm.updatePlayer(
        playerState.current.x,
        playerState.current.z,
        playerState.current.rotation,
        isMoving,
        dt,
        isMounted,
        mountScale
      );

      // 4. Update Boss AI (Alpha Charizard Titan in North Altar)
      if (bossState) {
        const bdx = playerState.current.x - bossState.x;
        const bdz = playerState.current.z - bossState.z;
        const bdist = Math.hypot(bdx, bdz);

        if (bdist < 18) {
          bossState.state = 'chase';
          bossState.rotation = Math.atan2(bdx, bdz);

          if (bdist > 3.6) {
            bossState.x += (bdx / bdist) * bossState.speed * dt;
            bossState.z += (bdz / bdist) * bossState.speed * dt;
          }

          bossState.attackTimer += dt;
          if (bossState.attackTimer >= 2.6) {
            bossState.attackTimer = 0;
            sound.playFireAttack();
            sm.addTrauma(0.35);

            sm.spawnElementalProjectile({
              id: `boss_fire_${Date.now()}`,
              element: 'fire',
              x: bossState.x,
              y: 1.8,
              z: bossState.z,
              vx: (bdx / bdist) * 16,
              vy: 0.3,
              vz: (bdz / bdist) * 16,
              damage: 22,
              fromPlayerOrCompanion: false,
              life: 0,
              maxLife: 1.6,
            });

            if (bdist < 4.0) {
              sound.playDamage();
              setPlayerStats((s) => ({ ...s, hp: Math.max(0, s.hp - 18) }));
            }
          }
        }
        sm.syncBoss(bossState);
      }

      // 5. Update Wild Pokemon AI
      for (const wild of wildPokemonRef.current) {
        if (wild.behavior === 'aggressive') {
          const dx = playerState.current.x - wild.x;
          const dz = playerState.current.z - wild.z;
          const dist = Math.hypot(dx, dz);

          if (dist > 1.2) {
            wild.x += (dx / dist) * wild.speed * 0.7 * dt;
            wild.z += (dz / dist) * wild.speed * 0.7 * dt;
            wild.rotation = Math.atan2(dx, dz);
          } else {
            const playerDmg = Math.max(1, wild.attack - 4);
            sound.playDamage();
            sm.spawnParticles(new THREE.Vector3(playerState.current.x, 0.8, playerState.current.z), 0xef4444, 4, 2.0);

            setPlayerStats((s) => {
              const newHp = Math.max(0, s.hp - playerDmg * dt * 2.5);
              if (newHp <= 0) {
                setGameState('gameover');
              }
              return { ...s, hp: newHp };
            });
          }
        } else {
          if (Math.random() < 0.015) {
            wild.rotation += (Math.random() - 0.5) * 1.5;
          }
          if (Math.random() < 0.03) {
            wild.x += Math.sin(wild.rotation) * wild.speed * 0.25 * dt;
            wild.z += Math.cos(wild.rotation) * wild.speed * 0.25 * dt;
          }
        }
      }

      // Sync active entities to 3D scene
      sm.syncPokemon([
        ...wildPokemonRef.current,
        ...(activeCompanionId
          ? capturedPokemon.filter((c) => c.id === activeCompanionId)
          : []),
      ]);

      // 6. Throttled survival degradation & radar pos (10Hz)
      statsTimer += dt;
      if (statsTimer >= 0.1) {
        statsTimer = 0;
        setTimeOfDay(sm.timeOfDay);
        setPlayerPos({ x: playerState.current.x, z: playerState.current.z });

        // Check proximity for nearby action prompts
        const px = playerState.current.x;
        const pz = playerState.current.z;
        const nearStruct = buildingsRef.current.find(
          (b) => Math.hypot(b.x - px, b.z - pz) < 2.5
        );

        if (nearStruct) {
          if (nearStruct.type === 'campfire') {
            setNearbyAction('Presiona [E] para Asar Alimentos en la Hoguera');
          } else if (nearStruct.type === 'storage_chest') {
            setNearbyAction('Presiona [E] para Abrir Cofre de Base');
          } else {
            setNearbyAction(null);
          }
        } else if (isMounted) {
          setNearbyAction('Montura Activa · Clic Izq: Ataque Elemental · R: Bajar');
        } else {
          setNearbyAction(null);
        }

        setPlayerStats((prev) => {
          const { updatedStats } = updateSurvivalStats(
            prev,
            0.1,
            isMoving,
            false
          );
          if (updatedStats.hp <= 0) {
            setGameState('gameover');
          }
          return updatedStats;
        });
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [gameState, activeCompanionId, capturedPokemon, isMounted, bossState]);

  // Calculate target hover probe for HUD
  const hoveredPokemon = (() => {
    const sm = sceneManagerRef.current;
    if (!sm) return null;
    const mx = sm.mouseWorldPos.x;
    const mz = sm.mouseWorldPos.z;

    for (const wild of wildPokemonRef.current) {
      const d = Math.hypot(wild.x - mx, wild.z - mz);
      if (d < 2.5) {
        const species = POKEMON_SPECIES[wild.speciesId];
        const catchChance = calculateCaptureChance(wild.maxHp, wild.hp, 1.0, wild.level);
        return {
          name: wild.nickname || species?.name || 'Pokémon',
          speciesId: wild.speciesId,
          level: wild.level,
          hp: Math.round(wild.hp),
          maxHp: wild.maxHp,
          catchChance,
          element: species?.element || 'normal',
        };
      }
    }
    return null;
  })();

  const activeCompanion =
    capturedPokemon.find((c) => c.id === activeCompanionId) || null;

  return (
    <main className="relative w-screen h-screen overflow-hidden select-none bg-slate-950 font-sans">
      {/* 3D WebGL Canvas Viewport */}
      <div
        ref={canvasMountRef}
        onClick={handlePlayerInteract}
        onContextMenu={handleThrowSphere}
        className="absolute inset-0 cursor-crosshair z-0"
      />

      {/* Title Screen Overlay */}
      {gameState === 'title' && (
        <div className="absolute inset-0 z-30">
          <TitleScreen
            onStart={() => {
              setGameState('playing');
              addNotification('¡Has despertado en la Isla Primitiva!', '🏝️');
            }}
            soundEnabled={soundEnabled}
            onToggleSound={toggleSound}
          />
        </div>
      )}

      {/* Active Game HUD (During Playing & Modals) */}
      {gameState === 'playing' && (
        <GameHUD
          stats={playerStats}
          inventory={inventory}
          activeHotbarIndex={activeHotbarIndex}
          onSelectHotbar={setActiveHotbarIndex}
          activeCompanion={activeCompanion}
          onCompanionBehavior={handleCompanionBehavior}
          onRecallCompanion={() => {
            setIsMounted(false);
            setActiveCompanionId(null);
          }}
          isMounted={isMounted}
          onToggleMount={handleToggleMount}
          boss={bossState}
          playerPos={playerPos}
          nearbyAction={nearbyAction}
          timeOfDay={timeOfDay}
          dayCount={dayCount}
          notifications={notifications}
          hoveredPokemon={hoveredPokemon}
          onOpenInventory={() => setIsInventoryOpen(true)}
          onOpenBuilding={() => setIsBuildingMenuOpen(true)}
          onPause={() => setGameState('paused')}
          soundEnabled={soundEnabled}
          onToggleSound={toggleSound}
        />
      )}

      {/* Inventory & Crafting Workbench Modal [TAB / C] */}
      {isInventoryOpen && (
        <InventoryModal
          inventory={inventory}
          onCraft={handleCraftRecipe}
          onUseItem={handleUseItem}
          onClose={() => setIsInventoryOpen(false)}
        />
      )}

      {/* Base Building Menu [B] */}
      {isBuildingMenuOpen && (
        <BuildingMenu
          inventory={inventory}
          activeBuildingType={activeBuildingType}
          onSelectBuildingType={setActiveBuildingType}
          onClose={() => {
            setIsBuildingMenuOpen(false);
            setActiveBuildingType(null);
          }}
        />
      )}

      {/* Base Structure Interaction Modal (Campfire / Storage Chest) [E] */}
      {activeStructure && (
        <StructureModal
          structure={activeStructure}
          inventory={inventory}
          chestItems={chestStash[activeStructure.id] || []}
          onTransferToChest={handleTransferToChest}
          onTransferToInventory={handleTransferToInventory}
          onCookItem={handleCookItem}
          hasFireCompanion={activeCompanion?.speciesId === 'charmander'}
          onClose={() => setActiveStructure(null)}
        />
      )}

      {/* Companion & Pal Box Modal [T] */}
      {isCompanionMenuOpen && (
        <CompanionModal
          capturedPokemon={capturedPokemon}
          activeCompanionId={activeCompanionId}
          onSelectCompanion={handleSelectCompanion}
          onClose={() => setIsCompanionMenuOpen(false)}
        />
      )}

      {/* Paused Modal [ESC / P] */}
      {gameState === 'paused' && (
        <PauseModal
          onResume={() => setGameState('playing')}
          onRestart={handleRespawn}
          onTitle={() => setGameState('title')}
          soundEnabled={soundEnabled}
          onToggleSound={toggleSound}
        />
      )}

      {/* Game Over Defeat Modal */}
      {gameState === 'gameover' && (
        <GameOverModal
          daysSurvived={dayCount}
          pokemonCapturedCount={capturedPokemon.length}
          resourcesHarvestedCount={harvestCount}
          onRespawn={handleRespawn}
          onTitle={() => setGameState('title')}
        />
      )}
    </main>
  );
}
