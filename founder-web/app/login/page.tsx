import { Suspense } from "react";
import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <Suspense fallback={<LoginSkeleton />}>
        <LoginForm />
      </Suspense>
    </main>
  );
}

function LoginSkeleton() {
  return (
    <div className="w-full max-w-sm animate-pulse">
      <div className="h-8 bg-surface-alt dark:bg-dark-surface-alt rounded-lg mb-8 mx-auto w-40" />
      <div className="h-6 bg-surface-alt dark:bg-dark-surface-alt rounded-lg mb-2" />
      <div className="h-4 bg-surface-alt dark:bg-dark-surface-alt rounded-lg mb-8 w-3/4 mx-auto" />
      <div className="space-y-4">
        <div className="h-12 bg-surface-alt dark:bg-dark-surface-alt rounded-xl" />
        <div className="h-12 bg-surface-alt dark:bg-dark-surface-alt rounded-xl" />
        <div className="h-12 bg-surface-alt dark:bg-dark-surface-alt rounded-xl" />
      </div>
    </div>
  );
}
