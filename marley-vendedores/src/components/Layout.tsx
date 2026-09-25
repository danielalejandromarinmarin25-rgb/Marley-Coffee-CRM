import {
  Home,
  Users,
  CalendarDays,
  ShoppingBag,
  Bell,
  TrendingUp,
  LifeBuoy,
  ChartNoAxesCombined,
  Settings,
  LogOut,
  Ellipsis,
  RefreshCw,
  WifiOff,
  ChevronRight,
} from "lucide-react";
import { useStore } from "../store/AppStore";
const nav = [
  ["/", "Inicio", Home],
  ["/clientes", "Clientes", Users],
  ["/agenda", "Agenda", CalendarDays],
  ["/pedidos", "Pedidos", ShoppingBag],
  ["/alertas", "Alertas", Bell],
  ["/oportunidades", "Oportunidades", TrendingUp],
  ["/casos", "Casos", LifeBuoy],
  ["/gestion", "Mi gestión", ChartNoAxesCombined],
  ["/notificaciones", "Notificaciones", Bell],
] as const;
export function Brand() {
  return (
    <div className="brand">
      <img className="brand-logo" src="./marley-coffee-logo.webp" alt="Marley Coffee · logo original con león" width="100" height="100" />
      <small>VENDEDORES</small>
    </div>
  );
}
export function Sidebar({
  path,
  onLogout,
}: {
  path: string;
  onLogout: () => void;
}) {
  const { user, data } = useStore();
  return (
    <aside className="sidebar">
      <Brand />
      <div className="nav-caption">ESPACIO COMERCIAL</div>
      <nav>
        {nav.map(([route, label, Icon]) => (
          <a
            key={route}
            href={`#${route}`}
            className={
              (route === "/" ? path === "/" : path.startsWith(route))
                ? "active"
                : ""
            }
          >
            <Icon size={19} />
            {label}
            {route === "/alertas" && (
              <span className="nav-count">
                {data.alerts.filter((a) => a.status === "OPEN").length}
              </span>
            )}
          </a>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <a href="#/configuracion">
          <Settings size={18} /> Configuración
        </a>
        <button onClick={onLogout}>
          <LogOut size={18} /> Cerrar sesión
        </button>
        <a href="#/perfil" className="profile">
          <span className="avatar">
            {user.name
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </span>
          <span>
            <b>{user.name}</b>
            <small>
              {user.role === "SELLER"
                ? "Ejecutiva comercial"
                : user.role === "KAM"
                  ? "Key Account Manager"
                  : "Ejecutiva comercial"}
            </small>
          </span>
        </a>
      </div>
    </aside>
  );
}
export function BottomNavigation({ path }: { path: string }) {
  return (
    <nav className="bottom-nav">
      {[...nav.slice(0, 4), ["/mas", "Más", Ellipsis] as const].map(
        ([route, label, Icon]) => (
          <a
            key={route}
            href={`#${route}`}
            className={
              (route === "/" ? path === "/" : path.startsWith(route))
                ? "active"
                : ""
            }
          >
            <Icon size={21} />
            <span>{label}</span>
          </a>
        ),
      )}
    </nav>
  );
}
export function SyncStatus() {
  const { data, syncing, online, persistenceError } = useStore();
  const pending = data.queue.filter((q) => q.status !== "SYNCED").length;
  const review = data.queue.some(
    (q) => q.status === "NEEDS_REVIEW" || q.status === "FAILED",
  );
  return (
    <a
      className={`sync-status ${review || persistenceError ? "warning-text" : ""}`}
      href="#/configuracion"
    >
      {online ? <span className="live-dot" /> : <WifiOff size={15} />}{" "}
      {persistenceError
        ? "Error al guardar"
        : !online
          ? "Sin conexión"
          : syncing
            ? "Sincronizando"
            : review
              ? "Requiere atención"
              : pending
                ? `${pending} cambios pendientes`
                : "Todo actualizado"}
    </a>
  );
}
export function AppHeader({ path }: { path: string }) {
  const { data, user } = useStore();
  return (
    <header className="app-header">
      <img className="mobile-brand-logo" src="./marley-coffee-logo.webp" alt="Marley Coffee" width="44" height="44" />
      <div className="breadcrumb">
        Marley Vendedores <ChevronRight size={14} />
        <b>
          {nav.find(([r]) => r !== "/" && path.startsWith(r))?.[1] ??
            "Mi espacio"}
        </b>
      </div>
      <div className="header-actions">
        <span className="demo-label">DEMO</span>
        <SyncStatus />
        <a
          href="#/notificaciones"
          className="icon-button notification-bell"
          aria-label="Notificaciones"
        >
          <Bell size={20} />
          {data.notifications.some((n) => !n.read) && <i />}
        </a>
        <a href="#/perfil" className="avatar small-avatar">
          {user.name.split(" ").map(n => n[0]).join("")}
        </a>
      </div>
    </header>
  );
}
export function OfflineBanner() {
  const { online, data, sync, persistenceError } = useStore();
  if (online && !persistenceError) return null;
  return (
    <div className="offline-banner" role="status">
      <WifiOff size={18} />
      <span>
        {persistenceError
          ? "No se pudo guardar. Revisa el almacenamiento del dispositivo."
          : "Sin conexión. Puedes seguir trabajando; guardaremos tus cambios en este dispositivo."}
      </span>
      {data.queue.length > 0 && (
        <button onClick={() => void sync()}>
          <RefreshCw size={15} /> Reintentar
        </button>
      )}
    </div>
  );
}
export function More() {
  return (
    <div className="card more-menu">
      {nav.slice(4).map(([r, label, Icon]) => (
        <a href={`#${r}`} key={r}>
          <Icon size={20} />
          {label}
          <ChevronRight size={18} />
        </a>
      ))}
      <a href="#/configuracion">
        <Settings size={20} />
        Configuración
      </a>
      <a href="#/perfil">
        <Users size={20} />
        Perfil y sesión
      </a>
    </div>
  );
}
