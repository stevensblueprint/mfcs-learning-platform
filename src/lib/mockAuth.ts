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

export function login(email: string, password: string): Session | null {
  const user = DEMO_USERS.find(
    (u) => u.email === email.trim().toLowerCase() && u.password === password
  );
  if (!user) return null;

  const session: Session = { name: user.name, email: user.email, role: user.role };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function logout(): void {
  localStorage.removeItem(SESSION_KEY);
}

export function getSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}
