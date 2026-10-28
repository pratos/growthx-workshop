// slug.test.ts
import { expect, test } from "bun:test";
import { slugify } from "./slug";

test("slugify", () => {
  expect(slugify("Hello, World!")).toBe("hello-world");
  expect(slugify("  Crème brûlée  ")).toBe("creme-brulee");
  expect(slugify("a -- b")).toBe("a-b");
  expect(slugify("")).toBe("");
});

test("slugify cuts to 64 characters without a trailing hyphen", () => {
  expect(slugify("a".repeat(70))).toBe("a".repeat(64));
  expect(slugify("x ".repeat(40))).toBe(Array(32).fill("x").join("-"));
  expect(slugify("a".repeat(70), 10)).toBe("a".repeat(10));
});

test("slugify gives an empty string for text with no Latin letters or digits", () => {
  expect(slugify("日本語")).toBe("");
  expect(slugify("!!! — ???")).toBe("");
});
