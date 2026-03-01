"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

import { trpc } from "@/lib/trpc/react";

export function RegisterForm() {
  const router = useRouter();
  const registerMutation = trpc.auth.register.useMutation();

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    try {
      await registerMutation.mutateAsync({ email, name, password });

      const signInResult = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (!signInResult || signInResult.error) {
        setErrorMessage("Registration succeeded, but sign-in failed.");
        return;
      }

      router.push("/onboarding");
      router.refresh();
    } catch {
      setErrorMessage("Unable to register. Try another email.");
    }
  }

  return (
    <form className="panel stack-sm" onSubmit={onSubmit}>
      <h1>Create your TaskFlow account</h1>
      <p className="muted">You will join or create an organization after sign-up.</p>
      <label className="stack-xs">
        <span>Name</span>
        <input
          className="input"
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
          minLength={2}
        />
      </label>
      <label className="stack-xs">
        <span>Email</span>
        <input
          className="input"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </label>
      <label className="stack-xs">
        <span>Password</span>
        <input
          className="input"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          minLength={8}
        />
      </label>
      {errorMessage ? <p className="banner error">{errorMessage}</p> : null}
      <button className="button" type="submit" disabled={registerMutation.isPending}>
        {registerMutation.isPending ? "Creating account..." : "Create account"}
      </button>
    </form>
  );
}
