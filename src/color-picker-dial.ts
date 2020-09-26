import { BaseElement } from './base-element.js';
import { STYLES, Color, radToDeg, SHADOW2, degToRad, Point } from './common.js';
import { DialController } from './dial-controller.js';
import { TriangleController } from './triangle-controller.js';

const DIAL_WIDTH = 20;
const WIDTH = 280;
const INNER_WIDTH = 280 - (DIAL_WIDTH * 2) - 5;

export class DialColorPicker extends BaseElement {
  private _hsla: Color = [0, 50, 50, 1];

  private dialC?: DialController;
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
      #thumbTrinagle,
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
        position: absolute;
        top: 0;
        left: 0;
        pointer-events: none;
      }
      #disk {
        position: absolute;
        top: 50%;
        left: 50%;
        width: ${INNER_WIDTH}px;
        height: ${INNER_WIDTH}px;
        transform: translate3d(-50%, -50%, 0);
        border-radius: 50%;
      }
    </style>
    <div id="base">
      <canvas id="wheel" width="280" height="280"></canvas>
      <canvas id="satcan" width="280" height="280"></canvas>
      <div id="disk"></div>
      <div id="thumbHue"></div>
      <div id="thumbTrinagle"></div>
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
    this.dialC = new DialController(wheel, ri / min, ro / min, this._hsla[0]);
    this.$add(wheel, 'p-input', this.handleDialInput);

    const disk = this.$('disk');
    this.triC = new TriangleController(disk, [[0, 0], [0, 0], [0, 0]], this._hsla[0], [0, 0]);
    this.$add(disk, 'p-input', this.handleTriangleInput);

    this.updateHueThumb();
    this.updateTriangleThumb();
    this.updateColor();
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
    const c = WIDTH / 2;
    const tr = c - DIAL_WIDTH - 5;

    const angles = [0, 120, 240, 180];
    const points: Point[] = [];
    for (const angle of angles) {
      points.push([
        Math.cos(degToRad(hue * 0 + angle)) * tr + c,
        Math.sin(degToRad(hue * 0 + angle)) * tr + c
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

  private updateColor() {
    const [hue, sat, lumin] = this._hsla;
    if (this.dialC) {
      this.dialC.angle = hue;
      this.deferredUpdateHueThumb();
    }

    this.renderTriangle();
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
    const t = this.$('thumbTrinagle');
    if (t && this.triC) {
      const position = this.triC.position;
      t.style.transform = `translate3d(${position[0]}px, ${position[1]}px, 0)`;
    }
  }

  private _uhtp = false;
  private deferredUpdateHueThumb() {
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
      this._hsla[0] = hue;
      this.updateColor();
      this._fire();
    }
  }

  private handleTriangleInput = (event: Event) => {
    const position = (event as CustomEvent).detail.position;
    console.log(position);
  }

  private _fire() {
    this.fire('change');
  }

  get hsl(): Color {
    return [...this._hsla];
  }
}

customElements.define('color-picker-dial', DialColorPicker);