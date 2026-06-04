// src/pages/Inventario/BodegasList.jsx
import { useEffect, useState, useCallback, useMemo } from "react";
import { useFormik } from "formik";
import * as yup from "yup";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Warehouse,
  Plus,
  Search,
  X,
  Pencil,
  AlertCircle,
  RotateCcw,
  MapPin,
  ChevronRight,
  Loader2,
  MoreVertical,
} from "lucide-react";

// Hooks & Context
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import useRowFocusHighlight from "../../hooks/useRowFocusHighlight";
import useIsMobile from "../../hooks/useIsMobile";

// Services
import {
  getBodegas,
  createBodega,
  updateBodega,
} from "../../services/BodegasServices";
import { getCities } from "../../services/LocationServices";

// Normalizador
const normalize = (val) =>
  (val || "")
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");

// Validación
const validationSchema = yup.object({
  nombre: yup.string().trim().min(2, "Mínimo 2 caracteres").required("Requerido"),
  descripcion: yup.string().nullable(),
  id_ciudad: yup.string().required("Selecciona una ciudad"),
});

function Field({ label, error, required, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
        {label}
        {required && <span className="text-rose-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-rose-500">{error}</p>}
    </div>
  );
}

export default function BodegasList() {
  const { showToast } = useToast();
  const { userData, checkingSession, hasPermiso } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const isMobile = useIsMobile(768);

  // --- Permisos ---
  const isAdmin = userData?.rol?.toLowerCase() === "admin";
  const can = useCallback(
    (p) => isAdmin || hasPermiso(p),
    [isAdmin, hasPermiso]
  );

  const canView = can("ver_bodegas") || can("gestionar_bodegas");
  const canCreate = can("crear_bodegas") || can("gestionar_bodegas");
  const canEdit = can("editar_bodegas") || can("gestionar_bodegas");

  // --- Estado ---
  const [rows, setRows] = useState([]);
  const [citiesList, setCitiesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");

  // Modal
  const [openModal, setOpenModal] = useState(false);
  const [editing, setEditing] = useState(null);

  // --- Carga Inicial ---
  const loadData = useCallback(async () => {
    if (checkingSession) {
      setLoading(true);
      return;
    }
    if (!canView) {
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [bodegasData, citiesData] = await Promise.all([
        getBodegas(),
        getCities(),
      ]);
      setRows(Array.isArray(bodegasData) ? bodegasData : []);
      setCitiesList(Array.isArray(citiesData) ? citiesData : []);
    } catch (err) {
      const msg = err?.message || "";
      setError(
        /failed to fetch|network/i.test(msg)
          ? "Error de conexión. Verifica tu red."
          : "No se pudieron cargar las bodegas."
      );
    } finally {
      setLoading(false);
    }
  }, [checkingSession, canView]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // --- Filtrado ---
  const filtered = useMemo(() => {
    const s = normalize(search);
    return rows.filter(
      (r) =>
        normalize(r.nombre).includes(s) ||
        normalize(r.ciudad).includes(s) ||
        normalize(r.descripcion).includes(s)
    );
  }, [rows, search]);

  // --- Highlight Logic ---
  const { highlightId, focusedRef, focusByToken } = useRowFocusHighlight({
    rows: filtered,
    matchRow: (r, token) =>
      String(r.id) === token || normalize(r.nombre) === normalize(token),
    getRowId: (r) => r.id,
    highlightMs: 4000,
  });

  useEffect(() => {
    const token = searchParams.get("focus");
    if (!token) return;
    const next = new URLSearchParams(searchParams);
    next.delete("focus");
    setSearchParams(next, { replace: true });
    setSearch("");
    focusByToken(token);
  }, [searchParams, setSearchParams, focusByToken]);

  // --- Acciones ---
  const handleNew = () => {
    if (!canCreate) return showToast("Sin permiso", "warning");
    setEditing(null);
    setOpenModal(true);
  };

  const handleEdit = (bodega, e) => {
    e?.stopPropagation();
    if (!canEdit) return showToast("Sin permiso", "warning");
    setEditing(bodega);
    setOpenModal(true);
  };

  const handleRowClick = (id) => {
    navigate(`${id}`);
  };

  // --- Formulario (Formik) ---
  const formik = useFormik({
    initialValues: { nombre: "", descripcion: "", id_ciudad: "" },
    validationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      const payload = {
        nombre: values.nombre.trim(),
        descripcion: values.descripcion?.trim() || null,
        id_ciudad: values.id_ciudad,
      };
      try {
        if (editing) {
          await updateBodega(editing.id, payload);
          showToast("Bodega actualizada correctamente", "success");
        } else {
          await createBodega(payload);
          showToast("Bodega creada correctamente", "success");
        }
        setOpenModal(false);
        loadData();
      } catch (e) {
        showToast(e?.message || "Error al guardar la bodega", "danger");
      } finally {
        setSubmitting(false);
      }
    },
  });

  useEffect(() => {
    if (openModal) {
      formik.setValues({
        nombre: editing?.nombre || "",
        descripcion: editing?.descripcion || "",
        id_ciudad: editing?.id_ciudad ? String(editing.id_ciudad) : "",
      });
      formik.setTouched({});
    }
  }, [openModal, editing]); // eslint-disable-line react-hooks/exhaustive-deps

  // --- View State ---
  const viewState = checkingSession
    ? "checking"
    : !canView
    ? "no-permission"
    : error
    ? "error"
    : loading
    ? "loading"
    : filtered.length === 0 && !search
    ? "empty"
    : "data";

  return (
    <div className="animate-in fade-in duration-500 flex flex-col gap-6 w-full max-w-[1200px] mx-auto">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400">
            <Warehouse className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
              Bodegas
            </h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Gestión de almacenes y ubicaciones de inventario
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar bodegas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-8 py-2 rounded-xl text-sm border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500 w-[220px] sm:w-[260px] transition"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {canCreate && (
            <button
              onClick={handleNew}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-amber-500 hover:bg-amber-600 text-white transition shadow-sm">
              <Plus className="w-4 h-4" />
              Nueva bodega
            </button>
          )}
        </div>
      </div>

      {/* ── VIEW STATES ── */}
      {viewState === "checking" && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        </div>
      )}
      {viewState === "no-permission" && (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <Warehouse className="w-10 h-10 text-neutral-300 dark:text-neutral-600" />
          <p className="font-semibold text-neutral-700 dark:text-neutral-200">Sin permiso</p>
          <p className="text-sm text-neutral-500">Contacta al administrador.</p>
        </div>
      )}
      {viewState === "error" && (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <AlertCircle className="w-10 h-10 text-rose-400" />
          <p className="font-semibold text-neutral-700 dark:text-neutral-200">Error al cargar</p>
          <p className="text-sm text-neutral-500">{error}</p>
          <button
            onClick={loadData}
            className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-sm font-medium transition">
            <RotateCcw className="w-4 h-4" /> Reintentar
          </button>
        </div>
      )}
      {viewState === "loading" && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        </div>
      )}
      {viewState === "empty" && (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <Warehouse className="w-10 h-10 text-neutral-300 dark:text-neutral-600" />
          <p className="font-semibold text-neutral-700 dark:text-neutral-300">Sin bodegas registradas</p>
          <p className="text-sm text-neutral-500">Crea la primera bodega para comenzar.</p>
          {canCreate && (
            <button
              onClick={handleNew}
              className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition">
              <Plus className="w-4 h-4" /> Nueva bodega
            </button>
          )}
        </div>
      )}

      {/* ── DATA VIEW (Table / Cards) ── */}
      {(viewState === "data" || (viewState !== "checking" && viewState !== "no-permission" && viewState !== "error" && viewState !== "loading" && viewState !== "empty" && search)) && (
        <div className="rounded-3xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 overflow-hidden shadow-sm">
          {filtered.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-2xl mb-2">🔍</p>
              <p className="font-semibold text-neutral-700 dark:text-neutral-200">Sin resultados</p>
              <p className="text-sm text-neutral-500 mt-1">No hay bodegas que coincidan.</p>
              <button
                onClick={() => setSearch("")}
                className="mt-3 text-sm text-amber-600 hover:underline">
                Limpiar búsqueda
              </button>
            </div>
          ) : isMobile ? (
            /* 📱 MOBILE VIEW (CARDS) */
            <div className="divide-y divide-neutral-100 dark:divide-neutral-700">
              {filtered.map((r) => {
                const isHighlighted = r.id === highlightId;
                return (
                  <div
                    key={r.id}
                    ref={isHighlighted ? focusedRef : null}
                    onClick={() => handleRowClick(r.id)}
                    className={`p-4 flex items-center gap-3 cursor-pointer transition-colors ${
                      isHighlighted
                        ? "bg-amber-50 dark:bg-amber-900/20"
                        : "hover:bg-neutral-50 dark:hover:bg-neutral-750"
                    }`}>
                    <div className="w-10 h-10 shrink-0 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
                      <Warehouse className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-neutral-800 dark:text-neutral-100 truncate">
                        {r.nombre}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {r.ciudad ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                            <MapPin className="w-3 h-3" />
                            {r.ciudad}
                          </span>
                        ) : (
                          <span className="text-xs text-neutral-400">—</span>
                        )}
                        {r.descripcion && (
                          <span className="text-xs text-neutral-400 truncate max-w-[150px]">
                            {r.descripcion}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {canEdit && (
                        <button
                          onClick={(e) => handleEdit(r, e)}
                          title="Editar"
                          className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-400">
                          <Pencil className="w-4 h-4" />
                        </button>
                      )}
                      <ChevronRight className="w-4 h-4 text-neutral-300 dark:text-neutral-600" />
                    </div>
                  </div>
                );
              })}
              {/* Footer counter */}
              <div className="px-5 py-3 border-t border-neutral-100 dark:border-neutral-700">
                <span className="text-xs text-neutral-500 dark:text-neutral-400">
                  {filtered.length === rows.length
                    ? `${rows.length} bodega${rows.length !== 1 ? "s" : ""}`
                    : `${filtered.length} de ${rows.length} bodegas`}
                </span>
              </div>
            </div>
          ) : (
            /* 💻 DESKTOP VIEW (TABLE) */
            <>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-100 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/60">
                    <th className="px-5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                      Nombre
                    </th>
                    <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                      Ciudad
                    </th>
                    <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                      Descripción
                    </th>
                    <th className="px-3 py-2.5 pr-5 text-right text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-700">
                  {filtered.map((r) => {
                    const isHighlighted = r.id === highlightId;
                    return (
                      <tr
                        key={r.id}
                        ref={isHighlighted ? focusedRef : null}
                        onClick={() => handleRowClick(r.id)}
                        className={`group cursor-pointer transition-colors ${
                          isHighlighted
                            ? "bg-amber-50 dark:bg-amber-900/20"
                            : "hover:bg-neutral-50 dark:hover:bg-neutral-750"
                        }`}>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                              <Warehouse className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                            </div>
                            <span className="font-semibold text-sm text-neutral-800 dark:text-neutral-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                              {r.nombre}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-4">
                          {r.ciudad ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                              <MapPin className="w-3 h-3" />
                              {r.ciudad}
                            </span>
                          ) : (
                            <span className="text-xs text-neutral-400">—</span>
                          )}
                        </td>
                        <td className="px-3 py-4">
                          <span className="text-sm text-neutral-500 dark:text-neutral-400 line-clamp-1 max-w-[300px]">
                            {r.descripcion || "—"}
                          </span>
                        </td>
                        <td className="px-3 py-4 pr-5">
                          <div className="flex items-center justify-end gap-2">
                            {canEdit && (
                              <button
                                onClick={(e) => handleEdit(r, e)}
                                title="Editar"
                                className="opacity-60 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-400">
                                <Pencil className="w-4 h-4" />
                              </button>
                            )}
                            <ChevronRight className="w-4 h-4 text-neutral-300 dark:text-neutral-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {/* Footer counter */}
              {filtered.length > 0 && (
                <div className="px-5 py-3 border-t border-neutral-100 dark:border-neutral-700">
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">
                    {filtered.length === rows.length
                      ? `${rows.length} bodega${rows.length !== 1 ? "s" : ""}`
                      : `${filtered.length} de ${rows.length} bodegas`}
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════
          MODAL CREAR / EDITAR (Responsive)
      ══════════════════════════════════════════ */}
      {openModal && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => !formik.isSubmitting && setOpenModal(false)}
          />
          <div
            className={[
              "absolute z-50 bg-white dark:bg-neutral-900 shadow-2xl border border-neutral-200 dark:border-neutral-700 flex flex-col animate-in duration-300",
              isMobile
                ? "inset-x-0 bottom-0 h-[92vh] rounded-t-3xl border-b-0 slide-in-from-bottom"
                : "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md rounded-3xl zoom-in-95",
            ].join(" ")}
            onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex-none flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <Warehouse className="w-4 h-4 text-amber-500" />
                <h2 className="font-semibold text-neutral-900 dark:text-neutral-100">
                  {editing ? "Editar bodega" : "Nueva bodega"}
                </h2>
              </div>
              <button
                onClick={() => !formik.isSubmitting && setOpenModal(false)}
                disabled={formik.isSubmitting}
                className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 transition disabled:opacity-50">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={formik.handleSubmit} className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-5 flex flex-col gap-4">
                <Field
                  label="Nombre"
                  required
                  error={formik.touched.nombre && formik.errors.nombre}>
                  <input
                    autoFocus
                    name="nombre"
                    value={formik.values.nombre}
                    onChange={formik.handleChange}
                    onBlur={() => formik.setFieldTouched("nombre", true)}
                    disabled={formik.isSubmitting}
                    placeholder="Ej. Bodega Central"
                    className={`w-full px-3 py-2 rounded-xl border text-sm bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 transition disabled:opacity-50 ${
                      formik.touched.nombre && formik.errors.nombre
                        ? "border-rose-400 focus:ring-rose-500"
                        : "border-neutral-200 dark:border-neutral-700 focus:ring-amber-500"
                    }`}
                  />
                </Field>

                <Field
                  label="Descripción"
                  error={formik.touched.descripcion && formik.errors.descripcion}>
                  <input
                    name="descripcion"
                    value={formik.values.descripcion}
                    onChange={formik.handleChange}
                    onBlur={() => formik.setFieldTouched("descripcion", true)}
                    disabled={formik.isSubmitting}
                    placeholder="Descripción opcional"
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500 transition disabled:opacity-50"
                  />
                </Field>

                <Field
                  label="Ciudad"
                  required
                  error={formik.touched.id_ciudad && formik.errors.id_ciudad}>
                  <select
                    name="id_ciudad"
                    value={formik.values.id_ciudad}
                    onChange={(e) =>
                      formik.setFieldValue("id_ciudad", e.target.value)
                    }
                    onBlur={() => formik.setFieldTouched("id_ciudad", true)}
                    disabled={formik.isSubmitting}
                    className={`w-full px-3 py-2 rounded-xl border text-sm bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 transition disabled:opacity-50 ${
                      formik.touched.id_ciudad && formik.errors.id_ciudad
                        ? "border-rose-400 focus:ring-rose-500"
                        : "border-neutral-200 dark:border-neutral-700 focus:ring-amber-500"
                    }`}>
                    <option value="">Seleccionar ciudad...</option>
                    {citiesList.map((city) => (
                      <option key={city.id} value={String(city.id)}>
                        {city.ciudad}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              {/* Footer */}
              <div className="flex-none flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setOpenModal(false)}
                  disabled={formik.isSubmitting}
                  className="px-4 py-2 rounded-xl text-sm font-medium border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition disabled:opacity-50">
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={formik.isSubmitting}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold bg-amber-500 hover:bg-amber-600 text-white transition disabled:opacity-60">
                  {formik.isSubmitting && (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  )}
                  {editing ? "Guardar cambios" : "Crear bodega"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
