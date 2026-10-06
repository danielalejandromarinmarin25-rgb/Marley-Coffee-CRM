// Stock por punto (cliente) y Agotamientos proyectados (vendedor y KAM).
// Cada cifra lleva la fuente del dato y su fecha: telemetría o declarado por el cliente.
import { useMemo } from "react";
import { MapPin } from "lucide-react";
import { useSesion } from "../../auth/AuthProvider";
import { nombreCanal } from "../../auth/perfiles";
import { EmptyState, PageHeading, StatusChip } from "../../components/ui";
import { Cargando, ChipAlerta, FuenteDato, Truncado } from "../../components/reposicion-ui";
import { useConsulta } from "../../lib/datos";
import { bolsas, fechaDia, textoCobertura, textoDias } from "../../lib/formato-reposicion";
import { ESTADOS_VIVOS, SELECT_SALDO, type AlertaVista, type SaldoVista } from "../../lib/reposicion";
import { supabase } from "../../lib/supabase";
import { ErrorCarga } from "../errores/Errores";

type AlertaMin = Pick<AlertaVista, "id" | "point_id" | "estado" | "severidad"> & { producto_id: string };

function useSaldosYAlertas() {
  const saldos = useConsulta<SaldoVista[]>(
    () => supabase.from("saldos").select(SELECT_SALDO).eq("points.activo", true).order("cobertura_dias", { ascending: true, nullsFirst: false }) as never,
  );
  const alertas = useConsulta<AlertaMin[]>(
    () => supabase.from("alertas").select("id, point_id, producto_id, estado, severidad").in("estado", [...ESTADOS_VIVOS, "confirmada"]) as never,
  );
  const alertaDe = (s: SaldoVista) => alertas.datos?.find((a) => a.point_id === s.point_id && a.producto_id === s.producto_id);
  return { saldos, alertas, alertaDe };
}

function Semaforo({ saldo, alerta }: { saldo: SaldoVista; alerta?: AlertaMin }) {
  if (alerta) return <ChipAlerta estado={alerta.estado} severidad={alerta.severidad} />;
  if (saldo.cobertura_dias === null) return <StatusChip tone="success">Sin riesgo</StatusChip>;
  return <StatusChip tone="success">Al día</StatusChip>;
}

export function Stock() {
  const sesion = useSesion();
  const { saldos, alertas, alertaDe } = useSaldosYAlertas();
  const puntos = useMemo(() => {
    const mapa = new Map<string, SaldoVista[]>();
    for (const s of saldos.datos ?? []) mapa.set(s.point_id, [...(mapa.get(s.point_id) ?? []), s]);
    return [...mapa.values()].sort((a, b) => a[0].points.nombre.localeCompare(b[0].points.nombre));
  }, [saldos.datos]);

  if (saldos.error || alertas.error) return <ErrorCarga alReintentar={() => void saldos.recargar()} />;
  return (
    <>
      <PageHeading
        eyebrow={sesion.organizacionNombre.toUpperCase()}
        title="Stock por punto"
        description="Cuánto café te queda, cuántos días alcanza y cuándo se agotaría."
      />
      {saldos.cargando && !saldos.datos ? (
        <Cargando />
      ) : puntos.length === 0 ? (
        <EmptyState title="Aún no hay datos de stock" description="Aparecerán con la primera lectura de telemetría o tu primer pedido." />
      ) : (
        <div className="grilla-puntos">
          {puntos.map((filas) => {
            const p = filas[0].points;
            return (
              <section key={p.id} className="card punto-stock" aria-label={p.nombre}>
                <header>
                  <Truncado texto={p.nombre} como="h2" />
                  {p.direccion && (
                    <small className="direccion">
                      <MapPin size={13} aria-hidden="true" /> {p.direccion}
                    </small>
                  )}
                  <FuenteDato fuente={filas[0].fuente} datoAt={filas[0].dato_at} />
                </header>
                <ul className="lista-filas">
                  {filas.map((s) => (
                    <li key={s.producto_id} className="fila-cafe">
                      <div className="grow">
                        <b>{s.productos.nombre}</b>
                        <small>
                          Quedan {bolsas(Math.round(s.saldo_kg / s.productos.kg_por_bolsa * 10) / 10)} · {textoCobertura(s.cobertura_dias)}
                        </small>
                        <small>Próximo agotamiento: {fechaDia(s.agotamiento_estimado)}</small>
                      </div>
                      <Semaforo saldo={s} alerta={alertaDe(s)} />
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </>
  );
}

export function Agotamientos() {
  const { saldos, alertas, alertaDe } = useSaldosYAlertas();
  if (saldos.error || alertas.error) return <ErrorCarga alReintentar={() => void saldos.recargar()} />;
  const lista = saldos.datos ?? [];
  return (
    <>
      <PageHeading
        eyebrow="MI CARTERA"
        title="Agotamientos proyectados"
        description="Todos los cafés de tus clientes, de lo más urgente a lo más holgado, con la fuente y la fecha de cada dato."
      />
      {saldos.cargando && !saldos.datos ? (
        <Cargando />
      ) : lista.length === 0 ? (
        <EmptyState title="Sin datos de stock en tu cartera" />
      ) : (
        <div className="tabla-o-tarjetas">
          <table>
            <thead>
              <tr>
                <th scope="col">Cliente y punto</th>
                <th scope="col">Café</th>
                <th scope="col">Cobertura</th>
                <th scope="col">Agotamiento</th>
                <th scope="col">Fuente y fecha</th>
                <th scope="col">Estado</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((s) => (
                <tr key={`${s.point_id}-${s.producto_id}`}>
                  <td data-etiqueta="Cliente" className="celda-principal">
                    <Truncado texto={s.organizations.nombre_comercial} como="b" />
                    <Truncado texto={`${s.points.nombre} · ${nombreCanal[s.points.canal]}`} />
                  </td>
                  <td data-etiqueta="Café">{s.productos.nombre}</td>
                  <td data-etiqueta="Cobertura">
                    <b>{textoDias(s.cobertura_dias)}</b>
                  </td>
                  <td data-etiqueta="Agotamiento">{fechaDia(s.agotamiento_estimado)}</td>
                  <td data-etiqueta="Fuente">
                    <FuenteDato fuente={s.fuente} datoAt={s.dato_at} />
                  </td>
                  <td data-etiqueta="Estado" className="celda-estado">
                    <Semaforo saldo={s} alerta={alertaDe(s)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
