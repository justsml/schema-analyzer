// import globals from 'rollup-plugin-node-globals';
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import { terser } from "rollup-plugin-terser";
import pkg from './package.json'

const includePackages = {
  'lodash.isdate': 'isDate',
  debug: 'debug'
}
const isProduction = process.env.NODE_ENV === 'production'
const extraPlugins = isProduction ? [terser()] : []
const fileExtension = isProduction ? `.min` : ``
const envOptions = isProduction ? {
  compact: true, // DEV MODE
  sourcemap: false
} : {
  compact: true, // PRODUCTION MODE
  sourcemap: 'inline'
}

export default [
  // browser-friendly UMD build
  {
    input: './index.js',
    output: {
      name: 'schemaAnalyzer',
      file: `${pkg.browser}`.replace(`.js`, `${fileExtension}.js`),
      format: 'umd',
      globals: includePackages,
      ...envOptions
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
    ].concat(...extraPlugins)
  },

  {
    input: './index.js',
    output: {
      name: 'schemaAnalyzer',
      file: `${pkg.main}`.replace(`.js`, `${fileExtension}.js`),
      format: 'cjs',
      globals: includePackages,
      ...envOptions
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
    ].concat(...extraPlugins)
  },

  {
    input: './index.js',
    output: {
      name: 'schemaAnalyzer',
      file: `${pkg.module}`.replace(`.js`, `${fileExtension}.js`),
      format: 'es',
      globals: includePackages,
      ...envOptions
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
    ].concat(...extraPlugins)
  }

  // CommonJS (for Node) and ES module (for bundlers) build.
  // (We could have three entries in the configuration array
  // instead of two, but it's quicker to generate multiple
  // builds from a single configuration where possible, using
  // an array for the `output` option, where we can specify
  // `file` and `format` for each target)
  // {
  //   input: './index.js',
  //   external: [],
  //   output: [
  //     {
  //       file: pkg.main, format: 'cjs', globals: includePackages,
  //       plugins: [
  //         // globals({} ),
  //         resolve({
  //           // pass custom options to the resolve plugin
  //           customResolveOptions: {
  //             moduleDirectory: 'node_modules'
  //           },
  //           browser: true
  //         }), // so Rollup can find `ms`
  //         commonjs()
  //       ]
  //     },
  //     {
  //       file: pkg.module, format: 'es', globals: includePackages,
  //       plugins: [
  //         // globals({} ),
  //         resolve({
  //           // pass custom options to the resolve plugin
  //           customResolveOptions: {
  //             moduleDirectory: 'node_modules'
  //           },
  //           browser: true
  //         }), // so Rollup can find `ms`
  //         commonjs()
  //       ]
  //     }
  //   ]
  // }
]
