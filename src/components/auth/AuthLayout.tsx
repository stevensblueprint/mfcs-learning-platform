import Image from "next/image";
import type { ReactNode } from "react";
import styles from "./AuthLayout.module.css";

export default function AuthLayout({
  children,
  dialog,
  hideDragon = false,
  sceneClassName = "",
  rightCloudClassName = "",
}: {
  children: ReactNode;
  dialog?: ReactNode;
  hideDragon?: boolean;
  sceneClassName?: string;
  rightCloudClassName?: string;
}) {
  return (
    <main className={styles.page}>
      <div className={`${styles.scene} ${sceneClassName}`}>
        <div
          className={`${styles.cloud} ${styles.cloudLeft}`}
          aria-hidden="true"
        />
        <div
          className={`${styles.cloud} ${styles.cloudRight} ${rightCloudClassName}`}
          aria-hidden="true"
        />
        <div
          className={`${styles.cloud} ${styles.cloudBottom}`}
          aria-hidden="true"
        />
        {!hideDragon && (
          <Image
            src="/illustrations/dragons/mascot.png"
            alt=""
            aria-hidden="true"
            width={263}
            height={309}
            loading="eager"
            className={styles.dragon}
          />
        )}
        <div className={styles.content}>{children}</div>
      </div>
      {dialog}
    </main>
  );
}
