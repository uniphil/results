var gulp = require('gulp');
var del = require('del');
var babel = require('gulp-babel');
var mocha = require('gulp-mocha');
var rename = require('gulp-rename');
var vinylPaths = require('vinyl-paths');


gulp.task('clean', function(cb) {
  del('./index.js', cb);
});


gulp.task('6to5', ['clean'], function() {
  return gulp.src('index.es6.js')
    .pipe(babel())
    .pipe(rename('index.js'))
    .pipe(gulp.dest('.'));
});


gulp.task('test', ['6to5'], function() {
  return gulp.src('test.js')
    .pipe(babel())
    .pipe(rename('test.es5.js'))
    .pipe(gulp.dest('.'))
    .pipe(mocha({reporter: 'nyan'}))
    .pipe(vinylPaths(del));
});

