import { readFileSync, readdirSync, statSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

function filesBelow(directory: string): string[] {
  return readdirSync(directory).flatMap((name) => {
    const path = resolve(directory, name);
    return statSync(path).isDirectory() ? filesBelow(path) : [path];
  });
}

const root = process.cwd();
const nextConfig = readFileSync(resolve(root, "next.config.ts"), "utf8");
const signInPage = readFileSync(
  resolve(root, "src/app/(auth)/sign-in/page.tsx"),
  "utf8",
);
const appShell = readFileSync(
  resolve(root, "src/components/layout/app-shell.tsx"),
  "utf8",
);
const productionSeed = readFileSync(
  resolve(root, "supabase/production_seed.sql"),
  "utf8",
).toLowerCase();

describe("application hardening", () => {
  it("does not reference the service-role credential from Client Components", () => {
    const clientFiles = filesBelow(resolve(root, "src")).filter((path) => {
      if (!/\.(ts|tsx)$/.test(path)) return false;
      return readFileSync(path, "utf8").startsWith('"use client"');
    });
    for (const file of clientFiles) {
      expect(readFileSync(file, "utf8")).not.toContain(
        "SUPABASE_SERVICE_ROLE_KEY",
      );
    }
  });

  it("configures browser security headers and a bounded document upload body", () => {
    expect(nextConfig).toContain("Content-Security-Policy");
    expect(nextConfig).toContain("frame-ancestors 'none'");
    expect(nextConfig).toContain("X-Content-Type-Options");
    expect(nextConfig).toContain('bodySizeLimit: "27mb"');
  });

  it("hides local demo credentials from production rendering", () => {
    expect(signInPage).toContain('process.env.NODE_ENV === "development"');
  });

  it("provides a localized keyboard skip target", () => {
    expect(appShell).toContain('href="#main-content"');
    expect(appShell).toContain('id="main-content"');
    expect(appShell).toContain("messages.common.skipToContent");
  });

  it("keeps production seed data free of demo users and procurement cases", () => {
    expect(productionSeed).not.toContain("auth.users");
    expect(productionSeed).not.toContain("procureflow123");
    expect(productionSeed).not.toContain("procurement_cases");
    expect(productionSeed).toContain("insert into public.roles");
  });
});
