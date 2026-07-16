import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ThemeToggle } from "@/components/layout/theme-toggle";
import { getMessages } from "@/lib/i18n/messages";

const setTheme = vi.fn();

vi.mock("next-themes", () => ({
  useTheme: () => ({ theme: "light", setTheme }),
}));

describe("ThemeToggle", () => {
  it("opens a grouped, accessible theme menu", async () => {
    const messages = getMessages("en").theme;

    render(<ThemeToggle messages={messages} defaultOpen />);

    expect(
      await screen.findByRole("menuitem", { name: messages.dark }),
    ).toBeVisible();
  });
});
