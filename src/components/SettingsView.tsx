import React from 'react';
import { 
  Building2, 
  ShieldCheck, 
  CreditCard, 
  Fingerprint, 
  FileCheck, 
  Save, 
  CheckCircle2, 
  QrCode, 
  Key, 
  Lock,
  Smartphone
} from 'lucide-react';
import { CompanyProfile, Language } from '../types';
import { translations } from '../data/translations';

interface SettingsViewProps {
  companyProfile: CompanyProfile;
  language: Language;
  onUpdateProfile: (updated: Partial<CompanyProfile>) => void;
  onOpen2FAModal: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  companyProfile,
  language,
  onUpdateProfile,
  onOpen2FAModal
}) => {
  const t = translations[language];
  const [formData, setFormData] = React.useState<CompanyProfile>(companyProfile);
  const [saveSuccess, setSaveSuccess] = React.useState(false);

  React.useEffect(() => {
    setFormData(companyProfile);
  }, [companyProfile]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <Building2 className="h-6 w-6 text-[#F7BE00]" />
          {t.settings.title}
        </h1>
        <p className="text-xs sm:text-sm text-neutral-400 mt-1">
          {t.settings.subtitle}
        </p>
      </div>

      {saveSuccess && (
        <div className="rounded-2xl border border-[#5E7E29] bg-[#5E7E29]/20 p-4 text-white flex items-center gap-3 animate-fade-in">
          <CheckCircle2 className="h-5 w-5 text-[#5E7E29]" />
          <span className="text-xs font-bold">Datos de Razón Social y Facturación Actualizados Correctamente.</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Section 1: Razón Social & Fiscal Data */}
        <div className="rounded-3xl border border-[#222222] bg-[#121212] p-5 sm:p-7 shadow-xl">
          <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2 pb-3 border-b border-[#222222]">
            <FileCheck className="h-4 w-4 text-[#5E7E29]" />
            Datos Fiscales de Facturación Electrónica (B2B)
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            
            <div>
              <label className="font-bold text-neutral-300 block mb-1.5">
                {t.settings.companyName}:
              </label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                className="w-full rounded-xl border border-[#333333] bg-[#181818] p-3 text-white focus:border-[#F7BE00] focus:outline-none font-medium"
                required
              />
            </div>

            <div>
              <label className="font-bold text-neutral-300 block mb-1.5">
                {t.settings.taxId}:
              </label>
              <input
                type="text"
                value={formData.taxId}
                onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                className="w-full rounded-xl border border-[#333333] bg-[#181818] p-3 text-white focus:border-[#F7BE00] focus:outline-none font-mono uppercase"
                required
              />
            </div>

            <div>
              <label className="font-bold text-neutral-300 block mb-1.5">
                Representante Legal / Contacto de Compras:
              </label>
              <input
                type="text"
                value={formData.legalRepresentative}
                onChange={(e) => setFormData({ ...formData, legalRepresentative: e.target.value })}
                className="w-full rounded-xl border border-[#333333] bg-[#181818] p-3 text-white focus:border-[#F7BE00] focus:outline-none font-medium"
              />
            </div>

            <div>
              <label className="font-bold text-neutral-300 block mb-1.5">
                {t.settings.invoiceEmail}:
              </label>
              <input
                type="email"
                value={formData.electronicInvoiceEmail}
                onChange={(e) => setFormData({ ...formData, electronicInvoiceEmail: e.target.value })}
                className="w-full rounded-xl border border-[#333333] bg-[#181818] p-3 text-white focus:border-[#F7BE00] focus:outline-none font-mono"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="font-bold text-neutral-300 block mb-1.5">
                {t.settings.fiscalAddress}:
              </label>
              <input
                type="text"
                value={formData.fiscalAddress}
                onChange={(e) => setFormData({ ...formData, fiscalAddress: e.target.value })}
                className="w-full rounded-xl border border-[#333333] bg-[#181818] p-3 text-white focus:border-[#F7BE00] focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="font-bold text-neutral-300 block mb-1.5">
                {t.settings.taxRegime}:
              </label>
              <select
                value={formData.taxRegime}
                onChange={(e) => setFormData({ ...formData, taxRegime: e.target.value })}
                className="w-full rounded-xl border border-[#333333] bg-[#181818] p-3 text-white focus:border-[#F7BE00] focus:outline-none"
              >
                <option value="601 - General de Ley Personas Morales">601 - General de Ley Personas Morales</option>
                <option value="612 - Personas Físicas con Actividades Empresariales">612 - Personas Físicas con Actividades Empresariales</option>
                <option value="626 - Régimen Simplificado de Confianza (RESICO)">626 - Régimen Simplificado de Confianza (RESICO)</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-neutral-300 block mb-1.5">
                {t.settings.cfdiUsage}:
              </label>
              <select
                value={formData.cfdiUsage}
                onChange={(e) => setFormData({ ...formData, cfdiUsage: e.target.value })}
                className="w-full rounded-xl border border-[#333333] bg-[#181818] p-3 text-white focus:border-[#F7BE00] focus:outline-none"
              >
                <option value="G01 - Adquisición de mercancías">G01 - Adquisición de mercancías</option>
                <option value="G03 - Gastos en general">G03 - Gastos en general</option>
                <option value="P01 - Por definir">P01 - Por definir</option>
              </select>
            </div>

          </div>
        </div>

        {/* Section 2: Credit Terms & Financing */}
        <div className="rounded-3xl border border-[#222222] bg-[#121212] p-5 sm:p-7 shadow-xl">
          <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2 pb-3 border-b border-[#222222]">
            <CreditCard className="h-4 w-4 text-[#F7BE00]" />
            {t.settings.creditSection}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="rounded-2xl border border-[#262626] bg-[#161616] p-4">
              <span className="text-[10px] text-neutral-400 uppercase font-bold block">Línea Autorizada</span>
              <span className="text-2xl font-black text-[#5E7E29] font-mono mt-1 block">
                ${formData.approvedCreditLimit.toLocaleString()} USD
              </span>
              <span className="text-[10px] text-neutral-500 mt-1 block">Tasa de interés: 0.0% fija</span>
            </div>

            <div className="rounded-2xl border border-[#262626] bg-[#161616] p-4">
              <span className="text-[10px] text-neutral-400 uppercase font-bold block">Saldo Dispuesto</span>
              <span className="text-2xl font-black text-white font-mono mt-1 block">
                ${formData.usedCredit.toLocaleString()} USD
              </span>
              <span className="text-[10px] text-neutral-500 mt-1 block">
                Disponible: ${(formData.approvedCreditLimit - formData.usedCredit).toLocaleString()} USD
              </span>
            </div>

            <div className="rounded-2xl border border-[#262626] bg-[#161616] p-4">
              <span className="text-[10px] text-neutral-400 uppercase font-bold block">Plazo de Facturación</span>
              <span className="text-2xl font-black text-[#F7BE00] font-mono mt-1 block">
                Net-{formData.paymentTermDays} Días
              </span>
              <span className="text-[10px] text-neutral-500 mt-1 block">Ciclo de cobro automático</span>
            </div>
          </div>
        </div>

        {/* Section 3: Two-Factor Authentication & Biometrics */}
        <div className="rounded-3xl border border-[#222222] bg-[#121212] p-5 sm:p-7 shadow-xl">
          <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2 pb-3 border-b border-[#222222]">
            <ShieldCheck className="h-4 w-4 text-[#5E7E29]" />
            {t.settings.securitySection}
          </h2>

          <div className="space-y-4">
            
            {/* 2FA Toggle & Config */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between rounded-2xl border border-[#2a2a2a] bg-[#161616] p-4 gap-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black border border-neutral-700 text-[#F7BE00]">
                  <Key className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>Autenticación de Dos Factores (2FA / OTP)</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      formData.twoFactorEnabled ? 'bg-[#5E7E29]/20 text-[#5E7E29]' : 'bg-neutral-800 text-neutral-400'
                    }`}>
                      {formData.twoFactorEnabled ? 'Activo' : 'Desactivado'}
                    </span>
                  </h3>
                  <p className="text-xs text-neutral-400 mt-0.5 max-w-lg">
                    {t.settings.twoFactorDesc}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onOpen2FAModal}
                className="shrink-0 rounded-xl bg-[#F7BE00] px-4 py-2 text-xs font-bold text-black hover:bg-[#e0ac00] transition active:scale-95"
              >
                {formData.twoFactorEnabled ? 'Probar / Reconfigurar 2FA' : 'Configurar 2FA'}
              </button>
            </div>

            {/* Biometric Auth Toggle */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between rounded-2xl border border-[#2a2a2a] bg-[#161616] p-4 gap-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black border border-neutral-700 text-[#5E7E29]">
                  <Fingerprint className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>Autenticación Biométrica (Face ID / Touch ID)</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      formData.biometricEnabled ? 'bg-[#5E7E29]/20 text-[#5E7E29]' : 'bg-neutral-800 text-neutral-400'
                    }`}>
                      {formData.biometricEnabled ? 'Habilitado' : 'Deshabilitado'}
                    </span>
                  </h3>
                  <p className="text-xs text-neutral-400 mt-0.5 max-w-lg">
                    {t.settings.biometricDesc}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  const updated = !formData.biometricEnabled;
                  setFormData({ ...formData, biometricEnabled: updated });
                  onUpdateProfile({ biometricEnabled: updated });
                }}
                className={`shrink-0 rounded-xl px-4 py-2 text-xs font-bold transition ${
                  formData.biometricEnabled
                    ? 'bg-[#5E7E29] text-white hover:bg-[#4d6921]'
                    : 'border border-neutral-700 bg-neutral-800 text-neutral-300 hover:text-white'
                }`}
              >
                {formData.biometricEnabled ? 'Biometría Activa' : 'Habilitar Biometría'}
              </button>
            </div>

          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 rounded-2xl bg-[#F7BE00] px-6 py-3 text-xs font-extrabold text-black hover:bg-[#e0ac00] shadow-xl transition active:scale-95"
          >
            <Save className="h-4 w-4" />
            <span>Guardar Configuración Fiscal & Perfil</span>
          </button>
        </div>

      </form>
    </div>
  );
};
