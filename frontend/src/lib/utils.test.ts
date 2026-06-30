import { describe, expect, it } from "vitest";

import { parsePositiveInteger, safeRedirectPath, searchParamsWithUpdates } from "@/lib/utils";

describe("safeRedirectPath", () => {
  it("keeps internal paths", () =>
    expect(safeRedirectPath("/applications/4?tab=details")).toBe("/applications/4?tab=details"));
  it("rejects absolute and protocol-relative paths", () => {
    expect(safeRedirectPath("https://example.com")).toBeNull();
    expect(safeRedirectPath("//example.com")).toBeNull();
  });
});

describe("parsePositiveInteger", () => {
  it("parses positive integers", () => {
    expect(parsePositiveInteger("3", 1)).toBe(3);
  });

  it("falls back for blank, non-integer, or non-positive values", () => {
    expect(parsePositiveInteger(null, 20)).toBe(20);
    expect(parsePositiveInteger("0", 20)).toBe(20);
    expect(parsePositiveInteger("-1", 20)).toBe(20);
    expect(parsePositiveInteger("2.5", 20)).toBe(20);
    expect(parsePositiveInteger("abc", 20)).toBe(20);
  });
});

describe("searchParamsWithUpdates", () => {
  it("sets and removes params without mutating the original", () => {
    const current = new URLSearchParams("page=3&search=alpha");
    const next = searchParamsWithUpdates(current, { search: null, status: "SUBMITTED" });

    expect(current.toString()).toBe("page=3&search=alpha");
    expect(next.get("search")).toBeNull();
    expect(next.get("status")).toBe("SUBMITTED");
  });

  it("resets page unless page is explicitly updated", () => {
    expect(searchParamsWithUpdates(new URLSearchParams("page=4"), { search: "x" }, { resetPage: true }).get("page")).toBe("1");
    expect(searchParamsWithUpdates(new URLSearchParams("page=4"), { page: 2 }, { resetPage: true }).get("page")).toBe("2");
  });
});
