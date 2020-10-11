import { terser } from "rollup-plugin-terser";
import filesize from 'rollup-plugin-filesize';

const INPUTS = [
  'dino-color-picker',
  'corel-color-picker',
  'slider-color-picker',
  'disk-color-picker',
  'shop-color-picker',
  'atom-color-picker',
  'lucid-color-picker'
];

export default INPUTS.map((input) => {
  return {
    input: `./bin/${input}.js`,
    output: {
      file: `./packages/${input}/${input}.js`,
      format: 'esm'
    },
    plugins: [
      terser(),
      filesize({
        showMinifiedSize: false,
        showBeforeSizes: 'build'
      })
    ]
  }
});