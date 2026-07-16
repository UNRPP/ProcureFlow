import { describe, expect, it } from "vitest";

import { signInSchema } from "@/features/auth/validation";

describe("sign-in validation", () => {
  it("accepts valid credentials and a local redirect", () => {
    const result = signInSchema.safeParse({
      email: "officer@procureflow.local",
      password: "ProcureFlow123!",
      next: "/settings",
    });

    expect(result.success).toBe(true);
    if (result.success) expect(result.data.next).toBe("/settings");
  });

  it("rejects malformed credentials", () => {
    expect(
      signInSchema.safeParse({ email: "invalid", password: "short" }).success,
    ).toBe(false);
  });

  it("prevents protocol-relative redirect targets", () => {
    const result = signInSchema.parse({
      email: "officer@procureflow.local",
      password: "ProcureFlow123!",
      next: "//malicious.example",
    });

    expect(result.next).toBe("/dashboard");
  });
});
