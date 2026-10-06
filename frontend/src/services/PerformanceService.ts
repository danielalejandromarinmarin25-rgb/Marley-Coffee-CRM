import type { AppData } from '../types';
export function performance(data:AppData) {
  const orders = data.orders.filter(o => o.id.startsWith('TMP') && o.syncStatus === 'SYNCED');
  return {...data.metrics, sales:data.metrics.sales + orders.reduce((total,o)=>total+o.total,0), orders:data.metrics.orders+orders.length};
}
