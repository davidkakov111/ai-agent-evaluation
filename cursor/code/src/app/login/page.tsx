import { redirectIfAuthenticated } from "@/server/auth";
import { LoginForm } from "@/features/auth/components/login-form";
import { Suspense } from "react";

function LoginFormWrapper() {
  return (
    <Suspense fallback={<div className="h-64 w-64 animate-pulse rounded-lg bg-zinc-200" />}>
      <LoginForm />
    </Suspense>
  );
}

export default async function LoginPage() {
  await redirectIfAuthenticated();

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <LoginFormWrapper />
    </main>
  );
}
