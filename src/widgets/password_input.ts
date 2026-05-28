import { TextInput } from "./text_input.ts";
import type { KeyPressResult } from "./input_primitive.ts";

/** A password input widget that masks typed characters and prevents
 *  the actual password value from being exposed through clipboard operations. */
export class PasswordInput extends TextInput {
  /** Character used to mask the password display. */
  maskChar = "*";

  constructor(
    label = "Password",
    placeholder = "",
    value = "",
    onChange?: (val: string) => void,
  ) {
    super(
      label,
      placeholder,
      value,
      onChange,
      false, // copyOnSelect — disabled for security
      false, // notifyOnCopy — disabled for security
      "Copied!", // copyNotificationMessage (unused)
    );

    // Block clipboard operations that would expose the password
    this.onKeyPress = (key, modifiers, state): KeyPressResult | void => {
      // Block Ctrl+Shift+C (copy) — prevents password from being copied
      if (key === "c" && modifiers.ctrl && modifiers.shift) {
        return { consumed: true };
      }
      // Block Ctrl+V paste hook — but we allow it to flow through normally
      // so the user can paste a password into the field
      return;
    };
  }

  protected override _getDisplayChar(_ch: string): string {
    return this.maskChar;
  }

  /** Prevent auto-copying the actual password to clipboard on mouse selection. */
  protected override _autoCopySelection(): void {
    // no-op — security: never copy the actual password value
  }
}
