import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Login" };

export default function LoginPage() {
  return (
    <main className="destination-page">
      <div className="destination-content">
        <Link className="brand-mark" href="/" aria-label="MFCS home">M.F.C.S.</Link>
        <h1>Login.</h1>
        <p>
          WIP
        </p>
        <Link className="back-link" href="/">← Back to home</Link>
      </div>
    </main>
  );
}
