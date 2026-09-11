# Prompt profesional · Marley Conecta B2B

Actúa como un equipo senior de producto, diseño UX/UI y desarrollo web. Construye una aplicación responsive y funcional llamada Marley Conecta B2B, destinada a una propuesta académica para Marley Coffee Chile. No diseñes una landing page: abre directamente el portal de trabajo del cliente. Usa el brief siguiente como especificación.

## 1. Objetivo y alcance
Facilitar la recompra, la continuidad del servicio y la comunicación entre cliente, vendedor y soporte. La retención es un resultado a evaluar, no una promesa garantizada por usar una aplicación. La propuesta integra app, CRM y gestión comercial. No confundas los canales comerciales Horeca, OCS, Conveniencia y Panaderías con los puntos de contacto app, WhatsApp, correo y ejecutivo.
Entrega primero un prototipo navegable completo. Usa datos ficticios explícitamente identificados, precios referenciales y acciones de demostración. No simules una integración real ni confirmes despachos, pagos o mensajes externos que no hayan ocurrido. No incluyas credenciales reales. Conserva el proyecto original si trabajas sobre una nueva versión.

## 2. Usuarios
Cliente: dueño o encargado de compra, con distintos niveles de habilidad digital. Necesita pedir rápido, conocer la entrega y conseguir ayuda.
Ejecutivo: necesita ver cuentas, pedidos, casos abiertos y próximas acciones sin pedir al cliente que repita antecedentes.
La vista de ejecutivo del prototipo debe estar claramente marcada como demostración. En producción, cada rol requiere autenticación y permisos de servidor por empresa y sucursal; un selector visual no constituye seguridad.

## 3. Dirección visual
Diseño claro, cálido y profesional, con identidad de café. Fondo #F7F7F2, superficies #FFFFFF, texto principal #202A24, secundario #5F6962, bordes #E1E5DE. Verde profundo #173E2D para navegación y encabezados; amarillo #F7BE00 para la acción principal, siempre con texto oscuro. Verde de éxito y rojo de error únicamente para estados, acompañados de texto e iconos. Estos colores son una propuesta, pendientes de validar con manual oficial; no los declares oficiales.
Tipografía Inter si está disponible, con fallback system-ui y sans-serif. Cuerpo 16px, etiquetas regulares 14px o más, títulos 24–34px; evita mayúsculas prolongadas. Interlineado 1,5. Espaciado basado en 8px. Tarjetas con radios 16–20px, sombra discreta y bordes suaves. Botones y zonas táctiles de al menos 44px. Foco visible y contraste legible. Respeta movimiento reducido.
No inventes un logo oficial, certificaciones, disponibilidad de productos o fotografías oficiales. En ausencia de activos aprobados, usa marca tipográfica descriptiva y datos de ejemplo sin representarlos como material oficial.

## 4. Arquitectura de información
Cinco áreas principales: Inicio, Pedidos, Ayuda, Mi vendedor y Mi cuenta. Navegación lateral en escritorio e inferior con icono y texto en móvil. Evita más menús y métricas financieras en Inicio. Carrito accesible, sucursal visible y una acción principal inequívoca: Hacer pedido.
Inicio: saludo breve, próxima entrega con estado y fecha, compra habitual que pueda revisarse y repetirse, acceso al vendedor y caso pendiente. Mostrar recordatorios pertinentes, no grandes alarmas sin evidencia. Una falla crítica puede tener prioridad sobre sugerencias comerciales.

## 5. Pedidos
Catálogo con búsqueda y filtro sencillo; nombre completo, formato, precio referencial neto en CLP y cantidad. Permitir agregar, reducir o quitar productos. No esconder controles esenciales detrás de gestos.
Flujo de tres pasos: elegir productos; revisar cantidades, subtotal, IVA referencial 19% y total; confirmar sucursal/dirección y condición de entrega. Validar carrito no vacío y cantidades positivas. Repetir un pedido abre revisión con condiciones actuales, nunca compra inmediatamente.
Al enviar, crear una solicitud de demostración con identificador, fecha y estado Pendiente de confirmación. El usuario puede consultar su detalle y seguimiento. No prometer stock o fecha confirmada desde una estimación. Mostrar estados vacíos útiles.

## 6. Ayuda técnica
Formulario con equipo de la sucursal, tipo de problema, descripción y nivel de impacto (operación detenida o consulta). Permitir fotografía con límites claros y vista previa; aclarar su tratamiento local en el prototipo. En producción, subir mediante servicio autenticado con permisos y validación.
Crear caso con identificador, responsable o Pendiente de asignación, estado e historial. Mostrar próxima acción. Diferenciar acuse automático de primera respuesta técnica efectiva. QR de equipo es extensión prevista: no uses un icono como si fuera un escáner funcional. Permitir selección manual del equipo desde el primer prototipo. No ofrecer control remoto ni cambio automático de máquinas.

## 7. Comunicación
Mi vendedor: perfil ficticio identificado, horario, consultas comerciales y conversación de demostración vinculada a una referencia de pedido o caso cuando corresponda. No fabricar teléfono, enlace WhatsApp o correo funcional. Mensajes de prueba quedan en el prototipo y nunca se presentan como entregados a Marley Coffee.
Vista ejecutiva: cuentas de ejemplo, solicitudes creadas durante la sesión, casos y próximas acciones. Permitir responder casos y actualizar estados de demostración con historial. Marcar señales de riesgo como orientativas sujetas a revisión humana; no afirmar riesgo predictivo validado.

## 8. Cuenta y personalización
Datos ficticios de negocio chileno, sucursal, dirección, canal y preferencias. Evita RFC, CFDI, SAT, México y USD. No solicites RUT real ni información sensible para una demostración. Ofrece preferencias de recordatorios e indicaciones claras de guardado local si usas almacenamiento de navegador. No uses localStorage como sustituto de una base de datos compartida ni para secretos.
Adapta contenido por necesidad del canal, sin crear cuatro aplicaciones: Horeca recompra y continuidad; OCS reposición por sede; Conveniencia seguimiento por punto; Panaderías pedidos simples y capacitación breve. Las necesidades inferidas deben validarse con usuarios antes de escalar.

## 9. Interacciones y accesibilidad
Todos los botones deben realizar una acción coherente. Diálogos accesibles con cierre, foco y navegación de teclado. Inputs con etiquetas, validación y mensajes claros. Evita truncar nombres esenciales. Admite móvil de 360px sin desbordamiento horizontal y escritorio amplio. Los swipes son opcionales para contenido complementario: siempre conserva botones equivalentes. Confirma acciones irreversibles. No añadas pantallas de 2FA falsas ni aceptes códigos arbitrarios.

## 10. Arquitectura real prevista
App: captura solicitudes y muestra información autorizada. CRM: ficha única, ejecutivo, historial, tareas y preferencias. Sistema operacional: disponibilidad, precios autorizados y despachos. Tickets: prioridad, responsable, atención y resolución. Una solicitud mantiene el mismo identificador entre puntos de contacto.
Producción requiere autenticación real, permisos por empresa/sucursal, persistencia central, almacenamiento seguro de adjuntos, validación del servidor, auditoría e integraciones autorizadas. API keys solo en servidor. No crees conexiones ni envíes comunicaciones sin configuración y autorización. Documenta la diferencia entre lo implementado y lo pendiente.

## 11. Métricas y prueba de la propuesta
Medir tareas completadas sin ayuda, tiempo para repetir pedido y esfuerzo posterior a atención. Piloto: reposición digital, primera respuesta efectiva, tiempo hasta restablecimiento y retención de la cohorte inicial. No atribuyas causalidad automáticamente al CRM. Las metas deben distinguirse de resultados observados. No muestres tableros con mejoras inventadas.

## 12. Entregables y aceptación
Entrega código editable, prompt reutilizable, prototipo navegable y notas de alcance. Comprueba sintaxis, referencias de archivos y las reglas de pedido y ticket. El usuario debe poder agregar dos productos, ajustar cantidades, revisar total, enviar una solicitud, encontrarla en su historial, reportar una falla y consultar su seguimiento. La vista comercial de demostración debe reflejar esos registros en la misma sesión. No hay mensajes enviados ni pedidos reales.
Prioriza coherencia, legibilidad y utilidad sobre número de módulos, gamificación, inteligencia artificial o paneles decorativos.
