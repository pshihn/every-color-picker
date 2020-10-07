export type Color = [number, number, number, number];

const REX_HSLA = /^hsla\s*\(\s*(\d+.?\d*)\s*,\s*(\d+.?\d*)%\s*,\s*(\d+.?\d*)%\s*,\s*(\d+.?\d*)\s*\)$/i;
const REX_HSL = /^hsl\s*\(\s*(\d+.?\d*)\s*,\s*(\d+.?\d*)%\s*,\s*(\d+.?\d*)%\s*\)$/i;
const REX_RGBA = /^rgba\s*\(\s*(\d+.?\d*)\s*,\s*(\d+.?\d*)\s*,\s*(\d+.?\d*)\s*,\s*(\d+.?\d*)\s*\)$/i;
const REX_RGB = /^rgb\s*\(\s*(\d+.?\d*)\s*,\s*(\d+.?\d*)\s*,\s*(\d+.?\d*)\s*\)$/i;

export interface AllColorTypes {
  rgba: Color;
  hsla: Color;
  hex: string;
}

export const hslaString = (color: Color) => `hsla(${color[0] % 360}, ${color[1]}%, ${color[2]}%, ${color[3]})`;
export const hslString = (color: Color) => `hsl(${color[0] % 360}, ${color[1]}%, ${color[2]}%)`;
export const rgbString = (color: Color) => `rgb(${color[0]}, ${color[1]}, ${color[2]})`;

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

export function hsvToHsl(hsv: Color): Color {
  const [h, s, v, a] = hsv;
  const l = (2 - s / 100) * v / 2;
  const den = (l < 50 ? l * 2 : 200 - l * 2);
  const newS = den ? (s * v) / den : 0;
  return [
    h,
    Math.round(newS),
    Math.round(l),
    a
  ];
}

export function hslToHsv(hsl: Color): Color {
  const [h, s, l, a] = hsl;
  const t = s * (l < 50 ? l : 100 - l) / 100;
  return [
    h,
    Math.round((l + t) ? (200 * t / (l + t)) : 0),
    Math.round(t + l),
    a
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

export function hexToRgba(hex: string): Color | null {
  switch (hex.length) {
    case 3:
      return [
        +`0x${hex[0]}${hex[0]}`,
        +`0x${hex[1]}${hex[1]}`,
        +`0x${hex[2]}${hex[2]}`,
        1
      ];
    case 4:
      return [
        +`0x${hex[0]}${hex[0]}`,
        +`0x${hex[1]}${hex[1]}`,
        +`0x${hex[2]}${hex[2]}`,
        +`0x${hex[3]}${hex[3]}` / 255
      ];
    case 6:
      return [
        +`0x${hex[0]}${hex[1]}`,
        +`0x${hex[2]}${hex[3]}`,
        +`0x${hex[4]}${hex[5]}`,
        1
      ];
    case 8:
      return [
        +`0x${hex[0]}${hex[1]}`,
        +`0x${hex[2]}${hex[3]}`,
        +`0x${hex[4]}${hex[5]}`,
        +`0x${hex[6]}${hex[7]}` / 255
      ];
  }
  return null;
}

export function hsvToRgb(hsv: Color): Color {
  const [h, s, l, a] = hsvToHsl(hsv);
  const [r, g, b] = hslToRgb(h, s, l);
  return [r, g, b, a];
}

export function rgbToHsv(rgb: Color): Color {
  const [r, g, b, a] = rgb;
  const [h, s, l] = rgbToHsl(r, g, b);
  return hslToHsv([h, s, l, a]);
}

export function parseColor(value: string): AllColorTypes | null {
  value = value.trim();
  let matches = value.match(REX_HSLA);
  if (matches) {
    const h = +matches[1];
    const s = +matches[2];
    const l = +matches[3];
    const a = +matches[4];
    const [r, g, b] = hslToRgb(h, s, l);
    const hex = rgbaToHex(r, g, b, a);
    return {
      hex,
      hsla: [h, s, l, a],
      rgba: [r, g, b, a]
    };
  }
  matches = value.match(REX_HSL);
  if (matches) {
    const h = +matches[1];
    const s = +matches[2];
    const l = +matches[3];
    const [r, g, b] = hslToRgb(h, s, l);
    const hex = rgbaToHex(r, g, b, 1);
    return {
      hex,
      hsla: [h, s, l, 1],
      rgba: [r, g, b, 1]
    };
  }
  matches = value.match(REX_RGBA);
  if (matches) {
    const r = +matches[1];
    const g = +matches[2];
    const b = +matches[3];
    const a = +matches[4];
    const [h, s, l] = rgbToHsl(r, g, b);
    const hex = rgbaToHex(r, g, b, a);
    return {
      hex,
      hsla: [h, s, l, a],
      rgba: [r, g, b, a]
    };
  }
  matches = value.match(REX_RGB);
  if (matches) {
    const r = +matches[1];
    const g = +matches[2];
    const b = +matches[3];
    const [h, s, l] = rgbToHsl(r, g, b);
    const hex = rgbaToHex(r, g, b, 1);
    return {
      hex,
      hsla: [h, s, l, 1],
      rgba: [r, g, b, 1]
    };
  }

  let hex = value;
  const lastIndex = hex.lastIndexOf('#');
  if (lastIndex >= 0) {
    hex = hex.substring(lastIndex + 1);
  }
  const rgba = hexToRgba(hex);
  if (rgba) {
    const [r, g, b, a] = rgba;
    if (isNaN(r) || isNaN(g) || isNaN(b) || isNaN(a)) {
      return null;
    }
    const [h, s, l] = rgbToHsl(r, g, b);
    const hex = rgbaToHex(r, g, b, a);
    return {
      hex,
      hsla: [h, s, l, a],
      rgba: [r, g, b, a]
    };
  }
  return null;
}