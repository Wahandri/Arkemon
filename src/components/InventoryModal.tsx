import React, { useState } from 'react';
import { X, Wrench, Hammer, Sparkles, Shield, Apple, Check, AlertCircle } from 'lucide-react';
import { ItemStack, Recipe } from '../game/types';
import { ITEMS, RECIPES } from '../game/pokemonData';
import { canCraft } from '../game/rules';
import { sound } from '../game/audio';

interface InventoryModalProps {
  inventory: ItemStack[];
  onCraft: (recipe: Recipe) => void;
  onUseItem: (itemId: string) => void;
  onClose: () => void;
}

export const InventoryModal: React.FC<InventoryModalProps> = ({
  inventory,
  onCraft,
  onUseItem,
  onClose,
}) => {
  const [activeCategory, setActiveCategory] = useState<
    'all' | 'tools' | 'weapons' | 'spheres' | 'survival' | 'structures'
  >('all');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(RECIPES[0]);

  const filteredRecipes = RECIPES.filter((r) =>
    activeCategory === 'all' ? true : r.category === activeCategory
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-none select-none">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎒</span>
            <div>
              <h2 className="text-lg font-black uppercase text-white tracking-wide">
                Mochila y Engramas de Supervivencia
              </h2>
              <p className="text-xs font-mono text-slate-400">
                Presiona TAB o C para cerrar
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
            title="Cerrar [ESC]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content: 2 Columns (Left: Inventory Grid, Right: Crafting Tree) */}
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-800 flex-1 overflow-y-auto">
          {/* LEFT: INVENTORY SLOTS */}
          <div className="p-6 flex flex-col gap-4">
            <h3 className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-bold flex items-center gap-2">
              <span>Inventario del Superviviente</span>
              <span className="text-slate-500 text-[10px]">({inventory.length} ranuras)</span>
            </h3>

            {inventory.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-500 font-mono text-xs border border-dashed border-slate-800 rounded-xl">
                <span>Tu mochila está vacía.</span>
                <span className="mt-1">Golpea árboles con los puños o recoge arbustos.</span>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                {inventory.map((slot, idx) => {
                  const item = ITEMS[slot.itemId];
                  if (!item) return null;
                  const isConsumable = item.type === 'consumable';

                  return (
                    <div
                      key={idx}
                      className="group relative bg-slate-950/70 border border-slate-800 hover:border-emerald-500/60 p-2.5 rounded-xl flex flex-col items-center justify-between text-center transition-all"
                    >
                      <span className="text-2xl mb-1">{item.icon}</span>
                      <span className="text-xs font-bold text-slate-200 line-clamp-1">
                        {item.name}
                      </span>
                      <span className="text-[11px] font-mono font-bold text-emerald-400 bg-slate-900 px-1.5 py-0.5 rounded mt-1">
                        x{slot.count}
                      </span>

                      {/* Quick Use button for food / consumables */}
                      {isConsumable && (
                        <button
                          onClick={() => {
                            onUseItem(slot.itemId);
                            sound.playBushGather();
                          }}
                          className="mt-2 w-full text-[10px] font-mono font-bold bg-amber-600 hover:bg-amber-500 text-white py-1 rounded transition-colors cursor-pointer"
                        >
                          Comer
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* RIGHT: CRAFTING WORKBENCH */}
          <div className="p-6 flex flex-col gap-4 bg-slate-950/40">
            {/* Category tabs */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs font-mono">
              {[
                { id: 'all', label: 'Todos' },
                { id: 'tools', label: 'Herramientas' },
                { id: 'weapons', label: 'Armas' },
                { id: 'spheres', label: 'Esferas' },
                { id: 'survival', label: 'Hoguera' },
                { id: 'structures', label: 'Base' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveCategory(tab.id as unknown as typeof activeCategory)}
                  className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                    activeCategory === tab.id
                      ? 'bg-emerald-600 text-white font-bold'
                      : 'bg-slate-800/80 text-slate-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Recipes Grid */}
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
              {filteredRecipes.map((r) => {
                const item = ITEMS[r.resultItemId];
                const affordable = canCraft(r, inventory);
                const isSelected = selectedRecipe?.id === r.id;

                return (
                  <button
                    key={r.id}
                    onClick={() => setSelectedRecipe(r)}
                    className={`flex items-center gap-2 p-2 rounded-xl text-left border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-950/80 border-emerald-400'
                        : affordable
                        ? 'bg-slate-900 border-slate-700 hover:border-slate-500'
                        : 'bg-slate-950/50 border-slate-800/60 opacity-60'
                    }`}
                  >
                    <span className="text-xl">{item?.icon || '🔨'}</span>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate">
                        {item?.name}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400">
                        {affordable ? (
                          <span className="text-emerald-400">Disponible</span>
                        ) : (
                          <span className="text-rose-400">Faltan materiales</span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Selected Recipe Inspection & Craft Button */}
            {selectedRecipe && (
              <div className="mt-auto bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
                {(() => {
                  const resultItem = ITEMS[selectedRecipe.resultItemId];
                  const affordable = canCraft(selectedRecipe, inventory);

                  return (
                    <>
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{resultItem?.icon}</span>
                        <div>
                          <h4 className="text-sm font-bold text-white">
                            {resultItem?.name} (x{selectedRecipe.resultCount})
                          </h4>
                          <p className="text-xs text-slate-400 font-normal">
                            {resultItem?.description}
                          </p>
                        </div>
                      </div>

                      {/* Ingredients list */}
                      <div className="flex flex-wrap gap-2 text-xs font-mono pt-2 border-t border-slate-800">
                        {selectedRecipe.ingredients.map((ing) => {
                          const ingItem = ITEMS[ing.itemId];
                          const available =
                            inventory.find((slot) => slot.itemId === ing.itemId)?.count || 0;
                          const hasEnough = available >= ing.count;

                          return (
                            <span
                              key={ing.itemId}
                              className={`px-2 py-1 rounded border flex items-center gap-1 ${
                                hasEnough
                                  ? 'bg-emerald-950/50 border-emerald-800 text-emerald-300'
                                  : 'bg-rose-950/50 border-rose-800 text-rose-300'
                              }`}
                            >
                              <span>{ingItem?.icon}</span>
                              <span>
                                {ingItem?.name}: {available}/{ing.count}
                              </span>
                            </span>
                          );
                        })}
                      </div>

                      {/* Craft Action CTA */}
                      <button
                        onClick={() => {
                          if (affordable) {
                            sound.playCraft();
                            onCraft(selectedRecipe);
                          }
                        }}
                        disabled={!affordable}
                        className={`w-full py-2.5 rounded-xl font-bold font-mono text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                          affordable
                            ? 'bg-emerald-500 hover:bg-emerald-400 active:scale-98 text-slate-950 cursor-pointer shadow-lg shadow-emerald-950'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        <Hammer className="w-4 h-4" />
                        <span>Fabricar Objeto</span>
                      </button>
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
