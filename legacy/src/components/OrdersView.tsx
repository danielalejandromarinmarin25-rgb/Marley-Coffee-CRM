import React from 'react';
import { 
  Receipt, 
  Repeat, 
  FileText, 
  Download, 
  Calendar, 
  CreditCard, 
  Truck, 
  CheckCircle2, 
  Clock, 
  Search,
  Building2
} from 'lucide-react';
import { Order, OrderStatus, Language } from '../types';
import { translations } from '../data/translations';

interface OrdersViewProps {
  orders: Order[];
  language: Language;
  onQuickReorder: (order: Order) => void;
  onViewInvoice: (order: Order) => void;
}

export const OrdersView: React.FC<OrdersViewProps> = ({
  orders = [],
  language,
  onQuickReorder,
  onViewInvoice
}) => {
  const t = translations[language];
  const [statusFilter, setStatusFilter] = React.useState<string>('all');
  const [searchQuery, setSearchQuery] = React.useState<string>('');

  const safeOrders = Array.isArray(orders) ? orders : [];

  const filteredOrders = safeOrders.filter((order) => {
    if (!order) return false;
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const itemsList = Array.isArray(order.items) ? order.items : [];
    const matchesSearch = 
      (order.orderNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.invoiceNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      itemsList.some(i => i && (i.productName || '').toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'entregado':
        return (
          <span className="flex items-center gap-1 rounded-full bg-[#5E7E29]/20 px-2.5 py-0.5 text-[10px] font-bold text-[#5E7E29] border border-[#5E7E29]/40">
            <CheckCircle2 className="h-3 w-3" />
            Entregado
          </span>
        );
      case 'en_camino':
        return (
          <span className="flex items-center gap-1 rounded-full bg-[#F7BE00]/20 px-2.5 py-0.5 text-[10px] font-bold text-[#F7BE00] border border-[#F7BE00]/40">
            <Truck className="h-3 w-3 animate-bounce" />
            En Reparto
          </span>
        );
      case 'tostando':
        return (
          <span className="flex items-center gap-1 rounded-full bg-neutral-800 px-2.5 py-0.5 text-[10px] font-bold text-neutral-300 border border-neutral-700">
            <Clock className="h-3 w-3" />
            En Tostaduría
          </span>
        );
      case 'pendiente_pago':
        return (
          <span className="flex items-center gap-1 rounded-full bg-[#DB0032]/20 px-2.5 py-0.5 text-[10px] font-bold text-[#DB0032] border border-[#DB0032]/40">
            Pendiente de Pago
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Receipt className="h-6 w-6 text-[#5E7E29]" />
            {t.orders.title}
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            {t.orders.subtitle}
          </p>
        </div>

        {/* Global Summary Badge */}
        <div className="flex items-center gap-3 rounded-2xl border border-[#222222] bg-[#121212] px-4 py-2 text-xs">
          <div>
            <span className="text-[10px] text-neutral-500 uppercase block">Total Pedidos</span>
            <span className="font-mono font-bold text-white text-sm">{safeOrders.length} pedidos</span>
          </div>
          <div className="h-7 w-px bg-neutral-800"></div>
          <div>
            <span className="text-[10px] text-neutral-500 uppercase block">Facturación Total</span>
            <span className="font-mono font-bold text-[#5E7E29] text-sm">
              ${safeOrders.reduce((acc, o) => acc + (o?.total || 0), 0).toFixed(2)} USD
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
          <input
            type="text"
            placeholder="Buscar por número de pedido, factura fiscal o producto..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-2xl border border-[#262626] bg-[#121212] py-2.5 pl-10 pr-4 text-xs sm:text-sm text-white placeholder-neutral-500 focus:border-[#F7BE00] focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {[
            { id: 'all', label: 'Todos' },
            { id: 'entregado', label: 'Entregados' },
            { id: 'en_camino', label: 'En Camino' },
            { id: 'tostando', label: 'En Tostaduría' }
          ].map((status) => (
            <button
              key={status.id}
              onClick={() => setStatusFilter(status.id)}
              className={`shrink-0 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                statusFilter === status.id
                  ? 'bg-[#F7BE00] text-black'
                  : 'bg-[#141414] text-neutral-400 border border-[#222222] hover:text-white'
              }`}
            >
              {status.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="rounded-3xl border border-[#222222] bg-[#121212] p-8 text-center">
            <p className="text-neutral-400 text-sm">No se encontraron pedidos con ese criterio.</p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div
              key={order.id}
              className="rounded-3xl border border-[#222222] bg-[#121212] p-5 sm:p-6 shadow-lg hover:border-neutral-700 transition"
            >
              {/* Order Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#222222]">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-mono font-extrabold text-base text-white">
                    {order.orderNumber}
                  </span>
                  {getStatusBadge(order.status)}
                  {order.isAutoReplenish && (
                    <span className="rounded bg-[#F7BE00]/10 text-[#F7BE00] px-2 py-0.5 text-[10px] font-bold border border-[#F7BE00]/30">
                      Auto-Pilot
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs text-neutral-400">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{order.date}</span>
                  <span>•</span>
                  <span>{order.branch}</span>
                </div>
              </div>

              {/* Items List */}
              <div className="mt-4 divide-y divide-[#1e1e1e]">
                {order.items.map((item, idx) => (
                  <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-neutral-800 text-neutral-300 font-mono font-bold text-[11px]">
                        {item.quantity}x
                      </span>
                      <span className="font-semibold text-white">{item.productName}</span>
                    </div>

                    <div className="text-right font-mono">
                      <span className="text-neutral-400 text-[11px] mr-2">
                        (${item.unitPrice.toFixed(2)}/u)
                      </span>
                      <span className="font-bold text-neutral-200">
                        ${item.total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Footer & Actions */}
              <div className="mt-4 pt-4 border-t border-[#222222] flex flex-col md:flex-row md:items-center justify-between gap-4">
                
                {/* Financial Summary */}
                <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
                  <div>
                    <span className="text-neutral-500 text-[10px] block">Subtotal</span>
                    <span className="text-neutral-300">${order.subtotal.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 text-[10px] block">IVA (16%)</span>
                    <span className="text-neutral-300">${order.tax.toFixed(2)}</span>
                  </div>
                  {order.discount > 0 && (
                    <div>
                      <span className="text-neutral-500 text-[10px] block">Descuento B2B</span>
                      <span className="text-[#5E7E29]">-${order.discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-neutral-500 text-[10px] block">Total Facturado</span>
                    <span className="text-base font-extrabold text-white">
                      ${order.total.toFixed(2)} USD
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-500 text-[10px] block">Puntos Ganados</span>
                    <span className="text-[#F7BE00] font-bold">+{order.pointsEarned} pts</span>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onViewInvoice(order)}
                    className="flex items-center gap-1.5 rounded-xl border border-[#333333] bg-[#161616] px-3 py-2 text-xs font-bold text-neutral-200 hover:border-neutral-500 hover:text-white transition"
                  >
                    <FileText className="h-3.5 w-3.5 text-[#5E7E29]" />
                    <span>Factura CFDI 4.0</span>
                  </button>

                  <button
                    onClick={() => onQuickReorder(order)}
                    className="flex items-center gap-1.5 rounded-xl bg-[#F7BE00] px-4 py-2 text-xs font-bold text-black hover:bg-[#e0ac00] transition active:scale-95 shadow-md"
                  >
                    <Repeat className="h-3.5 w-3.5" />
                    <span>{t.orders.reorderBtn}</span>
                  </button>
                </div>

              </div>

            </div>
          ))
        )}
      </div>

    </div>
  );
};
