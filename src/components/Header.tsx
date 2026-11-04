"use client";

import Link from "next/link";
import { useMemo, useSyncExternalStore } from "react";
import {
  getSessionSnapshot,
  logout,
  parseSession,
  subscribeToSession,
} from "@/lib/mockAuth";
import { usePathname, useRouter } from "next/navigation";
import BrandLogo from "./BrandLogo";
import styles from "./Header.module.css";

const navigation = [
  { href: "/", label: "Home" },
  { href: "/login", label: "Login" },
  { href: "/support", label: "Contact Support" },
];

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const raw = useSyncExternalStore(
    subscribeToSession,
    getSessionSnapshot,
    () => null,
  );
  const session = useMemo(() => parseSession(raw), [raw]);

  return (
    <header className={styles.supportHeader}>
      <Link href="/" aria-label="MFCS home" className={styles.logo}>
        <BrandLogo />
      </Link>

      <nav aria-label="Main navigation" className={styles.navigation}>
        {navigation
          .filter((item) => !session || item.href !== "/login")
          .map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              aria-current={pathname === href ? "page" : undefined}
            >
              {label}
            </Link>
          ))}
        {/* Open to everyone for now so the mock can be reviewed without logging in. */}
        <Link
          href="/dashboard"
          className={styles.dashboardButton}
          aria-current={pathname === "/dashboard" ? "page" : undefined}
        >
          Teacher Dashboard
        </Link>
        {session && (
          <Link
            href="/lessons"
            aria-current={pathname === "/lessons" ? "page" : undefined}
          >
            Lessons
          </Link>
        )}
        {session && (
          <button
            className={styles.logoutButton}
            onClick={() => {
              logout();
              router.replace("/login");
            }}
          >
            Log out
          </button>
        )}
      </nav>
    </header>
  );
}
