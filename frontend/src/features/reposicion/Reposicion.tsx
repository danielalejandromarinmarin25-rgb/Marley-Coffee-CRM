// Cliente · Reposición: el aviso y el pedido sugerido, listo para confirmar.
// Recorrido medido (tests/navegador): ver la alerta → "Revisar y confirmar" → "Confirmar pedido".
// Dos clics desde esta pantalla, tres desde la campana de avisos.
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, Clock3, PackageCheck, UserRoundPen } from "lucide-react";
import { useAuth, useSesion } from "../../auth/AuthProvider";
import { mensajeDeError } from "../../auth/perfiles";
import { EmptyState, PageHeading } from "../../components/ui";
import { Cantidad, ChipAlerta, Cargando, FuenteDato, Truncado } from "../../components/reposicion-ui";
import { useConsulta } from "../../lib/datos";
import {
  bolsas,
  bolsasEstimadas,
  fechaCorta,
  nombreEstadoPedido,
  prioridad,
  textoCobertura,
} from "../../lib/formato-reposicion";
import {
  ajustarPedidoSugerido,
  confirmarPedido,
  ESTADOS_VIVOS,
  posponerAlerta,
  SELECT_ALERTA,
  totalBolsas,
  uno,
  type AlertaVista,
} from "../../lib/reposicion";
import { supabase } from "../../lib/supabase";
import { ErrorCarga, NoEncontrado } from "../errores/Errores";

const quienAjusto = (perfil: string | null) =>
  perfil === "kam" ? "tu Key Account Manager" : perfil === "vendedor" ? "tu vendedor" : "tu equipo";

function AvisoAjuste({ alerta }: { alerta: AlertaVista }) {
  const ps = uno(alerta.pedidos_sugeridos);
  if (!ps?.ajustado_por_nombre || !["vendedor", "kam"].includes(ps.ajustado_por_perfil ?? "")) return null;
  const cambios = ps.lineas_sugeridas.filter((l) => l.bolsas !== l.bolsas_sugeridas);
  return (
    <div className="aviso-ajuste" role="note">
      <UserRoundPen size={18} aria-hidden="true" />
      <div>
        <b>
          {ps.ajustado_por_nombre.split(" ")[0]} ({quienAjusto(ps.ajustado_por_perfil)}) ajustó el pedido
        </b>
        <small>
          {cambios.length
            ? cambios.map((l) => `${l.productos.nombre}: ${l.bolsas_sugeridas} → ${l.bolsas}`).join(" · ")
            : "Revisó las cantidades"}{" "}
          · {fechaCorta(ps.ajustado_at)}
        </small>
      </div>
    </div>
  );
}

export function Reposicion() {
  const sesion = useSesion();
  const alertas = useConsulta<AlertaVista[]>(
    () =>
      supabase
        .from("alertas")
        .select(SELECT_ALERTA)
        .in("estado", [...ESTADOS_VIVOS, "confirmada"])
        .order("creada_at", { ascending: false }) as never,
  );
  const vivas = useMemo(
    () => (alertas.datos ?? []).filter((a) => ESTADOS_VIVOS.includes(a.estado)).sort((a, b) => prioridad(a) - prioridad(b)),
    [alertas.datos],
  );
  const confirmadas = (alertas.datos ?? []).filter((a) => a.estado === "confirmada");

  if (alertas.error) return <ErrorCarga alReintentar={() => void alertas.recargar()} />;
  return (
    <>
      <PageHeading
        eyebrow={sesion.organizacionNombre.toUpperCase()}
        title="Reposición"
        description="Te avisamos antes de que se acabe el café. Revisa el pedido sugerido y confírmalo."
      />
      {alertas.cargando && !alertas.datos ? (
        <Cargando />
      ) : vivas.length === 0 ? (
        <EmptyState title="Todo en orden" description="Ningún punto necesita reposición por ahora. Te avisaremos antes de que se acabe." />
      ) : (
        <ul className="lista-tarjetas" aria-label="Avisos de reposición">
          {vivas.map((a) => {
            const ps = uno(a.pedidos_sugeridos);
            const lineas = ps?.lineas_sugeridas ?? [];
            return (
              <li key={a.id} className={`card tarjeta-alerta ${a.estado}`}>
                <div className="tarjeta-cabeza">
                  <ChipAlerta estado={a.estado} severidad={a.severidad} />
                  <Truncado texto={a.points.nombre} />
                </div>
                <h2>
                  {a.productos.nombre} · {textoCobertura(a.cobertura_dias).toLowerCase()}
                </h2>
                <FuenteDato fuente={a.fuente} datoAt={a.dato_at} />
                <AvisoAjuste alerta={a} />
                <p className="resumen-pedido">
                  <PackageCheck size={18} aria-hidden="true" />
                  <span>
                    Pedido sugerido: <b>{lineas.map((l) => `${bolsas(l.bolsas)} de ${l.productos.nombre}`).join(", ")}</b>
                  </span>
                </p>
                {a.estado === "pospuesta" && a.pospuesta_hasta && (
                  <small className="muted">Pospuesto hasta el {new Date(`${a.pospuesta_hasta}T12:00`).toLocaleDateString("es-CL")}</small>
                )}
                <a className="button primary boton-ancho" href={`#/reposicion/${a.id}`}>
                  Revisar y confirmar
                </a>
              </li>
            );
          })}
        </ul>
      )}
      {confirmadas.length > 0 && (
        <section aria-labelledby="confirmados">
          <div className="section-heading">
            <h2 id="confirmados">Pedidos confirmados</h2>
          </div>
          <ul className="lista-tarjetas compacta">
            {confirmadas.map((a) => {
              const pedido = uno(a.pedidos);
              return (
                <li key={a.id} className="card">
                  <a className="fila-enlace" href={pedido ? `#/pedidos/${pedido.id}` : "#/pedidos"}>
                    <CheckCircle2 size={20} className="ok" aria-hidden="true" />
                    <span className="grow">
                      <Truncado texto={`${a.productos.nombre} · ${a.points.nombre}`} como="b" />
                      <small>{pedido ? `${pedido.codigo} · ${nombreEstadoPedido[pedido.estado]}` : "Pedido recibido"}</small>
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </>
  );
}

export function DetalleReposicion({ id }: { id: string }) {
  const { puede } = useAuth();
  const alerta = useConsulta<AlertaVista>(() => supabase.from("alertas").select(SELECT_ALERTA).eq("id", id).maybeSingle() as never, [id]);
  const a = alerta.datos;
  const ps = a ? uno(a.pedidos_sugeridos) : null;
  const modoB = a ? !a.points.telemetria_disponible : false;

  const saldos = useConsulta<{ producto_id: string; saldo_kg: number }[]>(
    () =>
      supabase
        .from("saldos")
        .select("producto_id, saldo_kg")
        .eq("point_id", a?.point_id ?? "00000000-0000-0000-0000-000000000000") as never,
    [a?.point_id],
  );

  const [cantidades, setCantidades] = useState<Record<string, number>>({});
  const [quedan, setQuedan] = useState<Record<string, number>>({});
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [hecho, setHecho] = useState<{ pedidoId: string; codigo: string } | null>(null);

  useEffect(() => {
    if (ps) setCantidades(Object.fromEntries(ps.lineas_sugeridas.map((l) => [l.producto_id, l.bolsas])));
  }, [ps?.id, ps?.ajustado_at]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!ps || !saldos.datos) return;
    setQuedan(
      Object.fromEntries(
        ps.lineas_sugeridas.map((l) => [
          l.producto_id,
          bolsasEstimadas(saldos.datos!.find((s) => s.producto_id === l.producto_id)?.saldo_kg ?? null, l.productos.kg_por_bolsa),
        ]),
      ),
    );
  }, [ps?.id, saldos.datos]); // eslint-disable-line react-hooks/exhaustive-deps

  if (alerta.error) return <ErrorCarga alReintentar={() => void alerta.recargar()} />;
  if (alerta.cargando && !a) return <Cargando />;
  if (!a || !ps) return <NoEncontrado />;

  const lineas = ps.lineas_sugeridas;
  const total = totalBolsas(lineas.map((l) => ({ bolsas: cantidades[l.producto_id] ?? l.bolsas })));
  const pedido = uno(a.pedidos);
  const viva = ["abierta", "pospuesta", "critica"].includes(a.estado);

  async function confirmar() {
    setEnviando(true);
    setError("");
    const cambiadas = lineas.filter((l) => (cantidades[l.producto_id] ?? l.bolsas) !== l.bolsas);
    if (cambiadas.length) {
      const r = await ajustarPedidoSugerido(
        ps!.id,
        cambiadas.map((l) => ({ producto_id: l.producto_id, bolsas: cantidades[l.producto_id] })),
      );
      if (!r.ok) {
        setEnviando(false);
        return setError(mensajeDeError(r.codigo));
      }
    }
    const r = await confirmarPedido(
      ps!.id,
      modoB ? lineas.map((l) => ({ producto_id: l.producto_id, bolsas: quedan[l.producto_id] ?? 0 })) : null,
    );
    setEnviando(false);
    if (!r.ok) {
      setError(mensajeDeError(r.codigo));
      if (r.codigo === "pedido_ya_confirmado") void alerta.recargar();
      return;
    }
    if (r.datos) setHecho({ pedidoId: r.datos.pedido_id, codigo: r.datos.codigo });
  }

  async function posponer() {
    setEnviando(true);
    const r = await posponerAlerta(a!.id, 2);
    setEnviando(false);
    if (!r.ok) return setError(mensajeDeError(r.codigo));
    location.hash = "/";
  }

  if (hecho) {
    return (
      <section className="card confirmado" aria-live="polite">
        <CheckCircle2 size={44} className="ok" aria-hidden="true" />
        <h1>Pedido {hecho.codigo} recibido</h1>
        <p>
          {bolsas(total)} para {a.points.nombre}. Te avisaremos cuando vaya en camino.
        </p>
        <a className="button primary boton-ancho" href={`#/pedidos/${hecho.pedidoId}`}>
          Ver el estado del pedido
        </a>
        <a className="button secondary boton-ancho" href="#/">
          Volver a Reposición
        </a>
      </section>
    );
  }

  return (
    <div className="detalle-reposicion">
      <a className="back-link" href="#/">
        <ArrowLeft size={14} aria-hidden="true" /> Reposición
      </a>
      <header className="detalle-cabeza">
        <div className="tarjeta-cabeza">
          <ChipAlerta estado={a.estado} severidad={a.severidad} />
          <Truncado texto={a.points.nombre} />
        </div>
        <h1>
          {a.productos.nombre} · {textoCobertura(a.cobertura_dias).toLowerCase()}
        </h1>
        <FuenteDato fuente={a.fuente} datoAt={a.dato_at} />
      </header>

      <AvisoAjuste alerta={a} />

      {!viva ? (
        <section className="card">
          <h2>Este pedido ya fue confirmado</h2>
          <p>{pedido ? `${pedido.codigo} · ${nombreEstadoPedido[pedido.estado]}` : "El aviso ya no está pendiente."}</p>
          {pedido && (
            <a className="button primary" href={`#/pedidos/${pedido.id}`}>
              Ver el estado del pedido
            </a>
          )}
        </section>
      ) : (
        <form
          className="formulario-pedido"
          onSubmit={(e) => {
            e.preventDefault();
            void confirmar();
          }}
        >
          <section className="card" aria-labelledby="pedido-sugerido">
            <h2 id="pedido-sugerido">Pedido sugerido</h2>
            <small className="muted">Calculado para cubrir el plazo de entrega y tu próximo ciclo de compra.</small>
            {lineas.map((l) => (
              <Cantidad
                key={l.producto_id}
                etiqueta={l.productos.nombre}
                detalle={`${l.productos.formato}${l.bolsas !== l.bolsas_sugeridas ? ` · sugerido: ${l.bolsas_sugeridas}` : ""}`}
                valor={cantidades[l.producto_id] ?? l.bolsas}
                alCambiar={(v) => setCantidades((c) => ({ ...c, [l.producto_id]: v }))}
                unidad="bolsas"
              />
            ))}
          </section>

          {modoB && (
            <section className="card" aria-labelledby="quedan">
              <h2 id="quedan">¿Cuántas bolsas te quedan?</h2>
              <small className="muted">Lo estimamos con tu consumo. Corrígelo si no calza: así el próximo aviso llega a tiempo.</small>
              {lineas.map((l) => (
                <Cantidad
                  key={l.producto_id}
                  etiqueta={`${l.productos.nombre}, quedan`}
                  valor={quedan[l.producto_id] ?? 0}
                  alCambiar={(v) => setQuedan((q) => ({ ...q, [l.producto_id]: v }))}
                  paso={0.5}
                  max={999}
                  unidad="bolsas"
                />
              ))}
            </section>
          )}

          {error && (
            <p className="notice danger" role="alert">
              {error}
            </p>
          )}

          <div className="barra-accion">
            <button className="button primary boton-ancho" type="submit" disabled={enviando || total === 0 || !puede("pedido.confirmar")}>
              {enviando ? "Confirmando…" : `Confirmar pedido · ${bolsas(total)}`}
            </button>
            {puede("pedido.posponer") && a.estado !== "pospuesta" && (
              <button className="button secondary" type="button" onClick={() => void posponer()} disabled={enviando}>
                <Clock3 size={16} aria-hidden="true" /> Posponer 2 días
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
