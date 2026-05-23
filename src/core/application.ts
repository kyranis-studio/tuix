import { Terminal, TuiEvent, EventType } from "./terminal.ts";
import { VirtualConsole } from "./console.ts";
import { BaseComponent } from "../components/base.ts";

export class Application {
  private terminal: Terminal;
  private console: VirtualConsole;
  private running = false;
  private root: BaseComponent | null = null;
  private focusableComponents: BaseComponent[] = [];
  private focusIndex = -1;

  constructor() {
    this.terminal = Terminal.getInstance();
    const { columns, rows } = this.terminal.size;
    this.console = new VirtualConsole(columns, rows);
  }

  setRoot(component: BaseComponent) {
    this.root = component;
    this.updateFocusList();
    this.calculateLayout();
  }

  private updateFocusList() {
    this.focusableComponents = [];
    if (!this.root) return;
    
    const findFocusable = (c: BaseComponent) => {
      if (c.isFocusable) this.focusableComponents.push(c);
      // @ts-ignore: access private children for focus search
      for (const child of c.children) {
        findFocusable(child);
      }
    };
    findFocusable(this.root);
    
    if (this.focusableComponents.length > 0 && this.focusIndex === -1) {
      this.focusIndex = 0;
      this.focusableComponents[0].isFocused = true;
    }
  }

  private calculateLayout() {
    if (!this.root) return;
    const { columns, rows } = this.terminal.size;
    this.console.resize(columns, rows);
    this.root.calculateLayout(columns, rows);
  }

  async run() {
    await this.terminal.enterRawMode();
    this.running = true;

    // Start event loop
    const eventLoop = async () => {
      for await (const event of this.terminal.events()) {
        if (!this.running) break;
        this.handleEvent(event);
        this.render();
      }
    };

    // Initial render
    this.calculateLayout();
    this.render();

    await eventLoop();
  }

  private handleEvent(event: TuiEvent) {
    if (event.type === EventType.Key) {
      if (event.key === "q") {
        this.stop();
        return;
      }
      
      if (event.key === "tab") {
        this.nextFocus();
        return;
      }
    }
    
    this.root?.onEvent(event);
  }

  private nextFocus() {
    if (this.focusableComponents.length === 0) return;
    
    this.focusableComponents[this.focusIndex].isFocused = false;
    this.focusIndex = (this.focusIndex + 1) % this.focusableComponents.length;
    this.focusableComponents[this.focusIndex].isFocused = true;
  }

  private render() {
    if (!this.root) return;
    this.console.clear();
    this.root.render(this.console);
    const diff = this.console.renderDiff();
    if (diff) {
      this.terminal.write(diff);
    }
  }

  stop() {
    this.running = false;
    this.terminal.exitRawMode();
  }
}
