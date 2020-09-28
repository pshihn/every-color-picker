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