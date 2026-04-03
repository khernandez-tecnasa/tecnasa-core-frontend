// src/pages/Auth/Login.jsx
import LoginForm from "@/components/Login/LoginForm";
import TwoFactorVerifyModal from "@/components/Login/TwoFactorVerifyModal";
import MethodSelectorModal from "@/components/Login/MethodSelectorModal";
import { useLoginFlow } from "@/hooks/useLoginFlow";

export default function Login() {
  const {
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
  } = useLoginFlow();

  return (
    <>
      <LoginForm
        credentials={credentials}
        setCredentials={setCredentials}
        onSubmit={() => {
          if (credentials.username && !credentials.password) {
            handlePasskey();
          } else {
            handleLogin();
          }
        }}
        onPasskeyClick={handlePasskey}
        loading={loading}
        onPasswordlessClick={handlePasswordless}
        onForgotPassword={onForgotPassword}
      />

      {step === "method-selection" && (
        <MethodSelectorModal
          methods={availableMethods}
          onSelectPasskey={() => handlePasskey()}
          onSelectTOTP={() => setStep("totp")}
          onClose={() => setStep("credentials")}
        />
      )}

      {step === "totp" && (
        <TwoFactorVerifyModal
          open
          onClose={() => setStep("credentials")}
          onVerify={handleVerify2FA}
          loading={loading}
        />
      )}
    </>
  );
}
