// src/pages/Facturacion/MonedasPage.jsx
import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Coins, Plus, Loader2, AlertTriangle, ChevronLeft, ChevronRight, X } from "lucide-react";

import {
  getMonedas,
  createMoneda,
  getTiposCambio,
  createTipoCambio,
} from "@/services/facturacion.service";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";

export default function MonedasPage() {
  const { userData, hasPermiso } = useAuth();
  const isAdmin = (userData?.rol || "").toLowerCase() === "admin";
  const canEdit = isAdmin || hasPermiso("editar_contratos");

  const [monedas, setMonedas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openNuevaMoneda, setOpenNuevaMoneda] = useState(false);
  const [monedaSel, setMonedaSel] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMonedas();
      setMonedas(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8 py-6 md:py-10 space-y-6 animate-in fade-in duration-500">
      <div className="mb-2">
        <Link
          to="/admin/facturacion/periodos"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft size={16} /> Volver a períodos
        </Link>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-2xl bg-primary/10 dark:bg-primary/15 ring-1 ring-primary/20 dark:ring-primary/30 shrink-0">
            <Coins size={22} className="text-primary" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight leading-none">Monedas y Tipos de Cambio</h1>
            <p className="text-muted-foreground text-xs md:text-sm font-medium mt-0.5">
              Agrega una moneda nueva para facturar en cualquier país sin tocar código
            </p>
          </div>
        </div>
        {canEdit && (
          <Button onClick={() => setOpenNuevaMoneda(true)} className="rounded-2xl px-5 h-10 font-bold gap-2 shrink-0">
            <Plus size={17} /> <span className="hidden sm:inline">Nueva moneda</span>
          </Button>
        )}
      </div>

      <div className="bg-card dark:bg-slate-900/40 border border-border/60 rounded-3xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-4 py-16">
            <Loader2 className="animate-spin text-primary" size={20} />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-4 py-16">
            <AlertTriangle size={28} className="text-rose-500/50" />
            <p className="text-sm font-bold">{error}</p>
            <Button onClick={load} variant="outline" size="sm" className="rounded-xl">Reintentar</Button>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {monedas.map((m) => (
              <button
                key={m.id}
                onClick={() => setMonedaSel(m)}
                className="w-full flex items-center gap-3 p-4 hover:bg-muted/20 dark:hover:bg-slate-800/30 transition-colors text-left">
                <div className="w-9 h-9 shrink-0 rounded-xl bg-muted/60 dark:bg-slate-800 flex items-center justify-center font-black text-sm">
                  {m.simbolo}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm">{m.codigo} — {m.nombre}</p>
                  {m.codigo === "USD" && (
                    <p className="text-[11px] text-muted-foreground">Moneda base — nunca necesita tipo de cambio</p>
                  )}
                </div>
                {m.codigo !== "USD" && <ChevronRight size={16} className="text-muted-foreground/50 shrink-0" />}
              </button>
            ))}
          </div>
        )}
      </div>

      {openNuevaMoneda && (
        <NuevaMonedaModal
          onClose={() => setOpenNuevaMoneda(false)}
          onCreated={() => {
            setOpenNuevaMoneda(false);
            load();
          }}
        />
      )}

      {monedaSel && (
        <TiposCambioModal
          moneda={monedaSel}
          canEdit={canEdit}
          onClose={() => setMonedaSel(null)}
        />
      )}
    </div>
  );
}

function NuevaMonedaModal({ onClose, onCreated }) {
  const { showToast } = useToast();
  const [codigo, setCodigo] = useState("");
  const [nombre, setNombre] = useState("");
  const [simbolo, setSimbolo] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!codigo.trim() || !nombre.trim() || !simbolo.trim()) {
      return showToast("Código, nombre y símbolo son obligatorios", "warning");
    }
    setSaving(true);
    try {
      await createMoneda({ codigo: codigo.trim(), nombre: nombre.trim(), simbolo: simbolo.trim() });
      showToast("Moneda creada", "success");
      onCreated();
    } catch (err) {
      showToast(err.message, "danger");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/40 dark:bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-6 animate-in fade-in duration-200"
      onClick={() => !saving && onClose()}>
      <div
        className="w-full max-w-sm bg-card dark:bg-slate-900 rounded-t-3xl md:rounded-3xl shadow-2xl dark:shadow-black/50 border border-border/40 p-6 space-y-4 animate-in slide-in-from-bottom md:zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}>
        <h2 className="text-base font-black tracking-tight">Nueva moneda</h2>
        <div className="space-y-1.5">
          <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Código (ISO) <span className="text-primary">*</span></label>
          <input value={codigo} onChange={(e) => setCodigo(e.target.value.toUpperCase())} maxLength={3} placeholder="Ej: GTQ"
            className="w-full rounded-xl border border-border bg-background dark:bg-slate-900/60 px-4 py-2.5 text-sm outline-none focus:border-primary/60" />
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Nombre <span className="text-primary">*</span></label>
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Quetzal guatemalteco"
            className="w-full rounded-xl border border-border bg-background dark:bg-slate-900/60 px-4 py-2.5 text-sm outline-none focus:border-primary/60" />
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Símbolo <span className="text-primary">*</span></label>
          <input value={simbolo} onChange={(e) => setSimbolo(e.target.value)} maxLength={5} placeholder="Ej: Q"
            className="w-full rounded-xl border border-border bg-background dark:bg-slate-900/60 px-4 py-2.5 text-sm outline-none focus:border-primary/60" />
        </div>
        <div className="flex gap-2.5">
          <Button onClick={submit} disabled={saving} className="flex-1 rounded-2xl h-10 font-bold gap-2 disabled:opacity-60">
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
            {saving ? "Guardando..." : "Crear"}
          </Button>
          <Button variant="outline" onClick={onClose} disabled={saving} className="flex-1 rounded-2xl h-10 font-bold">Cancelar</Button>
        </div>
      </div>
    </div>
  );
}

function TiposCambioModal({ moneda, canEdit, onClose }) {
  const { showToast } = useToast();
  const [tasas, setTasas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [tasa, setTasa] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getTiposCambio(moneda.id);
      setTasas(Array.isArray(data) ? data : []);
    } catch (err) {
      showToast(err.message, "danger");
    } finally {
      setLoading(false);
    }
  }, [moneda.id]);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async () => {
    if (!fecha || !tasa) return showToast("Fecha y tasa son obligatorios", "warning");
    setSaving(true);
    try {
      await createTipoCambio({ moneda_id: moneda.id, fecha, tasa: Number(tasa) });
      showToast("Tipo de cambio registrado", "success");
      setTasa("");
      load();
    } catch (err) {
      showToast(err.message, "danger");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/40 dark:bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-6 animate-in fade-in duration-200" onClick={onClose}>
      <div
        className="w-full max-w-md bg-card dark:bg-slate-900 rounded-t-3xl md:rounded-3xl shadow-2xl dark:shadow-black/50 border border-border/40 p-6 space-y-4 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom md:zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-base font-black tracking-tight">Tipos de cambio — {moneda.codigo}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-muted dark:hover:bg-slate-800 rounded-lg text-muted-foreground">
            <X size={16} />
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          Tasa de 1 USD a {moneda.codigo}. El reporte usa la tasa vigente más reciente a la fecha del período facturado.
        </p>

        {canEdit && (
          <div className="flex gap-2 items-end">
            <div className="flex-1 space-y-1">
              <label className="text-[11px] font-black uppercase text-muted-foreground">Fecha</label>
              <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)}
                className="w-full rounded-xl border border-border bg-background dark:bg-slate-900/60 px-3 py-2 text-sm outline-none focus:border-primary/60" />
            </div>
            <div className="flex-1 space-y-1">
              <label className="text-[11px] font-black uppercase text-muted-foreground">Tasa</label>
              <input type="number" step="0.0001" value={tasa} onChange={(e) => setTasa(e.target.value)} placeholder="Ej: 24.50"
                className="w-full rounded-xl border border-border bg-background dark:bg-slate-900/60 px-3 py-2 text-sm outline-none focus:border-primary/60" />
            </div>
            <Button onClick={submit} disabled={saving} className="rounded-xl h-9 font-bold gap-1.5 px-4">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            </Button>
          </div>
        )}

        <div className="h-px bg-border/50" />

        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="animate-spin text-primary" size={18} /></div>
        ) : tasas.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Sin tipos de cambio registrados</p>
        ) : (
          <div className="space-y-1.5">
            {tasas.map((t) => (
              <div key={t.id} className="flex items-center justify-between px-3 py-2 rounded-xl bg-muted/40 dark:bg-slate-800/40 text-sm">
                <span className="text-muted-foreground">{String(t.fecha).slice(0, 10)}</span>
                <span className="font-bold">{t.simbolo} {Number(t.tasa).toFixed(4)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
