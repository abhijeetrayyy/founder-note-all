"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signIn } from "@/lib/actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function LoginForm() {
  const search = useSearchParams();
  const [error, setError] = React.useState("");
  const [pending, setPending] = React.useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setPending(true); setError("");
    const form = new FormData(e.currentTarget);
    const result = await signIn(form);
    setPending(false);
    if (result?.error) setError(result.error);
  }

  return (
    <div className="w-full max-w-md animate-slide-up">
      <div className="flex items-center justify-center gap-2 mb-8">
        <span className="font-bold text-xl tracking-tight text-foreground font-display">Founder<span className="text-[#FF8A4C]">OS</span></span>
      </div>
      <Card variant="focused" className="p-8">
        <h1 className="text-2xl font-bold text-center text-foreground font-display">Welcome back</h1>
        <p className="mt-2 text-sm text-foreground-muted text-center">Pick up where you left off.</p>
        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          {/* Carries the deep link the middleware interrupted, so signing in
              returns you to the page you actually asked for. */}
          <input type="hidden" name="next" value={search?.get("next") ?? ""} />
          <Input name="email" type="email" placeholder="Email" required autoFocus />
          <Input name="password" type="password" placeholder="Password" required />
          {error && <p role="alert" className="text-sm text-state-overdue font-semibold">{error}</p>}
          <Button type="submit" className="w-full h-12 text-base" disabled={pending}>
            {pending ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </Card>
      <p className="mt-6 text-sm text-center text-foreground-muted">
        New here?{" "}
        <Link href={`/signup${search?.get("next") ? `?next=${encodeURIComponent(search.get("next")!)}` : ""}`} className="text-[#F0F0EE] font-medium underline underline-offset-4 decoration-[#35353C] hover:decoration-[#F0F0EE]">
          Create an account
        </Link>
      </p>
    </div>
  );
}
