import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  AlertTriangle, 
  Clock, 
  TrendingUp, 
  ShoppingCart, 
  Calendar, 
  CheckCircle2, 
  Sliders, 
  ArrowRight, 
  RotateCw, 
  Package, 
  ShieldAlert, 
  Zap, 
  Filter, 
  Edit3, 
  Check, 
  Info,
  Flame,
  Coffee
} from 'lucide-react';
import { 
  Product, 
  Order, 
  ReplenishmentSchedule, 
  Language, 
  SmartSuggestion, 
  SmartSuggestionsSummary, 
  SuggestionUrgency 
} from '../types';
import { translations } from '../data/translations';
import { calculateSmartSuggestions } from '../utils/suggestionEngine';

interface SmartSuggestionsModuleProps {
  products: Product[];
  orders: Order[];
  schedules: ReplenishmentSchedule[];
  language: Language;
  activeBranch: string;
  onAddToCart: (product: Product, quantity?: number) => void;
  onAddToReplenish: (product: Product) => void;
  onUpdateStock: (productId: string, newStock: number) => void;
  onNavigateToTab: (tab: string) => void;
}

export const SmartSuggestionsModule: React.FC<SmartSuggestionsModuleProps> = ({
  products = [],
  orders = [],
  schedules = [],
  language,
  activeBranch,
  onAddToCart,
  onAddToReplenish,
  onUpdateStock,
  onNavigateToTab
}) => {
  const t = translations[language];

  // Surge Multiplier state (1.0 = Normal, 1.25 = Weekend Surge, 1.5 = Peak Season)
  const [surgeFactor, setSurgeFactor] = useState<number>(1.0);
  const [activeFilter, setActiveFilter] = useState<'all' | 'critical' | 'warning' | 'moderate'>('all');

  // Quantities selected per suggestion card
  const [quantities, setQuantities] = useState<{ [productId: string]: number }>({});

  // Inline stock edit state
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [tempStockValue, setTempStockValue] = useState<string>('');

  // Gemini AI Executive Insight
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState<boolean>(false);
  const [isAiGenerated, setIsAiGenerated] = useState<boolean>(false);

  // Safe arrays
  const safeProducts = Array.isArray(products) ? products : [];
  const safeOrders = Array.isArray(orders) ? orders : [];
  const safeSchedules = Array.isArray(schedules) ? schedules : [];

  // Calculate suggestions dynamically
  const summary: SmartSuggestionsSummary = React.useMemo(() => {
    return calculateSmartSuggestions(
      safeProducts,
      safeOrders,
      safeSchedules,
      surgeFactor
    );
  }, [safeProducts, safeOrders, safeSchedules, surgeFactor]);

  // Initialize quantities from calculated suggestions
  useEffect(() => {
    if (!summary || !Array.isArray(summary.suggestions)) return;
    setQuantities((prev) => {
      let changed = false;
      const updated = { ...prev };
      summary.suggestions.forEach((s) => {
        if (s && updated[s.productId] === undefined) {
          updated[s.productId] = s.suggestedQuantity;
          changed = true;
        }
      });
      return changed ? updated : prev;
    });
  }, [summary]);

  // Fetch or refresh Gemini AI suggestions analysis
  const fetchAiDiagnosis = async () => {
    setIsLoadingAi(true);
    try {
      const criticalItems = (summary.suggestions || [])
        .filter((s) => s && (s.urgencyLevel === 'critical' || s.urgencyLevel === 'warning'))
        .map((s) => ({
          name: s.productName,
          stock: s.currentStock,
          daysLeft: s.estimatedDaysLeft,
          burnRate: s.effectiveBurnRate,
          suggestedQty: s.suggestedQuantity,
          unit: s.unit
        }));

      const ordersSummary = safeOrders.slice(0, 4).map((o) => ({
        date: o?.date || '',
        total: o?.total || 0,
        itemCount: Array.isArray(o?.items) ? o.items.length : 0
      }));

      const response = await fetch('/api/ai/smart-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branch: activeBranch,
          surgeFactor: surgeFactor === 1.0 ? 'Normal (100%)' : surgeFactor === 1.25 ? 'Fin de Semana (+25%)' : 'Temporada Alta (+50%)',
          criticalItems,
          ordersSummary
        })
      });

      if (response.ok) {
        const data = await response.json();
        setAiInsight(data.insight);
        setIsAiGenerated(data.isAiGenerated);
      }
    } catch (err) {
      console.error('Error fetching AI diagnosis:', err);
    } finally {
      setIsLoadingAi(false);
    }
  };

  // Run AI diagnosis once on mount
  useEffect(() => {
    fetchAiDiagnosis();
  }, [activeBranch, surgeFactor]);

  // Bulk add all urgent items to cart
  const handleAddAllUrgent = () => {
    const urgentSuggestions = summary.suggestions.filter(
      (s) => s.urgencyLevel === 'critical' || s.urgencyLevel === 'warning'
    );

    urgentSuggestions.forEach((s) => {
      const prod = products.find((p) => p.id === s.productId);
      if (prod) {
        const qty = quantities[s.productId] || s.suggestedQuantity;
        onAddToCart(prod, qty);
      }
    });
  };

  // Filtered list
  const filteredSuggestions = summary.suggestions.filter((s) => {
    if (activeFilter === 'all') return true;
    return s.urgencyLevel === activeFilter;
  });

  const handleQtyChange = (productId: string, delta: number) => {
    setQuantities((prev) => {
      const current = prev[productId] || 1;
      const next = Math.max(1, current + delta);
      return { ...prev, [productId]: next };
    });
  };

  const handleSaveStock = (productId: string) => {
    const num = parseFloat(tempStockValue);
    if (!isNaN(num) && num >= 0) {
      onUpdateStock(productId, num);
    }
    setEditingStockId(null);
    setTempStockValue('');
  };

  return (
    <div className="space-y-6">
      
      {/* Module Header */}
      <div className="rounded-3xl border border-[#222222] bg-gradient-to-br from-[#121212] via-[#0e0e0e] to-black p-5 sm:p-7 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#F7BE00] text-black">
                <Sparkles className="h-4 w-4" />
              </span>
              <span className="rounded-full bg-[#F7BE00]/10 border border-[#F7BE00]/30 px-3 py-0.5 text-xs font-extrabold text-[#F7BE00] uppercase tracking-wider">
                Motor Predictivo B2B
              </span>
              <span className="text-xs text-neutral-400 font-mono">
                Sucursal: {activeBranch}
              </span>
            </div>
            <h1 className="mt-2.5 text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {t.suggestions.title}
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-neutral-400">
              {t.suggestions.subtitle}
            </p>
          </div>

          {/* Quick Bulk Reorder Action */}
          {summary.criticalCount + summary.warningCount > 0 && (
            <button
              id="reorder-all-urgent-btn"
              onClick={handleAddAllUrgent}
              className="flex items-center justify-center gap-2 rounded-2xl bg-[#DB0032] hover:bg-[#b8002a] text-white px-5 py-3 text-xs sm:text-sm font-extrabold shadow-xl hover:shadow-[#DB0032]/30 transition active:scale-95 shrink-0"
            >
              <Zap className="h-4 w-4" />
              <span>{t.suggestions.addAllUrgent}</span>
              <span className="rounded-full bg-black/40 px-2 py-0.5 text-[11px] font-mono font-bold">
                {summary.criticalCount + summary.warningCount} insumos
              </span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Critical Count */}
        <div 
          onClick={() => setActiveFilter('critical')}
          className={`cursor-pointer rounded-2xl border p-4.5 transition ${
            activeFilter === 'critical' 
              ? 'border-[#DB0032] bg-[#DB0032]/15 shadow-lg' 
              : 'border-[#222222] bg-[#121212] hover:border-[#DB0032]/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
              {t.suggestions.criticalAlert}
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#DB0032] text-white">
              <ShieldAlert className="h-4 w-4 animate-pulse" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-white font-mono">
            {summary.criticalCount} <span className="text-xs font-normal text-neutral-400">insumos</span>
          </p>
          <p className="mt-1 text-xs text-[#DB0032] font-semibold flex items-center gap-1">
            <span>Riesgo de agotamiento en &lt; 72 hrs</span>
          </p>
        </div>

        {/* Warning Count */}
        <div 
          onClick={() => setActiveFilter('warning')}
          className={`cursor-pointer rounded-2xl border p-4.5 transition ${
            activeFilter === 'warning' 
              ? 'border-[#F7BE00] bg-[#F7BE00]/15 shadow-lg' 
              : 'border-[#222222] bg-[#121212] hover:border-[#F7BE00]/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
              {t.suggestions.warningAlert}
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#F7BE00] text-black">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-white font-mono">
            {summary.warningCount} <span className="text-xs font-normal text-neutral-400">insumos</span>
          </p>
          <p className="mt-1 text-xs text-[#F7BE00] font-semibold">
            Agotamiento proyectado en 3-6 días
          </p>
        </div>

        {/* Potential Savings */}
        <div className="rounded-2xl border border-[#222222] bg-[#121212] p-4.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
              {t.suggestions.potentialSavings}
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#5E7E29] text-white">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-[#5E7E29] font-mono">
            +${summary.totalPotentialSavings.toLocaleString()} USD
          </p>
          <p className="mt-1 text-xs text-neutral-400">
            Ahorro al pedir en lotes con descuento
          </p>
        </div>

        {/* Average Coverage Days */}
        <div className="rounded-2xl border border-[#222222] bg-[#121212] p-4.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
              {t.suggestions.averageCoverage}
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-800 text-neutral-200">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-white font-mono">
            {summary.averageCoverageDays} <span className="text-xs font-normal text-neutral-400">días</span>
          </p>
          <p className="mt-1 text-xs text-neutral-400">
            Promedio global de existencias
          </p>
        </div>

      </div>

      {/* Gemini AI Executive Supply Diagnosis */}
      <div className="rounded-3xl border border-[#F7BE00]/30 bg-gradient-to-r from-[#181507] via-[#121212] to-[#0c0c0c] p-5 sm:p-6 text-white shadow-lg relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#332b00]">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F7BE00] text-black font-black">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                <span>{t.suggestions.aiInsightTitle}</span>
                {isAiGenerated && (
                  <span className="rounded bg-[#5E7E29] px-2 py-0.5 text-[10px] font-mono font-bold text-white uppercase">
                    Gemini 3.7 Flash Live
                  </span>
                )}
              </h3>
              <p className="text-xs text-neutral-400">
                Análisis predictivo de patrones de compra y cadencia de consumo
              </p>
            </div>
          </div>

          <button
            onClick={fetchAiDiagnosis}
            disabled={isLoadingAi}
            className="flex items-center gap-1.5 rounded-xl border border-[#F7BE00]/40 bg-[#F7BE00]/10 hover:bg-[#F7BE00]/20 text-[#F7BE00] px-3.5 py-1.5 text-xs font-bold transition disabled:opacity-50 self-start sm:self-auto"
          >
            <RotateCw className={`h-3.5 w-3.5 ${isLoadingAi ? 'animate-spin' : ''}`} />
            <span>{t.suggestions.refreshAi}</span>
          </button>
        </div>

        <div className="mt-4 text-xs sm:text-sm text-neutral-200 leading-relaxed font-sans whitespace-pre-line">
          {isLoadingAi ? (
            <div className="flex items-center gap-3 py-4 text-neutral-400">
              <RotateCw className="h-5 w-5 animate-spin text-[#F7BE00]" />
              <span>Analizando matriz de consumo y pedidos históricos con Gemini AI...</span>
            </div>
          ) : (
            aiInsight || 'Diagnóstico logístico listo para optimizar compras de cafetería.'
          )}
        </div>
      </div>

      {/* Interactive Tooling Bar: Surge Multiplier & Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 rounded-2xl border border-[#222222] bg-[#121212] p-4">
        
        {/* Urgency Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-neutral-400 mr-1 flex items-center gap-1">
            <Filter className="h-3.5 w-3.5" /> Filtrar:
          </span>
          
          <button
            onClick={() => setActiveFilter('all')}
            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
              activeFilter === 'all'
                ? 'bg-neutral-200 text-black shadow'
                : 'bg-[#1c1c1c] text-neutral-400 hover:text-white'
            }`}
          >
            {t.suggestions.filterAll} ({summary.suggestions.length})
          </button>

          <button
            onClick={() => setActiveFilter('critical')}
            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
              activeFilter === 'critical'
                ? 'bg-[#DB0032] text-white shadow'
                : 'bg-[#1c1c1c] text-neutral-400 hover:text-white'
            }`}
          >
            {t.suggestions.filterCritical} ({summary.criticalCount})
          </button>

          <button
            onClick={() => setActiveFilter('warning')}
            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
              activeFilter === 'warning'
                ? 'bg-[#F7BE00] text-black shadow'
                : 'bg-[#1c1c1c] text-neutral-400 hover:text-white'
            }`}
          >
            {t.suggestions.filterWarning} ({summary.warningCount})
          </button>

          <button
            onClick={() => setActiveFilter('moderate')}
            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
              activeFilter === 'moderate'
                ? 'bg-[#5E7E29] text-white shadow'
                : 'bg-[#1c1c1c] text-neutral-400 hover:text-white'
            }`}
          >
            {t.suggestions.filterModerate} ({summary.moderateCount})
          </button>
        </div>

        {/* Surge Rate Simulator (Consumption Pace) */}
        <div className="flex flex-wrap items-center gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-[#222222]">
          <span className="text-xs font-bold text-neutral-400 flex items-center gap-1">
            <Sliders className="h-3.5 w-3.5 text-[#F7BE00]" /> {t.suggestions.surgeSimulator}:
          </span>

          <button
            onClick={() => setSurgeFactor(1.0)}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
              surgeFactor === 1.0
                ? 'bg-[#F7BE00] text-black font-bold'
                : 'bg-[#1a1a1a] text-neutral-400 hover:text-white'
            }`}
          >
            {t.suggestions.surgeNormal}
          </button>

          <button
            onClick={() => setSurgeFactor(1.25)}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
              surgeFactor === 1.25
                ? 'bg-[#F7BE00] text-black font-bold'
                : 'bg-[#1a1a1a] text-neutral-400 hover:text-white'
            }`}
          >
            {t.suggestions.surgeWeekend}
          </button>

          <button
            onClick={() => setSurgeFactor(1.5)}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
              surgeFactor === 1.5
                ? 'bg-[#F7BE00] text-black font-bold'
                : 'bg-[#1a1a1a] text-neutral-400 hover:text-white'
            }`}
          >
            {t.suggestions.surgePeak}
          </button>
        </div>

      </div>

      {/* Suggestion Cards Grid */}
      {filteredSuggestions.length === 0 ? (
        <div className="rounded-3xl border border-[#222222] bg-[#121212] p-12 text-center text-neutral-400">
          <Package className="mx-auto h-12 w-12 text-neutral-600 mb-3" />
          <p className="text-sm font-semibold text-neutral-300">{t.suggestions.noSuggestionsFound}</p>
          <button
            onClick={() => setActiveFilter('all')}
            className="mt-3 text-xs text-[#F7BE00] font-bold hover:underline"
          >
            Mostrar todos los insumos sugeridos
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredSuggestions.map((suggestion) => {
            const product = products.find((p) => p.id === suggestion.productId);
            if (!product) return null;

            const selectedQty = quantities[suggestion.productId] || suggestion.suggestedQuantity;
            
            // Dynamic price calculation based on selected qty
            let unitPrice = product.basePrice;
            let discountPercent = 0;
            if (product.wholesaleTiers) {
              for (const tier of product.wholesaleTiers) {
                if (selectedQty >= tier.minKg) {
                  unitPrice = tier.unitPrice;
                  discountPercent = tier.discountPercentage;
                }
              }
            }
            const currentTotal = unitPrice * selectedQty;
            const currentSavings = (product.basePrice - unitPrice) * selectedQty;

            const isCritical = suggestion.urgencyLevel === 'critical';
            const isWarning = suggestion.urgencyLevel === 'warning';

            // Stock coverage percentage of optimal level
            const stockPct = Math.min(100, Math.round((suggestion.currentStock / (suggestion.optimalStockLevel || 10)) * 100));

            return (
              <div
                key={suggestion.id}
                className={`group flex flex-col justify-between rounded-3xl border p-5 sm:p-6 transition shadow-md ${
                  isCritical
                    ? 'border-[#DB0032]/60 bg-gradient-to-b from-[#18090b] to-[#121212] hover:border-[#DB0032]'
                    : isWarning
                    ? 'border-[#F7BE00]/40 bg-gradient-to-b from-[#181507] to-[#121212] hover:border-[#F7BE00]'
                    : 'border-[#262626] bg-[#141414] hover:border-neutral-700'
                }`}
              >
                <div>
                  
                  {/* Top Badges & Product Image */}
                  <div className="flex gap-4 items-start">
                    <div className="relative h-20 w-20 sm:h-24 sm:w-24 shrink-0 overflow-hidden rounded-2xl bg-black border border-[#2a2a2a]">
                      <img
                        src={suggestion.imageUrl}
                        alt={suggestion.productName}
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover group-hover:scale-105 transition duration-300"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                        {isCritical ? (
                          <span className="rounded-full bg-[#DB0032] px-2.5 py-0.5 text-[10px] font-black text-white uppercase tracking-wider flex items-center gap-1">
                            <ShieldAlert className="h-3 w-3" /> Agotamiento Crítico
                          </span>
                        ) : isWarning ? (
                          <span className="rounded-full bg-[#F7BE00] px-2.5 py-0.5 text-[10px] font-black text-black uppercase tracking-wider flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" /> Por Agotar
                          </span>
                        ) : (
                          <span className="rounded-full bg-[#5E7E29]/20 border border-[#5E7E29]/40 px-2.5 py-0.5 text-[10px] font-bold text-[#5E7E29] uppercase">
                            Consumo Frecuente
                          </span>
                        )}

                        <span className="rounded-full bg-neutral-800 px-2 py-0.5 text-[10px] font-semibold text-neutral-300 capitalize">
                          {suggestion.category}
                        </span>

                        <span className="rounded-full bg-black/60 border border-neutral-700 px-2 py-0.5 text-[10px] font-mono text-neutral-400">
                          {suggestion.aiConfidenceScore}% Confianza
                        </span>
                      </div>

                      <h3 className="text-base font-extrabold text-white leading-tight truncate">
                        {suggestion.productName}
                      </h3>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        Unidad: <span className="text-neutral-200 font-medium">{suggestion.unit}</span>
                      </p>
                    </div>
                  </div>

                  {/* Stock & Depletion Countdown Gauge */}
                  <div className="mt-4 rounded-2xl bg-black/60 border border-[#222222] p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-neutral-400 flex items-center gap-1.5">
                        <Package className="h-3.5 w-3.5 text-neutral-500" />
                        {t.suggestions.currentStockLabel}:
                      </span>
                      
                      {editingStockId === suggestion.productId ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            step="0.5"
                            value={tempStockValue}
                            onChange={(e) => setTempStockValue(e.target.value)}
                            className="w-20 rounded-lg bg-neutral-900 border border-[#F7BE00] px-2 py-0.5 text-xs text-white text-right focus:outline-none"
                            placeholder={suggestion.currentStock.toString()}
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveStock(suggestion.productId)}
                            className="rounded-lg bg-[#5E7E29] p-1 text-white hover:bg-[#4d6821]"
                          >
                            <Check className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-white">
                            {suggestion.currentStock} {suggestion.unit.split(' ')[0]}
                          </span>
                          <button
                            onClick={() => {
                              setEditingStockId(suggestion.productId);
                              setTempStockValue(suggestion.currentStock.toString());
                            }}
                            className="text-neutral-500 hover:text-[#F7BE00] text-[10px] flex items-center gap-0.5"
                            title="Ajustar conteo físico"
                          >
                            <Edit3 className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Progress Bar of Stock */}
                    <div className="h-2 w-full overflow-hidden rounded-full bg-[#1c1c1c]">
                      <div
                        className={`h-full transition-all duration-500 ${
                          isCritical ? 'bg-[#DB0032]' : isWarning ? 'bg-[#F7BE00]' : 'bg-[#5E7E29]'
                        }`}
                        style={{ width: `${Math.max(8, stockPct)}%` }}
                      ></div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#1c1c1c] text-xs">
                      <div>
                        <span className="text-neutral-500 block text-[10px] uppercase font-bold">
                          {t.suggestions.burnRateLabel}
                        </span>
                        <span className="font-mono font-bold text-neutral-200">
                          {suggestion.effectiveBurnRate} {suggestion.unit.split(' ')[0]}/día
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-neutral-500 block text-[10px] uppercase font-bold">
                          {t.suggestions.depletionProjected}
                        </span>
                        <span className={`font-mono font-bold ${
                          isCritical ? 'text-[#DB0032]' : isWarning ? 'text-[#F7BE00]' : 'text-neutral-200'
                        }`}>
                          {suggestion.predictedDepletionDayName} (~{suggestion.estimatedDaysLeft} d)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Purchase History & Reasoning Pill */}
                  <div className="mt-3 rounded-xl bg-[#181818] border border-[#262626] p-3 text-xs text-neutral-300 leading-relaxed">
                    <p className="flex items-start gap-2">
                      <Info className="h-3.5 w-3.5 text-[#F7BE00] shrink-0 mt-0.5" />
                      <span>{suggestion.reason}</span>
                    </p>
                    
                    {suggestion.hasActiveSchedule && (
                      <p className="mt-2 text-[11px] text-[#5E7E29] flex items-center gap-1 font-semibold">
                        <Calendar className="h-3 w-3" />
                        Despacho automático activo: {suggestion.activeScheduleDays?.join(', ')}
                      </p>
                    )}
                  </div>

                  {/* Batch Wholesale Pricing Matrix */}
                  <div className="mt-4 rounded-2xl border border-[#2a2a2a] bg-[#161616] p-3.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                        {t.suggestions.suggestedBatch}
                      </span>
                      {discountPercent > 0 && (
                        <span className="rounded-full bg-[#5E7E29]/20 border border-[#5E7E29]/50 px-2 py-0.5 text-[10px] font-black text-[#5E7E29]">
                          -{discountPercent}% Descuento B2B
                        </span>
                      )}
                    </div>

                    <div className="mt-2.5 flex items-center justify-between gap-3">
                      {/* Quantity Selector */}
                      <div className="flex items-center rounded-xl border border-[#333333] bg-black p-1">
                        <button
                          onClick={() => handleQtyChange(suggestion.productId, -1)}
                          className="h-7 w-7 rounded-lg bg-neutral-800 text-white hover:bg-neutral-700 flex items-center justify-center font-bold text-sm"
                        >
                          -
                        </button>
                        <span className="w-12 text-center font-mono font-extrabold text-sm text-white">
                          {selectedQty}
                        </span>
                        <button
                          onClick={() => handleQtyChange(suggestion.productId, 1)}
                          className="h-7 w-7 rounded-lg bg-neutral-800 text-white hover:bg-neutral-700 flex items-center justify-center font-bold text-sm"
                        >
                          +
                        </button>
                      </div>

                      {/* Total & Unit Price */}
                      <div className="text-right">
                        <div className="flex items-baseline justify-end gap-1.5">
                          {discountPercent > 0 && (
                            <span className="text-xs text-neutral-500 line-through font-mono">
                              ${(product.basePrice * selectedQty).toFixed(2)}
                            </span>
                          )}
                          <span className="text-lg font-extrabold text-white font-mono">
                            ${currentTotal.toFixed(2)} <span className="text-xs font-normal text-neutral-400">USD</span>
                          </span>
                        </div>
                        {currentSavings > 0 && (
                          <span className="text-[11px] text-[#5E7E29] font-bold">
                            Ahorras ${currentSavings.toFixed(2)} USD
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                </div>

                {/* Card Actions */}
                <div className="mt-5 pt-4 border-t border-[#222222] flex flex-col sm:flex-row gap-2">
                  <button
                    id={`add-suggestion-cart-${suggestion.productId}`}
                    onClick={() => onAddToCart(product, selectedQty)}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#F7BE00] hover:bg-[#e0ac00] text-black px-4 py-2.5 text-xs font-extrabold shadow-md transition active:scale-95"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    <span>{t.common.addToCart} ({selectedQty} {suggestion.unit.split(' ')[0]})</span>
                  </button>

                  <button
                    onClick={() => onAddToReplenish(product)}
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-[#333333] bg-[#1a1a1a] hover:bg-[#252525] text-neutral-200 px-3 py-2.5 text-xs font-bold transition active:scale-95"
                  >
                    <Calendar className="h-4 w-4 text-[#F7BE00]" />
                    <span className="hidden sm:inline">Programar</span>
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Bottom Floating Navigation Advice */}
      <div className="rounded-3xl border border-[#222222] bg-[#121212] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h4 className="font-extrabold text-sm text-white">
            ¿Deseas fijar entregas periódicas automáticas de estos insumos?
          </h4>
          <p className="text-xs text-neutral-400 mt-0.5">
            Configura el calendario semanal de reposición y recibe café recién tostado sin pedir manualmente.
          </p>
        </div>
        <button
          onClick={() => onNavigateToTab('replenishment')}
          className="flex items-center gap-2 rounded-xl border border-[#F7BE00] bg-[#F7BE00]/10 hover:bg-[#F7BE00] text-[#F7BE00] hover:text-black px-4 py-2 text-xs font-extrabold transition shrink-0"
        >
          <span>Ir a Calendario de Reposición</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

    </div>
  );
};
