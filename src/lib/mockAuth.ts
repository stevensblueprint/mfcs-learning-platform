// TEMPORARY mock auth for the login-flow ticket.
// Replace with real auth (Clerk/Cognito, server-side checks) later.
// Nothing here is secure: credentials live in client code and the "session" is localStorage.

export type Role = "student" | "teacher" | "admin";

export interface Session {
  name: string;
  email: string;
  role: Role;
}

const SESSION_KEY = "mfcs-mock-session";

const DEMO_ADMIN: Session = {
  name: "Admin",
  email: "admin@mfcs.test",
  role: "admin",
};

// Lets React components re-render when the session changes in this tab.
const listeners = new Set<() => void>();

function notify(): void {
  listeners.forEach((listener) => listener());
}

export function subscribeToSession(callback: () => void): () => void {
  listeners.add(callback);
  window.addEventListener("storage", callback); // changes from other tabs
  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", callback);
  };
}

// Returns the raw string (not a parsed object) so React sees a stable value.
export function getSessionSnapshot(): string | null {
  try {
    return localStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}

export function parseSession(raw: string | null): Session | null {
  try {
    if (!raw) return null;
    const value = JSON.parse(raw);
    if (
      !value ||
      typeof value.name !== "string" ||
      typeof value.email !== "string" ||
      !["student", "teacher", "admin"].includes(value.role)
    )
      return null;
    return {
      name: value.name,
      email: value.email,
      role: value.role,
    } as Session;
  } catch {
    return null;
  }
}

export function login(username: string, password: string): Session | null {
  if (username !== "admin" || password !== "admin") return null;

  const session: Session = { ...DEMO_ADMIN };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  notify();
  return session;
}

export function logout(): void {
  localStorage.removeItem(SESSION_KEY);
  notify();
}

export function getSession(): Session | null {
  return parseSession(getSessionSnapshot());
}

// Mock recovery only: no email is sent and no password is changed.
export function requestPasswordReset(
  identifier: string,
): { email: string } | null {
  const value = identifier.trim();
  if (value !== "admin" && value.toLowerCase() !== DEMO_ADMIN.email)
    return null;
  return { email: DEMO_ADMIN.email };
}
