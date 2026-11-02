"use client";

import { useRef } from "react";
import BrandLogo from "./BrandLogo";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { supportBodyFont, supportHeadingFont } from "@/app/support/fonts";
import styles from "./Header.module.css";
import supportStyles from "@/app/support/support.module.css";

export default function Header() {
  const pathname = usePathname();
  const signupDialog = useRef<HTMLDialogElement>(null);
  return (
    <>
      <header
        className={`${styles.supportHeader} ${supportBodyFont.className}`}
      >
        <Link href="/" aria-label="MFCS home" className={styles.logo}>
          <BrandLogo />
        </Link>
        <nav aria-label="Main navigation" className={styles.navigation}>
          <Link href="/" aria-current={pathname === "/" ? "page" : undefined}>
            Home
          </Link>
          <Link
            href="/support"
            aria-current={pathname === "/support" ? "page" : undefined}
          >
            Contact Support
          </Link>
          <button
            className={styles.supportLink}
            onClick={() => signupDialog.current?.showModal()}
          >
            Sign Up
          </button>
        </nav>
      </header>
      <dialog
        ref={signupDialog}
        className={`${supportStyles.dialog} ${supportBodyFont.className}`}
        aria-labelledby="signup-title"
        aria-describedby="signup-description"
      >
        <h2 id="signup-title" className={supportHeadingFont.className}>
          Sign Up
        </h2>
        <p id="signup-description">Account registration is coming soon.</p>
        <button
          className={supportStyles.goldButton}
          onClick={() => signupDialog.current?.close()}
        >
          Ok
        </button>
      </dialog>
    </>
  );
}
