"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction, signupAction, type FormState } from "@/actions/auth";
import { Icon } from "./icon";

export function AuthForm({
  mode,
  next,
  github,
  demo,
  error,
  notice,
}: {
  mode: "login" | "signup";
  next: string;
  github: boolean;
  demo: boolean;
  error?: string;
  notice?: string;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(mode === "login" ? loginAction : signupAction, error ? { error } : undefined);
  const nextQ = next ? `?next=${encodeURIComponent(next)}` : "";

  return (
    <div className="auth-card">
      <div className="stack gap-6">
        <h1 className="display-m">{mode === "login" ? "Welcome back" : "Start building"}</h1>
        <p className="soft">
          {mode === "login" ? "Log in to your projects, notebook and community." : "Create your free account. It takes about 20 seconds."}
        </p>
      </div>

      {notice ? (
        <p className="notice" role="status">
          <Icon name="check" /> <span>{notice}</span>
        </p>
      ) : null}

      {github ? (
        <>
          <a href={`/api/auth/github${nextQ}`} className="btn btn-lg btn-block">
            <Icon name="branch" /> Continue with GitHub
          </a>
          <p className="tiny muted" style={{ textAlign: "center", marginTop: -8 }}>
            By continuing with GitHub you agree to the{" "}
            <Link className="link" href="/terms">
              Terms of Use
            </Link>{" "}
            and{" "}
            <Link className="link" href="/privacy">
              Privacy Policy
            </Link>
            .
          </p>
          <div className="or">or</div>
        </>
      ) : null}

      <form action={action} className="stack gap-12">
        <input type="hidden" name="next" value={next} />
        {mode === "signup" ? (
          <label className="field">
            <span className="label">Your name</span>
            <input className="input" name="name" autoComplete="name" required maxLength={60} />
          </label>
        ) : null}
        <label className="field">
          <span className="label">Email</span>
          <input className="input" name="email" type="email" autoComplete="email" required />
        </label>
        <label className="field">
          <span className="label">Password</span>
          <input
            className="input"
            name="password"
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            required
            minLength={mode === "signup" ? 8 : undefined}
          />
          {mode === "signup" ? <span className="hint">At least 8 characters.</span> : null}
        </label>
        {mode === "signup" ? (
          <label className="check" style={{ alignItems: "flex-start" }}>
            <input type="checkbox" name="agree" required style={{ marginTop: 3 }} />
            <span>
              I agree to the{" "}
              <Link className="link" href="/terms" target="_blank">
                Terms of Use
              </Link>{" "}
              and{" "}
              <Link className="link" href="/privacy" target="_blank">
                Privacy Policy
              </Link>
              , including the community rules.
            </span>
          </label>
        ) : null}
        {state?.error ? (
          <p className="form-error" role="alert">
            {state.error}
          </p>
        ) : null}
        <button className="btn btn-primary btn-lg btn-block" disabled={pending}>
          {pending ? <span className="spinner" /> : null}
          {mode === "login" ? "Log in" : "Create account"}
        </button>
      </form>

      {demo && mode === "login" ? (
        <a href={`/api/dev/demo${nextQ}`} className="btn btn-ghost btn-block">
          <Icon name="eye" /> Try the demo account
        </a>
      ) : null}

      <p className="small soft" style={{ textAlign: "center" }}>
        {mode === "login" ? (
          <>
            New to Foundry?{" "}
            <Link className="link" href={`/signup${nextQ}`}>
              Create an account
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link className="link" href={`/login${nextQ}`}>
              Log in
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
