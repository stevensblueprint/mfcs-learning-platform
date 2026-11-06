"use client";

import { useEffect, useRef, type ReactNode } from "react";
import styles from "./Dialog.module.css";

type DialogProps = {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  describedBy?: string;
  variant?: "feedback" | "content";
  dismissible?: boolean;
  children: ReactNode;
};

/** Native modal semantics provide focus containment, Escape, and focus return. */
export default function Dialog({
  open,
  onClose,
  labelledBy,
  describedBy,
  variant = "feedback",
  dismissible = true,
  children,
}: DialogProps) {
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const element = dialog.current;
    if (open && !element?.open) element?.showModal();
    else if (!open && element?.open) element.close();
  }, [open]);

  return (
    <dialog
      ref={dialog}
      className={`${styles.dialog} ${styles[variant]}`}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      onCancel={(event) => {
        if (!dismissible) event.preventDefault();
      }}
      onClose={(event) => {
        if (open && !event.currentTarget.open) onClose();
      }}
    >
      {children}
    </dialog>
  );
}
