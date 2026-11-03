"use client";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { submitSupportRequest, type SupportRequestData } from "./actions";
import { supportBodyFont, supportHeadingFont } from "./fonts";
import styles from "./support.module.css";

type Fields = Omit<SupportRequestData, "name"> & {
  firstName: string;
  lastName: string;
};
type FormErrors = Partial<Record<keyof Fields, string>>;
type FormStatus = "idle" | "submitting" | "success" | "error";
const INITIAL_FIELDS: Fields = {
  firstName: "",
  lastName: "",
  email: "",
  role: "",
  subject: "",
  description: "",
};
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SupportPage() {
  const [fields, setFields] = useState<Fields>(INITIAL_FIELDS);
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<FormStatus>("idle");
  const dialog = useRef<HTMLDialogElement>(null);
  const form = useRef<HTMLFormElement>(null);
  const submitting = useRef(false);

  useEffect(() => {
    if ((status === "success" || status === "error") && !dialog.current?.open)
      dialog.current?.showModal();
  }, [status]);

  function handleChange(
    event: ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) {
    const { name, value } = event.target;
    setFields((previous) => ({ ...previous, [name]: value }));
    setErrors((previous) => ({ ...previous, [name]: undefined }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    const nextErrors: FormErrors = {};
    if (!fields.firstName.trim())
      nextErrors.firstName = "First name is required.";
    if (!fields.lastName.trim()) nextErrors.lastName = "Last name is required.";
    if (!fields.email.trim()) nextErrors.email = "Email is required.";
    else if (!EMAIL_RE.test(fields.email.trim()))
      nextErrors.email = "Please enter a valid email address.";
    if (!fields.role) nextErrors.role = "Please select your role.";
    if (!fields.subject.trim()) nextErrors.subject = "Subject is required.";
    if (!fields.description.trim())
      nextErrors.description = "Please describe the issue you need help with.";
    setErrors(nextErrors);
    const firstError = Object.keys(nextErrors)[0];
    if (firstError) {
      form.current
        ?.querySelector<HTMLElement>(`[name="${firstError}"]`)
        ?.focus();
      return;
    }
    submitting.current = true;
    setStatus("submitting");
    try {
      await submitSupportRequest({
        name: `${fields.firstName.trim()} ${fields.lastName.trim()}`,
        email: fields.email.trim(),
        role: fields.role,
        subject: fields.subject.trim(),
        description: fields.description.trim(),
      });
      setStatus("success");
      setFields(INITIAL_FIELDS);
    } catch {
      setStatus("error");
    } finally {
      submitting.current = false;
    }
  }

  function fieldAccessibility(name: keyof Fields) {
    return {
      "aria-invalid": !!errors[name],
      "aria-describedby": errors[name] ? `${name}-error` : undefined,
    };
  }
  function fieldError(name: keyof Fields) {
    return errors[name] ? (
      <p id={`${name}-error`} className={styles.fieldError}>
        {errors[name]}
      </p>
    ) : null;
  }

  return (
    <main className={`${styles.page} ${supportBodyFont.className}`}>
      <div className={styles.scene}>
        <div
          className={`${styles.cloud} ${styles.cloudLeft}`}
          aria-hidden="true"
        />
        <div
          className={`${styles.cloud} ${styles.cloudRight}`}
          aria-hidden="true"
        />
        <div
          className={`${styles.cloud} ${styles.cloudBottom}`}
          aria-hidden="true"
        />
        <h1 className={`${styles.title} ${supportHeadingFont.className}`}>
          Contact Support
        </h1>
        <form
          ref={form}
          onSubmit={handleSubmit}
          noValidate
          className={styles.form}
          aria-label="Contact support"
          aria-busy={status === "submitting"}
        >
          <fieldset
            className={styles.fields}
            disabled={status === "submitting"}
          >
            <fieldset className={styles.nameFields}>
              <legend>Name:</legend>
              <div className={styles.nameRow}>
                <div>
                  <label className={styles.srOnly} htmlFor="firstName">
                    First name
                  </label>
                  <input
                    id="firstName"
                    name="firstName"
                    autoComplete="given-name"
                    required
                    value={fields.firstName}
                    onChange={handleChange}
                    placeholder="First..."
                    {...fieldAccessibility("firstName")}
                  />
                  {fieldError("firstName")}
                </div>
                <div>
                  <label className={styles.srOnly} htmlFor="lastName">
                    Last name
                  </label>
                  <input
                    id="lastName"
                    name="lastName"
                    autoComplete="family-name"
                    required
                    value={fields.lastName}
                    onChange={handleChange}
                    placeholder="Last..."
                    {...fieldAccessibility("lastName")}
                  />
                  {fieldError("lastName")}
                </div>
              </div>
            </fieldset>
            <div className={styles.field}>
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={fields.email}
                onChange={handleChange}
                {...fieldAccessibility("email")}
              />
              {fieldError("email")}
            </div>
            <div className={styles.field}>
              <label htmlFor="role">Role</label>
              <select
                id="role"
                name="role"
                required
                value={fields.role}
                onChange={handleChange}
                className={!fields.role ? styles.placeholder : undefined}
                {...fieldAccessibility("role")}
              >
                <option value="" disabled>
                  Please Select
                </option>
                <option value="student">Student</option>
                <option value="parent">Parent</option>
                <option value="teacher">Teacher</option>
              </select>
              {fieldError("role")}
            </div>
            <div className={styles.field}>
              <label htmlFor="subject">Subject</label>
              <input
                id="subject"
                name="subject"
                required
                value={fields.subject}
                onChange={handleChange}
                {...fieldAccessibility("subject")}
              />
              {fieldError("subject")}
            </div>
            <div className={styles.field}>
              <label htmlFor="description">Additional Details</label>
              <textarea
                id="description"
                name="description"
                rows={3}
                required
                value={fields.description}
                onChange={handleChange}
                {...fieldAccessibility("description")}
              />
              {fieldError("description")}
            </div>
          </fieldset>
          <div className={styles.submitRow}>
            <button
              className={styles.goldButton}
              type="submit"
              disabled={status === "submitting"}
            >
              {status === "submitting" ? "Sending…" : "Submit Request"}
            </button>
          </div>
          <span className={styles.srOnly} role="status">
            {status === "submitting" ? "Sending your support request." : ""}
          </span>
        </form>
      </div>
      <dialog
        ref={dialog}
        className={styles.dialog}
        aria-labelledby="support-result-title"
        aria-describedby="support-result-description"
        onClose={() => setStatus("idle")}
      >
        <h2 id="support-result-title" className={supportHeadingFont.className}>
          {status === "success" ? "Success!" : "Error!"}
        </h2>
        <p id="support-result-description">
          {status === "success"
            ? "Your support request has been submitted."
            : "There was an error submitting your request. Please try again later."}
        </p>
        <button
          className={styles.goldButton}
          onClick={() => dialog.current?.close()}
        >
          Ok
        </button>
      </dialog>
    </main>
  );
}
