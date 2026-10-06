import React from 'react';
import { 
  X, 
  CreditCard, 
  Building2, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  FileText, 
  Truck, 
  QrCode,
  Key,
  Lock,
  ArrowRight
} from 'lucide-react';
import { CartItem, CompanyProfile, Order, Language } from '../types';
import { translations } from '../data/translations';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  companyProfile: CompanyProfile;
  language: Language;
  onCompleteOrder: (newOrder: Order) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  cartItems,
  companyProfile,
  language,
  onCompleteOrder
}) => {
  const t = translations[language];

  const [paymentMethod, setPaymentMethod] = React.useState<'linea_credito' | 'tarjeta' | 'spei'>('linea_credito');
  const [selectedBranch, setSelectedBranch] = React.useState(companyProfile.branches[0]?.name || 'Sucursal Roma Norte');
  const [deliveryDate, setDeliveryDate] = React.useState('2026-09-02');
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [otpCode, setOtpCode] = React.useState('');
  const [isOtpRequired, setIsOtpRequired] = React.useState(false);
  const [orderSuccess, setOrderSuccess] = React.useState<Order | null>(null);

  if (!isOpen) return null;

  const safeItems = Array.isArray(cartItems) ? cartItems : [];
  const subtotal = safeItems.reduce((acc, item) => acc + ((item?.selectedUnitPrice || 0) * (item?.quantity || 0)), 0);
  const tax = subtotal * 0.16;
  const total = subtotal + tax;

  const availableCredit = companyProfile.approvedCreditLimit - companyProfile.usedCredit;

  const handleProcessPayment = (e: React.FormEvent) => {
    e.preventDefault();

    // If 2FA is enabled and order > $200 and otp not yet entered, prompt OTP
    if (companyProfile.twoFactorEnabled && total > 200 && !isOtpRequired) {
      setIsOtpRequired(true);
      return;
    }

    setIsProcessing(true);

    setTimeout(() => {
      const generatedOrder: Order = {
        id: `ord-${Date.now()}`,
        orderNumber: `PED-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        invoiceNumber: `CFDI-40-A${Math.floor(10000 + Math.random() * 90000)}`,
        date: new Date().toISOString().split('T')[0],
        status: 'tostando',
        items: cartItems.map((c) => ({
          productId: c.product.id,
          productName: c.product.name,
          quantity: c.quantity,
          unitPrice: c.selectedUnitPrice,
          total: c.selectedUnitPrice * c.quantity
        })),
        subtotal,
        tax,
        discount: 0,
        total,
        paymentMethod: paymentMethod === 'linea_credito' ? 'Línea de Crédito Net-30' : paymentMethod === 'tarjeta' ? 'Tarjeta Corporativa B2B' : 'Transferencia Bancaria SPEI',
        paymentStatus: paymentMethod === 'linea_credito' ? 'financiamiento_aprobado' : 'pagado',
        deliveryDate: deliveryDate,
        branch: selectedBranch,
        pointsEarned: Math.floor(total * 2),
        isAutoReplenish: false
      };

      setIsProcessing(false);
      setOrderSuccess(generatedOrder);
      onCompleteOrder(generatedOrder);
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-3xl border border-[#2a2a2a] bg-[#121212] p-6 sm:p-8 shadow-2xl text-white my-8">
        
        {/* If Order Succeeded */}
        {orderSuccess ? (
          <div className="text-center py-6 space-y-4 animate-fade-in">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#5E7E29]/20 text-[#5E7E29] border border-[#5E7E29]/40">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <h2 className="text-2xl font-extrabold text-white">
              ¡Orden B2B & Factura Generadas con Éxito!
            </h2>
            <p className="text-xs text-neutral-300 max-w-md mx-auto">
              Se ha emitido la orden <strong>{orderSuccess.orderNumber}</strong> y enviado el CFDI 4.0 XML/PDF a <strong>{companyProfile.electronicInvoiceEmail}</strong>.
            </p>

            {/* Receipt Summary Card */}
            <div className="rounded-2xl border border-[#262626] bg-[#161616] p-5 text-left text-xs font-mono space-y-2 max-w-md mx-auto">
              <div className="flex justify-between">
                <span className="text-neutral-400">Folio Fiscal:</span>
                <span className="text-[#F7BE00] font-bold">{orderSuccess.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Total Facturado:</span>
                <span className="text-white font-extrabold">${orderSuccess.total.toFixed(2)} USD</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Destino:</span>
                <span className="text-neutral-200">{orderSuccess.branch}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Puntos Fidelidad:</span>
                <span className="text-[#5E7E29] font-bold">+{orderSuccess.pointsEarned} pts acreditados</span>
              </div>
            </div>

            <div className="pt-4 flex justify-center gap-3">
              <button
                onClick={onClose}
                className="rounded-xl bg-[#F7BE00] px-6 py-2.5 text-xs font-extrabold text-black hover:bg-[#e0ac00]"
              >
                Volver al Panel Principal
              </button>
            </div>
          </div>
        ) : (
          <div>
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#222222]">
              <div>
                <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-[#F7BE00]" />
                  Pasarela B2B & Facturación Personalizada
                </h2>
                <p className="text-xs text-neutral-400">
                  Razón Social: <strong className="text-white">{companyProfile.companyName}</strong> ({companyProfile.taxId})
                </p>
              </div>

              <button
                onClick={onClose}
                className="rounded-xl border border-[#333333] p-1.5 text-neutral-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleProcessPayment} className="mt-5 space-y-5">
              
              {/* Delivery Destination Branch */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-bold text-neutral-300 block mb-1">
                    Sucursal de Entrega:
                  </label>
                  <select
                    value={selectedBranch}
                    onChange={(e) => setSelectedBranch(e.target.value)}
                    className="w-full rounded-xl border border-[#333333] bg-[#181818] p-2.5 text-white focus:border-[#F7BE00] focus:outline-none"
                  >
                    {companyProfile.branches.map((b) => (
                      <option key={b.id} value={b.name}>
                        {b.name} - {b.address}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-neutral-300 block mb-1">
                    Fecha Deseada de Despacho en Tostaduría:
                  </label>
                  <input
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    className="w-full rounded-xl border border-[#333333] bg-[#181818] p-2.5 text-white focus:border-[#F7BE00] focus:outline-none font-mono"
                    required
                  />
                </div>
              </div>

              {/* Payment Methods */}
              <div>
                <label className="font-bold text-neutral-300 block text-xs mb-2">
                  Método de Liquidación B2B:
                </label>

                <div className="space-y-2.5">
                  
                  {/* Option 1: Línea de Crédito Net-30 */}
                  <label
                    onClick={() => setPaymentMethod('linea_credito')}
                    className={`flex items-start justify-between rounded-2xl border p-4 cursor-pointer transition ${
                      paymentMethod === 'linea_credito'
                        ? 'border-[#F7BE00] bg-[#1a1708]'
                        : 'border-[#222222] bg-[#161616]'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="payMethod"
                        checked={paymentMethod === 'linea_credito'}
                        onChange={() => setPaymentMethod('linea_credito')}
                        className="mt-1 accent-[#F7BE00]"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-xs text-white">
                            Línea de Crédito Comercial Net-30 Días
                          </span>
                          <span className="rounded bg-[#5E7E29]/20 text-[#5E7E29] text-[9px] px-2 py-0.5 font-bold uppercase">
                            Recomendado B2B
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-400 mt-0.5">
                          Sin cobro inmediato. Se consolida en tu estado de cuenta mensual con plazo de pago a 30 días.
                        </p>
                        <span className="text-[11px] font-mono text-[#5E7E29] font-semibold mt-1 block">
                          Crédito Disponible: ${availableCredit.toLocaleString()} USD
                        </span>
                      </div>
                    </div>
                  </label>

                  {/* Option 2: Tarjeta Corporativa */}
                  <label
                    onClick={() => setPaymentMethod('tarjeta')}
                    className={`flex items-start justify-between rounded-2xl border p-4 cursor-pointer transition ${
                      paymentMethod === 'tarjeta'
                        ? 'border-[#F7BE00] bg-[#1a1708]'
                        : 'border-[#222222] bg-[#161616]'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="payMethod"
                        checked={paymentMethod === 'tarjeta'}
                        onChange={() => setPaymentMethod('tarjeta')}
                        className="mt-1 accent-[#F7BE00]"
                      />
                      <div>
                        <span className="font-extrabold text-xs text-white">
                          Tarjeta Corporativa / Débito (Pasarela Stripe B2B)
                        </span>
                        <p className="text-[11px] text-neutral-400 mt-0.5">
                          Visa / Mastercard corporativa con tokenización PCI-DSS y cargo instantáneo.
                        </p>
                      </div>
                    </div>
                  </label>

                  {/* Option 3: SPEI */}
                  <label
                    onClick={() => setPaymentMethod('spei')}
                    className={`flex items-start justify-between rounded-2xl border p-4 cursor-pointer transition ${
                      paymentMethod === 'spei'
                        ? 'border-[#F7BE00] bg-[#1a1708]'
                        : 'border-[#222222] bg-[#161616]'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="payMethod"
                        checked={paymentMethod === 'spei'}
                        onChange={() => setPaymentMethod('spei')}
                        className="mt-1 accent-[#F7BE00]"
                      />
                      <div>
                        <span className="font-extrabold text-xs text-white">
                          Transferencia Interbancaria SPEI / CLABE Fiscal
                        </span>
                        <p className="text-[11px] text-neutral-400 mt-0.5">
                          Se genera referencia única CLABE con conciliación automática en menos de 5 minutos.
                        </p>
                      </div>
                    </div>
                  </label>

                </div>
              </div>

              {/* 2FA OTP Step if triggered */}
              {isOtpRequired && (
                <div className="rounded-2xl border border-[#F7BE00] bg-[#1c1809] p-4 animate-fade-in space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#F7BE00]">
                    <Lock className="h-4 w-4" />
                    <span>Verificación de Seguridad 2FA Requerida</span>
                  </div>
                  <p className="text-[11px] text-neutral-300">
                    Ingresa el código OTP de 6 dígitos generado en tu aplicación autenticadora para autorizar compras B2B:
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="000000"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      className="w-36 rounded-xl border border-neutral-700 bg-black p-2.5 text-center font-mono text-lg font-black tracking-widest text-[#F7BE00] focus:border-[#F7BE00] focus:outline-none"
                      required
                    />
                    <span className="text-[11px] text-neutral-400">
                      (Para probar, ingresa cualquier número de 6 dígitos)
                    </span>
                  </div>
                </div>
              )}

              {/* Order Calculation Overview */}
              <div className="rounded-2xl border border-[#222222] bg-[#161616] p-4 text-xs font-mono space-y-1.5">
                <div className="flex justify-between text-neutral-400">
                  <span>Subtotal Insumos ({cartItems.length} líneas):</span>
                  <span>${subtotal.toFixed(2)} USD</span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span>IVA Trasladado (16%):</span>
                  <span>${tax.toFixed(2)} USD</span>
                </div>
                <div className="flex justify-between text-sm font-extrabold text-white pt-2 border-t border-[#2a2a2a]">
                  <span>Total Final a Facturar:</span>
                  <span className="text-[#F7BE00]">${total.toFixed(2)} USD</span>
                </div>
              </div>

              {/* Submit & Cancel */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-[#333333] px-4 py-2.5 text-xs font-bold text-neutral-300 hover:text-white"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="flex items-center gap-2 rounded-xl bg-[#F7BE00] px-6 py-2.5 text-xs font-black text-black hover:bg-[#e0ac00] shadow-xl transition active:scale-95 disabled:opacity-50 uppercase tracking-wider"
                >
                  {isProcessing ? (
                    <span>Timbrando Factura SAT...</span>
                  ) : isOtpRequired ? (
                    <span>Validar OTP y Confirmar</span>
                  ) : (
                    <span>Confirmar y Emitir Factura</span>
                  )}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>

            </form>
          </div>
        )}

      </div>
    </div>
  );
};
