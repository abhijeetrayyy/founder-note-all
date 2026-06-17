"use client";

import * as React from "react";
import Link from "next/link";
import { signUp } from "@/lib/actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function SignupPage() {
  const [error, setError] = React.useState("");
  const [pending, setPending] = React.useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const result = await signUp(form);
    setPending(false);
    if (result?.error) setError(result.error);
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 font-extrabold text-2xl text-primary mb-8">
          <span className="w-9 h-9 rounded-lg bg-primary text-white flex items-center justify-center text-base">F</span>
          FounderOS
        </div>

        <h1 className="text-2xl font-extrabold text-center">Create your account</h1>
        <p className="mt-2 text-sm text-text-muted dark:text-dark-text-muted text-center">Start executing with clarity today.</p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <Input name="name" placeholder="Your name" required autoFocus />
          <Input name="email" type="email" placeholder="Email" required />
          <Input name="password" type="password" placeholder="Password" minLength={6} required />
          {error && <p className="text-sm text-danger font-semibold">{error}</p>}
          <Button type="submit" className="w-full h-12 text-base" disabled={pending}>
            {pending ? "Creating account…" : "Sign up"}
          </Button>
        </form>

        <p className="mt-6 text-sm text-center text-text-muted dark:text-dark-text-muted">
          Already have an account?{" "}
          <Link href="/login" className="text-primary font-bold hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
