import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { InputPrimitive } from "./input_primitive.ts";
import { TextArea } from "./textarea.ts";

class MockInput extends InputPrimitive {
  renderContent() {}
  // Enable newline tracking and insert \n on Enter for burst testing
  override _trackEnterInBurst = true;
  protected override _onEnter(): void {
    this.value = this.value.slice(0, this.cursorPos) + "\n" + this.value.slice(this.cursorPos);
    this.cursorPos++;
    this._trackPasteBurst("\n");
  }
}

Deno.test("InputPrimitive - burst detection with timer", async () => {
  const input = new MockInput("test");
  input.burstThreshold = 3;  // line threshold: trigger when > 3 lines

  const mods = { ctrl: false, alt: false, shift: false };
  input.onKey!("a", mods);
  input.onKey!("Enter", mods);
  input.onKey!("b", mods);
  input.onKey!("Enter", mods);
  input.onKey!("c", mods);
  input.onKey!("Enter", mods);
  input.onKey!("d", mods);  // 4 lines total: a\nb\nc\nd

  assertEquals(input.value, "a\nb\nc\nd");

  await new Promise(resolve => setTimeout(resolve, 150));
  assertEquals(input.value, "copied text 1[4 ]");
});

Deno.test("InputPrimitive - multi-byte characters in burst", async () => {
  const input = new MockInput("test");
  input.burstThreshold = 2;  // line threshold: trigger when > 2 lines

  const mods = { ctrl: false, alt: false, shift: false };
  // "🚀" is length 2 in JS strings
  input.onKey!("🚀", mods); // length 2
  input.onKey!("Enter", mods); // \n
  input.onKey!("a", mods);   // length 1
  input.onKey!("Enter", mods); // \n
  input.onKey!("🚀", mods); // length 2
  // 3 lines total: 🚀\na\n🚀

  assertEquals(input.value, "🚀\na\n🚀");
  assertEquals(input.cursorPos, 7);

  await new Promise(resolve => setTimeout(resolve, 150));
  assertEquals(input.value, "copied text 1[3 ]");
});

Deno.test("TextArea - newline in burst", async () => {
  const textarea = new TextArea("test");
  textarea.burstThreshold = 3;  // line threshold: trigger when > 3 lines

  const mods = { ctrl: false, alt: false, shift: false };
  textarea.onKey!("a", mods);
  textarea.onKey!("Enter", mods);
  textarea.onKey!("b", mods);
  textarea.onKey!("Enter", mods);
  textarea.onKey!("c", mods);
  textarea.onKey!("Enter", mods);
  textarea.onKey!("d", mods);
  // 4 lines: a\nb\nc\nd

  assertEquals(textarea.value, "a\nb\nc\nd");
  
  await new Promise(resolve => setTimeout(resolve, 150));
  assertEquals(textarea.value, "copied text 1[4 ]");
});

Deno.test("InputPrimitive - non-char key finalizes burst immediately", () => {
  const input = new MockInput("test");
  input.burstThreshold = 3;  // line threshold: trigger when > 3 lines

  const mods = { ctrl: false, alt: false, shift: false };
  input.onKey!("a", mods);
  input.onKey!("Enter", mods);
  input.onKey!("b", mods);
  input.onKey!("Enter", mods);
  input.onKey!("c", mods);
  input.onKey!("Enter", mods);
  input.onKey!("d", mods);  // 4 lines: a\nb\nc\nd

  assertEquals(input.value, "a\nb\nc\nd");
  input.onKey!("ArrowLeft", mods);
  assertEquals(input.value, "copied text 1[4 ]");
});

Deno.test("InputPrimitive - multi-byte character navigation", () => {
  const input = new MockInput("test", "", "🚀a🚀");
  input.cursorPos = 5; // end of string

  const mods = { ctrl: false, alt: false, shift: false };
  
  // ArrowLeft from end (after second 🚀)
  input.onKey!("ArrowLeft", mods);
  assertEquals(input.cursorPos, 3); // should jump over 🚀

  // ArrowLeft from middle (after a)
  input.onKey!("ArrowLeft", mods);
  assertEquals(input.cursorPos, 2); // should jump over a

  // ArrowLeft from after first 🚀
  input.onKey!("ArrowLeft", mods);
  assertEquals(input.cursorPos, 0); // should jump over first 🚀

  // ArrowRight from start
  input.onKey!("ArrowRight", mods);
  assertEquals(input.cursorPos, 2);

  // Reset to end
  input.cursorPos = 5;
  // Backspace from end
  input.onKey!("Backspace", mods);
  assertEquals(input.value, "🚀a");
  assertEquals(input.cursorPos, 3);
});

Deno.test("InputPrimitive - delete/backspace paste ranges", () => {
  const input = new MockInput("test", "", "abcMARKERdef");
  // MARKER is "copied text 1[10 ]" (length 18)
  const marker = "copied text 1[10 ]";
  input.value = "abc" + marker + "def";
  input.cursorPos = 3 + marker.length; // after marker

  const mods = { ctrl: false, alt: false, shift: false };
  
  // Backspace from after marker should delete entire marker
  input.onKey!("Backspace", mods);
  assertEquals(input.value, "abcdef");
  assertEquals(input.cursorPos, 3);

  // Restore
  input.value = "abc" + marker + "def";
  input.cursorPos = 3; // before marker
  
  // Delete from before marker should delete entire marker
  input.onKey!("Delete", mods);
  assertEquals(input.value, "abcdef");
  assertEquals(input.cursorPos, 3);
});
