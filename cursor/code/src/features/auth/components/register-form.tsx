"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { registerAction } from "@/app/actions/register";

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const form = event.currentTarget;
    const formData = new FormData(form);

    const result = await registerAction(formData);

    if (result !== undefined && !result.success) {
      setError(result.error);
      setIsSubmitting(false);
      return;
    }

    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const signInResult = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setIsSubmitting(false);

    if (!signInResult?.ok) {
      setError("Account created, but automatic sign-in failed. Please sign in manually.");
      return;
    }

    router.replace("/");
    router.refresh();
  };

  return (
    <form
      className="flex w-full max-w-md flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
      onSubmit={onSubmit}
    >
      <h1 className="text-2xl font-bold">Create Account</h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Start with your personal TaskFlow user.
      </p>

      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="name">
          Name
        </label>
        <input
          id="name"
          name="name"
          className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800"
          type="text"
          autoComplete="name"
          required
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          name="email"
          className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800"
          type="email"
          autoComplete="email"
          required
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          name="password"
          className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
        />
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Must include uppercase, lowercase, and a number.
        </p>
      </div>

      {error !== null ? (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : null}

      <button
        className="rounded-md bg-zinc-900 px-4 py-2 font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        type="submit"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Creating..." : "Create account"}
      </button>

      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Already have an account?{" "}
        <Link className="font-semibold underline" href="/login">
          Sign in
        </Link>
      </p>
    </form>
  );
}
