# Contrato del futuro backend Marley

Esta carpeta documenta la frontera de integración. No hay un backend CRM productivo implementado. El `server.ts` existente en la raíz sigue intacto y no es usado por Marley Vendedores.

## Endpoints previstos

| Endpoint | Responsabilidad |
| --- | --- |
| GET /session | Identidad autenticada y cartera autorizada por servidor |
| GET /customers | Cartera filtrada en backend, nunca por un userId confiado del cliente |
| GET /customers/:id | Autorización por cuenta antes de consultar Salesforce |
| GET /products | Precios vigentes y disponibilidad desde ERP |
| POST /sync | Mutación idempotente, control de versión, permisos y respuesta SYNCED/NEEDS_REVIEW |
| POST /files | Carga multipart por cliente, controles de tamaño y tipo, autorización y retención |
| GET /notifications | Eventos deduplicados y enlaces a entidades autorizadas |
| POST /alerts/:id/reminder | Reclamo transaccional de recordatorio antes de enviar |

La autenticación real debe usar sesión segura de backend. No se almacenan tokens de Salesforce en el frontend. Los DTO de `shared/contracts.ts` son contratos de diseño, no una implementación de seguridad.

## Regla de 24 horas

1. Un proceso de backend calcula la reposición desde compras y consumo y crea una alerta con `deadline = createdAt + 24 h`.
2. Notifica primero al vendedor. Una operación transaccional permite reclamar el envío por vendedor o automatización, una sola vez.
3. Un job persistente consulta alertas vencidas sin gestionar y reclama su envío con control de concurrencia. Una outbox entrega la notificación a los canales autorizados del cliente, incluida Marley Conecta por sus APIs.
4. Un índice único por alerta y tipo de evento impide duplicados, incluso si el vendedor y el job actúan simultáneamente.
5. El frontend recibe `SENT_BY_CRM_AUTOMATION` y retira el botón de envío. Nunca decide por su reloj que el mensaje ya fue enviado.

La demostración contiene una alerta precargada en ese estado. No hay cron ni envío a clientes desde el navegador.

## Stock y conflictos

El ERP debe validar precios, IVA y stock dentro de la misma operación que reserva el pedido. Nunca confiar en totales enviados por el frontend. Utilizar `Idempotency-Key` y `expectedVersion`. Si cambió el stock, devolver `NEEDS_REVIEW` con cantidades vigentes; conservar lo solicitado. Solo reenviar después de aprobación explícita del vendedor. Procesar adjuntos con carga multipart, no Blob serializado a JSON.

## Pendiente antes de producción

OAuth/SSO, permisos de cartera en servidor, reserva ERP, control transaccional de recordatorios, auditoría, retención y protección de datos offline, sincronización incremental y conflictos de edición entre dispositivos, observabilidad, push real y pruebas de integración.
