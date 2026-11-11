import React from 'react';
import { X, Hammer, Shield, Flame, Box, Bed, Lamp } from 'lucide-react';
import { BuildingType, ItemStack } from '../game/types';
import { ITEMS } from '../game/pokemonData';

interface BuildingMenuProps {
  inventory: ItemStack[];
  activeBuildingType: BuildingType | null;
  onSelectBuildingType: (type: BuildingType | null) => void;
  onClose: () => void;
}

const BUILDINGS: { type: BuildingType; itemId: string; label: string; icon: string }[] = [
  { type: 'foundation', itemId: 'foundation_item', label: 'Cimiento', icon: '🪵' },
  { type: 'wall', itemId: 'wall_item', label: 'Muro', icon: '🧱' },
  { type: 'campfire', itemId: 'campfire_item', label: 'Hoguera', icon: '🏕️' },
  { type: 'storage_chest', itemId: 'storage_chest_item', label: 'Cofre', icon: '📦' },
  { type: 'pal_bed', itemId: 'pal_bed_item', label: 'Cama Pal', icon: '🛏️' },
  { type: 'torch_post', itemId: 'torch_post_item', label: 'Antorcha', icon: '🏮' },
];

export const BuildingMenu: React.FC<BuildingMenuProps> = ({
  inventory,
  activeBuildingType,
  onSelectBuildingType,
  onClose,
}) => {
  return (
    <div className="fixed inset-x-0 bottom-24 z-40 flex justify-center px-4 pointer-events-none">
      <div className="pointer-events-auto bg-slate-900/95 border border-amber-500/50 rounded-2xl shadow-2xl p-4 max-w-xl w-full flex flex-col gap-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <Hammer className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-mono font-bold uppercase text-white tracking-wider">
              Modo Construcción de Base [B]
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {BUILDINGS.map((b) => {
            const count = inventory.find((slot) => slot.itemId === b.itemId)?.count || 0;
            const isSelected = activeBuildingType === b.type;

            return (
              <button
                key={b.type}
                onClick={() => {
                  if (isSelected) {
                    onSelectBuildingType(null);
                  } else {
                    onSelectBuildingType(b.type);
                  }
                }}
                className={`relative flex flex-col items-center justify-center p-3 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-amber-950/80 border-amber-400 shadow-lg shadow-amber-500/20 scale-105'
                    : count > 0
                    ? 'bg-slate-950/70 border-slate-800 hover:border-amber-500/50'
                    : 'bg-slate-950/30 border-slate-800/40 opacity-50'
                }`}
              >
                <span className="text-2xl mb-1">{b.icon}</span>
                <span className="text-[11px] font-bold text-white truncate max-w-full">
                  {b.label}
                </span>
                <span
                  className={`text-[10px] font-mono mt-0.5 ${
                    count > 0 ? 'text-amber-400 font-bold' : 'text-slate-500'
                  }`}
                >
                  Disponibles: {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="text-[11px] font-mono text-slate-400 text-center">
          {activeBuildingType ? (
            <span className="text-emerald-400">
              🟢 Haz clic en el terreno para colocar la estructura seleccionada
            </span>
          ) : (
            <span>Selecciona una estructura para colocar en la cuadrícula</span>
          )}
        </div>
      </div>
    </div>
  );
};
