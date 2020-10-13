const { create } = require('domain');

const fs = require('fs').promises;

const INPUTS = [
  { name: 'dino-color-picker', cl: 'DinoColorPicker', v: '0.1.1' },
  { name: 'corel-color-picker', cl: 'CorelColorPicker', v: '0.1.0' },
  { name: 'slider-color-picker', cl: 'SliderColorPicker', v: '0.1.0' },
  { name: 'disk-color-picker', cl: 'DiskColorPicker', v: '0.1.0' },
  { name: 'shop-color-picker', cl: 'ShopColorPicker', v: '0.1.0' },
  { name: 'atom-color-picker', cl: 'AtomColorPicker', v: '0.1.0' },
  { name: 'lucid-color-picker', cl: 'LucidColorPicker', v: '0.1.0' }
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

async function createReadmes() {
  for (const item of INPUTS) {
    const template = `![Logo](https://everycolorpicker.com/images/social.png)

# every-color-picker
    
This is a collection of color picker custom-elements that can be used in any web application. You can use them on a plain HTML page or when using a JavaScript framework.
    
Visit the website for demo and documentation: **[everycolorpicker.com](https://everycolorpicker.com/)**
    `;
    const filename = `./packages/${item.name}/README.md`;
    console.log(`Writing '${filename}'...`);
    await fs.writeFile(filename, template, { encoding: 'utf-8' });
  }
}

createPackages();
createTypeDefs();
createReadmes();