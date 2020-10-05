import { PointerTrackerHandler, Pointer, InputEvent, PointerTracker } from './pointers.js';
import { radToDeg, Rect } from './math.js';

export class DiskController implements PointerTrackerHandler {
  private e: HTMLElement;
  private anchor: Rect = [0, 0, 0, 0];
  private tracker: PointerTracker;
  private radius: number;
  private _a = 0;
  private _d = 0;

  constructor(node: HTMLElement, diskRadius: number, angle: number, distance: number) {
    this.e = node;
    this.radius = diskRadius;
    if (angle) {
      this._a = this.clampAngle(angle);
    }
    if (distance) {
      this._d = this.clampDist(distance);
    }
    this.tracker = new PointerTracker(this.e, this);
  }

  private clampAngle(n: number): number {
    while (n < 0) {
      n += 360;
    }
    return Math.abs(n % 360);
  }

  private clampDist(n: number): number {
    return Math.max(0, Math.min(1, n));
  }

  private isOnDisk(x: number, y: number): boolean {
    const dx = x - 0.5;
    const dy = y - 0.5;
    const r = Math.sqrt((dx * dx) + (dy * dy));
    return r <= (this.radius / this.anchor[2]);
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

  onStart(pointer: Pointer, event: InputEvent): boolean {
    event.preventDefault();
    const rect = this.e.getBoundingClientRect();
    this.anchor = [rect.left || rect.x, rect.top || rect.y, rect.width, rect.height];
    const w = this.anchor[2];
    const h = this.anchor[3];
    const newX = w ? ((pointer.clientX - this.anchor[0]) / w) : 0;
    const newY = h ? ((pointer.clientY - this.anchor[1]) / h) : 0;
    if (this.isOnDisk(newX, newY)) {
      this.setPosition(newX, newY);
      this.e.style.cursor = 'pointer';
      return true;
    }
    return false;
  }

  private setPosition(newX: number, newY: number): boolean {
    let changed = false;
    const alpha = this.clampAngle(Math.round(radToDeg(Math.atan2(newY - 0.5, newX - 0.5))));
    if (alpha !== this._a) {
      this._a = alpha;
      changed = true;
    }
    const dx = newX - 0.5;
    const dy = newY - 0.5;
    const r = this.clampDist(2 * Math.sqrt((dx * dx) + (dy * dy)));
    if (r !== this._d) {
      this._d = r;
      changed = true;
    }
    if (changed) {
      this.fire();
    }
    return changed;
  }

  private fire() {
    this.e.dispatchEvent(new CustomEvent('p-input', {
      bubbles: true,
      composed: true,
      detail: { angle: this._a, distance: this._d }
    }));
  }

  detach() {
    this.tracker.stop();
  }

  get angle(): number {
    return this._a;
  }

  set angle(value: number) {
    this._a = this.clampAngle(value);
  }

  get distance(): number {
    return this._d;
  }

  set distance(value: number) {
    this._d = this.clampDist(value);
  }
}