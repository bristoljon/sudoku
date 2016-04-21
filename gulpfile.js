var gulp = require('gulp');
var gutil = require('gulp-util');
var source = require('vinyl-source-stream');
var browserify = require('browserify');
var watchify = require('watchify');
var babelify = require('babelify');

var ftp = require( 'vinyl-ftp' );
var creds = require( './creds');

gulp.task('default', function() {
  var bundler = watchify(browserify({
    entries: ['./script.js'],
    transform: [babelify],
    debug: true,
    cache: {},
    packageCache: {},
    fullPaths: true
  }));

  function build(file) {
    if (file) gutil.log('Recompiling ' + file);
    return bundler
      .bundle()
      .on('error', gutil.log.bind(gutil, 'Browserify Error'))
      .pipe(source('main.js'))
      .pipe(gulp.dest('./'));
  };
  build();
  bundler.on('update', build);
});

gulp.task( 'deploy', function () {

	var conn = ftp.create( {
		host:     'ftp.bristoljon.uk',
		user:     creds.user,
		password: creds.pass,
		parallel: 3,
		log:      gutil.log
	});

	var globs = [
		'main.js',
		'index.html',
		'styles.min.css'
	];

	return gulp.src( globs, { base: '.', buffer: false })
		.pipe( conn.newer( 'bristoljon.uk/public_html/projects/sudoku' ) )
		.pipe( conn.dest( 'bristoljon.uk/public_html/projects/sudoku' ) )

});
