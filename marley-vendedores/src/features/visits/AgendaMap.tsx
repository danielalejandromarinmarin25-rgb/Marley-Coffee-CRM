import { useState } from 'react';
import { useStore } from '../../store/AppStore';
import type { Visit } from '../../types';
export function AgendaMap({visits}:{visits:Visit[]}) {
  const {data} = useStore();
  const [selected,setSelected] = useState(visits[0]?.customerId ?? '');
  const customer = data.customers.find(c=>c.id===selected);
  if (!customer) return null;
  return <section className="card agenda-map"><label>Ubicación de la visita<select value={selected} onChange={e=>setSelected(e.target.value)}>{visits.map(v=><option key={v.id} value={v.customerId}>{data.customers.find(c=>c.id===v.customerId)?.name} · {v.time}</option>)}</select></label><iframe title={`Mapa de ${customer.name}`} loading="lazy" referrerPolicy="no-referrer" src={`https://maps.google.com/maps?q=${encodeURIComponent(customer.address)}&output=embed`}/><p className="muted">Mapa disponible con conexión. Las direcciones y visitas permanecen accesibles sin internet.</p></section>;
}
