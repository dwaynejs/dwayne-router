const path = require('path');
const npm = require('rollup-plugin-node-resolve');
const eslint = require('rollup-plugin-eslint');
const babel = require('rollup-plugin-babel');
const inject = require('rollup-plugin-inject');

module.exports = {
  entry: './src/index.js',
  dest: './lib/index.js',
  format: 'cjs',
  external: [
    'dwayne'
  ],
  plugins: [
    npm({
      browser: true,
      preferBuiltins: false
    }),
    eslint({
      throwError: true
    }),
    babel(),
    inject({
      exclude: './src/constants/global.js',
      modules: {
        global: path.resolve('./src/global.js')
      }
    })
  ]
};
