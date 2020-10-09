export type Rect = [number, number, number, number];
export type Point = [number, number];
export type Triangle = [Point, Point, Point];
export type Line = [Point, Point];

export function radToDeg(rad: number): number {
  return (180 / Math.PI) * rad;
}

export function degToRad(deg: number): number {
  return (Math.PI / 180) * deg;
}

export function rotate(x: number, y: number, cx: number, cy: number, angle: number): Point {
  return [
    (x - cx) * Math.cos(angle) - (y - cy) * Math.sin(angle) + cx,
    (x - cx) * Math.sin(angle) + (y - cy) * Math.cos(angle) + cy,
  ];
}

export function parseRotatedTriangle(trinagle: Triangle, degrees: number, center: Point): [Line, Line, Line] {
  const rads = degToRad(-degrees + 270);
  let points = [...trinagle];
  if (rads) {
    points = points.map<Point>((d) => rotate(d[0], d[1], center[0], center[1], rads));
  }
  return [[points[0], points[1]], [points[1], points[2]], [points[2], points[0]]];
}

export function lineValue(line: Line, x: number): number {
  const [a, b] = line;
  const m = (b[1] - a[1]) / (b[0] - a[0]);
  const c = b[1] - (m * b[0]);
  return (m * x) + c;
}

export function distance(a: Point, b: Point): number {
  return Math.sqrt(Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2));
}

export function lineIntersection(a: Point, b: Point, c: Point, d: Point): Point | null {
  const a1 = b[1] - a[1];
  const b1 = a[0] - b[0];
  const c1 = a1 * (a[0]) + b1 * (a[1]);
  const a2 = d[1] - c[1];
  const b2 = c[0] - d[0];
  const c2 = a2 * (c[0]) + b2 * (c[1]);
  const determinant = a1 * b2 - a2 * b1;
  return determinant ? [(b2 * c1 - b1 * c2) / determinant, (a1 * c2 - a2 * c1) / determinant] : null;
}

function orientation(p: Point, q: Point, r: Point) {
  const val = (q[1] - p[1]) * (r[0] - q[0]) - (q[0] - p[0]) * (r[1] - q[1]);
  if (val === 0) {
    return 0;
  }
  return val > 0 ? 1 : 2;
}

function onSegment(p: Point, q: Point, r: Point) {
  return (
    q[0] <= Math.max(p[0], r[0]) &&
    q[0] >= Math.min(p[0], r[0]) &&
    q[1] <= Math.max(p[1], r[1]) &&
    q[1] >= Math.min(p[1], r[1])
  );
}

// Check is p1q1 intersects with p2q2
export function doIntersect(p1: Point, q1: Point, p2: Point, q2: Point) {
  const o1 = orientation(p1, q1, p2);
  const o2 = orientation(p1, q1, q2);
  const o3 = orientation(p2, q2, p1);
  const o4 = orientation(p2, q2, q1);

  if (o1 !== o2 && o3 !== o4) {
    return true;
  }

  // p1, q1 and p2 are colinear and p2 lies on segment p1q1
  if (o1 === 0 && onSegment(p1, p2, q1)) {
    return true;
  }

  // p1, q1 and p2 are colinear and q2 lies on segment p1q1
  if (o2 === 0 && onSegment(p1, q2, q1)) {
    return true;
  }

  // p2, q2 and p1 are colinear and p1 lies on segment p2q2
  if (o3 === 0 && onSegment(p2, p1, q2)) {
    return true;
  }

  // p2, q2 and q1 are colinear and q1 lies on segment p2q2
  if (o4 === 0 && onSegment(p2, q1, q2)) {
    return true;
  }

  return false;
}