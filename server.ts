import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini AI client
let aiClient: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// AI Barista & Technical Equipment Advisor
app.post("/api/ai/barista-assistant", async (req, res) => {
  try {
    const { prompt, machineModel, waterTds, coffeeOrigin, role } = req.body;
    const ai = getAIClient();

    if (!ai) {
      // Fallback expert technical guidance
      return res.json({
        reply: `[Modo Asesor Técnico B2B] Para ${machineModel || "equipos comerciales de espresso"} y café ${coffeeOrigin || "Especialidad Blend"}:
1. **Calibración de Molienda**: Apunta a una ratio 1:2 (ej. 18.5g in -> 37g out en 26-29 segundos a 9 bares).
2. **Presión y Temperatura**: Mantén 93.5°C estables en caldera saturada.
3. **Calidad de Agua**: Con TDS actual (~${waterTds || "120"} ppm), la dureza recomendada es 50-70 ppm CaCO3 para evitar incrustaciones de cal.
4. **Mantenimiento**: Realiza retrolavado (backflush) con detergente cada 200 extracciones y cambia juntas de grupo mensualmente.`,
        suggestedActions: ["Verificar presión de bomba", "Ajustar molienda 0.5 puntos más fina", "Programar reposición de pastillas descalcificadoras"],
        isAiGenerated: false
      });
    }

    const systemInstruction = `Eres el Maestro Tostador e Ingeniero Técnico de Café de "Café B2B".
Tu rol es asesorar a dueños de cafeterías, baristas y gerentes de compras B2B.
Ofrece respuestas claras, profesionales y precisas sobre:
- Calibración de molienda y ratios de espresso/filtro
- Diagnóstico de averías de máquinas de café comerciales (La Marzocco, Nuova Simonelli, Sanremo, Victoria Arduino)
- Conservación y rotación de stock de granos de café, leches vegetales e insumos
- Recomendaciones para evitar mermas y optimizar costes de reposición.
Usa un tono técnico pero accesible, en español.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: `Contexto de la cafetería B2B:
- Equipo: ${machineModel || "Máquina Espresso Comercial"}
- Café principal: ${coffeeOrigin || "Blend Especialidad"}
- TDS de agua: ${waterTds || "130"} ppm
- Pregunta del cliente: ${prompt}`,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    res.json({
      reply: response.text || "Asesoría generada con éxito.",
      isAiGenerated: true,
    });
  } catch (error: any) {
    console.error("Gemini API error:", error);
    res.status(500).json({
      error: "Error procesando la solicitud con el asistente.",
      fallback: "Ajuste recomendado: ratio 1:2 (18g -> 36g en 27s). Revise nivel de gas y presión de caldera a 1.2 bar."
    });
  }
});

// AI Stock Forecast & Anti-Stockout Optimization
app.post("/api/ai/stock-forecast", async (req, res) => {
  try {
    const { dailyConsumptionKg, currentStockKg, deliveryDays, peakDays } = req.body;
    const ai = getAIClient();

    const daysLeft = currentStockKg && dailyConsumptionKg ? (currentStockKg / dailyConsumptionKg).toFixed(1) : 3;

    if (!ai) {
      return res.json({
        stockHealth: Number(daysLeft) <= 2 ? "CRITICAL" : Number(daysLeft) <= 4 ? "WARNING" : "OPTIMAL",
        daysRemaining: Number(daysLeft),
        recommendedOrderDate: "Próximo martes 08:00 AM",
        recommendedOrderKg: Math.round(Number(dailyConsumptionKg || 4) * 7 * 1.15),
        summary: `A tu ritmo de consumo de ${dailyConsumptionKg || 4} kg/día, tu inventario actual (${currentStockKg || 12} kg) durará aprox. ${daysLeft} días. Sugerimos agendar reposición antes del fin de semana.`
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: `Analiza este consumo B2B de cafetería:
- Consumo diario: ${dailyConsumptionKg} kg de café
- Stock actual en bodega: ${currentStockKg} kg
- Días de entrega del proveedor: ${deliveryDays || "Martes y Viernes"}
- Días de mayor afluencia: ${peakDays || "Sábados y Domingos"}

Calcula de forma concisa:
1. Días estimados antes de quiebre de stock
2. Día y hora óptima para el próximo pedido
3. Cantidad recomendada en kg con colchón del 15% de seguridad`,
      config: {
        systemInstruction: "Eres un asesor de logística B2B para cafeterías. Sé directo y genera un análisis numérico breve.",
      }
    });

    res.json({
      analysis: response.text,
      daysRemaining: Number(daysLeft),
      stockHealth: Number(daysLeft) <= 2 ? "CRITICAL" : Number(daysLeft) <= 4 ? "WARNING" : "OPTIMAL"
    });
  } catch (error) {
    res.status(500).json({ error: "Error calculando proyección." });
  }
});

// AI Smart Reorder Suggestions based on Purchase History & Depletion
app.post("/api/ai/smart-suggestions", async (req, res) => {
  try {
    const { branch, surgeFactor, criticalItems, ordersSummary } = req.body;
    const ai = getAIClient();

    const fallbackInsight = `[Diagnóstico Logístico B2B para ${branch || "Sede Principal"}]
• **Riesgo Inmediato**: Tu stock de Espresso Blend House Reserve y Leche de Avena Barista se agotará en menos de 72 horas.
• **Recomendación de Compra**: Consolidar 30kg de Espresso Blend (-10% OFF) y 15 cajas de Leche de Avena (-18% OFF) en una sola orden para optimizar fletes y ahorrar ~$92.50 USD.
• **Patrón Detectado**: Tu historial muestra un incremento del 35% en extracciones de viernes a domingo; recomendamos fijar la entrega los martes a primera hora.`;

    if (!ai) {
      return res.json({
        insight: fallbackInsight,
        isAiGenerated: false
      });
    }

    const promptText = `Eres el Director de Suministro B2B e Inteligencia de Cadena de Suministro de Café de Especialidad.
Analiza la situación de inventario y pedidos de la cafetería:
- Sucursal: ${branch || "Sede Principal"}
- Factor de Demanda/Surge: ${surgeFactor || "1.0 (Normal)"}
- Insumos Críticos / Por Agotarse: ${JSON.stringify(criticalItems || [])}
- Resumen de Compras Históricas: ${JSON.stringify(ordersSummary || [])}

Genera un breve reporte ejecutivo (3 puntos directos y claros):
1. Diagnóstico de riesgo de desabastecimiento de insumos clave.
2. Recomendación de consolidación de pedido por volumen y ahorro estimado.
3. Consejo de optimización de frecuencia según el patrón de consumo detectado.
Usa tono profesional B2B, conciso y en español.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: promptText,
      config: {
        systemInstruction: "Eres un asesor senior de compras y logística B2B para tostadurías y cafeterías de especialidad.",
        temperature: 0.6,
      }
    });

    res.json({
      insight: response.text || fallbackInsight,
      isAiGenerated: true
    });
  } catch (error) {
    console.error("Smart suggestions AI error:", error);
    res.json({
      insight: "Diagnóstico B2B: Se recomienda reabastecer insumos críticos (Espresso Blend y Leche de Avena) antes del fin de semana para evitar quiebre de stock.",
      isAiGenerated: false
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Café B2B server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
