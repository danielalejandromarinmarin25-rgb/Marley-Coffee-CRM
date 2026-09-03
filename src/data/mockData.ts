import { CompanyProfile, Product, Order, ReplenishmentSchedule, LoyaltyReward, NotificationItem } from '../types';

export const mockCompanyProfile: CompanyProfile = {
  companyName: "Grupo Gastronómico & Cafeterías One Love S.A.P.I.",
  taxId: "MCL180614-KA9",
  legalRepresentative: "Valentina Morales Rivas",
  email: "compras.b2b@onelovehospitality.com",
  phone: "+52 55 8421 9930",
  fiscalAddress: "Av. Insurgentes Sur 1450, Piso 4, Benito Juárez, CDMX, CP 03100",
  taxRegime: "601 - General de Ley Personas Morales",
  cfdiUsage: "G01 - Adquisición de mercancías",
  electronicInvoiceEmail: "facturacion@onelovehospitality.com",
  approvedCreditLimit: 25000,
  usedCredit: 6420,
  paymentTermDays: 30,
  currentBranch: "Marley Coffee Bar - Roma Norte",
  branches: [
    { id: "br-1", name: "Marley Coffee Bar - Roma Norte", address: "Av. Álvaro Obregón 154, Roma Nte., CDMX" },
    { id: "br-2", name: "Marley Coffee House - Condesa Parque", address: "Av. México 128, Condesa, CDMX" },
    { id: "br-3", name: "Marley Specialty Bar - Polanco", address: "Av. Pdte. Masaryk 311, Polanco, CDMX" },
    { id: "br-4", name: "Marley Café & Roastery - Coyoacán", address: "Jardín Plaza Hidalgo 12, Coyoacán, CDMX" }
  ],
  twoFactorEnabled: true,
  biometricEnabled: true,
  loyaltyPoints: 4850,
  loyaltyTier: 'Embajador One Love'
};

export const initialCompanyProfile = mockCompanyProfile;

export const mockProducts: Product[] = [
  {
    id: "marley-01",
    name: "Marley Coffee - One Love (100% Ethiopia Yirgacheffe Organic)",
    category: "granos",
    origin: "Yirgacheffe, Kochere, Etiopía (Orgánico Certificado)",
    variety: "100% Arábica Heirloom Etíope",
    process: "Lavado Artesanal & Secado al Sol",
    roastLevel: "Medio-Claro (Light-Medium Roast)",
    tastingNotes: ["Jazmín en flor", "Arándanos silvestres", "Flor de azahar", "Miel de caña"],
    altitude: "1,950 - 2,200 msnm",
    basePrice: 168.00,
    unit: "Saco Mayorista 5kg con válvula",
    unitWeightKg: 5,
    currentStockOnPremise: 3.5,
    optimalStockLevel: 15,
    dailyBurnRate: 1.8,
    isFrequent: true,
    barcode: "852443003014",
    imageUrl: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=600&auto=format&fit=crop&q=80",
    description: "El café insignia de Marley Coffee. Rinde tributo a Bob Marley con notas florales y frutales vibrantes. 100% Orgánico USDA y Rainforest Alliance.",
    wholesaleTiers: [
      { minKg: 5, discountPercentage: 0, unitPrice: 168.00 },
      { minKg: 20, discountPercentage: 10, unitPrice: 151.20 },
      { minKg: 50, discountPercentage: 18, unitPrice: 137.76 }
    ]
  },
  {
    id: "marley-02",
    name: "Marley Coffee - Lively Up Espresso Roast (10kg)",
    category: "granos",
    origin: "Sierra Nevada (Colombia) & Cerrado Mineiro (Brasil)",
    variety: "100% Arábica Castillo / Catuai Orgánico",
    process: "Lavado & Pulped Natural",
    roastLevel: "Oscuro Italiano (Dark Espresso Roast)",
    tastingNotes: ["Chocolate amargo 70%", "Almendra tostada", "Caramelo tostado", "Crema elástica"],
    altitude: "1,550 - 1,800 msnm",
    basePrice: 198.00,
    unit: "Caja Mayorista 10kg (2 x 5kg)",
    unitWeightKg: 10,
    currentStockOnPremise: 7.0,
    optimalStockLevel: 25,
    dailyBurnRate: 3.4,
    isFrequent: true,
    barcode: "852443003021",
    imageUrl: "https://images.unsplash.com/photo-1587734195503-904fca47e0e9?w=600&auto=format&fit=crop&q=80",
    description: "Diseñado para calibración de espresso en tolvas de alta rotación. Cuerpo redondo, notas intensas a praliné de chocolate y excelente emulsión con leches.",
    wholesaleTiers: [
      { minKg: 10, discountPercentage: 0, unitPrice: 198.00 },
      { minKg: 30, discountPercentage: 10, unitPrice: 178.20 },
      { minKg: 60, discountPercentage: 18, unitPrice: 162.36 }
    ]
  },
  {
    id: "marley-03",
    name: "Marley Coffee - Get Up Stand Up (Light Roast Morning Blend)",
    category: "granos",
    origin: "Guatemala Huehuetenango & Nariño Colombia",
    variety: "Bourbon / Caturra 100% Orgánico",
    process: "Lavado Doble Fermentación",
    roastLevel: "Claro (Light Roast)",
    tastingNotes: ["Limón dulce", "Manzana verde", "Jazmín", "Miel de azahar"],
    altitude: "1,850 msnm",
    basePrice: 155.00,
    unit: "Saco Mayorista 5kg",
    unitWeightKg: 5,
    currentStockOnPremise: 2.0,
    optimalStockLevel: 10,
    dailyBurnRate: 1.2,
    isFrequent: true,
    barcode: "852443003038",
    imageUrl: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80",
    description: "Despierta los sentidos con acidez brillante y dulzura limpia. Ideal para métodos de filtrado artesanal V60, Chemex y torres de Cold Brew.",
    wholesaleTiers: [
      { minKg: 5, discountPercentage: 0, unitPrice: 155.00 },
      { minKg: 20, discountPercentage: 8, unitPrice: 142.60 },
      { minKg: 40, discountPercentage: 15, unitPrice: 131.75 }
    ]
  },
  {
    id: "marley-04",
    name: "Marley Coffee - Buffalo Soldier (Dark Smoky Roast 5kg)",
    category: "granos",
    origin: "Sumatra Mandheling & Chiapas Orgánico",
    variety: "Typica / Catimor",
    process: "Wet-Hulled (Giling Basah)",
    roastLevel: "Oscuro Intenso (Dark Roast)",
    tastingNotes: ["Cacao puro", "Cedro ahumado", "Nuez de nogal", "Melaza densa"],
    altitude: "1,400 - 1,700 msnm",
    basePrice: 162.00,
    unit: "Saco Mayorista 5kg",
    unitWeightKg: 5,
    currentStockOnPremise: 4.0,
    optimalStockLevel: 12,
    dailyBurnRate: 1.5,
    isFrequent: true,
    barcode: "852443003045",
    imageUrl: "https://images.unsplash.com/photo-1611854779393-1b2da9d400fe?w=600&auto=format&fit=crop&q=80",
    description: "Inspirado en la fuerza y resistencia. Tueste profundo con notas ahumadas y cuerpo robusto que resalta en cortados, cappuccinos y moka.",
    wholesaleTiers: [
      { minKg: 5, discountPercentage: 0, unitPrice: 162.00 },
      { minKg: 20, discountPercentage: 10, unitPrice: 145.80 },
      { minKg: 40, discountPercentage: 16, unitPrice: 136.08 }
    ]
  },
  {
    id: "marley-05",
    name: "Marley Coffee - Simmer Down Decaf (Swiss Water Process)",
    category: "granos",
    origin: "Valle Central, Costa Rica & Tarrazú",
    variety: "Caturra / Villa Sarchi Orgánico",
    process: "Descafeinado Natural 100% por Agua (Swiss Water)",
    roastLevel: "Medio (Medium Roast)",
    tastingNotes: ["Chocolate de leche", "Avellana tostada", "Vainilla suave", "Cuerpo sedoso"],
    altitude: "1,600 msnm",
    basePrice: 172.00,
    unit: "Saco Mayorista 5kg",
    unitWeightKg: 5,
    currentStockOnPremise: 1.5,
    optimalStockLevel: 8,
    dailyBurnRate: 0.7,
    isFrequent: true,
    barcode: "852443003052",
    imageUrl: "https://images.unsplash.com/photo-1518832553480-cd0e625ed3e6?w=600&auto=format&fit=crop&q=80",
    description: "Descafeinado 99.9% libre de cafeína sin utilizar solventes químicos. Mantiene intactos los azúcares y aromas naturales del grano de especialidad.",
    wholesaleTiers: [
      { minKg: 5, discountPercentage: 0, unitPrice: 172.00 },
      { minKg: 15, discountPercentage: 8, unitPrice: 158.24 },
      { minKg: 30, discountPercentage: 15, unitPrice: 146.20 }
    ]
  },
  {
    id: "marley-06",
    name: "Marley Coffee - Mystic Morning (Medium Roast 5kg)",
    category: "granos",
    origin: "Marcala Honduras & Matagalpa Nicaragua",
    variety: "Pacamara / Catuai Orgánico",
    process: "Lavado",
    roastLevel: "Medio Balanceado (Medium Roast)",
    tastingNotes: ["Panela orgánica", "Nuez pecana", "Cacao nibs", "Manzana horneada"],
    altitude: "1,650 msnm",
    basePrice: 150.00,
    unit: "Saco Mayorista 5kg",
    unitWeightKg: 5,
    currentStockOnPremise: 3.0,
    optimalStockLevel: 10,
    dailyBurnRate: 1.0,
    isFrequent: false,
    barcode: "852443003069",
    imageUrl: "https://images.unsplash.com/photo-1509785307050-d4066910ec1e?w=600&auto=format&fit=crop&q=80",
    description: "Equilibrio armónico con acidez balanceada y dulzura prolongada. Ideal para servicio de filtrado continuo en cafeterías y restaurantes.",
    wholesaleTiers: [
      { minKg: 5, discountPercentage: 0, unitPrice: 150.00 },
      { minKg: 20, discountPercentage: 10, unitPrice: 135.00 },
      { minKg: 40, discountPercentage: 15, unitPrice: 127.50 }
    ]
  },
  {
    id: "marley-07",
    name: "Marley Coffee - Kingston City (French Extra Dark 10kg)",
    category: "granos",
    origin: "Honduras Copán & Oaxaca México",
    variety: "Pluma Hidalgo / Typica",
    process: "Lavado Tradicional",
    roastLevel: "Extra Oscuro (French Roast)",
    tastingNotes: ["Melaza de caña", "Chocolate 85%", "Pimienta gorda", "Aroma torrefacto denso"],
    altitude: "1,500 msnm",
    basePrice: 188.00,
    unit: "Caja Mayorista 10kg (2 x 5kg)",
    unitWeightKg: 10,
    currentStockOnPremise: 8.0,
    optimalStockLevel: 18,
    dailyBurnRate: 2.1,
    isFrequent: false,
    barcode: "852443003076",
    imageUrl: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80",
    description: "Tueste extra profundo inspirado en la energía de Kingston. Diseñado para bebidas frías con jarabes y frappés de alto volumen.",
    wholesaleTiers: [
      { minKg: 10, discountPercentage: 0, unitPrice: 188.00 },
      { minKg: 30, discountPercentage: 10, unitPrice: 169.20 },
      { minKg: 60, discountPercentage: 18, unitPrice: 154.16 }
    ]
  },
  {
    id: "marley-08",
    name: "Leche de Avena Barista Edition Marley Partner (12 x 1L)",
    category: "leches",
    basePrice: 42.00,
    unit: "Caja 12 x 1L TetraPak",
    unitWeightKg: 12,
    currentStockOnPremise: 5,
    optimalStockLevel: 18,
    dailyBurnRate: 2.2,
    isFrequent: true,
    barcode: "7350052294123",
    imageUrl: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&auto=format&fit=crop&q=80",
    description: "Edición barista oficial certificada para café orgánico. Permite emulsionar microespuma sedosa y crear latte art de campeonato sin cortarse con acidez frutal.",
    wholesaleTiers: [
      { minKg: 1, discountPercentage: 0, unitPrice: 42.00 },
      { minKg: 5, discountPercentage: 10, unitPrice: 37.80 },
      { minKg: 15, discountPercentage: 18, unitPrice: 34.44 }
    ]
  },
  {
    id: "marley-09",
    name: "Leche de Almendra Barista Pro Marley (12 x 1L)",
    category: "leches",
    basePrice: 44.00,
    unit: "Caja 12 x 1L TetraPak",
    unitWeightKg: 12,
    currentStockOnPremise: 6,
    optimalStockLevel: 14,
    dailyBurnRate: 1.1,
    isFrequent: false,
    barcode: "7350052298811",
    imageUrl: "https://images.unsplash.com/photo-1584947921538-466d0c4369e8?w=600&auto=format&fit=crop&q=80",
    description: "Bebida vegetal de almendra tostada sin azúcares añadidos ni saborizantes artificiales. Estabilidad térmica óptima hasta 65°C.",
    wholesaleTiers: [
      { minKg: 1, discountPercentage: 0, unitPrice: 44.00 },
      { minKg: 5, discountPercentage: 8, unitPrice: 40.48 },
      { minKg: 10, discountPercentage: 15, unitPrice: 37.40 }
    ]
  },
  {
    id: "marley-10",
    name: "Jarabe Orgánico Vainilla Bourbon de Madagascar (1L)",
    category: "jarabes",
    basePrice: 19.50,
    unit: "Botella Vidrio 1L + Bomba Dosificadora",
    unitWeightKg: 1.3,
    currentStockOnPremise: 3,
    optimalStockLevel: 8,
    dailyBurnRate: 0.4,
    isFrequent: true,
    barcode: "852443004011",
    imageUrl: "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=600&auto=format&fit=crop&q=80",
    description: "Extracto 100% puro de vainas de Madagascar con azúcar de caña orgánica. Sin conservantes químicos ni colorantes sintéticos.",
    wholesaleTiers: [
      { minKg: 1, discountPercentage: 0, unitPrice: 19.50 },
      { minKg: 6, discountPercentage: 10, unitPrice: 17.55 },
      { minKg: 12, discountPercentage: 20, unitPrice: 15.60 }
    ]
  },
  {
    id: "marley-11",
    name: "Jarabe Orgánico Caramelo Artesanal & Sal de Mar (1L)",
    category: "jarabes",
    basePrice: 19.50,
    unit: "Botella Vidrio 1L + Bomba Dosificadora",
    unitWeightKg: 1.3,
    currentStockOnPremise: 4,
    optimalStockLevel: 8,
    dailyBurnRate: 0.35,
    isFrequent: false,
    barcode: "852443004028",
    imageUrl: "https://images.unsplash.com/photo-1587734195503-904fca47e0e9?w=600&auto=format&fit=crop&q=80",
    description: "Caramelo dorado artesanal elaborado a fuego lento con cristales de flor de sal marina. Notas a mantequilla tostada y vainilla.",
    wholesaleTiers: [
      { minKg: 1, discountPercentage: 0, unitPrice: 19.50 },
      { minKg: 6, discountPercentage: 10, unitPrice: 17.55 },
      { minKg: 12, discountPercentage: 20, unitPrice: 15.60 }
    ]
  },
  {
    id: "marley-12",
    name: "Vasos Marley Bio-Cups Compostables Doble Pared 12oz (1,000u)",
    category: "empaques",
    basePrice: 88.00,
    unit: "Caja 1,000 vasos + tapas PLA",
    unitWeightKg: 8.5,
    currentStockOnPremise: 2,
    optimalStockLevel: 6,
    dailyBurnRate: 0.5,
    isFrequent: true,
    barcode: "852443005018",
    imageUrl: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80",
    description: "Vasos ecológicos con certificación de compostabilidad industrial. Fabricados en papel FSC con barrera vegetal de almidón de maíz e insignia del León Marley.",
    wholesaleTiers: [
      { minKg: 1, discountPercentage: 0, unitPrice: 88.00 },
      { minKg: 3, discountPercentage: 8, unitPrice: 80.96 },
      { minKg: 6, discountPercentage: 15, unitPrice: 74.80 }
    ]
  },
  {
    id: "marley-13",
    name: "Vasos Marley Bio-Cups Doble Pared 8oz / Cortado (1,000u)",
    category: "empaques",
    basePrice: 78.00,
    unit: "Caja 1,000 vasos 8oz",
    unitWeightKg: 7.0,
    currentStockOnPremise: 3,
    optimalStockLevel: 6,
    dailyBurnRate: 0.4,
    isFrequent: false,
    barcode: "852443005025",
    imageUrl: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=600&auto=format&fit=crop&q=80",
    description: "Formato especial para bebidas cortas como flat white, cortado y cappuccino tradicional. Doble cámara de aire aislante.",
    wholesaleTiers: [
      { minKg: 1, discountPercentage: 0, unitPrice: 78.00 },
      { minKg: 3, discountPercentage: 8, unitPrice: 71.76 },
      { minKg: 6, discountPercentage: 15, unitPrice: 66.30 }
    ]
  },
  {
    id: "marley-14",
    name: "Pastillas Limpieza Biológica Grupos Espresso Marley Clean (100 tabs)",
    category: "limpieza",
    basePrice: 29.50,
    unit: "Bote 100 pastillas",
    unitWeightKg: 0.5,
    currentStockOnPremise: 1,
    optimalStockLevel: 3,
    dailyBurnRate: 0.05,
    isFrequent: false,
    barcode: "852443006015",
    imageUrl: "https://images.unsplash.com/photo-1585553616435-2dc0a54e271d?w=600&auto=format&fit=crop&q=80",
    description: "Fórmula biodegradable no corrosiva para desengrase y remoción de aceites en electroválvulas, duchas y portafiltros profesionales.",
    wholesaleTiers: [
      { minKg: 1, discountPercentage: 0, unitPrice: 29.50 },
      { minKg: 4, discountPercentage: 12, unitPrice: 25.96 }
    ]
  }
];

export const mockOrders: Order[] = [
  {
    id: "ord-904",
    orderNumber: "PED-MC-2026-0904",
    date: "2026-08-28",
    deliveryDateEstimated: "2026-08-30",
    deliveryDate: "2026-08-30",
    branch: "Marley Coffee Bar - Roma Norte",
    status: "entregado",
    items: [
      {
        productId: "marley-02",
        productName: "Marley Coffee - Lively Up Espresso Roast (10kg)",
        quantity: 3,
        unitPrice: 178.20,
        total: 534.60,
        unit: "Caja Mayorista 10kg"
      },
      {
        productId: "marley-08",
        productName: "Leche de Avena Barista Edition Marley Partner (12 x 1L)",
        quantity: 6,
        unitPrice: 37.80,
        total: 226.80,
        unit: "Caja 12x1L"
      },
      {
        productId: "marley-10",
        productName: "Jarabe Orgánico Vainilla Bourbon de Madagascar (1L)",
        quantity: 3,
        unitPrice: 19.50,
        total: 58.50,
        unit: "Botella 1L"
      }
    ],
    subtotal: 819.90,
    tax: 131.18,
    discount: 50.00,
    total: 901.08,
    pointsEarned: 90,
    paymentMethod: "Línea de Crédito Net-30 Marley B2B",
    paymentStatus: "financiamiento_aprobado",
    invoiceNumber: "FACT-MARLEY-2026-4491",
    invoiceGenerated: true,
    deliveryAddress: "Av. Insurgentes Sur 1450, Piso 4, Roma Norte",
    isAutoReplenish: true
  },
  {
    id: "ord-881",
    orderNumber: "PED-MC-2026-0881",
    date: "2026-08-21",
    deliveryDateEstimated: "2026-08-23",
    deliveryDate: "2026-08-23",
    branch: "Marley Coffee House - Condesa Parque",
    status: "entregado",
    items: [
      {
        productId: "marley-01",
        productName: "Marley Coffee - One Love (100% Ethiopia Yirgacheffe Organic)",
        quantity: 4,
        unitPrice: 151.20,
        total: 604.80,
        unit: "Saco 5kg"
      },
      {
        productId: "marley-12",
        productName: "Vasos Marley Bio-Cups Compostables Doble Pared 12oz (1,000u)",
        quantity: 2,
        unitPrice: 88.00,
        total: 176.00,
        unit: "Caja 1000u"
      }
    ],
    subtotal: 780.80,
    tax: 124.93,
    discount: 0,
    total: 905.73,
    pointsEarned: 91,
    paymentMethod: "Tarjeta Corporativa B2B",
    paymentStatus: "pagado",
    invoiceNumber: "FACT-MARLEY-2026-4310",
    invoiceGenerated: true,
    deliveryAddress: "Av. México 128, Condesa",
    isAutoReplenish: false
  },
  {
    id: "ord-840",
    orderNumber: "PED-MC-2026-0840",
    date: "2026-08-14",
    deliveryDateEstimated: "2026-08-16",
    deliveryDate: "2026-08-16",
    branch: "Marley Coffee Bar - Roma Norte",
    status: "entregado",
    items: [
      {
        productId: "marley-02",
        productName: "Marley Coffee - Lively Up Espresso Roast (10kg)",
        quantity: 4,
        unitPrice: 178.20,
        total: 712.80,
        unit: "Caja 10kg"
      },
      {
        productId: "marley-03",
        productName: "Marley Coffee - Get Up Stand Up (Light Roast Morning Blend)",
        quantity: 2,
        unitPrice: 155.00,
        total: 310.00,
        unit: "Saco 5kg"
      }
    ],
    subtotal: 1022.80,
    tax: 163.65,
    discount: 80.00,
    total: 1106.45,
    pointsEarned: 111,
    paymentMethod: "Transferencia Bancaria SPEI",
    paymentStatus: "pagado",
    invoiceNumber: "FACT-MARLEY-2026-4190",
    invoiceGenerated: true,
    deliveryAddress: "Av. Insurgentes Sur 1450, Piso 4, Roma Norte",
    isAutoReplenish: true
  }
];

export const mockReplenishmentSchedules: ReplenishmentSchedule[] = [
  {
    id: "rep-1",
    productId: "marley-02",
    productName: "Marley Coffee - Lively Up Espresso Roast (10kg)",
    quantity: 3,
    unit: "Cajas Mayoristas (30 kg)",
    frequency: "dias_especificos",
    scheduledDays: ["Martes", "Viernes"],
    autoDispatch: true,
    lastDispatchDate: "2026-08-28",
    nextDispatchDate: "2026-09-01",
    reminderHoursBefore: 12,
    status: "active"
  },
  {
    id: "rep-2",
    productId: "marley-08",
    productName: "Leche de Avena Barista Edition Marley Partner (12 x 1L)",
    quantity: 5,
    unit: "Cajas (60 L)",
    frequency: "semanal",
    scheduledDays: ["Miércoles"],
    autoDispatch: true,
    lastDispatchDate: "2026-08-27",
    nextDispatchDate: "2026-09-03",
    reminderHoursBefore: 24,
    status: "active"
  },
  {
    id: "rep-3",
    productId: "marley-01",
    productName: "Marley Coffee - One Love (100% Ethiopia Yirgacheffe Organic)",
    quantity: 2,
    unit: "Sacos (10 kg)",
    frequency: "quincenal",
    scheduledDays: ["Lunes"],
    autoDispatch: false,
    lastDispatchDate: "2026-08-18",
    nextDispatchDate: "2026-09-01",
    reminderHoursBefore: 48,
    status: "active"
  }
];

export const mockLoyaltyRewards: LoyaltyReward[] = [
  {
    id: "rew-1",
    title: "Saco 5kg Marley One Love Gratis",
    pointsCost: 2500,
    category: "insumos",
    discountType: "free_product",
    value: 168,
    discountValue: 168,
    isRedeemed: false,
    isAvailable: true,
    description: "Canjea 2,500 puntos One Love por 1 saco de 5kg de nuestro origen insignia 100% Etiopía Yirgacheffe Orgánico."
  },
  {
    id: "rew-2",
    title: "Cupón $150 USD de Descuento en Próxima Factura",
    pointsCost: 1800,
    category: "descuento_factura",
    discountType: "fixed_cash",
    value: 150,
    discountValue: 150,
    isRedeemed: false,
    isAvailable: true,
    description: "Descuento directo aplicable a tu próxima factura fiscal en pedidos superiores a $600 USD."
  },
  {
    id: "rew-3",
    title: "Calibración Master Barista Marley en tu Barra (2 Horas)",
    pointsCost: 3500,
    category: "talleres",
    discountType: "free_product",
    value: 280,
    discountValue: 280,
    isRedeemed: false,
    isAvailable: true,
    description: "Visita presencial de nuestro Roaster & Head Barista para calibrar muelas, ratios de espresso y recetas de firma."
  },
  {
    id: "rew-4",
    title: "Kit Merchandising Marley Barista (2 Mandiles + 2 Pitchers)",
    pointsCost: 1200,
    category: "merch",
    discountType: "free_product",
    value: 95,
    discountValue: 95,
    isRedeemed: false,
    isAvailable: true,
    description: "2 mandiles de lona artesanal con bordado del León dorado y dos jarras de acero inoxidable para latte art."
  }
];

export const mockNotifications: NotificationItem[] = [
  {
    id: "notif-1",
    title: "Tostaduría Central Marley: Lote Enfriado & Empacado",
    message: "Tu pedido programado de Lively Up Espresso Roast está listo para despacho a Sucursal Roma Norte.",
    timestamp: "Hace 20 min",
    isRead: false,
    type: "dispatch_pending",
    actionRequired: true,
    actionType: "confirm_dispatch"
  },
  {
    id: "notif-2",
    title: "Alerta Predictiva de Stock: Marley One Love",
    message: "Tu stock físico (3.5kg) está por agotarse en 1.9 días. Sugerimos recompra antes del fin de semana.",
    timestamp: "Hace 1 hora",
    isRead: false,
    type: "stock_alert",
    actionRequired: true,
    actionType: "reorder"
  },
  {
    id: "notif-3",
    title: "Factura Fiscal Generada (FACT-MARLEY-2026-4491)",
    message: "La factura electrónica CFDI 4.0 con complementos B2B está lista para descarga en PDF y XML.",
    timestamp: "Ayer 17:30",
    isRead: true,
    type: "invoice_ready",
    actionRequired: false,
    actionType: "view_invoice"
  },
  {
    id: "notif-4",
    title: "Acumulaste 90 Puntos Club One Love",
    message: "Tu cuenta ha alcanzado el nivel 'Embajador One Love' con beneficios exclusivos de flete gratuito.",
    timestamp: "Hace 2 días",
    isRead: true,
    type: "loyalty_update",
    actionRequired: false,
    actionType: "view_rewards"
  }
];

export const mockAnalyticsData = {
  monthlySpendHistory: [
    { month: "Mar", totalSpend: 2450, grainKg: 65, invoiceCount: 3 },
    { month: "Abr", totalSpend: 2890, grainKg: 78, invoiceCount: 4 },
    { month: "May", totalSpend: 3120, grainKg: 85, invoiceCount: 4 },
    { month: "Jun", totalSpend: 3450, grainKg: 92, invoiceCount: 5 },
    { month: "Jul", totalSpend: 3820, grainKg: 105, invoiceCount: 5 },
    { month: "Ago", totalSpend: 4250, grainKg: 118, invoiceCount: 6 }
  ],
  categorySpendDistribution: [
    { category: "Granos Orgánicos Marley", percentage: 58, amount: 2465 },
    { category: "Leches Vegetales Barista", percentage: 22, amount: 935 },
    { category: "Empaques Bio Compostables", percentage: 12, amount: 510 },
    { category: "Jarabes & Químicos Clean", percentage: 8, amount: 340 }
  ],
  pricePerKgEvolution: [
    { month: "Mar", pricePerKg: 19.80, wholesaleDiscountAvg: 8 },
    { month: "Abr", pricePerKg: 19.20, wholesaleDiscountAvg: 10 },
    { month: "May", pricePerKg: 18.90, wholesaleDiscountAvg: 12 },
    { month: "Jun", pricePerKg: 18.50, wholesaleDiscountAvg: 14 },
    { month: "Jul", pricePerKg: 18.10, wholesaleDiscountAvg: 16 },
    { month: "Ago", pricePerKg: 17.80, wholesaleDiscountAvg: 18 }
  ]
};
