import { BaseElement } from './base-element.js';
import { STYLES, SHADOW2 } from './common.js';
import { radToDeg, degToRad } from './math.js';
import { Color, hslString, hslToRgb, parseColor, rgbaToHex } from './colors.js';
import { ArcController } from './arc-controller.js';

const DIAL_WIDTH = 12;
const WIDTH = 240;
const INNNER_WIDTH = WIDTH - (DIAL_WIDTH * 6);

export class AtomColorPicker extends BaseElement {
  private _hsla: Color = [0, 100, 50, 1];

  private hArc?: ArcController;
  private sArc?: ArcController;
  private lArc?: ArcController;

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
        pointer-events: auto;
      }
      .thumb {
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
      .grid {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        display: grid;
        place-content: center;
        pointer-events: none;
      }
      #sArc, #lArc {
        border-radius: 50%;
      }
      #lArc {
        position: absolute;
        top: 0;
        right: 0;
      }
      #sPanel, #lPanel {
        overflow: hidden;
      }
      #preview {
        border-radius: 50%;
        border: 1px solid #e5e5e5;
      }
    </style>
    <div style="position: relative">
      <canvas id="wheel"></canvas>
      <div id="hThumb" class="thumb"></div>
      <div class="grid">
        <div class="horizontal">
          <div id="sPanel" style="position: relative;">
            <canvas id="sArc"></canvas>
            <div id="sThumb" class="thumb"></div>
          </div>
          <div id="lPanel" style="position: relative;">
            <canvas id="lArc"></canvas>
            <div id="lThumb" class="thumb"></div>
          </div>
        </div>
      </div>
      <div class="grid">
        <div id="preview"></div>
      </div>
    </div>
    `;
  }

  connectedCallback() {
    {
      const wheel = this.$<HTMLCanvasElement>('wheel');
      const ro = (WIDTH / 2) - 2;
      const ri = ro - DIAL_WIDTH;
      this.hArc = new ArcController(wheel, ri / WIDTH, ro / WIDTH, 0, 359.99);
      this.$add(wheel, 'p-input', this.onHueChange);
    }
    {
      const canvas = this.$<HTMLCanvasElement>('sArc');
      const w = INNNER_WIDTH;
      const ro = (w / 2) - 2;
      const ri = ro - DIAL_WIDTH;
      this.sArc = new ArcController(canvas, ri / w, ro / w, 100, 260);
      this.$add(canvas, 'p-input', this.onSatChange);
    }
    {
      const canvas = this.$<HTMLCanvasElement>('lArc');
      const w = INNNER_WIDTH;
      const ro = (w / 2) - 2;
      const ri = ro - DIAL_WIDTH;
      this.lArc = new ArcController(canvas, ri / w, ro / w, -80, 80);
      this.$add(canvas, 'p-input', this.onLuminChange);
    }

    this.renderWheel();
    this.updateColor();
  }

  disconnectedCallback() {
    if (this.hArc) {
      this.hArc.detach();
      this.hArc = undefined;
    }
    if (this.sArc) {
      this.sArc.detach();
      this.sArc = undefined;
    }
    if (this.lArc) {
      this.lArc.detach();
      this.lArc = undefined;
    }
    super.disconnectedCallback();
  }

  private renderWheel() {
    const canvas = this.$<HTMLCanvasElement>('wheel');
    canvas.width = WIDTH;
    canvas.height = WIDTH;
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

  private renderSatArc() {
    const w = INNNER_WIDTH;
    this.$('sPanel').style.width = `${w / 2}px`;
    const canvas = this.$<HTMLCanvasElement>('sArc');
    canvas.width = w;
    canvas.height = w;
    const ctx = canvas.getContext('2d')!;
    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);

    const h = this._hsla[0];
    const l = this._hsla[2];
    const n = 40;
    const theta = degToRad(160) / n;
    const delta = 100 / n;
    const ro = (Math.min(width, height) / 2) - 2;
    const ri = ro - DIAL_WIDTH;
    const cx = width / 2;
    const cy = height / 2;

    ctx.beginPath();
    ctx.arc(cx, cy, ri, degToRad(100), degToRad(260));
    ctx.arc(cx, cy, ro, degToRad(260), degToRad(100), true);
    ctx.closePath();
    ctx.strokeStyle = '#e5e5e5';
    ctx.stroke();

    for (let i = 1; i <= n; i++) {
      const a = i * theta + degToRad(100);
      const b = (i - 1) * theta + degToRad(100);
      const radius = ri + (ro - ri) / 2;
      const x1 = Math.cos(a) * radius + cx;
      const y1 = Math.sin(a) * radius + cy;
      const x2 = Math.cos(b) * radius + cx;
      const y2 = Math.sin(b) * radius + cy;

      const v1 = i * delta;
      const v2 = (i - 1) * delta;
      const hsl1: Color = [h, v1, l, 1];
      const hsl2: Color = [h, v2, l, 1];

      const g = ctx.createLinearGradient(x1, y1, x2, y2);
      g.addColorStop(0, hslString(hsl1));
      g.addColorStop(1, hslString(hsl2));
      const o = 0.002;
      ctx.beginPath();
      ctx.arc(cx, cy, ro, b - o, a + o, false);
      ctx.arc(cx, cy, ri, a + o, b - o, true);
      ctx.fillStyle = g;
      ctx.fill();
    }
  }

  private renderLuminArc() {
    const w = INNNER_WIDTH;
    this.$('lPanel').style.width = `${w / 2}px`;
    const canvas = this.$<HTMLCanvasElement>('lArc');
    canvas.width = w;
    canvas.height = w;
    const ctx = canvas.getContext('2d')!;
    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);

    const h = this._hsla[0];
    const s = this._hsla[1];
    const n = 40;
    const theta = degToRad(160) / n;
    const delta = 100 / n;
    const ro = (Math.min(width, height) / 2) - 2;
    const ri = ro - DIAL_WIDTH;
    const cx = width / 2;
    const cy = height / 2;

    ctx.beginPath();
    ctx.arc(cx, cy, ri, degToRad(-80), degToRad(80));
    ctx.arc(cx, cy, ro, degToRad(80), degToRad(-80), true);
    ctx.closePath();
    ctx.strokeStyle = '#e5e5e5';
    ctx.stroke();

    for (let i = 1; i <= n; i++) {
      const a = i * theta + degToRad(-80);
      const b = (i - 1) * theta + degToRad(-80);
      const radius = ri + (ro - ri) / 2;
      const x1 = Math.cos(a) * radius + cx;
      const y1 = Math.sin(a) * radius + cy;
      const x2 = Math.cos(b) * radius + cx;
      const y2 = Math.sin(b) * radius + cy;

      const v1 = i * delta;
      const v2 = (i - 1) * delta;
      const hsl1: Color = [h, s, v1, 1];
      const hsl2: Color = [h, s, v2, 1];

      const g = ctx.createLinearGradient(x1, y1, x2, y2);
      g.addColorStop(0, hslString(hsl1));
      g.addColorStop(1, hslString(hsl2));
      const o = 0.002;
      ctx.beginPath();
      ctx.arc(cx, cy, ro, b - o, a + o, false);
      ctx.arc(cx, cy, ri, a + o, b - o, true);
      ctx.fillStyle = g;
      ctx.fill();
    }
  }

  private renderPreview() {
    const preview = this.$('preview');
    const w = INNNER_WIDTH - (DIAL_WIDTH * 8);
    preview.style.width = `${w}px`;
    preview.style.height = `${w}px`;
    preview.style.background = hslString(this._hsla);
  }

  private updateColor() {
    this.renderSatArc();
    this.renderLuminArc();
    this.renderPreview();

    this.updateHueThumb();
    this.updateSatThumb();
    this.updateLuminThumb();
  }

  private updateHueThumb() {
    const t = this.$('hThumb');
    const hue = this._hsla[0];
    const radius = (WIDTH / 2) - (DIAL_WIDTH / 2) - 2.5;
    const x = (WIDTH / 2) + (radius * Math.cos(degToRad(hue)));
    const y = (WIDTH / 2) + (radius * Math.sin(degToRad(hue)));
    t.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    t.style.background = hslString([hue, 100, 50, 1]);
  }

  private updateSatThumb() {
    const t = this.$('sThumb');
    const sat = this._hsla[1];
    const angle = (160 / 100) * sat + 100;
    const w = INNNER_WIDTH;
    const radius = (w / 2) - (DIAL_WIDTH / 2) - 2.5;
    const x = (w / 2) + (radius * Math.cos(degToRad(angle)));
    const y = (w / 2) + (radius * Math.sin(degToRad(angle)));
    t.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    t.style.background = hslString(this._hsla);
  }

  private updateLuminThumb() {
    const t = this.$('lThumb');
    const lum = this._hsla[2];
    const angle = (160 / 100) * lum - 80;
    const w = INNNER_WIDTH;
    const radius = (w / 2) - (DIAL_WIDTH / 2) - 2.5;
    const x = (radius * Math.cos(degToRad(angle)));
    const y = (w / 2) + (radius * Math.sin(degToRad(angle)));
    t.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    t.style.background = hslString(this._hsla);
  }

  private onHueChange = (event: Event) => {
    const angle = (event as CustomEvent).detail.angle;
    this._hsla[0] = angle;
    this.updateColor();
    this._fire();
  }

  private onSatChange = (event: Event) => {
    const angle = (event as CustomEvent).detail.angle - 100;
    this._hsla[1] = (100 / 160) * angle;
    this.updateColor();
    this._fire();
  }

  private onLuminChange = (event: Event) => {
    let angle = (event as CustomEvent).detail.angle;
    if (angle > 80) {
      angle = angle - 360;
    }
    this._hsla[2] = (100 / 160) * angle + (100 - 80 * (100 / 160));
    this.updateColor();
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
      this.updateColor();
    }
  }
}
customElements.define('atom-color-picker', AtomColorPicker);