import { PointerTrackerHandler, Pointer, InputEvent, PointerTracker } from './pointers.js';
import { radToDeg, Rect } from './math.js';

export class ArcController implements PointerTrackerHandler {
  private e: HTMLElement;
  private anchor: Rect = [0, 0, 0, 0];
  private tracker: PointerTracker;
  private degrees = 0;
  private ri: number;
  private ro: number;
  private a1: number;
  private a2: number;

  constructor(node: HTMLElement, innerRadius: number, outerRadius: number, startAngle: number = 0, stopAngle: number = 360) {
    this.e = node;
    this.ri = innerRadius;
    this.ro = outerRadius;
    this.a1 = startAngle;
    this.a2 = stopAngle;
    this.tracker = new PointerTracker(this.e, this);
  }

  private clamp(n: number): number {
    while (n < 0) {
      n += 360;
    }
    return Math.abs(n % 360);
  }

  private isAngleInRange(angle: number): boolean {
    if (this.a1 < 0) {
      if (angle >= 0 && angle <= this.a2) {
        return true;
      }
      const negAngle = angle - 360;
      return (negAngle >= this.a1 && negAngle <= 0);
    }
    return ((angle >= this.a1) && (angle <= this.a2));
  }

  private isOnDial(x: number, y: number): boolean {
    const dx = x - 0.5;
    const dy = y - 0.5;
    const r = Math.sqrt((dx * dx) + (dy * dy));
    if ((r >= this.ri) && (r <= this.ro)) {
      const alpha = this.clamp(Math.round(radToDeg(Math.atan2(dy, dx))));
      return this.isAngleInRange(alpha);
    }
    return false;
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
    if (this.isAngleInRange(alpha) && (alpha !== this.degrees)) {
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
    this.degrees = Math.max(this.a1, Math.min(this.a2, this.clamp(value)));
  }
}