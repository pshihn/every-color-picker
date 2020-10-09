import { PointerTrackerHandler, Pointer, InputEvent, PointerTracker } from './pointers.js';
import { degToRad, doIntersect, Point, Rect, rotate, Triangle, lineIntersection, distance } from './math.js';

export class TriangleController implements PointerTrackerHandler {
  private e: HTMLElement;
  private anchor: Rect = [0, 0, 0, 0];
  private tracker: PointerTracker;

  position: Point;
  private _triangle: Triangle;
  private _centroid: Point = [0, 0];


  constructor(node: HTMLElement, triangle: Triangle, position: Point) {
    this.e = node;
    this._triangle = triangle;
    this.position = position;
    this.tracker = new PointerTracker(this.e, this);
  }

  get triangle(): Triangle {
    return this._triangle;
  }

  set triangle(value: Triangle) {
    this._triangle = value;
    this._centroid = [
      (value[0][0] + value[1][0] + value[2][0]) / 3,
      (value[0][1] + value[1][1] + value[2][1]) / 3
    ];
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
    let inTriangle = this.isInTriangle([newX, newY]);
    if (!inTriangle) {
      inTriangle = distance(this.position, [newX, newY]) < 0.05;
    }
    if (inTriangle) {
      this.setPosition(newX, newY, w, h);
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
      this.setPosition(newX, newY, w, h);
    }
  }

  onEnd(): void {
    this.e.style.cursor = '';
  }

  private setPosition(newX: number, newY: number, width: number, height: number): boolean {
    if (this.isInTriangle([newX, newY])) {
      if ((newX !== this.position[0]) && (newY !== this.position[1])) {
        this.position = [newX, newY];
        this.fire();
        return true;
      }
    } else {
      const p: Point = [
        newX * width,
        newY * height
      ];
      const [A, B, C] = this._triangle;
      let intersection: Point | null = null;
      if (doIntersect(p, this._centroid, A, B)) {
        intersection = lineIntersection(p, this._centroid, A, B);
      }
      if (!intersection) {
        if (doIntersect(p, this._centroid, B, C)) {
          intersection = lineIntersection(p, this._centroid, B, C);
        }
      }
      if (!intersection) {
        if (doIntersect(p, this._centroid, C, A)) {
          intersection = lineIntersection(p, this._centroid, C, A);
        }
      }
      if (intersection && width && height) {
        const nx = intersection[0] / width;
        const ny = intersection[1] / height;
        if ((nx !== this.position[0]) && (ny !== this.position[1])) {
          this.position = [nx, ny];
          this.fire();
          return true;
        }
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

  rotatePosition(angle: number) {
    this.position = rotate(this.position[0], this.position[1], 0.5, 0.5, degToRad(angle));
  }
}