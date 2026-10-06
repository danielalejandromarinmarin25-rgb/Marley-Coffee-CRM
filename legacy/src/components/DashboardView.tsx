import React from 'react';
import { 
  AlertTriangle, 
  Clock, 
  CreditCard, 
  Repeat, 
  ArrowUpRight, 
  Sparkles, 
  Package, 
  CheckCircle, 
  FileText, 
  ShieldCheck, 
  Flame,
  Calendar,
  Zap,
  TrendingUp,
  ShieldAlert,
  ShoppingCart,
  ArrowRight,
  Leaf,
  Award,
  Heart
} from 'lucide-react';
import { CompanyProfile, Product, Order, ReplenishmentSchedule, Language } from '../types';
import { translations } from '../data/translations';
import { calculateSmartSuggestions } from '../utils/suggestionEngine';
import { MarleyLogo, MarleyCertificationsBar } from './MarleyBrand';

interface DashboardViewProps {
  companyProfile: CompanyProfile;
  products: Product[];
  orders: Order[];
  replenishmentSchedules?: ReplenishmentSchedule[];
  schedules?: ReplenishmentSchedule[];
  language: Language;
  onQuickReorder: (order: Order) => void;
  onAddToCart: (product: Product, quantity?: number) => void;
  onNavigateToTab?: (tab: any) => void;
  onNavigate?: (tab: any) => void;
  onViewInvoice?: (order: Order) => void;
  onTriggerUrgentReplenish?: (product: Product) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  companyProfile,
  products = [],
  orders = [],
  replenishmentSchedules,
  schedules,
  language,
  onQuickReorder,
  onAddToCart,
  onNavigateToTab,
  onNavigate,
  onViewInvoice,
  onTriggerUrgentReplenish
}) => {
  const t = translations[language];
  const navigate = onNavigateToTab || onNavigate || (() => {});
  const safeProducts = Array.isArray(products) ? products : [];
  const safeOrders = Array.isArray(orders) ? orders : [];
  const effectiveSchedules = Array.isArray(schedules) ? schedules : (Array.isArray(replenishmentSchedules) ? replenishmentSchedules : []);

  // Calculate smart suggestions based on history and consumption rates
  const smartSummary = calculateSmartSuggestions(
    safeProducts,
    safeOrders,
    effectiveSchedules,
    1.0
  );

  // Calculate stock health
  const criticalProducts = safeProducts.filter(
    (p) => p && (p.currentStockOnPremise / (p.dailyBurnRate || 1) <= 2.5)
  );

  const frequentProducts = safeProducts.filter((p) => p && p.isFrequent);
  const activeSchedules = effectiveSchedules.filter((s) => s && s.status === 'active');
  const recentOrders = safeOrders.slice(0, 3);

  const availableCredit = companyProfile.approvedCreditLimit - companyProfile.usedCredit;
  const creditPercent = Math.min(100, Math.round((companyProfile.usedCredit / companyProfile.approvedCreditLimit) * 100));

  const topUrgentSuggestions = smartSummary.suggestions.slice(0, 3);

  return (
    <div className="space-y-6">
      
      {/* Top Banner: Marley Coffee B2B Portal & Credit Line Overview */}
      <div className="rounded-3xl border border-[#241E1A] bg-gradient-to-br from-[#161311] via-[#100D0B] to-[#0A0908] p-5 sm:p-7 shadow-2xl relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-[#F5B82E]/5 blur-3xl pointer-events-none"></div>

        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between relative z-10">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[#F5B82E] px-3 py-0.5 text-[11px] font-black text-black uppercase tracking-wider shadow-sm">
                Marley Coffee B2B Roastery
              </span>
              <span className="rounded-full border border-[#2E7D32]/50 bg-[#2E7D32]/20 px-2.5 py-0.5 text-[10px] font-bold text-[#4CAF50]">
                100% Orgánico & Fairtrade
              </span>
              <span className="text-xs text-neutral-400 font-mono">
                RFC/TAX: {companyProfile.taxId}
              </span>
            </div>
            
            <h1 className="mt-2.5 text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <span>{companyProfile.companyName}</span>
            </h1>
            
            <p className="mt-1.5 text-xs sm:text-sm text-neutral-300 flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-[#2E7D32] animate-pulse"></span>
              {companyProfile.currentBranch} • Término: <span className="font-bold text-[#F5B82E]">Net-{companyProfile.paymentTermDays} Días</span> • <span className="text-neutral-400 font-medium italic">"Stir It Up"</span>
            </p>

            <div className="mt-4 pt-3 border-t border-[#241E1A]">
              <MarleyCertificationsBar />
            </div>
          </div>

          {/* Credit Line Widget */}
          <div className="rounded-2xl border border-[#241E1A] bg-[#12100E] p-4 sm:w-84 shadow-inner">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-neutral-300 flex items-center gap-1.5">
                <CreditCard className="h-3.5 w-3.5 text-[#F5B82E]" />
                Línea Comercial Marley B2B
              </span>
              <span className="font-mono font-bold text-[#4CAF50]">
                ${availableCredit.toLocaleString()} USD Disp.
              </span>
            </div>

            {/* Progress Bar */}
            <div className="mt-2.5 h-2.5 w-full overflow-hidden rounded-full bg-[#1F1B18]">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  creditPercent > 85 ? 'bg-[#C0392B]' : 'bg-[#F5B82E]'
                }`}
                style={{ width: `${creditPercent}%` }}
              ></div>
            </div>

            <div className="mt-2 flex items-center justify-between text-[11px] text-neutral-400 font-mono">
              <span>Utilizado: ${companyProfile.usedCredit.toLocaleString()}</span>
              <span>Límite: ${companyProfile.approvedCreditLimit.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Critical Stock Alert Banner if any */}
      {criticalProducts.length > 0 && (
        <div className="rounded-2xl border border-[#DB0032]/40 bg-[#DB0032]/10 p-4 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#DB0032] text-white shadow-md">
                <AlertTriangle className="h-5 w-5 animate-pulse" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Alerta de Prevención de Quiebre de Stock</span>
                  <span className="rounded bg-[#DB0032] px-2 py-0.5 text-[10px] font-black uppercase">
                    {criticalProducts.length} Insumo(s) en Riesgo
                  </span>
                </h2>
                <p className="text-xs text-neutral-300 mt-0.5">
                  Los granos o insumos listados abajo tienen menos de 2.5 días de cobertura según la tasa de consumo de tu barra.
                </p>
              </div>
            </div>

            <button
              onClick={() => onNavigateToTab('replenishment')}
              className="shrink-0 rounded-xl bg-[#DB0032] px-4 py-2 text-xs font-extrabold text-white shadow-md hover:bg-[#b50029] transition active:scale-95"
            >
              Revisar y Reponer Inmediato
            </button>
          </div>

          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-2 border-t border-[#DB0032]/20">
            {criticalProducts.map((p) => {
              const daysLeft = (p.currentStockOnPremise / (p.dailyBurnRate || 1)).toFixed(1);
              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-xl bg-black/60 p-2.5 border border-[#DB0032]/30 text-xs"
                >
                  <div className="truncate pr-2">
                    <p className="font-bold text-white truncate">{p.name}</p>
                    <p className="text-[11px] text-red-300 font-mono">
                      Quedan {p.currentStockOnPremise} {p.unit.split(' ')[0]} (~{daysLeft} días)
                    </p>
                  </div>
                  <button
                    onClick={() => onTriggerUrgentReplenish(p)}
                    className="shrink-0 rounded-lg bg-[#F7BE00] px-2.5 py-1 text-[11px] font-bold text-black hover:bg-[#e0ac00]"
                  >
                    + Pedir
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Next Scheduled Replenishment */}
        <div className="rounded-2xl border border-[#222222] bg-[#121212] p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              Próximo Despacho
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F7BE00]/10 text-[#F7BE00] border border-[#F7BE00]/30">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-xl font-extrabold text-white">
            Mañana, 08:00 AM
          </p>
          <p className="mt-1 text-xs text-neutral-400">
            {activeSchedules.length} insumos en piloto automático
          </p>
        </div>

        {/* Loyalty Points */}
        <div className="rounded-2xl border border-[#222222] bg-[#121212] p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              Club Barista VIP
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#5E7E29]/10 text-[#5E7E29] border border-[#5E7E29]/30">
              <Sparkles className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-xl font-extrabold text-white font-mono">
            {companyProfile.loyaltyPoints.toLocaleString()} pts
          </p>
          <p className="mt-1 text-xs text-[#5E7E29] font-medium">
            Nivel {companyProfile.loyaltyTier} (-5% extra)
          </p>
        </div>

        {/* Total Monthly Volume */}
        <div className="rounded-2xl border border-[#222222] bg-[#121212] p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              Café Tostado este Mes
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-800 text-neutral-200">
              <Package className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-xl font-extrabold text-white font-mono">
            215.0 kg
          </p>
          <p className="mt-1 text-xs text-neutral-400">
            Ahorro por volumen: <span className="text-[#5E7E29] font-semibold">$380 USD</span>
          </p>
        </div>

        {/* Active Facturas */}
        <div className="rounded-2xl border border-[#222222] bg-[#121212] p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              Facturación Fiscal
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-800 text-neutral-200">
              <FileText className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-xl font-extrabold text-white">
            CFDI 4.0 Timbrado
          </p>
          <p className="mt-1 text-xs text-neutral-400">
            Descargas PDF/XML al instante
          </p>
        </div>

      </div>

      {/* Smart Suggestions Based on Order History & Burn Rate */}
      <div className="rounded-3xl border border-[#F7BE00]/30 bg-gradient-to-br from-[#181507] via-[#121212] to-black p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#2a2400]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#F7BE00] text-black shadow-md">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold text-white">
                  Sugerencias Predictivas de Recompra
                </h2>
                <span className="rounded-full bg-[#5E7E29]/20 border border-[#5E7E29]/50 px-2.5 py-0.5 text-[10px] font-black text-[#5E7E29] uppercase">
                  IA & Historial
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Insumos frecuentes que estás por agotar según tu patrón de consumo en barra
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate('suggestions')}
            className="flex items-center gap-1.5 text-xs font-bold text-[#F7BE00] hover:text-[#ffd644] transition self-start sm:self-auto"
          >
            <span>Ver módulo completo con simulador</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {/* 3 Top Suggestion Cards */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          {topUrgentSuggestions.map((sug) => {
            const product = products.find((p) => p.id === sug.productId);
            if (!product) return null;
            const isCrit = sug.urgencyLevel === 'critical';

            return (
              <div
                key={sug.id}
                className={`rounded-2xl border p-4 flex flex-col justify-between transition ${
                  isCrit
                    ? 'border-[#DB0032]/60 bg-[#1f0a0d]'
                    : 'border-[#F7BE00]/30 bg-[#1a1608]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase flex items-center gap-1 ${
                      isCrit ? 'bg-[#DB0032] text-white' : 'bg-[#F7BE00] text-black'
                    }`}>
                      {isCrit ? <ShieldAlert className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                      {sug.estimatedDaysLeft} días de stock
                    </span>
                    <span className="text-[10px] font-mono text-neutral-400">
                      {sug.aiConfidenceScore}% confianza
                    </span>
                  </div>

                  <h3 className="font-extrabold text-sm text-white line-clamp-1">
                    {sug.productName}
                  </h3>
                  <p className="text-[11px] text-neutral-400 mt-0.5 line-clamp-2">
                    {sug.reason}
                  </p>

                  <div className="mt-3 rounded-xl bg-black/60 p-2.5 space-y-1 text-xs">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-neutral-400">Stock Actual:</span>
                      <span className="font-mono font-bold text-white">
                        {sug.currentStock} {sug.unit.split(' ')[0]}
                      </span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-neutral-400">Quiebre Proyectado:</span>
                      <span className={`font-mono font-bold ${isCrit ? 'text-[#DB0032]' : 'text-[#F7BE00]'}`}>
                        {sug.predictedDepletionDayName}
                      </span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-neutral-400">Lote Recomendado:</span>
                      <span className="font-mono font-bold text-[#5E7E29]">
                        {sug.suggestedQuantity} {sug.unit.split(' ')[0]} (-{sug.appliedDiscountPercentage}%)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] text-neutral-400 block">Total Sugerido</span>
                    <span className="font-mono font-extrabold text-sm text-white">
                      ${sug.totalSuggestedCost.toFixed(2)} USD
                    </span>
                  </div>

                  <button
                    onClick={() => onAddToCart(product, sug.suggestedQuantity)}
                    className="flex items-center gap-1.5 rounded-xl bg-[#F7BE00] hover:bg-[#e0ac00] text-black px-3 py-2 text-xs font-extrabold shadow transition active:scale-95"
                  >
                    <ShoppingCart className="h-3.5 w-3.5" />
                    <span>Añadir {sug.suggestedQuantity}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* High-Rotation Frequent Orders Section (Pedidos Frecuentes con Recompra Rápida) */}
      <div className="rounded-3xl border border-[#222222] bg-[#121212] p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#222222]">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Flame className="h-5 w-5 text-[#F7BE00]" />
              {t.dashboard.frequentOrdersTitle}
            </h2>
            <p className="text-xs text-neutral-400">
              {t.dashboard.frequentOrdersDesc}
            </p>
          </div>
          <button
            onClick={() => onNavigateToTab('catalog')}
            className="text-xs font-bold text-[#F7BE00] hover:underline flex items-center gap-1 self-start sm:self-auto"
          >
            Explorar todo el catálogo B2B <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {frequentProducts.slice(0, 3).map((product) => {
            const daysLeft = (product.currentStockOnPremise / (product.dailyBurnRate || 1)).toFixed(1);
            return (
              <div
                key={product.id}
                className="group flex flex-col justify-between rounded-2xl border border-[#222222] bg-[#161616] p-4 hover:border-[#F7BE00]/50 transition shadow-sm"
              >
                <div>
                  <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black mb-3">
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <span className="absolute top-2 left-2 rounded-md bg-black/80 backdrop-blur-md px-2 py-0.5 text-[10px] font-bold text-[#F7BE00] border border-[#F7BE00]/30">
                      Alta Rotación
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-white line-clamp-1">
                    {product.name}
                  </h3>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    {product.origin || product.unit}
                  </p>

                  <div className="mt-3 flex items-center justify-between rounded-lg bg-[#0d0d0d] p-2 text-xs font-mono">
                    <span className="text-neutral-400 text-[11px]">En Cafetería:</span>
                    <span className={`font-bold ${Number(daysLeft) <= 2.5 ? 'text-[#DB0032]' : 'text-[#5E7E29]'}`}>
                      {product.currentStockOnPremise} ({daysLeft} d)
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#222222] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-neutral-500 uppercase block">Mayorista</span>
                    <span className="text-base font-extrabold text-white font-mono">
                      ${product.basePrice.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onAddToCart(product, 1)}
                      className="rounded-xl bg-[#F7BE00] px-3 py-2 text-xs font-bold text-black hover:bg-[#e0ac00] transition active:scale-95 flex items-center gap-1"
                    >
                      <Repeat className="h-3.5 w-3.5" />
                      Recomprar
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Orders & Instant Invoice Access */}
      <div className="rounded-3xl border border-[#222222] bg-[#121212] p-5 sm:p-6">
        <div className="flex items-center justify-between pb-4 border-b border-[#222222]">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#5E7E29]" />
              {t.dashboard.recentOrders}
            </h2>
            <p className="text-xs text-neutral-400">
              Historial de despachos, estatus de entrega y timbrado digital
            </p>
          </div>
          <button
            onClick={() => onNavigateToTab('orders')}
            className="text-xs font-bold text-[#F7BE00] hover:underline"
          >
            Ver todas las facturas →
          </button>
        </div>

        <div className="mt-4 divide-y divide-[#222222]">
          {recentOrders.map((order) => (
            <div
              key={order.id}
              className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-white">{order.orderNumber}</span>
                  <span className="rounded bg-[#5E7E29]/20 px-2 py-0.5 text-[10px] font-bold text-[#5E7E29] border border-[#5E7E29]/30">
                    {order.status.toUpperCase()}
                  </span>
                  {order.isAutoReplenish && (
                    <span className="rounded bg-[#F7BE00]/20 px-2 py-0.5 text-[10px] font-bold text-[#F7BE00] border border-[#F7BE00]/30">
                      Auto-Pilot
                    </span>
                  )}
                </div>
                <p className="text-neutral-400 text-[11px] mt-1">
                  {order.date} • {order.items.length} productos ({order.items.map(i => i.productName.split(' ')[0]).join(', ')})
                </p>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3">
                <div className="text-left sm:text-right">
                  <span className="text-neutral-400 text-[10px] block">Facturado Total</span>
                  <span className="font-mono font-extrabold text-sm text-white">
                    ${order.total.toFixed(2)} USD
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onViewInvoice(order)}
                    className="rounded-lg border border-[#333333] bg-[#181818] px-2.5 py-1.5 text-xs font-semibold text-neutral-200 hover:border-neutral-500 hover:text-white"
                  >
                    Factura PDF/XML
                  </button>
                  <button
                    onClick={() => onQuickReorder(order)}
                    className="rounded-lg bg-[#F7BE00] px-3 py-1.5 text-xs font-bold text-black hover:bg-[#e0ac00] transition active:scale-95 flex items-center gap-1"
                  >
                    <Repeat className="h-3 w-3" />
                    Reordenar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
