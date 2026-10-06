// Marley Conecta · Resumen de avisos por correo (Resend).
//
// Un correo por persona con todos sus avisos pendientes, una vez al día (pg_cron, 06:15 Chile) o
// con el comando `pnpm correo:resumen`. Cuida el plan gratuito de Resend (100 al día, 3.000 al mes):
//   · agrupa: un correo por persona, no uno por aviso;
//   · sin duplicados: cada aviso se marca al enviarse y no vuelve a salir;
//   · tope diario (LIMITE_DIARIO) contado en la base;
//   · no envía avisos ya leídos en la app ni de más de 24 horas.
// Sin RESEND_API_KEY corre en modo prueba: registra lo que enviaría, sin enviar nada.
// Solo la llama el servidor: exige la clave secreta del proyecto en Authorization.
import { createClient } from "npm:@supabase/supabase-js@2";

function clave(nombreNueva: string, nombreLegado: string): string[] {
  const valores: string[] = [];
  const nuevas = Deno.env.get(nombreNueva);
  if (nuevas) {
    try {
      valores.push(...Object.values(JSON.parse(nuevas) as Record<string, string>));
    } catch {
      // formato inesperado: se usa la clave heredada
    }
  }
  const legado = Deno.env.get(nombreLegado);
  if (legado) valores.push(legado);
  if (!valores.length) throw new Error(`Falta ${nombreNueva} o ${nombreLegado}`);
  return valores;
}

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SECRETAS = clave("SUPABASE_SECRET_KEYS", "SUPABASE_SERVICE_ROLE_KEY");
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
// Remitente: sin dominio verificado en Resend solo sirve onboarding@resend.dev, y solo hacia el
// correo dueño de la cuenta Resend.
const REMITENTE = Deno.env.get("RESEND_FROM") ?? "Marley Conecta <onboarding@resend.dev>";
// Sin dominio verificado, todos los correos se redirigen a esta dirección (la dueña de la cuenta).
const SOLO_A = Deno.env.get("RESEND_SOLO_A") ?? "";
const LIMITE_DIARIO = Number(Deno.env.get("RESEND_LIMITE_DIARIO") ?? "90");
const APP_URL = (Deno.env.get("APP_URL") ?? "").replace(/\/$/, "");

interface Aviso {
  id: string;
  titulo: string;
  cuerpo: string;
  enlace: string;
}

const escapar = (t: string) =>
  t.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function html(nombre: string, avisos: Aviso[]): string {
  const filas = avisos
    .map(
      (a) => `<tr><td style="padding:12px 0;border-bottom:1px solid #e1e5de">
        <b style="color:#173e2d">${escapar(a.titulo)}</b><br>
        <span style="color:#5f6962">${escapar(a.cuerpo)}</span><br>
        <a href="${APP_URL}/#${escapar(a.enlace)}" style="color:#173e2d">Abrir en Marley Conecta</a>
      </td></tr>`,
    )
    .join("");
  return `<div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:auto;color:#202a24">
    <h1 style="font-size:20px;color:#173e2d">Hola, ${escapar(nombre.split(" ")[0])}</h1>
    <p>Tienes ${avisos.length} ${avisos.length === 1 ? "aviso" : "avisos"} de reposición en Marley Conecta:</p>
    <table style="width:100%;border-collapse:collapse">${filas}</table>
    <p style="color:#5f6962;font-size:12px">Recibes este resumen una vez al día como máximo.</p>
  </div>`;
}

Deno.serve(async (req) => {
  const token = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!SECRETAS.includes(token)) return new Response(JSON.stringify({ error: "sin_permiso" }), { status: 401 });

  const admin = createClient(SUPABASE_URL, SECRETAS[0], { auth: { persistSession: false } });
  const { data, error } = await admin.rpc("resumenes_correo_pendientes", { p_limite_diario: LIMITE_DIARIO });
  if (error) {
    console.error("resumenes_correo_pendientes", error);
    return new Response(JSON.stringify({ error: "error_interno" }), { status: 500 });
  }

  const modo = RESEND_API_KEY ? "real" : "prueba";
  const resultado = { modo, enviados: 0, avisos: 0, fallidos: 0 };
  for (const r of (data ?? []) as { user_id: string; email: string; nombre: string; avisos: Aviso[] }[]) {
    const destino = SOLO_A || r.email;
    let proveedorId: string | null = null;
    if (modo === "real") {
      const envio = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
          // Idempotencia: si la llamada se repite, Resend no envía dos veces el mismo resumen.
          "Idempotency-Key": `resumen-${r.user_id}-${r.avisos.map((a) => a.id).sort().join(".")}`.slice(0, 256),
        },
        body: JSON.stringify({
          from: REMITENTE,
          to: [destino],
          subject: r.avisos.length === 1 ? r.avisos[0].titulo : `Tienes ${r.avisos.length} avisos de reposición`,
          html: html(r.nombre, r.avisos),
        }),
      });
      if (!envio.ok) {
        console.error("resend", envio.status, await envio.text());
        resultado.fallidos++;
        continue; // Los avisos quedan pendientes para la próxima corrida.
      }
      proveedorId = ((await envio.json()) as { id?: string }).id ?? null;
    } else {
      console.log(`[modo prueba] resumen a ${destino}: ${r.avisos.map((a) => a.titulo).join(" | ")}`);
    }
    await admin.rpc("registrar_envio_correo", {
      p_user: r.user_id,
      p_email: destino,
      p_ids: r.avisos.map((a) => a.id),
      p_modo: modo,
      p_proveedor_id: proveedorId,
    });
    resultado.enviados++;
    resultado.avisos += r.avisos.length;
  }
  return new Response(JSON.stringify(resultado), { headers: { "Content-Type": "application/json" } });
});
