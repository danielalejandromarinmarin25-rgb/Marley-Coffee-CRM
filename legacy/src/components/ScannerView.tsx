import React from 'react';
import { 
  ScanBarcode, 
  Camera, 
  CheckCircle2, 
  Package, 
  Plus, 
  Minus, 
  CalendarClock, 
  AlertCircle, 
  Repeat, 
  Flame,
  Search
} from 'lucide-react';
import { Product, Language } from '../types';
import { translations } from '../data/translations';

interface ScannerViewProps {
  products: Product[];
  language: Language;
  onUpdateStock: (productId: string, newStock: number) => void;
  onAddToCart: (product: Product, quantity?: number) => void;
  onAddToReplenish: (product: Product) => void;
}

export const ScannerView: React.FC<ScannerViewProps> = ({
  products,
  language,
  onUpdateStock,
  onAddToCart,
  onAddToReplenish
}) => {
  const t = translations[language];
  const [scannedBarcode, setScannedBarcode] = React.useState<string>('7501055301928');
  const [isCameraActive, setIsCameraActive] = React.useState<boolean>(false);
  const [manualCodeInput, setManualCodeInput] = React.useState<string>('');
  const [stockEditCount, setStockEditCount] = React.useState<number>(8.5);
  const [scanSuccessMessage, setScanSuccessMessage] = React.useState<string | null>(null);

  const matchedProduct = products.find((p) => p.barcode === scannedBarcode) || products[0];

  React.useEffect(() => {
    if (matchedProduct) {
      setStockEditCount(matchedProduct.currentStockOnPremise);
    }
  }, [matchedProduct]);

  const handleSelectTestBarcode = (barcode: string) => {
    setScannedBarcode(barcode);
    setScanSuccessMessage("¡Código de barras escaneado correctamente!");
    setTimeout(() => setScanSuccessMessage(null), 3000);
  };

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCodeInput) return;
    const found = products.find((p) => p.barcode.includes(manualCodeInput) || p.name.toLowerCase().includes(manualCodeInput.toLowerCase()));
    if (found) {
      setScannedBarcode(found.barcode);
      setScanSuccessMessage(`Encontrado: ${found.name}`);
    } else {
      setScanSuccessMessage("Código no encontrado en el catálogo.");
    }
    setTimeout(() => setScanSuccessMessage(null), 3000);
  };

  const handleSaveStock = () => {
    if (matchedProduct) {
      onUpdateStock(matchedProduct.id, stockEditCount);
      setScanSuccessMessage(`Stock físico actualizado a ${stockEditCount} ${matchedProduct.unit}`);
      setTimeout(() => setScanSuccessMessage(null), 3000);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <ScanBarcode className="h-6 w-6 text-[#DB0032]" />
          {t.scanner.title}
        </h1>
        <p className="text-xs sm:text-sm text-neutral-400 mt-1">
          {t.scanner.subtitle}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Scanner Viewfinder Area (5 cols) */}
        <div className="lg:col-span-5 rounded-3xl border border-[#222222] bg-[#121212] p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#222222] mb-4">
              <span className="text-xs font-bold text-neutral-300 flex items-center gap-2">
                <Camera className="h-4 w-4 text-[#F7BE00]" />
                Cámara / Lector Óptico Láser
              </span>
              <button
                onClick={() => setIsCameraActive(!isCameraActive)}
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border transition ${
                  isCameraActive
                    ? 'border-[#5E7E29] bg-[#5E7E29]/20 text-[#5E7E29]'
                    : 'border-neutral-700 bg-neutral-800 text-neutral-300'
                }`}
              >
                {isCameraActive ? 'Cámara Activa' : 'Activar Cámara'}
              </button>
            </div>

            {/* Target Box */}
            <div className="relative aspect-square w-full rounded-2xl bg-black border-2 border-dashed border-neutral-700 overflow-hidden flex flex-col items-center justify-center p-4">
              
              {/* Laser Animation */}
              <div className="absolute inset-x-4 top-1/2 h-0.5 bg-[#DB0032] shadow-[0_0_12px_#DB0032] animate-pulse"></div>

              {/* Viewfinder Corners */}
              <div className="absolute top-4 left-4 h-6 w-6 border-t-2 border-l-2 border-[#F7BE00]"></div>
              <div className="absolute top-4 right-4 h-6 w-6 border-t-2 border-r-2 border-[#F7BE00]"></div>
              <div className="absolute bottom-4 left-4 h-6 w-6 border-b-2 border-l-2 border-[#F7BE00]"></div>
              <div className="absolute bottom-4 right-4 h-6 w-6 border-b-2 border-r-2 border-[#F7BE00]"></div>

              <ScanBarcode className="h-16 w-16 text-neutral-700 animate-pulse mb-2" />
              <p className="text-center text-xs text-neutral-400 max-w-[200px]">
                {t.scanner.cameraPrompt}
              </p>
              <span className="mt-2 font-mono text-[11px] text-[#F7BE00] bg-[#1a1a1a] px-3 py-1 rounded-full border border-neutral-800">
                {scannedBarcode}
              </span>
            </div>

            {/* Quick Test Barcode Buttons */}
            <div className="mt-4">
              <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block mb-2">
                {t.scanner.testBarcodes}:
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {products.slice(0, 4).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleSelectTestBarcode(p.barcode)}
                    className={`rounded-xl border p-2 text-left text-xs transition ${
                      scannedBarcode === p.barcode
                        ? 'border-[#F7BE00] bg-[#1f1a0a] text-white font-bold'
                        : 'border-[#222222] bg-[#161616] text-neutral-400 hover:text-white'
                    }`}
                  >
                    <span className="truncate block">{p.name.split(' ')[0]} {p.name.split(' ')[1]}</span>
                    <span className="font-mono text-[9px] text-neutral-500">{p.barcode}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Manual barcode search */}
          <form onSubmit={handleManualSearch} className="mt-4 pt-3 border-t border-[#222222] flex gap-2">
            <input
              type="text"
              placeholder="Digitar código manualmente..."
              value={manualCodeInput}
              onChange={(e) => setManualCodeInput(e.target.value)}
              className="flex-1 rounded-xl border border-[#333333] bg-[#181818] px-3 py-2 text-xs text-white placeholder-neutral-500 focus:border-[#F7BE00] focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-xl bg-neutral-800 px-3 py-2 text-xs font-bold text-white hover:bg-neutral-700"
            >
              Buscar
            </button>
          </form>
        </div>

        {/* Product Scanned Detail & Stock Update (7 cols) */}
        <div className="lg:col-span-7 rounded-3xl border border-[#222222] bg-[#121212] p-5 sm:p-6 shadow-xl flex flex-col justify-between">
          <div>
            {scanSuccessMessage && (
              <div className="mb-4 flex items-center gap-2 rounded-2xl border border-[#5E7E29]/40 bg-[#5E7E29]/10 p-3 text-xs text-[#5E7E29] font-semibold animate-fade-in">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{scanSuccessMessage}</span>
              </div>
            )}

            <div className="flex items-center justify-between pb-3 border-b border-[#222222] mb-4">
              <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                {t.scanner.scannedProduct}
              </span>
              <span className="font-mono text-xs text-[#F7BE00]">
                EAN/UPC: {matchedProduct.barcode}
              </span>
            </div>

            {/* Product Card */}
            <div className="flex flex-col sm:flex-row gap-4 items-start rounded-2xl border border-[#262626] bg-[#161616] p-4">
              <div className="h-28 w-28 shrink-0 overflow-hidden rounded-xl bg-black">
                <img
                  src={matchedProduct.imageUrl}
                  alt={matchedProduct.name}
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="flex-1">
                <h3 className="text-base font-extrabold text-white">
                  {matchedProduct.name}
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  {matchedProduct.origin || matchedProduct.category.toUpperCase()} • {matchedProduct.unit}
                </p>
                <p className="text-xs text-neutral-300 mt-2 leading-relaxed">
                  {matchedProduct.description}
                </p>
                <div className="mt-3 flex items-center gap-3 text-xs font-mono">
                  <span className="text-neutral-400">Precio Mayorista:</span>
                  <span className="font-extrabold text-white text-sm">
                    ${matchedProduct.basePrice.toFixed(2)} USD
                  </span>
                </div>
              </div>
            </div>

            {/* On-Premise Inventory Adjuster */}
            <div className="mt-5 rounded-2xl border border-[#2a2a2a] bg-[#141414] p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="text-xs font-bold text-white block">
                    Conteo de Stock Físico en Bodega / Barra
                  </span>
                  <span className="text-[11px] text-neutral-400">
                    Ajusta las existencias reales tras el escaneo
                  </span>
                </div>
                <span className="font-mono text-xs font-bold text-neutral-300">
                  Óptimo: {matchedProduct.optimalStockLevel} {matchedProduct.unit.split(' ')[0]}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setStockEditCount(Math.max(0, stockEditCount - 1))}
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-800 text-lg font-bold text-white hover:bg-neutral-700 active:scale-95"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-20 text-center font-mono text-2xl font-black text-white">
                    {stockEditCount}
                  </span>
                  <button
                    onClick={() => setStockEditCount(stockEditCount + 1)}
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-800 text-lg font-bold text-white hover:bg-neutral-700 active:scale-95"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                <button
                  onClick={handleSaveStock}
                  className="rounded-xl bg-[#5E7E29] px-5 py-2.5 text-xs font-extrabold text-white hover:bg-[#4d6921] transition active:scale-95 shadow-md"
                >
                  {t.scanner.updateStock}
                </button>
              </div>
            </div>

          </div>

          {/* Action Row */}
          <div className="mt-6 pt-4 border-t border-[#222222] grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => onAddToReplenish(matchedProduct)}
              className="flex items-center justify-center gap-2 rounded-xl border border-[#333333] bg-[#181818] py-3 text-xs font-bold text-neutral-200 hover:border-[#F7BE00] hover:text-white transition"
            >
              <CalendarClock className="h-4 w-4 text-[#F7BE00]" />
              <span>{t.scanner.addToReplenish}</span>
            </button>

            <button
              onClick={() => onAddToCart(matchedProduct, 1)}
              className="flex items-center justify-center gap-2 rounded-xl bg-[#F7BE00] py-3 text-xs font-bold text-black hover:bg-[#e0ac00] transition active:scale-95 shadow-md"
            >
              <Plus className="h-4 w-4" />
              <span>{t.scanner.addDirectToOrder}</span>
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};
