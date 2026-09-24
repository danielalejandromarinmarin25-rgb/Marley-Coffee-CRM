import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type {
  AppData,
  EntityType,
  User,
  SyncItem,
  Order,
  Photo,
} from "../types";
import { seed } from "../mocks/data";
import { StorageService } from "../repositories/storage";
import { MockAdapter } from "../services/adapters";
import { SyncService } from "../services/SyncService";
import { uid } from "../utils/domain";
type Store = {
  data: AppData;
  user: User;
  online: boolean;
  syncing: boolean;
  persistenceError: boolean;
  expired: boolean;
  setExpired: (v: boolean) => void;
  toast: string;
  notify: (text: string) => void;
  update: (fn: (d: AppData) => AppData) => Promise<void>;
  save: (type: EntityType, entity: unknown, activity?: string) => Promise<void>;
  sync: () => Promise<void>;
  setOffline: (v: boolean) => void;
  mockOffline: boolean;
  addPhoto: (file: File, customerId: string, entityId: string) => Promise<void>;
};
const Context = createContext<Store | null>(null);
export function Provider({
  user,
  children,
}: {
  user: User;
  children: ReactNode;
}) {
  const [data, setData] = useState<AppData>();
  const ref = useRef<AppData>(undefined);
  const [error, setError] = useState("");
  const [persistenceError, setPersistenceError] = useState(false);
  const [toast, notify] = useState("");
  const [connected, setConnected] = useState(navigator.onLine);
  const [mockOffline, changeOffline] = useState(() => localStorage.getItem(`marley-vendedores-offline:${user.id}`) === "true");
  function setOffline(value: boolean) { localStorage.setItem(`marley-vendedores-offline:${user.id}`, String(value)); changeOffline(value); }
  const [syncing, setSyncing] = useState(false);
  const busy = useRef(false);
  const [expired, setExpired] = useState(false);
  const writes = useRef(Promise.resolve());
  const online = connected && !mockOffline;
  useEffect(() => {
    StorageService.load(user.id)
      .then(async (saved) => {
        const value = saved ?? seed(user);
        value.queue = value.queue.map((q) =>
          q.status === "SYNCING" ? { ...q, status: "PENDING" } : q,
        );
        await StorageService.save(user.id, value);
        ref.current = value;
        setData(value);
      })
      .catch(() =>
        setError(
          "No pudimos abrir el almacenamiento local. Habilita el almacenamiento del navegador y vuelve a intentar.",
        ),
      );
  }, [user.id]);
  useEffect(() => {
    const updateConnection = () => setConnected(navigator.onLine);
    window.addEventListener("online", updateConnection);
    window.addEventListener("offline", updateConnection);
    return () => {
      window.removeEventListener("online", updateConnection);
      window.removeEventListener("offline", updateConnection);
    };
  }, []);
  useEffect(() => {
    if (toast) {
      const id = setTimeout(() => notify(""), 5000);
      return () => clearTimeout(id);
    }
  }, [toast]);
  function update(fn: (d: AppData) => AppData): Promise<void> {
    const work = writes.current.then(async () => {
      if (!ref.current) return;
      const next = fn(ref.current);
      try {
        await StorageService.save(user.id, next);
        setPersistenceError(false);
        ref.current = next;
        setData(next);
      } catch (e) {
        setPersistenceError(true);
        notify(
          "No se pudo guardar en este dispositivo. Conserva esta ventana abierta y reintenta.",
        );
        throw e;
      }
    });
    writes.current = work.catch(() => {});
    return work;
  }
  async function save(type: EntityType, entity: unknown, activity?: string) {
    const entry = entity as { id: string; customerId: string };
    if (!user.assignedCustomers.includes(entry.customerId))
      throw new Error("Cliente fuera de cartera");
    const item: SyncItem = {
      id: uid("sync"),
      entityType: type,
      entityId: entry.id,
      operation: type === "photos" ? "UPLOAD" : ref.current?.[type].some(e => e.id === entry.id) ? "UPDATE" : "CREATE",
      payload: { ...entry, syncStatus: "PENDING" },
      createdAt: new Date().toISOString(),
      status: "PENDING",
      retryCount: 0,
      userId: user.id,
    };
    await update((d) => {
      const next = {
        ...d,
        queue: [
          ...d.queue.filter(
            (q) => !(q.entityId === entry.id && q.status === "PENDING"),
          ),
          item,
        ],
      };
      if (type !== "photos") {
        const list = d[type] as unknown as { id: string }[];
        (next[type] as unknown) = list.some((e) => e.id === entry.id)
          ? list.map((e) => (e.id === entry.id ? item.payload : e))
          : [item.payload, ...list];
      }
      if (activity) {
        const a = {
          id: uid("act"),
          customerId: entry.customerId,
          type: type,
          comment: activity,
          createdAt: new Date().toISOString(),
        };
        next.activities = [a, ...d.activities];
        next.queue.push({
          ...item,
          id: uid("sync"),
          entityType: "activities",
          entityId: a.id,
          payload: a,
          operation: "CREATE",
        });
      }
      return next;
    });
    notify(
      online
        ? "Guardado en este dispositivo"
        : "Guardado sin conexión · pendiente de envío",
    );
  }
  async function sync() {
    if (!online || expired || busy.current || !ref.current) return;
    busy.current = true;
    setSyncing(true);
    const adapter = new MockAdapter(() => ref.current!);
    try {
      const pending = SyncService.eligible(ref.current.queue);
      for (const item of pending) {
        // A newer edit may have replaced this pending item while another item was being sent.
        if (!ref.current.queue.some(q => q.id === item.id)) continue;
        await update((d) => ({
          ...d,
          queue: d.queue.map((q) =>
            q.id === item.id ? { ...q, status: "SYNCING" } : q,
          ),
        }));
        try {
          if (item.entityType === "photos") {
            const photo = await StorageService.getPhoto(user.id, item.entityId);
            if (photo) await StorageService.savePhoto({...photo, status: "UPLOADING"});
          }
          const result = await adapter.execute(item, user);
          if (item.entityType === "photos") {
            const photo = await StorageService.getPhoto(user.id, item.entityId);
            if (photo)
              await StorageService.savePhoto({ ...photo, status: "UPLOADED" });
          }
          await update((d) => {
            const next = {
              ...d,
              queue: d.queue.map((q) =>
                q.id === item.id
                  ? { ...q, status: result.status, error: result.message }
                  : q,
              ),
            };
            if (
              item.entityType !== "photos" &&
              item.entityType !== "activities" &&
              !d.queue.some(q => q.entityId === item.entityId && q.id !== item.id && q.status === "PENDING")
            ) {
              const list = d[item.entityType] as { id: string }[];
              (next[item.entityType] as unknown) = list.map((e) =>
                e.id === item.entityId
                  ? {
                      ...e,
                      syncStatus: result.status,
                      ...(item.entityType === "orders"
                        ? {
                            serverId: result.serverId,
                            status:
                              result.status === "NEEDS_REVIEW"
                                ? "Requiere revisión"
                                : "Registrado",
                          }
                        : {}),
                    }
                  : e,
              );
            }
            if (
              item.entityType === "orders" &&
              !next.notifications.some((n) => n.id === `sync-${item.id}`)
            )
              next.notifications = [
                {
                  id: `sync-${item.id}`,
                  title:
                    result.status === "NEEDS_REVIEW"
                      ? "Pedido requiere revisión"
                      : "Pedido registrado en la demostración",
                  type: "Sincronización",
                  route: `/pedidos/${item.entityId}`,
                  read: false,
                  createdAt: new Date().toISOString(),
                },
                ...d.notifications,
              ];
            return next;
          });
        } catch (e) {
          if ((e as Error).message === "SESSION_EXPIRED") {
            setExpired(true);
            await update((d) => ({
              ...d,
              queue: d.queue.map((q) =>
                q.id === item.id ? { ...q, status: "PENDING" } : q,
              ),
            }));
            break;
          }
          if (item.entityType === "photos") {
            const photo = await StorageService.getPhoto(user.id, item.entityId);
            if (photo)
              await StorageService.savePhoto({ ...photo, status: "FAILED" });
          }
          await update((d) => ({
            ...d,
            queue: d.queue.map((q) =>
              q.id === item.id
                ? {
                    ...q,
                    status: "FAILED",
                    retryCount: q.retryCount + 1,
                    nextRetryAt: SyncService.nextRetry(q.retryCount),
                    error:
                      "No pudimos sincronizar este cambio. Tus datos siguen guardados en este dispositivo.",
                  }
                : q,
            ),
          }));
        }
      }
    } finally {
      busy.current = false;
      setSyncing(false);
    }
  }
  useEffect(() => {
    if (data && online && !expired) {
      void sync();
      const timer = setInterval(() => void sync(), 10000);
      return () => clearInterval(timer);
    }
  }, [
    online,
    expired,
    data?.queue.filter((q) => q.status === "PENDING").length,
  ]);
  async function addPhoto(file: File, customerId: string, entityId: string) {
    if (!file.type.startsWith("image/") || file.size > 10 * 1024 * 1024) {
      notify("Elige una imagen de hasta 10 MB.");
      return;
    }
    const photo: Photo = {
      id: uid("photo"),
      userId: user.id,
      customerId,
      entityId,
      name: file.name,
      blob: file,
      status: "PENDING",
    };
    await StorageService.savePhoto(photo);
    await save("photos", photo, "Fotografía guardada");
  }
  if (error)
    return (
      <main className="login">
        <h1>No pudimos iniciar</h1>
        <p>{error}</p>
        <button onClick={() => location.reload()}>Reintentar</button>
      </main>
    );
  if (!data)
    return (
      <main className="login" role="status">
        Preparando tu cartera…
      </main>
    );
  return (
    <Context.Provider
      value={{
        data,
        user,
        online,
        syncing,
        persistenceError,
        expired,
        setExpired,
        toast,
        notify,
        update,
        save,
        sync,
        setOffline,
        mockOffline,
        addPhoto,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export const useStore = () => {
  const value = useContext(Context);
  if (!value) throw new Error("Store unavailable");
  return value;
};
