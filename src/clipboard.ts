/**
 * clipboard.ts — System clipboard access via subprocess.
 *
 * Tries platform-appropriate clipboard commands:
 *   Linux:   xclip, xsel, wl-copy/wl-paste (Wayland)
 *   macOS:   pbcopy / pbpaste
 *   Windows: clip (write-only via PowerShell)
 */

const decoder = new TextDecoder();

async function tryExec(
  cmd: string,
  args: string[],
  input?: string,
): Promise<string | null> {
  try {
    const p = new Deno.Command(cmd, {
      args,
      stdin: input !== undefined ? "piped" : "null",
      stdout: "piped",
      stderr: "null",
    });
    const proc = p.spawn();
    if (input !== undefined) {
      const writer = proc.stdin.getWriter();
      await writer.write(new TextEncoder().encode(input));
      writer.close();
    }
    const result = await proc.output();
    if (result.success) {
      const out = decoder.decode(result.stdout);
      // Remove trailing newline that xclip/pbpaste may add
      return out.replace(/\n$/, "");
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Copy text to the system clipboard.
 * Returns true on success, false if no clipboard tool was available.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  // Linux — try Wayland first, then X11
  if (Deno.env.get("WAYLAND_DISPLAY")) {
    if (await tryExec("wl-copy", [], text) !== null) return true;
  }
  if (await tryExec("xclip", ["-selection", "clipboard"], text) !== null) return true;
  if (await tryExec("xsel", ["-i", "-b"], text) !== null) return true;
  // macOS
  if (await tryExec("pbcopy", [], text) !== null) return true;
  // Windows (write-only via PowerShell)
  if (await tryExec("powershell", ["-command", "Set-Clipboard", text]) !== null) return true;
  return false;
}

/**
 * Read text from the system clipboard.
 * Returns the clipboard text, or empty string on failure.
 */
export async function pasteFromClipboard(): Promise<string> {
  // Linux
  if (Deno.env.get("WAYLAND_DISPLAY")) {
    const wl = await tryExec("wl-paste", []);
    if (wl !== null) return wl;
  }
  const xclip = await tryExec("xclip", ["-selection", "clipboard", "-o"]);
  if (xclip !== null) return xclip;
  const xsel = await tryExec("xsel", ["-o", "-b"]);
  if (xsel !== null) return xsel;
  // macOS
  const pbpaste = await tryExec("pbpaste", []);
  if (pbpaste !== null) return pbpaste;
  // Windows (via PowerShell)
  const ps = await tryExec("powershell", ["-command", "Get-Clipboard"]);
  if (ps !== null) return ps;
  return "";
}
