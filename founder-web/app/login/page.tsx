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
    <div className="w-full max-w-md animate-pulse">
      <div className="h-9 w-40 bg-base-raised rounded-lg mb-8 mx-auto" />
      <div className="rounded-card glass-focused p-8 space-y-4">
        <div className="h-6 bg-base-raised rounded-lg mx-auto w-40" />
        <div className="h-4 bg-base-raised rounded-lg mx-auto w-52" />
        <div className="pt-4 space-y-3">
          <div className="h-12 bg-base-raised rounded-xl" />
          <div className="h-12 bg-base-raised rounded-xl" />
          <div className="h-12 bg-base-raised rounded-xl" />
        </div>
      </div>
    </div>
  );
}
