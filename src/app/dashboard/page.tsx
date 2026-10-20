"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSession, logout, type Session } from "@/lib/mockAuth";

export default function DashboardPage() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    const current = getSession();
    if (!current) {
      router.replace("/login");
      return;
    }
    setSession(current);
  }, [router]);

  function handleLogout() {
    logout();
    router.push("/");
  }

  // Avoid flashing dashboard content before the session check finishes.
  if (!session) return null;

  return (
    <main>
      <h1>Welcome, {session.name}!</h1>
      <p>
        Login successful. You are signed in as a {session.role}{" "}({session.email}).
      </p>
      <p>
        Placeholder dashboard.
      </p>
      <button onClick={handleLogout}>Log out</button>
    </main>
  );
}