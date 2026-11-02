import Link from "next/link";
import Image from "next/image";
export default function Header() {
  return (
    <header className="site-header">
      <Link href="/" className="brand">
        <Image
          src="/figma/logo.png"
          width={80}
          height={80}
          alt="MFCS school logo"
        />
        <span>
          Monmouth Fidelity
          <br />
          <strong>Chinese School</strong>
        </span>
      </Link>
      <nav aria-label="Main navigation">
        <Link href="/lessons">My lessons</Link>
        <Link href="/support">Support</Link>
        <span className="teacher-badge">Teacher workspace</span>
      </nav>
    </header>
  );
}
