"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { ErrorNote, inputClass } from "@/components/ui";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [signup, setSignup] = useState(params.get("mode") === "signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    // Accounts aren't wired up yet — this install runs single-user, so the form takes you
    // straight in rather than pretending to authenticate.
    router.push("/queue");
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-16 lg:grid lg:grid-cols-[1fr_minmax(0,26rem)] lg:items-center lg:gap-20">
      <div className="hidden flex-col gap-5 lg:flex">
        <h1 className="font-display text-3xl font-semibold leading-tight tracking-tight text-balance">
          Your shortlist is waiting.
        </h1>
        <p className="max-w-md leading-relaxed text-muted">
          Sign in to see the jobs that cleared your bar today, why each one scored what it did, and
          the proposal already drafted for it.
        </p>
        <ul className="flex flex-col gap-2 text-sm text-muted">
          {[
            "Scored against your own skills and rate floors",
            "Every score explained, every rejection too",
            "Nothing sent without your confirmation",
          ].map((line) => (
            <li key={line} className="flex gap-2.5">
              <span aria-hidden="true" className="text-accent">
                —
              </span>
              {line}
            </li>
          ))}
        </ul>
      </div>

      <div className="w-full">
        <div className="rounded-xl border border-border bg-surface p-6">
          <h2 className="font-display text-xl font-semibold tracking-tight">
            {signup ? "Create your account" : "Sign in"}
          </h2>
          <p className="mt-1 text-sm text-muted">
            {signup ? "Free while in early access. No card." : "Welcome back."}
          </p>

          <ErrorNote>
            Accounts aren&apos;t connected yet — this install runs as a single user, so either
            button takes you straight to the queue.
          </ErrorNote>

          <form onSubmit={submit} className="mt-4 flex flex-col gap-3.5">
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Email</span>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={inputClass}
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium">Password</span>
              <input
                type="password"
                required
                minLength={8}
                autoComplete={signup ? "new-password" : "current-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={signup ? "At least 8 characters" : ""}
                className={inputClass}
              />
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="mt-1 rounded-md bg-accent px-4 py-2.5 font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {signup ? "Create account" : "Sign in"}
            </button>
          </form>

          <p className="mt-4 text-sm text-muted">
            {signup ? "Already have an account?" : "New here?"}{" "}
            <button
              type="button"
              onClick={() => setSignup(!signup)}
              className="font-medium text-accent hover:underline"
            >
              {signup ? "Sign in" : "Create one"}
            </button>
          </p>
        </div>

        <p className="mt-4 text-center text-xs text-muted">
          <Link href="/" className="hover:text-foreground">
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
