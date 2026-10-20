"use client";

import { useState } from "react";
import { submitSupportRequest, type SupportRequestData } from "./actions";

type FormErrors = Partial<Record<keyof SupportRequestData, string>>;

type FormStatus = "idle" | "submitting" | "success" | "error";

const INITIAL_FIELDS: SupportRequestData = {
  name: "",
  email: "",
  role: "",
  subject: "",
  description: "",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SupportPage() {
  const [fields, setFields] = useState<SupportRequestData>(INITIAL_FIELDS);
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<FormStatus>("idle");
  const [serverErrorMessage, setServerErrorMessage] = useState<string>("");

  const validate = (): boolean => {
    const nextErrors: FormErrors = {};

    if (!fields.name.trim()) {
      nextErrors.name = "Name is required.";
    }

    if (!fields.email.trim()) {
      nextErrors.email = "Email is required.";
    } else if (!EMAIL_RE.test(fields.email.trim())) {
      nextErrors.email = "Please enter a valid email address.";
    }

    if (!fields.role.trim()) {
      nextErrors.role = "Please select your role.";
    }

    if (!fields.subject.trim()) {
      nextErrors.subject = "Subject is required.";
    }

    if (!fields.description.trim()) {
      nextErrors.description = "Please describe the issue you need help with.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFields((prev) => ({ ...prev, [name]: value }));

    if (errors[name as keyof SupportRequestData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setServerErrorMessage("");

    if (!validate()) {
      return;
    }

    setStatus("submitting");

    try {
      await submitSupportRequest(fields);
      setStatus("success");
      setFields(INITIAL_FIELDS);
      setErrors({});
    } catch (err) {
      setStatus("error");
      setServerErrorMessage(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again later."
      );
    }
  };

  return (
    <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Contact Support</h1>
        <p className="mt-2 text-gray-600">
          Need technical help? Submit a request below and an administrator will
          assist you.
        </p>
      </div>

      {status === "success" && (
        <div
          role="alert"
          className="mb-6 rounded-md bg-green-50 border border-green-300 p-4 text-green-800"
        >
          <p className="font-semibold">Request Submitted</p>
          <p className="text-sm mt-1">
            Your request has been submitted! We&apos;ll get back to you as soon as
            possible.
          </p>
        </div>
      )}

      {status === "error" && (
        <div
          role="alert"
          className="mb-6 rounded-md bg-red-50 border border-red-300 p-4 text-red-800"
        >
          <p className="font-semibold">Submission Failed</p>
          <p className="text-sm mt-1">
            {serverErrorMessage || "Something went wrong. Please try again later."}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        {/* Name */}
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700"
          >
            Name <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            value={fields.name}
            onChange={handleChange}
            placeholder="Jane Doe"
            className={`mt-1 block w-full rounded-md border px-3 py-2 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.name ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700"
          >
            Email Address <span className="text-red-500">*</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={fields.email}
            onChange={handleChange}
            placeholder="jane@example.com"
            className={`mt-1 block w-full rounded-md border px-3 py-2 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.email ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email}</p>
          )}
        </div>

        {/* Role */}
        <div>
          <label
            htmlFor="role"
            className="block text-sm font-medium text-gray-700"
          >
            Role <span className="text-red-500">*</span>
          </label>
          <select
            id="role"
            name="role"
            value={fields.role}
            onChange={handleChange}
            className={`mt-1 block w-full rounded-md border px-3 py-2 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.role ? "border-red-500" : "border-gray-300"
            }`}
          >
            <option value="">Select your role</option>
            <option value="student">Student</option>
            <option value="parent">Parent</option>
            <option value="teacher">Teacher</option>
          </select>
          {errors.role && (
            <p className="mt-1 text-sm text-red-600">{errors.role}</p>
          )}
        </div>

        {/* Subject */}
        <div>
          <label
            htmlFor="subject"
            className="block text-sm font-medium text-gray-700"
          >
            Subject <span className="text-red-500">*</span>
          </label>
          <input
            id="subject"
            name="subject"
            type="text"
            value={fields.subject}
            onChange={handleChange}
            placeholder="Cannot reset password"
            className={`mt-1 block w-full rounded-md border px-3 py-2 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.subject ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.subject && (
            <p className="mt-1 text-sm text-red-600">{errors.subject}</p>
          )}
        </div>

        {/* Issue Description */}
        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700"
          >
            Issue Description <span className="text-red-500">*</span>
          </label>
          <textarea
            id="description"
            name="description"
            rows={5}
            value={fields.description}
            onChange={handleChange}
            placeholder="Please provide details about the problem you are experiencing..."
            className={`mt-1 block w-full rounded-md border px-3 py-2 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.description ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description}</p>
          )}
        </div>

        {/* Submit Button */}
        <div>
          <button
            type="submit"
            disabled={status === "submitting"}
            className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {status === "submitting" ? "Sending…" : "Submit Request"}
          </button>
        </div>
      </form>
    </main>
  );
}
