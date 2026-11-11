"use client";

import { useId } from "react";
import Dialog from "./Dialog";
import styles from "./Dialog.module.css";

export default function FeedbackDialog({
  open,
  onClose,
  title,
  description,
  actionLabel = "Ok",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  actionLabel?: string;
}) {
  const id = useId();
  return (
    <Dialog
      open={open}
      onClose={onClose}
      labelledBy={`${id}-title`}
      describedBy={`${id}-description`}
    >
      <h2 id={`${id}-title`}>{title}</h2>
      <p id={`${id}-description`}>{description}</p>
      <button type="button" className={styles.action} onClick={onClose}>
        {actionLabel}
      </button>
    </Dialog>
  );
}
