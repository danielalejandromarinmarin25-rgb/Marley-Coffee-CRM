import React from 'react';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  CalendarClock, 
  Receipt, 
  TrendingUp, 
  ScanBarcode, 
  Award, 
  Headset, 
  Building2,
  Sparkles
} from 'lucide-react';
import { Language } from '../types';
import { translations } from '../data/translations';

export type ActiveTab = 
  | 'dashboard'
  | 'suggestions'
  | 'catalog'
  | 'replenishment'
  | 'orders'
  | 'analytics'
  | 'scanner'
  | 'loyalty'
  | 'support'
  | 'settings';

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  language: Language;
  urgentStockCount: number;
  pendingDispatchCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  language,
  urgentStockCount,
  pendingDispatchCount
}) => {
  const t = translations[language];

  const navItems = [
    {
      id: 'dashboard' as ActiveTab,
      label: t.nav.dashboard,
      icon: LayoutDashboard,
      badge: null
    },
    {
      id: 'suggestions' as ActiveTab,
      label: t.nav.suggestions,
      icon: Sparkles,
      badge: urgentStockCount > 0 ? `${urgentStockCount}` : 'IA',
      badgeColor: urgentStockCount > 0 ? 'bg-[#DB0032] text-white' : 'bg-[#F7BE00] text-black'
    },
    {
      id: 'catalog' as ActiveTab,
      label: t.nav.catalog,
      icon: ShoppingBag,
      badge: null
    },
    {
      id: 'replenishment' as ActiveTab,
      label: t.nav.replenishment,
      icon: CalendarClock,
      badge: pendingDispatchCount > 0 ? pendingDispatchCount : null,
      badgeColor: 'bg-[#F7BE00] text-black'
    },
    {
      id: 'orders' as ActiveTab,
      label: t.nav.orders,
      icon: Receipt,
      badge: null
    },
    {
      id: 'analytics' as ActiveTab,
      label: t.nav.analytics,
      icon: TrendingUp,
      badge: null
    },
    {
      id: 'scanner' as ActiveTab,
      label: t.nav.scanner,
      icon: ScanBarcode,
      badge: null
    },
    {
      id: 'loyalty' as ActiveTab,
      label: t.nav.loyalty,
      icon: Award,
      badge: 'VIP',
      badgeColor: 'bg-[#5E7E29] text-white'
    },
    {
      id: 'support' as ActiveTab,
      label: t.nav.support,
      icon: Headset,
      badge: '24/7',
      badgeColor: 'bg-neutral-800 text-neutral-300'
    },
    {
      id: 'settings' as ActiveTab,
      label: t.nav.settings,
      icon: Building2,
      badge: null
    }
  ];

  return (
    <>
      {/* Desktop Vertical Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-[#222222] bg-[#0d0d0d] p-3 text-neutral-300 min-h-[calc(100vh-4rem)]">
        <div className="mb-3 px-3 py-1">
          <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-500">
            Módulos B2B
          </p>
        </div>

        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-item-${item.id}`}
                onClick={() => onSelectTab(item.id)}
                className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold transition ${
                  isActive
                    ? 'bg-[#1e1e1e] text-white shadow-sm border border-[#F7BE00]/40'
                    : 'text-neutral-400 hover:bg-[#141414] hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`h-4 w-4 transition-colors ${
                      isActive ? 'text-[#F7BE00]' : 'text-neutral-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                      item.badgeColor || 'bg-neutral-800 text-neutral-200'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Marley Roastery & Eco Commitment Card */}
        <div className="mt-auto rounded-2xl border border-[#241E1A] bg-gradient-to-b from-[#161311] to-[#0E0C0B] p-3.5 shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-[#2E7D32] animate-pulse"></span>
              <span className="text-[11px] font-extrabold text-[#F5B82E]">Marley Roastery</span>
            </div>
            <span className="rounded bg-[#2E7D32]/20 px-1.5 py-0.5 text-[9px] font-bold text-[#4CAF50]">
              100% Bio
            </span>
          </div>
          <p className="mt-1.5 text-[10px] text-neutral-400 leading-tight">
            Tueste artesanal en pequeños lotes con origen 100% orgánico certificado.
          </p>
          <div className="mt-2.5 pt-2 border-t border-[#241E1A] flex items-center justify-between text-[9px] text-neutral-500 font-mono">
            <span>Stir It Up • One Love</span>
            <span className="text-[#F5B82E]">Net-30 B2B</span>
          </div>
        </div>
      </aside>

      {/* Mobile Horizontal Bottom / Top Scrollable Nav */}
      <div className="lg:hidden sticky bottom-0 z-30 w-full border-t border-[#222222] bg-[#0c0c0c]/95 backdrop-blur-md px-2 py-1.5">
        <div className="flex items-center justify-between overflow-x-auto no-scrollbar gap-1 py-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`mobile-nav-item-${item.id}`}
                onClick={() => onSelectTab(item.id)}
                className={`relative flex flex-col items-center justify-center min-w-[62px] py-1 px-1 rounded-xl transition ${
                  isActive
                    ? 'text-[#F7BE00] bg-[#1c1c1c] font-bold'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="text-[9px] mt-0.5 truncate max-w-[56px]">
                  {item.label.split(' ')[0]}
                </span>
                {item.badge && typeof item.badge === 'number' && (
                  <span className="absolute top-0 right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#DB0032] text-[8px] font-bold text-white">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};
