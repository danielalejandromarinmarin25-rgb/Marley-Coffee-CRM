import { EmptyState } from "../../components/ui";

export function SinPermiso() {
  return (
    <EmptyState
      title="No tienes permiso para ver esta página"
      description="Tu perfil no tiene acceso a esta sección. Si crees que es un error, habla con tu administrador."
    >
      <a className="button secondary" href="#/">
        Volver al inicio
      </a>
    </EmptyState>
  );
}

// Se usa también cuando un registro existe pero no está al alcance de la sesión:
// la app no distingue entre ambos casos, igual que el servidor.
export function NoEncontrado() {
  return (
    <EmptyState title="No encontramos esta página" description="Puede que el enlace esté incompleto o que ya no exista.">
      <a className="button secondary" href="#/">
        Volver al inicio
      </a>
    </EmptyState>
  );
}

export function ErrorCarga({ alReintentar }: { alReintentar: () => void }) {
  return (
    <EmptyState title="Algo falló al cargar" description="Revisa tu conexión e intenta de nuevo.">
      <button className="button secondary" onClick={alReintentar}>
        Reintentar
      </button>
    </EmptyState>
  );
}
