"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Mail, Lock, ArrowRight, User, Key } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function EmailAuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      const supabase = createClient();

      if (mode === "signup") {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName || undefined
            },
            emailRedirectTo: `${window.location.origin}/auth/callback`
          }
        });
        if (signUpError) throw signUpError;
        setVerificationSent(true);
        setMessage("A verification code was sent to your email.");
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (signInError) throw signInError;
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setVerifying(true);

    try {
      const supabase = createClient();
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: "signup"
      });

      if (verifyError) throw verifyError;

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid code. Please try again.");
    } finally {
      setVerifying(false);
    }
  }

  if (verificationSent) {
    return (
      <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
        <div className="text-center mb-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2f7867]/10 text-[#2f7867] mb-4">
            <Key className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-bold tracking-tight text-[#1f2528]">Confirm your account</h2>
          <p className="text-xs text-[#627078] mt-1.5 leading-relaxed">
            We sent a verification code to <span className="font-semibold text-[#1f2528]">{email}</span>.
          </p>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-[0.8rem] font-semibold text-[#3a444a]">Verification Code</span>
          <span className="flex items-center gap-2.5 rounded-xl border border-[#1f2528]/12 bg-white px-3.5 py-2.5 focus-within:border-[#2f7867]/50">
            <Lock className="h-4 w-4 text-[#8a949a]" />
            <input
              type="text"
              required
              maxLength={12}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              placeholder="123456"
              className="w-full bg-transparent text-sm text-[#1f2528] outline-none placeholder:text-[#a7b0b5] tracking-widest font-mono text-center"
            />
          </span>
        </label>

        {error ? <p className="text-[0.82rem] font-medium text-[#a53b28] text-center">{error}</p> : null}

        <button
          type="submit"
          disabled={verifying}
          className="marketing-cta-primary mt-1 w-full justify-center disabled:opacity-60"
        >
          {verifying ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              Verify and login
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            setVerificationSent(false);
            setError(null);
          }}
          className="text-xs font-bold text-[#627078] hover:text-[#1f2528] text-center mt-2 cursor-pointer"
        >
          Change email or password
        </button>
      </form>
    );
  }

  return (
    <div>
      <div className="mb-5 flex rounded-full bg-[#f1f2ed] p-1 text-sm font-semibold">
        <button
          type="button"
          onClick={() => setMode("signin")}
          className={`flex-1 rounded-full py-2 transition cursor-pointer ${
            mode === "signin" ? "bg-white text-[#1f2528] shadow-sm" : "text-[#7b858d]"
          }`}
        >
          Sign in
        </button>
        <button
          type="button"
          onClick={() => setMode("signup")}
          className={`flex-1 rounded-full py-2 transition cursor-pointer ${
            mode === "signup" ? "bg-white text-[#1f2528] shadow-sm" : "text-[#7b858d]"
          }`}
        >
          Create account
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        {mode === "signup" && (
          <label className="flex flex-col gap-1.5 animate-fadeIn">
            <span className="text-[0.8rem] font-semibold text-[#3a444a]">Full Name</span>
            <span className="flex items-center gap-2.5 rounded-xl border border-[#1f2528]/12 bg-white px-3.5 py-2.5 focus-within:border-[#2f7867]/50">
              <User className="h-4 w-4 text-[#8a949a]" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Alex Morgan"
                className="w-full bg-transparent text-sm text-[#1f2528] outline-none placeholder:text-[#a7b0b5]"
              />
            </span>
          </label>
        )}

        <label className="flex flex-col gap-1.5">
          <span className="text-[0.8rem] font-semibold text-[#3a444a]">Email</span>
          <span className="flex items-center gap-2.5 rounded-xl border border-[#1f2528]/12 bg-white px-3.5 py-2.5 focus-within:border-[#2f7867]/50">
            <Mail className="h-4 w-4 text-[#8a949a]" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="w-full bg-transparent text-sm text-[#1f2528] outline-none placeholder:text-[#a7b0b5]"
            />
          </span>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[0.8rem] font-semibold text-[#3a444a]">Password</span>
          <span className="flex items-center gap-2.5 rounded-xl border border-[#1f2528]/12 bg-white px-3.5 py-2.5 focus-within:border-[#2f7867]/50">
            <Lock className="h-4 w-4 text-[#8a949a]" />
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-transparent text-sm text-[#1f2528] outline-none placeholder:text-[#a7b0b5]"
            />
          </span>
        </label>

        {mode === "signup" && (
          <div className="text-[0.72rem] text-[#627078] flex flex-col gap-1 mt-0.5 bg-[#fbfbf9] p-3 rounded-xl border border-[#1f2528]/5">
            <span className="font-bold uppercase tracking-wider text-[#2f7867]">Password Requirements</span>
            <span className="flex items-center gap-1.5">
              <span className={`h-1.5 w-1.5 rounded-full ${password.length >= 6 ? "bg-[#20613a]" : "bg-slate-300"}`} />
              At least 6 characters
            </span>
          </div>
        )}

        {error ? <p className="text-[0.82rem] font-medium text-[#a53b28]">{error}</p> : null}
        {message && !verificationSent ? <p className="text-[0.82rem] font-medium text-[#20613a]">{message}</p> : null}

        <button
          type="submit"
          disabled={loading}
          className="marketing-cta-primary mt-1 w-full justify-center disabled:opacity-60 cursor-pointer"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              {mode === "signin" ? "Sign in" : "Create account"}
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
