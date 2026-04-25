import { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useFormik } from "formik";
import * as yup from "yup";
import { useTranslation } from "react-i18next";
import { Car, ArrowLeft, Save, Plus, Loader2 } from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { Button } from "@/components/ui/button";

import {
  addVehiculos,
  actualizarVehiculo,
  getUbicaciones,
  obtenerVehiculos,
} from "@/services/VehiculosService";

import VehiculoFormFields from "@/components/VehiculosForm/VehiculoFormFields";

/* ── Validation ──────────────────────────────────────────────────────────── */

const buildSchema = (t) =>
  yup.object({
    placa:  yup.string().trim().required(t("vehiculos.modal.validation.placa",    "La placa es requerida")),
    marca:  yup.string().trim().required(t("vehiculos.modal.validation.marca",    "La marca es requerida")),
    modelo: yup.string().trim().required(t("vehiculos.modal.validation.modelo",   "El modelo es requerido")),
    estado: yup.string().required(       t("vehiculos.modal.validation.estado",   "El estado es requerido")),
    id_ubicacion_actual: yup
      .number()
      .typeError(t("vehiculos.modal.validation.ubicacion", "La ubicación es requerida"))
      .required( t("vehiculos.modal.validation.ubicacion", "La ubicación es requerida")),
  });

const EMPTY = {
  placa: "",
  marca: "",
  modelo: "",
  estado: "Disponible",
  id_ubicacion_actual: null,
};

/* ── Page ──────────────────────────────────────────────────────────────── */

export default function VehiculosForm() {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const location     = useLocation();
  const { t }        = useTranslation();
  const { can }      = useAuth();
  const { showToast } = useToast();

  const isEditing = Boolean(id);

  const canCreate = can("crear_vehiculo");
  const canEdit   = can("editar_vehiculo");

  const [ubicaciones,    setUbicaciones]    = useState([]);
  const [loadingUbics,   setLoadingUbics]   = useState(true);
  const [loadingVehicle, setLoadingVehicle] = useState(isEditing);

  /* Load ubicaciones */
  useEffect(() => {
    let cancelled = false;
    getUbicaciones()
      .then((d)  => { if (!cancelled) setUbicaciones(Array.isArray(d) ? d : []); })
      .catch(()  => { if (!cancelled) setUbicaciones([]); })
      .finally(() => { if (!cancelled) setLoadingUbics(false); });
    return () => { cancelled = true; };
  }, []);

  const validationSchema = useMemo(() => buildSchema(t), [t]);

  const formik = useFormik({
    initialValues: EMPTY,
    validationSchema,
    enableReinitialize: true,
    validateOnBlur: true,
    validateOnChange: false,
    onSubmit: async (values, { setSubmitting }) => {
      const payload = {
        placa:               values.placa.trim(),
        marca:               values.marca.trim(),
        modelo:              values.modelo.trim(),
        estado:              values.estado,
        id_ubicacion_actual: values.id_ubicacion_actual,
      };
      try {
        if (isEditing) {
          const r = await actualizarVehiculo(Number(id), payload);
          if (r && !r.error) {
            showToast(t("vehiculos.updated", "Vehículo actualizado"), "success");
            navigate("/admin/vehiculos");
          } else {
            showToast(t("vehiculos.error_update", "Error al actualizar"), "danger");
          }
        } else {
          const r = await addVehiculos(payload);
          if (r && !r.error) {
            showToast(t("vehiculos.created", "Vehículo creado"), "success");
            navigate("/admin/vehiculos");
          } else {
            showToast(t("vehiculos.error_create", "Error al crear"), "danger");
          }
        }
      } catch {
        showToast(t("vehiculos.error_unexpected", "Error inesperado"), "danger");
      } finally {
        setSubmitting(false);
      }
    },
  });

  /* Pre-fill for edit: router state first, then API fallback */
  useEffect(() => {
    if (!isEditing) return;

    const fromState = location.state?.vehiculo;
    if (fromState) {
      formik.setValues({
        placa:               fromState.placa   || "",
        marca:               fromState.marca   || "",
        modelo:              fromState.modelo  || "",
        estado:              fromState.estado  || "Disponible",
        id_ubicacion_actual: fromState.id_ubicacion_actual ?? null,
      });
      setLoadingVehicle(false);
      return;
    }

    /* Fallback: fetch list and find by id */
    obtenerVehiculos()
      .then((raw) => {
        const list = Array.isArray(raw) ? raw : (raw?.vehiculos ?? raw?.data ?? []);
        const v    = list.find((x) => String(x.id) === String(id));
        if (v) {
          formik.setValues({
            placa:               v.placa   || "",
            marca:               v.marca   || "",
            modelo:              v.modelo  || "",
            estado:              v.estado  || "Disponible",
            id_ubicacion_actual: v.id_ubicacion_actual ?? null,
          });
        }
      })
      .catch(() => showToast(t("vehiculos.error_load", "Error al cargar datos"), "danger"))
      .finally(() => setLoadingVehicle(false));
  }, [id, isEditing]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Permission guard */
  if ((isEditing && !canEdit) || (!isEditing && !canCreate)) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3 opacity-40">
          <Car size={40} className="mx-auto" />
          <p className="font-semibold text-sm">
            {t("vehiculos.no_permission", "Sin permiso para esta acción")}
          </p>
        </div>
      </div>
    );
  }

  const isLoading = loadingVehicle || loadingUbics;
  const isBusy    = formik.isSubmitting;

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-6 md:py-10 space-y-8 animate-in fade-in duration-500">
      {/* ── Header ── */}
      <div className="flex items-start gap-4">
        <button
          onClick={() => navigate("/admin/vehiculos")}
          className="mt-0.5 p-2 hover:bg-muted dark:hover:bg-slate-800 rounded-xl transition-colors text-muted-foreground hover:text-foreground shrink-0"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-2xl bg-primary/10 dark:bg-primary/15 ring-1 ring-primary/20 dark:ring-primary/30 shadow-sm shadow-primary/10 shrink-0">
            <Car size={22} className="text-primary" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight leading-none">
              {isEditing
                ? t("vehiculos.form.title_edit",   "Editar vehículo")
                : t("vehiculos.form.title_create", "Nuevo vehículo")}
            </h1>
            <p className="text-muted-foreground text-xs md:text-sm font-medium mt-0.5">
              {isEditing
                ? t("vehiculos.form.subtitle_edit",   "Modifica los datos del vehículo")
                : t("vehiculos.form.subtitle_create", "Completa la información para registrar un vehículo")}
            </p>
          </div>
        </div>
      </div>

      {/* ── Form ── */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center gap-4 py-24">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Loader2 className="animate-spin text-primary" size={22} />
          </div>
          <p className="text-sm text-muted-foreground font-medium">
            {t("vehiculos.loading", "Cargando datos...")}
          </p>
        </div>
      ) : (
        <form onSubmit={formik.handleSubmit} className="space-y-6">
          <div className="bg-card dark:bg-slate-900/40 border border-border/60 rounded-3xl shadow-sm p-6 space-y-5">
            <div className="flex items-center gap-2.5 pb-1">
              <div className="p-1.5 bg-muted dark:bg-slate-800 rounded-xl">
                <Car size={15} className="text-muted-foreground" />
              </div>
              <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                {t("vehiculos.form.section_info", "Información del vehículo")}
              </h2>
            </div>

            <VehiculoFormFields
              formik={formik}
              isBusy={isBusy}
              ubicOptions={ubicaciones}
              isLoadingUbics={false}
              t={t}
            />
          </div>

          {/* ── Actions ── */}
          <div className="flex flex-col sm:flex-row gap-3 pt-1">
            <Button
              type="submit"
              disabled={isBusy}
              className="flex-1 sm:flex-none sm:min-w-[180px] rounded-2xl h-11 font-bold shadow-md shadow-primary/15 hover:shadow-primary/25 transition-all gap-2 disabled:opacity-60"
            >
              {isBusy ? (
                <Loader2 size={16} className="animate-spin" />
              ) : isEditing ? (
                <Save size={16} />
              ) : (
                <Plus size={16} />
              )}
              {isBusy
                ? t("vehiculos.form.saving", "Guardando...")
                : isEditing
                  ? t("vehiculos.form.update", "Guardar cambios")
                  : t("vehiculos.form.create", "Crear vehículo")}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/admin/vehiculos")}
              disabled={isBusy}
              className="flex-1 sm:flex-none sm:min-w-[140px] rounded-2xl h-11 font-bold"
            >
              {t("vehiculos.modal.cancel", "Cancelar")}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
