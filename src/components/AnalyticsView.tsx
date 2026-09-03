import React from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  PieChart as PieIcon, 
  Package, 
  Sparkles, 
  Download, 
  ArrowUpRight,
  ShieldCheck,
  Coffee
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  LineChart, 
  Line, 
  Legend 
} from 'recharts';
import { mockAnalyticsData } from '../data/mockData';
import { Language } from '../types';
import { translations } from '../data/translations';

interface AnalyticsViewProps {
  language: Language;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ language }) => {
  const t = translations[language];
  const [reportPeriod, setReportPeriod] = React.useState<'6m' | '3m' | '1y'>('6m');

  const monthlySpendHistory = mockAnalyticsData?.monthlySpendHistory || [];
  const categorySpendDistribution = mockAnalyticsData?.categorySpendDistribution || [];
  const pricePerKgEvolution = mockAnalyticsData?.pricePerKgEvolution || [];

  const totalSpent6m = monthlySpendHistory.reduce((acc, m) => acc + (m?.totalSpend || 0), 0);
  const totalGrainKg6m = monthlySpendHistory.reduce((acc, m) => acc + (m?.grainKg || 0), 0);
  const avgMonthlySpend = (totalSpent6m / Math.max(1, monthlySpendHistory.length)).toFixed(2);
  const projectedNextMonth = (Number(avgMonthlySpend) * 1.08).toFixed(2);

  const handleExportReport = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Mes,Gasto_Total_USD,Kg_Cafe_Marley,Facturas_Timbradas\n"
      + monthlySpendHistory.map(e => `${e.month},${e.totalSpend},${e.grainKg},${e.invoiceCount}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "reporte_analitico_gastos_marley_coffee_b2b.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* Title & Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-[#F7BE00]" />
            {t.analytics.title}
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            {t.analytics.subtitle}
          </p>
        </div>

        <button
          onClick={handleExportReport}
          className="flex items-center gap-2 rounded-xl bg-[#1a1a1a] border border-[#333333] px-4 py-2 text-xs font-bold text-neutral-200 hover:border-[#F7BE00] hover:text-white transition active:scale-95 shadow-sm"
        >
          <Download className="h-4 w-4 text-[#F7BE00]" />
          <span>Exportar Reporte CSV</span>
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="rounded-2xl border border-[#222222] bg-[#121212] p-4">
          <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block">
            Gasto Mensual Promedio
          </span>
          <p className="mt-2 text-2xl font-extrabold text-white font-mono">
            ${Number(avgMonthlySpend).toLocaleString()} USD
          </p>
          <span className="mt-1 text-xs text-[#5E7E29] font-medium flex items-center gap-1">
            +7.4% crecimiento volumen
          </span>
        </div>

        <div className="rounded-2xl border border-[#222222] bg-[#121212] p-4">
          <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block">
            {t.analytics.projectedBudget}
          </span>
          <p className="mt-2 text-2xl font-extrabold text-[#F7BE00] font-mono">
            ${Number(projectedNextMonth).toLocaleString()} USD
          </p>
          <span className="mt-1 text-xs text-neutral-400">
            Estimado para Septiembre
          </span>
        </div>

        <div className="rounded-2xl border border-[#222222] bg-[#121212] p-4">
          <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block">
            Café Tostado Total (6m)
          </span>
          <p className="mt-2 text-2xl font-extrabold text-white font-mono">
            {totalGrainKg6m} kg
          </p>
          <span className="mt-1 text-xs text-neutral-400">
            ~1,010 kg proyectados al año
          </span>
        </div>

        <div className="rounded-2xl border border-[#222222] bg-[#121212] p-4">
          <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block">
            {t.analytics.savingsFromTiers}
          </span>
          <p className="mt-2 text-2xl font-extrabold text-[#5E7E29] font-mono">
            $1,840.00 USD
          </p>
          <span className="mt-1 text-xs text-neutral-400">
            Descuentos -10% y -18% aplicados
          </span>
        </div>

      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Monthly Spend Chart */}
        <div className="lg:col-span-2 rounded-3xl border border-[#222222] bg-[#121212] p-5 sm:p-6 shadow-xl">
          <div className="flex items-center justify-between pb-4 border-b border-[#222222]">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-[#F7BE00]" />
              {t.analytics.monthlySpendChart}
            </h2>
            <span className="text-xs font-mono text-neutral-400">Últimos 6 meses</span>
          </div>

          <div className="mt-4 h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlySpendHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F7BE00" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#F7BE00" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#222222" />
                <XAxis dataKey="month" stroke="#666666" fontSize={12} />
                <YAxis stroke="#666666" fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#161616', borderColor: '#333333', borderRadius: '12px', fontSize: '12px' }}
                  itemStyle={{ color: '#F7BE00' }}
                />
                <Area type="monotone" dataKey="totalSpend" stroke="#F7BE00" strokeWidth={3} fillOpacity={1} fill="url(#spendGradient)" name="Gasto Total ($)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown Donut */}
        <div className="rounded-3xl border border-[#222222] bg-[#121212] p-5 sm:p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-[#222222]">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <PieIcon className="h-4 w-4 text-[#5E7E29]" />
                {t.analytics.spendByCategoryTitle || "Distribución de Gasto por Categoría"}
              </h2>
            </div>

            <div className="mt-2 h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categorySpendDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="amount"
                    nameKey="category"
                  >
                    {categorySpendDistribution.map((_entry, index) => {
                      const colors = ['#F5B82E', '#2E7D32', '#E67E22', '#3498DB', '#9B59B6'];
                      return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                    })}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#161616', borderColor: '#333333', borderRadius: '12px', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-[#222222]">
            {categorySpendDistribution.map((cat, idx) => {
              const colors = ['#F5B82E', '#2E7D32', '#E67E22', '#3498DB', '#9B59B6'];
              const color = colors[idx % colors.length];
              return (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }}></span>
                    <span className="text-neutral-300 truncate max-w-[150px]">{cat.category}</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-mono">
                    <span className="text-neutral-400 text-[10px]">({cat.percentage}%)</span>
                    <span className="font-bold text-white">${cat.amount.toLocaleString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Coffee Price Evolution Trend Line */}
      <div className="rounded-3xl border border-[#222222] bg-[#121212] p-5 sm:p-6 shadow-xl">
        <div className="flex items-center justify-between pb-4 border-b border-[#222222]">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Coffee className="h-4 w-4 text-[#F7BE00]" />
              {t.analytics.priceTrendChart}
            </h2>
            <p className="text-xs text-neutral-400">
              Evolución del coste promedio pagado por kilogramo gracias a las escalas de volumen
            </p>
          </div>
          <span className="rounded-full bg-[#5E7E29]/20 px-3 py-1 text-[11px] font-bold text-[#5E7E29] border border-[#5E7E29]/30">
            -10.2% Coste/Kg Optimizado
          </span>
        </div>

        <div className="mt-4 h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={pricePerKgEvolution} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#222222" />
              <XAxis dataKey="month" stroke="#666666" fontSize={12} />
              <YAxis stroke="#666666" fontSize={12} domain={[15, 30]} />
              <Tooltip
                contentStyle={{ backgroundColor: '#161616', borderColor: '#333333', borderRadius: '12px', fontSize: '12px' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Line type="monotone" dataKey="blendAvg" stroke="#F7BE00" strokeWidth={3} name="Blend Espresso ($/kg)" />
              <Line type="monotone" dataKey="singleOriginAvg" stroke="#5E7E29" strokeWidth={3} name="Origen Especialidad ($/kg)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};
