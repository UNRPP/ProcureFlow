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
