"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormField } from "@/components/auth/form-field";
import { login } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login({ email, password });
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Try again.");
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h1 className="font-display text-[40px] leading-[1.05] tracking-[-0.02em]">Welcome back</h1>
      <p className="mt-3.5 mb-8 text-base leading-relaxed text-ink-soft">
        Your folders are exactly where you left them.
      </p>

      <FormField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <FormField
        label="Password"
        type="password"
        className="mb-7"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />

      {error && <p className="mb-5 text-sm text-rust">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-full bg-ink py-4.25 text-[17px] font-semibold text-paper shadow-[0_18px_36px_-20px_rgba(20,18,14,0.9)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-rust disabled:opacity-50"
      >
        {submitting ? "Logging in…" : "Log in"}
      </button>
      <p className="mt-5.5 text-center text-[15px] text-ink-soft">
        New here?{" "}
        <Link href="/signup" className="font-semibold text-rust">
          Get started free
        </Link>
      </p>
    </form>
  );
}
