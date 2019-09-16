const rollup = require('rollup');
const rollupAlias = require('rollup-plugin-alias');
const rollupInject = require('rollup-plugin-inject');
const rollupNodeResolve = require('rollup-plugin-node-resolve');

const $fs = require('fs').promises;
const tslib = require('tslib');
const $path = require('path');

function mapValues(input, mapper) {
  return Object.entries(input)
    .reduce( (result, [key, value]) => {
      result[key] = mapper(value, key, result);
      return result;
    }, {});
}

module.exports = function rollupBundle(options) {
  const dest = options.dest;
  const sourcemapFullFile = dest + '.map';

  rollup.rollup({
    input: options.input,
    plugins: [
      rollupAlias(options.aliases),
      rollupNodeResolve({
        mainFields: ['jsnext:main', 'browser', 'module', 'main'],
      }),
      rollupInject({
        exclude: 'node_modules/**',
        modules: mapValues(tslib, (value, key) => {
          return ['tslib', key];
        }),
      }),
    ],
  })
    .then((bundle) => {
      return bundle.generate({
        format: 'umd',
        name: 'observables',
        amd: {
          id: 'observables'
        },
        sourcemap: true,
      });
    })
    .then((result) => {
      const _result = result.output[0];
      // rollup doesn't add a sourceMappingURL
      // https://github.com/rollup/rollup/issues/121
      _result.code = _result.code + '\n//# sourceMappingURL=' + $path.basename(sourcemapFullFile);

      return Promise.all([
        $fs.writeFile(dest, _result.code),
        $fs.writeFile(sourcemapFullFile, _result.map.toString())
      ]);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
};
