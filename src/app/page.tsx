import Image from "next/image";
import Link from "next/link";
import styles from "./home.module.css";

export default function Home() {
  return (
    <main
      className={styles.page}
      id="main-content"
      aria-labelledby="home-title"
    >
      <div className={styles.canvas}>
        <div className={styles.village} aria-hidden="true">
          <Image
            src="/home/village.png"
            alt=""
            width={1672}
            height={941}
            className={styles.villageImage}
            loading="eager"
          />
        </div>
        <div className={styles.largeCloud} aria-hidden="true">
          <span className={styles.largeCloudCap} />
        </div>
        <div className={styles.upperCloud} aria-hidden="true">
          <span className={styles.smallCloudCap} />
        </div>
        <div className={styles.rightCloud} aria-hidden="true" />
        <section className={styles.copyBubble}>
          <h1 id="home-title" className={styles.heading}>
            <span>Learn</span>
            <span>Chinese</span>
          </h1>
          <p className={styles.description}>
            Learn, practice, and grow together. Explore weekly Chinese lessons
            from Monmouth Fidelity Chinese School.
          </p>
        </section>
        <Link href="/login" className={styles.loginBubble}>
          <span>Log In</span>
        </Link>
        <Image
          src="/home/dragon.png"
          alt="A cheerful Chinese dragon welcomes you to MFCS"
          width={1448}
          height={1086}
          className={styles.dragon}
          loading="eager"
        />
        <div className={styles.foregroundCloud} aria-hidden="true">
          <Image
            src="/home/foreground-cloud.png"
            alt=""
            width={1448}
            height={1086}
            className={styles.foregroundImage}
            loading="eager"
          />
        </div>
      </div>
    </main>
  );
}
