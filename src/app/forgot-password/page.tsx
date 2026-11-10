"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { requestPasswordReset } from "@/lib/mockAuth";
import AuthLayout from "@/components/auth/AuthLayout";
import auth from "@/components/auth/AuthLayout.module.css";
import Alert from "@/components/ui/Alert";
import styles from "./recovery.module.css";

export default function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (sentTo) heading.current?.focus();
  }, [sentTo]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!identifier.trim()) {
      setError("Enter your email or username.");
      input.current?.focus();
      return;
    }
    const result = requestPasswordReset(identifier);
    if (!result) {
      setError("Username or email do not match an account.");
      input.current?.focus();
      return;
    }
    setError(null);
    setSentTo(result.email);
  }

  return (
    <AuthLayout
      hideDragon={!!sentTo}
      sceneClassName={`${styles.scene} ${sentTo ? styles.centeredScene : ""}`}
      rightCloudClassName={styles.cloudRight}
    >
      <h1
        ref={heading}
        tabIndex={-1}
        className={`${auth.title} ${styles.title}`}
      >
        {sentTo ? "Check Your Email!" : "Forgot Password?"}
      </h1>
      {sentTo ? (
        <div className={styles.confirmation}>
          <div className={styles.mailIllustration} aria-hidden="true">
            <span className={styles.envelope} />
            <span className={`${styles.ray} ${styles.rayUpperLeft}`} />
            <span className={`${styles.ray} ${styles.rayUpperRight}`} />
            <span className={`${styles.ray} ${styles.rayLeft}`} />
            <span className={`${styles.ray} ${styles.rayLowerLeft}`} />
            <span className={`${styles.ray} ${styles.rayRight}`} />
            <span className={`${styles.ray} ${styles.rayLowerRight}`} />
          </div>
          <p className={styles.sentMessage}>
            We’ve sent a password reset link to<strong>{sentTo}</strong>
          </p>
          <p className={styles.instructions}>
            Please check your inbox and spam folder and follow the instructions
            to reset your password.
          </p>
          <Link
            href="/login"
            className={`${auth.actionButton} ${styles.backButton}`}
          >
            Back to Login
          </Link>
        </div>
      ) : (
        <>
          <p className={styles.intro}>
            Enter your email address and we will send you a link to reset your
            password.
          </p>
          <form
            className={`${auth.form} ${styles.form}`}
            onSubmit={handleSubmit}
            noValidate
            aria-label="Reset your password"
          >
            {error && (
              <Alert
                id="recovery-error"
                title={error}
                detail="Please check your information and try again."
              />
            )}
            <div className={auth.fields}>
              <div className={auth.field}>
                <label htmlFor="recovery-identifier" className={styles.label}>
                  Email or Username
                </label>
                <input
                  ref={input}
                  id="recovery-identifier"
                  name="identifier"
                  type="text"
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  placeholder="Enter your email or username"
                  value={identifier}
                  required
                  onChange={(event) => {
                    setIdentifier(event.target.value);
                    setError(null);
                  }}
                  aria-invalid={!!error}
                  aria-describedby={error ? "recovery-error" : undefined}
                />
              </div>
              <button
                type="submit"
                className={`${auth.actionButton} ${styles.sendButton}`}
              >
                Send Reset Link
              </button>
            </div>
            <Link href="/login" className={styles.backLink}>
              <span className={styles.backArrow} aria-hidden="true" />
              Back to Login
            </Link>
          </form>
        </>
      )}
    </AuthLayout>
  );
}
