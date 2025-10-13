"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { isLoggedIn, login } from "@/lib/auth";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await login(email, password);
    if (ok) {
      router.push("/dashboard");
    } else {
      setError("Invalid email or password");
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
        />

        <input
          type="password"
          placeholder="Password"
          className="border border-accent focus:border-accent-hover focus:ring-1 focus:ring-accent-hover rounded-md w-full px-3 py-2 mb-5 outline-none"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          type="submit"
          className="w-full bg-accent hover:bg-accent-hover text-white py-2 rounded-md"
        >
          Sign in
        </button>
      </form>
    </div>
  );
}
