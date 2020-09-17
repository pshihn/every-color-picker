import { BaseElementController } from './base-element';
import { RANGE_STYLE, ALPHA_BG } from './common';

export class AlphaController extends BaseElementController {
  constructor(e: HTMLElement) {
    super(e);
    this.root.innerHTML = `
    <style>
      ${RANGE_STYLE}
      :host {
        --thumb-color: transparent;
      }
      #container {
        width: 100%;
        box-sizing: border-box;
        height: 12px;
        border-radius: 12px;
        position: relative;
        pointer-events: none;
      }
      #gradient {
        position: absolute;
        top: 0;
        bottom: 0;
        left: 0;
        right: 0;
        pointer-events: none;
        border-radius: 12px;
        background-image: linear-gradient(to right, hsla(var(--alpha-gradient-hue, 0),100%,50%,0), hsla(var(--alpha-gradient-hue, 0),100%,50%,1));
      }
      #checker {
        position: absolute;
        top: 0;
        bottom: 0;
        left: 0;
        right: 0;
        pointer-events: none;
        border-radius: 12px;
        background-image: url(${ALPHA_BG});
        background-size: 12px 11px;
      }
    </style>
    <div id="container">
      <div id="checker"></div>
      <div id="gradient" style=""></div>
      <input id="range" type="range" min="0" max="100" value="100">
    </div>
    `;
    this.attach();
  }

  attach() {
    this.$add('range', 'input', this.handleInput);
  }

  detach() {
    this.$remove('range', 'input', this.handleInput);
    super.detach();
  }

  set hue(value: number) {
    this.e.style.setProperty('--alpha-gradient-hue', `${value}`);
  }

  private handleInput = (event: Event) => {
    event.stopPropagation();
    this.fire('range-change', { value: this.value });
  }

  get value(): number {
    const range = this.$<HTMLInputElement>('range');
    if (range) {
      return (+range.value) / 100;
    }
    return 0;
  }

  set value(v: number) {
    const range = this.$<HTMLInputElement>('range');
    const cv = this.value;
    if (range && (cv !== v)) {
      if (v < 0) {
        range.value = '0';
      } else if (v > 1) {
        range.value = '100';
      } else {
        range.value = `${v * 100}`;
      }
    }
  }
}