import { BaseElement } from './base-element.js';
import { ALPHA_BG, STYLES, SHADOW2, SHADOW3, LABEL_STYLE } from './common.js';
import { HueController } from './hue-controller.js';
import { RectangleController } from './rectangle-controller';
import { AlphaController } from './alpha-controller.js';
import { hslaString, hslString, hslToRgb, parseColor, rgbaToHex, rgbToHsl, Color } from './colors.js';

const COLOR_TYPES = ['rgba', 'hsla', 'hex'];

export class DinoColorPicker extends BaseElement {
  private colorType = 0;
  private _hsla: Color = [0, 50, 50, 1];
  private _rgba: Color = [191, 64, 64, 1];
  private _hex = '#bf4040';

  private rc?: RectangleController;
  private hueC?: HueController;
  private alphaC?: AlphaController;

  constructor() {
    super();
    this.root.innerHTML = `
    <style>
      ${STYLES}
      ${LABEL_STYLE}
      [hidden] {display: none !important;}
      :host {
        display: inline-block;
        touch-action: none;
        background: #FAFAFA;
        box-shadow: ${SHADOW3};
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
        box-shadow: ${SHADOW2};
        border: var(--thumb-border, 2px solid #ffffff);
        transform: translate3d(-50%, -50%, 0);
        cursor: pointer;
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
        box-shadow: ${SHADOW2};
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
      <div id="base2">
        <div id="thumb"></div>
      </div>
      
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
          <div class="flex vertical cell">
            <input id="inputR" type="number" class="cellInput">
            <label>R</label>
          </div>
          <div class="flex vertical cell">
            <input id="inputG" type="number" class="cellInput">
            <label>G</label>
          </div>
          <div class="flex vertical cell">
            <input id="inputB" type="number" class="cellInput">
            <label>B</label>
          </div>
          <div class="flex vertical cell">
            <input id="inputA" step="0.01" type="number" class="cellInput">
            <label>A</label>
          </div>
        </div>
        <div hidden id="hsla" class="horizontal">
          <div class="flex vertical cell">
            <input id="inputH" type="number" class="cellInput">
            <label>H</label>
          </div>
          <div class="flex vertical cell">
            <input id="inputS" type="number" class="cellInput">
            <label>S(%)</label>
          </div>
          <div class="flex vertical cell">
            <input id="inputL" type="number" class="cellInput">
            <label>L(%)</label>
          </div>
          <div class="flex vertical cell">
            <input id="inputA2" step="0.01" type="number" class="cellInput">
            <label>A</label>
          </div>
        </div>
        <div hidden id="hex" class="horizontal">
          <div class="flex vertical cell">
            <input id="inputHex" class="cellInput">
            <label>HEX</label>
          </div>
        </div>
      </div>
      <button id="colorTypeToggle" aria-label="color mode">
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
    this.$add(base, 'p-input', this.handlePlaneInput);

    const huePanel = this.$('huePanel');
    this.hueC = new HueController(huePanel);
    this.$add(huePanel, 'range', this.onHueChange);

    const alphaPanel = this.$('alphaPanel');
    this.alphaC = new AlphaController(alphaPanel);
    this.$add(alphaPanel, 'range', this.onAlphaChange);

    this.$add('rgba', 'change', this.onRGBinput);
    this.$add('hsla', 'change', this.onHSLInput);
    this.$add('hex', 'change', this.onHexInput);
    this.$add('colorTypeToggle', 'click', this.onColorTypeToggle);

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
      this.$remove(base, 'p-input', this.handlePlaneInput);
      this.$remove('rgba', 'change', this.onRGBinput);
      this.$remove('hsla', 'change', this.onHSLInput);
      this.$remove('hex', 'change', this.onHexInput);
      this.$remove('colorTypeToggle', 'click', this.onColorTypeToggle);
      this.$remove('huePanel', 'range', this.onHueChange);
      this.$remove('alphaPanel', 'range', this.onAlphaChange);
    }
    super.disconnectedCallback();
  }

  private updateColor() {
    const color = hslaString(this._hsla);
    const [hue, sat, lumin, alpha] = this._hsla;
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

    this.$<HTMLInputElement>('inputR').value = `${this._rgba[0]}`;
    this.$<HTMLInputElement>('inputG').value = `${this._rgba[1]}`;
    this.$<HTMLInputElement>('inputB').value = `${this._rgba[2]}`;
    this.$<HTMLInputElement>('inputA').value = `${alpha}`;
    this.$<HTMLInputElement>('inputH').value = `${hue}`;
    this.$<HTMLInputElement>('inputS').value = `${sat}`;
    this.$<HTMLInputElement>('inputL').value = `${lumin}`;
    this.$<HTMLInputElement>('inputA2').value = `${alpha}`;
    this.$<HTMLInputElement>('inputHex').value = `${this._hex}`;

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
      t.style.background = hslString(this._hsla);
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
    const s = Math.max(0, Math.min(100, Math.round(px * 100)));
    const l = Math.max(0, Math.min(100, Math.round(50 * (2 - px - py))));
    if ((s !== this._hsla[1]) || (l !== this._hsla[2])) {
      this._hsla[1] = s;
      this._hsla[2] = l;
      this.onHSLChange();
    }
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
    this._rgba = [r, g, b, alpha];
    this._hsla = [h, s, l, alpha];
    this._hex = rgbaToHex(r, g, b, alpha);
    this.updateColor();
    this._fire();
  }

  private onHexInput = (event: Event) => {
    event.stopPropagation();
    this.onHexChange(this.$<HTMLInputElement>('inputHex').value.trim());
  }

  private onHSLInput = (event: Event) => {
    event.stopPropagation();
    this._hsla[0] = Math.round(+this.$<HTMLInputElement>('inputH').value);
    this._hsla[1] = +this.$<HTMLInputElement>('inputS').value;
    this._hsla[2] = +this.$<HTMLInputElement>('inputL').value;
    this._hsla[3] = +this.$<HTMLInputElement>('inputA2').value;
    this.onHSLChange();
  }

  private onColorTypeToggle = (_event: Event) => {
    this.colorType = (this.colorType + 1) % COLOR_TYPES.length;
    this.updateColorType();
  }

  private onHueChange = (event: Event) => {
    let [hue, sat, lumin, alpha] = this._hsla;
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
      this._hsla = [hue, sat, lumin, alpha];
      this.onHSLChange();
    }
  }

  private onAlphaChange = (event: Event) => {
    this._hsla[3] = (event as CustomEvent).detail.value;
    this.onHSLChange();
  }

  private onHSLChange() {
    const [hue, sat, lumin, alpha] = this._hsla;
    const [r, g, b] = hslToRgb(hue, sat, lumin);
    this._rgba = [r, g, b, alpha];
    this._hex = rgbaToHex(r, g, b, alpha);
    this.updateColor();
    this._fire();
  }

  private onHexChange(hex: string, fire = true) {
    this.value = hex;
    if (fire) {
      this._fire();
    }
  }

  private _fire() {
    this.fire('change');
  }

  get rgb(): Color {
    return [...this._rgba];
  }

  get hsl(): Color {
    return [...this._hsla];
  }

  get value(): string {
    return this._hex;
  }

  set value(value: string) {
    const colors = parseColor(value);
    if (colors) {
      this._hsla = [...colors.hsla];
      this._rgba = [...colors.rgba];
      this._hex = colors.hex;
      this.updateColor();
    }
  }
}

customElements.define('dino-color-picker', DinoColorPicker);