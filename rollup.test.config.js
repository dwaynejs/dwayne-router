const path = require('path');
const builtins = require('rollup-plugin-node-builtins');
const npm = require('rollup-plugin-node-resolve');
const cjs = require('rollup-plugin-commonjs');
const eslint = require('rollup-plugin-eslint');
const babel = require('rollup-plugin-babel');
const inject = require('rollup-plugin-inject');

module.exports = {
  entry: './test/Router.js',
  dest: './test.js',
  format: 'iife',
  moduleName: 'Router',
  sourceMap: true,
  plugins: [
    builtins(),
    npm({
      browser: true,
      preferBuiltins: false
    }),
    cjs({
      include: 'node_modules/**',
      exclude: [
        'node_modules/rollup-plugin-node-builtins/**',
        'node_modules/buffer-es6/**',
        'node_modules/process-es6/**'
      ],
      namedExports: {
        'node_modules/assert/assert.js': [
          'deepEqual',
          'deepStrictEqual',
          'notDeepEqual',
          'notEqual',
          'strictEqual'
        ]
      }
    }),
    eslint({
      include: './**/*.js'
    }),
    babel({
      include: './**/*.js',
      exclude: 'node_modules/**'
    }),
    inject({
      exclude: './lib/constants/global.js',
      modules: {
        global: path.resolve('./lib/global.js')
      }
    })
  ]
};
