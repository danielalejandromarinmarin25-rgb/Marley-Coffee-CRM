import React from 'react';
import { 
  Headset, 
  Send, 
  Bot, 
  User, 
  Wrench, 
  Sparkles, 
  AlertCircle, 
  PhoneCall, 
  CheckCircle2, 
  Gauge, 
  Droplet,
  Coffee
} from 'lucide-react';
import { BaristaChatMessage, Language } from '../types';
import { translations } from '../data/translations';

interface SupportViewProps {
  language: Language;
}

export const SupportView: React.FC<SupportViewProps> = ({ language }) => {
  const t = translations[language];
  const [messages, setMessages] = React.useState<BaristaChatMessage[]>([
    {
      id: 'msg-1',
      sender: 'assistant',
      text: '¡Hola! Soy tu Asesor Técnico & Maestro Tostador B2B. ¿En qué podemos apoyarte hoy en tu barra? Puedo ayudarte a calibrar molienda, revisar códigos de error en tu máquina de espresso, o verificar calidad del agua (TDS/dureza).',
      timestamp: '15:00',
      suggestedQuickActions: [
        'Calibrar Espresso Blend 1:2',
        'Falla de presión en bomba La Marzocco',
        'TDS recomendado para agua de café',
        'Solicitar visita de técnico presencial'
      ],
      isAiGenerated: true
    }
  ]);
  const [inputPrompt, setInputPrompt] = React.useState('');
  const [selectedMachine, setSelectedMachine] = React.useState('La Marzocco Linea PB 2 Grupos');
  const [waterTds, setWaterTds] = React.useState('125');
  const [isLoading, setIsLoading] = React.useState(false);
  const [technicianRequested, setTechnicianRequested] = React.useState(false);

  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputPrompt;
    if (!textToSend.trim()) return;

    const userMsg: BaristaChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customText) setInputPrompt('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai/barista-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: textToSend,
          machineModel: selectedMachine,
          waterTds: waterTds,
          coffeeOrigin: 'Espresso Blend House Reserve 86+ SCA'
        })
      });

      const data = await res.json();
      const assistantMsg: BaristaChatMessage = {
        id: `ast-${Date.now()}`,
        sender: 'assistant',
        text: data.reply || 'Diagnóstico generado con éxito.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isAiGenerated: true,
        suggestedQuickActions: data.suggestedActions
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (error) {
      const fallbackMsg: BaristaChatMessage = {
        id: `ast-${Date.now()}`,
        sender: 'assistant',
        text: 'Para tu ' + selectedMachine + ', la calibración recomendada es: 18.5g in, 37g out en 27-29 segundos a 9.1 bar y 93.5°C. Si hay canalización (channeling), usa herramienta WDT antes del tamper.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestTechnician = () => {
    setTechnicianRequested(true);
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: `tech-${Date.now()}`,
          sender: 'technician',
          text: '✓ Solicitud de Visita Técnica Registrada (#TECH-8821). Nuestro ingeniero de servicio se pondrá en contacto en los próximos 20 minutos para coordinar la visita a tu sucursal.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      setTechnicianRequested(false);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Headset className="h-6 w-6 text-[#F7BE00]" />
            {t.support.title}
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            {t.support.subtitle}
          </p>
        </div>

        <button
          onClick={handleRequestTechnician}
          disabled={technicianRequested}
          className="flex items-center gap-2 rounded-xl bg-[#DB0032] px-4 py-2 text-xs font-bold text-white hover:bg-[#b50029] transition active:scale-95 shadow-md disabled:opacity-50"
        >
          <PhoneCall className="h-4 w-4" />
          <span>{technicianRequested ? 'Registrando...' : t.support.callTechnician}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Machine & Water Context Sidebar (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          
          <div className="rounded-3xl border border-[#222222] bg-[#121212] p-5 shadow-xl">
            <h3 className="text-xs font-bold text-neutral-300 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Wrench className="h-4 w-4 text-[#F7BE00]" />
              Ficha Técnica de Equipos de la Cafetería
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] font-bold text-neutral-400 block mb-1">
                  Máquina de Espresso Comercial:
                </label>
                <select
                  value={selectedMachine}
                  onChange={(e) => setSelectedMachine(e.target.value)}
                  className="w-full rounded-xl border border-[#333333] bg-[#1a1a1a] p-2.5 text-xs text-white focus:border-[#F7BE00] focus:outline-none"
                >
                  <option value="La Marzocco Linea PB 2 Grupos">La Marzocco Linea PB 2 Grupos</option>
                  <option value="Victoria Arduino Black Eagle Gravitech">Victoria Arduino Black Eagle Gravitech</option>
                  <option value="Sanremo Cafe Racer Custom">Sanremo Cafe Racer Custom</option>
                  <option value="Nuova Simonelli Aurelia Wave">Nuova Simonelli Aurelia Wave</option>
                  <option value="Synesso MVP Hydra 3G">Synesso MVP Hydra 3G</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-neutral-400 block mb-1">
                  Lectura TDS de Agua en Barra (ppm):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={waterTds}
                    onChange={(e) => setWaterTds(e.target.value)}
                    className="w-full rounded-xl border border-[#333333] bg-[#1a1a1a] p-2 text-xs text-white focus:border-[#5E7E29] focus:outline-none font-mono"
                  />
                  <span className="text-[11px] text-[#5E7E29] font-bold">Óptimo: 120-150</span>
                </div>
              </div>

              <div className="rounded-xl bg-[#0c0c0c] p-3 border border-[#222222] text-[11px] text-neutral-400 space-y-1">
                <p>• Presión caldera: <strong>9.0 Bares</strong></p>
                <p>• Temp. infusión: <strong>93.4°C</strong></p>
                <p>• Filtros de ósmosis: <strong>Activos (85% vida)</strong></p>
              </div>
            </div>
          </div>

          {/* Quick FAQ buttons */}
          <div className="rounded-3xl border border-[#222222] bg-[#121212] p-5 shadow-xl">
            <h3 className="text-xs font-bold text-neutral-300 uppercase tracking-wider mb-2.5">
              Consultas Rápidas Frecuentes:
            </h3>
            <div className="space-y-1.5">
              {[
                '¿Cómo corregir sabor amargo/sobre-extraído?',
                '¿Cómo purgar y descalcificar lanceta de vapor?',
                'Ratio recomendado para Cold Brew 1:8',
                'Calibrar molino Mahlkönig EK43'
              ].map((query, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(query)}
                  className="w-full rounded-xl border border-[#222222] bg-[#161616] p-2 text-left text-xs text-neutral-300 hover:border-[#F7BE00] hover:text-white transition truncate block"
                >
                  {query}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Live Chat Window (8 cols) */}
        <div className="lg:col-span-8 rounded-3xl border border-[#222222] bg-[#121212] p-5 sm:p-6 shadow-xl flex flex-col justify-between h-[600px]">
          
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[#222222]">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#F7BE00] text-black">
                <Bot className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                  <span>Asistente Maestro Barista & Técnico</span>
                  <span className="rounded bg-[#5E7E29]/20 text-[#5E7E29] text-[9px] px-1.5 py-0.5 font-bold uppercase">
                    En Vivo
                  </span>
                </h3>
                <p className="text-[10px] text-neutral-400">
                  Respaldo técnico 24/7 para tu equipo de barra y mantenimiento preventivo
                </p>
              </div>
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto py-4 space-y-3.5 pr-2 no-scrollbar">
            {messages.map((msg) => {
              const isAssistant = msg.sender === 'assistant' || msg.sender === 'technician';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isAssistant ? 'items-start' : 'items-end'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-[#F7BE00] text-black font-medium rounded-tr-none'
                        : msg.sender === 'technician'
                        ? 'bg-[#5E7E29] text-white font-bold rounded-tl-none'
                        : 'bg-[#1c1c1c] text-neutral-200 border border-[#2a2a2a] rounded-tl-none'
                    }`}
                  >
                    <p className="whitespace-pre-line">{msg.text}</p>
                    <span
                      className={`text-[9px] mt-1.5 block text-right font-mono ${
                        msg.sender === 'user' ? 'text-neutral-800' : 'text-neutral-500'
                      }`}
                    >
                      {msg.timestamp}
                    </span>
                  </div>

                  {/* Quick Action suggestions */}
                  {msg.suggestedQuickActions && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {msg.suggestedQuickActions.map((act, i) => (
                        <button
                          key={i}
                          onClick={() => handleSendMessage(act)}
                          className="rounded-lg border border-[#333333] bg-[#161616] px-2.5 py-1 text-[11px] text-neutral-300 hover:border-[#F7BE00] hover:text-white transition"
                        >
                          {act}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {isLoading && (
              <div className="flex items-center gap-2 text-xs text-neutral-400 font-mono">
                <Sparkles className="h-4 w-4 text-[#F7BE00] animate-spin" />
                <span>Generando asesoría técnica con IA...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="pt-3 border-t border-[#222222] flex items-center gap-2"
          >
            <input
              type="text"
              placeholder={t.support.askAssistant}
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              className="flex-1 rounded-2xl border border-[#333333] bg-[#161616] px-4 py-3 text-xs text-white placeholder-neutral-500 focus:border-[#F7BE00] focus:outline-none"
            />
            <button
              type="submit"
              disabled={isLoading || !inputPrompt.trim()}
              className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F7BE00] text-black hover:bg-[#e0ac00] transition active:scale-95 disabled:opacity-50 shadow-md shrink-0"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>

        </div>

      </div>

    </div>
  );
};
