import { BaseElementController } from './base-element';
import { RANGE_STYLE } from './common';

export class HueController extends BaseElementController {
  constructor(e: HTMLElement) {
    super(e);
    this.root.innerHTML = `
    <style>
      ${RANGE_STYLE}
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
        background-image: linear-gradient(to right, hsl(0, 97%, 59%), hsl(60, 97%, 59%), hsl(120, 97%, 59%), hsl(180, 97%, 59%), hsl(240, 97%, 59%), hsl(300, 97%, 59%), hsl(0, 97%, 59%));
      }
    </style>
    <div id="container">
      <div id="gradient"></div>
      <input id="range" type="range" min="0" max="360" value="0">
    </div>
    `;
    this.attach();
    this.updateThumbColor();
  }

  attach() {
    this.$('range').addEventListener('input', this.handleInput);
  }

  detach() {
    this.$('range').removeEventListener('input', this.handleInput);
    super.detach();
  }

  private handleInput = (event: Event) => {
    event.stopPropagation();
    const value = +this.$<HTMLInputElement>('range').value;
    this.updateThumbColor();
    this.fire('range-change', { value });
  }

  private updateThumbColor() {
    const range = this.$<HTMLInputElement>('range');
    if (range) {
      const value = +range.value;
      if (value < 0) {
        this.e.style.setProperty('--thumb-color', '#fff');
      } else if (value > 360) {
        this.e.style.setProperty('--thumb-color', '#000');
      } else {
        this.e.style.setProperty('--thumb-color', `hsl(${value}, 100%, 50%)`);
      }
    }
  }

  get value(): number {
    const range = this.$<HTMLInputElement>('range');
    if (range) {
      return +range.value;
    }
    return 0;
  }

  set value(v: number) {
    const range = this.$<HTMLInputElement>('range');
    const cv = this.value;
    if (range && (cv !== v)) {
      if (v < 0) {
        range.value = '0';
      } else if (v > 360) {
        range.value = '360';
      } else {
        range.value = `${v}`;
      }
      this.updateThumbColor();
    }
  }
}