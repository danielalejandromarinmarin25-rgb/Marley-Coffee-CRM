import type { AppData, Photo } from "../types";
const DB = "marley-vendedores";
let connection: Promise<IDBDatabase> | undefined;
function database() {
  return (connection ??= new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore("state");
      request.result.createObjectStore("photos");
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  }));
}
async function access<T>(
  store: string,
  mode: IDBTransactionMode,
  operation: (s: IDBObjectStore) => IDBRequest,
): Promise<T> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, mode);
    const req = operation(tx.objectStore(store));
    tx.oncomplete = () => resolve(req.result as T);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}
export const StorageService = {
  load: (userId: string) =>
    access<AppData | undefined>("state", "readonly", (s) => s.get(userId)),
  save: (userId: string, data: AppData) =>
    access("state", "readwrite", (s) => s.put(data, userId)),
  savePhoto: (photo: Photo) =>
    access("photos", "readwrite", (s) =>
      s.put(photo, `${photo.userId}:${photo.id}`),
    ),
  getPhoto: (userId: string, id: string) =>
    access<Photo | undefined>("photos", "readonly", (s) =>
      s.get(`${userId}:${id}`),
    ),
  photos: async (userId: string, entityId: string) =>
    (await access<Photo[]>("photos", "readonly", (s) => s.getAll())).filter(
      (p) => p.userId === userId && p.entityId === entityId,
    ),
};
