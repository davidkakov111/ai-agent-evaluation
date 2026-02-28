import { redirectIfAuthenticated } from "@/server/auth";
import { RegisterForm } from "@/features/auth/components/register-form";

export default async function RegisterPage() {
  await redirectIfAuthenticated();

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <RegisterForm />
    </main>
  );
}
