export const ALPHA_BG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAAAAABzHgM7AAAAF0lEQVR42mM4Awb/wYCBYg6EgghRzAEAWDWBGQVyKPMAAAAASUVORK5CYII=';

export const SHADOW2 = '0 2px 1px -1px rgba(0,0,0,.2), 0 1px 1px 0 rgba(0,0,0,.14), 0 1px 3px 0 rgba(0,0,0,.12)';
export const SHADOW3 = '0 3px 1px -2px rgba(0,0,0,.2), 0 2px 2px 0 rgba(0,0,0,.14), 0 1px 5px 0 rgba(0,0,0,.12)';

export const STYLES = `
* {box-sizing: border-box;}
.horizontal {display: flex; flex-direction: row;}
.vertical {display: flex; flex-direction: column;}
.center {align-items: center;}
.flex {flex: 1;}
`;

export const LABEL_STYLE = `label {display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; user-select: none;}`;

export const RANGE_STYLE = `
input[type=range] {
  width: 100%;
  box-sizing: border-box;
  margin: 0;
  -webkit-appearance: none;
  background: transparent;
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
  border-radius: 50px;
  background: var(--thumb-color, #ffffff);
  cursor: pointer;
  box-shadow: 0 0 4px -1px rgba(0,0,0,0.5);
  border: 2px solid #fff;
  margin: 0;
  height: 20px;
  width: 20px;
  transform: translateY(-5px);
}
input[type=range]::-webkit-slider-thumb {
  -webkit-appearance: none;
  border-radius: 50px;
  background: var(--thumb-color, #ffffff);
  cursor: pointer;
  box-shadow: 0 0 4px -1px rgba(0,0,0,0.5);
  border: 2px solid #fff;
  height: 22px;
  width: 22px;
  margin: 0;
  transform: translateY(-5px);
}
`;