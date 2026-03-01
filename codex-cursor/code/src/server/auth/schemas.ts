import { z } from "zod";

export const registrationSchema = z.object({
  email: z.email().max(255),
  name: z.string().trim().min(2).max(100),
  password: z.string().min(8).max(72),
});

export const credentialsSchema = z.object({
  email: z.email().max(255),
  password: z.string().min(8).max(72),
});

export type RegistrationInput = z.infer<typeof registrationSchema>;
export type CredentialsInput = z.infer<typeof credentialsSchema>;
