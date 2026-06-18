import { useState, useEffect, useCallback, useRef } from "react";
import {
  Bell, Users, Link2, Plus, Pencil, Trash2, RefreshCw,
  Search, X, Check, Loader2, ChevronRight, UserMinus,
  UserPlus, ToggleLeft, ToggleRight, AlertTriangle,
} from "lucide-react";
import { useToast } from "../../context/ToastContext";
import {
  getGrupos, createGrupo, updateGrupo, deleteGrupo,
  getMiembros, addMiembros, removeMiembro, searchUsuarios,
} from "../../services/GruposNotifService";
import {
  getEventos, createEvento, updateEvento, deleteEvento,
  toggleEventoEstado, getEventoGrupos, setEventoGrupos,
} from "../../services/EventosNotifService";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const SEV_COLORS = {
  low: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  high: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  critical: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

function SevBadge({ value }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${SEV_COLORS[value] ?? SEV_COLORS.low}`}>
      {value ?? "low"}
    </span>
  );
}

function EstadoBadge({ activo }) {
  return activo
    ? <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Activo</span>
    : <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">Inactivo</span>;
}

function Spinner() {
  return <Loader2 size={18} className="animate-spin text-[var(--muted-foreground)]" />;
}

function EmptyState({ message = "Sin datos" }) {
  return (
    <div className="flex flex-col items-center gap-2 py-12 text-[var(--muted-foreground)]">
      <AlertTriangle size={24} className="opacity-40" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

// ─── Modal base ──────────────────────────────────────────────────────────────

function Modal({ open, onClose, title, children, footer }) {
  const overlayRef = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    if (open) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)" }}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}>
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <h3 className="font-semibold text-[var(--foreground)] text-sm">{title}</h3>
          <button onClick={onClose} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-5 py-4">{children}</div>
        {footer && (
          <div className="px-5 py-3 border-t border-[var(--border)] flex justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

function Btn({ children, onClick, variant = "primary", size = "md", loading, disabled, type = "button", className = "" }) {
  const base = "inline-flex items-center gap-1.5 font-medium rounded-xl transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed";
  const sizes = { sm: "px-3 py-1.5 text-xs", md: "px-4 py-2 text-sm" };
  const variants = {
    primary: "bg-primary text-primary-foreground hover:opacity-90 shadow-sm",
    outline: "border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--muted)] bg-transparent",
    ghost: "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] bg-transparent",
    danger: "border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 bg-transparent",
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled || loading} className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}>
      {loading && <Loader2 size={13} className="animate-spin" />}
      {children}
    </button>
  );
}

function Input({ value, onChange, placeholder, className = "", ...props }) {
  return (
    <input
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`w-full px-3 py-2 text-sm rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 transition ${className}`}
      {...props}
    />
  );
}

function Textarea({ value, onChange, placeholder, rows = 3, className = "" }) {
  return (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      className={`w-full px-3 py-2 text-sm rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 resize-none transition ${className}`}
    />
  );
}

function Select({ value, onChange, children, className = "" }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`px-3 py-2 text-sm rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 transition ${className}`}>
      {children}
    </select>
  );
}

function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );
}

// ─── GRUPOS ──────────────────────────────────────────────────────────────────

function GrupoFormModal({ open, onClose, initial, onSaved }) {
  const { showToast } = useToast();
  const isEdit = !!initial?.id;
  const [form, setForm] = useState({ nombre: "", descripcion: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setForm({ nombre: initial?.nombre ?? "", descripcion: initial?.descripcion ?? "" });
  }, [open, initial]);

  async function onSubmit(e) {
    e.preventDefault();
    if (!form.nombre.trim()) { showToast("El nombre es requerido", "warning"); return; }
    setSaving(true);
    try {
      if (isEdit) await updateGrupo(initial.id, form);
      else await createGrupo(form);
      showToast(isEdit ? "Grupo actualizado" : "Grupo creado", "success");
      onSaved?.();
      onClose();
    } catch (err) {
      showToast(err.message || "Error al guardar", "danger");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Editar grupo" : "Nuevo grupo"}
      footer={
        <>
          <Btn variant="ghost" onClick={onClose} disabled={saving}>Cancelar</Btn>
          <Btn type="submit" form="grupo-form" loading={saving}>Guardar</Btn>
        </>
      }>
      <form id="grupo-form" onSubmit={onSubmit} className="flex flex-col gap-4">
        <Field label="Nombre *">
          <Input value={form.nombre} onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))} placeholder="Ej: Supervisores de flota" />
        </Field>
        <Field label="Descripción">
          <Textarea value={form.descripcion} onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))} placeholder="Descripción opcional..." />
        </Field>
      </form>
    </Modal>
  );
}

function MiembrosModal({ open, onClose, grupo, miembros, onMiembrosChange }) {
  const { showToast } = useToast();
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState(null);

  useEffect(() => { if (!open) { setQ(""); setResults([]); } }, [open]);

  async function buscar() {
    if (q.trim().length < 2) { showToast("Escribe al menos 2 caracteres", "warning"); return; }
    setSearching(true);
    try {
      const data = await searchUsuarios(q.trim());
      setResults(data);
    } catch (err) {
      showToast(err.message, "danger");
    } finally {
      setSearching(false);
    }
  }

  async function agregar(usuario) {
    setAdding(usuario.id_usuario);
    try {
      await addMiembros(grupo.id, [usuario.id_usuario]);
      onMiembrosChange?.();
      showToast(`${usuario.nombre} agregado`, "success");
    } catch (err) {
      showToast(err.message, "danger");
    } finally {
      setAdding(null);
    }
  }

  async function quitar(miembro) {
    try {
      await removeMiembro(grupo.id, miembro.id_usuario);
      onMiembrosChange?.();
      showToast("Miembro eliminado", "success");
    } catch (err) {
      showToast(err.message, "danger");
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={`Miembros — ${grupo?.nombre ?? ""}`} footer={<Btn variant="outline" onClick={onClose}>Cerrar</Btn>}>
      <div className="flex flex-col gap-4">
        {/* Buscador */}
        <div>
          <p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide mb-2">Agregar usuarios</p>
          <div className="flex gap-2">
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por nombre, email..."
              onKeyDown={(e) => e.key === "Enter" && buscar()}
            />
            <Btn variant="outline" size="sm" onClick={buscar} loading={searching}>
              <Search size={13} />
            </Btn>
          </div>

          {results.length > 0 && (
            <div className="mt-2 border border-[var(--border)] rounded-xl overflow-hidden">
              {results.map((u) => {
                const yaEsta = miembros.some((m) => m.id_usuario === u.id_usuario);
                return (
                  <div key={u.id_usuario} className="flex items-center justify-between px-3 py-2 border-b border-[var(--border)] last:border-0 hover:bg-[var(--muted)]/40">
                    <div>
                      <p className="text-sm font-medium text-[var(--foreground)]">{u.nombre}</p>
                      <p className="text-xs text-[var(--muted-foreground)]">{u.email}</p>
                    </div>
                    {yaEsta
                      ? <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1"><Check size={12} /> En grupo</span>
                      : (
                        <Btn size="sm" variant="outline" onClick={() => agregar(u)} loading={adding === u.id_usuario}>
                          <UserPlus size={13} /> Agregar
                        </Btn>
                      )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Lista miembros actuales */}
        <div>
          <p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide mb-2">
            Miembros actuales ({miembros.length})
          </p>
          {miembros.length === 0
            ? <p className="text-sm text-[var(--muted-foreground)]">Sin miembros todavía.</p>
            : (
              <div className="border border-[var(--border)] rounded-xl overflow-hidden">
                {miembros.map((m) => (
                  <div key={m.id_usuario} className="flex items-center justify-between px-3 py-2 border-b border-[var(--border)] last:border-0 hover:bg-[var(--muted)]/40">
                    <div>
                      <p className="text-sm font-medium text-[var(--foreground)]">{m.nombre}</p>
                      <p className="text-xs text-[var(--muted-foreground)]">{m.email}</p>
                    </div>
                    <button onClick={() => quitar(m)} className="text-red-400 hover:text-red-600 transition-colors" title="Quitar">
                      <UserMinus size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}
        </div>
      </div>
    </Modal>
  );
}

function GruposTab() {
  const { showToast } = useToast();
  const [grupos, setGrupos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sel, setSel] = useState(null);
  const [miembros, setMiembros] = useState([]);
  const [loadingMiembros, setLoadingMiembros] = useState(false);
  const [openForm, setOpenForm] = useState(false);
  const [editando, setEditando] = useState(null);
  const [openMiembros, setOpenMiembros] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getGrupos({ search });
      const arr = Array.isArray(data) ? data : data.rows ?? [];
      setGrupos(arr);
      if (!sel && arr.length) setSel(arr[0]);
    } catch (err) {
      showToast(err.message, "danger");
    } finally {
      setLoading(false);
    }
  }, [search, sel, showToast]);

  useEffect(() => { load(); }, []); // eslint-disable-line

  const loadMiembros = useCallback(async (grupo) => {
    if (!grupo) return;
    setLoadingMiembros(true);
    try {
      const data = await getMiembros(grupo.id);
      setMiembros(Array.isArray(data) ? data : []);
    } catch {
      setMiembros([]);
    } finally {
      setLoadingMiembros(false);
    }
  }, []);

  useEffect(() => { loadMiembros(sel); }, [sel, loadMiembros]);

  async function onDelete(g) {
    if (!window.confirm(`¿Eliminar el grupo "${g.nombre}"? Los miembros serán desvinculados.`)) return;
    try {
      await deleteGrupo(g.id);
      showToast("Grupo eliminado", "success");
      if (sel?.id === g.id) setSel(null);
      load();
    } catch (err) {
      showToast(err.message, "danger");
    }
  }

  const filtrado = grupos.filter((g) =>
    !search || g.nombre.toLowerCase().includes(search.toLowerCase()) || (g.descripcion ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col md:flex-row gap-4 h-full">
      {/* Sidebar */}
      <div className="md:w-72 shrink-0 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar grupos..."
              className="pl-8"
              onKeyDown={(e) => e.key === "Enter" && load()}
            />
          </div>
          <Btn size="sm" variant="outline" onClick={load} title="Recargar"><RefreshCw size={13} /></Btn>
          <Btn size="sm" onClick={() => { setEditando(null); setOpenForm(true); }}><Plus size={13} /> Nuevo</Btn>
        </div>

        <div className="flex flex-col gap-1 flex-1 overflow-y-auto">
          {loading
            ? <div className="flex justify-center py-8"><Spinner /></div>
            : filtrado.length === 0
              ? <EmptyState message="Sin grupos" />
              : filtrado.map((g) => (
                <button
                  key={g.id}
                  onClick={() => setSel(g)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl border transition-all ${sel?.id === g.id ? "border-[var(--primary)] bg-[var(--primary)]/5" : "border-transparent hover:bg-[var(--muted)]/50"}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-[var(--foreground)] truncate">{g.nombre}</span>
                    <ChevronRight size={13} className="text-[var(--muted-foreground)] shrink-0" />
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    {g.descripcion && <span className="text-xs text-[var(--muted-foreground)] truncate">{g.descripcion}</span>}
                    {typeof g.miembros === "number" && (
                      <span className="shrink-0 text-xs text-[var(--muted-foreground)] ml-auto">{g.miembros} miembros</span>
                    )}
                  </div>
                </button>
              ))}
        </div>
      </div>

      {/* Panel derecho */}
      <div className="flex-1 border border-[var(--border)] rounded-2xl bg-[var(--card)] overflow-hidden">
        {!sel
          ? <EmptyState message="Selecciona un grupo para ver sus detalles" />
          : (
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-start justify-between px-5 py-4 border-b border-[var(--border)]">
                <div>
                  <h3 className="font-semibold text-[var(--foreground)]">{sel.nombre}</h3>
                  {sel.descripcion && <p className="text-sm text-[var(--muted-foreground)] mt-0.5">{sel.descripcion}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Btn size="sm" variant="outline" onClick={() => { setEditando(sel); setOpenForm(true); }}>
                    <Pencil size={13} /> Editar
                  </Btn>
                  <Btn size="sm" variant="danger" onClick={() => onDelete(sel)}>
                    <Trash2 size={13} /> Eliminar
                  </Btn>
                </div>
              </div>

              {/* Miembros */}
              <div className="flex-1 overflow-y-auto px-5 py-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-[var(--foreground)]">
                    Miembros {!loadingMiembros && `(${miembros.length})`}
                  </h4>
                  <Btn size="sm" variant="outline" onClick={() => setOpenMiembros(true)}>
                    <UserPlus size={13} /> Gestionar
                  </Btn>
                </div>

                {loadingMiembros
                  ? <div className="flex justify-center py-6"><Spinner /></div>
                  : miembros.length === 0
                    ? <EmptyState message="Este grupo no tiene miembros aún" />
                    : (
                      <div className="flex flex-col divide-y divide-[var(--border)] border border-[var(--border)] rounded-xl overflow-hidden">
                        {miembros.map((m) => (
                          <div key={m.id_usuario} className="flex items-center justify-between px-4 py-2.5 hover:bg-[var(--muted)]/40 transition-colors">
                            <div>
                              <p className="text-sm font-medium text-[var(--foreground)]">{m.nombre}</p>
                              <p className="text-xs text-[var(--muted-foreground)]">{m.email}</p>
                            </div>
                            <button
                              onClick={async () => {
                                try {
                                  await removeMiembro(sel.id, m.id_usuario);
                                  loadMiembros(sel);
                                  showToast("Miembro eliminado", "success");
                                } catch (err) { showToast(err.message, "danger"); }
                              }}
                              className="text-[var(--muted-foreground)] hover:text-red-500 transition-colors p-1 rounded-lg"
                              title="Quitar miembro">
                              <UserMinus size={15} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
              </div>
            </div>
          )}
      </div>

      <GrupoFormModal
        open={openForm}
        onClose={() => setOpenForm(false)}
        initial={editando}
        onSaved={() => {
          load();
          if (editando) setSel((s) => s?.id === editando.id ? { ...s, ...editando } : s);
        }}
      />

      <MiembrosModal
        open={openMiembros}
        onClose={() => setOpenMiembros(false)}
        grupo={sel}
        miembros={miembros}
        onMiembrosChange={() => loadMiembros(sel)}
      />
    </div>
  );
}

// ─── EVENTOS ─────────────────────────────────────────────────────────────────

const SEV_OPTIONS = ["low", "medium", "high", "critical"];

function EventoFormModal({ open, onClose, initial, onSaved }) {
  const { showToast } = useToast();
  const isEdit = !!initial?.id;
  const [form, setForm] = useState({ clave: "", nombre: "", descripcion: "", severidad_def: "medium", activo: true });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setForm({
      clave: initial?.clave ?? "",
      nombre: initial?.nombre ?? "",
      descripcion: initial?.descripcion ?? "",
      severidad_def: initial?.severidad_def ?? "medium",
      activo: initial?.activo !== 0,
    });
  }, [open, initial]);

  async function onSubmit(e) {
    e.preventDefault();
    if (!form.clave.trim() || !form.nombre.trim()) { showToast("Clave y nombre son requeridos", "warning"); return; }
    setSaving(true);
    try {
      if (isEdit) await updateEvento(initial.id, form);
      else await createEvento({ ...form, clave: form.clave.trim().toUpperCase() });
      showToast(isEdit ? "Evento actualizado" : "Evento creado", "success");
      onSaved?.();
      onClose();
    } catch (err) {
      showToast(err.message || "Error al guardar", "danger");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Editar evento" : "Nuevo evento"}
      footer={
        <>
          <Btn variant="ghost" onClick={onClose} disabled={saving}>Cancelar</Btn>
          <Btn type="submit" form="evento-form" loading={saving}>Guardar</Btn>
        </>
      }>
      <form id="evento-form" onSubmit={onSubmit} className="flex flex-col gap-4">
        <Field label="Clave *">
          <Input
            value={form.clave}
            onChange={(e) => setForm((f) => ({ ...f, clave: e.target.value.toUpperCase() }))}
            placeholder="Ej: SALIDA_VEHICULO"
            disabled={isEdit}
          />
          <p className="text-xs text-[var(--muted-foreground)]">Identificador único en mayúsculas. No se puede cambiar después de crear.</p>
        </Field>
        <Field label="Nombre *">
          <Input value={form.nombre} onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))} placeholder="Nombre descriptivo" />
        </Field>
        <Field label="Descripción">
          <Textarea value={form.descripcion} onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))} placeholder="Para qué sirve este evento..." />
        </Field>
        <div className="flex gap-3">
          <Field label="Severidad por defecto">
            <Select value={form.severidad_def} onChange={(v) => setForm((f) => ({ ...f, severidad_def: v }))}>
              {SEV_OPTIONS.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
            </Select>
          </Field>
          <Field label="Activo">
            <div className="flex items-center h-[38px]">
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, activo: !f.activo }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.activo ? "bg-[var(--primary)]" : "bg-[var(--muted-foreground)]/30"}`}>
                <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${form.activo ? "translate-x-6" : "translate-x-1"}`} />
              </button>
            </div>
          </Field>
        </div>
      </form>
    </Modal>
  );
}

function AsignarGruposModal({ open, onClose, evento, onSaved }) {
  const { showToast } = useToast();
  const [allGrupos, setAllGrupos] = useState([]);
  const [checked, setChecked] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !evento?.id) return;
    (async () => {
      setLoading(true);
      try {
        const [grupos, asignados] = await Promise.all([getGrupos(), getEventoGrupos(evento.id)]);
        const arr = Array.isArray(grupos) ? grupos : grupos.rows ?? [];
        setAllGrupos(arr);
        setChecked(new Set(asignados.filter((a) => a.asignacion_activa !== 0).map((a) => a.id)));
      } catch (err) {
        showToast(err.message, "danger");
      } finally {
        setLoading(false);
      }
    })();
  }, [open, evento?.id, showToast]);

  function toggle(id) {
    setChecked((prev) => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  }

  async function save() {
    setSaving(true);
    try {
      await setEventoGrupos(evento.id, [...checked]);
      showToast("Grupos asignados correctamente", "success");
      onSaved?.();
      onClose();
    } catch (err) {
      showToast(err.message, "danger");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Grupos para: ${evento?.clave ?? ""}`}
      footer={
        <>
          <Btn variant="ghost" onClick={onClose} disabled={saving}>Cancelar</Btn>
          <Btn onClick={save} loading={saving}>Guardar</Btn>
        </>
      }>
      {loading
        ? <div className="flex justify-center py-8"><Spinner /></div>
        : allGrupos.length === 0
          ? <EmptyState message="No hay grupos creados. Crea uno primero." />
          : (
            <div className="flex flex-col gap-1">
              <p className="text-xs text-[var(--muted-foreground)] mb-3">
                Los grupos seleccionados recibirán las notificaciones de este evento.
              </p>
              {allGrupos.map((g) => (
                <label key={g.id} className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-[var(--muted)]/40 cursor-pointer transition-colors border border-transparent hover:border-[var(--border)]">
                  <div>
                    <p className="text-sm font-medium text-[var(--foreground)]">{g.nombre}</p>
                    {g.descripcion && <p className="text-xs text-[var(--muted-foreground)]">{g.descripcion}</p>}
                    {typeof g.miembros === "number" && <p className="text-xs text-[var(--muted-foreground)]">{g.miembros} miembros</p>}
                  </div>
                  <input
                    type="checkbox"
                    checked={checked.has(g.id)}
                    onChange={() => toggle(g.id)}
                    className="w-4 h-4 rounded accent-[var(--primary)]"
                  />
                </label>
              ))}
            </div>
          )}
    </Modal>
  );
}

function EventosTab() {
  const { showToast } = useToast();
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [search, setSearch] = useState("");
  const [openForm, setOpenForm] = useState(false);
  const [editando, setEditando] = useState(null);
  const [openGrupos, setOpenGrupos] = useState(false);
  const [eventoSel, setEventoSel] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await getEventos();
      setEventos(data);
    } catch (err) {
      setLoadError(err.message);
      showToast(err.message, "danger");
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line

  useEffect(() => { load(); }, []);

  async function onDelete(e) {
    if (!window.confirm(`¿Desactivar el evento "${e.nombre}"?`)) return;
    try {
      await deleteEvento(e.id);
      showToast("Evento desactivado", "success");
      load();
    } catch (err) {
      showToast(err.message, "danger");
    }
  }

  async function onToggle(e) {
    try {
      await toggleEventoEstado(e.id, !e.activo);
      showToast(e.activo ? "Evento desactivado" : "Evento activado", "success");
      load();
    } catch (err) {
      showToast(err.message, "danger");
    }
  }

  const filtrado = eventos.filter((e) =>
    !search ||
    e.clave.toLowerCase().includes(search.toLowerCase()) ||
    (e.nombre ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por clave o nombre..." className="pl-8" />
        </div>
        <Btn size="sm" variant="outline" onClick={load}><RefreshCw size={13} /> Recargar</Btn>
        <Btn size="sm" onClick={() => { setEditando(null); setOpenForm(true); }}><Plus size={13} /> Nuevo evento</Btn>
      </div>

      {/* Tabla */}
      <div className="border border-[var(--border)] rounded-2xl overflow-hidden bg-[var(--card)]">
        {loading
          ? <div className="flex justify-center py-12"><Spinner /></div>
          : loadError
            ? <EmptyState message={`Error al cargar: ${loadError}`} />
            : filtrado.length === 0
            ? <EmptyState message="No hay eventos. Crea uno para comenzar." />
            : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)] bg-[var(--muted)]/30">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide">Clave</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide">Nombre</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide">Severidad</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide">Estado</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide">Grupos</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {filtrado.map((e) => (
                      <tr key={e.id} className="hover:bg-[var(--muted)]/20 transition-colors">
                        <td className="px-4 py-3">
                          <code className="text-xs bg-[var(--muted)] px-1.5 py-0.5 rounded font-mono">{e.clave}</code>
                        </td>
                        <td className="px-4 py-3 text-[var(--foreground)]">{e.nombre}</td>
                        <td className="px-4 py-3"><SevBadge value={e.severidad_def} /></td>
                        <td className="px-4 py-3"><EstadoBadge activo={!!e.activo} /></td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-[var(--muted-foreground)]">
                            {typeof e.grupos_asignados === "number" ? `${e.grupos_asignados} grupo${e.grupos_asignados === 1 ? "" : "s"}` : "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => { setEditando(e); setOpenForm(true); }}
                              className="p-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
                              title="Editar">
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => onToggle(e)}
                              className={`p-1.5 rounded-lg transition-colors ${e.activo ? "text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20" : "text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20"}`}
                              title={e.activo ? "Desactivar" : "Activar"}>
                              {e.activo ? <ToggleLeft size={15} /> : <ToggleRight size={15} />}
                            </button>
                            <button
                              onClick={() => { setEventoSel(e); setOpenGrupos(true); }}
                              className="p-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 transition-colors"
                              title="Configurar grupos">
                              <Users size={14} />
                            </button>
                            <button
                              onClick={() => onDelete(e)}
                              className="p-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                              title="Eliminar">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
      </div>

      <EventoFormModal open={openForm} onClose={() => setOpenForm(false)} initial={editando} onSaved={load} />
      <AsignarGruposModal open={openGrupos} onClose={() => setOpenGrupos(false)} evento={eventoSel} onSaved={load} />
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

const TABS = [
  { key: "grupos", label: "Grupos", icon: Users },
  { key: "eventos", label: "Eventos & ruteo", icon: Link2 },
];

export default function Notificaciones() {
  const [tab, setTab] = useState("grupos");

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 h-full">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-[var(--primary)]/10 flex items-center justify-center">
          <Bell size={18} className="text-[var(--primary)]" />
        </div>
        <div>
          <h1 className="text-lg font-black tracking-tight text-[var(--foreground)]">Notificaciones</h1>
          <p className="text-xs text-[var(--muted-foreground)]">Gestiona grupos de destinatarios y eventos de alertas</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-[var(--muted)]/40 rounded-2xl w-fit border border-[var(--border)]">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
              tab === key
                ? "bg-[var(--card)] text-[var(--foreground)] shadow-sm"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            }`}>
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0">
        {tab === "grupos" && <GruposTab />}
        {tab === "eventos" && <EventosTab />}
      </div>
    </div>
  );
}
