import React from 'react';
import { Play, RotateCcw, Home, Volume2, VolumeX } from 'lucide-react';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onTitle: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onTitle,
  soundEnabled,
  onToggleSound,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-none select-none">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 sm:p-8 max-w-sm w-full flex flex-col items-center text-center shadow-2xl">
        <h2 className="text-2xl font-black uppercase text-white tracking-wider mb-1">
          Partida en Pausa
        </h2>
        <p className="text-xs font-mono text-slate-400 mb-6">
          El tiempo de la isla está detenido
        </p>

        <div className="w-full flex flex-col gap-3">
          <button
            onClick={onResume}
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold uppercase tracking-wider text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-950 transition-all cursor-pointer"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            <span>Reanudar Supervivencia</span>
          </button>

          <button
            onClick={onToggleSound}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            {soundEnabled ? (
              <>
                <Volume2 className="w-4 h-4 text-emerald-400" />
                <span>Audio Activado [M]</span>
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4 text-rose-400" />
                <span>Audio Silenciado [M]</span>
              </>
            )}
          </button>

          <button
            onClick={onRestart}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-amber-400" />
            <span>Reiniciar Expedición</span>
          </button>

          <button
            onClick={onTitle}
            className="w-full py-2.5 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white font-mono text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer border border-slate-800"
          >
            <Home className="w-4 h-4" />
            <span>Volver a la Portada</span>
          </button>
        </div>
      </div>
    </div>
  );
};
