import { PointerTrackerHandler, Pointer, InputEvent, PointerTracker } from './pointers.js';
import { Point, Rect, Triangle } from './common.js';

export class TriangleController implements PointerTrackerHandler {
  private e: HTMLElement;
  private anchor: Rect = [0, 0, 0, 0];
  private tracker: PointerTracker;

  position: Point;
  triangle: Triangle;
  rotation = 0;

  constructor(node: HTMLElement, triangle: Triangle, rotation: number, position: Point) {
    this.e = node;
    this.triangle = triangle;
    this.rotation = rotation;
    this.position = position;
    this.tracker = new PointerTracker(this.e, this);
  }

  isInTriangle(p: Point) {
    p = [p[0] * this.anchor[2], p[1] * this.anchor[3]];
    const triangle = this.triangle;
    const A = 1 / 2 * (-triangle[1][1] * triangle[2][0] + triangle[0][1] * (-triangle[1][0] + triangle[2][0]) + triangle[0][0] * (triangle[1][1] - triangle[2][1]) + triangle[1][0] * triangle[2][1]);
    const sign = A < 0 ? -1 : 1;
    const s = (triangle[0][1] * triangle[2][0] - triangle[0][0] * triangle[2][1] + (triangle[2][1] - triangle[0][1]) * p[0] + (triangle[0][0] - triangle[2][0]) * p[1]) * sign;
    const t = (triangle[0][0] * triangle[1][1] - triangle[0][1] * triangle[1][0] + (triangle[0][1] - triangle[1][1]) * p[0] + (triangle[1][0] - triangle[0][0]) * p[1]) * sign;
    return s > 0 && t > 0 && (s + t) < 2 * A * sign;
  }

  onStart(pointer: Pointer, event: InputEvent): boolean {
    event.preventDefault();
    const rect = this.e.getBoundingClientRect();
    this.anchor = [rect.left || rect.x, rect.top || rect.y, rect.width, rect.height];
    const w = this.anchor[2];
    const h = this.anchor[3];
    const newX = w ? ((pointer.clientX - this.anchor[0]) / w) : 0;
    const newY = h ? ((pointer.clientY - this.anchor[1]) / h) : 0;
    console.log(newX, newY);
    if (this.isInTriangle([newX, newY])) {
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
    if (this.isInTriangle([newX, newY])) {
      if ((newX !== this.position[0]) && (newY !== this.position[1])) {
        this.position = [newX, newY];
        this.fire();
        return true;
      }
    }
    return false;
  }

  detach() {
    this.tracker.stop();
  }

  private fire() {
    this.e.dispatchEvent(new CustomEvent('p-input', {
      bubbles: true,
      composed: true,
      detail: { position: this.position }
    }));
  }
}