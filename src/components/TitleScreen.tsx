import React, { useEffect } from 'react';
import { Volume2, VolumeX, Shield, Sparkles, Compass, Flame, Play } from 'lucide-react';
import { sound } from '../game/audio';

interface TitleScreenProps {
  onStart: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStart,
  soundEnabled,
  onToggleSound,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onStart();
      }
      if (e.key.toLowerCase() === 'm') {
        onToggleSound();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onStart, onToggleSound]);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-between p-6 sm:p-10 select-none overflow-hidden bg-gradient-to-b from-slate-950 via-emerald-950/40 to-slate-950">
      {/* Background ambient lighting pattern */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-amber-500 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -right-32 w-96 h-96 bg-emerald-500 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-cyan-500 rounded-full blur-3xl" />
      </div>

      {/* Top Bar: Controls info & Sound toggle */}
      <div className="w-full max-w-6xl flex items-center justify-between z-10">
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-emerald-400 bg-emerald-950/70 border border-emerald-800/80 px-3 py-1.5 rounded-md">
          <Compass className="w-4 h-4 text-emerald-400" />
          <span>Isla Primitiva · Versión 2.5D</span>
        </div>

        <button
          onClick={onToggleSound}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-mono bg-slate-900/80 border border-slate-700 hover:border-emerald-500 text-slate-300 hover:text-white rounded-md transition-colors"
          title="Alternar Sonido (M)"
          tabIndex={-1}
        >
          {soundEnabled ? (
            <>
              <Volume2 className="w-4 h-4 text-emerald-400" />
              <span>Audio [M]</span>
            </>
          ) : (
            <>
              <VolumeX className="w-4 h-4 text-rose-400" />
              <span>Silenciado [M]</span>
            </>
          )}
        </button>
      </div>

      {/* Center Stage: Title Emblem & Call to Action */}
      <div className="flex flex-col items-center text-center max-w-3xl z-10 my-auto">
        {/* Custom SVG Emblem */}
        <div className="relative mb-6">
          <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-amber-600 via-emerald-600 to-cyan-500 p-1 shadow-2xl shadow-emerald-500/20">
            <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center relative overflow-hidden">
              {/* Poké-Sphere ARK Relic Icon */}
              <div className="absolute inset-0 flex flex-col">
                <div className="w-full h-1/2 bg-red-600/90 border-b-2 border-slate-950" />
                <div className="w-full h-1/2 bg-slate-100/90" />
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-950 border-2 border-amber-400 flex items-center justify-center z-10 shadow-lg">
                <div className="w-3 h-3 rounded-full bg-amber-400 animate-pulse" />
              </div>
            </div>
          </div>
          <Flame className="w-6 h-6 text-amber-400 absolute -top-1 -right-1 animate-bounce" />
        </div>

        {/* Title Lockup */}
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white uppercase drop-shadow-md">
          Poké<span className="text-amber-400">ARK</span>
          <span className="block text-2xl sm:text-3xl font-bold tracking-widest text-emerald-400 mt-1">
            SURVIVAL 2.5D
          </span>
        </h1>

        <p className="mt-4 text-sm sm:text-base text-slate-300 max-w-xl font-normal leading-relaxed">
          Despiertas desarmado en una isla indómita. Tala madera, mina sílex, fabrica tus
          Poké-Esferas y domestica criaturas salvajes para construir tu refugio y dominar el ecosistema.
        </p>

        {/* Animated Pokemon Showcase Strip */}
        <div className="mt-6 flex items-center justify-center gap-3 sm:gap-4 bg-slate-950/70 border border-emerald-500/30 rounded-2xl p-2.5 shadow-2xl backdrop-blur-none">
          {[
            { id: 'bulbasaur', name: 'Bulbasaur', el: '🌿' },
            { id: 'charmander', name: 'Charmander', el: '🔥' },
            { id: 'squirtle', name: 'Squirtle', el: '💧' },
            { id: 'pikachu', name: 'Pikachu', el: '⚡' },
            { id: 'geodude', name: 'Geodude', el: '🪨' },
            { id: 'pidgey', name: 'Pidgey', el: '🌪️' },
          ].map((mon) => (
            <div
              key={mon.id}
              className="relative group flex flex-col items-center bg-slate-900/80 border border-slate-800 hover:border-emerald-400 p-1.5 rounded-xl transition-transform hover:-translate-y-1"
              title={`${mon.name} (${mon.el})`}
            >
              <img
                src={`/sprites/animated/${mon.id}.gif`}
                alt={mon.name}
                className="w-10 h-10 sm:w-12 sm:h-12 object-contain filter drop-shadow"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `/sprites/${mon.id}.png`;
                }}
              />
              <span className="text-[9px] font-mono text-slate-400 mt-0.5">{mon.name}</span>
            </div>
          ))}
        </div>

        {/* Start Game CTA button */}
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
          <button
            onClick={() => {
              sound.playCraft();
              onStart();
            }}
            data-start="true"
            className="group relative inline-flex items-center gap-3 px-8 py-4 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-black tracking-wider text-base uppercase rounded-lg shadow-xl shadow-emerald-900/40 transition-all cursor-pointer"
          >
            <Play className="w-5 h-5 fill-slate-950 group-hover:translate-x-0.5 transition-transform" />
            <span>Sobrevivir e Iniciar</span>
            <span className="text-xs font-mono font-normal opacity-80 ml-1">[ESPACIO / ENTER]</span>
          </button>
        </div>

        {/* Features badge row */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-xs font-mono text-slate-400">
          <div className="flex items-center gap-1.5 bg-slate-900/60 px-3 py-1 rounded border border-slate-800">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>6 Pokémon con habilidades de base</span>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-900/60 px-3 py-1 rounded border border-slate-800">
            <Shield className="w-3.5 h-3.5 text-cyan-400" />
            <span>Construcción de bases libre</span>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-900/60 px-3 py-1 rounded border border-slate-800">
            <Flame className="w-3.5 h-3.5 text-rose-400" />
            <span>Ciclo Día / Noche dinámico</span>
          </div>
        </div>
      </div>

      {/* Bottom Safe Margin: Controls Hint */}
      <div className="w-full text-center z-10">
        <p className="text-xs font-mono text-slate-400 tracking-wide">
          WASD Moverse · Clic Izq. Atacar / Talar · Clic Der. Lanzar Esfera · TAB/C Inventario · B Construcción · T Órdenes
        </p>
      </div>
    </div>
  );
};
