"use server";

export interface SupportRequestData {
  name: string;
  email: string;
  role: string;
  subject: string;
  description: string;
}

export async function submitSupportRequest(
  data: SupportRequestData
): Promise<{ success: true }> {
  const { name, email, role, subject, description } = data;

  if (
    !name?.trim() ||
    !email?.trim() ||
    !role?.trim() ||
    !subject?.trim() ||
    !description?.trim()
  ) {
    throw new Error("All fields are required.");
  }

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!EMAIL_RE.test(email.trim())) {
    throw new Error("Please provide a valid email address.");
  }

  // Placeholder for production logic (e.g. database save or email notification)
  console.log("[Support Request]", {
    name: name.trim(),
    email: email.trim(),
    role: role.trim(),
    subject: subject.trim(),
    description: description.trim(),
  });

  return { success: true };
}
