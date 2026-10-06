export type Language = 'es' | 'en';
export type Theme = 'dark' | 'light';

export type UserRole = 'Gerente General' | 'Jefe de Baristas' | 'Encargado de Compras' | 'Admin';

export interface BranchInfo {
  id: string;
  name: string;
  address: string;
}

export type LoyaltyTier = 'Bronce Barista' | 'Plata Especialidad' | 'Oro Master Roaster' | 'Embajador One Love';

export interface CompanyProfile {
  companyName: string; // Razón Social (ej. Café Gourmet & Co. S.A.S.)
  taxId: string; // RFC / RUT / CIF / NIT (ej. CGO200315-AB9)
  legalRepresentative: string;
  email: string;
  phone: string;
  fiscalAddress: string;
  taxRegime: string; // Régimen fiscal (ej. General de Ley Personas Morales)
  cfdiUsage: string; // Uso de CFDI / Facturación (ej. G01 - Adquisición de mercancías)
  electronicInvoiceEmail: string;
  approvedCreditLimit: number; // e.g. 18000 USD
  usedCredit: number; // e.g. 4750
  paymentTermDays: 15 | 30 | 60; // Días de crédito
  currentBranch: string;
  branches: BranchInfo[];
  twoFactorEnabled: boolean;
  biometricEnabled: boolean;
  loyaltyPoints: number;
  loyaltyTier: LoyaltyTier;
}

export interface WholesaleTier {
  minKg: number;
  discountPercentage: number;
  unitPrice: number;
}

export type ProductCategory = 'granos' | 'leches' | 'jarabes' | 'empaques' | 'limpieza' | 'maquinaria';

export type ProcessMethod = 
  | 'Lavado Artesanal & Secado al Sol'
  | 'Lavado & Pulped Natural'
  | 'Lavado Doble Fermentación'
  | 'Wet-Hulled (Giling Basah)'
  | 'Descafeinado Natural 100% por Agua (Swiss Water)'
  | 'Lavado Tradicional'
  | 'Lavado & Natural'
  | 'Lavado'
  | 'Natural'
  | 'Honey'
  | 'Anaeróbico'
  | 'N/A'
  | string;

export type RoastLevel = 
  | 'Claro (Light Roast)'
  | 'Medio-Claro (Light-Medium Roast)'
  | 'Medio (Medium Roast)'
  | 'Medio Balanceado (Medium Roast)'
  | 'Medio (Espresso)'
  | 'Medio-Claro'
  | 'Medio-Oscuro'
  | 'Oscuro Italiano (Dark Espresso Roast)'
  | 'Oscuro Intenso (Dark Roast)'
  | 'Extra Oscuro (French Roast)'
  | 'N/A'
  | string;

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  origin?: string;
  variety?: string;
  process?: ProcessMethod;
  roastLevel?: RoastLevel;
  tastingNotes?: string[];
  altitude?: string;
  basePrice: number; // Precio por unidad base
  unit: string; // 'Bolsa 5kg', 'Bolsa 1kg', 'Caja 12x1L', 'Paquete 1000u', 'Caja 100 pastillas'
  unitWeightKg: number;
  currentStockOnPremise: number; // Stock físico en la cafetería
  optimalStockLevel: number;
  dailyBurnRate: number; // Consumo diario estimado
  wholesaleTiers: WholesaleTier[];
  isFrequent: boolean;
  barcode: string;
  imageUrl: string;
  description: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedUnitPrice: number;
  appliedDiscount: number;
}

export type OrderStatus = 'tostando' | 'en_camino' | 'entregado' | 'pendiente_pago' | 'cancelado';
export type PaymentMethod = 
  | 'credit_line' 
  | 'card' 
  | 'bank_transfer' 
  | 'Línea de Crédito Net-30 Marley B2B'
  | 'Línea de Crédito Net-30' 
  | 'Tarjeta Corporativa B2B' 
  | 'Transferencia Bancaria SPEI'
  | string;

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
  unit?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  date: string;
  deliveryDateEstimated?: string;
  deliveryDate?: string;
  branch: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  tax: number; // 16% IVA
  discount: number;
  total: number;
  pointsEarned: number;
  paymentMethod: PaymentMethod;
  paymentStatus: 'paid' | 'credit_pending' | 'wire_verification' | 'financiamiento_aprobado' | 'pagado';
  invoiceNumber: string;
  invoiceGenerated?: boolean;
  deliveryAddress?: string;
  isAutoReplenish?: boolean;
}

export interface ReplenishmentSchedule {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  frequency: 'semanal' | 'quincenal' | 'dias_especificos';
  scheduledDays: ('Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes' | 'Sábado' | 'Domingo')[];
  autoDispatch: boolean;
  lastDispatchDate: string;
  nextDispatchDate: string;
  reminderHoursBefore: number;
  status: 'active' | 'paused';
}

export interface LoyaltyReward {
  id: string;
  title: string;
  description: string;
  pointsCost: number;
  discountType: 'percentage' | 'fixed_cash' | 'free_product';
  value: number;
  discountValue?: number;
  category: string;
  isRedeemed: boolean;
  isAvailable?: boolean;
  code?: string;
}

export type NotificationType = 
  | 'dispatch_alert' 
  | 'stock_warning' 
  | 'invoice' 
  | 'deal' 
  | 'support'
  | 'dispatch_pending'
  | 'stock_alert'
  | 'invoice_ready'
  | 'loyalty_update';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  date?: string;
  time?: string;
  timestamp?: string;
  type: NotificationType;
  isRead: boolean;
  actionRequired?: boolean;
  actionType?: 'confirm_dispatch' | 'reorder' | 'view_invoice' | 'view_rewards';
  relatedOrderId?: string;
}

export interface BaristaChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'technician';
  text: string;
  timestamp: string;
  suggestedQuickActions?: string[];
  isAiGenerated?: boolean;
}

export type SuggestionUrgency = 'critical' | 'warning' | 'moderate';

export interface SmartSuggestion {
  id: string;
  productId: string;
  productName: string;
  category: ProductCategory;
  imageUrl: string;
  currentStock: number;
  optimalStockLevel: number;
  unit: string;
  unitWeightKg: number;
  basePrice: number;
  dailyBurnRate: number;
  effectiveBurnRate: number;
  estimatedDaysLeft: number;
  predictedDepletionDate: string;
  predictedDepletionDayName: string;
  suggestedQuantity: number;
  suggestedUnitPrice: number;
  appliedDiscountPercentage: number;
  estimatedSavings: number;
  totalSuggestedCost: number;
  urgencyLevel: SuggestionUrgency;
  historicalOrderCount: number;
  lastOrderedDate?: string;
  daysSinceLastOrder?: number;
  avgOrderIntervalDays?: number;
  reason: string;
  aiConfidenceScore: number;
  recommendedTierNote?: string;
  hasActiveSchedule: boolean;
  activeScheduleDays?: string[];
}

export interface SmartSuggestionsSummary {
  criticalCount: number;
  warningCount: number;
  moderateCount: number;
  totalPotentialSavings: number;
  averageCoverageDays: number;
  totalSuggestedCost: number;
  urgentItemsCost: number;
  suggestions: SmartSuggestion[];
  aiExecutiveInsight?: string;
}
