import { describe, expect, it } from "vitest";
import { nextChoice, parseChoice, resolveTheme } from "../src/app/theme";

describe("resolveTheme", () => {
  it("paints light or dark exactly as chosen, ignoring the OS", () => {
    expect(resolveTheme("light", true)).toBe("light");
    expect(resolveTheme("dark", false)).toBe("dark");
  });

  it("follows the OS when the choice is system", () => {
    expect(resolveTheme("system", true)).toBe("dark");
    expect(resolveTheme("system", false)).toBe("light");
  });
});

describe("nextChoice", () => {
  it("cycles light -> dark -> system -> light", () => {
    expect(nextChoice("light")).toBe("dark");
    expect(nextChoice("dark")).toBe("system");
    expect(nextChoice("system")).toBe("light");
  });
});

describe("parseChoice", () => {
  it("defaults to system when nothing is saved", () => {
    expect(parseChoice(null)).toBe("system");
  });

  it("keeps a previously saved light or dark choice", () => {
    expect(parseChoice("light")).toBe("light");
    expect(parseChoice("dark")).toBe("dark");
    expect(parseChoice("system")).toBe("system");
  });

  it("falls back to system for an unrecognised value", () => {
    expect(parseChoice("solarized")).toBe("system");
  });
});
