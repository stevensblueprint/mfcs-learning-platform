"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import {
  getSessionSnapshot,
  parseSession,
  subscribeToSession,
} from "@/lib/mockAuth";
import LessonWorkspace from "./LessonWorkspace";

const subscribeHydration = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;

export default function LessonDashboard() {
  const router = useRouter();
  const hydrated = useSyncExternalStore(
    subscribeHydration,
    clientSnapshot,
    serverSnapshot,
  );
  const raw = useSyncExternalStore(
    subscribeToSession,
    getSessionSnapshot,
    () => null,
  );
  const session = useMemo(() => parseSession(raw), [raw]);
  useEffect(() => {
    if (hydrated && !session) router.replace("/login");
  }, [hydrated, session, router]);
  if (!hydrated || !session)
    return (
      <main className="workspace" role="status">
        Opening your learning workspace…
      </main>
    );
  return <LessonWorkspace />;
}
