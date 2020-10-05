import { BaseElement } from './base-element.js';
import { Color, hslString, hsvToHsl } from './colors.js';
import { STYLES, SHADOW2, } from './common.js';
import { DiskController } from './disk-controller.js';
import { degToRad } from './math.js';

const DIAL_WIDTH = 20;
const WIDTH = 280;
const INNER_WIDTH = WIDTH - (DIAL_WIDTH * 3);

export class DiskColorPicker extends BaseElement {
  private _hsv: Color = [0, 50, 100, 1];
  private _hsl: Color = hsvToHsl(this._hsv);

  private diskC?: DiskController;

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
      #diskPanel {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: grid;
        place-items: center;
        pointer-events: none;
      }
      #diskThumb {
        position: absolute;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        box-shadow: ${SHADOW2};
        background: transparent;
        border: 2px solid #ffffff;
        top: -10px;
        left: -10px;
      }
      #wheel {
        background: rgba(255, 0, 0, 0.1);
      }
      #disk {
        pointer-events: auto;
        border-radius: 50%;
      }
    </style>
    <div id="base">
      <canvas id="wheel" width="${WIDTH}" height="${WIDTH}"></canvas>
      <div id="diskPanel">
        <div style="position: relative;">
          <canvas id="disk" width="${INNER_WIDTH}" height="${INNER_WIDTH}"></canvas>
          <div id="diskThumb"></div>
        </div>
      </div>
    </div>
    `;
  }

  connectedCallback() {
    const disk = this.$<HTMLCanvasElement>('disk');
    this.diskC = new DiskController(disk, INNER_WIDTH / 2, 0, 0);
    this.$add(disk, 'p-input', this.handleDiskInput);

    this.renderDisk();
  }

  disconnectedCallback() {
    if (this.diskC) {
      this.diskC.detach();
      this.diskC = undefined;
    }
    super.disconnectedCallback();
  }

  private updateColor() {
    const [h, s] = this._hsv;
    if (this.diskC) {
      this.diskC.angle = h;
      this.diskC.distance = s / 100;
    }
    this._hsl = hsvToHsl(this._hsv);
    this.deferredRender();
  }

  private _renderPending = false;
  private deferredRender() {
    if (!this._renderPending) {
      this._renderPending = true;
      requestAnimationFrame(() => {
        this._renderPending = false;
        this.updateDiskThumb();
      });
    }
  }

  private updateDiskThumb() {
    const t = this.$('diskThumb');
    if (t && this.diskC) {
      const a = this.diskC.angle;
      const HW = INNER_WIDTH / 2;
      const r = this.diskC.distance * HW;
      const x = (r * Math.cos(degToRad(a))) + HW;
      const y = (r * Math.sin(degToRad(a))) + HW;
      t.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      const color = hslString(this._hsl);
      t.style.background = color;
    }
  }

  private renderDisk() {
    const size = INNER_WIDTH;
    const canvas = this.$<HTMLCanvasElement>('disk');
    const w = INNER_WIDTH;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, w, w);

    const canvasClone = document.createElement('canvas');
    canvasClone.width = canvasClone.height = size;
    const canvasCloneCtx = canvasClone.getContext('2d')!;

    let angle = 0;
    const hexCode = [255, 0, 0];
    let pivotPointer = 0;
    const colorOffsetByDegree = 4.322;
    while (angle++ < 360) {
      const pivotPointerbefore = (pivotPointer + 3 - 1) % 3;
      if (hexCode[pivotPointer] < 255) {
        hexCode[pivotPointer] = (hexCode[pivotPointer] + colorOffsetByDegree > 255 ? 255 : hexCode[pivotPointer] + colorOffsetByDegree);
      }
      else if (hexCode[pivotPointerbefore] > 0) {
        hexCode[pivotPointerbefore] = (hexCode[pivotPointerbefore] > colorOffsetByDegree ? hexCode[pivotPointerbefore] - colorOffsetByDegree : 0);
      }
      else if (hexCode[pivotPointer] >= 255) {
        hexCode[pivotPointer] = 255;
        pivotPointer = (pivotPointer + 1) % 3;
      }
      //clear clone
      canvasCloneCtx.clearRect(0, 0, size, size);
      const grad = canvasCloneCtx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
      grad.addColorStop(0, 'white');
      grad.addColorStop(1, 'rgb(' + hexCode.map(function (h) { return Math.floor(h); }).join(',') + ')');
      canvasCloneCtx.fillStyle = grad;
      canvasCloneCtx.globalCompositeOperation = 'source-over';
      canvasCloneCtx.beginPath();
      canvasCloneCtx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
      canvasCloneCtx.closePath();
      canvasCloneCtx.fill();
      canvasCloneCtx.globalCompositeOperation = 'destination-out';
      canvasCloneCtx.beginPath();
      canvasCloneCtx.arc(size / 2, size / 2, 0, degToRad(angle + 1), degToRad(angle + 1));
      canvasCloneCtx.arc(size / 2, size / 2, size / 2 + 1, degToRad(angle + 1), degToRad(angle + 1));
      canvasCloneCtx.arc(size / 2, size / 2, size / 2 + 1, degToRad(angle + 1), degToRad(angle - 1));
      canvasCloneCtx.arc(size / 2, size / 2, 0, degToRad(angle + 1), degToRad(angle - 1));
      canvasCloneCtx.closePath();
      canvasCloneCtx.fill();
      ctx.drawImage(canvasClone, 0, 0);
    }
  }

  private handleDiskInput = (event: Event) => {
    const { angle, distance } = (event as CustomEvent).detail as { angle: number; distance: number };
    this._hsv[0] = angle;
    this._hsv[1] = Math.round(distance * 100);
    this.updateColor();
    this._fire();
  }

  private _fire() {
    this.fire('change');
  }
}
customElements.define('disk-color-picker', DiskColorPicker);