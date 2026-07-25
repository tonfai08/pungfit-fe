"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { isLoggedIn, login, loginWithGoogle } from "@/lib/api/auth";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    try {
      setSubmitting(true);
      setError("");
      const ok = await login(email, password);
      if (ok) {
        router.push("/dashboard");
      } else {
        setError("Invalid email or password");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleLogin = async (credentialResponse: CredentialResponse) => {
    if (submitting || !credentialResponse.credential) return;

    try {
      setSubmitting(true);
      setError("");
      const ok = await loginWithGoogle(credentialResponse.credential);
      if (ok) {
        router.push("/dashboard");
      } else {
        setError("เข้าสู่ระบบด้วย Google ไม่สำเร็จ");
      }
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn()) {
      router.push("/dashboard");
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-bg-theme text-text-primary flex items-center justify-center">
      <form
        onSubmit={handleLogin}
        className="bg-white p-8 rounded-2xl shadow-md w-full max-w-sm flex flex-col items-center"
      >
      <Image
      className="w-[200px] mb-3"
          src="/logo.png"
          alt="PungFit Logo"
          width={200}
        height={200}
          priority
        />

        {error && (
          <p className="text-red-500 text-sm mb-3 text-center">{error}</p>
        )}

        <input
          type="email"
          placeholder="Email"
          className="border border-accent focus:border-accent-hover focus:ring-1 focus:ring-accent-hover rounded-md w-full px-3 py-2 mb-3 outline-none"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={submitting}
        />

        <input
          type="password"
          placeholder="Password"
          className="border border-accent focus:border-accent-hover focus:ring-1 focus:ring-accent-hover rounded-md w-full px-3 py-2 mb-5 outline-none"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={submitting}
        />

        <button
          type="submit"
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-accent py-2 text-white hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-70"
        >
          {submitting ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          ) : null}
          {submitting ? "Signing in..." : "Sign in"}
        </button>

        <div className="flex items-center gap-3 w-full my-4">
          <div className="h-px flex-1 bg-gray-200" />
          <span className="text-xs text-gray-400">หรือ</span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>

        <GoogleLogin
          onSuccess={handleGoogleLogin}
          onError={() => setError("เข้าสู่ระบบด้วย Google ไม่สำเร็จ")}
          width="304"
        />
      </form>
      {submitting ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-[1px]">
          <div className="rounded-2xl bg-white px-6 py-5 text-center shadow-xl">
            <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-accent/20 border-t-accent" />
            <p className="text-sm font-medium text-gray-700">กำลังเข้าสู่ระบบ...</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
