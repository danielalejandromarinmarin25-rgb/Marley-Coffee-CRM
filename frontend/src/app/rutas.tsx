import { useEffect, useState, type ReactNode } from "react";
import {
  Building2,
  ChartColumnBig,
  Coffee,
  ListTodo,
  MapPin,
  Package,
  ShieldAlert,
  TrendingDown,
  UserRound,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import type { Capa } from "../auth/perfiles";
import { Inicio } from "../features/inicio/Inicio";
import { Clientes } from "../features/empresas/Clientes";
import { FichaCliente } from "../features/empresas/FichaCliente";
import { MiEmpresa } from "../features/empresas/MiEmpresa";
import { MiEquipo } from "../features/equipo/MiEquipo";
import { EquipoComercial } from "../features/equipo/EquipoComercial";
import { MiPerfil } from "../features/perfil/MiPerfil";
import { NoEncontrado, SinPermiso } from "../features/errores/Errores";
import { DetalleReposicion, Reposicion } from "../features/reposicion/Reposicion";
import { DetallePedido, Pedidos } from "../features/pedidos/Pedidos";
import { Agotamientos, Stock } from "../features/stock/Stock";
import { Hoy } from "../features/comercial/Hoy";
import { Notificaciones } from "../features/notificaciones/Notificaciones";

interface Ruta {
  patron: string;
  capas: Capa[];
  pantalla: (p: Record<string, string>) => ReactNode;
}

// Cada ruta declara qué capas pueden abrirla. Abrir por enlace directo una ruta de otra capa
// muestra "sin permiso"; de todas formas los datos los filtra el servidor, no esta tabla.
const rutas: Ruta[] = [
  { patron: "/", capas: ["gerencia", "comercial", "cliente", "partner"], pantalla: () => <Inicio /> },
  { patron: "/clientes", capas: ["gerencia", "comercial"], pantalla: () => <Clientes /> },
  { patron: "/clientes/:id", capas: ["gerencia", "comercial"], pantalla: (p) => <FichaCliente key={p.id} id={p.id} /> },
  { patron: "/equipo-comercial", capas: ["gerencia"], pantalla: () => <EquipoComercial /> },
  { patron: "/empresa", capas: ["cliente"], pantalla: () => <MiEmpresa /> },
  { patron: "/equipo", capas: ["cliente"], pantalla: () => <MiEquipo /> },
  { patron: "/reposicion", capas: ["cliente"], pantalla: () => <Reposicion /> },
  { patron: "/reposicion/:id", capas: ["cliente"], pantalla: (p) => <DetalleReposicion key={p.id} id={p.id} /> },
  { patron: "/pedidos", capas: ["gerencia", "comercial", "cliente"], pantalla: () => <Pedidos /> },
  { patron: "/pedidos/:id", capas: ["gerencia", "comercial", "cliente"], pantalla: (p) => <DetallePedido key={p.id} id={p.id} /> },
  { patron: "/stock", capas: ["cliente"], pantalla: () => <Stock /> },
  { patron: "/hoy", capas: ["comercial"], pantalla: () => <Hoy /> },
  { patron: "/agotamientos", capas: ["comercial"], pantalla: () => <Agotamientos /> },
  { patron: "/avisos", capas: ["gerencia", "comercial", "cliente", "partner"], pantalla: () => <Notificaciones /> },
  { patron: "/perfil", capas: ["gerencia", "comercial", "cliente", "partner"], pantalla: () => <MiPerfil /> },
  { patron: "/sin-permiso", capas: ["gerencia", "comercial", "cliente", "partner"], pantalla: () => <SinPermiso /> },
];

// Secciones principales de cada perfil: barra lateral en tablet y escritorio, barra inferior en
// el celular (máximo cinco, al alcance del pulgar). La pantalla de entrada ("/") es la tarea del día:
// Reposición para el cliente, Hoy para el vendedor o KAM y Supervisión para gerencia.
export const navegacion: Record<Capa, [string, string, LucideIcon][]> = {
  gerencia: [
    ["/", "Supervisión", ShieldAlert],
    ["/pedidos", "Pedidos", Package],
    ["/clientes", "Clientes", Building2],
    ["/equipo-comercial", "Equipo", UsersRound],
    ["/perfil", "Perfil", UserRound],
  ],
  comercial: [
    ["/", "Hoy", ListTodo],
    ["/agotamientos", "Agotamientos", TrendingDown],
    ["/pedidos", "Pedidos", Package],
    ["/clientes", "Clientes", Building2],
    ["/perfil", "Perfil", UserRound],
  ],
  cliente: [
    ["/", "Reposición", Coffee],
    ["/pedidos", "Pedidos", Package],
    ["/stock", "Stock", ChartColumnBig],
    ["/empresa", "Empresa", MapPin],
    ["/perfil", "Perfil", UserRound],
  ],
  partner: [
    ["/", "Mis puntos", MapPin],
    ["/perfil", "Perfil", UserRound],
  ],
};

function coincide(patron: string, ruta: string): Record<string, string> | null {
  const a = patron.split("/").filter(Boolean);
  const b = ruta.split("/").filter(Boolean);
  if (a.length !== b.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < a.length; i++) {
    if (a[i].startsWith(":")) params[a[i].slice(1)] = decodeURIComponent(b[i]);
    else if (a[i] !== b[i]) return null;
  }
  return params;
}

export function resolver(ruta: string, capa: Capa): ReactNode {
  for (const r of rutas) {
    const params = coincide(r.patron, ruta);
    if (params) return r.capas.includes(capa) ? r.pantalla(params) : <SinPermiso />;
  }
  return <NoEncontrado />;
}

// Rutas en el fragmento (#/clientes): funciona en GitHub Pages sin configurar el servidor.
// Un fragmento que no empieza con "#/" (por ejemplo el que dejan los enlaces de Auth) es el inicio.
export function useRuta() {
  const leer = () => (location.hash.startsWith("#/") ? location.hash.slice(1).split("?")[0] : "/");
  const [ruta, setRuta] = useState(leer);
  useEffect(() => {
    const cambio = () => {
      setRuta(leer());
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", cambio);
    return () => window.removeEventListener("hashchange", cambio);
  }, []);
  return ruta;
}

export const ir = (ruta: string) => {
  location.hash = ruta;
};
