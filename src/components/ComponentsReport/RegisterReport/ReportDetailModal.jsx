// src/components/ComponentsReport/RegisterReport/ReportDetailModal.jsx
import { useState } from "react";
import {
  X, ZoomIn, Car, User, Calendar, Gauge, Fuel, MessageSquare, Images,
} from "lucide-react";
import { useTranslation } from "react-i18next";

const fmtDate = (d) => {
  if (!d) return "N/A";
  return new Date(d).toLocaleString("es-HN", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

function DetailRow({ label, value, mono = false }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{label}</span>
      <span className={`text-sm font-semibold text-foreground ${mono ? "font-mono" : ""}`}>{value || "—"}</span>
    </div>
  );
}

function Section({ icon: Icon, title, children, accent = "blue" }) {
  const accentMap = {
    blue:    "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20",
    emerald: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20",
    amber:   "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20",
    violet:  "text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20",
  };
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className={`p-1.5 rounded-lg ${accentMap[accent]}`}><Icon size={14} /></div>
        <span className="text-xs font-black uppercase tracking-wider text-foreground">{title}</span>
      </div>
      <div className="pl-1">{children}</div>
    </div>
  );
}

export default function ReportDetailModal({ open, onClose, registro }) {
  const { t } = useTranslation();
  const [zoomedImage, setZoomedImage] = useState(null);

  if (!registro || !open) return null;

  const {
    vehiculo = {}, empleado = {},
    fecha_salida, fecha_regreso,
    comentario_salida, comentario_regreso,
    km_salida, km_regreso,
    combustible_salida, combustible_regreso,
    images = [],
  } = registro;

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/40 dark:bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-6 animate-in fade-in duration-200"
        onClick={onClose}>
        <div
          className="w-full max-w-2xl bg-card dark:bg-slate-900 rounded-t-3xl md:rounded-3xl shadow-2xl dark:shadow-black/50 border border-border/40 overflow-hidden animate-in slide-in-from-bottom md:zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}>

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border/40">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-100 dark:ring-blue-900/40">
                <Car size={16} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-base font-black tracking-tight">{t("reports.modal.title")}</h2>
                <p className="text-xs text-muted-foreground font-medium">
                  {vehiculo.placa || t("reports.modal.no_plate")}
                  {(vehiculo.marca || vehiculo.modelo) && ` · ${[vehiculo.marca, vehiculo.modelo].filter(Boolean).join(" ")}`}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-muted/60 dark:hover:bg-slate-800 transition-colors text-muted-foreground hover:text-foreground"><X size={18} /></button>
          </div>

          {/* Body */}
          <div className="overflow-y-auto max-h-[75vh] md:max-h-[70vh] px-6 py-5 space-y-6">

            <Section icon={Car} title={t("reports.modal.section_vehicle")} accent="blue">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <DetailRow label={t("reports.modal.label_plate")} value={vehiculo.placa} mono />
                <DetailRow label={t("reports.modal.label_brand")} value={vehiculo.marca} />
                <DetailRow label={t("reports.modal.label_model")} value={vehiculo.modelo} />
              </div>
            </Section>

            <div className="h-px bg-border/40" />

            <Section icon={User} title={t("reports.modal.section_employee")} accent="violet">
              <div className="grid grid-cols-2 gap-4">
                <DetailRow label={t("reports.modal.label_name")} value={empleado.nombre} />
                <DetailRow label={t("reports.modal.label_position")} value={empleado.puesto} />
              </div>
            </Section>

            <div className="h-px bg-border/40" />

            <Section icon={Calendar} title={t("reports.modal.section_dates")} accent="emerald">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <DetailRow label={t("reports.modal.label_departure_date")} value={fmtDate(fecha_salida)} />
                <DetailRow label={t("reports.modal.label_return_date")} value={fecha_regreso ? fmtDate(fecha_regreso) : t("reports.modal.in_progress")} />
              </div>
            </Section>

            <div className="h-px bg-border/40" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Section icon={Gauge} title={t("reports.modal.section_km")} accent="blue">
                <div className="grid grid-cols-2 gap-4">
                  <DetailRow label={t("reports.modal.label_departure")} value={km_salida != null ? `${km_salida} km` : null} mono />
                  <DetailRow label={t("reports.modal.label_return")} value={km_regreso != null ? `${km_regreso} km` : null} mono />
                </div>
              </Section>

              <Section icon={Fuel} title={t("reports.modal.section_fuel")} accent="amber">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{t("reports.modal.label_departure")}</span>
                    <FuelBar value={combustible_salida} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{t("reports.modal.label_return")}</span>
                    <FuelBar value={combustible_regreso} />
                  </div>
                </div>
              </Section>
            </div>

            <div className="h-px bg-border/40" />

            <Section icon={MessageSquare} title={t("reports.modal.section_comments")} accent="violet">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{t("reports.modal.label_departure")}</span>
                  <p className="text-sm text-muted-foreground bg-muted/40 dark:bg-slate-800/50 rounded-xl px-3 py-2 min-h-[2.5rem]">
                    {comentario_salida || <span className="opacity-40 italic">{t("reports.modal.no_comment")}</span>}
                  </p>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{t("reports.modal.label_return")}</span>
                  <p className="text-sm text-muted-foreground bg-muted/40 dark:bg-slate-800/50 rounded-xl px-3 py-2 min-h-[2.5rem]">
                    {comentario_regreso || <span className="opacity-40 italic">{t("reports.modal.no_comment")}</span>}
                  </p>
                </div>
              </div>
            </Section>

            {images.length > 0 && (
              <>
                <div className="h-px bg-border/40" />
                <Section icon={Images} title={t("reports.modal.evidence", { count: images.length })} accent="emerald">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {images.map((img, i) => (
                      <button
                        key={i}
                        onClick={() => setZoomedImage(img.url)}
                        className="group relative aspect-square rounded-2xl overflow-hidden bg-muted border border-border/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50">
                        <img src={img.url} alt={`evidencia-${i + 1}`} loading="lazy" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-200 flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-2 rounded-full bg-white/90 dark:bg-slate-900/90">
                            <ZoomIn size={16} className="text-foreground" />
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </Section>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-border/40 flex justify-end">
            <button onClick={onClose} className="px-5 py-2 rounded-2xl text-sm font-bold border border-border/60 bg-muted/40 hover:bg-muted transition-colors">
              {t("reports.modal.close")}
            </button>
          </div>
        </div>
      </div>

      {/* ZOOM DE IMAGEN */}
      {zoomedImage && (
        <div
          className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setZoomedImage(null)}>
          <div className="relative max-w-4xl w-full animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setZoomedImage(null)} className="absolute -top-3 -right-3 z-10 p-2 rounded-full bg-card border border-border/40 shadow-lg hover:bg-muted transition-colors"><X size={16} /></button>
            <img src={zoomedImage} alt="evidencia ampliada" className="w-full h-auto max-h-[85vh] object-contain rounded-3xl" />
          </div>
        </div>
      )}
    </>
  );
}

function FuelBar({ value }) {
  const pct = value != null ? Math.min(100, Math.max(0, Number(value))) : null;
  const color = pct == null ? "bg-muted" : pct >= 60 ? "bg-emerald-500" : pct >= 30 ? "bg-amber-500" : "bg-rose-500";
  if (pct == null) return <span className="text-sm font-semibold text-muted-foreground">—</span>;
  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm font-black">{pct}%</span>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
