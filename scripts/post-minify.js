const $fs = require('fs').promises;
const $path = require('path');

const root = $path.join(__dirname, '../');
const bundlePath = $path.join(root, './dist/bundle');

Promise.all([
    $fs.unlink($path.join(bundlePath, './public.core.umd.esnext.pre-min.js')),
    $fs.unlink( $path.join(bundlePath, './public.umd.esnext.pre-min.js')),
]).then(() => {
    console.log('done');
});

