import { z } from "zod";

export const signInSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(12).max(128),
  next: z
    .string()
    .optional()
    .transform((value) =>
      value?.startsWith("/") && !value.startsWith("//") ? value : "/dashboard",
    ),
});

export const passwordResetRequestSchema = z.object({
  email: z.string().trim().email(),
});

export const passwordUpdateSchema = z
  .object({
    password: z.string().min(12).max(128),
    passwordConfirmation: z.string().min(12).max(128),
  })
  .refine((value) => value.password === value.passwordConfirmation, {
    path: ["passwordConfirmation"],
  });
