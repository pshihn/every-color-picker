import { PointerTrackerHandler, Pointer, InputEvent, PointerTracker } from './pointers.js';
import { radToDeg, Rect } from './math.js';

export class DialController implements PointerTrackerHandler {
  private e: HTMLElement;
  private anchor: Rect = [0, 0, 0, 0];
  private tracker: PointerTracker;
  private degrees = 0;
  private ri: number;
  private ro: number;

  constructor(node: HTMLElement, innerRadius: number, outerRadius: number, degrees?: number) {
    this.e = node;
    this.ri = innerRadius;
    this.ro = outerRadius;
    if (degrees) {
      this.degrees = this.clamp(degrees);
    }
    this.tracker = new PointerTracker(this.e, this);
  }

  private clamp(n: number): number {
    while (n < 0) {
      n += 360;
    }
    return Math.abs(n % 360);
  }

  private isOnDial(x: number, y: number): boolean {
    const dx = x - 0.5;
    const dy = y - 0.5;
    const r = Math.sqrt((dx * dx) + (dy * dy));
    return ((r >= this.ri) && (r <= this.ro));
  }

  onStart(pointer: Pointer, event: InputEvent): boolean {
    event.preventDefault();
    const rect = this.e.getBoundingClientRect();
    this.anchor = [rect.left || rect.x, rect.top || rect.y, rect.width, rect.height];
    const w = this.anchor[2];
    const h = this.anchor[3];
    const newX = w ? ((pointer.clientX - this.anchor[0]) / w) : 0;
    const newY = h ? ((pointer.clientY - this.anchor[1]) / h) : 0;
    if (this.isOnDial(newX, newY)) {
      this.setPosition(newX, newY);
      this.e.style.cursor = 'pointer';
      return true;
    }
    return false;
  }

  onMove(changedPointers: Pointer[]): void {
    const pointer = changedPointers[0];
    if (pointer) {
      const w = this.anchor[2];
      const h = this.anchor[3];
      const newX = w ? ((pointer.clientX - this.anchor[0]) / w) : 0;
      const newY = h ? ((pointer.clientY - this.anchor[1]) / h) : 0;
      this.setPosition(newX, newY);
    }
  }

  onEnd(): void {
    this.e.style.cursor = '';
  }

  private setPosition(newX: number, newY: number): boolean {
    const alpha = this.clamp(Math.round(radToDeg(Math.atan2(newY - 0.5, newX - 0.5))));
    if (alpha !== this.degrees) {
      this.degrees = alpha;
      this.fire();
      return true;
    }
    return false;
  }

  private fire() {
    this.e.dispatchEvent(new CustomEvent('p-input', {
      bubbles: true,
      composed: true,
      detail: { angle: this.degrees }
    }));
  }

  detach() {
    this.tracker.stop();
  }

  get angle(): number {
    return this.degrees;
  }

  set angle(value: number) {
    this.degrees = this.clamp(value);
  }
}