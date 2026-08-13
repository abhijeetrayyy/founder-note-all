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
  const [confirmEmail, setConfirmEmail] = React.useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const result = await signUp(form);
    setPending(false);
    if (result?.error) setError(result.error);
    else if (result?.needsConfirmation) setConfirmEmail(result.email ?? "");
  }

  // Email confirmation is on for this project: the account exists but there is
  // no session yet, so there is nothing useful to send them to.
  if (confirmEmail) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md animate-slide-up">
          <Card variant="focused" className="p-8 text-center">
            <h1 className="text-2xl font-bold text-foreground font-display">Check your email</h1>
            <p className="mt-3 text-sm text-foreground-muted">
              We sent a confirmation link to <span className="font-semibold text-foreground">{confirmEmail}</span>.
              Open it and you are in.
            </p>
            <Link href="/login" className="mt-6 inline-block text-sm text-[#F0F0EE] font-medium underline underline-offset-4 decoration-[#35353C] hover:decoration-[#F0F0EE]">
              Back to sign in
            </Link>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-md animate-slide-up">
        <div className="flex items-center justify-center gap-2 mb-8">
          <span className="font-bold text-xl tracking-tight text-foreground font-display">Founder<span className="text-[#FF8A4C]">OS</span></span>
        </div>

        <Card variant="focused" className="p-8">
          <h1 className="text-2xl font-bold text-center text-foreground font-display">Create your account</h1>
          <p className="mt-2 text-sm text-foreground-muted text-center">One task at a time, starting today.</p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <Input name="name" placeholder="Your name" required autoFocus />
            <Input name="email" type="email" placeholder="Email" required />
            <Input name="password" type="password" placeholder="Password" minLength={6} required />
            {error && <p role="alert" className="text-sm text-state-overdue font-semibold">{error}</p>}
            <Button type="submit" className="w-full h-12 text-base" disabled={pending}>
              {pending ? "Creating account…" : "Sign up"}
            </Button>
          </form>
        </Card>

        <p className="mt-6 text-sm text-center text-foreground-muted">
          Already have an account?{" "}
          <Link href="/login" className="text-[#F0F0EE] font-medium underline underline-offset-4 decoration-[#35353C] hover:decoration-[#F0F0EE]">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
