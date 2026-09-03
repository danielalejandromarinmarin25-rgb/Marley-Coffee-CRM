import React from 'react';
import { 
  MapPin, 
  Wifi, 
  WifiOff, 
  Globe, 
  Sun, 
  Moon, 
  Bell, 
  ShoppingCart, 
  ShieldCheck, 
  Fingerprint,
  RefreshCw,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { Language, Theme, CompanyProfile, NotificationItem, CartItem } from '../types';
import { translations } from '../data/translations';
import { MarleyLogo } from './MarleyBrand';

interface NavbarProps {
  companyProfile: CompanyProfile;
  onUpdateProfile?: (updated: Partial<CompanyProfile>) => void;
  language: Language;
  onLanguageChange?: (lang: Language) => void;
  onChangeLanguage?: (lang: Language) => void;
  theme?: Theme;
  onToggleTheme?: () => void;
  isOffline?: boolean;
  isOnline?: boolean;
  onToggleOffline?: () => void;
  onToggleOnline?: () => void;
  syncPendingCount?: number;
  onForceSync?: () => void;
  notifications?: NotificationItem[];
  onMarkNotificationRead?: (id: string) => void;
  onClearAllNotifications?: () => void;
  cartItems?: CartItem[];
  cartCount?: number;
  onOpenCart?: () => void;
  onOpen2FAModal?: () => void;
  onSelectNotificationAction?: (action: string, orderId?: string) => void;
  branches?: any[];
  activeBranch?: string;
  onSelectBranch?: (branch: string) => void;
  onNavigate?: (tab: any) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  companyProfile,
  onUpdateProfile = (_updated: Partial<CompanyProfile>) => {},
  language,
  onLanguageChange = (_lang: Language) => {},
  onChangeLanguage = (_lang: Language) => {},
  theme = 'dark',
  onToggleTheme = () => {},
  isOffline,
  isOnline = true,
  onToggleOffline,
  onToggleOnline,
  syncPendingCount = 0,
  onForceSync = () => {},
  notifications = [],
  onMarkNotificationRead = (_id: string) => {},
  onClearAllNotifications = () => {},
  cartItems = [],
  cartCount,
  onOpenCart = () => {},
  onOpen2FAModal = () => {},
  onSelectNotificationAction = (_action: string, _orderId?: string) => {},
  activeBranch,
  onSelectBranch = (_branch: string) => {},
  onNavigate = (_tab: any) => {}
}) => {
  const t = translations[language];
  const [showBranchDropdown, setShowBranchDropdown] = React.useState(false);
  const [showNotifications, setShowNotifications] = React.useState(false);
  const [isSyncing, setIsSyncing] = React.useState(false);

  const safeNotifications = Array.isArray(notifications) ? notifications : [];
  const safeCartItems = Array.isArray(cartItems) ? cartItems : [];

  const unreadCount = safeNotifications.filter(n => n && !n.isRead).length;
  const calculatedCartCount = safeCartItems.reduce((acc, item) => acc + (item ? item.quantity : 0), 0);
  const cartTotalCount = cartCount !== undefined ? cartCount : calculatedCartCount;
  const cartSubtotal = safeCartItems.reduce((acc, item) => acc + (item ? item.selectedUnitPrice * item.quantity : 0), 0);

  const handleLangChange = onLanguageChange || onChangeLanguage || (() => {});
  const handleToggleOffline = onToggleOffline || onToggleOnline || (() => {});
  const effectiveIsOffline = isOffline !== undefined ? isOffline : !isOnline;
  const currentBranchName = activeBranch || companyProfile?.currentBranch || companyProfile?.branches?.[0]?.name || 'Sucursal Principal';

  const handleSyncClick = () => {
    setIsSyncing(true);
    setTimeout(() => {
      onForceSync();
      setIsSyncing(false);
    }, 800);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#222222] bg-[#0a0a0a] text-white shadow-lg transition-colors">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        
        {/* Brand & Logo */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate('dashboard')}>
          <MarleyLogo size="md" showTagline={true} />
        </div>

        {/* Branch Selector */}
        <div className="relative hidden md:block">
          <button
            id="branch-selector-btn"
            onClick={() => setShowBranchDropdown(!showBranchDropdown)}
            className="flex items-center gap-2 rounded-lg border border-[#222222] bg-[#141414] px-3 py-1.5 text-xs font-medium text-neutral-200 hover:border-neutral-700 hover:text-white transition"
          >
            <MapPin className="h-3.5 w-3.5 text-[#F7BE00]" />
            <span className="max-w-[180px] truncate">{currentBranchName}</span>
            <span className="text-[10px] text-neutral-500">▾</span>
          </button>

          {showBranchDropdown && (
            <div className="absolute left-0 mt-2 w-64 rounded-xl border border-[#262626] bg-[#121212] p-1.5 shadow-2xl z-50">
              <p className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
                {t.common.branch}
              </p>
              {(companyProfile?.branches || []).map((branch: any) => {
                const branchName = typeof branch === 'string' ? branch : branch?.name || '';
                return (
                  <button
                    key={branchName}
                    onClick={() => {
                      if (onSelectBranch) onSelectBranch(branchName);
                      onUpdateProfile({ currentBranch: branchName });
                      setShowBranchDropdown(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs transition ${
                      currentBranchName === branchName
                        ? 'bg-[#F7BE00]/10 font-semibold text-[#F7BE00]'
                        : 'text-neutral-300 hover:bg-[#1f1f1f]'
                    }`}
                  >
                    <span className="truncate">{branchName}</span>
                    {currentBranchName === branchName && (
                      <CheckCircle2 className="h-3.5 w-3.5 text-[#F7BE00]" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Actions: Sync, 2FA, Lang, Notifications, Cart */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Offline / Online Mode Toggle & Cloud Sync */}
          <div className="flex items-center">
            <button
              id="offline-sync-toggle-btn"
              onClick={handleToggleOffline}
              title={effectiveIsOffline ? t.status.offline : t.status.online}
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition border ${
                effectiveIsOffline
                  ? 'border-[#DB0032]/40 bg-[#DB0032]/10 text-[#DB0032]'
                  : 'border-[#5E7E29]/40 bg-[#5E7E29]/10 text-[#5E7E29]'
              }`}
            >
              {effectiveIsOffline ? (
                <>
                  <WifiOff className="h-3.5 w-3.5 animate-pulse" />
                  <span className="hidden sm:inline text-[11px] font-semibold">Offline</span>
                </>
              ) : (
                <>
                  <Wifi className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline text-[11px] font-semibold">Cloud Sync</span>
                </>
              )}
            </button>

            {syncPendingCount > 0 && !effectiveIsOffline && (
              <button
                onClick={handleSyncClick}
                title="Sincronizar cambios locales"
                className="ml-1 flex items-center gap-1 rounded-full bg-[#F7BE00]/20 px-2 py-0.5 text-[10px] font-bold text-[#F7BE00] border border-[#F7BE00]/40 hover:bg-[#F7BE00]/30"
              >
                <RefreshCw className={`h-3 w-3 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{syncPendingCount}</span>
              </button>
            )}
          </div>

          {/* 2FA / Biometric Indicator */}
          <button
            id="auth-security-badge-btn"
            onClick={onOpen2FAModal}
            title={companyProfile?.twoFactorEnabled ? "2FA Activo" : "Configurar 2FA"}
            className="hidden sm:flex items-center gap-1 rounded-lg border border-[#222222] bg-[#141414] px-2.5 py-1 text-xs font-medium text-neutral-300 hover:border-neutral-700 hover:text-white"
          >
            {companyProfile?.twoFactorEnabled ? (
              <ShieldCheck className="h-3.5 w-3.5 text-[#5E7E29]" />
            ) : (
              <Fingerprint className="h-3.5 w-3.5 text-neutral-400" />
            )}
            <span className="text-[11px]">2FA</span>
          </button>

          {/* Language Switcher */}
          <button
            id="lang-switcher-btn"
            onClick={() => handleLangChange(language === 'es' ? 'en' : 'es')}
            className="flex items-center gap-1 rounded-lg border border-[#222222] bg-[#141414] px-2.5 py-1 text-xs font-medium text-neutral-300 hover:border-neutral-700 hover:text-white"
            title="Cambiar idioma / Switch language"
          >
            <Globe className="h-3.5 w-3.5 text-neutral-400" />
            <span className="uppercase text-[11px] font-bold">{language}</span>
          </button>

          {/* Theme Toggle */}
          <button
            id="theme-toggle-btn"
            onClick={onToggleTheme}
            className="rounded-lg border border-[#222222] bg-[#141414] p-1.5 text-neutral-300 hover:border-neutral-700 hover:text-white"
            title="Alternar tema claro/oscuro"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4 text-[#F7BE00]" />
            ) : (
              <Moon className="h-4 w-4 text-neutral-400" />
            )}
          </button>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              id="notifications-dropdown-btn"
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative rounded-lg border border-[#222222] bg-[#141414] p-1.5 text-neutral-300 hover:border-neutral-700 hover:text-white"
              title="Notificaciones push"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#DB0032] text-[9px] font-extrabold text-white">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-[#262626] bg-[#121212] p-3 shadow-2xl z-50">
                <div className="flex items-center justify-between border-b border-[#222222] pb-2">
                  <div className="flex items-center gap-1.5">
                    <Bell className="h-4 w-4 text-[#F7BE00]" />
                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-200">
                      Notificaciones en Tiempo Real
                    </span>
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={onClearAllNotifications}
                      className="text-[10px] text-neutral-400 hover:text-[#F7BE00] underline"
                    >
                      Marcar leídas
                    </button>
                  )}
                </div>

                <div className="mt-2 max-h-80 space-y-2 overflow-y-auto pr-1">
                  {notifications.length === 0 ? (
                    <p className="py-4 text-center text-xs text-neutral-500">
                      No hay notificaciones pendientes
                    </p>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => onMarkNotificationRead(n.id)}
                        className={`rounded-xl p-2.5 text-xs transition border cursor-pointer ${
                          !n.isRead
                            ? 'border-[#F7BE00]/30 bg-[#1f1a0a]'
                            : 'border-[#222222] bg-[#171717] opacity-80'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className={`font-semibold ${!n.isRead ? 'text-[#F7BE00]' : 'text-neutral-200'}`}>
                            {n.title}
                          </span>
                          <span className="text-[10px] text-neutral-500 whitespace-nowrap">
                            {n.time}
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] text-neutral-400 leading-relaxed">
                          {n.message}
                        </p>

                        {n.actionType && (
                          <div className="mt-2 flex justify-end">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onMarkNotificationRead(n.id);
                                onSelectNotificationAction(n.actionType!, n.relatedOrderId);
                                setShowNotifications(false);
                              }}
                              className="rounded bg-[#F7BE00] px-2.5 py-1 text-[10px] font-bold text-black hover:bg-[#e0ac00]"
                            >
                              {n.actionType === 'confirm_dispatch' ? 'Confirmar Despacho' :
                               n.actionType === 'reorder' ? 'Recomprar Ahora' :
                               n.actionType === 'view_invoice' ? 'Ver Factura' : 'Ver Oferta'}
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Quick Cart Drawer Trigger */}
          <button
            id="navbar-cart-trigger-btn"
            onClick={onOpenCart}
            className="flex items-center gap-2 rounded-xl bg-[#F7BE00] px-3 py-1.5 text-xs font-bold text-black shadow-md hover:bg-[#e0ac00] transition active:scale-95"
          >
            <ShoppingCart className="h-4 w-4" />
            <span className="hidden sm:inline font-mono font-extrabold">
              ${cartSubtotal.toFixed(2)}
            </span>
            {cartTotalCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-black text-[10px] font-extrabold text-[#F7BE00]">
                {cartTotalCount}
              </span>
            )}
          </button>
        </div>

      </div>
    </header>
  );
};
