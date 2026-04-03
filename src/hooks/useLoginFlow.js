// src/hooks/useLoginFlow.js
import { useState } from "react";
import Swal from "sweetalert2";
import { useNavigate, useSearchParams } from "react-router-dom";
import { login } from "@/services/AuthServices";
import {
  getLoginOptions,
  verifyLoginPasskey,
} from "@/services/webAuthn.service";
import { startAuthentication } from "@simplewebauthn/browser";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";

export const useLoginFlow = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirect");

  const { refreshUser } = useAuth();
  const { showToast } = useToast();

  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  });

  const [step, setStep] = useState("credentials"); // 👈 clave
  const [loading, setLoading] = useState(false);
  const [availableMethods, setAvailableMethods] = useState({
    passkey: false,
    totp: false,
  });

  const [hasPasskey, setHasPasskey] = useState(false);

  const handlePasswordless = async () => {
    try {
      setLoading(true);
      // 1. Pedimos opciones al server SIN mandarle el username
      const options = await getLoginOptions("");

      // 2. El navegador abrirá el selector de cuentas (FaceID/Huella)
      // y te mostrará los usuarios que tenés guardados para AutoLog.
      const assertion = await startAuthentication(options);

      // 3. Verificamos la firma
      const data = await verifyLoginPasskey(assertion);

      if (data?.ok) {
        await handleLoginSuccess(data.rol);
      }
    } catch (error) {
      console.error("Passwordless error:", error);
      if (error.name !== "NotAllowedError") {
        showToast("No se encontraron llaves guardadas", "info");
      }
    } finally {
      setLoading(false);
    }
  };

  const checkPasskeyAvailability = async (username) => {
    if (username.length > 3) {
      try {
        // Llamamos a tu servicio de opciones
        const options = await getLoginOptions(username);
        // Si el server devuelve opciones, es que el usuario existe y tiene passkey
        setHasPasskey(
          !!(
            options.data?.allowCredentials?.length > 0 ||
            options.allowCredentials?.length > 0
          ),
        );
      } catch {
        setHasPasskey(false);
      }
    } else {
      setHasPasskey(false);
    }
  };

  // ✅ SUCCESS
  const handleLoginSuccess = async (role) => {
    try {
      const user = await refreshUser();
      if (!user) throw new Error();

      Swal.fire({
        title: "¡Bienvenido!",
        text: "Inicio de sesión exitoso",
        icon: "success",
        timer: 1200,
        showConfirmButton: false,
      }).then(() => {
        if (redirectTo) return navigate(redirectTo, { replace: true });
        redirectByRole(user.rol || role);
      });
    } catch {
      Swal.fire("Error", "No se pudo establecer sesión", "error");
    }
  };

  // ✅ LOGIN BASE
  const handleLogin = async () => {
    setLoading(true);
    try {
      const data = await login(credentials.username, credentials.password);

      const methods = {
        passkey: !!data.require_passkey,
        totp: !!data.require_2fa,
      };

      if (methods.passkey || methods.totp) {
        setAvailableMethods(methods);
        setStep("method-selection");
        return;
      }

      await handleLoginSuccess(data.rol);
    } catch (error) {
      Swal.fire("Error", "Credenciales incorrectas", "error");
    } finally {
      setLoading(false);
    }
  };

  // ✅ PASSKEY (UNIFICADO)
  const handlePasskey = async () => {
    if (!credentials.username) {
      showToast("Ingresa tu usuario primero", "warning");
      return;
    }

    try {
      setLoading(true);

      const options = await getLoginOptions(credentials.username);
      const assertion = await startAuthentication(options);
      const data = await verifyLoginPasskey(assertion);

      if (!data) throw new Error();

      await handleLoginSuccess(data.rol);
    } catch (error) {
      console.error(error);
      showToast("Error con biometría", "danger");
    } finally {
      setLoading(false);
    }
  };

  // ✅ 2FA
  const handleVerify2FA = async (code) => {
    try {
      setLoading(true);

      const data = await login(
        credentials.username,
        credentials.password,
        code,
      );

      if (!data?.rol) throw new Error();

      setStep("credentials");
      await handleLoginSuccess(data.rol);
    } catch {
      Swal.fire({
        title: "Error",
        text: "Código incorrecto",
        icon: "error",
        toast: true,
        timer: 2500,
        showConfirmButton: false,
      });
    } finally {
      setLoading(false);
    }
  };

  const redirectByRole = (rol) => {
    const routes = {
      Admin: "/admin/home",
      Supervisor: "/admin/home",
      Empleado: "/admin/panel-vehiculos",
      default: "/admin/panel-vehiculos",
    };
    navigate(routes[rol] || routes.default);
  };

  const onForgotPassword = () => {
    navigate("/auth/forgot-password");
  };

  return {
    credentials,
    setCredentials,
    handleLogin,
    handlePasskey,
    handleVerify2FA,
    step,
    setStep,
    loading,
    availableMethods,
    checkPasskeyAvailability,
    handlePasswordless,
    onForgotPassword,
  };
};
