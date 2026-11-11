import React from 'react';
import {
  Heart,
  Zap,
  Utensils,
  Sun,
  Moon,
  Hammer,
  Backpack,
  Pause,
  Volume2,
  VolumeX,
  Target,
  Swords,
  Shield,
  Activity,
  Compass,
  Flame,
  Skull,
} from 'lucide-react';
import { PlayerStats, ItemStack, PokemonInstance, NotificationMsg, BossInstance } from '../game/types';
import { ITEMS, POKEMON_SPECIES } from '../game/pokemonData';

interface GameHUDProps {
  stats: PlayerStats;
  inventory: ItemStack[];
  activeHotbarIndex: number;
  onSelectHotbar: (index: number) => void;
  activeCompanion: PokemonInstance | null;
  onCompanionBehavior: (behavior: 'follow' | 'stay' | 'work' | 'aggressive') => void;
  onRecallCompanion: () => void;
  isMounted: boolean;
  onToggleMount: () => void;
  boss: BossInstance | null;
  playerPos: { x: number; z: number };
  nearbyAction: string | null;
  timeOfDay: number;
  dayCount: number;
  notifications: NotificationMsg[];
  hoveredPokemon: { name: string; speciesId?: string; level: number; hp: number; maxHp: number; catchChance: number; element: string } | null;
  onOpenInventory: () => void;
  onOpenBuilding: () => void;
  onPause: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  stats,
  inventory,
  activeHotbarIndex,
  onSelectHotbar,
  activeCompanion,
  onCompanionBehavior,
  onRecallCompanion,
  isMounted,
  onToggleMount,
  boss,
  playerPos,
  nearbyAction,
  timeOfDay,
  dayCount,
  notifications,
  hoveredPokemon,
  onOpenInventory,
  onOpenBuilding,
  onPause,
  soundEnabled,
  onToggleSound,
}) => {
  const isNight = timeOfDay < 5.5 || timeOfDay >= 19.5;
  const hours = Math.floor(timeOfDay);
  const minutes = Math.floor((timeOfDay - hours) * 60);
  const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

  const hotbarSlots = [0, 1, 2, 3, 4, 5].map((idx) => {
    return inventory[idx] || null;
  });

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden flex flex-col justify-between p-4 sm:p-6">
      {/* TOP BAR */}
      <div className="w-full flex items-start justify-between">
        {/* Companion Card (Top Left) */}
        {activeCompanion ? (
          <div className="pointer-events-auto bg-slate-950/85 border border-emerald-500/40 rounded-xl p-3 shadow-xl backdrop-blur-none max-w-xs flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="relative w-12 h-12 flex-shrink-0 bg-slate-900/90 rounded-lg p-1 border border-slate-700/80 flex items-center justify-center overflow-hidden">
                  <img
                    src={`/sprites/animated/${activeCompanion.speciesId}.gif`}
                    alt={activeCompanion.nickname || 'Companion'}
                    className="w-full h-full object-contain filter drop-shadow"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `/sprites/${activeCompanion.speciesId}.png`;
                    }}
                  />
                  <span className="absolute bottom-0 right-0 text-[10px] bg-slate-950/80 px-1 rounded-tl leading-none">
                    {POKEMON_SPECIES[activeCompanion.speciesId]?.element === 'fire'
                      ? '🔥'
                      : POKEMON_SPECIES[activeCompanion.speciesId]?.element === 'water'
                      ? '💧'
                      : POKEMON_SPECIES[activeCompanion.speciesId]?.element === 'grass'
                      ? '🌿'
                      : POKEMON_SPECIES[activeCompanion.speciesId]?.element === 'electric'
                      ? '⚡'
                      : '🪨'}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">
                      {activeCompanion.nickname || POKEMON_SPECIES[activeCompanion.speciesId]?.name}
                    </span>
                    <span className="text-xs font-mono px-1.5 py-0.2 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded">
                      Nv.{activeCompanion.level}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {POKEMON_SPECIES[activeCompanion.speciesId]?.workDescription}
                  </span>
                </div>
              </div>

              <button
                onClick={onRecallCompanion}
                className="text-[10px] font-mono text-rose-400 hover:text-rose-300 border border-rose-900 bg-rose-950/60 px-1.5 py-1 rounded cursor-pointer"
                title="Guardar en esfera"
              >
                Guardar
              </button>
            </div>

            {/* HP Bar */}
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700">
              <div
                className="h-full bg-emerald-500 transition-all duration-200"
                style={{
                  width: `${Math.max(0, Math.min(100, (activeCompanion.hp / activeCompanion.maxHp) * 100))}%`,
                }}
              />
            </div>

            {/* Quick Companion Modes */}
            <div className="flex items-center gap-1 text-[11px] font-mono">
              <button
                onClick={() => onCompanionBehavior('follow')}
                className={`flex-1 py-1 rounded text-center transition-colors ${
                  activeCompanion.behavior === 'follow'
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                }`}
              >
                Seguir
              </button>
              <button
                onClick={() => onCompanionBehavior('work')}
                className={`flex-1 py-1 rounded text-center transition-colors ${
                  activeCompanion.behavior === 'work'
                    ? 'bg-amber-600 text-white font-bold'
                    : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                }`}
              >
                Trabajo
              </button>
              <button
                onClick={() => onCompanionBehavior('stay')}
                className={`flex-1 py-1 rounded text-center transition-colors ${
                  activeCompanion.behavior === 'stay'
                    ? 'bg-cyan-600 text-white font-bold'
                    : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                }`}
              >
                Esperar
              </button>
              <button
                onClick={() => onCompanionBehavior('aggressive')}
                className={`flex-1 py-1 rounded text-center transition-colors ${
                  activeCompanion.behavior === 'aggressive'
                    ? 'bg-rose-600 text-white font-bold'
                    : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                }`}
              >
                Atacar
              </button>
            </div>

            {/* ARK Mount Action Button */}
            <button
              onClick={onToggleMount}
              className={`w-full py-1.5 rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                isMounted
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30 animate-pulse'
                  : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-600/40'
              }`}
            >
              <span>🏇</span>
              <span>{isMounted ? 'Desmontar Pokémon [R]' : 'Montar Pokémon [R]'}</span>
            </button>
          </div>
        ) : (
          <div className="pointer-events-auto bg-slate-950/70 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-400 flex items-center gap-2">
            <span>🔴</span>
            <span>Sin compañero activo · Lanza una esfera [Clic Der.] para domesticar</span>
          </div>
        )}

        {/* Center: Boss Health Bar (ARK Alpha Titan) OR Target Inspection */}
        <div className="flex flex-col items-center gap-2">
          {boss && (
            <div className="pointer-events-auto bg-slate-950/95 border-2 border-red-600 rounded-2xl px-5 py-2.5 shadow-2xl flex flex-col items-center min-w-[320px] sm:min-w-[420px] animate-pulse">
              <div className="flex items-center justify-between w-full mb-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-red-950/90 border border-red-600/80 p-0.5 flex items-center justify-center overflow-hidden">
                    <img
                      src="/sprites/animated/charizard.gif"
                      alt="Charizard Alfa"
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/sprites/charizard.png';
                      }}
                    />
                  </div>
                  <span className="font-black text-white text-sm tracking-wider uppercase">
                    {boss.title}
                  </span>
                </div>
                <span className="text-xs font-mono font-bold text-red-400 bg-red-950/80 px-2 py-0.5 rounded border border-red-800">
                  Nv.{boss.level}
                </span>
              </div>
              <div className="w-full bg-slate-900 h-3 rounded-full overflow-hidden border border-red-900">
                <div
                  className="h-full bg-gradient-to-r from-red-700 via-amber-500 to-red-500 transition-all duration-200"
                  style={{ width: `${Math.max(0, (boss.hp / boss.maxHp) * 100)}%` }}
                />
              </div>
              <div className="flex justify-between w-full text-[10px] font-mono text-slate-400 mt-1">
                <span>Zona Norte: Altar de Obsidiana</span>
                <span>{Math.round(boss.hp)} / {boss.maxHp} HP</span>
              </div>
            </div>
          )}

          {/* Hovered Wild Creature Inspection Pill */}
          {hoveredPokemon && (
            <div className="bg-slate-950/90 border border-amber-500/50 rounded-xl px-4 py-2 shadow-2xl flex items-center gap-3">
              {hoveredPokemon.speciesId ? (
                <div className="w-9 h-9 rounded-lg bg-slate-900/90 border border-slate-700/80 p-0.5 flex items-center justify-center overflow-hidden flex-shrink-0">
                  <img
                    src={`/sprites/animated/${hoveredPokemon.speciesId}.gif`}
                    alt={hoveredPokemon.name}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `/sprites/${hoveredPokemon.speciesId}.png`;
                    }}
                  />
                </div>
              ) : (
                <Target className="w-4 h-4 text-amber-400 animate-pulse" />
              )}
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm">{hoveredPokemon.name}</span>
                  <span className="text-xs font-mono text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800">
                    Nv.{hoveredPokemon.level}
                  </span>
                  <span className="text-[10px] uppercase font-bold text-slate-400">
                    [{hoveredPokemon.element}]
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono mt-0.5">
                  <span className="text-emerald-400">
                    HP: {hoveredPokemon.hp}/{hoveredPokemon.maxHp}
                  </span>
                  <span className="text-slate-500">·</span>
                  <span className="text-amber-300 font-bold">
                    Captura: {hoveredPokemon.catchChance}%
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Top Right: Clock & Utility Controls */}
        <div className="pointer-events-auto flex items-center gap-2">
          {/* Day & Time Clock */}
          <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 px-3 py-1.5 rounded-lg text-xs font-mono text-slate-200">
            {isNight ? (
              <Moon className="w-4 h-4 text-cyan-400" />
            ) : (
              <Sun className="w-4 h-4 text-amber-400" />
            )}
            <span>
              Día {dayCount} · {formattedTime}
            </span>
          </div>

          {/* Quick Menus */}
          <button
            onClick={onOpenInventory}
            className="p-2 bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500 text-slate-200 rounded-lg transition-colors cursor-pointer"
            title="Inventario y Crafteo [TAB / C]"
          >
            <Backpack className="w-4 h-4 text-emerald-400" />
          </button>

          <button
            onClick={onOpenBuilding}
            className="p-2 bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-amber-500 text-slate-200 rounded-lg transition-colors cursor-pointer"
            title="Modo Construcción [B]"
          >
            <Hammer className="w-4 h-4 text-amber-400" />
          </button>

          <button
            onClick={onToggleSound}
            className="p-2 bg-slate-950/80 hover:bg-slate-800 border border-slate-800 text-slate-200 rounded-lg transition-colors cursor-pointer"
            title="Audio [M]"
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-rose-400" />
            )}
          </button>

          <button
            onClick={onPause}
            className="p-2 bg-slate-950/80 hover:bg-slate-800 border border-slate-800 text-slate-200 rounded-lg transition-colors cursor-pointer"
            title="Pausar [ESC / P]"
          >
            <Pause className="w-4 h-4 text-slate-300" />
          </button>
        </div>
      </div>

      {/* TOP RIGHT: Minimap Radar */}
      <div className="absolute top-16 right-4 sm:right-6 pointer-events-auto bg-slate-950/85 border border-slate-800 rounded-2xl p-2 shadow-2xl flex flex-col items-center">
        <div className="relative w-24 h-24 rounded-full bg-slate-900 border border-emerald-900/60 overflow-hidden flex items-center justify-center">
          {/* Compass grid lines */}
          <div className="absolute inset-0 border border-slate-800/40 rounded-full" />
          <div className="absolute inset-x-0 top-1/2 h-px bg-emerald-500/10" />
          <div className="absolute inset-y-0 left-1/2 w-px bg-emerald-500/10" />
          <span className="absolute top-1 text-[8px] font-mono text-emerald-400 font-bold">N</span>

          {/* Player dot in center */}
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 border border-slate-950 shadow-sm z-10" />

          {/* Boss indicator (North clearing) */}
          {boss && (
            <div
              className="absolute w-2 h-2 rounded-full bg-red-500 animate-ping"
              style={{
                top: `${Math.max(4, Math.min(88, 48 + (boss.z - playerPos.z) * 1.5))}%`,
                left: `${Math.max(4, Math.min(88, 48 + (boss.x - playerPos.x) * 1.5))}%`,
              }}
              title="Titán Alfa"
            />
          )}
        </div>
        <span className="text-[9px] font-mono text-slate-400 mt-1">
          X: {Math.round(playerPos.x)} · Z: {Math.round(playerPos.z)}
        </span>
      </div>

      {/* INTERACTIVE PROMPT (Above Hotbar) */}
      {nearbyAction && (
        <div className="self-center mb-2 bg-slate-950/95 border border-amber-400/80 text-amber-300 font-mono text-xs px-4 py-1.5 rounded-full shadow-2xl flex items-center gap-2 animate-bounce pointer-events-auto">
          <span>⚡</span>
          <span>{nearbyAction}</span>
        </div>
      )}

      {/* LEFT FEED: Resource / Action Notifications */}
      <div className="w-64 flex flex-col gap-1.5 mb-auto mt-4 pointer-events-none">
        {notifications.slice(-4).map((n) => (
          <div
            key={n.id}
            className="bg-slate-950/85 border-l-4 border-emerald-500 text-slate-100 px-3 py-1.5 rounded-r-md text-xs font-mono shadow-lg flex items-center gap-2 animate-fade-in"
          >
            {n.icon && <span className="text-sm">{n.icon}</span>}
            <span>{n.text}</span>
          </div>
        ))}
      </div>

      {/* BOTTOM SECTION: Hotbar + ARK Survival Status Gauges */}
      <div className="w-full flex flex-col sm:flex-row items-end justify-between gap-4">
        {/* Level & XP bar on left bottom */}
        <div className="bg-slate-950/85 border border-slate-800 rounded-xl p-2.5 shadow-xl w-48">
          <div className="flex items-center justify-between text-xs font-mono mb-1">
            <span className="font-bold text-amber-400">Nivel {stats.level}</span>
            <span className="text-slate-400">
              XP {stats.xp}/{stats.xpToNextLevel}
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full bg-amber-400 transition-all duration-300"
              style={{
                width: `${Math.min(100, (stats.xp / stats.xpToNextLevel) * 100)}%`,
              }}
            />
          </div>
        </div>

        {/* Center: Hotbar Slots (1-6) */}
        <div className="pointer-events-auto flex items-center gap-1.5 bg-slate-950/90 border border-slate-800 p-1.5 rounded-2xl shadow-2xl">
          {hotbarSlots.map((slot, idx) => {
            const item = slot ? ITEMS[slot.itemId] : null;
            const isSelected = idx === activeHotbarIndex;

            return (
              <button
                key={idx}
                onClick={() => onSelectHotbar(idx)}
                className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-950/90 border-2 border-emerald-400 shadow-lg shadow-emerald-500/20 scale-105'
                    : 'bg-slate-900/80 border border-slate-800 hover:border-slate-600'
                }`}
                title={item ? `${item.name} (${item.description})` : 'Ranura vacía'}
              >
                {/* Slot index key number */}
                <span className="absolute top-1 left-1.5 text-[10px] font-mono text-slate-400">
                  {idx + 1}
                </span>

                {item ? (
                  <>
                    <span className="text-xl sm:text-2xl">{item.icon}</span>
                    {slot && slot.count > 1 && (
                      <span className="absolute bottom-1 right-1.5 text-[11px] font-mono font-bold text-white bg-slate-950/80 px-1 rounded">
                        {slot.count}
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-slate-700 text-xs font-mono">•</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Right Bottom: ARK Hexagonal Survival Vitals */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-3 shadow-2xl flex flex-col gap-2 min-w-[200px]">
          {/* Health */}
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-rose-500 shrink-0" />
            <div className="flex-1">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-slate-300 font-bold">SALUD</span>
                <span className="text-rose-400 tabular-nums">
                  {Math.round(stats.hp)}/{stats.maxHp}
                </span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden border border-slate-700">
                <div
                  className="h-full bg-gradient-to-r from-rose-600 to-rose-400 transition-all duration-150"
                  style={{ width: `${Math.max(0, (stats.hp / stats.maxHp) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Stamina */}
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="flex-1">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-slate-300 font-bold">ENERGÍA</span>
                <span className="text-emerald-400 tabular-nums">
                  {Math.round(stats.stamina)}/{stats.maxStamina}
                </span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden border border-slate-700">
                <div
                  className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-150"
                  style={{ width: `${Math.max(0, (stats.stamina / stats.maxStamina) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Hunger */}
          <div className="flex items-center gap-2">
            <Utensils className="w-4 h-4 text-amber-500 shrink-0" />
            <div className="flex-1">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-slate-300 font-bold">HAMBRE</span>
                <span className="text-amber-400 tabular-nums">
                  {Math.round(stats.hunger)}/{stats.maxHunger}
                </span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden border border-slate-700">
                <div
                  className="h-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-150"
                  style={{ width: `${Math.max(0, (stats.hunger / stats.maxHunger) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Torpor (if > 0) */}
          {stats.torpor > 0 && (
            <div className="flex items-center gap-2 animate-pulse">
              <Activity className="w-4 h-4 text-purple-400 shrink-0" />
              <div className="flex-1">
                <div className="flex justify-between text-[10px] font-mono text-purple-300">
                  <span>TORPOR</span>
                  <span>{Math.round(stats.torpor)}%</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 transition-all"
                    style={{ width: `${(stats.torpor / stats.maxTorpor) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
