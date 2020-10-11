const { create } = require('domain');

const fs = require('fs').promises;

const INPUTS = [
  'dino-color-picker',
  'corel-color-picker',
  'slider-color-picker',
  'disk-color-picker',
  'shop-color-picker',
  'atom-color-picker',
  'lucid-color-picker'
];

const VERSION = `0.0.1`;

async function createPackages() {
  for (const name of INPUTS) {
    const template = `{
  "name": "${name}",
  "version": "${VERSION}",
  "description": "A color picker component",
  "main": "${name}.js",
  "module": "${name}.js",
  "keywords": [
    "Color Picker",
    "ColorPicker",
    "WebComponent"
  ],
  "author": "Preet Shihn",
  "license": "MIT"
}`;
    const filename = `./packages/${name}/package.json`;
    console.log(`Writing '${filename}'...`);
    await fs.writeFile(`./packages/${name}/package.json`, template, { encoding: 'utf-8' });
    console.log('Done.');
  }
}

createPackages();