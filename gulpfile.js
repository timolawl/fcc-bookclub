'use strict';

// Reason for returning gulp.src:
// http://stackoverflow.com/questions/21699146/gulp-js-task-return-on-src

const browserSync = require('browser-sync').create();

const gulp = require('gulp');
const gutil = require('gulp-util');
// const gulpif = require('gulp-if');

const nodemon = require('gulp-nodemon');

const sass = require('gulp-sass');
const plumber = require('gulp-plumber');
const autoprefixer = require('gulp-autoprefixer');
const cssmin = require('gulp-cssmin');

const uglify = require('gulp-uglify');
const sourcemaps = require('gulp-sourcemaps');
const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');
const browserify = require('browserify');
const babelify = require('babelify');
const es = require('event-stream');
const rename = require('gulp-rename');

const imagemin = require('gulp-imagemin');


// var production = process.env.NODE_ENV === 'production';

gulp.task('refreshers', ['watch'], () => {
  var stream = nodemon({
    script: 'app.js',
    ext: 'html pug js',
    env: { 'NODE_ENV': 'development' }
  });

  stream
    .on('start', () => {
      console.log('Nodemon started!');
      browserSync.reload();
    })
    .on('restart', () => {
      console.log('Nodemon restarted!');
      browserSync.reload();
    })
    .on('crash', () => {
      console.error('Nodemon crashed!');
      stream.emit('restart', 10); // restart the server in 10 seconds
    });

  browserSync.init({
    proxy: {
      target: 'localhost:5000',
      ws: true // websockets
    }, // heroku local -> gulp watch -> localhost:3000
    ghostMode: true, // sync across all browsers
    reloadDelay: 2000,
    port: 3000 // the port that browserSync uses
  });
});

gulp.task('sass', () => {
    return gulp.src('./app/client/stylesheets/*.scss')
        .pipe(plumber())
        .pipe(sass())
        .pipe(autoprefixer())
    //    .pipe(gulpif(production, cssmin()))
        .pipe(cssmin())
        .pipe(gulp.dest('./static/css/'))
        .pipe(browserSync.reload({
            stream: true
        }));
});
/*
gulp.task('script', () => {
    return browserify('./app/client/scripts/script.js', { debug: true })
        .transform(babelify.configure({ presets: ['es2015'] }))
        .bundle()
        .on('error', gutil.log.bind(gutil, 'Browserify error.'))
        .pipe(source('bundle.js'))
        .pipe(buffer())
        .pipe(sourcemaps.init({ loadMaps: true }))
        .pipe(uglify({ mangle: false })) // why does it work now without compress?
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('static/js'));
});
*/

gulp.task('script', () => {
    // define input files to be bundled
    const files = [
        './pre.js', // why can't it just be '/'?
        './post.js' // same here
    ];

    // map to stream function
    const tasks = files.map(entry => {
        return browserify({ entries: [entry], basedir: './app/client/scripts', debug: true })
            .transform(babelify.configure({ presets: ['es2015'] }))
            .bundle()
            .on('error', gutil.log.bind(gutil, 'Browserify error.'))
            .pipe(source(entry))
            .pipe(rename({
                extname: '.bundle.js'
            }))
            .pipe(buffer())
            .pipe(sourcemaps.init({ loadMaps: true }))
            .pipe(uglify({ mangle: false }))
            .pipe(sourcemaps.write('.'))
            .pipe(gulp.dest('./static/js')) // why can't it just be '/'?
            .pipe(browserSync.reload({
                stream: true
            }));
    });

    // create a merged stream
    return es.merge.apply(null, tasks);
});

gulp.task('image', () => {
    return gulp.src('./app/client/images/**/*.+(png|jpg|gif|svg)')
        .pipe(imagemin())
        .pipe(gulp.dest('./static/img'));
});

gulp.task('watch', ['build'], () => {
    gulp.watch('./app/client/stylesheets/*.scss', ['sass']); // why can't it be '/'?
    gulp.watch('./app/client/scripts/*.js', ['script']); // will reload twice (if not directly modifying the pre and post js files. Once for the module file, and then again since the changes propagating to the pre/post will trigger the task again).
  //  gulp.watch('public/*.html', browserSync.reload);
  //  gulp.watch('public/js/**/*.js', browserSync.reload);
  //    gulp.watch('*', browserSync.reload);
});

gulp.task('build', ['sass', 'script']);
gulp.task('default', ['refreshers']);
