var gulp = require('gulp');
var del = require('del');
var babel = require('gulp-babel');
var mocha = require('gulp-mocha');
var rename = require('gulp-rename');
var plumber = require('gulp-plumber');
var vinylPaths = require('vinyl-paths');


gulp.task('clean', function(cb) {
  return del([
    './index.js',
    './docs/',
  ]);
});


gulp.task('babel', ['clean'], function() {
  return gulp.src('index.es6')
    .pipe(babel())
    .pipe(rename('index.js'))
    .pipe(gulp.dest('.'));
});


gulp.task('watch', function() {
  gulp.watch('index.es6', ['babel', 'test-noexit']);
});


function test(noexit) {
  var path = gulp.src('test.js')
    .pipe(babel())
    .pipe(rename('test.es5.js'))
    .pipe(gulp.dest('.'));
  if (noexit) { path = path.pipe(plumber()); }
  path = path.pipe(mocha());
  return path
    .pipe(vinylPaths(del));
}

gulp.task('test', ['babel'], function() {
  return test(false);
});


gulp.task('test-noexit', ['babel'], function() {
  return test(true);
});
