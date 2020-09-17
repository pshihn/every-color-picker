import { BaseElement } from './base-element.js';
import { ALPHA_BG, STYLES, Color } from './common.js';
import { HueController } from './hue-controller.js';
import { RectangleController } from './rectangle-controller';
import { AlphaController } from './alpha-controller.js';
import { hexToRgba, hslaString, hslString, hslToRgb, rgbaToHex, rgbToHsl } from './colors.js';

const COLOR_TYPES = ['rgba', 'hsla', 'hex'];

export class DinoColorPicker extends BaseElement {
  private colorType = 0;
  private hsla: Color = [0, 50, 50, 1];
  private rgba: Color = [191, 64, 64, 1];
  private hex = '#bf4040';

  private rc?: RectangleController;
  private hueC?: HueController;
  private alphaC?: AlphaController;

  constructor() {
    super();
    this.root.innerHTML = `
    <style>
      ${STYLES}

      :host {
        display: inline-block;
        touch-action: none;
        background: #FAFAFA;
        box-shadow: 0 3px 1px -2px rgba(0,0,0,.2), 0 2px 2px 0 rgba(0,0,0,.14), 0 1px 5px 0 rgba(0,0,0,.12);
        width: 240px;
      }
      #base {
        position: relative;
        height: var(--canvas-height, 130px);
      }
      #thumb {
        position: absolute;
        width: var(--thumb-size, 15px);
        height: var(--thumb-size, 15px);
        border-radius: 50%;
        box-shadow: 0 2px 1px -1px rgba(0,0,0,.2), 0 1px 1px 0 rgba(0,0,0,.14), 0 1px 3px 0 rgba(0,0,0,.12);
        background: var(--thumb-background, transparent);
        border: var(--thumb-border, 2px solid #ffffff);
        transform: translate3d(-50%, -50%, 0);
        pointer-events: none;
      }
      #base1,
      #base2 {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        border: none;
      }
      #base1 {
        background: linear-gradient(to right, #fff 0%, rgba(255, 255, 255, 0) 100%);
      }
      #base2 {
        background: linear-gradient(to bottom, transparent 0%, #000 100%);
      }
      #sliderSection {
        padding: 16px 0;
      }
      #textSection {
        padding: 6px 0 8px 4px;
        color: #808080;
      }
      #colorPreviewPanel {
        box-shadow: 0 2px 1px -1px rgba(0,0,0,.2), 0 1px 1px 0 rgba(0,0,0,.14), 0 1px 3px 0 rgba(0,0,0,.12);
        border-radius: 50%;
        width: 40px;
        height: 40px;
        margin: 0 4px 0 6px;
        overflow: hidden;
        position: relative;
        background-image: url(${ALPHA_BG});
        background-size: 12px 11px;
      }
      #colorPreview {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
      }
      .cell {
        padding: 0 2px;
      }
      .cellInput {
        width: 100%;
        text-align: center;
        border-radius: 0;
        border: 1px solid #d8d8d8;
        outline: none;
        font-size: 11px;
        letter-spacing: 0.5px;
        padding: 6px 2px;
        margin-bottom: 4px;
        font-family: inherit;
      }
      .cellInput:focus {
        border-color: var(--focus-ring-color, #000);
      }
      input::-webkit-outer-spin-button,
      input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
      }
      input[type=number] {
          -moz-appearance:textfield;
      }
      label {display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em;}
      #colorTypeToggle {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        position: relative;
        vertical-align: middle;
        fill: currentcolor;
        stroke: none;
        box-sizing: initial;
        padding: 10px;
        border: 0;
        background: none;
        border-radius: 50%;
        color: inherit;
        cursor: pointer;
        overflow: hidden;
        outline: none;
      }
      #colorTypeToggle::before {
        content: "";
        position: absolute;
        top: 0px;
        left: 0px;
        width: 100%;
        height: 100%;
        opacity: 0;
        pointer-events: none;
        background: currentcolor;
      }
      svg {
        pointer-events: none;
        display: block;
        width: 24px;
        height: 24px;
        transition: transform 0.3s ease;
      }
      #colorTypeToggle:active svg {
        transform: scale(1.15);
      }
      #alphaPanel{
        margin-top: 18px;
      }

      @media(hover:hover) {
        #colorTypeToggle:hover::before {
          opacity: 0.1;
        }
      }
    </style>
    <div id="base">
      <div id="base1"></div>
      <div id="base2"></div>
      <div id="thumb"></div>
    </div>
    <div id="sliderSection" class="horizontal center">
      <div id="colorPreviewPanel">
        <div id="colorPreview"></div>
      </div>
      <div class="vertical flex" style="padding: 0 8px;">
        <div id="huePanel"></div>
        <div id="alphaPanel"></div>
      </div>
    </div>
    <div id="textSection" class="horizontal center">
      <div class="flex">
        <div id="rgba" class="horizontal color-text-panel">
          <div class="flex vertical center-center cell">
            <input id="inputR" type="number" class="cellInput">
            <label>R</label>
          </div>
          <div class="flex vertical center-center cell">
            <input id="inputG" type="number" class="cellInput">
            <label>G</label>
          </div>
          <div class="flex vertical center-center cell">
            <input id="inputB" type="number" class="cellInput">
            <label>B</label>
          </div>
          <div class="flex vertical center-center cell">
            <input id="inputA" type="number" class="cellInput">
            <label>A</label>
          </div>
        </div>
        <div hidden id="hsla" class="horizontal">
          <div class="flex vertical center-center cell">
            <input id="inputH" type="number" class="cellInput">
            <label>H</label>
          </div>
          <div class="flex vertical center-center cell">
            <input id="inputS" type="number" class="cellInput">
            <label>S(%)</label>
          </div>
          <div class="flex vertical center-center cell">
            <input id="inputL" type="number" class="cellInput">
            <label>L(%)</label>
          </div>
          <div class="flex vertical center-center cell">
            <input id="inputA2" type="number" class="cellInput">
            <label>A</label>
          </div>
        </div>
        <div hidden id="hex" class="horizontal">
          <div class="flex vertical center-center cell">
            <input id="inputHex" class="cellInput">
            <label>HEX</label>
          </div>
        </div>
      </div>
      <button id="colorTypeToggle">
        <svg viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" focusable="false">
          <g>
            <path d="M12 5.83L15.17 9l1.41-1.41L12 3 7.41 7.59 8.83 9 12 5.83zm0 12.34L8.83 15l-1.41 1.41L12 21l4.59-4.59L15.17 15 12 18.17z"></path>
          </g>
        </svg>
      </button>
      
    </div>
    `;
  }

  connectedCallback() {
    const base = this.$('base2');
    this.rc = new RectangleController(base, [0.5, 0.5]);
    base.addEventListener('p-input', this.handlePlaneInput);
    base.addEventListener('p-change', this.handlePlaneInput);

    const huePanel = this.$('huePanel');
    this.hueC = new HueController(huePanel);
    huePanel.addEventListener('range-change', this.onHueChange);

    const alphaPanel = this.$('alphaPanel');
    this.alphaC = new AlphaController(alphaPanel);
    alphaPanel.addEventListener('range-change', this.onAlphaChange);

    this.$('rgba').addEventListener('input', this.onRGBinput);
    this.$('hsla').addEventListener('input', this.onHSLInput);
    this.$('hex').addEventListener('input', this.onHexInput);
    this.$('colorTypeToggle').addEventListener('click', this.onColorTypeToggle);

    this.updateColorType();
    this.updateThumb();
    this.updateColor();
  }

  disconnectedCallback() {
    this._utp = false;

    if (this.rc) {
      this.rc.detach();
      this.rc = undefined;
    }
    if (this.hueC) {
      this.hueC.detach();
      this.hueC = undefined;
    }
    if (this.alphaC) {
      this.alphaC.detach();
      this.alphaC = undefined;
    }

    const base = this.$('base2');
    if (base) {
      base.removeEventListener('p-input', this.handlePlaneInput);
      base.removeEventListener('p-change', this.handlePlaneInput);
      this.$('rgba').removeEventListener('input', this.onRGBinput);
      this.$('hsla').removeEventListener('input', this.onHSLInput);
      this.$('hex').removeEventListener('input', this.onHexInput);
      this.$('colorTypeToggle').removeEventListener('click', this.onColorTypeToggle);

      this.$('huePanel').addEventListener('range-change', this.onHueChange);
      this.$('alphaPanel').addEventListener('range-change', this.onAlphaChange);
    }
    super.disconnectedCallback();
  }

  private updateColor() {
    const color = hslaString(this.hsla);
    const [hue, sat, lumin, alpha] = this.hsla;
    if (this.alphaC) {
      this.alphaC.hue = hue;
      this.alphaC.value = alpha;
    }
    if (this.hueC) {
      this.hueC.value = hue;
    }
    if (this.rc) {
      this.rc.position = [
        sat / 100,
        2 - (lumin / 50) - (sat / 100)
      ];
      this.deferredUpdateThumb();
    }

    this.$<HTMLInputElement>('inputR').value = `${this.rgba[0]}`;
    this.$<HTMLInputElement>('inputG').value = `${this.rgba[1]}`;
    this.$<HTMLInputElement>('inputB').value = `${this.rgba[2]}`;
    this.$<HTMLInputElement>('inputA').value = `${alpha}`;
    this.$<HTMLInputElement>('inputH').value = `${hue}`;
    this.$<HTMLInputElement>('inputS').value = `${sat}`;
    this.$<HTMLInputElement>('inputL').value = `${lumin}`;
    this.$<HTMLInputElement>('inputA2').value = `${alpha}`;
    this.$<HTMLInputElement>('inputHex').value = `${this.hex}`;

    this.$('colorPreview').style.background = color;
    this.$('base').style.background = hslString([hue, 100, 50, 1]);
  }

  private updateColorType() {
    for (let i = 0; i < COLOR_TYPES.length; i++) {
      const n = this.$(COLOR_TYPES[i]);
      if (i === this.colorType) {
        n.removeAttribute('hidden');
      } else {
        n.setAttribute('hidden', '');
      }
    }
  }

  private updateThumb() {
    const t = this.$('thumb');
    if (t && this.rc) {
      const p = this.rc.position;
      t.style.left = `${p[0] * 100}%`;
      t.style.top = `${p[1] * 100}%`;
    }
  }

  private _utp = false;
  private deferredUpdateThumb() {
    if (!this._utp) {
      this._utp = true;
      requestAnimationFrame(() => {
        if (this._utp) {
          this.updateThumb();
          this._utp = false;
        }
      });
    }
  }

  private handlePlaneInput = () => {
    const [px, py] = this.rc!.position;
    this.hsla[1] = Math.max(0, Math.min(100, Math.round(px * 100)));
    this.hsla[2] = Math.max(0, Math.min(100, Math.round(50 * (2 - px - py))));
    this.onHSLChange();
  }

  private onRGBinput = (event: Event) => {
    event.stopPropagation();
    const [r, g, b, alpha] = [
      +this.$<HTMLInputElement>('inputR').value,
      +this.$<HTMLInputElement>('inputG').value,
      +this.$<HTMLInputElement>('inputB').value,
      +this.$<HTMLInputElement>('inputA').value
    ];
    const [h, s, l] = rgbToHsl(r, g, b);
    this.rgba = [r, g, b, alpha];
    this.hsla = [h, s, l, alpha];
    this.hex = rgbaToHex(r, g, b, alpha);
    this.updateColor();
  }

  private onHexInput = (event: Event) => {
    event.stopPropagation();
    let hex = this.$<HTMLInputElement>('inputHex').value.trim();
    const lastIndex = hex.lastIndexOf('#');
    if (lastIndex >= 0) {
      hex = hex.substring(lastIndex + 1);
    }
    const rgba = hexToRgba(hex);
    if (rgba) {
      const [r, g, b, a] = rgba;
      if (isNaN(r) || isNaN(g) || isNaN(b) || isNaN(a)) {
        return;
      }
      const [h, s, l] = rgbToHsl(r, g, b);
      this.rgba = [r, g, b, a];
      this.hsla = [h, s, l, a];
      this.hex = hex;
      this.updateColor();
    }
  }

  private onHSLInput = (event: Event) => {
    event.stopPropagation();
    this.hsla[0] = Math.round(+this.$<HTMLInputElement>('inputH').value);
    this.hsla[1] = +this.$<HTMLInputElement>('inputS').value;
    this.hsla[2] = +this.$<HTMLInputElement>('inputL').value;
    this.hsla[3] = +this.$<HTMLInputElement>('inputA2').value;
    this.onHSLChange();
  }

  private onColorTypeToggle = (_event: Event) => {
    this.colorType = (this.colorType + 1) % COLOR_TYPES.length;
    this.updateColorType();
  }

  private onHueChange = (event: Event) => {
    let [hue, sat, lumin, alpha] = this.hsla;
    const newHue = (event as CustomEvent).detail.value;
    if (newHue !== hue) {
      hue = newHue;
      if (!alpha) {
        alpha = 1;
      }
      if (!sat && !lumin) {
        sat = 75;
        lumin = 50;
      }
      this.hsla = [hue, sat, lumin, alpha];
      this.onHSLChange();
    }
  }

  private onAlphaChange = (event: Event) => {
    this.hsla[3] = (event as CustomEvent).detail.value;
    this.onHSLChange();
  }

  private onHSLChange() {
    const [hue, sat, lumin, alpha] = this.hsla;
    const [r, g, b] = hslToRgb(hue, sat, lumin);
    this.rgba = [r, g, b, alpha];
    this.hex = rgbaToHex(r, g, b, alpha);
    this.updateColor();
  }
}

customElements.define('color-picker-dino', DinoColorPicker);