import React from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  Check, 
  Sparkles, 
  CalendarClock, 
  Info, 
  TrendingDown, 
  Layers, 
  Leaf, 
  Coffee
} from 'lucide-react';
import { Product, ProductCategory, Language } from '../types';
import { translations } from '../data/translations';
import { MarleyCertificationsBar, MarleyRoastLevelBadge } from './MarleyBrand';

interface CatalogViewProps {
  products: Product[];
  language: Language;
  onAddToCart: (product: Product, quantity?: number) => void;
  onAddToReplenishmentSchedule: (product: Product) => void;
}

export const CatalogView: React.FC<CatalogViewProps> = ({
  products,
  language,
  onAddToCart,
  onAddToReplenishmentSchedule
}) => {
  const t = translations[language];
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState<string>('todos');
  const [selectedQuantities, setSelectedQuantities] = React.useState<{ [key: string]: number }>({});

  const categories = [
    { id: 'todos', label: 'Todo el Catálogo' },
    { id: 'granos', label: 'Café en Grano Orgánico' },
    { id: 'leches', label: 'Leches Vegetales Barista' },
    { id: 'jarabes', label: 'Jarabes Orgánicos' },
    { id: 'empaques', label: 'Marley Bio-Cups' },
    { id: 'limpieza', label: 'Limpieza & Mantenimiento' }
  ];

  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === 'todos' || p.category === selectedCategory;
    const matchesSearch = 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.origin && p.origin.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.tastingNotes && p.tastingNotes.some(n => n.toLowerCase().includes(searchQuery.toLowerCase()))) ||
      p.barcode.includes(searchQuery);
    return matchesCategory && matchesSearch;
  });

  const handleQtyChange = (productId: string, delta: number) => {
    setSelectedQuantities((prev) => {
      const current = prev[productId] || 1;
      const updated = Math.max(1, current + delta);
      return { ...prev, [productId]: updated };
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              {t.nav.catalog}
            </h1>
            <span className="rounded bg-[#F5B82E] px-2 py-0.5 text-[10px] font-black text-black uppercase">
              B2B Wholesale
            </span>
          </div>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            Cafés orgánicos certificados en grano entero, leches vegetales y complementos barista oficiales de Marley Coffee.
          </p>
        </div>

        {/* Volume Discount Info Pill */}
        <div className="flex items-center gap-2 rounded-2xl border border-[#2E7D32]/40 bg-[#2E7D32]/10 px-4 py-2 text-xs text-[#4CAF50]">
          <TrendingDown className="h-4 w-4 shrink-0 text-[#F5B82E]" />
          <span>
            <strong className="text-white">Escalas B2B:</strong> Hasta 18% OFF automático en compras de +30kg o +10 cajas.
          </span>
        </div>
      </div>

      {/* Marley Organic Certifications Bar */}
      <MarleyCertificationsBar />

      {/* Search & Category Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
          <input
            type="text"
            placeholder={t.common.search}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-2xl border border-[#241E1A] bg-[#12100E] py-2.5 pl-10 pr-4 text-xs sm:text-sm text-white placeholder-neutral-500 focus:border-[#F5B82E] focus:outline-none"
          />
        </div>

        {/* Categories Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`shrink-0 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                selectedCategory === cat.id
                  ? 'bg-[#F5B82E] text-black shadow-md'
                  : 'bg-[#161311] text-neutral-400 border border-[#241E1A] hover:text-white hover:border-neutral-600'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Product Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredProducts.map((product) => {
          const qty = selectedQuantities[product.id] || 1;
          
          // Calculate best wholesale tier price
          let effectiveUnitPrice = product.basePrice;
          let activeDiscount = 0;
          
          if (product.wholesaleTiers && product.wholesaleTiers.length > 0) {
            for (const tier of product.wholesaleTiers) {
              if (qty >= tier.minKg) {
                effectiveUnitPrice = tier.unitPrice;
                activeDiscount = tier.discountPercentage;
              }
            }
          }

          const totalPrice = effectiveUnitPrice * qty;

          return (
            <div
              key={product.id}
              className="flex flex-col justify-between rounded-3xl border border-[#241E1A] bg-[#14110F] p-5 shadow-lg hover:border-[#F5B82E]/40 transition group"
            >
              <div>
                {/* Image & Badges */}
                <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black mb-4">
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  
                  {product.origin && (
                    <span className="absolute top-2.5 left-2.5 rounded-lg bg-black/80 backdrop-blur-md px-2.5 py-1 text-[10px] font-bold text-white border border-neutral-700">
                      {product.origin.split('(')[0]}
                    </span>
                  )}

                  {product.isFrequent && (
                    <span className="absolute top-2.5 right-2.5 rounded-lg bg-[#F5B82E] px-2 py-0.5 text-[10px] font-black text-black shadow-sm">
                      Favorito Barista
                    </span>
                  )}
                </div>

                {/* Roast Level Badge if Coffee */}
                {product.roastLevel && (
                  <div className="mb-2">
                    <MarleyRoastLevelBadge roastLevel={product.roastLevel} />
                  </div>
                )}

                {/* Name & Origin */}
                <h3 className="font-extrabold text-base text-white tracking-tight group-hover:text-[#F5B82E] transition-colors">
                  {product.name}
                </h3>
                <p className="text-xs text-neutral-400 mt-1 leading-relaxed line-clamp-2">
                  {product.description}
                </p>

                {/* Coffee Specs details */}
                {product.variety && (
                  <p className="mt-2 text-[11px] text-neutral-400 font-medium">
                    <span className="text-neutral-500">Variedad:</span> {product.variety}
                  </p>
                )}

                {/* Coffee Tasting Specs if applicable */}
                {product.tastingNotes && (
                  <div className="mt-2.5 flex flex-wrap gap-1">
                    {product.tastingNotes.map((note, idx) => (
                      <span
                        key={idx}
                        className="rounded-md bg-[#1C1815] px-2 py-0.5 text-[10px] font-medium text-[#E5A93C] border border-[#2E241E]"
                      >
                        {note}
                      </span>
                    ))}
                  </div>
                )}

                {/* Wholesale Volume Tiers Table */}
                {product.wholesaleTiers && product.wholesaleTiers.length > 1 && (
                  <div className="mt-3.5 rounded-xl border border-[#241E1A] bg-[#0E0C0A] p-2.5">
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <Layers className="h-3 w-3 text-[#F5B82E]" />
                      Escalas de Precio Mayorista:
                    </p>
                    <div className="grid grid-cols-3 gap-1 text-[11px] font-mono">
                      {product.wholesaleTiers.map((t, idx) => (
                        <div
                          key={idx}
                          className={`rounded-lg p-1.5 text-center border ${
                            qty >= t.minKg
                              ? 'border-[#2E7D32] bg-[#2E7D32]/15 text-white font-bold'
                              : 'border-[#1F1B18] bg-[#161311] text-neutral-400'
                          }`}
                        >
                          <span className="block text-[9px] text-neutral-500">+{t.minKg}u</span>
                          <span className="text-[#F5B82E]">${t.unitPrice.toFixed(1)}</span>
                          {t.discountPercentage > 0 && (
                            <span className="block text-[9px] text-[#4CAF50]">
                              -{t.discountPercentage}%
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Controls & Total */}
              <div className="mt-5 pt-4 border-t border-[#222222]">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="text-[10px] text-neutral-500 uppercase block">Total ({qty} {product.unit.split(' ')[0]})</span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xl font-extrabold text-white font-mono">
                        ${totalPrice.toFixed(2)}
                      </span>
                      {activeDiscount > 0 && (
                        <span className="text-xs text-[#5E7E29] font-bold">
                          (-{activeDiscount}%)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="flex items-center rounded-xl border border-[#333333] bg-[#161616] p-1">
                    <button
                      onClick={() => handleQtyChange(product.id, -1)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-800 text-sm font-bold text-white hover:bg-neutral-700"
                    >
                      -
                    </button>
                    <span className="w-8 text-center text-xs font-mono font-bold text-white">
                      {qty}
                    </span>
                    <button
                      onClick={() => handleQtyChange(product.id, 1)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-800 text-sm font-bold text-white hover:bg-neutral-700"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Primary & Secondary Buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onAddToReplenishmentSchedule(product)}
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-[#333333] bg-[#1a1a1a] py-2.5 px-2 text-xs font-bold text-neutral-200 hover:border-[#F7BE00] hover:text-white transition"
                    title="Programar envíos recurrentes en días fijos"
                  >
                    <CalendarClock className="h-3.5 w-3.5 text-[#F7BE00]" />
                    <span className="truncate">Auto-Reponer</span>
                  </button>

                  <button
                    onClick={() => onAddToCart(product, qty)}
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-[#F7BE00] py-2.5 px-3 text-xs font-bold text-black shadow-md hover:bg-[#e0ac00] transition active:scale-95"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Al Pedido</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
