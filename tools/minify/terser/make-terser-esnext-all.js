const makeTerser = require('./make-terser');

makeTerser('dist/global/observables.esnext.umd.js', {
  compress: {
    inline: false
  },
});
