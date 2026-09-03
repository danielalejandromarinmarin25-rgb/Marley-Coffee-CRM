import React from 'react';
import { 
  X, 
  ShieldCheck, 
  QrCode, 
  Key, 
  Fingerprint, 
  CheckCircle2, 
  Smartphone, 
  Copy,
  Lock
} from 'lucide-react';
import { Language } from '../types';

interface TwoFactorModalProps {
  isOpen: boolean;
  onClose: () => void;
  isEnabled: boolean;
  onToggle2FA: (enable: boolean) => void;
  language: Language;
}

export const TwoFactorModal: React.FC<TwoFactorModalProps> = ({
  isOpen,
  onClose,
  isEnabled,
  onToggle2FA
}) => {
  const [testCode, setTestCode] = React.useState('');
  const [isCopied, setIsCopied] = React.useState(false);
  const [successStatus, setSuccessStatus] = React.useState<string | null>(null);

  if (!isOpen) return null;

  const secretKey = 'KAFE 7B2B 99RO ASTR 4490 2026';

  const handleCopySecret = () => {
    navigator.clipboard.writeText(secretKey.replace(/\s+/g, ''));
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (testCode.length >= 4) {
      onToggle2FA(true);
      setSuccessStatus("¡Autenticación de Dos Factores (2FA) configurada con éxito!");
      setTimeout(() => {
        setSuccessStatus(null);
        onClose();
      }, 1800);
    }
  };

  const handleDisable = () => {
    onToggle2FA(false);
    setSuccessStatus("2FA desactivado para tu cuenta.");
    setTimeout(() => {
      setSuccessStatus(null);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-3xl border border-[#2a2a2a] bg-[#121212] p-6 sm:p-8 shadow-2xl text-white my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#222222]">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#5E7E29]/20 text-[#5E7E29] border border-[#5E7E29]/40">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-base text-white">
                Seguridad B2B: Autenticación 2FA
              </h2>
              <p className="text-[11px] text-neutral-400">
                Protección de compras mayoristas y facturación
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

        {successStatus ? (
          <div className="py-8 text-center space-y-3 animate-fade-in">
            <CheckCircle2 className="h-12 w-12 text-[#5E7E29] mx-auto" />
            <p className="font-extrabold text-sm text-white">{successStatus}</p>
          </div>
        ) : (
          <div className="mt-5 space-y-5 text-xs text-neutral-300">
            
            {/* Step 1: Scan QR Code */}
            <div className="flex flex-col sm:flex-row items-center gap-4 rounded-2xl border border-[#262626] bg-[#161616] p-4">
              <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-xl bg-white p-2">
                <QrCode className="h-full w-full text-black" />
              </div>

              <div className="space-y-1 text-center sm:text-left">
                <span className="font-bold text-white block">
                  1. Escanea el código en Google Authenticator o Authy
                </span>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  O introduce manualmente la llave secreta si estás desde el móvil:
                </p>
                <div className="flex items-center gap-1.5 pt-1">
                  <span className="font-mono text-[10px] text-[#F7BE00] bg-black px-2 py-1 rounded border border-neutral-800">
                    {secretKey}
                  </span>
                  <button
                    onClick={handleCopySecret}
                    className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
                    title="Copiar llave"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
                {isCopied && <span className="text-[10px] text-[#5E7E29] font-bold block">¡Copiado!</span>}
              </div>
            </div>

            {/* Step 2: Enter 6 digit code */}
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="font-bold text-white block mb-1.5">
                  2. Ingresa el código de 6 dígitos que muestra tu app:
                </label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="Ej: 482910"
                  value={testCode}
                  onChange={(e) => setTestCode(e.target.value)}
                  className="w-full rounded-xl border border-neutral-700 bg-black p-3 text-center font-mono text-xl font-black tracking-widest text-[#F7BE00] focus:border-[#F7BE00] focus:outline-none"
                  required
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                {isEnabled ? (
                  <button
                    type="button"
                    onClick={handleDisable}
                    className="text-xs text-[#DB0032] hover:underline font-semibold"
                  >
                    Desactivar 2FA en esta cuenta
                  </button>
                ) : (
                  <div></div>
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-xl border border-[#333333] px-4 py-2 text-xs font-bold text-neutral-400 hover:text-white"
                  >
                    Cerrar
                  </button>

                  <button
                    type="submit"
                    className="rounded-xl bg-[#F7BE00] px-5 py-2 text-xs font-extrabold text-black hover:bg-[#e0ac00] shadow-md transition active:scale-95"
                  >
                    Verificar y Activar
                  </button>
                </div>
              </div>

            </form>

          </div>
        )}

      </div>
    </div>
  );
};
