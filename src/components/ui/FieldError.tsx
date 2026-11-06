import type { ReactNode } from "react";
import styles from "./FieldError.module.css";

export default function FieldError({
  id,
  children,
  className = "",
}: {
  id: string;
  children?: ReactNode;
  className?: string;
}) {
  if (!children) return null;
  return (
    <p id={id} className={`${styles.error} ${className}`}>
      {children}
    </p>
  );
}
