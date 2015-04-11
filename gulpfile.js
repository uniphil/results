var gulp = require('gulp');
var del = require('del');
var merge = require('merge2');
var babel = require('gulp-babel');
var mocha = require('gulp-mocha');
var rename = require('gulp-rename');
var typedoc = require('gulp-typedoc');
var ghPages = require('gulp-gh-pages');
var vinylPaths = require('vinyl-paths');
var typescript = require('gulp-typescript');


var tsProject = typescript.createProject({
  declarationFiles: true,
  module: 'commonjs',
  target: 'es5',
});


gulp.task('clean', function(cb) {
  del([
    './index.js',
    './docs/',
  ], cb);
});


gulp.task('typescript', ['clean'], function() {
  var tsResult = gulp.src('index.ts')
    .pipe(typescript(tsProject));

  return merge([
    tsResult.dts.pipe(gulp.dest('./')),
    tsResult.js.pipe(gulp.dest('./')),
  ]);
});


gulp.task('watch', ['typescript'], function() {
  gulp.watch('index.ts', ['typescript']);
});


gulp.task('watchtest', ['test'], function() {
  gulp.watch(['index.ts', 'test.js'], ['test']);
});


gulp.task('test', ['typescript'], function() {
  return gulp.src('test.js')
    .pipe(babel())
    .pipe(rename('test.es5.js'))
    .pipe(gulp.dest('.'))
    .pipe(mocha())
    .pipe(vinylPaths(del));
});


gulp.task('docs', function() {
  return gulp.src('index.ts')
    .pipe(typedoc({
      module: 'commonjs',
      name: 'Results',
      out: 'docs/',
      target: 'es5',
      theme: 'minimal',
    }));
});


gulp.task('push-docs', ['docs'], function() {
  var fs = require('fs');
  var pkg = JSON.parse(fs.readFileSync('package.json'));
  var message = 'Generate docs for ' + pkg.version + ' on ' + new Date().toDateString();
  return gulp.src('docs/**/*')
    .pipe(ghPages({message: message}));
});
