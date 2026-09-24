# Marley Vendedores

Primera entrega funcional y navegable para equipo comercial. Aplicación React + TypeScript independiente, creada después de inspeccionar el repositorio remoto en el commit `561e6487c182803092f6480c463699e7be670c35`. No importa componentes, estado ni estilos de Conecta. `public/marley-conecta/` y los archivos previos del repositorio se conservaron sin cambios.

## Ejecutar

```sh
cd marley-vendedores
pnpm install
pnpm dev
```

Desarrollo: `http://127.0.0.1:5174`. También se puede usar npm: `npm install`, `npm run dev`.

```sh
pnpm build
pnpm test
pnpm preview --port 4174
```

La versión de producción local está en `http://127.0.0.1:4174`. La caché de recarga offline se registra en producción/preview, no durante desarrollo. Es necesaria una primera carga con conexión. El servidor debe servir `dist/` bajo HTTPS o localhost; no abrir el HTML por `file://`.

## Funcionalidad entregada

- Login mock con vendedora, KAM y ejecutiva, y carteras distintas.
- Inicio, clientes con filtros, Cliente 360° con cuatro pestañas, agenda, preparación/inicio/finalización/cancelación/reprogramación de visitas.
- Pedidos con catálogo, cantidades, IVA chileno, resumen, confirmación, borradores por cliente y conflictos de stock con aprobación explícita.
- Alertas de riesgo y reposición con gestión, posposición y ejemplo de automatización CRM. No hay Next Best Action.
- Oportunidades y casos con creación/edición y estados, tareas, timeline, notificaciones con enlaces y Mi gestión sin rankings.
- Sidebar desktop y navegación inferior móvil; formularios accesibles, diálogos nativos, estados vacíos y mensajes de guardado.
- IndexedDB por userId: entidades, borradores, cola de cambios y fotografías. Autoguardado de registro de visita y borradores de formularios comerciales.
- Cola persistente, reintentos temporales, estados de atención, sesión expirada de prueba y cierre de sesión conservando datos.
- Service worker acotado a esta aplicación para abrir la versión ya visitada sin red.

## Arquitectura

```text
src/
  app/              sesión, routing hash y composición
  components/       layout, tarjetas, controles, diálogos, fotografías
  features/         dashboard, customers, visits, orders, alerts, management
  services/         servicios de dominio y adaptadores mock/backend
  repositories/     IndexedDB por usuario
  store/            estado y coordinación de cola persistente
  types/            entidades y estados
  utils/            IVA, stock, fechas, cartera y reglas puras
  mocks/            datos referenciales separados de UI
  styles/           tokens visuales y responsive
public/             service worker y manifest
tests/              reglas de dominio
```

Routing hash permite hospedar la aplicación bajo `/marley-vendedores/` sin reescrituras del servidor. No se añaden bibliotecas de estado, formularios, gráficos o componentes. React, Vite y Lucide ya existían en el repositorio; se agregaron sus tipos para comprobación estricta.

## Qué significa «demo»

Salesforce, ERP, autenticación, notificaciones y cargas remotas todavía no están conectados. «Todo actualizado» indica que la cola fue procesada por el adaptador mock **en este dispositivo**; no implica respaldo externo. Los contactos usan datos ficticios y las acciones de comunicación registran actividad sin enviar mensajes. La agenda tiene un mapa embebido de Google Maps por dirección y enlaces para consultar rutas; necesita conexión y no incluye optimización de ruta. Los precios, stock y métricas son de ejemplo, no condiciones comerciales oficiales.

El mock no implementa reserva transaccional de inventario, entrega real, seguridad del servidor ni automatización de 24 horas. El backend deberá cubrir esas funciones según `../backend/README.md`. El adaptador HTTP es un punto de extensión; no activar hasta implementar y validar ese contrato. No hay protección criptográfica de datos locales ni sincronización entre dispositivos en esta entrega.

## Pruebas manuales reproducibles

1. Entrar como Camila. Crear pedido de Hotel Santiago con 12 unidades de Jamaica Blend (stock 10). Comprobar que no reduce cantidades automáticamente; aceptar 10 y confirmar.
2. En Configuración activar «Simular trabajo sin conexión». Crear pedido. Debe mostrar «Pendiente de envío» y un ID TMP. Recargar: permanece guardado.
3. Modificar stock demo por debajo de la cantidad solicitada; recuperar conexión. Debe pasar a «Requiere revisión». Revisar, aceptar cantidad disponible y volver a confirmar.
4. Iniciar una visita, escribir comentarios y detalles. Recargar. Confirmar recuperación, finalizar y revisar Actividad del cliente.
5. Abrir oportunidad nueva, completar parte del formulario y cerrarlo. Volver a abrir: recuperar el borrador. Guardar y editar la etapa.
6. Adjuntar una fotografía offline, recargar y abrirla desde la visita/caso. La imagen se conserva localmente aunque la sincronización falle.
7. Cerrar sesión con cambios pendientes. Entrar como Diego: solo Hotel Santiago y Empresa Oficina Norte. Volver a Camila y comprobar que su cola permanece intacta.
8. Probar sesión expirada desde Configuración; renovar sin perder el contexto.
9. Verificar pantallas a 390 px y escritorio, especialmente Cliente 360° y cantidades de pedido.

## Publicación en GitHub Pages

El workflow de GitHub Pages construye ambas aplicaciones por separado, ejecuta las pruebas de Vendedores y copia su `dist/` a `dist/marley-vendedores/`. Conecta conserva sus archivos originales. El service worker se mantiene dentro de `/marley-vendedores/` y no controla el portal de clientes.

- Vendedores: https://danielalejandromarinmarin25-rgb.github.io/Marley-Coffee-CRM/marley-vendedores/
- Clientes: https://danielalejandromarinmarin25-rgb.github.io/Marley-Coffee-CRM/marley-conecta/

Ambos enlaces se sirven mediante el workflow `Deploy to GitHub Pages` al actualizar `main`. Los compañeros pueden entrar con un perfil mock sin cuenta de GitHub. Cada navegador conserva sus propios datos; esta demo no comparte cambios entre compañeros.
