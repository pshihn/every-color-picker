import { AlphaController } from './alpha-controller.js';
import { BaseElement } from './base-element.js';
import { Color } from './colors.js';
import { STYLES, SHADOW2 } from './common.js';
import { GradientController } from './gradient-controller.js';
import { RectangleController } from './rectangle-controller.js';

export class LucidColorPicker extends BaseElement {
  private _hsla: Color = [0, 100, 50, 1];

  private rc?: RectangleController;
  private hueC?: GradientController;
  private alphaC?: AlphaController;

  constructor() {
    super();
    this.root.innerHTML = `
    <style>
      ${STYLES}
      :host {
        display: inline-block;
        touch-action: none;
        width: 280px;
      }
      #grid {
        grid-gap: 6px;
        display: grid;
        grid-template-columns: 1fr auto;
        align-items: center;
      }
      #base {
        position: relative;
        height: var(--canvas-height, 234px);
      }
      #thumb {
        position: absolute;
        width: var(--thumb-size, 15px);
        height: var(--thumb-size, 15px);
        border-radius: 50%;
        box-shadow: ${SHADOW2};
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
      #previewPanel {
        width: 40px;
        height: 40px;
        background: pink;
        border-radius: 50%;
      }
      #huePanel {
        width: 40px;
        position: relative;
      }
      #hue {
        transform: translate3d(20px, 0,0) translate3d(-50%, 0,0) rotate(-90deg);
        width: 234px;
      }
    </style>
    <div id="grid">
      <div id="base">
        <div id="base1"></div>
        <div id="base2"></div>
        <div id="thumb"></div>
      </div>
      <div id="huePanel">
        <div id="hue"></div>
      </div>
      <div id="alphaPanel">
        <div id="alpha"></div>
      </div>
      <div id="previewPanel"></div>
    </div>
    `;
  }

  connectedCallback() {
    const base = this.$('base2');
    this.rc = new RectangleController(base, [0.5, 0.5]);
    this.$add(base, 'p-input', this.onSLChange);

    const huePanel = this.$('hue');
    this.hueC = new GradientController(huePanel, 'h');
    this.$add(huePanel, 'range-change', this.onHueChange);

    const alphaPanel = this.$('alpha');
    this.alphaC = new AlphaController(alphaPanel);
    this.$add(alphaPanel, 'range-change', this.onAlphaChange);
  }

  disconnectedCallback() {
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
      this.$remove(base, 'p-input', this.onSLChange);
      this.$remove('huePanel', 'range-change', this.onHueChange);
      this.$remove('alphaPanel', 'range-change', this.onAlphaChange);
    }
    super.disconnectedCallback();
  }

  private onSLChange = () => {

  }

  private onHueChange = () => {

  }

  private onAlphaChange = () => {

  }

}
customElements.define('lucid-color-picker', LucidColorPicker);