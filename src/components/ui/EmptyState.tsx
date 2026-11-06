import type { ReactNode } from "react";
import styles from "./EmptyState.module.css";

export default function EmptyState({
  title,
  children,
  illustration,
  action,
  compact = false,
}: {
  title?: string;
  children: ReactNode;
  illustration?: ReactNode;
  action?: ReactNode;
  compact?: boolean;
}) {
  return (
    <div className={`${styles.empty} ${compact ? styles.compact : ""}`}>
      {illustration}
      {title && <h2>{title}</h2>}
      <div className={styles.description}>{children}</div>
      {action}
    </div>
  );
}
