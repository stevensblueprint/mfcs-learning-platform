"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import BrandLogo from "./BrandLogo";
import styles from "./Header.module.css";

const navigation = [
  { href: "/", label: "Home" },
  { href: "/login", label: "Login" },
  { href: "/support", label: "Contact Support" },
  { href: "/lessons", label: "Lessons" },
];

export default function Header() {
  const pathname = usePathname();

  return (
    <header className={styles.supportHeader}>
      <Link href="/" aria-label="MFCS home" className={styles.logo}>
        <BrandLogo />
      </Link>

      <nav aria-label="Main navigation" className={styles.navigation}>
        {navigation.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            aria-current={pathname === href ? "page" : undefined}
          >
            {label}
          </Link>
        ))}
      </nav>
    </header>
  );
}