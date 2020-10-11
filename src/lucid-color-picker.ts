import { BaseElement } from './base-element.js';
import { Color, hslaString, hslString, hslToHsv, hsvToHsl, hsvToRgb, parseColor, rgbaToHex } from './colors.js';
import { STYLES, SHADOW2, ALPHA_BG } from './common.js';
import { RectangleController } from './rectangle-controller.js';

export class LucidColorPicker extends BaseElement {
  private _hsv: Color = [0, 100, 100, 1];
  private rc?: RectangleController;

  static get observedAttributes() { return ['value']; }

  constructor() {
    super();
    this.root.innerHTML = `
    <style>
      ${STYLES}
      :host {
        display: inline-block;
        touch-action: none;
        width: 280px;
        height: 280px;
      }
      #grid {
        display: grid;
        grid-template-columns: 1fr auto;
        grid-template-rows: 1fr auto;
        height: 100%;
        position: relative;
      }
      #base {
        position: relative;
        background: hsl(var(--lucid-cp-hue, 0), 100%, 50%);
      }
      #thumb {
        position: absolute;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        box-shadow: ${SHADOW2};
        border: 2px solid #ffffff;
        top: -10px;
        left: -10px;
        cursor: pointer;
        z-index: 1;
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
      #previewPanel {
        position: relative;
        border-radius: 50%;
        overflow: hidden;
        margin: 4px 0 0 4px;
        background-image: url(${ALPHA_BG});
      }
      #preview {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
      }
      #huePanel {
        overflow: hidden;
        width: 40px;
        position: relative;
        background-image: linear-gradient(to top, hsl(0, 100%, 50%), hsl(60, 100%, 50%), hsl(120, 100%, 50%), hsl(180, 100%, 50%), hsl(240, 100%, 50%), hsl(300, 100%, 50%), hsl(0, 100%, 50%));
      }
      #alphaPanel {
        height: 40px;
        position: relative;
        background-image: url(${ALPHA_BG});
        background-size: 12px 11px;
      }
      #alphaGradient {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
      }
      #hue {
        transform: translate3d(20px, 0,0) translate3d(-50%, 0,0) rotate(-90deg);
        width: 240px;
      }
      input[type=range] {
        width: 100%;
        height: 100%;
        -webkit-appearance: none;
        background: rgba(0,0,0,0.2);
        box-sizing: border-box;
        margin: 0;
        outline: none;
        position: relative;
        pointer-events: auto;
      }
      input[type=range]:focus {
        outline: none;
      }
      input[type=range]::-ms-track {
        width: 100%;
        cursor: pointer;
        background: transparent;
        border-color: transparent;
        color: transparent;
      }
      input[type=range]::-moz-focus-outer {
        outline: none;
        border: 0;
      }
      input[type=range]::-moz-range-thumb {
        background: transparent;
        cursor: pointer;
        border: 1px solid #fff;
        height: 40px;
        width: 10px;
        margin: 0;
      }
      input[type=range]::-webkit-slider-thumb {
        -webkit-appearance: none;
        background: transparent;
        cursor: pointer;
        border: 1px solid #fff;
        height: 40px;
        width: 10px;
        margin: 0;
      }
    </style>
    <div id="grid">
      <div id="base">
        <div id="base1"></div>
        <div id="base2">
          <div id="thumb"></div>
        </div>
      </div>
      <div id="huePanel">
        <input id="hue" type="range" min="0" max="360" value="0">
      </div>
      <div id="alphaPanel">
        <div id="alphaGradient"></div>
        <input id="alpha" type="range" min="0" max="100" value="100">
      </div>
      <div id="previewPanel">
        <div id="preview"></div>
      </div>
    </div>
    `;
  }

  connectedCallback() {
    const base = this.$('base2');
    this.rc = new RectangleController(base, [0.5, 0.5]);
    this.$add(base, 'p-input', this.onSLChange);
    this.$add(this.$('hue'), 'input', this.onHueChange);
    this.$add(this.$('alpha'), 'input', this.onAlphaChange);
    this.updateColor();
  }

  disconnectedCallback() {
    if (this.rc) {
      this.rc.detach();
      this.rc = undefined;
    }
    const base = this.$('base2');
    if (base) {
      this.$remove(base, 'p-input', this.onSLChange);
      this.$remove(this.$('hue'), 'input', this.onHueChange);
      this.$remove(this.$('alpha'), 'input', this.onAlphaChange);
    }
    super.disconnectedCallback();
  }

  private onSLChange = () => {
    const [px, py] = this.rc!.position;
    this._hsv[1] = Math.max(0, Math.min(100, Math.round(px * 100)));
    this._hsv[2] = Math.max(0, Math.min(100, Math.round((1 - py) * 100)));
    this.updateColor();
    this._fire();
  }

  private onHueChange = () => {
    const input = this.$<HTMLInputElement>('hue');
    const value = Math.round(+input.value);
    if (value !== this._hsv[0]) {
      this._hsv[0] = value;
      this.updateColor();
      this._fire();
    }
  }

  private onAlphaChange = () => {
    const input = this.$<HTMLInputElement>('alpha');
    const value = (+input.value) / 100;
    if (value !== this._hsv[3]) {
      this._hsv[3] = value;
      this.updateColor();
      this._fire();
    }
  }

  private updateColor() {
    // update thumb position
    this.updateThumbPosition();

    // update inputs
    this.$<HTMLInputElement>('hue').value = `${this._hsv[0]}`;
    this.$<HTMLInputElement>('alpha').value = `${this._hsv[3] * 100}`;

    // update preview
    const hsl = hsvToHsl(this._hsv);
    this.$('preview').style.background = hslaString(hsl);

    this.style.setProperty('--lucid-cp-hue', `${this._hsv[0]}`);
    this.$('alphaGradient').style.backgroundImage = `linear-gradient(to right, hsla(${hsl[0]}, ${hsl[1]}%, ${hsl[2]}%, 0), hsla(${hsl[0]}, ${hsl[1]}%, ${hsl[2]}%, 1))`;
  }

  private updateThumbPosition() {
    if (this.rc) {
      const [h, s, v] = this._hsv;
      this.rc.position = [
        s / 100,
        1 - (v / 100)
      ];
      const t = this.$('thumb');
      const p = this.rc.position;
      const { width, height } = this.$('base2').getBoundingClientRect();
      const [x, y] = [width * p[0], height * p[1]];
      t.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      t.style.background = hslString(hsvToHsl([h, s, v, 1]));
    }
  }

  private _fire() {
    this.fire('change');
  }

  get hsl(): Color {
    return hsvToHsl(this._hsv);
  }

  get rgb(): Color {
    return hsvToRgb(this._hsv);
  }

  get value(): string {
    return rgbaToHex(...this.rgb);
  }

  set value(value: string) {
    const colors = parseColor(value);
    if (colors) {
      this._hsv = hslToHsv(colors.hsla);
      this.updateColor();
    }
  }

  attributeChangedCallback(name: string, _: string, newValue: string) {
    if (name === 'value') {
      this.value = newValue;
    }
  }

}
customElements.define('lucid-color-picker', LucidColorPicker);