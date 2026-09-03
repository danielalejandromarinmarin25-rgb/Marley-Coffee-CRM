import React from 'react';
import { 
  Award, 
  Sparkles, 
  Gift, 
  Check, 
  Star, 
  Crown, 
  ArrowRight, 
  Percent, 
  Coffee,
  CheckCircle2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { LoyaltyReward, CompanyProfile, Language } from '../types';
import { translations } from '../data/translations';

interface LoyaltyViewProps {
  companyProfile: CompanyProfile;
  rewards: LoyaltyReward[];
  language: Language;
  onRedeemReward: (reward: LoyaltyReward) => void;
}

export const LoyaltyView: React.FC<LoyaltyViewProps> = ({
  companyProfile,
  rewards,
  language,
  onRedeemReward
}) => {
  const t = translations[language];
  const [redeemedCode, setRedeemedCode] = React.useState<string | null>(null);

  const handleRedeem = (reward: LoyaltyReward) => {
    if (companyProfile.loyaltyPoints >= reward.pointsCost) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#F7BE00', '#5E7E29', '#DB0032', '#ffffff']
      });
      onRedeemReward(reward);
      setRedeemedCode(reward.code || "B2B-PRO-PROMO");
      setTimeout(() => setRedeemedCode(null), 6000);
    }
  };

  const pointsPercentToGold = Math.min(100, Math.round((companyProfile.loyaltyPoints / 5000) * 100));

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <Award className="h-6 w-6 text-[#5E7E29]" />
          {t.loyalty.title}
        </h1>
        <p className="text-xs sm:text-sm text-neutral-400 mt-1">
          {t.loyalty.subtitle}
        </p>
      </div>

      {redeemedCode && (
        <div className="rounded-2xl border border-[#5E7E29] bg-[#5E7E29]/20 p-4 text-white flex items-center justify-between animate-fade-in shadow-xl">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-[#5E7E29]" />
            <div>
              <p className="font-extrabold text-sm">{t.loyalty.successRedeem}</p>
              <p className="text-xs text-neutral-200">
                Tu cupón se aplicará automáticamente en tu siguiente facturación o usa el código:{' '}
                <span className="font-mono font-bold text-[#F7BE00] bg-black/60 px-2 py-0.5 rounded">
                  {redeemedCode}
                </span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main VIP Membership Card */}
      <div className="relative overflow-hidden rounded-3xl border border-[#F7BE00]/30 bg-gradient-to-r from-[#141414] via-[#1a1708] to-[#121212] p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 h-48 w-48 rounded-full bg-[#F7BE00]/10 blur-3xl"></div>

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-[#F7BE00]" />
              <span className="rounded-full bg-[#F7BE00] px-3 py-0.5 text-[11px] font-black text-black uppercase tracking-wider">
                Membresía B2B Exclusiva
              </span>
            </div>

            <h2 className="mt-3 text-3xl font-black text-white tracking-tight">
              {companyProfile.loyaltyTier}
            </h2>
            <p className="text-xs text-neutral-300 mt-1">
              Beneficios activos: <strong>5% de descuento adicional</strong> en compras sobre 50kg + Asistencia Técnica Prioritaria.
            </p>

            {/* Progress to next tier */}
            <div className="mt-5 max-w-md">
              <div className="flex items-center justify-between text-xs text-neutral-300 mb-1.5">
                <span>Progreso hacia Nivel Oro Master Roaster</span>
                <span className="font-mono font-bold text-[#F7BE00]">{companyProfile.loyaltyPoints} / 5,000 pts</span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-black border border-neutral-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#5E7E29] to-[#F7BE00] transition-all duration-700"
                  style={{ width: `${pointsPercentToGold}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Points Big Badge */}
          <div className="rounded-2xl border border-[#F7BE00]/40 bg-black/80 p-5 text-center shrink-0 shadow-inner">
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest block">
              {t.loyalty.currentPoints}
            </span>
            <span className="text-4xl font-black text-[#F7BE00] font-mono block mt-1">
              {companyProfile.loyaltyPoints.toLocaleString()}
            </span>
            <span className="text-[11px] text-[#5E7E29] font-semibold mt-1 block">
              Equivalente a ~$190 USD en descuentos
            </span>
          </div>
        </div>
      </div>

      {/* Available Rewards Grid */}
      <div>
        <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <Gift className="h-5 w-5 text-[#F7BE00]" />
          {t.loyalty.availableRewards}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rewards.map((reward) => {
            const canAfford = companyProfile.loyaltyPoints >= reward.pointsCost;
            return (
              <div
                key={reward.id}
                className={`flex flex-col justify-between rounded-3xl border p-5 transition ${
                  reward.isRedeemed
                    ? 'border-[#222222] bg-[#141414] opacity-50'
                    : canAfford
                    ? 'border-[#333333] bg-[#141414] hover:border-[#F7BE00]/60'
                    : 'border-[#222222] bg-[#121212] opacity-75'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="rounded-lg bg-neutral-800 px-2.5 py-1 text-[10px] font-bold text-neutral-300">
                      {reward.category}
                    </span>
                    <span className="font-mono text-sm font-extrabold text-[#F7BE00]">
                      {reward.pointsCost.toLocaleString()} pts
                    </span>
                  </div>

                  <h4 className="mt-3 font-extrabold text-base text-white">
                    {reward.title}
                  </h4>
                  <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                    {reward.description}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-[#222222] flex items-center justify-between">
                  <span className="text-xs font-mono text-neutral-400">
                    Valor: <strong className="text-white">${reward.value} USD</strong>
                  </span>

                  <button
                    onClick={() => handleRedeem(reward)}
                    disabled={!canAfford || reward.isRedeemed}
                    className={`rounded-xl px-4 py-2 text-xs font-extrabold transition active:scale-95 ${
                      reward.isRedeemed
                        ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                        : canAfford
                        ? 'bg-[#F7BE00] text-black hover:bg-[#e0ac00] shadow-md'
                        : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                    }`}
                  >
                    {reward.isRedeemed ? 'Canjeado' : canAfford ? 'Canjear Ahora' : 'Puntos Insuficientes'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
