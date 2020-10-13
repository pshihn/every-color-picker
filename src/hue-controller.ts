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
        background-image: linear-gradient(to right, hsl(0, 100%, 50%), hsl(60, 100%, 50%), hsl(120, 100%, 50%), hsl(180, 100%, 50%), hsl(240, 100%, 50%), hsl(300, 100%, 50%), hsl(0, 100%, 50%));
        border: 1px solid #e5e5e5;
      }
    </style>
    <div id="container">
      <div id="gradient"></div>
      <input id="range" type="range" min="0" max="360" value="0" aria-label="Hue">
    </div>
    `;
    this.attach();
  }

  private attach() {
    this.$add('range', 'input', this.handleInput);
    this.updateThumb();
  }

  detach() {
    this.$remove('range', 'input', this.handleInput);
    super.detach();
  }

  get value(): number {
    const range = this.$<HTMLInputElement>('range');
    return range ? +range.value : 0;
  }

  set value(v: number) {
    const range = this.$<HTMLInputElement>('range');
    if (range) {
      range.value = `${Math.max(0, Math.min(360, v))}`;
      this.updateThumb();
    }
  }

  private handleInput = (event: Event) => {
    event.stopPropagation();
    const value = +this.$<HTMLInputElement>('range').value;
    this.updateThumb();
    this.fire('range', { value });
  }

  private updateThumb() {
    const range = this.$<HTMLInputElement>('range');
    if (range) {
      this.e.style.setProperty('--thumb-color', `hsl(${+range.value}, 100%, 50%)`);
    }
  }
}