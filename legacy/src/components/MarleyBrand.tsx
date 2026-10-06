import React from 'react';
import { Leaf, Award, Heart, ShieldCheck, Sparkles } from 'lucide-react';

interface MarleyLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
  variant?: 'full' | 'icon' | 'badge';
  className?: string;
}

export const MarleyLogo: React.FC<MarleyLogoProps> = ({
  size = 'md',
  showTagline = true,
  variant = 'full',
  className = ''
}) => {
  const iconDimensions = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl',
    xl: 'text-2xl'
  };

  const taglineSizes = {
    sm: 'text-[9px]',
    md: 'text-[10px]',
    lg: 'text-xs',
    xl: 'text-sm'
  };

  // Stylized Marley Lion Emblem SVG
  const LionIcon = (
    <svg 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={`${iconDimensions[size]} shrink-0 transition-transform duration-300 group-hover:scale-105`}
    >
      <circle cx="50" cy="50" r="48" fill="#14110F" stroke="#F5B82E" strokeWidth="2.5" />
      {/* Crown Elements */}
      <path d="M32 30 L40 40 L50 24 L60 40 L68 30 L66 46 L34 46 Z" fill="#F5B82E" />
      <circle cx="32" cy="28" r="2.5" fill="#C0392B" />
      <circle cx="50" cy="22" r="3" fill="#F5B82E" />
      <circle cx="68" cy="28" r="2.5" fill="#2E7D32" />
      
      {/* Lion Face / Mane Shapes */}
      <path 
        d="M24 50 C24 64 36 78 50 78 C64 78 76 64 76 50 C76 42 70 38 66 46 C60 52 56 48 50 48 C44 48 40 52 34 46 C30 38 24 42 24 50 Z" 
        fill="#F5B82E" 
      />
      {/* Lion Eyes & Nose */}
      <circle cx="42" cy="56" r="2.5" fill="#14110F" />
      <circle cx="58" cy="56" r="2.5" fill="#14110F" />
      <path d="M47 62 L53 62 L50 67 Z" fill="#14110F" />
      <path d="M50 67 L50 71 M46 72 C48 74 52 74 54 72" stroke="#14110F" strokeWidth="1.8" strokeLinecap="round" />
      
      {/* Subtle Reggae / Organic Accent Arc */}
      <path d="M22 68 C30 82 48 88 50 88" stroke="#2E7D32" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M50 88 C52 88 70 82 78 68" stroke="#C0392B" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );

  if (variant === 'icon') {
    return (
      <div className={`inline-flex items-center justify-center ${className}`}>
        {LionIcon}
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2.5 group select-none ${className}`}>
      {LionIcon}
      <div>
        <div className="flex items-center gap-1.5 leading-none">
          <span className={`font-black tracking-wider text-white uppercase ${textSizes[size]}`}>
            MARLEY
          </span>
          <span className={`font-black tracking-wider text-[#F5B82E] uppercase ${textSizes[size]}`}>
            COFFEE
          </span>
        </div>
        {showTagline && (
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={`font-extrabold tracking-widest text-[#F5B82E] uppercase ${taglineSizes[size]}`}>
              STIR IT UP
            </span>
            <span className="text-neutral-600 text-[10px]">•</span>
            <span className={`font-medium tracking-wide text-neutral-400 ${taglineSizes[size]}`}>
              B2B PORTAL
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export const MarleyCertificationsBar: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`flex flex-wrap items-center gap-2 text-[11px] ${className}`}>
      <div className="flex items-center gap-1.5 rounded-full border border-[#2E7D32]/40 bg-[#2E7D32]/10 px-3 py-1 text-[#4CAF50] font-semibold">
        <Leaf className="h-3.5 w-3.5" />
        <span>100% Café Orgánico Certificado</span>
      </div>
      <div className="flex items-center gap-1.5 rounded-full border border-[#F5B82E]/40 bg-[#F5B82E]/10 px-3 py-1 text-[#F5B82E] font-semibold">
        <Award className="h-3.5 w-3.5" />
        <span>Fairtrade & Rainforest Alliance</span>
      </div>
      <div className="flex items-center gap-1.5 rounded-full border border-[#C0392B]/40 bg-[#C0392B]/10 px-3 py-1 text-[#EF5350] font-semibold">
        <Heart className="h-3.5 w-3.5" />
        <span>1Love Foundation Giveback</span>
      </div>
    </div>
  );
};

export const MarleyRoastLevelBadge: React.FC<{ roastLevel: string }> = ({ roastLevel }) => {
  const level = roastLevel.toLowerCase();
  
  if (level.includes('claro') || level.includes('light')) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-[#F5B82E]/15 border border-[#F5B82E]/30 px-2 py-0.5 text-[10px] font-bold text-[#F5B82E]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#F5B82E]"></span>
        Tueste Claro (Light Roast)
      </span>
    );
  }
  
  if (level.includes('oscuro') || level.includes('dark') || level.includes('french')) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-[#C0392B]/15 border border-[#C0392B]/30 px-2 py-0.5 text-[10px] font-bold text-[#EF5350]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#C0392B]"></span>
        Tueste Oscuro (Dark Roast)
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-[#D4931D]/15 border border-[#D4931D]/30 px-2 py-0.5 text-[10px] font-bold text-[#F5B82E]">
      <span className="h-1.5 w-1.5 rounded-full bg-[#D4931D]"></span>
      Tueste Medio (Medium Roast)
    </span>
  );
};
