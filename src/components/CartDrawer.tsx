import React from 'react';
import { 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingCart, 
  ArrowRight, 
  Sparkles, 
  TrendingDown,
  CreditCard,
  ShieldCheck
} from 'lucide-react';
import { CartItem, Language, CompanyProfile } from '../types';
import { translations } from '../data/translations';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onProceedToCheckout: () => void;
  companyProfile: CompanyProfile;
  language: Language;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onProceedToCheckout,
  companyProfile,
  language
}) => {
  const t = translations[language];

  if (!isOpen) return null;

  const safeItems = Array.isArray(cartItems) ? cartItems : [];
  const subtotal = safeItems.reduce((acc, item) => acc + ((item?.selectedUnitPrice || 0) * (item?.quantity || 0)), 0);
  const tax = subtotal * 0.16; // 16% IVA
  const total = subtotal + tax;
  const totalWeightKg = safeItems.reduce((acc, item) => acc + ((item?.product?.unitWeightKg || 0) * (item?.quantity || 0)), 0);

  // Calculate savings vs base price
  const totalBase = safeItems.reduce((acc, item) => acc + ((item?.product?.basePrice || 0) * (item?.quantity || 0)), 0);
  const totalSavings = Math.max(0, totalBase - subtotal);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
      ></div>

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#121212] border-l border-[#262626] text-white shadow-2xl flex flex-col justify-between">
          
          {/* Header */}
          <div className="p-5 border-b border-[#222222] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F7BE00] text-black">
                <ShoppingCart className="h-4 w-4" />
              </div>
              <div>
                <h2 className="font-extrabold text-base text-white">
                  Orden de Suministro B2B
                </h2>
                <p className="text-[11px] text-neutral-400">
                  {cartItems.length} insumo(s) • Peso: {totalWeightKg.toFixed(1)} kg
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="rounded-xl border border-[#333333] p-1.5 text-neutral-400 hover:text-white hover:border-neutral-500"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-3.5 no-scrollbar">
            {cartItems.length === 0 ? (
              <div className="py-16 text-center text-neutral-500">
                <ShoppingCart className="mx-auto h-12 w-12 text-neutral-700 mb-3" />
                <p className="text-sm font-semibold">Tu carrito de compras está vacío</p>
                <p className="text-xs text-neutral-500 mt-1">
                  Agrega granos de especialidad o insumos desde el catálogo mayorista.
                </p>
              </div>
            ) : (
              <>
                {/* Volume Savings Banner */}
                {totalSavings > 0 && (
                  <div className="flex items-center gap-2 rounded-2xl border border-[#5E7E29]/40 bg-[#5E7E29]/10 p-3 text-xs text-[#5E7E29] font-semibold">
                    <TrendingDown className="h-4 w-4 shrink-0" />
                    <span>
                      ¡Ahorro por volumen aplicado: <strong>${totalSavings.toFixed(2)} USD</strong>!
                    </span>
                  </div>
                )}

                {cartItems.map((item) => {
                  const lineTotal = item.selectedUnitPrice * item.quantity;
                  return (
                    <div
                      key={item.product.id}
                      className="rounded-2xl border border-[#222222] bg-[#161616] p-3.5 flex flex-col justify-between gap-3 shadow-sm"
                    >
                      <div className="flex gap-3">
                        <div className="h-16 w-16 shrink-0 rounded-xl overflow-hidden bg-black">
                          <img
                            src={item.product.imageUrl}
                            alt={item.product.name}
                            referrerPolicy="no-referrer"
                            className="h-full w-full object-cover"
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-1">
                            <h4 className="font-bold text-xs text-white truncate">
                              {item.product.name}
                            </h4>
                            <button
                              onClick={() => onRemoveItem(item.product.id)}
                              className="text-neutral-500 hover:text-[#DB0032] p-0.5"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          <p className="text-[11px] text-neutral-400 mt-0.5">
                            {item.product.unit} • ${item.selectedUnitPrice.toFixed(2)}/u
                          </p>

                          {item.appliedDiscount > 0 && (
                            <span className="text-[10px] text-[#5E7E29] font-bold">
                              {item.appliedDiscount}% descuento por volumen
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Stepper and Line Total */}
                      <div className="flex items-center justify-between pt-2 border-t border-[#222222]">
                        <div className="flex items-center rounded-lg border border-[#333333] bg-[#121212] p-0.5">
                          <button
                            onClick={() => onUpdateQuantity(item.product.id, -1)}
                            className="flex h-6 w-6 items-center justify-center rounded bg-neutral-800 text-xs font-bold hover:bg-neutral-700"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-8 text-center text-xs font-mono font-bold">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => onUpdateQuantity(item.product.id, 1)}
                            className="flex h-6 w-6 items-center justify-center rounded bg-neutral-800 text-xs font-bold hover:bg-neutral-700"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>

                        <span className="font-mono font-extrabold text-sm text-white">
                          ${lineTotal.toFixed(2)} USD
                        </span>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>

          {/* Footer Checkout Summary */}
          {cartItems.length > 0 && (
            <div className="p-5 border-t border-[#222222] bg-[#0f0f0f] space-y-3">
              <div className="space-y-1.5 text-xs font-mono">
                <div className="flex justify-between text-neutral-400">
                  <span>Subtotal Insumos:</span>
                  <span>${subtotal.toFixed(2)} USD</span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span>IVA Trasladado (16%):</span>
                  <span>${tax.toFixed(2)} USD</span>
                </div>
                <div className="flex justify-between text-sm font-extrabold text-white pt-2 border-t border-[#222222]">
                  <span>Total a Facturar:</span>
                  <span className="text-[#F7BE00]">${total.toFixed(2)} USD</span>
                </div>
              </div>

              <button
                onClick={onProceedToCheckout}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#F7BE00] py-3 text-xs font-black text-black hover:bg-[#e0ac00] shadow-xl transition active:scale-95 uppercase tracking-wider"
              >
                <span>Proceder a Facturación y Pago</span>
                <ArrowRight className="h-4 w-4" />
              </button>

              <div className="flex items-center justify-center gap-2 text-[10px] text-neutral-500">
                <ShieldCheck className="h-3.5 w-3.5 text-[#5E7E29]" />
                <span>Factura CFDI 4.0 timbrada automáticamente a {companyProfile.taxId}</span>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
