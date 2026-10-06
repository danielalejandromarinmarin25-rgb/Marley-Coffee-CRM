// Worker de retiro: reemplaza al service worker offline anterior. Borra sus cachés y se
// desinstala, para que ningún navegador siga sirviendo una versión guardada de la app.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      for (const clave of await caches.keys()) await caches.delete(clave);
      await self.registration.unregister();
      for (const cliente of await self.clients.matchAll({ type: "window" })) cliente.navigate(cliente.url);
    })(),
  );
});
