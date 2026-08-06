"use client";

import * as React from "react";
import Link from "next/link";
import { signUp } from "@/lib/actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function SignupPage() {
  const [error, setError] = React.useState("");
  const [pending, setPending] = React.useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setPending(true); setError("");
    const form = new FormData(e.currentTarget);
    const result = await signUp(form);
    setPending(false);
    if (result?.error) setError(result.error);
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm animate-scale-in">
        <div className="flex items-center justify-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-accent-600 to-accent-700 text-white flex items-center justify-center text-sm font-extrabold font-display shadow-glow">F</div>
          <span className="font-bold text-xl tracking-tight text-foreground font-display">Founder<span className="text-gradient">OS</span></span>
        </div>

        <Card variant="focused" className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-foreground font-display">Create your account</h1>
            <p className="mt-1.5 text-sm text-foreground-muted">One task at a time, starting today.</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-3.5">
            <div className="space-y-1.5">
              <label className="text-2xs uppercase tracking-wider text-foreground-subtle font-bold">Name</label>
              <Input name="name" placeholder="Your name" required autoFocus className="h-12 rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <label className="text-2xs uppercase tracking-wider text-foreground-subtle font-bold">Email</label>
              <Input name="email" type="email" placeholder="hello@example.com" required className="h-12 rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <label className="text-2xs uppercase tracking-wider text-foreground-subtle font-bold">Password</label>
              <Input name="password" type="password" placeholder="At least 6 characters" minLength={6} required className="h-12 rounded-xl" />
            </div>
            {error && <p role="alert" className="text-sm text-state-overdue font-semibold text-center">{error}</p>}
            <Button type="submit" className="w-full h-12 text-[15px] rounded-xl" disabled={pending}>
              {pending ? "Creating account…" : "Sign up"}
            </Button>
          </form>
        </Card>

        <p className="mt-6 text-sm text-center text-foreground-muted">
          Already have an account?{" "}
          <Link href="/login" className="text-accent font-semibold hover:underline">Log in</Link>
        </p>
      </div>
    </main>
  );
}
