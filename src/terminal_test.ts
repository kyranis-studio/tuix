import { charWidth, stringWidth, textClusters } from "./terminal.ts";

function assertEquals<T>(actual: T, expected: T): void {
  if (actual !== expected) {
    throw new Error(`Expected ${String(expected)}, got ${String(actual)}`);
  }
}

Deno.test("terminal width counts Cosmic-style symbols as wide", () => {
  assertEquals(charWidth("✦"), 2);
  assertEquals(stringWidth("✦ AI ready"), 11);
});

Deno.test("terminal width keeps grapheme modifiers with their base glyph", () => {
  assertEquals(textClusters("✦\uFE0E").length, 1);
  assertEquals(charWidth("✦\uFE0E"), 1);
  assertEquals(charWidth("✦\uFE0F"), 2);
});

Deno.test("terminal width treats combining marks as zero width", () => {
  assertEquals(textClusters("e\u0301").length, 1);
  assertEquals(charWidth("e\u0301"), 1);
});
