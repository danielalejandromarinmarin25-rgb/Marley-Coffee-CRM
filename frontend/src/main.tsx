import { createRoot } from "react-dom/client";
import App from "./app/App";
import "./styles/index.css";
createRoot(document.getElementById("root")!).render(<App />);

// El modo offline y su service worker quedan desactivados mientras no se necesiten: una caché
// local podría mostrar datos de otra sesión. Se retira el worker que haya quedado instalado.
if ("serviceWorker" in navigator)
  void navigator.serviceWorker.getRegistrations().then((registros) => registros.forEach((r) => void r.unregister()));
