import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-background px-4">
      <div className="flex flex-col items-center gap-4 text-center">
        <h1 className="text-4xl font-bold tracking-tight">TaskFlow</h1>
        <p className="max-w-md text-lg text-muted-foreground">
          Multi-tenant task management platform for teams. Create organizations,
          manage tasks, and collaborate with your team.
        </p>
      </div>
      <div className="flex gap-4">
        <Button asChild>
          <Link href="/login">Sign In</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/register">Create Account</Link>
        </Button>
      </div>
    </div>
  );
}
