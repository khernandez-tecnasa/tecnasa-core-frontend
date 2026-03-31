import React, { useState, useRef, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { QrCode, KeyRound, Smartphone, X } from "lucide-react";
import { useToast } from "@/context/ToastContext";

export default function TwoFactorSetupModal({
  open,
  onClose,
  setupData,
  onVerify,
}) {
  const { t } = useTranslation();
  const { showToast } = useToast();

  const length = 6;
  const [values, setValues] = useState(Array(length).fill(""));
  const inputsRef = useRef([]);

  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState(null);
  const [copying, setCopying] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open) {
      setValues(Array(length).fill(""));
      setError(null);
      setTimeout(() => inputsRef.current[0]?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    const code = values.join("");
    if (code.length === length && !verifying) {
      handleVerify();
    }
  }, [values]);

  const handleChangeAt = useCallback((index, raw) => {
    const digit = raw.replace(/\D/g, "").slice(0, 1);
    if (!digit) return;

    setValues((prev) => {
      const next = [...prev];
      next[index] = digit;
      return next;
    });

    if (index + 1 < length) {
      inputsRef.current[index + 1]?.focus();
    }
  }, []);

  const handleKeyDown = useCallback((e, index) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      setValues((prev) => {
        const next = [...prev];
        if (next[index]) next[index] = "";
        else if (index > 0) {
          next[index - 1] = "";
          inputsRef.current[index - 1]?.focus();
        }
        return next;
      });
    }
  }, []);

  const handlePaste = useCallback((e) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text").replace(/\D/g, "");
    const digits = text.slice(0, length).split("");

    setValues((prev) => {
      const next = [...prev];
      digits.forEach((d, i) => (next[i] = d));
      return next;
    });
  }, []);

  const code = values.join("");

  const handleVerify = async () => {
    if (code.length !== length) return;
    setVerifying(true);
    setError(null);
    try {
      await onVerify(code);
      onClose();
    } catch {
      if (navigator.vibrate) navigator.vibrate(200);
      setError("Código inválido");
      setValues(Array(length).fill(""));
      inputsRef.current[0]?.focus();
    } finally {
      setVerifying(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      {/* BACKDROP */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />

      {/* MODAL */}
      <div
        className="
        relative w-full md:max-w-md
        bg-[var(--background)]
        rounded-t-2xl md:rounded-2xl
        shadow-xl
        p-5
        animate-ios-forward
        text-[var(--foreground)]
        border
        border-3
      ">
        {/* CLOSE */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-[var(--muted-foreground)]">
          <X size={18} />
        </button>

        {/* HEADER */}
        <div className="text-center space-y-2 mb-4">
          <div className="mx-auto w-12 h-12 flex items-center justify-center rounded-full bg-[var(--muted)]">
            <QrCode size={22} />
          </div>

          <h2 className="text-lg font-semibold">
            {t("settings.security.2fa_modal.title")}
          </h2>

          <p className="text-sm text-[var(--muted-foreground)]">
            {t("settings.security.2fa_modal.subtitle")}
          </p>
        </div>

        {/* QR */}
        <div className="flex flex-col items-center gap-3 mb-5">
          <div className="p-3 rounded-xl border border-[var(--border)] bg-white">
            {setupData?.qr_image ? (
              <img src={setupData.qr_image} className="w-40 h-40" />
            ) : (
              <div className="w-40 h-40 flex items-center justify-center">
                <div className="w-10 h-1 bg-[var(--muted)] animate-pulse rounded" />
              </div>
            )}
          </div>

          {setupData?.secret && (
            <div className="text-center bg-[var(--muted)] px-3 py-2 rounded-lg w-full">
              <div className="text-center bg-[var(--muted)] px-3 py-2 rounded-lg w-full space-y-1">
                <p className="text-xs flex items-center justify-center gap-1">
                  <KeyRound size={12} />
                  Código manual
                </p>

                <div className="flex items-center justify-center gap-2">
                  <p className="font-mono text-sm tracking-widest select-all text-[var(--muted-foreground)]">
                    {setupData.secret}
                  </p>

                  <button
                    onClick={async () => {
                      if (!setupData?.secret) return;
                      try {
                        setCopying(true);
                        await navigator.clipboard.writeText(setupData.secret);
                        setCopied(true);
                        showToast(
                          t("settings.security.2fa_modal.copied"),
                          "success",
                        );
                        setTimeout(() => setCopied(false), 1800);
                      } catch (e) {
                        console.error("Error copiando secret:", e);
                        showToast(
                          t("settings.security.2fa_modal.copy_error"),
                          "danger",
                        );
                      } finally {
                        setCopying(false);
                      }
                    }}
                    aria-label={t("settings.security.2fa_modal.copy_btn")}
                    className="text-xs px-2 py-1 rounded-md border border-[var(--border)] hover:bg-[var(--muted)] transition">
                    {copying
                      ? t("settings.security.2fa_modal.copying")
                      : copied
                        ? t("settings.security.2fa_modal.copied_short") ||
                          t("settings.security.2fa_modal.copied")
                        : t("settings.security.2fa_modal.copy_btn")}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* OTP */}
        <div className="space-y-4">
          <p className="text-sm flex items-center gap-2 justify-center">
            <Smartphone size={16} />
            {t("settings.security.2fa_modal.input_label")}
          </p>

          <div onPaste={handlePaste} className="flex justify-center gap-2">
            {values.map((val, i) => (
              <input
                key={i}
                ref={(el) => (inputsRef.current[i] = el)}
                value={val}
                onChange={(e) => handleChangeAt(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, i)}
                maxLength={1}
                inputMode="numeric"
                autoComplete={i === 0 ? "one-time-code" : "off"}
                name={i === 0 ? "otp" : undefined}
                className="
                  w-10 h-12 md:w-12 md:h-14
                  text-center text-lg font-mono
                  border border-[var(--border)]
                  rounded-lg
                  dark:bg-[var(--popover)]
                  focus:outline-none
                  focus:ring-2 focus:ring-[hsl(var(--primary))]
                  transition
                  focus:scale-105
                  transition-transform
                "
              />
            ))}
          </div>

          {error && <p className="text-xs text-red-500 text-center">{error}</p>}

          <button
            onClick={handleVerify}
            disabled={code.length !== length || verifying}
            className="
              w-full py-3 rounded-lg
              bg-[hsl(var(--primary))]
              text-white
              font-medium
              disabled:opacity-50
              transition
            ">
            {verifying
              ? "Verificando..."
              : t("settings.security.2fa_modal.verify_btn")}
          </button>
        </div>
      </div>
    </div>
  );
}
