import { BaseElementController } from './base-element';
import { Color } from './colors';
import { RANGE_STYLE } from './common';

export type GradientMode = 'h' | 's' | 'l' | 'r' | 'g' | 'b';

export class GradientController extends BaseElementController {
  private _mode: GradientMode = 'h';
  private _c: Color = [0, 97, 59, 1];

  constructor(e: HTMLElement, mode: GradientMode) {
    super(e);
    this._mode = mode;
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
        background-image: var(--gc-gradient);
        border: 1px solid #e5e5e5;
      }
    </style>
    <div id="container">
      <div id="gradient"></div>
      <input id="range" type="range" min="0" max="360" value="0">
    </div>
    `;
    this.attach();
  }

  private attach() {
    this.$add('range', 'input', this.handleInput);
    this.setMode(this._mode, 0, true);
    this.updateThumb();
  }

  detach() {
    this.$remove('range', 'input', this.handleInput);
    super.detach();
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
      } else if (v > (+range.max)) {
        range.value = range.max;
      } else {
        range.value = `${v}`;
      }
      this.updateThumb();
    }
  }

  setMode(mode: GradientMode, value: number, forceRender?: boolean) {
    const range = this.$<HTMLInputElement>('range');
    if (forceRender || (this._mode !== mode)) {
      this._mode = mode;
      switch (mode) {
        case 'h':
          range.max = '360';
          break;
        case 's':
        case 'l':
          range.max = '100';
          break;
        case 'r':
        case 'g':
        case 'b':
          range.max = '255';
          break;
      }
      this.updateGradient();
    }
    this.value = value;
  }

  set color(value: Color) {
    this._c = [...value];
    this.updateGradient();
    this.updateThumb();
  }

  private updateGradient() {
    let gradient = '';
    switch (this._mode) {
      case 'h':
        gradient = `linear-gradient(to right, hsl(0, ${this._c[1]}%, ${this._c[2]}%), hsl(60, ${this._c[1]}%, ${this._c[2]}%), hsl(120, ${this._c[1]}%, ${this._c[2]}%), hsl(180, ${this._c[1]}%, ${this._c[2]}%), hsl(240, ${this._c[1]}%, ${this._c[2]}%), hsl(300, ${this._c[1]}%, ${this._c[2]}%), hsl(0, ${this._c[1]}%, ${this._c[2]}%))`;
        break;
      case 's':
        gradient = `linear-gradient(to right, hsl(${this._c[0]}, 0%, ${this._c[2]}%), hsl(${this._c[0]}, 100%, ${this._c[2]}%))`;
        break;
      case 'l':
        gradient = `linear-gradient(to right, hsl(0, 0%, 0%), hsl(0, 0%, 100%))`;
        break;
      case 'r':
        gradient = `linear-gradient(to right, rgb(0, ${this._c[1]}, ${this._c[2]}), rgb(255, ${this._c[1]}, ${this._c[2]}))`;
        break;
      case 'g':
        gradient = `linear-gradient(to right, rgb(${this._c[0]}, 0, ${this._c[2]}), rgb(${this._c[0]}, 255, ${this._c[2]}))`;
        break;
      case 'b':
        gradient = `linear-gradient(to right, rgb(${this._c[0]}, ${this._c[1]}, 0), rgb(${this._c[0]}, ${this._c[1]}, 255))`;
        break;
    }
    this.e.style.setProperty('--gc-gradient', gradient);
  }

  private handleInput = (event: Event) => {
    event.stopPropagation();
    const value = +this.$<HTMLInputElement>('range').value;
    this.updateThumb();
    this.fire('range-change', { value });
  }

  private updateThumb() {
    const range = this.$<HTMLInputElement>('range');
    if (range) {
      const value = +range.value;
      let color = '';
      switch (this._mode) {
        case 'h':
          color = `hsl(${value}, ${this._c[1]}%, ${this._c[2]}%)`;
          break;
        case 's':
          color = `hsl(${this._c[0]}, ${value}%, ${this._c[2]}%)`;
          break;
        case 'l':
          color = `hsl(0, 0%, ${value}%)`;
          break;
        case 'r':
          color = `rgb(${value}, ${this._c[1]}, ${this._c[2]})`;
          break;
        case 'g':
          color = `rgb(${this._c[0]}, ${value}, ${this._c[2]})`;
          break;
        case 'b':
          color = `rgb(${this._c[0]}, ${this._c[1]}, ${value})`;
          break;
      }
      this.e.style.setProperty('--thumb-color', color);
    }
  }
}