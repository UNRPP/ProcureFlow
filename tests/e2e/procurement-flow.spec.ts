import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const hasEnvironment = Boolean(process.env.E2E_BASE_URL);
const email = process.env.E2E_ADMIN_EMAIL ?? "admin@procureflow.local";
const password = process.env.E2E_ADMIN_PASSWORD ?? "ProcureFlow123!";

async function signIn(page: Page) {
  await page.goto("/sign-in");
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
}

test.describe("ProcureFlow production acceptance", () => {
  test.skip(
    !hasEnvironment,
    "Set E2E_BASE_URL after connecting a seeded local or staging Supabase project.",
  );

  test("signs in, switches locale persistently, renders accessibly, and exports reports", async ({
    page,
  }) => {
    await signIn(page);

    const accessibility = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();
    const criticalViolations = accessibility.violations.filter((violation) =>
      ["critical", "serious"].includes(violation.impact ?? ""),
    );
    expect(criticalViolations).toEqual([]);

    await page.getByRole("button", { name: /^Change language: ไทย$/ }).click();
    await expect(page.locator("html")).toHaveAttribute("lang", "th");
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("lang", "th");
    await page.getByRole("button", { name: /^เปลี่ยนภาษา: English$/ }).click();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");

    await page.goto("/reports");
    const [personnelDownload] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("link", { name: "Export personnel Excel" }).click(),
    ]);
    expect(personnelDownload.suggestedFilename()).toMatch(/\.xlsx$/);

    await page.getByLabel("Report type").selectOption("work-status");
    await page.getByRole("button", { name: "Apply filters" }).click();
    const [statusDownload] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("link", { name: "Export status Excel" }).click(),
    ]);
    expect(statusDownload.suggestedFilename()).toMatch(/\.xlsx$/);
  });

  test("creates a case, starts and transitions workflow, and preserves a document version", async ({
    page,
  }) => {
    await signIn(page);
    const uniqueTitle = `E2E infusion pump ${Date.now()}`;

    await page.goto("/cases/new?category=medical_equipment");
    await page.getByLabel("Title").fill(uniqueTitle);
    await page.getByLabel("Estimated value (THB)").fill("125000");
    await page.getByLabel("Equipment name").fill("Infusion pump");
    await page
      .getByLabel("Installation location")
      .fill("E2E clinical engineering lab");
    await page.getByRole("button", { name: "Save case" }).click();
    await expect(page).toHaveURL(/\/cases\/[0-9a-f-]+\?saved=1$/);
    await expect(page.getByText(uniqueTitle)).toBeVisible();

    await page.getByRole("button", { name: "Start workflow" }).click();
    await expect(
      page.getByText("The case workflow was started."),
    ).toBeVisible();

    await page
      .locator('select[name="documentTypeId"]')
      .selectOption({ index: 1 });
    await page.getByLabel("Document title").fill("Approved E2E request form");
    await page.getByLabel("File").setInputFiles({
      name: "request-form.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-1.4\n% ProcureFlow E2E fixture\n"),
    });
    await page.getByRole("button", { name: "Upload document" }).click();
    await expect(
      page.getByText("Document uploaded successfully."),
    ).toBeVisible();
    await expect(page.getByText("Version 1")).toBeVisible();

    await page.getByRole("button", { name: "Complete stage" }).click();
    await page.getByRole("button", { name: "Apply action" }).click();
    await expect(
      page.getByText("The workflow action was recorded."),
    ).toBeVisible();

    await page
      .getByRole("button", { name: "Return to previous stage" })
      .click();
    await page
      .getByLabel("Reason")
      .fill("E2E verification of immutable returned-stage history");
    await page.getByRole("button", { name: "Apply action" }).click();
    await expect(
      page.getByText("The workflow action was recorded."),
    ).toBeVisible();

    await page.goto("/dashboard");
    await expect(
      page.getByRole("heading", { name: "Dashboard" }),
    ).toBeVisible();
  });
});
