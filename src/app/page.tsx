import Link from "next/link";

export default function Home() {
  return (
    <div className="landing-page">
      <a className="skip-link" href="#main-content">Skip to content</a>

      {/* Header */}


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
