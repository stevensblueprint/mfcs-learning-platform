"use client";

import { useId, useRef, useState, type ComponentProps } from "react";
import Dialog from "./Dialog";
import Alert from "./Alert";
import styles from "./Dialog.module.css";

/** Keeps confirmation state with its trigger and supports asynchronous actions. */
export default function ConfirmButton({
  title = "Confirm deletion",
  description,
  confirmLabel = "Delete",
  onConfirm,
  children,
  ...buttonProps
}: Omit<ComponentProps<"button">, "onClick" | "title"> & {
  title?: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => void | Promise<void>;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const running = useRef(false);

  async function confirm() {
    if (running.current) return;
    running.current = true;
    setPending(true);
    setError("");
    try {
      await onConfirm();
      setOpen(false);
    } catch {
      setError("The action could not be completed. Please try again.");
    } finally {
      running.current = false;
      setPending(false);
    }
  }

  return (
    <>
      <button
        {...buttonProps}
        type={buttonProps.type ?? "button"}
        onClick={() => {
          setError("");
          setOpen(true);
        }}
      >
        {children}
      </button>
      <Dialog
        open={open}
        onClose={() => {
          if (!running.current) setOpen(false);
        }}
        dismissible={!pending}
        labelledBy={`${id}-title`}
        describedBy={`${id}-description`}
      >
        <h2 id={`${id}-title`}>{title}</h2>
        <p id={`${id}-description`}>{description}</p>
        {error && <Alert title={error} />}
        <div className={styles.actions} aria-busy={pending}>
          <button
            type="button"
            className={styles.secondary}
            disabled={pending}
            autoFocus
            onClick={() => setOpen(false)}
          >
            Cancel
          </button>
          <button
            type="button"
            className={styles.action}
            disabled={pending}
            onClick={() => void confirm()}
          >
            {pending ? "Working…" : confirmLabel}
          </button>
        </div>
      </Dialog>
    </>
  );
}
