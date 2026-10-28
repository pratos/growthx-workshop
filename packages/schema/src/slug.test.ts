// slug.test.ts
import { expect, test } from "bun:test";
import { slugify } from "./slug";

test("slugify", () => {
  expect(slugify("Hello, World!")).toBe("hello-world");
  expect(slugify("  Crème brûlée  ")).toBe("creme-brulee");
  expect(slugify("a -- b")).toBe("a-b");
  expect(slugify("")).toBe("");
});
