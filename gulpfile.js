const gulp = require('gulp');
const gulpPlugins = require('gulp-load-plugins')();
const $path = require('path');
const gutil = require('gulp-util');
const $resolve = require('rollup-plugin-node-resolve');

// console.log(gulpPlugins);

// const tsProjects = {
//   'esnext': gulpPlugins.typescript.createProject('tsconfig.json', {
//     module: 'commonjs',
//     // module: 'es',
//     target: 'esnext',
//   }),
//   'es5': gulpPlugins.typescript.createProject('tsconfig.json', {
//     module: 'amd',
//     target: 'es5',
//   })
// };

const paths = {
  source: './src',
  destination: './dist'
};

paths.ts = [
  $path.join(paths.source, '**', '*.ts'),
  '!' + $path.join(paths.source, '**', 'old', '**', '*.ts'),
  '!' + $path.join(paths.source, '**', '*_*.ts'),
];

paths.others = [
  $path.join(paths.source, '**'),
  '!' + paths.ts[0]
];

paths.package = [
  '.npmignore',
  '.npmrc',
  'package.json',
  'README.md',
  'LICENSE',
];

const fileExt = 'js';


function compileTs(buildOptions) {
  const tsProject = gulpPlugins.typescript.createProject('tsconfig.json', buildOptions.ts);

  return function _compileTs() {
    return gulp.src(paths.ts, { base: paths.source })
      .pipe(gulpPlugins.cached('tsc'))
      .pipe(gulpPlugins.progeny())
      .pipe(gulpPlugins.debug({ title: 'tsc:' }))
      .pipe(gulpPlugins.sourcemaps.init())
      .pipe(tsProject())
      .on('error', gutil.log)
      .pipe(gulpPlugins.sourcemaps.write())
      // .pipe(gulpPlugins.extReplace('.mjs'))
      .pipe(gulp.dest($path.join(paths.destination)));
  };
}

function copyOtherFiles(buildOptions) {
  return function _copyOtherFiles() {
    return gulp.src(paths.others, { base: paths.source })
      .pipe(gulpPlugins.cached('others'))
      .pipe(gulp.dest($path.join(paths.destination)));
  };
}

function copyPackageFiles() {
  return gulp.src(paths.package, { allowEmpty: true })
    .pipe(gulpPlugins.cached('package'))
    .pipe(gulp.dest($path.join(paths.destination)));
}

function bundle(buildOptions) {
  const base = $path.join(paths.destination);
  const outputName = `${$path.basename(buildOptions.rollup.main, $path.extname(buildOptions.rollup.main))}.${buildOptions.rollup.outputPostFix || 'bundled'}.js`;

  return function _bundle() {
    return gulp.src([
      $path.join(base, '**', '*.' + fileExt),
    ], { base: base })
      .pipe(gulpPlugins.rollup({
        input: $path.join(paths.destination, buildOptions.rollup.main),
        allowRealFiles: true,
        output: {
          format: buildOptions.rollup.format || 'es',
          name: buildOptions.rollup.name,
          file: outputName
        },
        plugins: [
          $resolve({
            mainFields: ['jsnext:main', 'browser', 'module', 'main'],
          })
        ]
      }))
      .pipe(gulpPlugins.rename(outputName))
      .pipe(gulp.dest($path.join(paths.destination, 'bundle')));
  };
}


function build(buildOptions) {
  return gulp.parallel(compileTs(buildOptions), copyOtherFiles(buildOptions));
}

function buildAndBundle(buildOptions) {
  return gulp.series(build(buildOptions), bundle(buildOptions));
}

function watch() {
  gulp.watch(paths.source, buildAndBundle(config));
}

function buildProd() {
  return gulp.parallel(
    gulp.series(
      build({
        ts: {
          module: 'es6',
          target: 'esnext',
          declaration: true,
        }
      }),
      bundle({
        rollup: {
          main: 'public.' + fileExt,
          format: 'umd',
          name: 'Observables',
          outputPostFix: 'umd.esnext'
        }
      }),
      bundle({
        rollup: {
          main: 'core/public.' + fileExt,
          format: 'umd',
          name: 'Observables',
          outputPostFix: 'core.umd.esnext'
        }
      }),
      // bundle({
      //   rollup: {
      //     main: 'private.' + fileExt,
      //     format: 'umd',
      //     name: 'PrivateObservables',
      //     outputPostFix: 'umd.esnext'
      //   }
      // }),
    ),
    // buildAndBundle({
    //   ts: {
    //     module: 'es6',
    //     target: 'esnext',
    //     declaration: true,
    //   },
    //   rollup: {
    //     main: 'public.js',
    //     format: 'umd',
    //     name: 'Observables',
    //     outputPostFix: 'umd.esnext'
    //   }
    // }),
    copyPackageFiles
  );
}

const configs = {
  'esnext browser': {
    ts: {
      module: 'es6',
      target: 'esnext',
    },
    rollup: {
      main: 'app.' + fileExt,
      format: 'es',
    }
  }
};

const config = configs['esnext browser'];


gulp.task('build', build(config));
gulp.task('bundle', bundle(config));
gulp.task('watch', watch);

gulp.task('build.prod', buildProd());

