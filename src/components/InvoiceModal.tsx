import React from 'react';
import { 
  X, 
  Download, 
  FileText, 
  QrCode, 
  CheckCircle2, 
  Building2, 
  Printer, 
  Send
} from 'lucide-react';
import { Order, CompanyProfile, Language } from '../types';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  companyProfile: CompanyProfile;
  language: Language;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  isOpen,
  onClose,
  order,
  companyProfile
}) => {
  const [downloadSuccess, setDownloadSuccess] = React.useState<string | null>(null);

  if (!isOpen || !order) return null;

  const handleDownloadXml = () => {
    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<cfdi:Comprobante Version="4.0" Serie="CFDI" Folio="${order.invoiceNumber}" Fecha="${order.date}T12:00:00" FormaPago="99" SubTotal="${order.subtotal}" Total="${order.total}" Moneda="USD" TipoDeComprobante="I" Exportacion="01" MetodoPago="PPD" LugarExpedicion="06600">
  <cfdi:Emisor Rfc="CAF901201TO1" Nombre="TOSTADURIA & CAFE DE ESPECIALIDAD B2B S.A. DE C.V." RegimenFiscal="601"/>
  <cfdi:Receptor Rfc="${companyProfile.taxId}" Nombre="${companyProfile.companyName}" DomicilioFiscalReceptor="06700" RegimenFiscalReceptor="${companyProfile.taxRegime.split(' - ')[0]}" UsoCFDI="${companyProfile.cfdiUsage.split(' - ')[0]}"/>
  <cfdi:Conceptos>
    ${order.items.map(i => `<cfdi:Concepto ClaveProdServ="50201706" Cantidad="${i.quantity}" ClaveUnidad="KGM" Descripcion="${i.productName}" ValorUnitario="${i.unitPrice}" Importe="${i.total}"/>`).join('\n    ')}
  </cfdi:Conceptos>
  <cfdi:Impuestos TotalImpuestosTrasladados="${order.tax}">
    <cfdi:Traslados>
      <cfdi:Traslado Base="${order.subtotal}" Impuesto="002" TipoFactor="Tasa" TasaOCuota="0.160000" Importe="${order.tax}"/>
    </cfdi:Traslados>
  </cfdi:Impuestos>
</cfdi:Comprobante>`;

    const blob = new Blob([xmlContent], { type: 'text/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${order.invoiceNumber}.xml`;
    a.click();
    URL.revokeObjectURL(url);
    setDownloadSuccess("Archivo XML CFDI 4.0 descargado correctamente.");
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="w-full max-w-3xl rounded-3xl border border-[#2a2a2a] bg-[#141414] p-6 sm:p-8 shadow-2xl text-white my-8">
        
        {/* Modal Top Actions */}
        <div className="flex items-center justify-between pb-4 border-b border-[#262626]">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-[#5E7E29] text-white px-2 py-0.5 text-[10px] font-black uppercase">
              CFDI 4.0 Vigente
            </span>
            <span className="font-mono font-bold text-sm text-neutral-200">
              {order.invoiceNumber}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadXml}
              className="flex items-center gap-1.5 rounded-xl border border-[#333333] bg-[#1a1a1a] px-3 py-1.5 text-xs font-bold text-[#F7BE00] hover:border-[#F7BE00] transition"
            >
              <Download className="h-3.5 w-3.5" />
              <span>XML CFDI</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-xl border border-[#333333] bg-[#1a1a1a] px-3 py-1.5 text-xs font-bold text-neutral-300 hover:text-white transition"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Imprimir PDF</span>
            </button>

            <button
              onClick={onClose}
              className="rounded-xl border border-[#333333] p-1.5 text-neutral-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {downloadSuccess && (
          <div className="mt-3 rounded-xl bg-[#5E7E29]/20 border border-[#5E7E29]/40 p-2.5 text-xs text-[#5E7E29] font-bold flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            <span>{downloadSuccess}</span>
          </div>
        )}

        {/* Printable Invoice Body */}
        <div className="mt-5 rounded-2xl border border-[#262626] bg-[#0c0c0c] p-6 text-xs text-neutral-300 space-y-6">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between gap-4 pb-4 border-b border-[#222222]">
            <div>
              <span className="text-[10px] uppercase tracking-widest text-[#F7BE00] font-black block">
                EMISOR FISCAL
              </span>
              <h3 className="font-extrabold text-sm text-white mt-1">
                TOSTADURIA & CAFE DE ESPECIALIDAD B2B S.A. DE C.V.
              </h3>
              <p className="font-mono text-neutral-400 mt-0.5">RFC: CAF901201TO1</p>
              <p className="text-neutral-400">Régimen: 601 - General de Ley Personas Morales</p>
              <p className="text-neutral-400">Dirección: Av. Tostadores 88, Col. Industrial Café, CP 06600</p>
            </div>

            <div className="text-left sm:text-right font-mono">
              <span className="text-[10px] uppercase tracking-widest text-neutral-500 font-bold block">
                COMPROBANTE FISCAL DIGITAL
              </span>
              <p className="text-white font-extrabold text-sm mt-1">{order.invoiceNumber}</p>
              <p className="text-neutral-400">Fecha: {order.date}</p>
              <p className="text-neutral-400">Pedido Ref: {order.orderNumber}</p>
              <p className="text-neutral-400">Uso CFDI: {companyProfile.cfdiUsage.split(' - ')[0]}</p>
            </div>
          </div>

          {/* Receptor / Client Data */}
          <div className="rounded-xl bg-[#141414] p-4 border border-[#1f1f1f]">
            <span className="text-[10px] uppercase tracking-widest text-[#5E7E29] font-black block mb-1">
              RECEPTOR (CLIENTE B2B)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-neutral-200">
              <div>
                <p><strong>Razón Social:</strong> {companyProfile.companyName}</p>
                <p className="font-mono"><strong>RFC:</strong> {companyProfile.taxId}</p>
                <p><strong>Régimen Fiscal:</strong> {companyProfile.taxRegime}</p>
              </div>
              <div>
                <p><strong>Domicilio Fiscal:</strong> {companyProfile.fiscalAddress}</p>
                <p><strong>Email Facturación:</strong> {companyProfile.electronicInvoiceEmail}</p>
                <p><strong>Sucursal Destino:</strong> {order.branch}</p>
              </div>
            </div>
          </div>

          {/* Line items table */}
          <div>
            <table className="w-full text-left font-mono text-[11px]">
              <thead>
                <tr className="border-b border-[#222222] text-neutral-500 uppercase">
                  <th className="py-2">Cant</th>
                  <th className="py-2">Clave SAT</th>
                  <th className="py-2">Descripción del Insumo</th>
                  <th className="py-2 text-right">P. Unitario</th>
                  <th className="py-2 text-right">Importe</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1c1c1c]">
                {order.items.map((it, idx) => (
                  <tr key={idx} className="text-neutral-200">
                    <td className="py-2.5 font-bold">{it.quantity}</td>
                    <td className="py-2.5 text-neutral-500">50201706</td>
                    <td className="py-2.5 font-sans font-medium">{it.productName}</td>
                    <td className="py-2.5 text-right">${it.unitPrice.toFixed(2)}</td>
                    <td className="py-2.5 text-right font-bold text-white">${it.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals & Tax Breakdown */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pt-3 border-t border-[#222222]">
            
            <div className="space-y-1 text-[10px] text-neutral-500 font-mono">
              <p>Método de Pago: PPD - Pago en parcialidades o diferido</p>
              <p>Forma de Pago: 99 - Por definir (Línea B2B Net-30)</p>
              <p>Moneda: USD (Dólares Americanos)</p>
            </div>

            <div className="w-full sm:w-64 space-y-1.5 font-mono text-xs">
              <div className="flex justify-between text-neutral-400">
                <span>Subtotal:</span>
                <span>${order.subtotal.toFixed(2)} USD</span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>IVA Trasladado (16.0%):</span>
                <span>${order.tax.toFixed(2)} USD</span>
              </div>
              <div className="flex justify-between text-base font-extrabold text-white pt-2 border-t border-[#2a2a2a]">
                <span>Total Factura:</span>
                <span className="text-[#F7BE00]">${order.total.toFixed(2)} USD</span>
              </div>
            </div>

          </div>

          {/* SAT Seal & QR Code */}
          <div className="flex flex-col sm:flex-row items-center gap-4 pt-4 border-t border-[#222222] bg-[#080808] p-3 rounded-xl">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-white p-1">
              <QrCode className="h-full w-full text-black" />
            </div>

            <div className="flex-1 text-[9px] font-mono text-neutral-500 break-all space-y-1">
              <p><strong>Folio Fiscal (UUID):</strong> 7C8E29A1-B534-46D9-8971-558291F099BC</p>
              <p><strong>Sello Digital del SAT:</strong> f8A91jK0s+mR29...91Lm0QxZ==</p>
              <p><strong>Cadena Original del Timbre:</strong> ||1.1|7C8E29A1-B534...|2026-08-31T15:00:00|SAT970701NN3||</p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
