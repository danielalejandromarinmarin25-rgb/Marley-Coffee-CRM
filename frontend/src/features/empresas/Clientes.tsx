import { useState } from "react";
import { useAuth, useSesion } from "../../auth/AuthProvider";
import { mensajeDeError, nombreCanal } from "../../auth/perfiles";
import { EmptyState, PageHeading, PrimaryButton, StatusChip } from "../../components/ui";
import { aErrorApp, useConsulta } from "../../lib/datos";
import type { EmpresaCrm } from "../../lib/modelo";
import { supabase } from "../../lib/supabase";
import { ir } from "../../app/rutas";
import { ErrorCarga } from "../errores/Errores";
import { Mensaje } from "../equipo/Personas";

// Gerencia ve todas las empresas del CRM; vendedor y KAM, solo su cartera (lo filtra RLS).
// Desde aquí se activa en la app una empresa que ya existe en el CRM (paso 2).
export function Clientes() {
  const sesion = useSesion();
  const { puede, sesionInvalida } = useAuth();
  const [error, setError] = useState("");
  const [activando, setActivando] = useState("");
  const empresas = useConsulta<EmpresaCrm[]>(() =>
    supabase
      .from("crm_empresas")
      .select("rut, razon_social, asignado_a, canal, segmento, estado, organizations(id, nombre_comercial)")
      .order("razon_social"),
  );

  async function activar(rut: string) {
    setActivando(rut);
    setError("");
    const { data, error } = await supabase.rpc("activar_empresa", { p_rut: rut });
    setActivando("");
    const e = aErrorApp(error);
    if (e?.sesionVencida) return sesionInvalida();
    if (e) return setError(mensajeDeError(e.codigo));
    ir(`/clientes/${data}?activada=1`);
  }

  if (empresas.error) return <ErrorCarga alReintentar={() => void empresas.recargar()} />;
  const lista = empresas.datos ?? [];
  const gerencia = sesion.perfil === "gerencia";

  return (
    <>
      <PageHeading
        eyebrow={gerencia ? "GERENCIA" : "TU CARTERA"}
        title={gerencia ? "Clientes" : "Mis clientes"}
        description={
          gerencia
            ? "Todas las empresas cliente, en modo supervisión."
            : "Empresas que el CRM te asigna. Activa en la app las que aún no lo están e invita a su administrador."
        }
      />
      <Mensaje texto={error} tono="danger" />
      {empresas.cargando ? (
        <p className="muted">Cargando…</p>
      ) : lista.length === 0 ? (
        <EmptyState title="No hay empresas asignadas" description="Cuando el CRM te asigne clientes, aparecerán aquí." />
      ) : (
        <section className="card">
          <ul className="lista-filas">
            {lista.map((c) => (
              <li key={c.rut} className="fila">
                <div>
                  {c.organizations ? (
                    <a href={`#/clientes/${c.organizations.id}`}>
                      <b>{c.organizations.nombre_comercial}</b>
                    </a>
                  ) : (
                    <b>{c.razon_social}</b>
                  )}
                  <small>
                    {c.razon_social} · RUT {c.rut} · {nombreCanal[c.canal]}
                    {c.segmento ? ` · ${c.segmento}` : ""}
                  </small>
                </div>
                <div className="fila-acciones">
                  {c.estado === "suspendida" && <StatusChip tone="danger">Suspendida en el CRM</StatusChip>}
                  {c.organizations ? (
                    <StatusChip tone="success">Activa en la app</StatusChip>
                  ) : c.estado === "activa" && puede("empresas.activar") ? (
                    <PrimaryButton disabled={activando === c.rut} onClick={() => void activar(c.rut)}>
                      {activando === c.rut ? "Activando…" : "Activar en la app"}
                    </PrimaryButton>
                  ) : (
                    <StatusChip tone="neutral">Sin activar</StatusChip>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
