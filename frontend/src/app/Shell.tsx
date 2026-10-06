import { useState, type ReactNode } from "react";
import { ChevronRight, LogOut } from "lucide-react";
import { useAuth, useSesion } from "../auth/AuthProvider";
import { capaDe, nombrePerfil } from "../auth/perfiles";
import { ConfirmDialog, PrimaryButton, SecondaryButton } from "../components/ui";
import { navegacion } from "./rutas";
import { Campana } from "../features/notificaciones/Notificaciones";

const iniciales = (nombre: string) =>
  nombre.split(" ").filter(Boolean).slice(0, 2).map((n) => n[0]).join("").toUpperCase();

const activa = (destino: string, ruta: string) =>
  destino === "/" ? ruta === "/" : ruta === destino || ruta.startsWith(`${destino}/`);

const leyendaCapa = {
  gerencia: "GERENCIA",
  comercial: "ESPACIO COMERCIAL",
  cliente: "MI EMPRESA",
  partner: "PARTNER",
};

export function Shell({ ruta, children }: { ruta: string; children: ReactNode }) {
  const sesion = useSesion();
  const { cerrarSesion } = useAuth();
  const [confirmar, setConfirmar] = useState(false);
  const capa = capaDe[sesion.perfil];
  const nav = navegacion[capa];
  const actual = nav.find(([destino]) => destino !== "/" && activa(destino, ruta))?.[1];

  return (
    <>
      <a
        className="skip-link"
        href="#main-content"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById("main-content")?.focus();
        }}
      >
        Saltar al contenido
      </a>
      <aside className="sidebar">
        <div className="brand">
          <img className="brand-logo" src="./marley-coffee-logo.webp" alt="Marley Coffee" width="100" height="100" />
          <small>CONECTA</small>
        </div>
        <div className="nav-caption">{leyendaCapa[capa]}</div>
        <nav aria-label="Navegación principal">
          {nav.map(([destino, etiqueta, Icono]) => (
            <a key={destino} href={`#${destino}`} className={activa(destino, ruta) ? "active" : ""}>
              <Icono size={19} />
              {etiqueta}
            </a>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button onClick={() => setConfirmar(true)}>
            <LogOut size={18} /> Cerrar sesión
          </button>
          <a href="#/perfil" className="profile">
            <span className="avatar">{iniciales(sesion.nombre)}</span>
            <span>
              <b>{sesion.nombre}</b>
              <small>
                {nombrePerfil[sesion.perfil]}
                {capa === "cliente" || capa === "partner" ? ` · ${sesion.organizacionNombre}` : ""}
              </small>
            </span>
          </a>
        </div>
      </aside>
      <div className="workspace">
        <header className="app-header">
          <img className="mobile-brand-logo" src="./marley-coffee-logo.webp" alt="Marley Coffee" width="44" height="44" />
          <div className="breadcrumb">
            Marley Conecta <ChevronRight size={14} />
            <b>{actual ?? (ruta === "/" ? nav[0][1] : sesion.organizacionNombre)}</b>
          </div>
          <div className="header-actions">
            <Campana />
            <a href="#/perfil" className="avatar small-avatar" aria-label="Mi perfil">
              {iniciales(sesion.nombre)}
            </a>
          </div>
        </header>
        <main id="main-content" className="content" tabIndex={-1}>
          {children}
          <footer>
            <span>
              MARLEY COFFEE <span className="gold">/</span> Cultivamos relaciones.
            </span>
          </footer>
        </main>
      </div>
      <nav className="bottom-nav" aria-label="Navegación móvil">
        {nav.map(([destino, etiqueta, Icono]) => (
          <a key={destino} href={`#${destino}`} className={activa(destino, ruta) ? "active" : ""}>
            <Icono size={21} />
            <span>{etiqueta}</span>
          </a>
        ))}
      </nav>
      {confirmar && (
        <ConfirmDialog title="¿Cerrar sesión?" onClose={() => setConfirmar(false)}>
          <p>Para volver a entrar necesitarás tu correo y contraseña.</p>
          <div className="stack">
            <PrimaryButton
              onClick={() => {
                setConfirmar(false);
                location.hash = "/";
                void cerrarSesion();
              }}
            >
              Cerrar sesión
            </PrimaryButton>
            <SecondaryButton onClick={() => setConfirmar(false)}>Cancelar</SecondaryButton>
          </div>
        </ConfirmDialog>
      )}
    </>
  );
}
