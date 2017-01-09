/**
 * @author : abhishek goswami
 * abhishekg785@gmail.com
 *
 * gulpfile.js : to automate the stuff :)
 */

var gulp = require('gulp');
var browserSync = require('browser-sync').create();

gulp.task('browserSync', function() {
    browserSync.init({
       server : {
           baseDir : 'myExperiments'
       }
    });
});

// running browserSync before any other activity
gulp.task('watch', ['browserSync'], function() {
    gulp.watch('myExperiments/*.html', browserSync.reload());
    gulp.watch('myExperiments/js/**/*.js', browserSync.reload);
});