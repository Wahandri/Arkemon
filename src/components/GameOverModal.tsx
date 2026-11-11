import React, { useEffect } from 'react';
import { Skull, RotateCcw, Home } from 'lucide-react';

interface GameOverModalProps {
  daysSurvived: number;
  pokemonCapturedCount: number;
  resourcesHarvestedCount: number;
  onRespawn: () => void;
  onTitle: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  daysSurvived,
  pokemonCapturedCount,
  resourcesHarvestedCount,
  onRespawn,
  onTitle,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        onRespawn();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onRespawn]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-red-950/80 backdrop-blur-none select-none">
      <div className="bg-slate-950 border border-red-800/80 rounded-2xl p-6 sm:p-8 max-w-md w-full flex flex-col items-center text-center shadow-2xl animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-red-950/80 border-2 border-red-600 flex items-center justify-center mb-4">
          <Skull className="w-8 h-8 text-red-500 animate-pulse" />
        </div>

        <h2 className="text-2xl sm:text-3xl font-black uppercase text-white tracking-widest mb-1">
          Has Sucumbido
        </h2>
        <p className="text-xs font-mono text-red-400 mb-6">
          La naturaleza salvaje no perdona la debilidad
        </p>

        {/* Survival stats */}
        <div className="w-full bg-slate-900/90 border border-slate-800 rounded-xl p-4 grid grid-cols-3 gap-2 text-center font-mono mb-6">
          <div>
            <div className="text-[10px] text-slate-400 uppercase">Días Vivos</div>
            <div className="text-lg font-bold text-amber-400">{daysSurvived}</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase">Domados</div>
            <div className="text-lg font-bold text-emerald-400">{pokemonCapturedCount}</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase">Recursos</div>
            <div className="text-lg font-bold text-cyan-400">{resourcesHarvestedCount}</div>
          </div>
        </div>

        <div className="w-full flex flex-col gap-3">
          <button
            onClick={onRespawn}
            data-start="true"
            className="w-full py-3.5 bg-red-600 hover:bg-red-500 active:scale-98 text-white font-black uppercase tracking-wider text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-red-950 transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reaparecer en la Costa [Espacio]</span>
          </button>

          <button
            onClick={onTitle}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white font-mono text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer border border-slate-800"
          >
            <Home className="w-4 h-4" />
            <span>Volver a la Portada</span>
          </button>
        </div>
      </div>
    </div>
  );
};
