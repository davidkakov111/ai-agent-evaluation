import { redirectIfAuthenticated } from "@/server/auth";
import { LoginForm } from "@/features/auth/components/login-form";

export default async function LoginPage() {
  await redirectIfAuthenticated();

  return (
    <main className="app-shell grid min-h-[85vh] place-items-center">
      <div className="w-full max-w-md">
        <LoginForm />
      </div>
    </main>
  );
}
