import { useEffect, useState } from "react";
import { useStore } from "../store/AppStore";
import { StorageService } from "../repositories/storage";
import type { Photo } from "../types";
export function Photos({
  customerId,
  entityId,
}: {
  customerId: string;
  entityId: string;
}) {
  const { user, addPhoto, data, sync } = useStore();
  const [photos, setPhotos] = useState<(Photo & { url: string })[]>([]);
  const [version, setVersion] = useState(0);
  useEffect(() => {
    let active = true;
    let urls: string[] = [];
    StorageService.photos(user.id, entityId).then((list) => {
      const items = list.map((p) => ({
        ...p,
        url: URL.createObjectURL(p.blob),
      }));
      urls = items.map((p) => p.url);
      if (active) setPhotos(items);
      else urls.forEach(URL.revokeObjectURL);
    });
    return () => {
      active = false;
      urls.forEach(URL.revokeObjectURL);
    };
  }, [user.id, entityId, version, data.queue]);
  return (
    <div>
      <label>
        Fotografías de la gestión
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={async (e) => {
            for (const f of Array.from(e.target.files ?? []))
              await addPhoto(f, customerId, entityId);
            setVersion((v) => v + 1);
          }}
        />
      </label>
      <small>Hasta 10 MB por imagen. Se conservan en este dispositivo.</small>
      <div className="photo-grid">
        {photos.map((p) => (
          <div key={p.id}>
            <a href={p.url} target="_blank" rel="noreferrer">
              <img src={p.url} alt={p.name} />
            </a>
            <small>
              {p.status === "UPLOADED"
                ? "Procesada · demo"
                : p.status === "FAILED"
                  ? "No se pudo subir una fotografía"
                  : "Guardada localmente"}
            </small>
            {p.status === "FAILED" && (
              <button type="button" onClick={() => void sync()}>Reintentar</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
