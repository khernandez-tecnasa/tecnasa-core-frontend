// src/pages/Facturacion/ReportePeriodoCliente.jsx
import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { Receipt, ChevronLeft, Loader2, AlertTriangle, Layers, FileText, AlertCircle } from "lucide-react";

import { getReporteMensual, getReemplazosByPeriodo } from "@/services/facturacion.service";
import { exportFacturacionReportePDF } from "@/utils/exportFacturacionReporte";
import { Button } from "@/components/ui/button";

const money = (n, simbolo = "$") =>
  `${simbolo} ${Number(n || 0).toLocaleString("es-HN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const price4 = (n, simbolo = "$") =>
  `${simbolo} ${Number(n || 0).toLocaleString("es-HN", { minimumFractionDigits: 4, maximumFractionDigits: 4 })}`;

const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const formatPeriodo = (texto) => {
  const [m, a] = String(texto || "").split("/");
  const nombre = MESES[parseInt(m, 10) - 1];
  return nombre ? `${nombre} ${a}` : texto;
};

export default function ReportePeriodoCliente() {
  const { periodoId, clienteId } = useParams();
  const [reporte, setReporte] = useState(null);
  const [reemplazos, setReemplazos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exportando, setExportando] = useState(false);
  const [exportError, setExportError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [data, remplData] = await Promise.all([
        getReporteMensual(periodoId, clienteId),
        getReemplazosByPeriodo(periodoId, clienteId).catch(() => []),
      ]);
      setReporte(data);
      setReemplazos(Array.isArray(remplData) ? remplData : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [periodoId, clienteId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-6 md:py-10 space-y-6 animate-in fade-in duration-500 print:px-0">
      <div className="print:hidden flex items-center justify-between gap-4">
        <Link
          to={`/admin/facturacion/periodos/${periodoId}/cliente/${clienteId}`}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft size={16} /> Volver al workspace
        </Link>
        {reporte && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              disabled={exportando}
              onClick={async () => {
                setExportando(true);
                setExportError(null);
                try {
                  const fechas = localStorage.getItem(`nota_${periodoId}_${clienteId}`) || "";
                  const notaCompleta = fechas.trim()
                    ? `Lectura de contadores correspondientes al período del ${fechas.trim()}`
                    : "";
                  await exportFacturacionReportePDF(reporte, notaCompleta, reemplazos);
                } catch (err) {
                  setExportError(err.message);
                } finally {
                  setExportando(false);
                }
              }}
              className="rounded-2xl gap-2 font-bold">
              {exportando ? <Loader2 size={15} className="animate-spin" /> : <FileText size={15} />}
              {exportando ? "Generando..." : "Exportar PDF"}
            </Button>
            {exportError && (
              <p className="text-xs text-rose-500 font-semibold">{exportError}</p>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center gap-4 py-24">
          <Loader2 className="animate-spin text-primary" size={22} />
          <p className="text-sm text-muted-foreground font-medium">Calculando proforma...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center gap-4 py-24">
          <AlertTriangle size={28} className="text-rose-500/50" />
          <p className="text-sm font-bold">{error}</p>
          <Button onClick={load} variant="outline" size="sm" className="rounded-xl">Reintentar</Button>
        </div>
      ) : !reporte || reporte.secciones.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-24">
          <Receipt size={28} className="text-muted-foreground/40" />
          <p className="font-bold text-sm">Sin datos para este período</p>
          <p className="text-xs text-muted-foreground">Aún no se han guardado lecturas para este cliente</p>
        </div>
      ) : (
        <div className="space-y-6">
          {reporte.secciones.map((s, i) => {
            const simbolo = s.moneda?.simbolo || "$";
            return (
            <div key={i} className="bg-card dark:bg-slate-900/40 border border-border/60 rounded-3xl shadow-sm overflow-hidden print:break-inside-avoid">
              <div className="px-5 md:px-7 py-3 bg-slate-900 dark:bg-black flex items-center gap-2.5">
                <Receipt size={15} className="text-white/70" />
                <h2 className="text-sm font-black uppercase tracking-wide text-white">
                  {s.titulo} — {formatPeriodo(reporte.periodo_texto)}
                </h2>
                <span className="ml-auto text-[10px] font-black uppercase text-white/60">{s.moneda?.codigo || "USD"}</span>
              </div>

              {s.advertencia && (
                <div className="px-5 md:px-7 py-2.5 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900 flex items-center gap-2 text-amber-800 dark:text-amber-400">
                  <AlertCircle size={14} className="shrink-0" />
                  <p className="text-xs font-semibold">{s.advertencia} — se muestra en USD mientras tanto.</p>
                </div>
              )}

              <div className="p-5 md:p-7 space-y-4">
                {s.tipo === "items" ? (
                  <>
                  <div className="border border-border/60 rounded-2xl overflow-hidden overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border/60">
                          <th className="px-3 py-2 text-left text-[10px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-300">Modelo</th>
                          <th className="px-3 py-2 text-center text-[10px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-300">Cantidad</th>
                          <th className="px-3 py-2 text-right text-[10px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-300">Precio Lease</th>
                          <th className="px-3 py-2 text-right text-[10px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-300">Total Lease</th>
                          <th className="px-3 py-2 text-center text-[10px] font-black uppercase tracking-wider bg-slate-900 dark:bg-black text-white">Impresiones B/N</th>
                          <th className="px-3 py-2 text-right text-[10px] font-black uppercase tracking-wider bg-slate-900 dark:bg-black text-white">Precio B/N</th>
                          <th className="px-3 py-2 text-right text-[10px] font-black uppercase tracking-wider bg-slate-900 dark:bg-black text-white">Total B/N</th>
                          <th className="px-3 py-2 text-center text-[10px] font-black uppercase tracking-wider bg-sky-200 dark:bg-sky-950/60 text-sky-900 dark:text-sky-300">Impresiones Color</th>
                          <th className="px-3 py-2 text-right text-[10px] font-black uppercase tracking-wider bg-sky-200 dark:bg-sky-950/60 text-sky-900 dark:text-sky-300">Precio Color</th>
                          <th className="px-3 py-2 text-right text-[10px] font-black uppercase tracking-wider bg-sky-200 dark:bg-sky-950/60 text-sky-900 dark:text-sky-300">Total Color</th>
                          <th className="px-3 py-2 text-right text-[10px] font-black uppercase tracking-wider bg-muted/30 dark:bg-slate-800/40 text-muted-foreground/70">Total General</th>
                        </tr>
                      </thead>
                      <tbody>
                        {s.items_individuales.map((it, j) => (
                          <tr key={j} className="border-b border-border/30 last:border-0">
                            <td className="px-3 py-2 text-xs font-semibold">{it.modelo}</td>
                            <td className="px-3 py-2 text-xs text-center">{it.cantidad}</td>
                            <td className="px-3 py-2 text-xs text-right">{money(it.precio_lease, simbolo)}</td>
                            <td className="px-3 py-2 text-xs text-right">{money(it.total_lease, simbolo)}</td>
                            <td className="px-3 py-2 text-xs text-center">{it.impresiones_bn}</td>
                            <td className="px-3 py-2 text-xs text-right">{price4(it.precio_bn, simbolo)}</td>
                            <td className="px-3 py-2 text-xs text-right">{money(it.total_bn, simbolo)}</td>
                            <td className="px-3 py-2 text-xs text-center">{it.impresiones_color}</td>
                            <td className="px-3 py-2 text-xs text-right">{price4(it.precio_color, simbolo)}</td>
                            <td className="px-3 py-2 text-xs text-right">{money(it.total_color, simbolo)}</td>
                            <td className="px-3 py-2 text-xs font-bold text-right">{money(it.total_general, simbolo)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="h-px bg-border/50" />
                  <div className="flex flex-col items-end gap-1 text-sm">
                    <span className="text-muted-foreground">Subtotales: <b className="text-foreground">{money(s.subtotal, simbolo)}</b></span>
                    <span className="text-muted-foreground">ISV (15%): <b className="text-foreground">{money(s.isv, simbolo)}</b></span>
                    <span className="text-lg font-black mt-1">Total: {money(s.total, simbolo)}</span>
                  </div>
                  </>
                ) : (
                  <div className="space-y-3">
                    {/* Zona 1: Contadores (informativa) */}
                    <div className="bg-muted/40 dark:bg-slate-800/50 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Layers size={13} className="text-violet-600 shrink-0" />
                        <span className="font-bold text-sm">{s.bolson.nombre_grupo}</span>
                        <span className="px-2 py-0.5 text-[9px] font-black uppercase rounded-full bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-400 border border-violet-200 dark:border-violet-800">
                          Bolsón · {s.bolson.frecuencia === "ANUAL" ? "Anual" : "Mensual"}
                        </span>
                        {s.bolson.es_mes_de_cierre && (
                          <span className="px-2 py-0.5 text-[9px] font-black uppercase rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                            Mes de cierre anual
                          </span>
                        )}
                      </div>

                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Contadores del período</p>
                      <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
                        <div className="flex justify-between gap-2">
                          <span className="text-muted-foreground">Bolsa mono</span>
                          <b>{s.bolson.bolsa_mono.toLocaleString("es-HN")}</b>
                        </div>
                        <div className="flex justify-between gap-2">
                          <span className="text-muted-foreground">Bolsa color</span>
                          <b>{s.bolson.bolsa_color.toLocaleString("es-HN")}</b>
                        </div>
                        <div className="flex justify-between gap-2">
                          <span className="text-muted-foreground">Uso {s.bolson.es_mes_de_cierre ? "anual" : "mes"}</span>
                          <b>{s.bolson.uso_total_mono.toLocaleString("es-HN")}</b>
                        </div>
                        <div className="flex justify-between gap-2">
                          <span className="text-muted-foreground">Uso {s.bolson.es_mes_de_cierre ? "anual" : "mes"}</span>
                          <b>{s.bolson.uso_total_color.toLocaleString("es-HN")}</b>
                        </div>
                        <div className="flex justify-between gap-2">
                          <span className="text-muted-foreground">Excedente mono</span>
                          <b className={s.bolson.excedente_mono > 0 ? "text-rose-600 dark:text-rose-400" : ""}>
                            {s.bolson.excedente_mono.toLocaleString("es-HN")}
                          </b>
                        </div>
                        <div className="flex justify-between gap-2">
                          <span className="text-muted-foreground">Excedente color</span>
                          <b className={s.bolson.excedente_color > 0 ? "text-rose-600 dark:text-rose-400" : ""}>
                            {s.bolson.excedente_color.toLocaleString("es-HN")}
                          </b>
                        </div>
                      </div>

                      {s.bolson.frecuencia === "ANUAL" && !s.bolson.es_mes_de_cierre && (
                        <p className="text-[11px] text-amber-600 dark:text-amber-400 italic">
                          El excedente se acumula durante el año y se cobra en el mes de cierre — este mes no genera cargo por excedente.
                        </p>
                      )}
                    </div>

                    {/* Zona 2: Desglose de cobro */}
                    <div className="rounded-2xl border border-border/60 overflow-hidden">
                      <div className="px-4 py-2 bg-slate-900 dark:bg-black">
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/70">Desglose de cobro</p>
                      </div>
                      <div className="divide-y divide-border/40">
                        <div className="flex items-center justify-between px-4 py-2.5 text-sm">
                          <span className="text-muted-foreground">Renta base mensual</span>
                          <span className="font-semibold">{money(s.bolson.renta_base ?? s.subtotal, simbolo)}</span>
                        </div>
                        {s.bolson.hay_cobro_excedente && s.bolson.excedente_mono > 0 && (
                          <div className="flex items-center justify-between px-4 py-2.5 text-sm">
                            <span className="text-muted-foreground">
                              Excedente Mono
                              <span className="ml-1 text-xs font-mono text-muted-foreground/60">
                                {s.bolson.excedente_mono.toLocaleString("es-HN")} imp. × {price4(s.bolson.precio_unitario_excedente_mono, simbolo)}
                              </span>
                            </span>
                            <span className="font-semibold text-rose-600 dark:text-rose-400">{money(s.bolson.cobro_excedente_mono, simbolo)}</span>
                          </div>
                        )}
                        {s.bolson.hay_cobro_excedente && s.bolson.excedente_color > 0 && (
                          <div className="flex items-center justify-between px-4 py-2.5 text-sm">
                            <span className="text-muted-foreground">
                              Excedente Color
                              <span className="ml-1 text-xs font-mono text-muted-foreground/60">
                                {s.bolson.excedente_color.toLocaleString("es-HN")} imp. × {price4(s.bolson.precio_unitario_excedente_color, simbolo)}
                              </span>
                            </span>
                            <span className="font-semibold text-rose-600 dark:text-rose-400">{money(s.bolson.cobro_excedente_color, simbolo)}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between px-4 py-2.5 text-sm bg-muted/30 dark:bg-slate-800/40">
                          <span className="text-muted-foreground">Subtotal</span>
                          <span className="font-bold">{money(s.subtotal, simbolo)}</span>
                        </div>
                        <div className="flex items-center justify-between px-4 py-2.5 text-sm">
                          <span className="text-muted-foreground">ISV (15%)</span>
                          <span className="font-semibold">{money(s.isv, simbolo)}</span>
                        </div>
                        <div className="flex items-center justify-between px-4 py-3 bg-slate-900 dark:bg-black">
                          <span className="text-sm font-black text-white">TOTAL</span>
                          <span className="text-base font-black text-white">{money(s.total, simbolo)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
