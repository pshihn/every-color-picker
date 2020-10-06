import { BaseElement } from './base-element.js';
import { STYLES, SHADOW2, } from './common.js';
import { radToDeg, degToRad, Point, parseRotatedTriangle, lineValue, rotate } from './math.js';
import { Color, hslToRgb, parseColor, rgbaToHex } from './colors.js';
import { ArcController } from './arc-controller.js';
import { TriangleController } from './triangle-controller.js';

const DIAL_WIDTH = 20;
const WIDTH = 280;
const INNER_WIDTH = WIDTH - (DIAL_WIDTH * 2) - 5;

export class CorelColorPicker extends BaseElement {
  private _hsla: Color = [0, 50, 50, 1];

  private dialC?: ArcController;
  private triC?: TriangleController;

  constructor() {
    super();
    this.root.innerHTML = `
    <style>
      ${STYLES}
      :host {
        display: inline-block;
        touch-action: none;
      }
      canvas {
        display: block;
        margin: 0 auto;
      }
      #base {
        position: relative;
      }
      #thumbTri,
      #thumbHue {
        position: absolute;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        box-shadow: ${SHADOW2};
        background: transparent;
        border: 2px solid #ffffff;
        pointer-events: none;
        top: -10px;
        left: -10px;
      }
      #satcan {
        border-radius: 50%;
        pointer-events: auto;
      }
      #tripanel {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        display: grid;
        place-items: center;
        pointer-events: none;
      }
    </style>
    <div id="base">
      <canvas id="wheel" width="${WIDTH}" height="${WIDTH}"></canvas>
      <div id="thumbHue"></div>
      <div id="tripanel">
        <div style="position: relative;">
          <canvas id="satcan" width="${INNER_WIDTH}" height="${INNER_WIDTH}"></canvas>
          <div id="thumbTri"></div>
        </div>
      </div>
      
    </div>
    `;
  }

  connectedCallback() {
    this.renderWheel();
    const wheel = this.$<HTMLCanvasElement>('wheel');
    const { width, height } = wheel;
    const min = Math.min(width, height);
    const ro = (min / 2) - 2;
    const ri = ro - DIAL_WIDTH;
    this.dialC = new ArcController(wheel, ri / min, ro / min, 0, 359.99);
    this.$add(wheel, 'p-input', this.handleDialInput);

    const disk = this.$<HTMLCanvasElement>('satcan');
    this.triC = new TriangleController(disk, [[0, 0], [0, 0], [0, 0]], [0.5, 0.5]);
    this.$add(disk, 'p-input', this.handleTriangleInput);

    this.updateHueThumb();
    this.updateTriangleThumb();
    this.updateColor(true);
  }

  disconnectedCallback() {
    if (this.dialC) {
      this.dialC.detach();
      this.dialC = undefined;
    }
    if (this.triC) {
      this.triC.detach();
      this.triC = undefined;
    }
    super.disconnectedCallback();
  }

  private renderWheel() {
    const canvas = this.$<HTMLCanvasElement>('wheel');
    const ctx = canvas.getContext('2d')!;
    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);

    const n = 40;
    const theta = (Math.PI * 2) / n;
    const ro = (Math.min(width, height) / 2) - 2;
    const ri = ro - DIAL_WIDTH;
    const cx = width / 2;
    const cy = height / 2;

    for (let i = 1; i <= n; i++) {
      const a = i * theta;
      const b = (i - 1) * theta;
      const radius = ri + (ro - ri) / 2;
      const x1 = Math.cos(a) * radius + cx;
      const y1 = Math.sin(a) * radius + cy;
      const x2 = Math.cos(b) * radius + cx;
      const y2 = Math.sin(b) * radius + cy;

      const g = ctx.createLinearGradient(x1, y1, x2, y2);
      g.addColorStop(0, `hsl(${radToDeg(a)}, 100%, 50%)`);
      g.addColorStop(1, `hsl(${radToDeg(b)}, 100%, 50%)`);
      const o = 0.002;
      ctx.beginPath();
      ctx.arc(cx, cy, ro, b - o, a + o, false);
      ctx.arc(cx, cy, ri, a + o, b - o, true);
      ctx.fillStyle = g;
      ctx.fill();
    }
  }

  private renderTriangle() {
    const hue = this._hsla[0];
    const c = INNER_WIDTH / 2;
    const tr = c - 5;

    const angles = [0, 120, 240, 180];
    const points: Point[] = [];
    for (const angle of angles) {
      points.push([
        Math.cos(degToRad(hue * 1 + angle)) * tr + c,
        Math.sin(degToRad(hue * 1 + angle)) * tr + c
      ]);
    }
    if (this.triC) {
      this.triC.triangle = [points[0], points[1], points[2]];
    }

    const canvas = this.$<HTMLCanvasElement>('satcan');
    const ctx = canvas.getContext('2d')!;
    ctx.globalCompositeOperation = 'hard-light';
    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);

    const g1 = ctx.createLinearGradient(points[1][0], points[1][1], points[2][0], points[2][1]);
    g1.addColorStop(0, 'hsl(' + hue + ',0%,100%)');
    g1.addColorStop(1, 'hsl(' + hue + ',0%,0%)');
    const g2 = ctx.createLinearGradient(points[0][0], points[0][1], points[3][0], points[3][1]);
    g2.addColorStop(0, `hsla(${hue}, 100%, 50%, 1)`);
    g2.addColorStop(1, `hsla(${hue}, 100%, 50%, 0)`);
    [g2, g1].forEach((gr) => {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(points[0][0], points[0][1]);
      for (let i = points.length - 2; i >= 0; i--) {
        ctx.lineTo(points[i][0], points[i][1]);
      }
      ctx.fillStyle = gr;
      ctx.fill();
      ctx.restore();
    });
  }

  private updateColor(updateTriangle: boolean) {
    const [hue, sat, lumin] = this._hsla;

    this.renderTriangle();

    if (this.triC && updateTriangle) {
      const trilines = parseRotatedTriangle(this.triC.triangle, hue, [INNER_WIDTH / 2, INNER_WIDTH / 2]);
      // lumin
      const Bx = trilines[1][0][0];
      const Cx = trilines[1][1][0];
      const mm = (Bx - Cx) / 100;
      const Ox = (mm * lumin) + Cx;

      // Sat
      const ys = trilines.map<number>((line) => lineValue(line, Ox));
      const satRangeMax = ys[1];
      const satRangeMin = Math.max(ys[0], ys[2]);
      const m = (satRangeMin - satRangeMax) / 100;
      const Oy = m * sat + satRangeMax;

      this.triC.position = [Ox / INNER_WIDTH, Oy / INNER_WIDTH];
      this.triC.rotatePosition(hue + 90);
    }
    if (this.dialC) {
      this.dialC.angle = hue;
    }
    if (this.dialC && this.triC) {
      this.deferredRender();
    }
  }

  private updateHueThumb() {
    const t = this.$('thumbHue');
    if (t) {
      const hue = this._hsla[0];
      const wheel = this.$<HTMLCanvasElement>('wheel');
      const { width, height } = wheel;
      const radius = (Math.min(width, height) / 2) - (DIAL_WIDTH / 2) - 2.5;
      const x = (width / 2) + (radius * Math.cos(degToRad(hue)));
      const y = (height / 2) + (radius * Math.sin(degToRad(hue)));
      t.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    }
  }

  private updateTriangleThumb() {
    const t = this.$('thumbTri');
    if (t && this.triC) {
      const position = this.triC.position;
      const [x, y] = [INNER_WIDTH * position[0], INNER_WIDTH * position[1]];
      t.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    }
  }

  private _uhtp = false;
  private deferredRender() {
    if (!this._uhtp) {
      this._uhtp = true;
      requestAnimationFrame(() => {
        if (this._uhtp) {
          this.updateHueThumb();
          this.updateTriangleThumb();
          this._uhtp = false;
        }
      });
    }
  }

  private handleDialInput = (event: Event) => {
    const hue = (event as CustomEvent).detail.angle;
    if (this._hsla[0] !== hue) {
      const oldHue = this._hsla[0];
      this._hsla[0] = hue;
      if (this.triC) {
        this.triC.rotatePosition(hue - oldHue);
      }
      this.updateColor(false);
      this._fire();
    }
  }

  private handleTriangleInput = (event: Event) => {
    event.stopPropagation();

    const position = (event as CustomEvent).detail.position;
    let [x, y] = [INNER_WIDTH * position[0], INNER_WIDTH * position[1]];
    [x, y] = rotate(x, y, INNER_WIDTH / 2, INNER_WIDTH / 2, degToRad(-this._hsla[0] + 270));
    const trilines = parseRotatedTriangle(this.triC!.triangle, this._hsla[0], [INNER_WIDTH / 2, INNER_WIDTH / 2]);
    const ys = trilines.map<number>((line) => lineValue(line, x));
    const satRangeMax = ys[1];
    const satRangeMin = Math.max(ys[0], ys[2]);
    const srM = 100 / (satRangeMin - satRangeMax);
    const srC = -1 * srM * satRangeMax;
    const sat = Math.max(0, Math.min(100, Math.round((srM * y) + srC)));

    const mm = 100 / (trilines[1][0][0] - trilines[1][1][0]);
    const cc = -1 * mm * trilines[1][1][0];
    const lumin = Math.max(0, Math.min(100, Math.round((mm * x) + cc)));

    this._hsla[1] = sat;
    this._hsla[2] = lumin;
    this.updateColor(false);
    this._fire();
  }

  private _fire() {
    this.fire('change');
  }

  get hsl(): Color {
    return [...this._hsla];
  }

  get rgb(): Color {
    const [r, g, b] = hslToRgb(this._hsla[0], this._hsla[1], this._hsla[2]);
    return [r, g, b, this._hsla[3]];
  }

  get hex(): string {
    return rgbaToHex(...this.rgb);
  }

  get value(): string {
    return this.hex;
  }

  set value(value: string) {
    const colors = parseColor(value);
    if (colors) {
      this._hsla = [...colors.hsla];
      this.updateColor(true);
    }
  }
}

customElements.define('corel-color-picker', CorelColorPicker);