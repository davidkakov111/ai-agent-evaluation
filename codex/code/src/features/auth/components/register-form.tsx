"use client";

import { TRPCClientError } from "@trpc/client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getBrowserTrpcClient } from "@/lib/trpc/client";

export function RegisterForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const trpc = getBrowserTrpcClient();

    try {
      await trpc.auth.register.mutate({
        name,
        email,
        password,
      });

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      setIsSubmitting(false);

      if (!result?.ok) {
        setError("Account created, but automatic sign-in failed. Please sign in manually.");
        return;
      }

      router.replace("/");
      router.refresh();
    } catch (unknownError: unknown) {
      setIsSubmitting(false);

      if (unknownError instanceof TRPCClientError) {
        setError(unknownError.message);
        return;
      }

      setError("Unable to create account. Please try again.");
    }
  };

  return (
    <form className="surface stack p-6" onSubmit={onSubmit}>
      <h1 className="text-2xl font-bold">Create Account</h1>
      <p className="text-sm text-[var(--ink-soft)]">Start with your personal TaskFlow user.</p>

      <div>
        <label className="label" htmlFor="name">
          Name
        </label>
        <input
          id="name"
          className="input"
          type="text"
          autoComplete="name"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </div>

      <div>
        <label className="label" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          className="input"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </div>

      <div>
        <label className="label" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          className="input"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <p className="mt-1 text-xs text-[var(--ink-soft)]">
          Must include uppercase, lowercase, and a number.
        </p>
      </div>

      {error !== null ? <p className="text-sm text-red-700">{error}</p> : null}

      <button className="button button-brand" type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Creating..." : "Create account"}
      </button>

      <p className="text-sm text-[var(--ink-soft)]">
        Already have an account?{" "}
        <Link className="font-semibold text-[var(--brand-deep)]" href="/login">
          Sign in
        </Link>
      </p>
    </form>
  );
}
