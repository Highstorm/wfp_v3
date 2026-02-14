import { describe, it, expect } from "vitest";
import { generateShareCode } from "../share-code.utils";

const ALLOWED_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

describe("generateShareCode", () => {
  it("generates a code with exactly 8 characters", () => {
    const code = generateShareCode();
    expect(code).toHaveLength(8);
  });

  it("only contains allowed characters", () => {
    const code = generateShareCode();
    for (const char of code) {
      expect(ALLOWED_CHARS).toContain(char);
    }
  });

  it("generates different codes on consecutive calls", () => {
    const codes = new Set(Array.from({ length: 20 }, () => generateShareCode()));
    expect(codes.size).toBeGreaterThan(1);
  });
});
