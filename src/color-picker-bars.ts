import { BaseElement } from './base-element.js';
import { STYLES, LABEL_STYLE } from './common.js';
import { AlphaController } from './alpha-controller.js';
import { GradientController } from './gradient-controller.js';
import { Color, hslToRgb, rgbToHsl } from './colors.js';

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
      .grid {
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
    <div class="grid">
      <label>H</label>
      <div id="p1"></div>
      <input id="in1" type="number">
      <label>S</label>
      <div id="p2"></div>
      <input id="in2" type="number">
      <label>L</label>
      <div id="p3"></div>
      <input id="in3" type="number">
      <label>A</label>
      <div id="p4"></div>
      <input id="in4" type="number">
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

    this.mode = this._mode;
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
          break;
        case 'rgba':
          const [r, g, b] = this._rgba;
          this.gcs[0].setMode('r', r);
          this.gcs[1].setMode('g', g);
          this.gcs[2].setMode('b', b);
          break;
      }
    }
  }

  private onColorChange = () => this.handleColorChange();

  private handleColorChange() {
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
                this.gcs.forEach((gc) => gc.color = this._hsla);
                this.alphaC.hsl = this._hsla;
                break;
              }
              case 'rgba': {
                const [r, g, b, a] = this._rgba;
                this.gcs[0].value = r;
                this.gcs[1].value = g;
                this.gcs[2].value = b;
                this.alphaC.value = a;
                this.gcs.forEach((gc) => gc.color = this._rgba);
                this.alphaC.hsl = this._hsla;
                break;
              }
            }
          }
        } finally {
          this._deferred = false;
        }
      });
    }
  }
}
customElements.define('color-picker-bars', BarsColorPicker);