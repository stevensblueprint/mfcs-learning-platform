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

const DEMO_USERS: (Session & { password: string })[] = [
  { name: "Sam Student", email: "student@mfcs.test", password: "password123", role: "student" },
  { name: "Tina Teacher", email: "teacher@mfcs.test", password: "password123", role: "teacher" },
  { name: "Alex Admin", email: "admin@mfcs.test", password: "password123", role: "admin" },
];

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
  return localStorage.getItem(SESSION_KEY);
}

export function parseSession(raw: string | null): Session | null {
  try {
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

export function login(email: string, password: string): Session | null {
  const user = DEMO_USERS.find(
    (u) => u.email === email.trim().toLowerCase() && u.password === password
  );
  if (!user) return null;

  const session: Session = { name: user.name, email: user.email, role: user.role };
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