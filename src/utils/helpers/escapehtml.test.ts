import { describe, it, expect } from "vitest";
import escapeHtml from "./escapehtml";

describe("escapeHtml", () => {
  it("leaves ordinary text as it is", () => {
    expect(escapeHtml("T01")).toBe("T01");
    expect(escapeHtml("中文 Blk 301")).toBe("中文 Blk 301");
  });

  it("turns markup into text", () => {
    expect(escapeHtml('<img src=x onerror="alert(1)">')).toBe(
      "&lt;img src=x onerror=&quot;alert(1)&quot;&gt;"
    );
  });

  it("cannot be used to break out of a quoted attribute", () => {
    expect(escapeHtml(`" onmouseover='x'`)).toBe(
      "&quot; onmouseover=&#39;x&#39;"
    );
  });

  it("escapes the ampersand first, so an entity is not made by accident", () => {
    expect(escapeHtml("&lt;")).toBe("&amp;lt;");
  });

  it("writes numbers and missing values as text", () => {
    expect(escapeHtml(35)).toBe("35");
    expect(escapeHtml(undefined)).toBe("");
    expect(escapeHtml(null)).toBe("");
  });
});
