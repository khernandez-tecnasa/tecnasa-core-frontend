// src/pages/Administration/Locations/Countries.jsx
import { useEffect, useState, useCallback, useMemo } from "react";
import { useFormik } from "formik";
import * as yup from "yup";
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  Loader2,
  X,
  Globe2,
  AlertTriangle,
  MoreVertical,
  Save,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { Button } from "@/components/ui/button";
import useIsMobile from "@/hooks/useIsMobile";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  getCountries,
  addCountry,
  updateCountry,
  deleteCountry,
} from "@/services/LocationServices";

// ── Validación ────────────────────────────────────────────────────────────────

const schema = yup.object({
  nombre: yup
    .string()
    .transform((v) => (typeof v === "string" ? v.trim() : v))
    .min(2, "Mínimo 2 caracteres")
    .max(60, "Máximo 60 caracteres")
    .required("Nombre requerido"),
});

// ── Componente principal ──────────────────────────────────────────────────────

export default function Countries() {
  const { showToast } = useToast();
  const { userData, hasPermiso } = useAuth();
  const isMobile = useIsMobile();

  // ── Permisos ────────────────────────────────────────────────────────────────
  const isAdmin = useCallback(
    () =>
      (userData?.rol || userData?.role || "").toLowerCase() === "admin" ||
      Boolean(userData?.isAdmin) ||
      Boolean(userData?.es_admin),
    [userData]
  );
  const can = useCallback(
    (p) => isAdmin() || hasPermiso(p),
    [isAdmin, hasPermiso]
  );

  const canView   = can("ver_paises");
  const canCreate = can("crear_paises");
  const canEdit   = can("editar_paises");
  const canDelete = can("eliminar_paises") || canEdit;

  // ── Estado ──────────────────────────────────────────────────────────────────
  const [countries, setCountries]         = useState([]);
  const [loading, setLoading]             = useState(true);
  const [search, setSearch]               = useState("");
  const [modal, setModal]                 = useState(false);
  const [editingCountry, setEditingCountry] = useState(null);
  const [deleteTarget, setDeleteTarget]   = useState(null);
  const [deleting, setDeleting]           = useState(false);

  // ── Carga ───────────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCountries();
      setCountries(Array.isArray(data) ? data : []);
    } catch {
      showToast("Error al cargar los países", "danger");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Filtrado ─────────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const s = search.toLowerCase();
    return countries.filter((c) => (c.nombre || "").toLowerCase().includes(s));
  }, [countries, search]);

  // ── Acciones ─────────────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditingCountry(null);
    setModal(true);
  };
  const openEdit = (country) => {
    setEditingCountry(country);
    setModal(true);
  };
  const closeModal = () => {
    if (formik.isSubmitting) return;
    setModal(false);
    setEditingCountry(null);
  };

  // ── Formulario ───────────────────────────────────────────────────────────────
  const formik = useFormik({
    initialValues: { nombre: "" },
    validationSchema: schema,
    onSubmit: async (values, { setSubmitting }) => {
      const payload = { nombre: values.nombre.trim() };
      try {
        if (editingCountry) {
          const r = await updateCountry(editingCountry.id, {
            id: editingCountry.id,
            ...payload,
          });
          if (r && !r.error) {
            showToast("País actualizado", "success");
            setModal(false);
            loadData();
          } else {
            showToast("Error al actualizar", "danger");
          }
        } else {
          const r = await addCountry(payload);
          if (r && !r.error) {
            showToast("País creado", "success");
            setModal(false);
            loadData();
          } else {
            showToast("Error al crear", "danger");
          }
        }
      } catch {
        showToast("Error inesperado", "danger");
      } finally {
        setSubmitting(false);
      }
    },
  });

  useEffect(() => {
    if (modal) {
      formik.resetForm({
        values: { nombre: editingCountry?.nombre || "" },
      });
    }
  }, [modal, editingCountry]);

  // ── Eliminar ─────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const r = await deleteCountry(deleteTarget.id);
      if (r && !r.error) {
        showToast("País eliminado", "success");
        setCountries((prev) => prev.filter((c) => c.id !== deleteTarget.id));
        setDeleteTarget(null);
      } else {
        showToast("Error al eliminar", "danger");
      }
    } catch {
      showToast("Error al eliminar", "danger");
    } finally {
      setDeleting(false);
    }
  };

  // ── Menú de acciones ─────────────────────────────────────────────────────────
  const AccionesMenu = ({ country }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-8 w-8 p-0 hover:bg-muted/80 rounded-xl transition-colors">
          <MoreVertical size={16} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-44 rounded-2xl shadow-xl border-border/60">
        <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">
          Acciones
        </DropdownMenuLabel>
        {canEdit && (
          <DropdownMenuItem
            onClick={() => openEdit(country)}
            className="rounded-xl cursor-pointer gap-2 text-sm">
            <Edit3 size={13} /> Editar
          </DropdownMenuItem>
        )}
        {canDelete && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setDeleteTarget(country)}
              className="text-rose-600 focus:text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-950/40 rounded-xl cursor-pointer gap-2 text-sm">
              <Trash2 size={13} /> Eliminar
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  if (!canView) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3 opacity-40">
          <Globe2 size={40} className="mx-auto" />
          <p className="font-semibold text-sm">Acceso denegado</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-10 space-y-6 animate-in fade-in duration-500">

      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-2xl bg-primary/10 dark:bg-primary/15 ring-1 ring-primary/20 dark:ring-primary/30 shadow-sm shadow-primary/10 shrink-0">
            <Globe2 size={22} className="text-primary" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight leading-none">
              Países
            </h1>
            <p className="text-muted-foreground text-xs md:text-sm font-medium mt-0.5">
              Gestiona los países disponibles en el sistema
            </p>
          </div>
        </div>

        {canCreate && (
          <Button
            onClick={openCreate}
            className="rounded-2xl px-5 h-10 font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all duration-200 gap-2 shrink-0">
            <Plus size={17} strokeWidth={2.5} />
            <span className="hidden sm:inline">Nuevo País</span>
          </Button>
        )}
      </div>

      {/* ── TOOLBAR ── */}
      <div className="flex items-center gap-3">
        <div className="relative w-full max-w-xs group">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 group-focus-within:text-primary transition-colors pointer-events-none"
          />
          <input
            type="text"
            placeholder="Buscar país..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-card border border-border/60 rounded-xl pl-9 pr-8 py-2 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15 transition-all placeholder:text-muted-foreground/50 shadow-sm"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 hover:bg-muted rounded-md transition-colors text-muted-foreground/60 hover:text-foreground">
              <X size={13} />
            </button>
          )}
        </div>
        {!loading && (
          <span className="text-xs text-muted-foreground/70 font-medium whitespace-nowrap">
            <span className="font-bold text-foreground">{filtered.length}</span>
            {search
              ? ` de ${countries.length}`
              : ` país${countries.length !== 1 ? "es" : ""}`}
          </span>
        )}
      </div>

      {/* ── CONTENIDO PRINCIPAL ── */}
      <div className="bg-card dark:bg-slate-900/40 border border-border/60 rounded-3xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-4 py-24">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Loader2 className="animate-spin text-primary" size={22} />
            </div>
            <p className="text-sm text-muted-foreground font-medium">
              Cargando países...
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-24">
            <div className="w-16 h-16 rounded-3xl bg-muted/50 dark:bg-slate-800/50 flex items-center justify-center">
              <Globe2 size={28} className="text-muted-foreground/40" />
            </div>
            <div className="text-center">
              <p className="font-bold text-sm">
                {search ? "Sin resultados" : "Sin países registrados"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {search
                  ? `No hay coincidencias para "${search}"`
                  : "Crea el primer país usando el botón de arriba"}
              </p>
            </div>
          </div>
        ) : isMobile ? (

          /* ── MOBILE: CARDS ── */
          <div className="divide-y divide-border/50">
            {filtered.map((country) => (
              <div
                key={country.id}
                className="p-4 flex items-center gap-3 hover:bg-muted/20 dark:hover:bg-slate-800/30 transition-colors group">
                <div className="w-10 h-10 shrink-0 rounded-2xl bg-muted/60 dark:bg-slate-800 group-hover:bg-primary/10 group-hover:ring-1 ring-primary/20 flex items-center justify-center transition-all duration-200">
                  <Globe2
                    size={17}
                    className="text-muted-foreground group-hover:text-primary transition-colors"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{country.nombre}</p>
                  <p className="text-[10px] text-muted-foreground/60 font-mono mt-0.5">
                    #{String(country.id).padStart(4, "0")}
                  </p>
                </div>
                <AccionesMenu country={country} />
              </div>
            ))}
          </div>

        ) : (

          /* ── DESKTOP: TABLA ── */
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/60 bg-muted/20 dark:bg-slate-800/30">
                  <th className="px-6 py-3.5 text-left">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">
                      País
                    </span>
                  </th>
                  <th className="px-6 py-3.5 text-right">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">
                      Acciones
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((country) => (
                  <tr
                    key={country.id}
                    className="border-b border-border/30 last:border-0 hover:bg-muted/20 dark:hover:bg-slate-800/20 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 shrink-0 rounded-xl bg-muted/60 dark:bg-slate-800 group-hover:bg-primary/10 group-hover:ring-1 ring-primary/20 flex items-center justify-center transition-all duration-200">
                          <Globe2
                            size={16}
                            className="text-muted-foreground group-hover:text-primary transition-colors"
                          />
                        </div>
                        <div>
                          <div className="font-bold text-sm">{country.nombre}</div>
                          <div className="text-[10px] text-muted-foreground/60 font-mono mt-0.5">
                            #{String(country.id).padStart(4, "0")}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end">
                        <AccionesMenu country={country} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── MODAL CREAR / EDITAR ── */}
      {modal && (
        <div
          className="fixed inset-0 z-50 bg-black/40 dark:bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-6 animate-in fade-in duration-200"
          onClick={closeModal}>
          <div
            className="w-full max-w-md bg-card dark:bg-slate-900 rounded-t-3xl md:rounded-3xl shadow-2xl dark:shadow-black/50 border border-border/40 flex flex-col max-h-[92vh] animate-in slide-in-from-bottom md:zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}>

            {/* Header */}
            <div className="flex-none flex items-center gap-3 px-6 py-4 border-b border-border/60">
              <div className="p-2 bg-primary/10 dark:bg-primary/15 rounded-2xl ring-1 ring-primary/20 dark:ring-primary/25">
                <Globe2 size={18} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-black tracking-tight">
                  {editingCountry ? "Editar País" : "Nuevo País"}
                </h2>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {editingCountry
                    ? `Modificando: ${editingCountry.nombre}`
                    : "Completa la información requerida"}
                </p>
              </div>
              <button
                onClick={closeModal}
                disabled={formik.isSubmitting}
                className="p-2 hover:bg-muted dark:hover:bg-slate-800 rounded-xl transition-colors disabled:opacity-40 text-muted-foreground hover:text-foreground">
                <X size={16} />
              </button>
            </div>

            {/* Cuerpo scrollable */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-5 space-y-5">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="h-px flex-1 bg-border/50" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 px-1">
                    Información básica
                  </span>
                  <div className="h-px flex-1 bg-border/50" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
                    Nombre del País <span className="text-primary">*</span>
                  </label>
                  <input
                    autoFocus
                    name="nombre"
                    value={formik.values.nombre}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    disabled={formik.isSubmitting}
                    placeholder="ej: México, Guatemala, Honduras..."
                    className={[
                      "w-full rounded-xl border px-4 py-2.5 text-sm transition-all outline-none",
                      "bg-background dark:bg-slate-900/60 placeholder:text-muted-foreground/50",
                      formik.touched.nombre && formik.errors.nombre
                        ? "border-rose-400/70 ring-2 ring-rose-400/20"
                        : "border-border focus:border-primary/60 focus:ring-2 focus:ring-primary/20",
                      "disabled:opacity-60",
                    ].join(" ")}
                  />
                  {formik.touched.nombre && formik.errors.nombre && (
                    <p className="text-[11px] text-rose-500 font-semibold flex items-center gap-1">
                      <AlertTriangle size={10} />
                      {formik.errors.nombre}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Footer fijo */}
            <div className="flex-none px-6 py-4 border-t border-border/50 bg-card/95 dark:bg-slate-900/95 backdrop-blur-sm">
              <div className="flex gap-2.5">
                <Button
                  type="button"
                  disabled={formik.isSubmitting}
                  onClick={formik.submitForm}
                  className="flex-1 rounded-2xl h-10 font-bold shadow-md shadow-primary/15 hover:shadow-primary/25 transition-all gap-2 disabled:opacity-60">
                  {formik.isSubmitting ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : editingCountry ? (
                    <Save size={15} />
                  ) : (
                    <Plus size={15} />
                  )}
                  {formik.isSubmitting
                    ? "Guardando..."
                    : editingCountry
                    ? "Guardar Cambios"
                    : "Registrar"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeModal}
                  disabled={formik.isSubmitting}
                  className="flex-1 rounded-2xl h-10 font-bold">
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL ELIMINAR ── */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-[60] bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-6 animate-in fade-in duration-200"
          onClick={() => !deleting && setDeleteTarget(null)}>
          <div
            className="w-full max-w-md bg-card dark:bg-slate-900 rounded-t-3xl md:rounded-3xl shadow-2xl dark:shadow-black/50 border border-border/40 p-6 space-y-5 animate-in slide-in-from-bottom md:zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-4">
              <div className="p-3 bg-rose-500/10 dark:bg-rose-500/15 rounded-2xl ring-1 ring-rose-500/20 shrink-0">
                <AlertTriangle size={20} className="text-rose-500" />
              </div>
              <div>
                <h2 className="text-base font-black tracking-tight">
                  Eliminar País
                </h2>
                <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                  ¿Eliminar{" "}
                  <span className="font-bold text-foreground">
                    "{deleteTarget.nombre}"
                  </span>
                  ? Esta acción no se puede deshacer y puede afectar a las ciudades asociadas.
                </p>
              </div>
            </div>

            <div className="h-px bg-border/50" />

            <div className="flex gap-2.5">
              <Button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 rounded-2xl h-10 bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-md shadow-rose-600/20 hover:shadow-rose-600/30 transition-all gap-2 disabled:opacity-60">
                {deleting ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <Trash2 size={15} />
                )}
                {deleting ? "Eliminando..." : "Eliminar"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="flex-1 rounded-2xl h-10 font-bold">
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
