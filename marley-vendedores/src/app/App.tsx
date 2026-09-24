import { useEffect, useState } from "react";
import { Leaf, ArrowRight } from "lucide-react";
import { users } from "../mocks/data";
import { AuthService } from "../services";
import { Provider, useStore } from "../store/AppStore";
import {
  Sidebar,
  BottomNavigation,
  AppHeader,
  OfflineBanner,
  More,
  Brand,
} from "../components/Layout";
import {
  ConfirmDialog,
  PrimaryButton,
  SecondaryButton,
  Toast,
  PageHeading,
  EmptyState,
} from "../components/ui";
import { Dashboard } from "../features/dashboard/Dashboard";
import { Customers, Customer360 } from "../features/customers/Customers";
import { Agenda, VisitDetail } from "../features/visits/Visits";
import { Orders, OrderWizard, OrderDetail } from "../features/orders/Orders";
import { Alerts } from "../features/alerts/Alerts";
import {
  Management,
  Notifications,
  Performance,
} from "../features/management/Management";
import { Settings } from "../features/management/Settings";
function useRoute() {
  const [route, setRoute] = useState(location.hash.slice(1) || "/");
  useEffect(() => {
    const change = () => {
      setRoute(location.hash.slice(1) || "/");
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", change);
    return () => window.removeEventListener("hashchange", change);
  }, []);
  return route;
}
function Workspace({ logout }: { logout: () => void }) {
  const { user, data, toast, expired, setExpired, sync, online } = useStore();
  const route = useRoute();
  const path = route.split("?")[0];
  const parts = path.split("/").filter(Boolean);
  const [signout, setSignout] = useState(false);
  const pending = data.queue.some((q) => q.status !== "SYNCED") || !!data.draft || Object.keys(data.orderDrafts ?? {}).length > 0 || Object.keys(data.formDrafts ?? {}).length > 0;
  let content;
  switch (parts[0]) {
    case undefined:
      content = <Dashboard />;
      break;
    case "clientes":
      content = parts[1] ? (
        <Customer360 key={parts[1]} id={parts[1]} />
      ) : (
        <Customers />
      );
      break;
    case "agenda":
      content = parts[1] ? (
        <VisitDetail key={parts[1]} id={parts[1]} />
      ) : (
        <Agenda />
      );
      break;
    case "pedidos":
      content =
        parts[1] === "nuevo" ? (
          <OrderWizard
            key={route}
            customerId={
              new URLSearchParams(route.split("?")[1]).get("cliente") ??
              undefined
            }
          />
        ) : parts[1] === "revisar" ? (
          <OrderWizard key={route} reviewId={parts[2]} />
        ) : parts[1] ? (
          <OrderDetail id={parts[1]} />
        ) : (
          <Orders />
        );
      break;
    case "alertas":
      content = <Alerts key={parts[1]} id={parts[1]} />;
      break;
    case "oportunidades":
      content = <Management key={route} kind="opportunities" id={parts[1]} />;
      break;
    case "casos":
      content = <Management key={route} kind="cases" id={parts[1]} />;
      break;
    case "gestion":
      content = <Performance />;
      break;
    case "notificaciones":
      content = <Notifications />;
      break;
    case "configuracion":
      content = <Settings />;
      break;
    case "mas":
      content = (
        <>
          <PageHeading title="Más para tu gestión" />
          <More />
        </>
      );
      break;
    case "perfil":
      content = (
        <>
          <PageHeading title={user.name} description={user.territory} />
          <section className="card">
            <h2>Mi perfil</h2>
            <p>{user.role}</p>
            <p>{user.assignedCustomers.length} clientes asignados</p>
            <PrimaryButton onClick={() => setSignout(true)}>
              Cerrar sesión
            </PrimaryButton>
          </section>
        </>
      );
      break;
    default:
      content = (
        <EmptyState title="Esta página no está disponible">
          <a href="#/">Volver al inicio</a>
        </EmptyState>
      );
  }
  return (
    <>
      <a className="skip-link" href="#main-content" onClick={e => {e.preventDefault(); document.getElementById('main-content')?.focus();}}>
        Saltar al contenido
      </a>
      <Sidebar path={path} onLogout={() => setSignout(true)} />
      <div className="workspace">
        <AppHeader path={path} />
        <OfflineBanner />
        <main id="main-content" className="content" tabIndex={-1}>
          {content}
          <footer>
            <span>
              MARLEY COFFEE <span className="gold">/</span> Cultivamos
              relaciones.
            </span>
            <span>Prototipo académico · datos y precios ficticios</span>
          </footer>
        </main>
      </div>
      <BottomNavigation path={path} />
      <Toast message={toast} />
      {expired && (
        <ConfirmDialog title="Tu sesión necesita renovarse" onClose={() => {}}>
          <p>
            Tus datos siguen guardados en este dispositivo. Al renovar la sesión
            continuarás donde estabas.
          </p>
          <PrimaryButton
            onClick={() => {
              AuthService.login(user.id);
              setExpired(false);
            }}
          >
            Volver a iniciar sesión · demo
          </PrimaryButton>
        </ConfirmDialog>
      )}
      {signout && (
        <ConfirmDialog
          title={pending ? "Hay cambios pendientes" : "¿Cerrar sesión?"}
          onClose={() => setSignout(false)}
        >
          <p>
            {pending
              ? "Los datos se conservarán asociados a tu usuario en este dispositivo."
              : "Podrás retomar tu gestión cuando vuelvas."}
          </p>
          <div className="stack">
            {pending && (
              <PrimaryButton
                disabled={!online}
                onClick={async () => {
                  await sync();
                  setSignout(false);
                }}
              >
                Sincronizar primero
              </PrimaryButton>
            )}
            <SecondaryButton onClick={logout}>
              {pending ? "Cerrar sesión igualmente" : "Cerrar sesión"}
            </SecondaryButton>
            <SecondaryButton onClick={() => setSignout(false)}>
              Cancelar
            </SecondaryButton>
          </div>
        </ConfirmDialog>
      )}
    </>
  );
}
export default function App() {
  const [userId, setUserId] = useState(AuthService.current());
  const [choice, setChoice] = useState(users[0].id);
  const user = users.find((u) => u.id === userId);
  if (!user)
    return (
      <main className="login">
        <section className="login-story">
          <Brand />
          <div>
            <span className="eyebrow">ONE LOVE. ONE TEAM.</span>
            <h1>
              Más cerca.
              <br />
              Cada día.
            </h1>
            <p>
              Buenas conversaciones.
              <br />
              Relaciones que crecen.
              <br />
              Un café que nos conecta.
            </p>
          </div>
          <small>MARLEY COFFEE · EQUIPO COMERCIAL</small>
        </section>
        <section className="login-form">
          <Leaf size={38} />
          <h1>Tu día empieza aquí.</h1>
          <p>Bienvenido a Marley Vendedores.</p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              AuthService.login(choice);
              setUserId(choice);
            }}
          >
            <label>
              Perfil de demostración
              <select
                value={choice}
                onChange={(e) => setChoice(e.target.value)}
              >
                {users.map((u) => (
                  <option value={u.id} key={u.id}>
                    {u.name} ·{" "}
                    {u.role === "SELLER"
                      ? "Vendedora"
                      : u.role === "KAM"
                        ? "KAM"
                        : "Ejecutiva comercial"}
                  </option>
                ))}
              </select>
            </label>
            <PrimaryButton>
              Entrar a mi espacio <ArrowRight size={18} />
            </PrimaryButton>
          </form>
          <p className="login-note">
            Acceso mock · Sin credenciales reales.
            <br />
            Los datos de cada perfil se guardan por separado en este
            dispositivo.
          </p>
        </section>
      </main>
    );
  return (
    <Provider key={user.id} user={user}>
      <Workspace
        logout={() => {
          AuthService.logout();
          setUserId(null);
          location.hash = "/";
        }}
      />
    </Provider>
  );
}
