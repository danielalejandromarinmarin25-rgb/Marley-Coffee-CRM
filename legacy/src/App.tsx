import React from 'react';
import { 
  mockCompanyProfile, 
  mockProducts, 
  mockReplenishmentSchedules, 
  mockOrders, 
  mockLoyaltyRewards, 
  mockNotifications 
} from './data/mockData';
import { 
  Language, 
  Product, 
  Order, 
  ReplenishmentSchedule, 
  CompanyProfile, 
  CartItem, 
  LoyaltyReward, 
  NotificationItem 
} from './types';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { SmartSuggestionsModule } from './components/SmartSuggestionsModule';
import { CatalogView } from './components/CatalogView';
import { ReplenishmentView } from './components/ReplenishmentView';
import { OrdersView } from './components/OrdersView';
import { AnalyticsView } from './components/AnalyticsView';
import { ScannerView } from './components/ScannerView';
import { LoyaltyView } from './components/LoyaltyView';
import { SupportView } from './components/SupportView';
import { SettingsView } from './components/SettingsView';

import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { InvoiceModal } from './components/InvoiceModal';
import { TwoFactorModal } from './components/TwoFactorModal';
import { QuickReorderModal } from './components/QuickReorderModal';

import { Bell, CheckCircle2, AlertTriangle, X } from 'lucide-react';

export default function App() {
  // Global State
  const [language, setLanguage] = React.useState<Language>('es');
  const [activeTab, setActiveTab] = React.useState<string>('dashboard');
  const [isOnline, setIsOnline] = React.useState<boolean>(true);

  // Domain State
  const [companyProfile, setCompanyProfile] = React.useState<CompanyProfile>(mockCompanyProfile);
  const [products, setProducts] = React.useState<Product[]>(mockProducts);
  const [schedules, setSchedules] = React.useState<ReplenishmentSchedule[]>(mockReplenishmentSchedules);
  const [orders, setOrders] = React.useState<Order[]>(mockOrders);
  const [rewards, setRewards] = React.useState<LoyaltyReward[]>(mockLoyaltyRewards);
  const [notifications, setNotifications] = React.useState<NotificationItem[]>(mockNotifications);
  const [cartItems, setCartItems] = React.useState<CartItem[]>([]);
  const [activeBranch, setActiveBranch] = React.useState<string>(mockCompanyProfile.branches[0].name);

  // Modals
  const [isCartOpen, setIsCartOpen] = React.useState<boolean>(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = React.useState<boolean>(false);
  const [isInvoiceOpen, setIsInvoiceOpen] = React.useState<boolean>(false);
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = React.useState<Order | null>(null);
  const [is2FAOpen, setIs2FAOpen] = React.useState<boolean>(false);
  const [isQuickReorderOpen, setIsQuickReorderOpen] = React.useState<boolean>(false);
  const [selectedReorderOrder, setSelectedReorderOrder] = React.useState<Order | null>(null);

  // Toast Banner for Push Notifications
  const [activeToast, setActiveToast] = React.useState<{ title: string; message: string; type?: 'info' | 'success' | 'alert' } | null>(null);

  const showToast = (title: string, message: string, type: 'info' | 'success' | 'alert' = 'info') => {
    setActiveToast({ title, message, type });
    setTimeout(() => {
      setActiveToast(null);
    }, 5500);
  };

  // Cart operations
  const handleAddToCart = (product: Product, quantity = 1) => {
    let effectiveUnitPrice = product.basePrice;
    let appliedDiscount = 0;

    if (product.wholesaleTiers && product.wholesaleTiers.length > 0) {
      for (const tier of product.wholesaleTiers) {
        if (quantity >= tier.minKg) {
          effectiveUnitPrice = tier.unitPrice;
          appliedDiscount = tier.discountPercentage;
        }
      }
    }

    setCartItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        const newQty = existing.quantity + quantity;
        let newPrice = product.basePrice;
        let newDiscount = 0;
        if (product.wholesaleTiers) {
          for (const tier of product.wholesaleTiers) {
            if (newQty >= tier.minKg) {
              newPrice = tier.unitPrice;
              newDiscount = tier.discountPercentage;
            }
          }
        }
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: newQty, selectedUnitPrice: newPrice, appliedDiscount: newDiscount }
            : item
        );
      } else {
        return [
          ...prev,
          {
            product,
            quantity,
            selectedUnitPrice: effectiveUnitPrice,
            appliedDiscount
          }
        ];
      }
    });

    showToast(
      'Agregado al Pedido B2B',
      `Se añadieron ${quantity} ${product.unit} de ${product.name} al carrito.`,
      'success'
    );
  };

  const handleUpdateCartQty = (productId: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            let newPrice = item.product.basePrice;
            let newDiscount = 0;
            if (item.product.wholesaleTiers) {
              for (const tier of item.product.wholesaleTiers) {
                if (newQty >= tier.minKg) {
                  newPrice = tier.unitPrice;
                  newDiscount = tier.discountPercentage;
                }
              }
            }
            return {
              ...item,
              quantity: newQty,
              selectedUnitPrice: newPrice,
              appliedDiscount: newDiscount
            };
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleRemoveCartItem = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  // Stock update from scanner
  const handleUpdateStock = (productId: string, newStock: number) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, currentStockOnPremise: newStock } : p))
    );
    showToast(
      'Inventario Físico Sincronizado',
      `Existencias actualizadas en base de datos de ${activeBranch}.`,
      'success'
    );
  };

  // Schedule management
  const handleUpdateSchedule = (updated: ReplenishmentSchedule) => {
    setSchedules((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  };

  const handleDeleteSchedule = (id: string) => {
    setSchedules((prev) => prev.filter((s) => s.id !== id));
    showToast('Reposición Eliminada', 'Se removió el insumo del calendario recurrente.', 'info');
  };

  const handleAddSchedule = (scheduleData: Omit<ReplenishmentSchedule, 'id'>) => {
    const newSchedule: ReplenishmentSchedule = {
      ...scheduleData,
      id: `sch-${Date.now()}`
    };
    setSchedules((prev) => [newSchedule, ...prev]);
    showToast('Reposición Programada', `Insumo ${newSchedule.productName} añadido al calendario.`, 'success');
  };

  const handleAddToReplenishmentFromProduct = (product: Product) => {
    const newSchedule: ReplenishmentSchedule = {
      id: `sch-${Date.now()}`,
      productId: product.id,
      productName: product.name,
      quantity: 5,
      unit: product.unit,
      frequency: 'dias_especificos',
      scheduledDays: ['Martes', 'Viernes'],
      autoDispatch: true,
      lastDispatchDate: '2026-08-28',
      nextDispatchDate: '2026-09-02',
      reminderHoursBefore: 12,
      status: 'active'
    };
    setSchedules((prev) => [newSchedule, ...prev]);
    setActiveTab('replenishment');
    showToast('Programado con Éxito', `Has agregado ${product.name} al piloto de reposición.`, 'success');
  };

  // Push notification simulation
  const handleSimulatePushNotification = () => {
    showToast(
      '🔔 Notificación Push: Recordatorio de Despacho',
      'Tienes 1 despacho programado para mañana (15kg Espresso Blend). Haz clic para confirmar o reprogramar.',
      'alert'
    );
  };

  // Quick reorder trigger
  const handleQuickReorder = (order: Order) => {
    setSelectedReorderOrder(order);
    setIsQuickReorderOpen(true);
  };

  const handleConfirmReorder = (order: Order) => {
    const newOrder: Order = {
      ...order,
      id: `ord-${Date.now()}`,
      orderNumber: `PED-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      invoiceNumber: `CFDI-40-A${Math.floor(10000 + Math.random() * 90000)}`,
      date: new Date().toISOString().split('T')[0],
      status: 'tostando',
      deliveryDate: '2026-09-02'
    };
    setOrders((prev) => [newOrder, ...prev]);
    setCompanyProfile((prev) => ({
      ...prev,
      usedCredit: prev.usedCredit + order.total,
      loyaltyPoints: prev.loyaltyPoints + order.pointsEarned
    }));
    showToast('Recompra Exitosa', `Orden ${newOrder.orderNumber} creada en 1 clic. Factura timbrada.`, 'success');
  };

  // Complete checkout
  const handleCompleteOrder = (newOrder: Order) => {
    setOrders((prev) => [newOrder, ...prev]);
    setCartItems([]);
    setIsCheckoutOpen(false);
    setIsCartOpen(false);
    setCompanyProfile((prev) => ({
      ...prev,
      usedCredit: prev.usedCredit + newOrder.total,
      loyaltyPoints: prev.loyaltyPoints + newOrder.pointsEarned
    }));
    showToast('Pedido B2B Confirmado', `Factura ${newOrder.invoiceNumber} timbrada al SAT.`, 'success');
  };

  // Invoice view
  const handleViewInvoice = (order: Order) => {
    setSelectedInvoiceOrder(order);
    setIsInvoiceOpen(true);
  };

  // Loyalty redeem
  const handleRedeemReward = (reward: LoyaltyReward) => {
    setCompanyProfile((prev) => ({
      ...prev,
      loyaltyPoints: prev.loyaltyPoints - reward.pointsCost
    }));
    setRewards((prev) =>
      prev.map((r) => (r.id === reward.id ? { ...r, isRedeemed: true } : r))
    );
    showToast('Recompensa Canjeada', `Cupón ${reward.title} activado para tu cafetería.`, 'success');
  };

  // Notification handling
  const handleMarkNotificationRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };

  const handleClearAllNotifications = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    showToast('Notificaciones Actualizadas', 'Todas las alertas fueron marcadas como leídas.', 'info');
  };

  const handleNotificationAction = (action: string, orderId?: string) => {
    if (action === 'confirm_dispatch') {
      setActiveTab('replenishment');
    } else if (action === 'reorder') {
      setActiveTab('suggestions');
    } else if (action === 'view_invoice') {
      if (orderId) {
        const order = orders.find((o) => o.id === orderId);
        if (order) handleViewInvoice(order);
        else setActiveTab('orders');
      } else {
        setActiveTab('orders');
      }
    } else if (action === 'view_rewards') {
      setActiveTab('loyalty');
    }
  };

  // Company Profile update
  const handleUpdateProfile = (updated: Partial<CompanyProfile>) => {
    setCompanyProfile((prev) => ({ ...prev, ...updated }));
    showToast('Perfil Actualizado', 'Datos de facturación y Razón Social guardados.', 'success');
  };

  return (
    <div className="min-h-screen bg-black text-neutral-100 font-sans antialiased selection:bg-[#F7BE00] selection:text-black">
      
      {/* Push Notification Toast Simulator */}
      {activeToast && (
        <div className="fixed top-4 right-4 z-50 max-w-md rounded-2xl border border-[#F7BE00] bg-[#161616]/95 backdrop-blur-md p-4 text-white shadow-2xl animate-fade-in flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F7BE00] text-black">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-xs text-white">{activeToast.title}</h4>
              <p className="text-xs text-neutral-300 mt-0.5 leading-relaxed">{activeToast.message}</p>
            </div>
          </div>
          <button
            onClick={() => setActiveToast(null)}
            className="text-neutral-400 hover:text-white p-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Top Navigation */}
      <Navbar
        companyProfile={companyProfile}
        onUpdateProfile={handleUpdateProfile}
        branches={companyProfile.branches}
        activeBranch={activeBranch}
        onSelectBranch={setActiveBranch}
        cartItems={cartItems}
        cartCount={cartItems.reduce((acc, i) => acc + i.quantity, 0)}
        onOpenCart={() => setIsCartOpen(true)}
        onOpen2FAModal={() => setIs2FAOpen(true)}
        notifications={notifications}
        onMarkNotificationRead={handleMarkNotificationRead}
        onClearAllNotifications={handleClearAllNotifications}
        onSelectNotificationAction={handleNotificationAction}
        language={language}
        onChangeLanguage={setLanguage}
        onLanguageChange={setLanguage}
        isOnline={isOnline}
        onToggleOnline={() => setIsOnline(!isOnline)}
        onToggleOffline={() => setIsOnline(!isOnline)}
        onNavigate={setActiveTab}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex gap-6">
        
        {/* Left Sidebar (Desktop & Tablet) */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          language={language}
          cartCount={cartItems.reduce((acc, i) => acc + i.quantity, 0)}
        />

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 pb-20 md:pb-6">
          {activeTab === 'dashboard' && (
            <DashboardView
              companyProfile={companyProfile}
              products={products}
              schedules={schedules}
              orders={orders}
              language={language}
              onNavigate={setActiveTab}
              onAddToCart={handleAddToCart}
              onQuickReorder={handleQuickReorder}
              onViewInvoice={handleViewInvoice}
            />
          )}

          {activeTab === 'suggestions' && (
            <SmartSuggestionsModule
              products={products}
              orders={orders}
              schedules={schedules}
              language={language}
              activeBranch={activeBranch}
              onAddToCart={handleAddToCart}
              onAddToReplenish={handleAddToReplenishmentFromProduct}
              onUpdateStock={handleUpdateStock}
              onNavigateToTab={setActiveTab}
            />
          )}

          {activeTab === 'catalog' && (
            <CatalogView
              products={products}
              language={language}
              onAddToCart={handleAddToCart}
              onAddToReplenishmentSchedule={handleAddToReplenishmentFromProduct}
            />
          )}

          {activeTab === 'replenishment' && (
            <ReplenishmentView
              schedules={schedules}
              products={products}
              language={language}
              onUpdateSchedule={handleUpdateSchedule}
              onDeleteSchedule={handleDeleteSchedule}
              onAddSchedule={handleAddSchedule}
              onSimulatePushNotification={handleSimulatePushNotification}
            />
          )}

          {activeTab === 'orders' && (
            <OrdersView
              orders={orders}
              language={language}
              onQuickReorder={handleQuickReorder}
              onViewInvoice={handleViewInvoice}
            />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsView language={language} />
          )}

          {activeTab === 'scanner' && (
            <ScannerView
              products={products}
              language={language}
              onUpdateStock={handleUpdateStock}
              onAddToCart={handleAddToCart}
              onAddToReplenish={handleAddToReplenishmentFromProduct}
            />
          )}

          {activeTab === 'loyalty' && (
            <LoyaltyView
              companyProfile={companyProfile}
              rewards={rewards}
              language={language}
              onRedeemReward={handleRedeemReward}
            />
          )}

          {activeTab === 'support' && (
            <SupportView language={language} />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              companyProfile={companyProfile}
              language={language}
              onUpdateProfile={handleUpdateProfile}
              onOpen2FAModal={() => setIs2FAOpen(true)}
            />
          )}
        </main>

      </div>

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateCartQty}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={() => setCartItems([])}
        onProceedToCheckout={() => {
          setIsCartOpen(false);
          setIsCheckoutOpen(true);
        }}
        companyProfile={companyProfile}
        language={language}
      />

      {/* Checkout & Fiscal Payment Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cartItems={cartItems}
        companyProfile={companyProfile}
        language={language}
        onCompleteOrder={handleCompleteOrder}
      />

      {/* Fiscal Invoice Viewer Modal */}
      <InvoiceModal
        isOpen={isInvoiceOpen}
        onClose={() => setIsInvoiceOpen(false)}
        order={selectedInvoiceOrder}
        companyProfile={companyProfile}
        language={language}
      />

      {/* 2FA Authenticator Modal */}
      <TwoFactorModal
        isOpen={is2FAOpen}
        onClose={() => setIs2FAOpen(false)}
        isEnabled={companyProfile.twoFactorEnabled}
        onToggle2FA={(enable) => {
          handleUpdateProfile({ twoFactorEnabled: enable });
        }}
        language={language}
      />

      {/* 1-Click Fast Reorder Modal */}
      <QuickReorderModal
        isOpen={isQuickReorderOpen}
        onClose={() => setIsQuickReorderOpen(false)}
        order={selectedReorderOrder}
        onConfirmReorder={handleConfirmReorder}
        language={language}
      />

    </div>
  );
}
