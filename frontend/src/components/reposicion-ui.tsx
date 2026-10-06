// Piezas de interfaz del flujo de reposición, pensadas primero para el celular:
// objetivos táctiles de 44 px o más, campos de 16 px (sin zoom en iOS) y estados con texto.
import { useEffect, useId, useRef, type ReactNode } from "react";
import { Minus, Plus, Radio, UserRoundPen, X } from "lucide-react";
import { estadoAlerta, textoFuente, type EstadoAlerta, type Fuente, type Severidad } from "../lib/formato-reposicion";
import { StatusChip } from "./ui";

// Cantidad con botones grandes de más y menos y teclado numérico en el celular.
export function Cantidad({
  etiqueta,
  valor,
  alCambiar,
  min = 0,
  max = 99,
  paso = 1,
  unidad,
  detalle,
}: {
  etiqueta: string;
  valor: number;
  alCambiar: (v: number) => void;
  min?: number;
  max?: number;
  paso?: number;
  unidad?: string;
  detalle?: ReactNode;
}) {
  const id = useId();
  const limitar = (v: number) => Math.min(max, Math.max(min, Math.round(v / paso) * paso));
  return (
    <div className="cantidad">
      <div className="cantidad-texto">
        <label htmlFor={id}>{etiqueta}</label>
        {detalle && <small>{detalle}</small>}
      </div>
      <div className="cantidad-control">
        <button type="button" aria-label={`Quitar ${paso === 1 ? "una" : "media"} · ${etiqueta}`} disabled={valor <= min}
          onClick={() => alCambiar(limitar(valor - paso))}>
          <Minus size={20} />
        </button>
        <input
          id={id}
          type="number"
          inputMode={paso < 1 ? "decimal" : "numeric"}
          min={min}
          max={max}
          step={paso}
          value={valor}
          onFocus={(e) => e.target.select()}
          onChange={(e) => alCambiar(limitar(Number(e.target.value.replace(",", ".")) || 0))}
        />
        <button type="button" aria-label={`Agregar ${paso === 1 ? "una" : "media"} · ${etiqueta}`} disabled={valor >= max}
          onClick={() => alCambiar(limitar(valor + paso))}>
          <Plus size={20} />
        </button>
      </div>
      {unidad && <span className="cantidad-unidad" aria-hidden="true">{unidad}</span>}
    </div>
  );
}

// Diálogo: hoja inferior en el celular, centrado en escritorio. Esc cierra; el foco entra al abrir
// (showModal lo atrapa dentro) y vuelve al botón que lo abrió al cerrar.
export function Hoja({ titulo, children, alCerrar }: { titulo: string; children: ReactNode; alCerrar: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const tituloId = useId();
  useEffect(() => {
    const previo = document.activeElement as HTMLElement | null;
    ref.current?.showModal();
    return () => previo?.focus();
  }, []);
  return (
    <dialog
      ref={ref}
      className="hoja"
      aria-labelledby={tituloId}
      onCancel={(e) => {
        e.preventDefault();
        alCerrar();
      }}
      onClick={(e) => {
        if (e.target === ref.current) alCerrar(); // clic en el fondo
      }}
    >
      <div className="hoja-cuerpo">
        <div className="row modal-head">
          <h2 id={tituloId}>{titulo}</h2>
          <button type="button" aria-label="Cerrar" className="icon-button" onClick={alCerrar}>
            <X />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}

export function ChipAlerta({ estado, severidad }: { estado: EstadoAlerta; severidad: Severidad }) {
  const e = estadoAlerta(estado, severidad);
  return <StatusChip tone={e.tono}>{e.texto}</StatusChip>;
}

// Fuente del dato y su fecha, como en producción.
export function FuenteDato({ fuente, datoAt }: { fuente: Fuente; datoAt: string | null }) {
  const Icono = fuente === "telemetria" ? Radio : UserRoundPen;
  return (
    <span className="fuente-dato">
      <Icono size={14} aria-hidden="true" />
      {textoFuente(fuente, datoAt)}
    </span>
  );
}

// Texto largo en una línea, con el texto completo disponible al pasar el cursor y para lectores.
export const Truncado = ({ texto, como: Etiqueta = "span" }: { texto: string; como?: "span" | "b" | "h2" | "h3" }) => (
  <Etiqueta className="truncar" title={texto}>
    {texto}
  </Etiqueta>
);

export function Cargando({ texto = "Cargando…" }: { texto?: string }) {
  return (
    <div className="cargando" role="status" aria-live="polite">
      <span className="cargando-barra" aria-hidden="true" />
      {texto}
    </div>
  );
}
