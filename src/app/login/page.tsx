"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/mockAuth";
import feedback from "@/app/support/support.module.css";
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
  const successDialog = useRef<HTMLDialogElement>(null);
  const submitted = useRef(false);

  useEffect(() => {
    if (succeeded && !successDialog.current?.open)
      successDialog.current?.showModal();
  }, [succeeded]);

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
    <main className={styles.page}>
      <div className={styles.scene}>
        <div
          className={`${styles.cloud} ${styles.cloudLeft}`}
          aria-hidden="true"
        />
        <div
          className={`${styles.cloud} ${styles.cloudRight}`}
          aria-hidden="true"
        />
        <div
          className={`${styles.cloud} ${styles.cloudBottom}`}
          aria-hidden="true"
        />
        <Image
          src="/illustrations/dragons/mascot.png"
          alt=""
          aria-hidden="true"
          width={263}
          height={309}
          loading="eager"
          className={styles.dragon}
        />
        <div className={styles.content}>
          <h1 className={styles.title}>Welcome Back!</h1>
          <p className={styles.subtitle}>Log in to continue learning</p>
          <form
            onSubmit={handleSubmit}
            noValidate
            className={styles.form}
            aria-label="Log in to MFCS"
          >
            {error && (
              <div className={styles.feedbackSlot}>
                <div role="alert" className={styles.error} id="login-error">
                  <span className={styles.errorIcon} aria-hidden="true" />
                  <div>
                    <p className={styles.errorTitle}>{error.title}</p>
                    <p className={styles.errorDetail}>{error.detail}</p>
                  </div>
                </div>
              </div>
            )}
            <fieldset className={styles.fields} disabled={succeeded}>
              <legend className={styles.srOnly}>Your login details</legend>
              <div className={styles.field}>
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
              <div className={styles.field}>
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
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
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
              <button type="submit" className={styles.loginButton}>
                {succeeded ? "Logged in" : "Login"}
              </button>
            </fieldset>
          </form>
        </div>
      </div>
      <dialog
        ref={successDialog}
        className={`${feedback.dialog} ${styles.successDialog}`}
        aria-labelledby="login-success-title"
        aria-describedby="login-success-description"
        onClose={() => {
          if (succeeded) router.replace("/lessons");
        }}
      >
        <h2 id="login-success-title">Success!</h2>
        <p id="login-success-description">
          You’re logged in. Let’s keep learning!
        </p>
        <button
          className={feedback.goldButton}
          onClick={() => successDialog.current?.close()}
        >
          Continue to lessons
        </button>
      </dialog>
    </main>
  );
}
