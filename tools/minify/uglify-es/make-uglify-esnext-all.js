const makeUglify = require('./make-uglify');

makeUglify('dist/global/observables.esnext.umd.js', {
  compress: {
    inline: false
  },
});
