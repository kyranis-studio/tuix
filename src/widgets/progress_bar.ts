import { Box } from "../layout.ts";

export class ProgressBar extends Box {
  private _progress = 0;

  constructor(label = "", progress = 0) {
    super(label);
    this.focusable = false;
    this._progress = progress;
    this.height = { fixed: 1 };

    this.onPaint = (buf, rect, theme) => {
      const bg = theme.panelBg;
      const labelSpace = 8;
      const barWidth = Math.max(0, rect.width - labelSpace);
      const filledWidth = Math.floor(this._progress * barWidth);

      for (let i = 0; i < barWidth; i++) {
        const char = i < filledWidth ? "█" : "░";
        const fg = i < filledWidth ? theme.highlight : theme.muted;
        buf.set(rect.x + i, rect.y, {
          char,
          fg,
          bg,
        });
      }

      const percentStr = ` ${(this._progress * 100).toFixed(0).padStart(3)}%`;
      for (let i = 0; i < percentStr.length && barWidth + i < rect.width; i++) {
        buf.set(rect.x + barWidth + i, rect.y, {
          char: percentStr[i],
          fg: theme.highlight,
          bg,
          bold: true,
        });
      }
    };
  }

  get progress(): number { return this._progress; }
  set progress(v: number) { this._progress = Math.max(0, Math.min(1, v)); }
}
