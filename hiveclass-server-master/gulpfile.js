var gulp        = require('gulp');
var browserSync = require('browser-sync');

var watchedFiles = [];

var apps = ['login', 'student', 'teacher'];
var dirs = ['core', 'ui', 'assets', 'webrtc'];
for (var app in  apps) {
    for (var dir in  dirs) {
        watchedFiles.push(['apps', apps[app], dirs[dir], '**'].join('/'));
    }
}
watchedFiles.push('apps/login/common/**');

console.log("Watched files :")
console.log('\t', watchedFiles.join('\n\t '));

gulp.task('browser-sync', function() {
    browserSync({
        files: watchedFiles,
        port: 8080,
        proxy: {
            target: "localhost:8088/apps/teacher/",
            reqHeaders: function (config) {
                return {
                    "host":            'localhost:8080',
                    "accept-encoding": false
                }
            }
        }
    });
});