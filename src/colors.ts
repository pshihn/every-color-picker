import { Color } from './common';

export const hslaString = (color: Color) => `hsla(${color[0] % 360}, ${color[1]}%, ${color[2]}%, ${color[3]})`;
export const hslString = (color: Color) => `hsl(${color[0] % 360}, ${color[1]}%, ${color[2]}%)`;

export function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h = h % 360;
  s = s / 100;
  l = l / 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - (c / 2);
  let r = 0, g = 0, b = 0;
  if (h < 60) {
    [r, g, b] = [c, x, 0];
  } else if (h < 120) {
    [r, g, b] = [x, c, 0];
  } else if (h < 180) {
    [r, g, b] = [0, c, x];
  } else if (h < 240) {
    [r, g, b] = [0, x, c];
  } else if (h < 300) {
    [r, g, b] = [x, 0, c];
  } else {
    [r, g, b] = [c, 0, x];
  }
  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255)
  ];
}

export function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r = r / 255, g = g / 255, b = b / 255;
  const cmax = Math.max(r, g, b);
  const cmin = Math.min(r, g, b);
  const delta = cmax - cmin;
  let h = 0;
  if (delta === 0) {
    h = 0;
  } else if (cmax === r) {
    h = (((g - b) / delta) % 6) * 60;
  } else if (cmax === g) {
    h = (((b - r) / delta) + 2) * 60;
  } else if (cmax === b) {
    h = (((r - g) / delta) + 4) * 60;
  }
  const l = (cmax + cmin) / 2;
  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
  return [
    Math.round((360 + h) % 360),
    Math.round(s * 100),
    Math.round(l * 100)
  ];
}

export function rgbaToHex(rn: number, gn: number, bn: number, an: number): string {
  an = Math.round(an * 255);
  let r = Math.round(rn).toString(16);
  let g = Math.round(gn).toString(16);
  let b = Math.round(bn).toString(16);
  let a = an.toString(16);

  if (r.length === 1)
    r = '0' + r;
  if (g.length === 1)
    g = '0' + g;
  if (b.length === 1)
    b = '0' + b;
  if (a.length === 1)
    a = '0' + a;

  return (an === 255 ? `#${r}${g}${b}` : `#${r}${g}${b}${a}`).toUpperCase();
}

export function hexToRgba(hex: string): [number, number, number, number] | null {
  switch (hex.length) {
    case 3:
      return [
        +`0x${hex[0]}${hex[0]}`,
        +`0x${hex[1]}${hex[1]}`,
        +`0x${hex[2]}${hex[2]}`,
        255
      ];
    case 4:
      return [
        +`0x${hex[0]}${hex[0]}`,
        +`0x${hex[1]}${hex[1]}`,
        +`0x${hex[2]}${hex[2]}`,
        +`0x${hex[3]}${hex[3]}`,
      ];
    case 6:
      return [
        +`0x${hex[0]}${hex[1]}`,
        +`0x${hex[2]}${hex[3]}`,
        +`0x${hex[4]}${hex[5]}`,
        255
      ];
    case 8:
      return [
        +`0x${hex[0]}${hex[1]}`,
        +`0x${hex[2]}${hex[3]}`,
        +`0x${hex[4]}${hex[5]}`,
        +`0x${hex[6]}${hex[7]}`
      ];
  }
  return null;
}