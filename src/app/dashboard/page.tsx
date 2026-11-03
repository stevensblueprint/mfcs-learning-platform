"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import {
  getSessionSnapshot,
  logout,
  parseSession,
  subscribeToSession,
} from "@/lib/mockAuth";

export default function DashboardPage() {
  const router = useRouter();

  // false during server render/hydration, true once running in the browser
  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const raw = useSyncExternalStore(
    subscribeToSession,
    getSessionSnapshot,
    () => null
  );
  const session = useMemo(() => parseSession(raw), [raw]);

  useEffect(() => {
    if (isClient && !session) {
      router.replace("/login");
    }
  }, [isClient, session, router]);

  function handleLogout() {
    logout();
    router.push("/");
  }

  if (!isClient || !session) return null;

  return (
    <main>
      <h1>Welcome, {session.name}!</h1>
      <p>
        Login successful. You are signed in as a {session.role}{" "}({session.email}).
      </p>
      <button onClick={handleLogout}>Log out</button>
    </main>
  );
}