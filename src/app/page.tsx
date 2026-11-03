import Link from "next/link";

export default function Home() {
  return (
    <div className="landing-page">
      <a className="skip-link" href="#main-content">Skip to content</a>

      {/* Header */}
      <header className="site-header">
        <Link className="brand" href="/" aria-label="MFCS home">
          <span className="brand-mark">M.F.C.S.</span>
          <span className="brand-name">Monmouth Fidelity<br />Chinese School</span>
        </Link>
        <nav className="header-nav" aria-label="Main navigation">
          <Link className="nav-link" href="/login">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
              <circle cx="12" cy="8" r="3.5" />
              <path d="M5 21v-2a7 7 0 0 1 14 0v2" />
            </svg>
            <span>Login</span>
          </Link>
          <Link className="nav-link" href="/support">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
              <circle cx="12" cy="12" r="9" />
              <path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 2-2.5 2-2.5 4M12 16.5v.5" />
            </svg>
            <span>Contact Support</span>
          </Link>
        </nav>
      </header>

      {/* Main Content */}
      <main className="hero" id="main-content" tabIndex={-1}>
        <section className="hero-copy" aria-labelledby="hero-title">
          <h1 id="hero-title">MFCS Learning Platform</h1>
          <p className="hero-description">
            The learning platform for Monmouth Fidelity Chinese School.
            A place for our students to practice content from home.
          </p>
          <div className="hero-actions">
            <Link className="button button-primary" href="/login">
              Login <span aria-hidden="true">↗</span>
            </Link>
            <Link className="hero-support" href="/support">
              Contact Support <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </section>

        {/* Decorative panel reserved for future artwork */}
        <div className="hero-art" aria-hidden="true">
          <span className="art-signature">MFCS</span>
        </div>
      </main>
    </div>
  );
}
