const { create } = require('domain');

const fs = require('fs').promises;

const INPUTS = [
  { name: 'dino-color-picker', cl: 'DinoColorPicker', v: '0.0.2' },
  { name: 'corel-color-picker', cl: 'CorelColorPicker', v: '0.0.2' },
  { name: 'slider-color-picker', cl: 'SliderColorPicker', v: '0.0.2' },
  { name: 'disk-color-picker', cl: 'DiskColorPicker', v: '0.0.2' },
  { name: 'shop-color-picker', cl: 'ShopColorPicker', v: '0.0.2' },
  { name: 'atom-color-picker', cl: 'AtomColorPicker', v: '0.0.2' },
  { name: 'lucid-color-picker', cl: 'LucidColorPicker', v: '0.0.2' }
];

async function createPackages() {
  for (const item of INPUTS) {
    const template = `{
  "name": "${item.name}",
  "version": "${item.v}",
  "description": "A color picker component",
  "main": "${item.name}.js",
  "module": "${item.name}.js",
  "types": "${item.name}.d.ts",
  "keywords": [
    "Color Picker",
    "ColorPicker",
    "WebComponent"
  ],
  "author": "Preet Shihn",
  "license": "MIT"
}`;
    const filename = `./packages/${item.name}/package.json`;
    console.log(`Writing '${filename}'...`);
    await fs.writeFile(filename, template, { encoding: 'utf-8' });
  }
}

async function createTypeDefs() {
  for (const item of INPUTS) {
    const template = `export declare type Color = [number, number, number, number];
export declare class ${item.cl} extends HTMLElement {
  constructor();
  get rgb(): Color;
  get hsl(): Color;
  get value(): string; // Hex value
  set value(value: string); // Accepts, hex, rgb, rgba, hsl, hsla
}`;
    const filename = `./packages/${item.name}/${item.name}.d.ts`;
    console.log(`Writing '${filename}'...`);
    await fs.writeFile(filename, template, { encoding: 'utf-8' });
  }
}

createPackages();
createTypeDefs();