import { redirectIfAuthenticated } from "@/server/auth";
import { RegisterForm } from "@/features/auth/components/register-form";

export default async function RegisterPage() {
  await redirectIfAuthenticated();

  return (
    <main className="app-shell grid min-h-[85vh] place-items-center">
      <div className="w-full max-w-md">
        <RegisterForm />
      </div>
    </main>
  );
}
