var gulp = require('gulp');
var gutil = require('gulp-util');

var ftp = require( 'vinyl-ftp' );
var creds = require( './creds');

// Build with `npm run build` (esbuild)
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
