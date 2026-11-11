import React from 'react';
import { X, Flame, Box, ArrowRight, ArrowLeft } from 'lucide-react';
import { PlacedBuilding, ItemStack } from '../game/types';
import { ITEMS } from '../game/pokemonData';
import { sound } from '../game/audio';

interface StructureModalProps {
  structure: PlacedBuilding;
  inventory: ItemStack[];
  chestItems: ItemStack[];
  onTransferToChest: (itemId: string) => void;
  onTransferToInventory: (itemId: string) => void;
  onCookItem: (inputItemId: string, outputItemId: string) => void;
  hasFireCompanion: boolean;
  onClose: () => void;
}

export const StructureModal: React.FC<StructureModalProps> = ({
  structure,
  inventory,
  chestItems,
  onTransferToChest,
  onTransferToInventory,
  onCookItem,
  hasFireCompanion,
  onClose,
}) => {
  const isCampfire = structure.type === 'campfire';
  const isChest = structure.type === 'storage_chest';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-none select-none">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{isCampfire ? '🏕️' : '📦'}</span>
            <div>
              <h2 className="text-lg font-black uppercase text-white tracking-wide">
                {isCampfire ? 'Hoguera de Campamento' : 'Cofre de Suministros'}
              </h2>
              <p className="text-xs font-mono text-slate-400">
                {isCampfire
                  ? hasFireCompanion
                    ? '🔥 ¡Charmander aviva el fuego! Cocina instantánea.'
                    : 'Asa alimentos crudos para duplicar su valor nutricional.'
                  : 'Almacena recursos de forma segura en tu base.'}
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
          {isCampfire && (
            <div className="flex flex-col gap-4">
              <h3 className="text-xs font-mono uppercase text-amber-400 font-bold flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-500" />
                <span>Recetas de Asado al Fuego</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Cook Raw Meat */}
                {(() => {
                  const rawCount = inventory.find((s) => s.itemId === 'raw_meat')?.count || 0;
                  return (
                    <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">🥩</span>
                          <div>
                            <div className="text-xs font-bold text-white">Carne Asada</div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              Disponibles: {rawCount} carne cruda
                            </div>
                          </div>
                        </div>
                        <span className="text-xs font-mono text-emerald-400 font-bold">+60 Hambre</span>
                      </div>

                      <button
                        onClick={() => {
                          if (rawCount > 0) {
                            sound.playCraft();
                            onCookItem('raw_meat', 'cooked_meat');
                          }
                        }}
                        disabled={rawCount <= 0}
                        className={`w-full py-2 rounded-lg text-xs font-mono font-bold uppercase transition-all ${
                          rawCount > 0
                            ? 'bg-amber-600 hover:bg-amber-500 text-white cursor-pointer'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        Asar Carne [1x]
                      </button>
                    </div>
                  );
                })()}

                {/* Cook Berries */}
                {(() => {
                  const berryCount = inventory.find((s) => s.itemId === 'berry')?.count || 0;
                  return (
                    <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">🥧</span>
                          <div>
                            <div className="text-xs font-bold text-white">Bayas Caramelizadas</div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              Disponibles: {berryCount} bayas
                            </div>
                          </div>
                        </div>
                        <span className="text-xs font-mono text-amber-400 font-bold">+35 Hambre</span>
                      </div>

                      <button
                        onClick={() => {
                          if (berryCount >= 2) {
                            sound.playCraft();
                            onCookItem('berry', 'cooked_berry');
                          }
                        }}
                        disabled={berryCount < 2}
                        className={`w-full py-2 rounded-lg text-xs font-mono font-bold uppercase transition-all ${
                          berryCount >= 2
                            ? 'bg-amber-600 hover:bg-amber-500 text-white cursor-pointer'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        Asar Bayas [2x]
                      </button>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {isChest && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Player Inventory (Left) */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex flex-col gap-2">
                <span className="text-xs font-mono text-emerald-400 uppercase font-bold">
                  Tu Mochila (Guardar en cofre)
                </span>
                <div className="flex flex-col gap-1.5 max-h-56 overflow-y-auto">
                  {inventory.map((slot) => {
                    const item = ITEMS[slot.itemId];
                    return (
                      <div
                        key={slot.itemId}
                        className="flex items-center justify-between bg-slate-900 px-3 py-1.5 rounded-lg text-xs font-mono"
                      >
                        <div className="flex items-center gap-2">
                          <span>{item?.icon}</span>
                          <span className="text-slate-200 font-bold">{item?.name}</span>
                          <span className="text-emerald-400">x{slot.count}</span>
                        </div>
                        <button
                          onClick={() => {
                            sound.playBushGather();
                            onTransferToChest(slot.itemId);
                          }}
                          className="px-2 py-0.5 bg-amber-600 hover:bg-amber-500 text-white rounded text-[10px] font-bold cursor-pointer"
                        >
                          Guardar ➔
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Chest Stash (Right) */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex flex-col gap-2">
                <span className="text-xs font-mono text-amber-400 uppercase font-bold">
                  Contenido del Cofre (Retirar)
                </span>
                {chestItems.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 font-mono text-xs">
                    El cofre está vacío.
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5 max-h-56 overflow-y-auto">
                    {chestItems.map((slot) => {
                      const item = ITEMS[slot.itemId];
                      return (
                        <div
                          key={slot.itemId}
                          className="flex items-center justify-between bg-slate-900 px-3 py-1.5 rounded-lg text-xs font-mono"
                        >
                          <div className="flex items-center gap-2">
                            <span>{item?.icon}</span>
                            <span className="text-slate-200 font-bold">{item?.name}</span>
                            <span className="text-amber-400">x{slot.count}</span>
                          </div>
                          <button
                            onClick={() => {
                              sound.playBushGather();
                              onTransferToInventory(slot.itemId);
                            }}
                            className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold cursor-pointer"
                          >
                            ⬅ Retirar
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
