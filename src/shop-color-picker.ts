import { BaseElement } from './base-element.js';
import { Color, hslaString, hslString, hsvToHsl, hsvToRgb, rgbaToHex, rgbString, rgbToHsv, parseColor, hslToHsv } from './colors.js';
import { LABEL_STYLE, STYLES, SHADOW2, SHADOW3 } from './common.js';
import { GradientController, GradientMode } from './gradient-controller.js';
import { RectangleController } from './rectangle-controller.js';

const BGS = '--shop-base-gradient';

function createVertGradient(from: string, to: string): string {
  return `linear-gradient(to bottom, ${from} 0%, ${to} 100%)`;
}

function createHorizGradient(from: string, to: string): string {
  return `linear-gradient(to right, ${from} 0%, ${to} 100%)`;
}

function createSpectrum(saturation: number, brightness: number): string {
  const hsl = hsvToHsl([0, saturation, brightness, 1]);
  const sat = hsl[1];
  const lumin = hsl[2];
  return `linear-gradient(to right, hsl(0, ${sat}%, ${lumin}%), hsl(60, ${sat}%, ${lumin}%), hsl(120, ${sat}%, ${lumin}%), hsl(180, ${sat}%, ${lumin}%), hsl(240, ${sat}%, ${lumin}%), hsl(300, ${sat}%, ${lumin}%), hsl(0, ${sat}%, ${lumin}%))`;
}

export class ShopColorPicker extends BaseElement {
  private _hsv: Color = [0, 100, 100, 1];
  private _rgb: Color = [255, 0, 0, 1];
  private _hex = '#ff0000';
  private mode: GradientMode = 'h';
  private selectedInput?: HTMLInputElement;
  private _cm = false;

  private gc?: GradientController;
  private rc?: RectangleController;

  constructor() {
    super();
    this.root.innerHTML = `
    <style>
      ${STYLES}
      ${LABEL_STYLE}
      :host {
        display: inline-block;
        touch-action: none;
        background: #ffffff;
        box-shadow: ${SHADOW3};
        padding: 16px;
      }
      #base {
        position: relative;
        width: var(--shop-cp-size, 280px);
        height: var(--shop-cp-size, 280px);
        background: var(${BGS});
      }
      #base1,
      #base2 {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        border: none;
        background: var(${BGS});
      }
      #thumb {
        position: absolute;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        box-shadow: ${SHADOW2};
        background: transparent;
        border: 2px solid #ffffff;
        top: -10px;
        left: -10px;
        cursor: pointer;
      }
      #inputGrid {
        grid-gap: 6px;
        display: grid;
        grid-template-columns: auto auto 1fr;
        align-items: center;
        text-align: left;
      }
      input[type=text],
      input[type=number] {
        -moz-appearance:textfield;
        width: 60px;
        border-radius: 0;
        border: 1px solid #d8d8d8;
        outline: none;
        font-size: 11px;
        letter-spacing: 0.5px;
        padding: 6px 4px;
        font-family: inherit;
        display: block;
        margin: 0;
      }
      input::-webkit-outer-spin-button,
      input::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
      }
      input[type=text]:focus,
      input[type=number]:focus {
        border-color: var(--focus-ring-color, #000);
      }
      #preview {
        border: 1px solid #e5e5e5;
        margin-bottom: 16px;
      }
      #sliderPanel {
        padding: 0 18px 0 12px;
        width: 52px;
      }
      #slider {
        transform: translate3d(-129px,134px,0) rotate(-90deg);
        width: var(--shop-cp-size, 280px);
      }
      #container {
        display: flex;
        flex-direction: row;
      }

      #container.compact {
        flex-direction: column;
      }
      .compact #sliderPanel {
        padding: 18px 0;
        width: 100%;
      }
      .compact #slider {
        transform: none;
      }
      .compact #preview {
        display: none;
      }
      .compact #inputGrid {
        grid-template-columns: auto auto 1fr auto auto 1fr;
      }
    </style>
    <div id="container" class="compact">
      <div id="base">
        <div id="base1"></div>
        <div id="base2">
          <div id="thumb"></div>
        </div>
      </div>
      <div id="sliderPanel">
        <div id="slider"></div>
      </div>
      <div class="vertical">
        <div id="preview" class="flex"></div>
        <div id="inputGrid">
          <input title="Hue" type="radio" name="bartype" id="rH" checked  data-value="h">
          <label title="Hue" for="rH">H</label>
          <input title="Hue" id="inH" type="number">
          <input title="Saturation" type="radio" name="bartype" id="rS" data-value="s">
          <label title="Saturation" for="rS">S%</label>
          <input title="Saturation" id="inS" type="number">
          <input title="Brightness" type="radio" name="bartype" id="rV"  data-value="v">
          <label title="Brightness" for="rV">B%</label>
          <input title="Brightness" id="inV" type="number">
          <input title="Red" type="radio" name="bartype" id="rR"  data-value="r">
          <label title="Red" for="rR">R</label>
          <input title="Red" id="inR" type="number">
          <input title="Green" type="radio" name="bartype" id="rG"  data-value="g">
          <label title="Green" for="rG">G</label>
          <input title="Green" id="inG" type="number">
          <input title="Blue" type="radio" name="bartype" id="rB"  data-value="b">
          <label title="Blue" for="rB">B</label>
          <input title="Blue" id="inB" type="number">
          <span></span>
          <label title="Hex">#</label>
          <input title="Hex" id="inHex" type="text">
        </div>
      </div>
    </div>
    `;
  }

  connectedCallback() {
    this.refreshCompactMode();

    const base = this.$('base2');
    this.rc = new RectangleController(base, [0.5, 0.5]);
    this.$add(base, 'p-input', this.onPlanarInput);

    const slider = this.$('slider');
    this.gc = new GradientController(slider, this.mode);
    this.$add(slider, 'range', this.onGradientChange);

    const radios = this.root.querySelectorAll('input[type=radio]');
    radios.forEach((r) => r.addEventListener('change', (e) => {
      this.setSelection((e.target as HTMLInputElement).dataset.value as GradientMode);
    }));

    ['R', 'G', 'B'].forEach((d) => this.$add(`in${d}`, 'change', () => this.onRgbChange()));
    ['H', 'S', 'V'].forEach((d) => this.$add(`in${d}`, 'change', () => this.onHsvChange()));
    this.$add('inHex', 'change', () => this.onHexChange());

    this.setSelection('h', true);
  }

  disconnectedCallback() {
    if (this.rc) {
      this.rc.detach();
      this.rc = undefined;
    }
    if (this.gc) {
      this.gc.detach();
      this.gc = undefined;
    }
    super.disconnectedCallback();
  }

  private refreshCompactMode(): boolean {
    let ret = false;
    if (this.parentElement) {
      const { width } = this.parentElement.getBoundingClientRect();
      const cm = width < 480;
      if (cm !== this._cm) {
        this._cm = cm;
        ret = true;
      }
    }
    this.style.setProperty('--shop-cp-size', this._cm ? `240px` : '280px');
    if (this._cm) {
      this.$('container').classList.add('compact');
    } else {
      this.$('container').classList.remove('compact');
    }
    return ret;
  }

  private setSelection(type: GradientMode, forced = false) {
    if ((type !== this.mode) || forced) {
      this.mode = type;
      if (this.selectedInput) {
        this.selectedInput.checked = false;
      }
      this.selectedInput = this.$<HTMLInputElement>(`r${type.toUpperCase()}`);
      this.selectedInput.checked = true;

      if (this.gc) {
        this.gc.setMode(type, 0, forced);
      }

      this.updateColor(true);
    }
  }

  private renderCanvas() {
    const base = this.$('base');
    const base1 = this.$('base1');
    const base2 = this.$('base2');

    base.style.removeProperty(BGS);
    base2.style.removeProperty('mix-blend-mode');

    switch (this.mode) {
      case 'h': {
        base.style.setProperty(BGS, hslString([this._hsv[0], 100, 50, 1]));
        base1.style.setProperty(BGS, createHorizGradient('#fff', 'rgba(255, 255, 255, 0)'));
        base2.style.setProperty(BGS, createVertGradient('rgba(0,0,0,0)', 'rgba(0,0,0,1)'));
        break;
      }
      case 's': {
        base1.style.setProperty(BGS, createSpectrum(this._hsv[1], 100));
        base2.style.setProperty(BGS, createVertGradient('rgba(0,0,0,0)', 'rgba(0,0,0,1)'));
        break;
      }
      case 'v': {
        base1.style.setProperty(BGS, createSpectrum(100, this._hsv[2]));
        base2.style.setProperty(BGS, createVertGradient(
          hslaString(hsvToHsl([0, 100, this._hsv[2], 0])),
          hslaString(hsvToHsl([0, 0, this._hsv[2], 1]))
        ));
        break;
      }
      case 'r': {
        const red = this._rgb[0];
        base1.style.setProperty(BGS, createHorizGradient(`rgb(${red}, 0, 0)`, `rgb(${red}, 0, 255)`));
        base2.style.setProperty(BGS, createVertGradient(`rgb(${red}, 255, 0)`, `rgb(${red}, 0, 0)`));
        base2.style.setProperty('mix-blend-mode', 'lighten');
        break;
      }
      case 'g': {
        const green = this._rgb[1];
        base1.style.setProperty(BGS, createHorizGradient(`rgb(0, ${green}, 0)`, `rgb(0, ${green}, 255)`));
        base2.style.setProperty(BGS, createVertGradient(`rgb(255, ${green}, 0)`, `rgb(0, ${green}, 0)`));
        base2.style.setProperty('mix-blend-mode', 'lighten');
        break;
      }
      case 'b': {
        const blue = this._rgb[2];
        base1.style.setProperty(BGS, createHorizGradient(`rgb(0, 0, ${blue})`, `rgb(255, 0, ${blue})`));
        base2.style.setProperty(BGS, createVertGradient(`rgb(0, 255, ${blue})`, `rgb(0, 0, ${blue})`));
        base2.style.setProperty('mix-blend-mode', 'lighten');
        break;
      }
    }
  }

  private onRgbChange() {
    this._rgb[0] = +this.$<HTMLInputElement>('inR').value;
    this._rgb[1] = +this.$<HTMLInputElement>('inG').value;
    this._rgb[2] = +this.$<HTMLInputElement>('inB').value;
    this._hsv = rgbToHsv(this._rgb);
    this.updateColor(true);
    this._fire();
  }

  private onHsvChange() {
    this._hsv[0] = +this.$<HTMLInputElement>('inH').value;
    this._hsv[1] = +this.$<HTMLInputElement>('inS').value;
    this._hsv[2] = +this.$<HTMLInputElement>('inV').value;
    this._rgb = hsvToRgb(this._hsv);
    this.updateColor(true);
    this._fire();
  }

  private onHexChange() {
    this.value = this.$<HTMLInputElement>('inHex').value.trim();
    this._fire();
  }

  private onPlanarInput = () => {
    const [px, py] = this.rc!.position;
    let hsvChanged = false;
    switch (this.mode) {
      case 'h':
        this._hsv[1] = Math.max(0, Math.min(100, Math.round(px * 100)));
        this._hsv[2] = Math.max(0, Math.min(100, Math.round((1 - py) * 100)));
        hsvChanged = true;
        break;
      case 's':
        this._hsv[0] = Math.max(0, Math.min(360, Math.round(px * 360)));
        this._hsv[2] = Math.max(0, Math.min(100, Math.round((1 - py) * 100)));
        hsvChanged = true;
        break;
      case 'v':
        this._hsv[0] = Math.max(0, Math.min(360, Math.round(px * 360)));
        this._hsv[1] = Math.max(0, Math.min(100, Math.round((1 - py) * 100)));
        hsvChanged = true;
        break;
      case 'r':
        this._rgb[2] = Math.max(0, Math.min(255, Math.round(px * 255)));
        this._rgb[1] = Math.max(0, Math.min(255, Math.round((1 - py) * 255)));
        break;
      case 'g':
        this._rgb[2] = Math.max(0, Math.min(255, Math.round(px * 255)));
        this._rgb[0] = Math.max(0, Math.min(255, Math.round((1 - py) * 255)));
        break;
      case 'b':
        this._rgb[0] = Math.max(0, Math.min(255, Math.round(px * 255)));
        this._rgb[1] = Math.max(0, Math.min(255, Math.round((1 - py) * 255)));
        break;
    }
    if (hsvChanged) {
      this._rgb = hsvToRgb(this._hsv);
    } else {
      this._hsv = rgbToHsv(this._rgb);
    }
    this.updateColor(false);
    this._fire();
  }

  private onGradientChange = () => {
    if (this.gc) {
      const value = this.gc.value;
      let hsvChanged = false;
      switch (this.mode) {
        case 'h':
          this._hsv[0] = value;
          hsvChanged = true;
          break;
        case 's':
          this._hsv[1] = value;
          hsvChanged = true;
          break;
        case 'v':
          this._hsv[2] = value;
          hsvChanged = true;
          break;
        case 'r':
          this._rgb[0] = value;
          break;
        case 'g':
          this._rgb[1] = value;
          break;
        case 'b':
          this._rgb[2] = value;
          break;
      }
      if (hsvChanged) {
        this._rgb = hsvToRgb(this._hsv);
      } else {
        this._hsv = rgbToHsv(this._rgb);
      }
      this.updateColor(true);
      this._fire();
    }
  }

  private updateColor(renderCanvas: boolean) {
    this._hex = rgbaToHex(...this._rgb);

    // update slider position
    this.updateSliderPosition();

    // update plane position
    this.updatePlanePosition();

    // Update thumb position
    this.updateThumb();

    // update text inputs
    this.updateTextInputs();

    // update color preview
    this.$('preview').style.background = rgbString(this._rgb);

    // update slider gradient
    this.updateSliderGradient();

    // update canvas gradient
    if (renderCanvas) {
      this.renderCanvas();
    }
  }

  private updateTextInputs() {
    const [h, s, v] = this._hsv;
    const [r, g, b] = this._rgb;
    this.$<HTMLInputElement>('inH').value = `${h}`;
    this.$<HTMLInputElement>('inS').value = `${s}`;
    this.$<HTMLInputElement>('inV').value = `${v}`;
    this.$<HTMLInputElement>('inR').value = `${r}`;
    this.$<HTMLInputElement>('inG').value = `${g}`;
    this.$<HTMLInputElement>('inB').value = `${b}`;
    this.$<HTMLInputElement>('inHex').value = this._hex.substring(1);
  }

  private updateSliderGradient() {
    if (this.gc) {
      switch (this.mode) {
        case 'h':
        case 's':
        case 'v':
          this.gc.color = this._hsv;
          break;
        case 'r':
        case 'g':
        case 'b':
          this.gc.color = this._rgb;
          break;
      }
    }
  }

  private updateSliderPosition() {
    if (this.gc) {
      const [h, s, v] = this._hsv;
      const [r, g, b] = this._rgb;
      switch (this.mode) {
        case 'h':
          this.gc.value = h;
          break;
        case 's':
          this.gc.value = s;
          break;
        case 'v':
          this.gc.value = v;
          break;
        case 'r':
          this.gc.value = r;
          break;
        case 'g':
          this.gc.value = g;
          break;
        case 'b':
          this.gc.value = b;
          break;
      }
    }
  }

  private updatePlanePosition() {
    if (this.rc) {
      const [h, s, v] = this._hsv;
      const [r, g, b] = this._rgb;
      switch (this.mode) {
        case 'h':
          this.rc.position = [
            s / 100,
            1 - (v / 100)
          ];
          break;
        case 's':
          this.rc.position = [
            h / 360,
            1 - (v / 100)
          ];
          break;
        case 'v':
          this.rc.position = [
            h / 360,
            1 - (s / 100)
          ];
          break;
        case 'r':
          this.rc.position = [
            b / 255,
            1 - (g / 255)
          ];
          break;
        case 'g':
          this.rc.position = [
            b / 255,
            1 - (r / 255)
          ];
          break;
        case 'b':
          this.rc.position = [
            r / 255,
            1 - (g / 255)
          ];
          break;
      }
    }
  }

  private updateThumb() {
    const t = this.$('thumb');
    if (t && this.rc) {
      const p = this.rc.position;
      const size = this._cm ? 240 : 280;
      const [x, y] = [size * p[0], size * p[1]];
      t.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      t.style.background = this._hex;
    }
  }

  private _fire() {
    this.fire('change');
  }

  get rgb(): Color {
    return [...this._rgb];
  }

  get hsl(): Color {
    return hsvToHsl(this._hsv);
  }

  get hsb(): Color {
    return [...this._hsv];
  }

  get value(): string {
    return this._hex;
  }

  set value(value: string) {
    const colors = parseColor(value);
    if (colors) {
      this._rgb = [...colors.rgba];
      this._hsv = hslToHsv(colors.hsla);
      this._hex = colors.hex;
      this.updateColor(true);
    }
  }
}

customElements.define('shop-color-picker', ShopColorPicker);