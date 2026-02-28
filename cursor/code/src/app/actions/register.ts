"use server";

import { registerInputSchema } from "@/lib/validation";
import { createServices } from "@/server/services";
import { prisma } from "@/server/db";

export interface RegisterActionResult {
  success: false;
  error: string;
}

export async function registerAction(
  formData: FormData,
): Promise<{ success: true } | RegisterActionResult> {
  const parsed = registerInputSchema.safeParse({
    email: formData.get("email"),
    name: formData.get("name"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    const firstError = parsed.error.flatten().fieldErrors;
    const message =
      firstError.password?.[0] ??
      firstError.email?.[0] ??
      firstError.name?.[0] ??
      "Invalid input.";
    return { success: false, error: message };
  }

  const authService = createServices(prisma).auth;

  try {
    await authService.register(parsed.data);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unable to register. Please try again.";
    return { success: false, error: message };
  }

  return { success: true };
}
