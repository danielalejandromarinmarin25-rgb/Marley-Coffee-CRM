import type { AppData, User, Customer } from "../types";
import { day } from "../utils/domain";
export const users: User[] = [
  {
    id: "seller-camila",
    name: "Camila Valdés",
    role: "SELLER",
    territory: "Santiago · Zona centro",
    assignedCustomers: ["c1", "c2", "c3", "c4", "c5"],
    permissions: ["portfolio:read", "sales:write"],
  },
  {
    id: "kam-diego",
    name: "Diego Rojas",
    role: "KAM",
    territory: "Cuentas estratégicas",
    assignedCustomers: ["c1", "c5"],
    permissions: ["portfolio:read", "sales:write"],
  },
  {
    id: "exec-sofia",
    name: "Sofía Torres",
    role: "COMMERCIAL_EXECUTIVE",
    territory: "Santiago · Comercio",
    assignedCustomers: ["c2", "c3", "c4"],
    permissions: ["portfolio:read", "sales:write"],
  },
];
const names = [
  "Hotel Santiago",
  "Café Central",
  "Panadería Roma",
  "Estación Central",
  "Empresa Oficina Norte",
];
const channels: Customer["channel"][] = [
  "Horeca",
  "Horeca",
  "Panaderías",
  "Conveniencia",
  "OCS",
];
export function seed(user: User): AppData {
  const customers: Customer[] = names
    .map((name, i) => ({
      id: `c${i + 1}`,
      name,
      channel: channels[i],
      contact: {
        name: [
          "Valentina Soto",
          "Andrés Muñoz",
          "Lucía Pérez",
          "Pablo Díaz",
          "Francisca Lagos",
        ][i],
        phone: "+56000000000",
        email: `contacto${i + 1}@example.com`,
      },
      address: [
        "Av. Providencia 1200, Santiago",
        "Monjitas 650, Santiago",
        "Av. Italia 1420, Ñuñoa",
        "Alameda 3200, Santiago",
        "Av. Apoquindo 4500, Las Condes",
      ][i],
      lastPurchase: day(-[16, 31, 12, 9, 14][i]),
      replenishment: day([0, -13, 2, 4, 0][i]),
      frequency: [16, 18, 14, 13, 14][i],
      monthlySales: [1840000, 620000, 890000, 740000, 1320000][i],
      risk:
        i === 1
          ? "Compra cada 18 días; han pasado 31 días. Ventas −38%."
          : undefined,
      products: i === 0 ? ["p3", "p1"] : ["p1", "p2"],
      note: [
        "Revisar consumo del desayuno y nueva sala de eventos.",
        "El administrador solicitó revisar condiciones de entrega.",
        "Interés en estandarizar la preparación de café.",
        "Revisar exhibición junto a caja.",
        "Coordinar mantenimiento fuera del horario de oficina.",
      ][i],
      indicators: [
        {
          label: [
            "Consumo de café",
            "Mix activo",
            "Consumo semanal",
            "Rotación semanal",
            "Máquinas activas",
          ][i],
          value: [
            "24 kg / mes",
            "2 variedades",
            "12 kg",
            "18 unidades",
            "3 equipos",
          ][i],
        },
        {
          label: [
            "Máquinas",
            "Visitas este mes",
            "Estandarización",
            "Visibilidad PDV",
            "SLA de atención",
          ][i],
          value: [
            "2 operativas",
            "2 realizadas",
            "En revisión",
            "Pendiente",
            "24 horas",
          ][i],
        },
      ],
    }))
    .filter((c) => user.assignedCustomers.includes(c.id));
  const ids = new Set(customers.map((c) => c.id));
  const base = { syncStatus: "SYNCED" as const };
  return {
    customers,
    products: [
      {
        id: "p1",
        name: "One Love",
        unit: "Café en grano · 1 kg",
        price: 21990,
        stock: 48,
        usual: 6,
        color: "#397458",
      },
      {
        id: "p2",
        name: "Lively Up!",
        unit: "Café en grano · 1 kg",
        price: 22990,
        stock: 8,
        usual: 4,
        color: "#B84B42",
      },
      {
        id: "p3",
        name: "Jamaica Blue Mountain Blend",
        unit: "Café en grano · 1 kg",
        price: 29990,
        stock: 10,
        usual: 12,
        color: "#426D87",
      },
    ],
    orders: customers.map((c, i) => ({
      ...base,
      id: `MC-${1042 + i}`,
      serverId: `MC-${1042 + i}`,
      customerId: c.id,
      items: [{ productId: "p1", quantity: 6, unitPrice: 21990 }],
      createdAt: c.lastPurchase,
      address: c.address,
      total: 157009,
      status: i === 0 ? "En preparación" : "Entregado",
    })),
    visits: customers
      .slice(0, 3)
      .map((c, i) => ({
        ...base,
        id: `v${i}`,
        customerId: c.id,
        date: day(),
        time: ["09:30", "11:00", "15:30"][i],
        status: "Programada" as const,
        notes: "",
      })),
    alerts: [
      {
        ...base,
        id: "a1",
        customerId: "c1",
        type: "REPLENISHMENT" as const,
        title: "Es momento de reponer",
        description: "Compra habitual: 12 unidades. Frecuencia de 16 días.",
        category: "Reposición" as const,
        status: "OPEN" as const,
        createdAt: new Date(Date.now() - 4 * 3600000).toISOString(),
        deadline: new Date(Date.now() + 20 * 3600000).toISOString(),
        productId: "p3",
        quantity: 12,
      },
      {
        ...base,
        id: "a2",
        customerId: "c2",
        type: "CUSTOMER_RISK" as const,
        title: "Una relación que necesita atención",
        description: "31 días sin comprar · ventas −38%.",
        category: "Atención" as const,
        status: "OPEN" as const,
        createdAt: new Date().toISOString(),
        deadline: new Date().toISOString(),
      },
      {
        ...base,
        id: "a3",
        customerId: "c5",
        type: "REPLENISHMENT" as const,
        title: "Reposición de oficina",
        description:
          "Recordatorio enviado automáticamente por el CRM. Ejemplo de respuesta del backend.",
        category: "Reposición" as const,
        status: "SENT_BY_CRM_AUTOMATION" as const,
        createdAt: new Date(Date.now() - 26 * 3600000).toISOString(),
        deadline: new Date(Date.now() - 2 * 3600000).toISOString(),
        productId: "p1",
        quantity: 6,
      },
    ].filter((a) => ids.has(a.customerId)),
    opportunities: customers
      .slice(0, 2)
      .map((c, i) => ({
        ...base,
        id: `op${i}`,
        customerId: c.id,
        name: i ? "Ampliar mix de café" : "Café para sala de eventos",
        product: "One Love",
        value: i ? 280000 : 650000,
        stage: "En seguimiento" as const,
        expectedDate: day(14),
        comments: "Validar volumen con el contacto principal.",
      })),
    cases: ids.has("c5")
      ? [
          {
            ...base,
            id: "cas1",
            customerId: "c5",
            type: "Máquina",
            priority: "Alta",
            description: "Equipo de recepción pierde presión.",
            responsible: "Servicio técnico",
            status: "En proceso",
            comments: "Coordinación de visita técnica pendiente.",
          },
        ]
      : [],
    tasks: customers
      .slice(0, 2)
      .map((c, i) => ({
        ...base,
        id: `t${i}`,
        customerId: c.id,
        title: i
          ? "Confirmar recepción de propuesta"
          : "Validar horario de entrega",
        due: day(),
        done: false,
      })),
    activities: customers.map((c) => ({
      id: `act-${c.id}`,
      customerId: c.id,
      type: "Pedido",
      comment: "Pedido habitual registrado y entregado.",
      createdAt: c.lastPurchase,
    })),
    notifications: customers
      .slice(0, 2)
      .map((c, i) => ({
        id: `n${i}`,
        title: i
          ? `${c.name} necesita seguimiento`
          : `Visita a ${c.name} programada para hoy`,
        type: i ? "Cliente en riesgo" : "Recordatorio de visita",
        route: i ? `/clientes/${c.id}` : "/agenda/v0",
        read: false,
        createdAt: new Date().toISOString(),
      })),
    queue: [],
    metrics: {
      sales: customers.reduce((s, c) => s + c.monthlySales, 0),
      goal: customers.length * 1450000,
      orders: customers.length * 4,
      activeCustomers: customers.length,
      recoveredCustomers: 1,
    },
  };
}
