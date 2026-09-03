import React from 'react';
import { 
  CalendarClock, 
  CheckCircle, 
  Bell, 
  Sparkles, 
  AlertTriangle, 
  Play, 
  Pause, 
  Plus, 
  Trash2, 
  Flame, 
  Clock, 
  Calendar,
  CheckCircle2,
  RefreshCw,
  Send
} from 'lucide-react';
import { ReplenishmentSchedule, Product, Language } from '../types';
import { translations } from '../data/translations';

interface ReplenishmentViewProps {
  schedules: ReplenishmentSchedule[];
  products: Product[];
  language: Language;
  onUpdateSchedule: (updated: ReplenishmentSchedule) => void;
  onDeleteSchedule: (id: string) => void;
  onAddSchedule: (schedule: Omit<ReplenishmentSchedule, 'id'>) => void;
  onSimulatePushNotification: () => void;
}

export const ReplenishmentView: React.FC<ReplenishmentViewProps> = ({
  schedules,
  products,
  language,
  onUpdateSchedule,
  onDeleteSchedule,
  onAddSchedule,
  onSimulatePushNotification
}) => {
  const t = translations[language];
  const [selectedDayFilter, setSelectedDayFilter] = React.useState<string>('all');
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [selectedProductId, setSelectedProductId] = React.useState<string>(products[0]?.id || '');
  const [newQuantity, setNewQuantity] = React.useState<number>(3);
  const [selectedDays, setSelectedDays] = React.useState<string[]>(['Martes', 'Viernes']);
  const [autoDispatch, setAutoDispatch] = React.useState<boolean>(true);
  const [reminderHours, setReminderHours] = React.useState<number>(12);

  // Daily Cups Burn Rate Calculator State
  const [dailyEspressoCups, setDailyEspressoCups] = React.useState<number>(350);
  const [doseGrams, setDoseGrams] = React.useState<number>(18.5);
  const [isCalculatingAI, setIsCalculatingAI] = React.useState<boolean>(false);
  const [aiAnalysis, setAiAnalysis] = React.useState<string | null>(null);

  const daysOfWeek = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  // Calculated daily coffee kg
  const estimatedDailyKg = ((dailyEspressoCups * doseGrams) / 1000).toFixed(2);
  const estimatedWeeklyKg = (Number(estimatedDailyKg) * 7).toFixed(1);

  const handleToggleDay = (day: string) => {
    if (selectedDays.includes(day)) {
      if (selectedDays.length > 1) {
        setSelectedDays(selectedDays.filter((d) => d !== day));
      }
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const handleCreateSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    const product = products.find((p) => p.id === selectedProductId);
    if (!product) return;

    onAddSchedule({
      productId: product.id,
      productName: product.name,
      quantity: newQuantity,
      unit: product.unit,
      frequency: 'dias_especificos',
      scheduledDays: selectedDays as any,
      autoDispatch: autoDispatch,
      lastDispatchDate: '2026-08-28',
      nextDispatchDate: '2026-09-02',
      reminderHoursBefore: reminderHours,
      status: 'active'
    });

    setShowAddModal(false);
  };

  const handleRunAiStockForecast = async () => {
    setIsCalculatingAI(true);
    try {
      const res = await fetch('/api/ai/stock-forecast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dailyConsumptionKg: Number(estimatedDailyKg),
          currentStockKg: 14.5,
          deliveryDays: selectedDays.join(' y '),
          peakDays: 'Sábados y Domingos'
        })
      });
      const data = await res.json();
      setAiAnalysis(data.analysis || data.summary || "Proyección generada con éxito.");
    } catch (err) {
      setAiAnalysis(`A tu ritmo de ${estimatedDailyKg} kg/día, se proyectan 2.4 días de cobertura restante. Se aconseja despachar un lote de ${estimatedWeeklyKg} kg este martes.`);
    } finally {
      setIsCalculatingAI(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Title & Push Simulation Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <CalendarClock className="h-6 w-6 text-[#F7BE00]" />
            {t.replenishment.title}
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            {t.replenishment.subtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onSimulatePushNotification}
            className="flex items-center gap-2 rounded-xl border border-[#F7BE00]/50 bg-[#F7BE00]/10 px-3.5 py-2 text-xs font-bold text-[#F7BE00] hover:bg-[#F7BE00]/20 transition"
            title="Envía una notificación push de recordatorio de despacho para confirmar en 1 clic"
          >
            <Bell className="h-4 w-4" />
            <span>{t.replenishment.simulateNotification}</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 rounded-xl bg-[#F7BE00] px-4 py-2 text-xs font-bold text-black hover:bg-[#e0ac00] shadow-md transition active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>{t.replenishment.addNewItem}</span>
          </button>
        </div>
      </div>

      {/* Interactive Weekday Matrix: Select Recurring Delivery Days */}
      <div className="rounded-3xl border border-[#222222] bg-[#121212] p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-[#222222]">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Calendar className="h-4 w-4 text-[#5E7E29]" />
              Días Fijos de Reposición en Tostaduría
            </h2>
            <p className="text-xs text-neutral-400">
              Marca los días de la semana en que tu cafetería recibe despachos para asegurar tueste fresco.
            </p>
          </div>
          <span className="rounded-full bg-[#5E7E29]/20 px-3 py-1 text-[11px] font-bold text-[#5E7E29] border border-[#5E7E29]/40 self-start md:self-auto">
            Garantía Sin Quiebre de Stock
          </span>
        </div>

        {/* Days Buttons Grid */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
          {daysOfWeek.map((day) => {
            const hasSchedules = schedules.some((s) => s.scheduledDays.includes(day as any));
            return (
              <div
                key={day}
                className={`flex flex-col justify-between rounded-2xl p-3.5 border transition ${
                  hasSchedules
                    ? 'border-[#F7BE00] bg-[#1c1809]'
                    : 'border-[#222222] bg-[#161616] opacity-75'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-sm text-white">
                    {day}
                  </span>
                  {hasSchedules ? (
                    <CheckCircle2 className="h-4 w-4 text-[#F7BE00]" />
                  ) : (
                    <span className="h-2 w-2 rounded-full bg-neutral-700"></span>
                  )}
                </div>

                <div className="mt-3">
                  <span className="text-[10px] text-neutral-400 block">
                    {hasSchedules ? 'Despacho Activo' : 'Sin entrega'}
                  </span>
                  <span className="text-xs font-mono font-bold text-neutral-200">
                    {hasSchedules
                      ? `${schedules.filter((s) => s.scheduledDays.includes(day as any)).length} insumos`
                      : '-'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Burn Rate Calculator & AI Stock Loss Forecasting */}
      <div className="rounded-3xl border border-[#222222] bg-gradient-to-br from-[#121212] to-[#0c0c0c] p-5 sm:p-6">
        <div className="flex items-center justify-between pb-4 border-b border-[#222222]">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Flame className="h-4 w-4 text-[#DB0032]" />
              Calculadora Predictiva de Tasa de Consumo & Anti-Quiebre
            </h2>
            <p className="text-xs text-neutral-400">
              Calcula exactamente cuánto café y leche consumes al día para programar reposiciones perfectas
            </p>
          </div>
          <button
            onClick={handleRunAiStockForecast}
            disabled={isCalculatingAI}
            className="flex items-center gap-1.5 rounded-xl bg-[#5E7E29] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#4d6921] transition active:scale-95 disabled:opacity-50"
          >
            <Sparkles className={`h-3.5 w-3.5 ${isCalculatingAI ? 'animate-spin' : ''}`} />
            <span>{isCalculatingAI ? 'Analizando...' : 'Calcular con IA'}</span>
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Daily Cups Slider */}
          <div className="rounded-2xl border border-[#222222] bg-[#161616] p-4">
            <label className="text-xs font-bold text-neutral-300 block mb-1">
              Tazas de Café / Día en Barra:
            </label>
            <div className="flex items-center justify-between text-lg font-mono font-extrabold text-[#F7BE00] mb-2">
              <span>{dailyEspressoCups} tazas</span>
              <span className="text-xs font-normal text-neutral-400">~{estimatedDailyKg} kg/día</span>
            </div>
            <input
              type="range"
              min="50"
              max="1000"
              step="25"
              value={dailyEspressoCups}
              onChange={(e) => setDailyEspressoCups(Number(e.target.value))}
              className="w-full accent-[#F7BE00]"
            />
          </div>

          {/* Dose in Grams */}
          <div className="rounded-2xl border border-[#222222] bg-[#161616] p-4">
            <label className="text-xs font-bold text-neutral-300 block mb-1">
              Dosis Portafiltro Doble:
            </label>
            <div className="flex items-center justify-between text-lg font-mono font-extrabold text-white mb-2">
              <span>{doseGrams} gramos</span>
              <span className="text-xs font-normal text-neutral-400">Ratio 1:2</span>
            </div>
            <input
              type="range"
              min="14"
              max="22"
              step="0.5"
              value={doseGrams}
              onChange={(e) => setDoseGrams(Number(e.target.value))}
              className="w-full accent-[#5E7E29]"
            />
          </div>

          {/* Weekly Consumption Projection */}
          <div className="rounded-2xl border border-[#222222] bg-[#161616] p-4 flex flex-col justify-between">
            <span className="text-xs font-bold text-neutral-400 uppercase">
              Necesidad Semanal de Tueste
            </span>
            <div className="mt-1">
              <span className="text-2xl font-black text-white font-mono">
                {estimatedWeeklyKg} kg
              </span>
              <span className="text-xs text-[#5E7E29] block font-semibold">
                Sugerido: 2 entregas de {(Number(estimatedWeeklyKg) / 2).toFixed(1)} kg
              </span>
            </div>
          </div>

        </div>

        {/* AI Analysis Card */}
        {aiAnalysis && (
          <div className="mt-4 rounded-2xl border border-[#5E7E29]/40 bg-[#5E7E29]/10 p-4 text-xs leading-relaxed text-neutral-200">
            <div className="flex items-center gap-2 font-bold text-[#5E7E29] mb-1">
              <Sparkles className="h-4 w-4" />
              Recomendación Logística de la Tostaduría (IA):
            </div>
            <p className="whitespace-pre-line text-neutral-300">{aiAnalysis}</p>
          </div>
        )}
      </div>

      {/* Active Standing Subscriptions List */}
      <div className="rounded-3xl border border-[#222222] bg-[#121212] p-5 sm:p-6">
        <h2 className="text-base font-bold text-white mb-4">
          Insumos en Calendario de Reposición ({schedules.length})
        </h2>

        <div className="space-y-3">
          {schedules.map((schedule) => {
            const isPaused = schedule.status === 'paused';
            return (
              <div
                key={schedule.id}
                className={`flex flex-col md:flex-row md:items-center justify-between rounded-2xl border p-4 transition ${
                  isPaused
                    ? 'border-[#222222] bg-[#141414] opacity-60'
                    : 'border-[#262626] bg-[#171717]'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-white">
                      {schedule.productName}
                    </h3>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        isPaused
                          ? 'bg-neutral-800 text-neutral-400'
                          : 'bg-[#5E7E29]/20 text-[#5E7E29] border border-[#5E7E29]/30'
                      }`}
                    >
                      {isPaused ? 'Pausado' : 'Piloto Automático Activo'}
                    </span>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-neutral-400">
                    <span className="font-mono font-bold text-white">
                      Cantidad: {schedule.quantity} {schedule.unit}
                    </span>
                    <span>•</span>
                    <span className="text-[#F7BE00] font-semibold">
                      Días: {schedule.scheduledDays.join(', ')}
                    </span>
                    <span>•</span>
                    <span>
                      Próxima Entrega: <strong className="text-neutral-200">{schedule.nextDispatchDate}</strong>
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-3 md:mt-0 flex items-center gap-2 self-end md:self-auto">
                  <button
                    onClick={() =>
                      onUpdateSchedule({
                        ...schedule,
                        status: isPaused ? 'active' : 'paused'
                      })
                    }
                    className={`flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                      isPaused
                        ? 'bg-[#5E7E29] text-white hover:bg-[#4d6921]'
                        : 'border border-[#333333] bg-[#1f1f1f] text-neutral-300 hover:text-white'
                    }`}
                  >
                    {isPaused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
                    <span>{isPaused ? 'Reanudar' : 'Pausar'}</span>
                  </button>

                  <button
                    onClick={() => onDeleteSchedule(schedule.id)}
                    className="rounded-xl border border-[#DB0032]/30 bg-[#DB0032]/10 p-2 text-[#DB0032] hover:bg-[#DB0032] hover:text-white transition"
                    title="Eliminar de reposición"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal to Add Schedule */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-3xl border border-[#2a2a2a] bg-[#141414] p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-[#F7BE00]" />
              Programar Reposición Recurrente
            </h3>
            <p className="text-xs text-neutral-400 mb-4">
              Configura entregas automáticas periódicas directamente desde tostaduría para tu cafetería.
            </p>

            <form onSubmit={handleCreateSchedule} className="space-y-4">
              
              {/* Product select */}
              <div>
                <label className="text-xs font-bold text-neutral-300 block mb-1">
                  Insumo o Grano de Café:
                </label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full rounded-xl border border-[#333333] bg-[#1a1a1a] p-2.5 text-xs text-white focus:border-[#F7BE00] focus:outline-none"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.unit})
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantity */}
              <div>
                <label className="text-xs font-bold text-neutral-300 block mb-1">
                  Cantidad por Despacho:
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={newQuantity}
                  onChange={(e) => setNewQuantity(Number(e.target.value))}
                  className="w-full rounded-xl border border-[#333333] bg-[#1a1a1a] p-2.5 text-xs text-white focus:border-[#F7BE00] focus:outline-none"
                />
              </div>

              {/* Delivery Days Selector */}
              <div>
                <label className="text-xs font-bold text-neutral-300 block mb-2">
                  Días de Entrega Semanal:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {daysOfWeek.map((day) => (
                    <button
                      type="button"
                      key={day}
                      onClick={() => handleToggleDay(day)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                        selectedDays.includes(day)
                          ? 'bg-[#F7BE00] text-black'
                          : 'bg-[#222222] text-neutral-400 hover:text-white'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              {/* Auto dispatch toggle */}
              <div className="flex items-center justify-between rounded-xl border border-[#222222] bg-[#1a1a1a] p-3">
                <div>
                  <span className="text-xs font-bold text-white block">
                    Despacho en Piloto Automático
                  </span>
                  <span className="text-[11px] text-neutral-400">
                    Se procesa y factura automáticamente sin requerir confirmación manual.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={autoDispatch}
                  onChange={(e) => setAutoDispatch(e.target.checked)}
                  className="h-4 w-4 accent-[#F7BE00]"
                />
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t border-[#222222]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl border border-[#333333] px-4 py-2 text-xs font-bold text-neutral-300 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#F7BE00] px-5 py-2 text-xs font-bold text-black hover:bg-[#e0ac00]"
                >
                  Guardar Reposición
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
