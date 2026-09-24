import { createRoot } from "react-dom/client";
import App from "./app/App";
import "./styles/index.css";
createRoot(document.getElementById("root")!).render(<App />);
if ("serviceWorker" in navigator && !import.meta.env.DEV)
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./sw.js")
      .catch(() => console.warn("No fue posible preparar la recarga offline."));
  });
