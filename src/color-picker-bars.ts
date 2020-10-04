import { BaseElement } from './base-element.js';
import { STYLES, LABEL_STYLE } from './common.js';
import { AlphaController } from './alpha-controller.js';
import { GradientController } from './gradient-controller.js';
import { Color, hslToRgb, parseColor, rgbaToHex, rgbToHsl } from './colors.js';

export type ColorMode = 'rgba' | 'hsla';

export class BarsColorPicker extends BaseElement {
  private _hsla: Color = [0, 100, 50, 1];
  private _rgba: Color = [255, 0, 0, 1];
  private _mode: ColorMode = 'hsla';

  private alphaC?: AlphaController;
  private gcs: GradientController[] = [];

  constructor() {
    super();
    this.root.innerHTML = `
    <style>
      ${STYLES}
      ${LABEL_STYLE}
      :host {
        display: inline-block;
        touch-action: none;
        width: 224px;
        padding: 8px;
      }
      #grid {
        grid-gap: var(--bar-vertical-gap, 10px) 8px;
        display: grid;
        grid-template-columns: auto 1fr auto;
        align-items: center;
      }
      input[type="number"] {
        text-align: center;
        border-radius: 0;
        border: none;
        border-bottom: 1px solid #d8d8d8;
        outline: none;
        font-size: 11px;
        letter-spacing: 0.5px;
        padding: 2px 2px 4px;
        margin-bottom: 4px;
        font-family: inherit;
        width: 32px;
        background: none;
      }
      input[type="number"]:focus {
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
    </style>
    <div id="grid">
      <label id="l1">H</label>
      <div id="p1"></div>
      <input id="in1" type="number">
      <label  id="l2">S</label>
      <div id="p2"></div>
      <input id="in2" type="number">
      <label id="l3">L</label>
      <div id="p3"></div>
      <input id="in3" type="number">
      <label>A</label>
      <div id="p4"></div>
      <input id="in4" type="number" min="0" max="1" step="0.1">
    </div>
    `;
  }

  connectedCallback() {
    this.gcs = [];
    for (let i = 0; i < 3; i++) {
      const p = this.$(`p${i + 1}`);
      this.gcs.push(new GradientController(p, 'h'));
      this.$add(p, 'range-change', this.onColorChange);
    }
    const alphaPanel = this.$('p4');
    this.alphaC = new AlphaController(alphaPanel);
    this.$add(alphaPanel, 'range-change', this.onColorChange);
    this.$add(this.$('grid'), 'change', this.onTextInputChange);

    this.mode = this._mode;
    this.deferredUpdateUi();
  }

  disconnectedCallback() {
    this.gcs.forEach((gc, i) => {
      gc.detach();
      this.$remove(this.$(`p${i + 1}`), 'range-change', this.onColorChange);
    });
    this.gcs = [];
    if (this.alphaC) {
      this.alphaC.detach();
      this.$remove(this.$('p4'), 'range-change', this.onColorChange);
      this.alphaC = undefined;
    }
    this.$remove(this.$('grid'), 'change', this.onTextInputChange);
    super.disconnectedCallback();
  }

  set mode(value: ColorMode) {
    this._mode = value;
    if (this.gcs.length) {
      switch (value) {
        case 'hsla':
          const [h, s, l] = this._hsla;
          this.gcs[0].setMode('h', h);
          this.gcs[1].setMode('s', s);
          this.gcs[2].setMode('l', l);
          ['H', 'S', 'L'].forEach((d, i) => this.$(`l${i + 1}`).textContent = d);
          break;
        case 'rgba':
          const [r, g, b] = this._rgba;
          this.gcs[0].setMode('r', r);
          this.gcs[1].setMode('g', g);
          this.gcs[2].setMode('b', b);
          ['R', 'G', 'B'].forEach((d, i) => this.$(`l${i + 1}`).textContent = d);
          break;
      }
    }
  }

  private onTextInputChange = () => {
    const color: Color = [
      +this.$<HTMLInputElement>('in1').value,
      +this.$<HTMLInputElement>('in2').value,
      +this.$<HTMLInputElement>('in3').value,
      +this.$<HTMLInputElement>('in4').value,
    ];
    switch (this._mode) {
      case 'hsla':
        this._hsla = color;
        const [h, s, l, a] = this._hsla;
        this._rgba = [...hslToRgb(h, s, l), a];
        break;
      case 'rgba':
        this._rgba = color;
        const [r, g, b, a2] = this._rgba;
        this._hsla = [...rgbToHsl(r, g, b), a2];
        break;
    }
    this.deferredUpdateUi();
    this._fire();
  }

  private onColorChange = () => {
    if (this.gcs.length && this.alphaC) {
      switch (this._mode) {
        case 'hsla':
          this._hsla = [
            this.gcs[0].value,
            this.gcs[1].value,
            this.gcs[2].value,
            this.alphaC.value
          ];
          const [h, s, l, a] = this._hsla;
          this._rgba = [...hslToRgb(h, s, l), a];
          break;
        case 'rgba':
          this._rgba = [
            this.gcs[0].value,
            this.gcs[1].value,
            this.gcs[2].value,
            this.alphaC.value
          ];
          const [r, g, b, a2] = this._rgba;
          this._hsla = [...rgbToHsl(r, g, b), a2];
          break;
      }
    }
    this.deferredUpdateUi();
    this._fire();
  }

  private _deferred = false;
  private deferredUpdateUi() {
    if (!this._deferred) {
      this._deferred = true;
      requestAnimationFrame(() => {
        try {
          if (this.gcs.length && this.alphaC) {
            switch (this._mode) {
              case 'hsla': {
                const [h, s, l, a] = this._hsla;
                this.gcs[0].value = h;
                this.gcs[1].value = s;
                this.gcs[2].value = l;
                this.alphaC.value = a;
                this.gcs.forEach((gc, i) => {
                  gc.color = this._hsla;
                  this.$<HTMLInputElement>(`in${i + 1}`).value = `${gc.value}`;
                });
                break;
              }
              case 'rgba': {
                const [r, g, b, a] = this._rgba;
                this.gcs[0].value = r;
                this.gcs[1].value = g;
                this.gcs[2].value = b;
                this.alphaC.value = a;
                this.gcs.forEach((gc, i) => {
                  gc.color = this._rgba;
                  this.$<HTMLInputElement>(`in${i + 1}`).value = `${gc.value}`;
                });
                break;
              }
            }
            this.alphaC.hsl = this._hsla;
            this.$<HTMLInputElement>('in4').value = `${this.alphaC.value}`;
          }
        } finally {
          this._deferred = false;
        }
      });
    }
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
      this._rgba = [...colors.rgba];
      this.deferredUpdateUi();
    }
  }
}
customElements.define('color-picker-bars', BarsColorPicker);