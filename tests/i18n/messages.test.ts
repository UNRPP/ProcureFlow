import { describe, expect, it } from "vitest";

import en from "../../messages/en.json";
import th from "../../messages/th.json";

function leafKeys(value: object, prefix = ""): string[] {
  return Object.entries(value).flatMap(([key, entry]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof entry === "string" ? [path] : leafKeys(entry, path);
  });
}

function leafValues(value: object): string[] {
  return Object.values(value).flatMap((entry) =>
    typeof entry === "string" ? [entry] : leafValues(entry),
  );
}

describe("locale dictionaries", () => {
  it("keeps English and Thai message keys in parity", () => {
    expect(leafKeys(th).sort()).toEqual(leafKeys(en).sort());
  });

  it("does not leave empty translated values", () => {
    const values = leafValues(th);
    expect(values.every((value) => value.trim().length > 0)).toBe(true);
  });
});
