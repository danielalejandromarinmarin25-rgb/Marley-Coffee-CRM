import { useState, type FormEvent } from "react";
import { Cpu, MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { useAuth } from "../../auth/AuthProvider";
import { mensajeDeError, nombreCanal } from "../../auth/perfiles";
import { PrimaryButton, SecondaryButton, StatusChip } from "../../components/ui";
import { aErrorApp, useConsulta } from "../../lib/datos";
import type { Canal, Maquina, Organizacion, Punto } from "../../lib/modelo";
import { supabase } from "../../lib/supabase";
import { ErrorCarga } from "../errores/Errores";
import { Mensaje } from "../equipo/Personas";

type Aviso = { texto: string; tono: "info" | "danger" };

// Interpreta el resultado de una escritura. 0 filas afectadas significa que la fila no está
// al alcance de la sesión (RLS): se informa como falta de permiso.
function useEscritura(alTerminar: () => void) {
  const { sesionInvalida } = useAuth();
  const [aviso, setAviso] = useState<Aviso>({ texto: "", tono: "info" });
  async function ejecutar(
    escritura: PromiseLike<{ data: unknown[] | null; error: Parameters<typeof aErrorApp>[0] }>,
    exito: string,
  ) {
    const { data, error } = await escritura;
    const e = aErrorApp(error);
    if (e?.sesionVencida) return sesionInvalida();
    if (e) setAviso({ texto: mensajeDeError(e.codigo), tono: "danger" });
    else if (!data?.length) setAviso({ texto: mensajeDeError("sin_permiso"), tono: "danger" });
    else setAviso({ texto: exito, tono: "info" });
    alTerminar();
  }
  return { aviso, ejecutar };
}

// Datos de la empresa: razón social y RUT vienen del CRM/ERP y no se editan desde la app.
export function DatosEmpresa({ org, editable, alGuardar }: { org: Organizacion; editable: boolean; alGuardar: () => void }) {
  const [editando, setEditando] = useState(false);
  const [valores, setValores] = useState({
    nombre_comercial: org.nombre_comercial,
    contacto_nombre: org.contacto_nombre ?? "",
    contacto_email: org.contacto_email ?? "",
    contacto_telefono: org.contacto_telefono ?? "",
  });
  const { aviso, ejecutar } = useEscritura(alGuardar);

  async function guardar(e: FormEvent) {
    e.preventDefault();
    await ejecutar(
      supabase
        .from("organizations")
        .update({
          nombre_comercial: valores.nombre_comercial.trim(),
          contacto_nombre: valores.contacto_nombre.trim() || null,
          contacto_email: valores.contacto_email.trim() || null,
          contacto_telefono: valores.contacto_telefono.trim() || null,
        })
        .eq("id", org.id)
        .select("id"),
      "Datos guardados.",
    );
    setEditando(false);
  }

  return (
    <section className="card">
      <div className="row">
        <h2>Datos de la empresa</h2>
        {editable && !editando && (
          <SecondaryButton onClick={() => setEditando(true)}>
            <Pencil size={15} /> Editar
          </SecondaryButton>
        )}
      </div>
      <Mensaje {...aviso} />
      {editando ? (
        <form onSubmit={guardar}>
          <label>
            Nombre comercial
            <input required maxLength={120} value={valores.nombre_comercial} onChange={(e) => setValores({ ...valores, nombre_comercial: e.target.value })} />
          </label>
          <label>
            Contacto principal
            <input maxLength={120} value={valores.contacto_nombre} onChange={(e) => setValores({ ...valores, contacto_nombre: e.target.value })} />
          </label>
          <label>
            Correo del contacto
            <input type="email" maxLength={254} value={valores.contacto_email} onChange={(e) => setValores({ ...valores, contacto_email: e.target.value })} />
          </label>
          <label>
            Teléfono del contacto
            <input type="tel" maxLength={30} value={valores.contacto_telefono} onChange={(e) => setValores({ ...valores, contacto_telefono: e.target.value })} />
          </label>
          <div className="fila-acciones">
            <PrimaryButton>Guardar</PrimaryButton>
            <SecondaryButton type="button" onClick={() => setEditando(false)}>
              Cancelar
            </SecondaryButton>
          </div>
        </form>
      ) : (
        <>
          <Dato etiqueta="Razón social" valor={org.razon_social} />
          <Dato etiqueta="RUT" valor={org.rut} />
          <Dato etiqueta="Nombre comercial" valor={org.nombre_comercial} />
          <Dato etiqueta="Contacto principal" valor={[org.contacto_nombre, org.contacto_email, org.contacto_telefono].filter(Boolean).join(" · ")} />
        </>
      )}
    </section>
  );
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string | null | undefined }) {
  return (
    <div className="detail-row">
      <small>{etiqueta}</small>
      <b>{valor || "—"}</b>
    </div>
  );
}

interface PermisosPuntos {
  editar: boolean; // dirección, horario y contacto de recepción
  gestionar: boolean; // agregar, canal, telemetría y baja
  maquinas: boolean; // agregar, editar y quitar máquinas (KAM y gerencia)
}

export function Puntos({ organizationId, permisos }: { organizationId: string; permisos: PermisosPuntos }) {
  const puntos = useConsulta<Punto[]>(
    () =>
      supabase
        .from("points")
        .select("id, organization_id, nombre, canal, telemetria_disponible, direccion, horario, contacto_recepcion, activo, machines(id, point_id, modelo, numero_serie)")
        .eq("organization_id", organizationId)
        .order("nombre"),
    [organizationId],
  );
  const { aviso, ejecutar } = useEscritura(() => void puntos.recargar());
  const [nuevo, setNuevo] = useState(false);

  if (puntos.error) return <ErrorCarga alReintentar={() => void puntos.recargar()} />;
  return (
    <section className="card">
      <div className="row">
        <h2>Puntos</h2>
        {permisos.gestionar && !nuevo && (
          <SecondaryButton onClick={() => setNuevo(true)}>
            <Plus size={15} /> Agregar punto
          </SecondaryButton>
        )}
      </div>
      <Mensaje {...aviso} />
      {nuevo && (
        <FormularioPunto
          gestionar
          alCancelar={() => setNuevo(false)}
          alGuardar={async (valores) => {
            await ejecutar(
              // En modo alta el formulario siempre incluye nombre y canal (gestionar = true).
              supabase.from("points").insert({ ...(valores as ValoresPunto), organization_id: organizationId }).select("id"),
              "Punto agregado.",
            );
            setNuevo(false);
          }}
        />
      )}
      {puntos.cargando ? (
        <p className="muted">Cargando…</p>
      ) : (puntos.datos ?? []).length === 0 ? (
        <p className="muted">Esta empresa aún no tiene puntos registrados.</p>
      ) : (
        <ul className="lista-puntos">
          {puntos.datos!.map((p) => (
            <TarjetaPunto key={p.id} punto={p} permisos={permisos} ejecutar={ejecutar} />
          ))}
        </ul>
      )}
    </section>
  );
}

type ValoresPunto = Pick<Punto, "nombre" | "canal" | "telemetria_disponible" | "direccion" | "horario" | "contacto_recepcion">;

function FormularioPunto({
  inicial,
  gestionar,
  alGuardar,
  alCancelar,
}: {
  inicial?: ValoresPunto;
  gestionar: boolean;
  alGuardar: (v: Partial<ValoresPunto>) => Promise<void>;
  alCancelar: () => void;
}) {
  const [v, setV] = useState<ValoresPunto>(
    inicial ?? { nombre: "", canal: "horeca", telemetria_disponible: false, direccion: "", horario: "", contacto_recepcion: "" },
  );
  return (
    <form
      className="formulario-punto"
      onSubmit={async (e) => {
        e.preventDefault();
        const comunes = {
          direccion: v.direccion?.trim() || null,
          horario: v.horario?.trim() || null,
          contacto_recepcion: v.contacto_recepcion?.trim() || null,
        };
        // Solo se envían las columnas que el perfil puede escribir.
        await alGuardar(gestionar ? { ...comunes, nombre: v.nombre.trim(), canal: v.canal, telemetria_disponible: v.telemetria_disponible } : comunes);
      }}
    >
      {gestionar && (
        <>
          <label>
            Nombre del punto
            <input required maxLength={120} value={v.nombre} onChange={(e) => setV({ ...v, nombre: e.target.value })} />
          </label>
          <label>
            Canal
            <select value={v.canal} onChange={(e) => setV({ ...v, canal: e.target.value as Canal })}>
              {Object.entries(nombreCanal).map(([valor, texto]) => (
                <option key={valor} value={valor}>
                  {texto}
                </option>
              ))}
            </select>
          </label>
          <label className="check">
            <input type="checkbox" checked={v.telemetria_disponible} onChange={(e) => setV({ ...v, telemetria_disponible: e.target.checked })} />
            Tiene telemetría disponible
          </label>
        </>
      )}
      <label>
        Dirección de entrega
        <input maxLength={200} value={v.direccion ?? ""} onChange={(e) => setV({ ...v, direccion: e.target.value })} />
      </label>
      <label>
        Horario de recepción
        <input maxLength={120} value={v.horario ?? ""} onChange={(e) => setV({ ...v, horario: e.target.value })} />
      </label>
      <label>
        Contacto de recepción
        <input maxLength={120} value={v.contacto_recepcion ?? ""} onChange={(e) => setV({ ...v, contacto_recepcion: e.target.value })} />
      </label>
      <div className="fila-acciones">
        <PrimaryButton>Guardar</PrimaryButton>
        <SecondaryButton type="button" onClick={alCancelar}>
          Cancelar
        </SecondaryButton>
      </div>
    </form>
  );
}

function TarjetaPunto({
  punto: p,
  permisos,
  ejecutar,
}: {
  punto: Punto;
  permisos: PermisosPuntos;
  ejecutar: ReturnType<typeof useEscritura>["ejecutar"];
}) {
  const [editando, setEditando] = useState(false);
  return (
    <li className={`punto ${p.activo ? "" : "inactivo"}`}>
      <div className="row">
        <div>
          <b>
            <MapPin size={15} /> {p.nombre}
          </b>
          <small>
            {nombreCanal[p.canal]} · {p.direccion || "Sin dirección"}
          </small>
        </div>
        <div className="fila-acciones">
          <StatusChip tone={p.telemetria_disponible ? "success" : "info"}>
            {p.telemetria_disponible ? "Con telemetría" : "Sin telemetría"}
          </StatusChip>
          {!p.activo && <StatusChip tone="danger">Dado de baja</StatusChip>}
          {permisos.editar && !editando && (
            <SecondaryButton onClick={() => setEditando(true)} aria-label={`Editar ${p.nombre}`}>
              <Pencil size={15} />
            </SecondaryButton>
          )}
        </div>
      </div>
      {editando ? (
        <FormularioPunto
          inicial={p}
          gestionar={permisos.gestionar}
          alCancelar={() => setEditando(false)}
          alGuardar={async (valores) => {
            await ejecutar(supabase.from("points").update(valores).eq("id", p.id).select("id"), "Punto actualizado.");
            setEditando(false);
          }}
        />
      ) : (
        <p className="muted">
          Horario: {p.horario || "—"} · Recepción: {p.contacto_recepcion || "—"}
        </p>
      )}
      {editando && permisos.gestionar && (
        <SecondaryButton
          onClick={() =>
            void ejecutar(
              supabase.from("points").update({ activo: !p.activo }).eq("id", p.id).select("id"),
              p.activo ? "Punto dado de baja." : "Punto reactivado.",
            ).then(() => setEditando(false))
          }
        >
          {p.activo ? "Dar de baja el punto" : "Reactivar el punto"}
        </SecondaryButton>
      )}
      <Maquinas punto={p} edita={permisos.maquinas} ejecutar={ejecutar} />
    </li>
  );
}

function Maquinas({
  punto,
  edita,
  ejecutar,
}: {
  punto: Punto;
  edita: boolean;
  ejecutar: ReturnType<typeof useEscritura>["ejecutar"];
}) {
  const [modelo, setModelo] = useState("");
  const [serie, setSerie] = useState("");
  const maquinas: Maquina[] = punto.machines ?? [];
  return (
    <div className="maquinas">
      <small className="eyebrow">MÁQUINAS</small>
      {maquinas.length === 0 && <p className="muted">Sin máquinas registradas.</p>}
      <ul>
        {maquinas.map((m) => (
          <li key={m.id}>
            <Cpu size={14} /> {m.modelo} <span className="muted">· {m.numero_serie}</span>
            {edita && (
              <button
                className="icon-button"
                aria-label={`Quitar ${m.numero_serie}`}
                onClick={() => void ejecutar(supabase.from("machines").delete().eq("id", m.id).select("id"), "Máquina quitada.")}
              >
                <Trash2 size={14} />
              </button>
            )}
          </li>
        ))}
      </ul>
      {edita && (
        <form
          className="campos"
          onSubmit={async (e) => {
            e.preventDefault();
            await ejecutar(
              supabase.from("machines").insert({ point_id: punto.id, modelo: modelo.trim(), numero_serie: serie.trim() }).select("id"),
              "Máquina agregada.",
            );
            setModelo("");
            setSerie("");
          }}
        >
          <label>
            Modelo
            <input required maxLength={120} value={modelo} onChange={(e) => setModelo(e.target.value)} />
          </label>
          <label>
            N° de serie
            <input required maxLength={60} value={serie} onChange={(e) => setSerie(e.target.value)} />
          </label>
          <SecondaryButton>
            <Plus size={15} /> Agregar máquina
          </SecondaryButton>
        </form>
      )}
    </div>
  );
}
