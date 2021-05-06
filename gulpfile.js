const gulp = require('gulp');
const sass = require('gulp-sass');
const ts = require('gulp-typescript');
const browserify = require('browserify');
const webserver = require('gulp-webserver');
const exec = require('gulp-exec');
const uglify = require('gulp-uglify');
const pump = require('pump');
const babel = require('gulp-babel');
const sourcemaps = require('gulp-sourcemaps');
const cleanCSS = require('gulp-clean-css');
const mocha = require('gulp-mocha');
const notify = require('gulp-notify');
const webpack = require('webpack-stream');

const frontendTSProject = ts.createProject('src/web/tsconfig.json', {
  declaration: false,
  jsx: 'react'
});

// Polyfill gulp@3.0 API if gulp version >=4
if (gulp.parallel) {
  let gulpV4Task = gulp.task.bind(gulp);
  let gulpV4Watch = gulp.watch.bind(gulp);
  gulp.task = (a, b, c) => {
    if (!c) {
      gulpV4Task(a, b);
    } else {
      gulpV4Task(a, gulp.parallel(b, c));
    }
  };
  gulp.watch = (a, b) => {
    for (var i = 0; i < b.length; i++) {
      gulpV4Watch(a, gulp.series(b[i]));
    }
  };
}

gulp.task('cleancss', function () {
  return gulp.src('public/css/**/*.css')
    .pipe(cleanCSS())
    .pipe(gulp.dest('public/css/'));
});

gulp.task('frontendSrc', async function () {
  await new Promise((resolve) => {
    gulp.src(['src/web/**/*.ts', 'src/web/**/*.tsx',])
      .pipe(frontendTSProject())
      .pipe(gulp.dest('./public/js/dist'))
      .on('end', resolve);
  });
  return new Promise((resolve) => {
    gulp.src('./public/js/dist')
      .pipe(webpack(require('./webpack.config.js')))
      .pipe(gulp.dest('./public/js/dist'))
      .on('end', resolve);
  });
});

// gulp.task('webpack', ['frontendSrc'], () => {
//   return gulp.src('./public/js/dist')
//     .pipe(webpack(require('./webpack.config.js')))
//     .pipe(gulp.dest('./public/js/dist'));
// });

// TODO: Fix browserify
gulp.task('runBrowserify', function () {
  // Single entry point to browserify
  var entry = browserify({
    entries: ['public/main.js'],
    global: true,
    debug: true
  });

  return entry.bundle()
    .pipe(gulp.dest('./build/public/bundle'))
    .pipe(notify('Frontend finished.'));
});

gulp.task('frontend', ['frontendSrc'], (cb) => cb());

gulp.task('babel', function () {
  return gulp.src(['public/js/**/*.js*', '!public/js/require.js', '!public/js/main.js', '!public/js/plugins/**/*.js', '!public/js/lib/**/*.js', '!public/js/helpers/CircularGridHelper.js', '!**/*.json'])
    .pipe(babel({
      presets: [
        ['@babel/preset-env', { 'targets': { 'electron': '8.5.5' } }],
        '@babel/preset-react',
      ],
    }))
    .pipe(gulp.dest('public/js'));
});

gulp.task('sass', function () {
  return gulp.src('./public/sass/**/*.scss')
    .pipe(sass({
      indentWidth: 4
    }).on('error', sass.logError))
    .pipe(gulp.dest('./public/css/'));
});

gulp.task('deployment', ['babel', 'cleancss'], function (cb) {
  return pump([
    gulp.src(['public/js/**/*.js', '!public/js/require.js', '!public/js/main.js']),
    sourcemaps.init(),
    uglify(),
    sourcemaps.write(),
    gulp.dest('public/js/')
  ],
    cb
  );
});

gulp.task('sass:watch', function () {
  return gulp.watch('./public/sass/**/*.scss', ['sass']);
});

gulp.task('ts:watch', function () {
  return gulp.watch(['./src/**/*.ts', './src/**/*.tsx', './src/web/tsconfig.json'], ['frontend']);
});

gulp.task('webserver', ['sass:watch'], function () {
  return gulp.src('public')
    .pipe(webserver({
      livereload: true,
      open: false,
      host: '0.0.0.0',
      port: 8111
    }));
});

gulp.task('dev', ['sass:watch', 'frontend', 'sass', 'ts:watch', 'webserver'], () => {
  return new Promise(() => { });
});

gulp.task('unit-test', function () {
  return gulp.
    src('./_test/unit/**/*.js', { read: false }).
    pipe(mocha({
      require: [
        process.cwd() + '/_test/unit/bootstrap.js'
      ]
    })).
    once('error', function () {
      process.exit(1);    // bad happens
    }).
    once('end', function () {
      process.exit(); // good
    });
});

gulp.task('api-test', function () {
  return gulp.
    src('./_test/api/**/*.js').
    pipe(exec('node <%= file.path %>')).
    pipe(exec.reporter());
});
