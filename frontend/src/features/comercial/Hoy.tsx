// Vendedor y KAM · Hoy: a quién contactar, con el pedido sugerido ya armado.
// Puede contactar (WhatsApp con mensaje precargado, sin API) y ajustar cantidades. NO confirma:
// eso lo hace el cliente, que ve el ajuste antes de confirmar. El servidor lo impone igual.
import { useMemo, useState } from "react";
import { CheckCircle2, MessageCircle, Phone, SlidersHorizontal } from "lucide-react";
import { useAuth, useSesion } from "../../auth/AuthProvider";
import { mensajeDeError } from "../../auth/perfiles";
import { EmptyState, PageHeading, PrimaryButton, SecondaryButton, Toast } from "../../components/ui";
import { Cantidad, Cargando, ChipAlerta, FuenteDato, Hoja, Truncado } from "../../components/reposicion-ui";
import { useConsulta, useRefresco } from "../../lib/datos";
import {
  bolsas,
  enlaceWhatsapp,
  fechaCorta,
  mensajeWhatsapp,
  nombreEstadoPedido,
  prioridad,
  textoCobertura,
} from "../../lib/formato-reposicion";
import {
  ajustarPedidoSugerido,
  ESTADOS_VIVOS,
  registrarGestion,
  SELECT_ALERTA,
  totalBolsas,
  uno,
  type AlertaVista,
} from "../../lib/reposicion";
import { supabase } from "../../lib/supabase";
import { ErrorCarga } from "../errores/Errores";

export function Hoy() {
  const sesion = useSesion();
  const alertas = useConsulta<AlertaVista[]>(
    () =>
      supabase
        .from("alertas")
        .select(SELECT_ALERTA)
        .in("estado", [...ESTADOS_VIVOS, "confirmada"])
        .order("creada_at", { ascending: false }) as never,
  );
  useRefresco(() => void alertas.recargar(), 60_000);
  const [ajustando, setAjustando] = useState<AlertaVista | null>(null);
  const [aviso, setAviso] = useState("");

  const pendientes = useMemo(
    () => (alertas.datos ?? []).filter((a) => ESTADOS_VIVOS.includes(a.estado)).sort((a, b) => prioridad(a) - prioridad(b)),
    [alertas.datos],
  );
  const confirmadas = (alertas.datos ?? []).filter((a) => a.estado === "confirmada");

  if (alertas.error) return <ErrorCarga alReintentar={() => void alertas.recargar()} />;
  return (
    <>
      <PageHeading
        eyebrow="TU ESPACIO COMERCIAL"
        title="Hoy"
        description={
          alertas.datos
            ? pendientes.length
              ? `${pendientes.length} ${pendientes.length === 1 ? "cliente por contactar" : "clientes por contactar"} antes de que se les acabe el café. El cliente ya recibió el aviso; solo él confirma.`
              : "Sin clientes por contactar. Buen trabajo."
            : undefined
        }
      />
      {alertas.cargando && !alertas.datos ? (
        <Cargando />
      ) : pendientes.length === 0 ? (
        <EmptyState title="Nadie por contactar hoy" description="Te avisaremos cuando un cliente de tu cartera se acerque al quiebre." />
      ) : (
        <ul className="lista-tarjetas" aria-label="Clientes por contactar">
          {pendientes.map((a) => (
            <TarjetaHoy key={a.id} alerta={a} vendedor={sesion.nombre} alAjustar={() => setAjustando(a)} />
          ))}
        </ul>
      )}
      {confirmadas.length > 0 && (
        <section aria-labelledby="ya-confirmados">
          <div className="section-heading">
            <h2 id="ya-confirmados">Confirmados por el cliente</h2>
          </div>
          <ul className="lista-tarjetas compacta">
            {confirmadas.map((a) => {
              const pedido = uno(a.pedidos);
              return (
                <li key={a.id} className="card">
                  <a className="fila-enlace" href={pedido ? `#/pedidos/${pedido.id}` : "#/pedidos"}>
                    <CheckCircle2 size={20} className="ok" aria-hidden="true" />
                    <span className="grow">
                      <Truncado texto={`${a.organizations.nombre_comercial} · ${a.points.nombre}`} como="b" />
                      <small>
                        {pedido ? `${pedido.codigo} · ${nombreEstadoPedido[pedido.estado]}` : "Confirmado"} · {fechaCorta(a.confirmada_at)}
                      </small>
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>
        </section>
      )}
      {ajustando && (
        <AjustarPedido
          alerta={ajustando}
          alCerrar={() => setAjustando(null)}
          alGuardar={() => {
            setAjustando(null);
            setAviso("Ajuste guardado. El cliente lo verá antes de confirmar.");
            setTimeout(() => setAviso(""), 4000);
            void alertas.recargar();
          }}
        />
      )}
      <Toast message={aviso} />
    </>
  );
}

function TarjetaHoy({ alerta: a, vendedor, alAjustar }: { alerta: AlertaVista; vendedor: string; alAjustar: () => void }) {
  const { puede } = useAuth();
  const ps = uno(a.pedidos_sugeridos);
  const lineas = ps?.lineas_sugeridas ?? [];
  const whatsapp = enlaceWhatsapp(
    a.organizations.contacto_telefono,
    mensajeWhatsapp({
      contacto: a.organizations.contacto_nombre,
      vendedor,
      punto: a.points.nombre,
      lineas: lineas.map((l) => ({ cafe: l.productos.nombre, bolsas: l.bolsas })),
      textoCobertura: textoCobertura(a.cobertura_dias),
    }),
  );
  return (
    <li className={`card tarjeta-alerta ${a.estado}`}>
      <div className="tarjeta-cabeza">
        <ChipAlerta estado={a.estado} severidad={a.severidad} />
        <Truncado texto={a.organizations.nombre_comercial} como="b" />
      </div>
      <h2>
        {a.productos.nombre} · {textoCobertura(a.cobertura_dias).toLowerCase()}
      </h2>
      <Truncado texto={a.points.nombre} />
      <FuenteDato fuente={a.fuente} datoAt={a.dato_at} />
      <p className="resumen-pedido">
        <span>
          Pedido sugerido: <b>{lineas.map((l) => `${bolsas(l.bolsas)} de ${l.productos.nombre}`).join(", ")}</b>
          {ps?.ajustado_por_nombre && <small> · ajustado por {ps.ajustado_por_nombre.split(" ")[0]} {fechaCorta(ps.ajustado_at)}</small>}
        </span>
      </p>
      {a.organizations.contacto_nombre && (
        <small className="contacto">
          <Phone size={13} aria-hidden="true" /> {a.organizations.contacto_nombre}
          {a.organizations.contacto_telefono && ` · ${a.organizations.contacto_telefono}`}
        </small>
      )}
      <div className="acciones-tarjeta">
        {whatsapp ? (
          <a
            className="button whatsapp"
            href={whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => void registrarGestion(a.id, "whatsapp")}
          >
            <MessageCircle size={18} aria-hidden="true" /> WhatsApp
          </a>
        ) : (
          <span className="muted">Sin teléfono de contacto</span>
        )}
        {puede("pedido_sugerido.ajustar") && (
          <button className="button secondary" type="button" onClick={alAjustar}>
            <SlidersHorizontal size={18} aria-hidden="true" /> Ajustar cantidades
          </button>
        )}
      </div>
    </li>
  );
}

function AjustarPedido({ alerta, alCerrar, alGuardar }: { alerta: AlertaVista; alCerrar: () => void; alGuardar: () => void }) {
  const ps = uno(alerta.pedidos_sugeridos)!;
  const [cantidades, setCantidades] = useState(() => Object.fromEntries(ps.lineas_sugeridas.map((l) => [l.producto_id, l.bolsas])));
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const total = totalBolsas(Object.values(cantidades).map((b) => ({ bolsas: b })));

  async function guardar() {
    setGuardando(true);
    setError("");
    const r = await ajustarPedidoSugerido(
      ps.id,
      Object.entries(cantidades).map(([producto_id, b]) => ({ producto_id, bolsas: b })),
    );
    setGuardando(false);
    if (!r.ok) return setError(mensajeDeError(r.codigo));
    alGuardar();
  }

  return (
    <Hoja titulo="Ajustar pedido sugerido" alCerrar={alCerrar}>
      <p className="hoja-contexto">
        <Truncado texto={`${alerta.organizations.nombre_comercial} · ${alerta.points.nombre}`} como="b" />
        <small>El cliente verá el cambio y es quien confirma el pedido.</small>
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void guardar();
        }}
      >
        {ps.lineas_sugeridas.map((l) => (
          <Cantidad
            key={l.producto_id}
            etiqueta={l.productos.nombre}
            detalle={`Sugerido por el sistema: ${l.bolsas_sugeridas}`}
            valor={cantidades[l.producto_id]}
            alCambiar={(v) => setCantidades((c) => ({ ...c, [l.producto_id]: v }))}
            unidad="bolsas"
          />
        ))}
        {error && (
          <p className="notice danger" role="alert">
            {error}
          </p>
        )}
        <div className="hoja-acciones">
          <PrimaryButton type="submit" disabled={guardando || total === 0}>
            {guardando ? "Guardando…" : `Guardar · ${bolsas(total)}`}
          </PrimaryButton>
          <SecondaryButton type="button" onClick={alCerrar}>
            Cancelar
          </SecondaryButton>
        </div>
      </form>
    </Hoja>
  );
}
