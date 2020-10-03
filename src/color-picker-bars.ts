import { BaseElement } from './base-element.js';
import { STYLES, LABEL_STYLE } from './common.js';
import { AlphaController } from './alpha-controller.js';
import { GradientController } from './gradient-controller.js';
import { Color } from './colors.js';

export type COLOR_MODE = 'rgba' | 'hsla';

export class BarsColorPicker extends BaseElement {
  private _hsla: Color = [0, 100, 50, 1];
  private _rgba: Color = [255, 0, 0, 1];
  private _mode: COLOR_MODE = 'hsla';

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
        grid-gap: 8px;
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
      this.gcs.push(new GradientController(p));
      this.$add(p, 'range-change', this.onColorChange);
    }
    const alphaPanel = this.$('p4');
    this.alphaC = new AlphaController(alphaPanel);
    this.$add(alphaPanel, 'range-change', this.onColorChange);

    this.updateColor();
  }

  disconnectedCallback() {
    this.gcs.forEach((gc, i) => {
      gc.detach();
      this.$remove(this.$(`p${i + 1}`), 'range-change', this.onColorChange);
    });
    this.gcs = [];
    if (this.alphaC) {
      this.alphaC.detach();
      this.alphaC = undefined;
    }
    super.disconnectedCallback();
  }

  private onColorChange() {
  }

  private updateColor() {
    this.updateGradients();
  }

  private updateGradients() {
    if (this.alphaC) {
      this.alphaC.hsl = this._hsla;
    }
    if (this.gcs.length === 3) {
      const [h, s, l] = this._hsla;
      switch (this._mode) {
        case 'hsla': {
          this.gcs[0].gradient = `linear-gradient(to right, hsl(0, ${s}%, ${l}%), hsl(60, ${s}%, ${l}%), hsl(120, ${s}%, ${l}%), hsl(180, ${s}%, ${l}%), hsl(240, ${s}%, ${l}%), hsl(300, ${s}%, ${l}%), hsl(0, ${s}%, ${l}%))`;
          this.gcs[1].gradient = `linear-gradient(to right, #000, #fff)`;
          this.gcs[2].gradient = `linear-gradient(to right, #fff, #000)`;
          break;
        }
        case 'rgba': {
          break;
        }
      }
    }
  }
}
customElements.define('color-picker-bars', BarsColorPicker);