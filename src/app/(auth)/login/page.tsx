"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  ArrowRight,
  Loader2,
  AlertCircle,
  Mail,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";
import { PasswordInput } from "@/components/password-field";

type LoginStep = "login" | "verify";

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<LoginStep>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  async function requestNewCode(): Promise<void> {
    const res = await fetch("/api/auth/resend-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to send verification code");
    }
    setInfoMessage(`We sent a verification code to ${data.destination || email}.`);
  }

  async function signIn(): Promise<"ok" | "unverified"> {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();

    // 403 = correct credentials but the account has not been verified yet
    if (res.status === 403) {
      return "unverified";
    }
    if (!res.ok) {
      throw new Error(data.error || "Login failed");
    }
    return "ok";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfoMessage(null);
    setLoading(true);

    try {
      const result = await signIn();
      if (result === "unverified") {
        // One-time verification: send a fresh code and ask for it right here.
        try {
          await requestNewCode();
        } catch (err) {
          setError(err instanceof Error ? err.message : "Failed to send verification code");
        }
        setStep("verify");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/confirm-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, confirmationCode: code }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Verification failed");
      }

      // Verified once, now sign in automatically with the credentials already entered.
      const result = await signIn();
      if (result === "ok") {
        router.push("/dashboard");
        router.refresh();
        return;
      }
      setStep("login");
      setError("Your account is verified. Please sign in.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setError(null);
    setResending(true);
    try {
      await requestNewCode();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resend code");
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-muted/30">
      <div className="w-full max-w-md space-y-6 rounded-2xl border bg-card p-6 md:p-8 shadow-sm">
        <div className="space-y-2 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Fitme Auth
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            {step === "verify" ? "Verify your email" : "Welcome back"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {step === "verify"
              ? "Enter the 6-digit code we emailed you. You only need to do this once."
              : "Sign in to access your Master Vault and Resume Pipeline"}
          </p>
        </div>

        {error && (
          <div className="flex items-start gap-2 p-3 text-sm rounded-lg bg-destructive/10 text-destructive border border-destructive/20">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-snug">{error}</span>
          </div>
        )}

        {infoMessage && step === "verify" && (
          <div className="flex items-start gap-2 p-3 text-sm rounded-lg bg-primary/10 text-primary border border-primary/20">
            <Mail className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-snug">{infoMessage}</span>
          </div>
        )}

        {step === "login" ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground" htmlFor="email">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3.5 py-2 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-foreground" htmlFor="password">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <PasswordInput
                id="password"
                value={password}
                onChange={setPassword}
                autoComplete="current-password"
              />
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
                  <span>Sign in</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-foreground" htmlFor="code">
                  Verification Code
                </label>
                <button
                  type="button"
                  onClick={handleResend}
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
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="123456"
                className="w-full px-3.5 py-2 text-base rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 tracking-widest font-mono text-center"
              />
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
                  <span>Verify &amp; Continue</span>
                  <CheckCircle2 className="w-4 h-4" />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep("login");
                setCode("");
                setError(null);
                setInfoMessage(null);
              }}
              className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Back to sign in
            </button>
          </form>
        )}

        {step === "login" && (
          <div className="text-center text-xs text-muted-foreground pt-2">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-semibold text-primary hover:underline">
              Create an account
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
