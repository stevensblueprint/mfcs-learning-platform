"use client";

import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/mockAuth";
import AuthLayout from "@/components/auth/AuthLayout";
import auth from "@/components/auth/AuthLayout.module.css";
import Alert from "@/components/ui/Alert";
import FeedbackDialog from "@/components/ui/FeedbackDialog";
import styles from "./login.module.css";

type LoginError = { title: string; detail: string };

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<LoginError | null>(null);
  const [succeeded, setSucceeded] = useState(false);
  const usernameInput = useRef<HTMLInputElement>(null);
  const submitted = useRef(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitted.current) return;
    submitted.current = true;
    try {
      const session = login(username, password);
      if (!session) {
        setError({
          title: "Invalid username or password.",
          detail: "Please check your information and try again.",
        });
        usernameInput.current?.focus();
        submitted.current = false;
        return;
      }
      setError(null);
      setShowPassword(false);
      setSucceeded(true);
    } catch {
      setError({
        title: "We couldn’t log you in.",
        detail:
          "Please try again. Your browser must allow site storage to sign in.",
      });
      submitted.current = false;
    }
  }

  return (
    <AuthLayout
      dialog={
        <FeedbackDialog
          open={succeeded}
          onClose={() => router.replace("/lessons")}
          title="Success!"
          description="You’re logged in. Let’s keep learning!"
          actionLabel="Continue to lessons"
        />
      }
    >
      <h1 className={auth.title}>Welcome Back!</h1>
      <p className={auth.subtitle}>Log in to continue learning</p>
      <form
        onSubmit={handleSubmit}
        noValidate
        className={auth.form}
        aria-label="Log in to MFCS"
      >
        {error && (
          <Alert id="login-error" title={error.title} detail={error.detail} />
        )}
        <fieldset className={auth.fields} disabled={succeeded}>
          <legend className="sr-only">Your login details</legend>
          <div className={auth.field}>
            <label htmlFor="username">Email or Username</label>
            <input
              ref={usernameInput}
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              required
              value={username}
              onChange={(event) => {
                setUsername(event.target.value);
                setError(null);
              }}
              placeholder="Enter your email or username"
              aria-invalid={!!error}
              aria-describedby={error ? "login-error" : undefined}
            />
          </div>
          <div className={auth.field}>
            <label htmlFor="password">Password</label>
            <div className={styles.passwordField}>
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setError(null);
                }}
                placeholder="Enter your password"
                aria-invalid={!!error}
                aria-describedby={error ? "login-error" : undefined}
              />
              <button
                type="button"
                className={styles.passwordToggle}
                onClick={() => setShowPassword((show) => !show)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                aria-controls="password"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            <Link href="/forgot-password" className={styles.forgotLink}>
              Forgot password?
            </Link>
          </div>
          <button type="submit" className={auth.actionButton}>
            {succeeded ? "Logged in" : "Login"}
          </button>
        </fieldset>
      </form>
    </AuthLayout>
  );
}
