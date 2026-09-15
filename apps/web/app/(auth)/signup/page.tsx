"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormField } from "@/components/auth/form-field";
import { PasswordStrength } from "@/components/auth/password-strength";
import { signup } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signup({ name, email, password });
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Try again.");
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h1 className="font-display text-[40px] leading-[1.05] tracking-[-0.02em]">Make a workspace</h1>
      <p className="mt-3.5 mb-8 text-base leading-relaxed text-ink-soft">
        Takes about twenty seconds. Your first storage is on us, forever.
      </p>

      <FormField label="Name" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} />
      <FormField
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <FormField
        label="Password"
        type="password"
        className="mb-2.5"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        minLength={8}
      />
      <PasswordStrength password={password} />

      {error && <p className="mb-5 text-sm text-rust">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-full bg-rust py-4.25 text-[17px] font-semibold text-paper shadow-[0_18px_36px_-18px_rgba(178,60,11,0.85)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-ink disabled:opacity-50"
      >
        {submitting ? "Creating…" : "Create my workspace"}
      </button>
      <p className="mt-5.5 text-center text-[15px] text-ink-soft">
        Already have one?{" "}
        <Link href="/login" className="font-semibold text-rust">
          Log in
        </Link>
      </p>
    </form>
  );
}
