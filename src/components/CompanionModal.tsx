import React from 'react';
import { X, Flame, Droplets, Leaf, Zap, Shield, Sparkles } from 'lucide-react';
import { PokemonInstance } from '../game/types';
import { POKEMON_SPECIES } from '../game/pokemonData';

interface CompanionModalProps {
  capturedPokemon: PokemonInstance[];
  activeCompanionId: string | null;
  onSelectCompanion: (pokemonId: string) => void;
  onClose: () => void;
}

export const CompanionModal: React.FC<CompanionModalProps> = ({
  capturedPokemon,
  activeCompanionId,
  onSelectCompanion,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-none select-none">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🐾</span>
            <div>
              <h2 className="text-lg font-black uppercase text-white tracking-wide">
                Caja de Criaturas Domadas
              </h2>
              <p className="text-xs font-mono text-slate-400">
                Selecciona qué Pokémon te acompañará en tus expediciones
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {capturedPokemon.length === 0 ? (
            <div className="text-center py-12 text-slate-500 font-mono text-xs border border-dashed border-slate-800 rounded-xl">
              <span>Aún no has domesticado a ningún Pokémon.</span>
              <span className="block mt-1">
                Fabrica Poké-Esferas en el menú de crafteo [TAB] y lánzalas con [Clic Derecho].
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {capturedPokemon.map((p) => {
                const species = POKEMON_SPECIES[p.speciesId];
                const isActive = activeCompanionId === p.id;

                return (
                  <div
                    key={p.id}
                    className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                      isActive
                        ? 'bg-emerald-950/70 border-emerald-400 shadow-lg shadow-emerald-950'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-600'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="relative w-12 h-12 rounded-lg bg-slate-900 border border-slate-700/80 p-1 flex items-center justify-center flex-shrink-0 overflow-hidden">
                            <img
                              src={`/sprites/animated/${p.speciesId}.gif`}
                              alt={p.nickname || species?.name}
                              className="w-full h-full object-contain filter drop-shadow"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = `/sprites/${p.speciesId}.png`;
                              }}
                            />
                            <span className="absolute bottom-0 right-0 text-[10px] bg-slate-950/80 px-1 rounded-tl leading-none">
                              {species?.element === 'fire'
                                ? '🔥'
                                : species?.element === 'water'
                                ? '💧'
                                : species?.element === 'grass'
                                ? '🌿'
                                : species?.element === 'electric'
                                ? '⚡'
                                : '🪨'}
                            </span>
                          </div>
                          <div>
                            <h4 className="font-bold text-white text-sm">
                              {p.nickname || species?.name}
                            </h4>
                            <span className="text-[10px] font-mono text-slate-400">
                              {species?.speciesName}
                            </span>
                          </div>
                        </div>

                        <span className="text-xs font-mono font-bold text-amber-400 bg-amber-950/70 border border-amber-800/80 px-2 py-0.5 rounded">
                          Nv.{p.level}
                        </span>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-300 bg-slate-900/80 p-2 rounded-lg mb-3">
                        <div>HP: {p.hp}/{p.maxHp}</div>
                        <div>Ataque: {p.attack}</div>
                        <div>Defensa: {p.defense}</div>
                        <div>Velocidad: {p.speed}</div>
                      </div>

                      {/* Work Skill */}
                      <div className="text-[11px] font-mono text-emerald-400 mb-3">
                        <span className="font-bold">Especialidad:</span> {species?.workDescription}
                      </div>
                    </div>

                    <button
                      onClick={() => onSelectCompanion(p.id)}
                      className={`w-full py-2 rounded-lg text-xs font-mono font-bold uppercase transition-all cursor-pointer ${
                        isActive
                          ? 'bg-rose-900/80 text-rose-200 hover:bg-rose-800'
                          : 'bg-emerald-600 text-white hover:bg-emerald-500'
                      }`}
                    >
                      {isActive ? 'Retirar Compañero' : 'Invocar Compañero'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
