// src/pages/Users/UsersForm.jsx
import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useFormik } from "formik";
import * as yup from "yup";
import {
  Users2,
  ArrowLeft,
  Save,
  Plus,
  Loader2,
  Eye,
  EyeOff,
  RefreshCw,
  Search,
  ChevronDown,
  AlertTriangle,
  MapPin,
  UserCog,
  Building2,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { Button } from "@/components/ui/button";

import {
  getUsersById,
  createUserService,
  updateUser,
  getUserSupervisors,
} from "@/services/AuthServices";
import { getRoles } from "@/services/RolesServices";
import { getCiudades } from "@/services/RegistrosService";
import { sendMail } from "@/services/MailServices";

// ── Generador de contraseña segura ────────────────────────────────────────────

function generateSecurePassword(length = 12) {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnopqrstuvwxyz";
  const numbers = "23456789";
  const special = "@#$%&*_-+!";
  const all = upper + lower + numbers + special;
  let pwd = "";
  pwd += upper[Math.floor(Math.random() * upper.length)];
  pwd += lower[Math.floor(Math.random() * lower.length)];
  pwd += numbers[Math.floor(Math.random() * numbers.length)];
  pwd += special[Math.floor(Math.random() * special.length)];
  for (let i = pwd.length; i < length; i++) {
    pwd += all[Math.floor(Math.random() * all.length)];
  }
  return pwd
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
}

// ── SearchableSelect ──────────────────────────────────────────────────────────

const SearchableSelect = ({
  value,
  onChange,
  onBlur,
  options,
  placeholder,
  disabled,
  emptyLabel = "Sin resultados",
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef(null);

  const filtered = useMemo(
    () =>
      options.filter((o) =>
        (o.label || "").toLowerCase().includes(query.toLowerCase()),
      ),
    [options, query],
  );

  const selected = options.find((o) => String(o.value) === String(value));

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        onBlur?.();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onBlur]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          setOpen((v) => !v);
          setQuery("");
        }}
        className={[
          "w-full flex items-center justify-between gap-2 rounded-xl border px-4 py-2.5 text-sm transition-all duration-200 outline-none text-left",
          "bg-background dark:bg-slate-900/60",
          open
            ? "border-primary/70 ring-2 ring-primary/20 shadow-sm"
            : "border-border hover:border-primary/40 hover:shadow-sm",
          "disabled:opacity-50 disabled:cursor-not-allowed",
        ].join(" ")}>
        <span
          className={
            selected
              ? "font-medium text-foreground"
              : "text-muted-foreground text-sm"
          }>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          size={15}
          className={`text-muted-foreground shrink-0 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="absolute z-[200] top-full mt-1.5 w-full rounded-2xl border border-border/80 bg-card dark:bg-slate-900 shadow-2xl shadow-black/15 dark:shadow-black/50 overflow-hidden animate-in fade-in zoom-in-95 slide-in-from-top-1 duration-150">
          <div className="p-2 border-b border-border/50">
            <div className="relative">
              <Search
                size={13}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/70"
              />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar..."
                className="w-full bg-muted/40 dark:bg-slate-800/80 rounded-lg pl-8 pr-3 py-1.5 text-xs outline-none placeholder:text-muted-foreground/60 focus:ring-1 ring-primary/20 transition-all"
              />
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto overscroll-contain py-1.5 px-1.5 space-y-0.5">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center gap-1.5 py-6 text-muted-foreground">
                <Search size={16} className="opacity-40" />
                <p className="text-xs">{emptyLabel}</p>
              </div>
            ) : (
              filtered.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => {
                    onChange(String(o.value));
                    setOpen(false);
                  }}
                  className={[
                    "w-full text-left px-3 py-2 text-sm rounded-xl transition-all duration-150",
                    String(value) === String(o.value)
                      ? "bg-primary/10 dark:bg-primary/20 text-primary font-semibold"
                      : "hover:bg-muted/60 dark:hover:bg-slate-800 text-foreground",
                  ].join(" ")}>
                  {o.label}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ── Componente Field ─────────────────────────────────────────────────────────

const Field = ({ label, required, error, children }) => (
  <div className="space-y-1.5">
    <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
      {label}
      {required && <span className="text-primary ml-1">*</span>}
    </label>
    {children}
    {error && (
      <p className="text-[11px] text-rose-500 font-semibold flex items-center gap-1">
        <AlertTriangle size={10} />
        {error}
      </p>
    )}
  </div>
);

// ── Componente principal ──────────────────────────────────────────────────────

export default function UsersForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { can } = useAuth();
  const { showToast } = useToast();

  const isEditing = Boolean(id);

  const canCreate = can("crear_usuario");
  const canEdit = can("editar_usuario");

  const [roles, setRoles] = useState([]);
  const [ciudades, setCiudades] = useState([]);
  const [supervisores, setSupervisores] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  // ── Esquema dinámico según modo ─────────────────────────────────────────────
  const validationSchema = useMemo(
    () =>
      yup.object({
        nombre: yup
          .string()
          .trim()
          .min(2, "Mínimo 2 caracteres")
          .required("Nombre requerido"),
        email: yup
          .string()
          .email("Correo inválido")
          .required("Correo requerido"),
        username: yup
          .string()
          .trim()
          .min(3, "Mínimo 3 caracteres")
          .required("Usuario requerido"),
        password: isEditing
          ? yup.string().notRequired()
          : yup
              .string()
              .min(8, "Mínimo 8 caracteres")
              .required("Contraseña requerida"),
        rol_id: yup.string().notRequired(),
        puesto: yup.string().notRequired(),
        id_ciudad: yup.string().notRequired(),
        supervisor_id: yup.string().notRequired(),
      }),
    [isEditing],
  );

  // ── Formik ──────────────────────────────────────────────────────────────────
  const formik = useFormik({
    initialValues: {
      nombre: "",
      email: "",
      username: "",
      password: isEditing ? "" : generateSecurePassword(),
      rol_id: "",
      puesto: "",
      id_ciudad: "",
      supervisor_id: "",
    },
    validationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      const payload = {
        nombre: values.nombre.trim(),
        email: values.email.trim(),
        username: values.username.trim(),
        rol_id: values.rol_id ? Number(values.rol_id) : null,
        puesto: values.puesto || null,
        id_ciudad: values.id_ciudad || null,
        supervisor_id: values.supervisor_id || null,
      };

      try {
        if (isEditing) {
          const r = await updateUser({ id_usuario: Number(id), ...payload });
          if (r && !r.error) {
            showToast("Usuario actualizado", "success");
            navigate("/admin/usuarios/");
          } else {
            showToast("Error al actualizar", "danger");
          }
        } else {
          const r = await createUserService({
            ...payload,
            password: values.password,
          });
          if (r && !r.error) {
            showToast("Usuario creado correctamente", "success");
            navigate("/admin/usuarios/");
          } else {
            showToast("Error al crear usuario", "danger");
          }
        }
      } catch {
        showToast("Error inesperado", "danger");
      } finally {
        setSubmitting(false);
      }
    },
  });

  // ── Carga de catálogos ──────────────────────────────────────────────────────
  useEffect(() => {
    const loadAll = async () => {
      setLoadingData(true);
      try {
        const [rolesData, ciudadesData, supervisoresRaw] = await Promise.all([
          getRoles(),
          getCiudades(),
          getUserSupervisors(),
        ]);

        // Normalizar: la API puede devolver el array directo o envuelto
        const normArray = (raw, ...keys) => {
          if (Array.isArray(raw)) return raw;
          for (const k of keys) {
            if (Array.isArray(raw?.[k])) return raw[k];
          }
          return [];
        };

        setRoles(normArray(rolesData, "roles", "data"));
        setCiudades(normArray(ciudadesData, "ciudades", "data"));
        setSupervisores(
          normArray(supervisoresRaw, "supervisores", "empleados", "data"),
        );
      } catch {
        showToast("Error al cargar catálogos", "danger");
      } finally {
        setLoadingData(false);
      }
    };
    loadAll();
  }, []);

  // ── Carga usuario para edición ──────────────────────────────────────────────
  useEffect(() => {
    if (!isEditing || loadingData) return;

    const fetchUser = async () => {
      try {
        const raw = await getUsersById(Number(id));

        let user;

        if (Array.isArray(raw)) {
          user = raw[0];
        } else {
          user = raw?.usuario ?? raw?.user ?? raw?.data ?? raw;
        }

        if (user) {
          formik.setValues({
            nombre: user.nombre || "",
            email: user.email || "",
            username: user.username || "",
            password: "",
            rol_id: user.rol_id ? String(user.rol_id) : "",
            puesto: user.puesto || "",
            id_ciudad: user.id_ciudad ? String(user.id_ciudad) : "",
            supervisor_id: user.supervisor_id ? String(user.supervisor_id) : "",
          });
        }
      } catch {
        showToast("Error al cargar el usuario", "danger");
      }
    };

    fetchUser();
  }, [id, isEditing, loadingData]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Options para selects ────────────────────────────────────────────────────
  const roleOptions = useMemo(
    () =>
      roles.map((r) => ({
        value: r.id,
        label: r.nombre || r.name || `Rol ${r.id}`,
      })),
    [roles],
  );
  const cityOptions = useMemo(
    () =>
      ciudades.map((c) => ({
        value: c.id,
        label: c.nombre || c.ciudad || `Ciudad ${c.id}`,
      })),
    [ciudades],
  );
  const supervisorOptions = useMemo(
    () =>
      supervisores.map((s) => ({
        value: s.id_usuario, // 🔥 aquí está el cambio
        label: s.nombre || `Supervisor ${s.id_usuario}`,
      })),
    [supervisores],
  );

  // ── Guard ───────────────────────────────────────────────────────────────────
  if (isEditing && !canEdit) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3 opacity-40">
          <Users2 size={40} className="mx-auto" />
          <p className="font-semibold text-sm">Sin permiso para editar</p>
        </div>
      </div>
    );
  }
  if (!isEditing && !canCreate) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3 opacity-40">
          <Users2 size={40} className="mx-auto" />
          <p className="font-semibold text-sm">Sin permiso para crear</p>
        </div>
      </div>
    );
  }

  const isSubmitting = formik.isSubmitting;

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-6 md:py-10 space-y-8 animate-in fade-in duration-500">
      {/* ── HEADER ── */}
      <div className="flex items-start gap-4">
        <button
          onClick={() => navigate("/admin/usuarios/")}
          className="mt-0.5 p-2 hover:bg-muted dark:hover:bg-slate-800 rounded-xl transition-colors text-muted-foreground hover:text-foreground shrink-0">
          <ArrowLeft size={18} />
        </button>
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-2xl bg-primary/10 dark:bg-primary/15 ring-1 ring-primary/20 dark:ring-primary/30 shadow-sm shadow-primary/10 shrink-0">
            <Users2 size={22} className="text-primary" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight leading-none">
              {isEditing ? "Editar Usuario" : "Nuevo Usuario"}
            </h1>
            <p className="text-muted-foreground text-xs md:text-sm font-medium mt-0.5">
              {isEditing
                ? "Modifica los datos del usuario"
                : "Completa la información para crear un nuevo usuario"}
            </p>
          </div>
        </div>
      </div>

      {/* ── FORMULARIO ── */}
      {loadingData ? (
        <div className="flex flex-col items-center justify-center gap-4 py-24">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Loader2 className="animate-spin text-primary" size={22} />
          </div>
          <p className="text-sm text-muted-foreground font-medium">
            Cargando datos...
          </p>
        </div>
      ) : (
        <form onSubmit={formik.handleSubmit} className="space-y-6">
          {/* ── Sección: Información básica ── */}
          <div className="bg-card dark:bg-slate-900/40 border border-border/60 rounded-3xl shadow-sm p-6 space-y-5">
            <div className="flex items-center gap-2.5 pb-1">
              <div className="p-1.5 bg-muted dark:bg-slate-800 rounded-xl">
                <UserCog size={15} className="text-muted-foreground" />
              </div>
              <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                Información básica
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nombre */}
              <Field
                label="Nombre completo"
                required
                error={formik.touched.nombre && formik.errors.nombre}>
                <input
                  name="nombre"
                  value={formik.values.nombre}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  disabled={isSubmitting}
                  placeholder="ej: Juan García"
                  className={inputClass(
                    formik.touched.nombre && formik.errors.nombre,
                  )}
                />
              </Field>

              {/* Correo */}
              <Field
                label="Correo electrónico"
                required
                error={formik.touched.email && formik.errors.email}>
                <input
                  name="email"
                  type="email"
                  value={formik.values.email}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  disabled={isSubmitting}
                  placeholder="ej: juan@empresa.com"
                  className={inputClass(
                    formik.touched.email && formik.errors.email,
                  )}
                />
              </Field>

              {/* Username */}
              <Field
                label="Nombre de usuario"
                required
                error={formik.touched.username && formik.errors.username}>
                <input
                  name="username"
                  value={formik.values.username}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  disabled={isSubmitting}
                  placeholder="ej: jgarcia"
                  className={inputClass(
                    formik.touched.username && formik.errors.username,
                  )}
                />
              </Field>

              {/* Puesto */}
              <Field
                label="Puesto"
                error={formik.touched.puesto && formik.errors.puesto}>
                <input
                  name="puesto"
                  value={formik.values.puesto}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  disabled={isSubmitting}
                  placeholder="ej: Analista, Conductor..."
                  className={inputClass(false)}
                />
              </Field>
            </div>

            {/* Contraseña — solo al crear */}
            {!isEditing && (
              <Field
                label="Contraseña inicial"
                required
                error={formik.touched.password && formik.errors.password}>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={formik.values.password}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      disabled={isSubmitting}
                      placeholder="Contraseña auto-generada"
                      className={`${inputClass(
                        formik.touched.password && formik.errors.password,
                      )} pr-10`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      formik.setFieldValue("password", generateSecurePassword())
                    }
                    disabled={isSubmitting}
                    title="Generar nueva contraseña"
                    className="shrink-0 p-2.5 rounded-xl border border-border bg-muted/40 hover:bg-muted/80 hover:border-primary/40 transition-all text-muted-foreground hover:text-foreground disabled:opacity-50">
                    <RefreshCw size={15} />
                  </button>
                </div>
              </Field>
            )}
          </div>

          {/* ── Sección: Configuración del sistema ── */}
          <div className="bg-card dark:bg-slate-900/40 border border-border/60 rounded-3xl shadow-sm p-6 space-y-5">
            <div className="flex items-center gap-2.5 pb-1">
              <div className="p-1.5 bg-muted dark:bg-slate-800 rounded-xl">
                <Building2 size={15} className="text-muted-foreground" />
              </div>
              <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                Configuración del sistema
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Rol */}
              <Field
                label="Rol"
                error={formik.touched.rol_id && formik.errors.rol_id}>
                <SearchableSelect
                  value={formik.values.rol_id}
                  onChange={(val) => formik.setFieldValue("rol_id", val)}
                  onBlur={() => formik.setFieldTouched("rol_id", true)}
                  options={roleOptions}
                  placeholder="Selecciona un rol..."
                  disabled={isSubmitting}
                  emptyLabel="Sin roles disponibles"
                />
              </Field>

              {/* Ciudad */}
              <Field
                label="Ciudad"
                error={formik.touched.id_ciudad && formik.errors.id_ciudad}>
                <SearchableSelect
                  value={formik.values.id_ciudad}
                  onChange={(val) => formik.setFieldValue("id_ciudad", val)}
                  onBlur={() => formik.setFieldTouched("id_ciudad", true)}
                  options={cityOptions}
                  placeholder="Selecciona una ciudad..."
                  disabled={isSubmitting}
                  emptyLabel="Sin ciudades disponibles"
                />
              </Field>

              {/* Supervisor */}
              <Field
                label="Supervisor"
                error={
                  formik.touched.supervisor_id && formik.errors.supervisor_id
                }>
                <SearchableSelect
                  value={formik.values.supervisor_id}
                  onChange={(val) => formik.setFieldValue("supervisor_id", val)}
                  onBlur={() => formik.setFieldTouched("supervisor_id", true)}
                  options={supervisorOptions}
                  placeholder="Selecciona un supervisor..."
                  disabled={isSubmitting}
                  emptyLabel="Sin supervisores disponibles"
                />
              </Field>
            </div>
          </div>

          {/* ── Botones de acción ── */}
          <div className="flex flex-col sm:flex-row gap-3 pt-1">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 sm:flex-none sm:min-w-[180px] rounded-2xl h-11 font-bold shadow-md shadow-primary/15 hover:shadow-primary/25 transition-all gap-2 disabled:opacity-60">
              {isSubmitting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : isEditing ? (
                <Save size={16} />
              ) : (
                <Plus size={16} />
              )}
              {isSubmitting
                ? "Guardando..."
                : isEditing
                  ? "Guardar Cambios"
                  : "Crear Usuario"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/admin/usuarios/")}
              disabled={isSubmitting}
              className="flex-1 sm:flex-none sm:min-w-[140px] rounded-2xl h-11 font-bold">
              Cancelar
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

// ── Clase base de input ───────────────────────────────────────────────────────

function inputClass(hasError) {
  return [
    "w-full rounded-xl border px-4 py-2.5 text-sm transition-all outline-none",
    "bg-background dark:bg-slate-900/60 placeholder:text-muted-foreground/50",
    hasError
      ? "border-rose-400/70 ring-2 ring-rose-400/20"
      : "border-border focus:border-primary/60 focus:ring-2 focus:ring-primary/20",
    "disabled:opacity-60",
  ].join(" ");
}
