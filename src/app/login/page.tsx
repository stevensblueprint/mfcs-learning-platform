"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/mockAuth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const session = login(email, password);

    if (!session) {
      setError("Incorrect email or password. Please try again.");
      return;
    }

    setError(null);
    router.push("/dashboard");
  }

  return (
    <main>
      <form onSubmit={handleSubmit}>
        <h1>Log in to MCFS</h1>

        {error && <p role="alert">{error}</p>}

        <div>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={error ? true : undefined}
          />
        </div>

        <div>
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={error ? true : undefined}
          />
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            aria-pressed={showPassword}
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>

        <button type="submit">Log in</button>

        {/* TEMP */}
        <p>
          Demo accounts: student@, teacher@, or admin@mfcs.test, password
          &quot;password123&quot;.
        </p>
      </form>
    </main>
  );
}