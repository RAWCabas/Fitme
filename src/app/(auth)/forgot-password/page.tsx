"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Mail,
  RefreshCw,
} from "lucide-react";
import { PasswordInput, PasswordRequirements } from "@/components/password-field";
import { isPasswordValid, PASSWORD_POLICY_MESSAGE } from "@/lib/auth/password-policy";

type RecoveryStep = "request" | "verify" | "success";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<RecoveryStep>("request");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  // Step 1: Request recovery code
  async function handleRequestCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfoMessage(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to send recovery code");
      }

      setInfoMessage(`We've sent a verification code to ${data.destination || email}.`);
      setStep("verify");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send recovery code");
    } finally {
      setLoading(false);
    }
  }

  // Resend code in Step 2
  async function handleResendCode() {
    setError(null);
    setResending(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to resend code");
      }

      setInfoMessage(`A fresh verification code was sent to ${data.destination || email}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resend recovery code");
    } finally {
      setResending(false);
    }
  }

  // Step 2: Confirm code and set new password
  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!isPasswordValid(newPassword)) {
      setError(PASSWORD_POLICY_MESSAGE);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match. Please re-enter.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          confirmationCode: code,
          newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to reset password");
      }

      setStep("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-muted/30">
      <div className="w-full max-w-md space-y-6 rounded-2xl border bg-card p-6 md:p-8 shadow-sm">
        {/* Header */}
        <div className="space-y-2 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Fitme Auth
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            {step === "success"
              ? "Password Reset"
              : step === "verify"
              ? "Set new password"
              : "Reset password"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {step === "success"
              ? "Your password has been updated successfully"
              : step === "verify"
              ? "Enter the code sent to your email and your new password"
              : "Enter your account email to receive a recovery code"}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="flex items-start gap-2 p-3 text-sm rounded-lg bg-destructive/10 text-destructive border border-destructive/20">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-snug">{error}</span>
          </div>
        )}

        {/* Info / Success Notice */}
        {infoMessage && step === "verify" && (
          <div className="flex items-start gap-2 p-3 text-sm rounded-lg bg-primary/10 text-primary border border-primary/20">
            <Mail className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-snug">{infoMessage}</span>
          </div>
        )}

        {/* STEP 1: Request Code Form */}
        {step === "request" && (
          <form onSubmit={handleRequestCode} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground" htmlFor="email">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-9 pr-3.5 py-2 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Send Recovery Code</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* STEP 2: Verify & Enter New Password Form */}
        {step === "verify" && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-foreground" htmlFor="code">
                  6-Digit Verification Code
                </label>
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={resending}
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${resending ? "animate-spin" : ""}`} />
                  <span>Resend code</span>
                </button>
              </div>
              <input
                id="code"
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="123456"
                className="w-full px-3.5 py-2 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 tracking-widest font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground" htmlFor="newPassword">
                New Password (min. 8 characters)
              </label>
              <PasswordInput
                id="newPassword"
                value={newPassword}
                onChange={setNewPassword}
                autoComplete="new-password"
              />
              <PasswordRequirements password={newPassword} />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground" htmlFor="confirmPassword">
                Confirm New Password
              </label>
              <PasswordInput
                id="confirmPassword"
                value={confirmPassword}
                onChange={setConfirmPassword}
                autoComplete="new-password"
              />
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Reset Password</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setStep("request");
                }}
                className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Change email address ({email})</span>
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: Success State */}
        {step === "success" && (
          <div className="space-y-5 text-center py-2">
            <div className="mx-auto w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center border border-emerald-500/20">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h2 className="text-base font-semibold text-foreground">Password reset successful!</h2>
              <p className="text-xs text-muted-foreground">
                You can now sign in to your Fitme account using your new password.
              </p>
            </div>

            <button
              type="button"
              onClick={() => router.push("/login")}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <span>Continue to Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Footer Navigation */}
        <div className="text-center text-xs text-muted-foreground pt-2">
          Remember your password?{" "}
          <Link href="/login" className="font-semibold text-primary hover:underline">
            Back to Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

