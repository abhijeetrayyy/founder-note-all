"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signIn } from "@/lib/actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function LoginForm() {
  const search = useSearchParams();
  const [error, setError] = React.useState("");
  const [pending, setPending] = React.useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const result = await signIn(form);
    setPending(false);
    if (result?.error) setError(result.error);
  }

  return (
    <div className="w-full max-w-sm">
      <div className="flex items-center justify-center gap-2 font-extrabold text-2xl text-primary mb-8">
        <span className="w-9 h-9 rounded-lg bg-primary text-white flex items-center justify-center text-base">F</span>
        FounderOS
      </div>

      <h1 className="text-2xl font-extrabold text-center">Welcome back</h1>
      <p className="mt-2 text-sm text-text-muted dark:text-dark-text-muted text-center">Log in to continue executing.</p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <Input name="email" type="email" placeholder="Email" required autoFocus />
        <Input name="password" type="password" placeholder="Password" required />
        {error && <p className="text-sm text-danger font-semibold">{error}</p>}
        <Button type="submit" className="w-full h-12 text-base" disabled={pending}>
          {pending ? "Logging in…" : "Log in"}
        </Button>
      </form>

      <p className="mt-6 text-sm text-center text-text-muted dark:text-dark-text-muted">
        Don&apos;t have an account?{" "}
        <Link href={`/signup${search?.get("next") ? `?next=${encodeURIComponent(search.get("next")!)}` : ""}`} className="text-primary font-bold hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
