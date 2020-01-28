// import globals from 'rollup-plugin-node-globals';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import pkg from './package.json';

const includePackages = {
  'lodash.isdate': 'isDate',
  'debug': 'debug'
}

export default [
  // browser-friendly UMD build
  {
    input: './index.js',
    output: {
      name: 'schemaAnalyzer',
      file: pkg.browser,
      format: 'umd',
      globals: includePackages
    },
    // external: [/lodash.*/, 'debug'],
    plugins: [
      // globals({} ),
      resolve({
        // pass custom options to the resolve plugin
        customResolveOptions: {
          moduleDirectory: 'node_modules'
        },
        browser: true
      }), // so Rollup can find `ms`
      commonjs()
    ]
  },

  // CommonJS (for Node) and ES module (for bundlers) build.
  // (We could have three entries in the configuration array
  // instead of two, but it's quicker to generate multiple
  // builds from a single configuration where possible, using
  // an array for the `output` option, where we can specify
  // `file` and `format` for each target)
  {
    input: './index.js',
    external: [],
    output: [
      { file: pkg.main, format: 'cjs', globals: includePackages },
      { file: pkg.module, format: 'es', globals: includePackages }
    ]
  }
];