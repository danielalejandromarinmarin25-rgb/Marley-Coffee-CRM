-- Marley Conecta · Fase 3 · Tareas programadas
-- pg_cron es un "despertador" dentro de Postgres: ejecuta SQL a una hora fija, sin servidor aparte.
--   06:00 Chile (09:00 UTC): recalcular saldos y alertas.
--   06:15 Chile (09:15 UTC): pedir a la Edge Function enviar-resumen que mande el correo del día.
-- El correo usa pg_net y dos secretos del Vault ("url_proyecto" y "clave_servicio"). Si no están
-- configurados, la tarea no hace nada (así queda en local hasta que se configuren).

create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

create function private.disparar_resumen_correo() returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_url text;
  v_clave text;
begin
  select decrypted_secret into v_url from vault.decrypted_secrets where name = 'url_proyecto';
  select decrypted_secret into v_clave from vault.decrypted_secrets where name = 'clave_servicio';
  if v_url is null or v_clave is null then
    raise notice 'Resumen de correo sin configurar (faltan secretos url_proyecto y clave_servicio en Vault)';
    return;
  end if;
  perform net.http_post(
    url := v_url || '/functions/v1/enviar-resumen',
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || v_clave),
    body := '{}'::jsonb
  );
end $$;

select cron.schedule('recalcular-reposicion', '0 9 * * *', $$select private.recalcular_reposicion(null)$$);
select cron.schedule('resumen-correo', '15 9 * * *', $$select private.disparar_resumen_correo()$$);
