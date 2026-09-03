import React from 'react';
import { 
  X, 
  Repeat, 
  CheckCircle2, 
  Truck, 
  Calendar, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { Order, Language } from '../types';
import { translations } from '../data/translations';

interface QuickReorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  onConfirmReorder: (order: Order) => void;
  language: Language;
}

export const QuickReorderModal: React.FC<QuickReorderModalProps> = ({
  isOpen,
  onClose,
  order,
  onConfirmReorder,
  language
}) => {
  const t = translations[language];
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [success, setSuccess] = React.useState(false);

  if (!isOpen || !order) return null;

  const handleConfirm = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setSuccess(true);
      onConfirmReorder(order);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1800);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <div className="w-full max-w-lg rounded-3xl border border-[#2a2a2a] bg-[#141414] p-6 sm:p-8 shadow-2xl text-white">
        
        {success ? (
          <div className="py-6 text-center space-y-3 animate-fade-in">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#5E7E29]/20 text-[#5E7E29] border border-[#5E7E29]/40">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h3 className="text-xl font-extrabold text-white">
              ¡Recompra Rápida Programada!
            </h3>
            <p className="text-xs text-neutral-300">
              Tostaduría ha puesto tu lote en cola de tueste para entrega prioritaria.
            </p>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-[#222222]">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F7BE00] text-black">
                  <Repeat className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white">
                    Confirmar Recompra Rápida
                  </h3>
                  <p className="text-[11px] text-neutral-400">
                    Basado en el pedido previo {order.orderNumber}
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="rounded-xl border border-[#333333] p-1.5 text-neutral-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Items Summary */}
            <div className="mt-4 space-y-2 text-xs">
              <p className="font-bold text-neutral-300">Insumos a Re-ordenar:</p>
              <div className="rounded-2xl border border-[#262626] bg-[#181818] p-3 divide-y divide-[#222222]">
                {order.items.map((it, idx) => (
                  <div key={idx} className="py-1.5 flex justify-between">
                    <span className="text-neutral-200">
                      <strong>{it.quantity}x</strong> {it.productName}
                    </span>
                    <span className="font-mono font-bold text-white">
                      ${it.total.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Delivery and billing info */}
              <div className="rounded-2xl bg-[#0e0e0e] border border-[#222222] p-3 text-[11px] text-neutral-400 space-y-1">
                <p>• Sucursal: <strong className="text-neutral-200">{order.branch}</strong></p>
                <p>• Método: <strong className="text-neutral-200">{order.paymentMethod}</strong></p>
                <p>• Total a Facturar: <strong className="text-[#F7BE00] font-mono text-xs">${order.total.toFixed(2)} USD</strong></p>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex justify-end gap-2 pt-3 border-t border-[#222222]">
              <button
                onClick={onClose}
                className="rounded-xl border border-[#333333] px-4 py-2 text-xs font-bold text-neutral-300 hover:text-white"
              >
                Cancelar
              </button>

              <button
                onClick={handleConfirm}
                disabled={isProcessing}
                className="flex items-center gap-2 rounded-xl bg-[#F7BE00] px-5 py-2 text-xs font-extrabold text-black hover:bg-[#e0ac00] shadow-md transition active:scale-95 disabled:opacity-50"
              >
                <span>{isProcessing ? 'Procesando Recompra...' : 'Confirmar Recompra en 1 Clic'}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
