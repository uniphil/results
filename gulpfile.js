var gulp = require('gulp');
var del = require('del');
var babel = require('gulp-babel');
var mocha = require('gulp-mocha');
var shell = require('gulp-shell');
var rename = require('gulp-rename');
var ghPages = require('gulp-gh-pages');
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
    .pipe(mocha())
    .pipe(vinylPaths(del));
});


gulp.task('docs', ['6to5'], function() {
  return gulp.src('index.js', {read: false})
    .pipe(shell(['jsdoc -d docs/ <%= file.path %>']));
});


gulp.task('push-docs', ['docs'], function() {
  var fs = require('fs');
  var pkg = JSON.parse(fs.readFileSync('package.json'));
  var message = 'Generate docs for ' + pkg.version + ' on ' + new Date().toDateString();
  return gulp.src('docs/**/*')
    .pipe(ghPages({message: message}));
});
