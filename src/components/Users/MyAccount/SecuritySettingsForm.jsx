import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Key, Eye, EyeOff, Save, CheckCircle2, Circle } from "lucide-react";

import ConfirmModal from "../../ui/ConfirmModal";
import { useToast } from "../../../context/ToastContext";
import { updateUser } from "../../../services/AuthServices";

/* ── Strength ── */
function getStrength(pass) {
  if (!pass) return 0;
  let s = 0;
  if (pass.length >= 8) s += 20;
  if (/[a-z]/.test(pass)) s += 20;
  if (/[A-Z]/.test(pass)) s += 20;
  if (/\d/.test(pass)) s += 20;
  if (/[@$!%*?&._-]/.test(pass)) s += 20;
  return s;
}

function strengthMeta(s) {
  if (s <= 20) return { bar: "bg-red-400", text: "text-red-500", key: "weak" };
  if (s < 80)
    return { bar: "bg-amber-400", text: "text-amber-500", key: "medium" };
  return { bar: "bg-emerald-500", text: "text-emerald-600", key: "strong" };
}

/* ── Password field ── */
function PasswordInput({
  id,
  name,
  label,
  placeholder,
  value,
  onChange,
  onBlur,
  error,
  touched,
  show,
  onToggle,
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
        {label}
      </label>
      <div
        className={`
        flex items-center gap-2 px-3 py-2.5 rounded-xl
        border bg-white dark:bg-gray-900 transition-colors
        ${
          touched && error
            ? "border-red-400 dark:border-red-600 ring-1 ring-red-400/30"
            : "border-gray-200 dark:border-gray-700 focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20"
        }
      `}>
        <Key className="w-4 h-4 text-gray-400 shrink-0" />
        <input
          id={id}
          name={name}
          type={show ? "text" : "password"}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          autoComplete="new-password"
          className="flex-1 bg-transparent text-sm text-gray-800 dark:text-gray-200 placeholder:text-gray-400 outline-none"
        />
        <button
          type="button"
          onClick={onToggle}
          tabIndex={-1}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {touched && error && (
        <p className="text-xs text-red-500 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}

/* ── Requirement item ── */
function ReqItem({ ok, label }) {
  return (
    <li className="flex items-center gap-2 text-xs transition-colors duration-150">
      {ok ? (
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
      ) : (
        <Circle className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600 shrink-0" />
      )}
      <span
        className={
          ok
            ? "text-gray-700 dark:text-gray-300"
            : "text-gray-400 dark:text-gray-500"
        }>
        {label}
      </span>
    </li>
  );
}

/* ── Main ── */
export default function SecuritySettingsForm({ user }) {
  const { t } = useTranslation();
  const { showToast } = useToast();

  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, setPending] = useState(null);

  const validationSchema = useMemo(
    () =>
      Yup.object({
        password: Yup.string()
          .required(t("account.security.validation.required"))
          .min(8, t("account.security.validation.min_length"))
          .matches(/[a-z]/, t("account.security.validation.lowercase"))
          .matches(/[A-Z]/, t("account.security.validation.uppercase"))
          .matches(/\d/, t("account.security.validation.number"))
          .matches(/[@$!%*?&._-]/, t("account.security.validation.special")),
        confirmPassword: Yup.string()
          .required(
            t(
              "account.security.validation.confirm_required",
              "Confirma tu contraseña",
            ),
          )
          .oneOf(
            [Yup.ref("password")],
            t(
              "account.security.validation.passwords_match",
              "Las contraseñas no coinciden",
            ),
          ),
      }),
    [t],
  );

  const formik = useFormik({
    initialValues: {
      password: "",
      confirmPassword: "",
      email: user.email || "",
    },
    validationSchema,
    onSubmit: (values) => {
      setPending(values);
      setConfirmOpen(true);
    },
  });

  const handleConfirm = async () => {
    setConfirmOpen(false);
    if (!pending) return;
    try {
      const data = await updateUser({
        id_usuario: user.id_usuario || user.id,
        email: pending.email,
        password: pending.password,
      });
      if (data?.error) {
        showToast(data.error, "danger");
      } else {
        showToast(t("account.security.success_update"), "success");
        formik.resetForm();
      }
    } catch {
      showToast(t("common.network_error"), "danger");
    } finally {
      setPending(null);
    }
  };

  const pass = formik.values.password;
  const strength = getStrength(pass);
  const meta = strengthMeta(strength);
  const showRules = pass.length > 0;

  return (
    <>
      <form onSubmit={formik.handleSubmit} className="space-y-5 max-w-sm">
        {/* New password */}
        <PasswordInput
          id="password"
          name="password"
          label={t("account.security.new_password_label")}
          placeholder={t("account.security.placeholder")}
          value={pass}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.errors.password}
          touched={formik.touched.password}
          show={showPass}
          onToggle={() => setShowPass((v) => !v)}
        />

        {/* Strength bar — only while typing */}
        {showRules && (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {t("account.security.password_strength")}
              </span>
              <span className={`text-xs font-medium ${meta.text}`}>
                {t(`account.security.strength.${meta.key}`)}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${meta.bar}`}
                style={{ width: `${strength}%` }}
              />
            </div>
          </div>
        )}

        {/* Requirements — only while typing */}
        {showRules && (
          <ul className="space-y-1.5 pl-0.5">
            <ReqItem
              ok={pass.length >= 8}
              label={t("account.security.req.min_chars")}
            />
            <ReqItem
              ok={/[A-Z]/.test(pass)}
              label={t("account.security.req.uppercase")}
            />
            <ReqItem
              ok={/[a-z]/.test(pass)}
              label={t("account.security.req.lowercase")}
            />
            <ReqItem
              ok={/\d/.test(pass)}
              label={t("account.security.req.number")}
            />
            <ReqItem
              ok={/[@$!%*?&._-]/.test(pass)}
              label={t("account.security.req.special")}
            />
          </ul>
        )}

        {/* Confirm password */}
        <PasswordInput
          id="confirmPassword"
          name="confirmPassword"
          label={t(
            "account.security.confirm_password_label",
            "Confirmar contraseña",
          )}
          placeholder={t(
            "account.security.confirm_placeholder",
            "Repite tu contraseña",
          )}
          value={formik.values.confirmPassword}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.errors.confirmPassword}
          touched={formik.touched.confirmPassword}
          show={showConfirm}
          onToggle={() => setShowConfirm((v) => !v)}
        />

        {/* Passwords match indicator */}
        {formik.values.confirmPassword.length > 0 && (
          <p
            className={`text-xs flex items-center gap-1.5 -mt-3 ${
              formik.values.password === formik.values.confirmPassword
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-red-500 dark:text-red-400"
            }`}>
            {formik.values.password === formik.values.confirmPassword ? (
              <CheckCircle2 className="w-3.5 h-3.5" />
            ) : (
              <Circle className="w-3.5 h-3.5" />
            )}
            {formik.values.password === formik.values.confirmPassword
              ? t(
                  "account.security.passwords_match_ok",
                  "Las contraseñas coinciden",
                )
              : t(
                  "account.security.validation.passwords_match",
                  "Las contraseñas no coinciden",
                )}
          </p>
        )}

        <button
          type="submit"
          disabled={!formik.isValid || !formik.dirty}
          className="
            flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-[var(--foreground)]
            bg-primary hover:opacity-90 active:opacity-80
            disabled:opacity-40 disabled:cursor-not-allowed
            transition-opacity
          ">
          <Save className="w-4 h-4" />
          {t("account.security.btn_save")}
        </button>
      </form>

      <ConfirmModal
        open={confirmOpen}
        onCancel={() => {
          setConfirmOpen(false);
          setPending(null);
        }}
        onConfirm={handleConfirm}
        variant="warning"
        title={t("account.security.confirm_title")}
        description={t("account.security.confirm_text")}
        confirmLabel={t("common.actions.confirm")}
        cancelLabel={t("common.actions.cancel")}
      />
    </>
  );
}
