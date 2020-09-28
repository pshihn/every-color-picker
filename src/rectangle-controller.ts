import { PointerTrackerHandler, Pointer, InputEvent, PointerTracker } from './pointers.js';
import { Rect, Point } from './math.js';

export class RectangleController implements PointerTrackerHandler {
  private e: HTMLElement;
  private anchor: Rect = [0, 0, 0, 0];
  private p: Point = [0, 0];
  private pAnchor: Point = [0, 0];
  private tracker: PointerTracker;

  constructor(node: HTMLElement, position?: Point) {
    this.e = node;
    if (position) {
      this.p = this.clamp(position);
    }
    this.tracker = new PointerTracker(this.e, this);
  }

  get position(): Point {
    return this.p;
  }

  set position(point: Point) {
    this.p = this.clamp(point);
  }

  private clamp(point: Point): Point {
    return [
      Math.max(0, Math.min(1, point[0])),
      Math.max(0, Math.min(1, point[1]))
    ];
  }

  onStart(pointer: Pointer, event: InputEvent): boolean {
    event.preventDefault();
    const rect = this.e.getBoundingClientRect();
    this.anchor = [rect.left || rect.x, rect.top || rect.y, rect.width, rect.height];
    const w = this.anchor[2];
    const h = this.anchor[3];
    const newX = w ? ((pointer.clientX - this.anchor[0]) / w) : 0;
    const newY = h ? ((pointer.clientY - this.anchor[1]) / h) : 0;
    this.setPosition(newX, newY);
    this.pAnchor = [...this.p];
    this.e.style.cursor = 'pointer';
    return true;
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

  onEnd(_: Pointer, __: InputEvent, cancelled: boolean): void {
    this.e.style.cursor = '';
    if (cancelled) {
      this.setPosition(...this.pAnchor);
    }
  }

  private setPosition(newX: number, newY: number): boolean {
    const [x, y] = this.clamp([newX, newY]);
    if ((x !== this.p[0]) || (y !== this.p[1])) {
      this.p = [x, y];
      this.fire();
      return true;
    }
    return false;
  }

  private fire() {
    this.e.dispatchEvent(new CustomEvent('p-input', {
      bubbles: true,
      composed: true,
      detail: [...this.p]
    }));
  }

  detach() {
    this.tracker.stop();
  }
}