// node
var path = require("path");

// npm
var gulp = require("gulp");
var sequence = require("gulp-sequence");
var sass = require("gulp-sass");
var sourcemaps = require("gulp-sourcemaps");
var replace = require("gulp-replace-task");
var concat = require("gulp-concat");
var browserify = require("browserify");
var source = require("vinyl-source-stream");
var del = require("del");
var exorcist = require("exorcist");
var templateCache = require("gulp-angular-templatecache");


var currentTime = new Date().getTime();

var distPath = "./dist";

var fontsDir = "fonts";
var stylesDir = "styles";

var stylesBundle = "main_" + currentTime + ".css";
var clientBundle = "client_" + currentTime + ".js";
var viewsBundle = "views_" + currentTime + ".js";
var libsBundle = "libs_" + currentTime + ".js";

gulp.task("default", sequence("clean:dist", ["build:index", "build:styles", "build:libs", "build:client", "copy:fonts", "build:views"]));

gulp.task("clean:dist", function () {
	return del(path.join(distPath, "**"));
});

gulp.task("build:index", function() {
    return gulp.src("./index.html")
    .pipe(replace({
        patterns: [
            {
                match: "styles-path",
                replacement: path.join(stylesDir, stylesBundle)
            },
            {
                match: "client-path",
                replacement: clientBundle
            },
            {
                match: "views-path",
                replacement: viewsBundle
            },
            {
                match: "libs-path",
                replacement: libsBundle
            }
        ]
    }))
    .pipe(gulp.dest(distPath));
});

gulp.task("copy:fonts", function() {
    return gulp.src("./bower_components/font-awesome/fonts/*")
    	.pipe(gulp.dest(path.join(distPath, fontsDir)));
});

gulp.task("build:styles", function() {
	var options = {
		outputStyle: "compressed"
	};

	return gulp.src([
			"./bower_components/bootstrap/dist/css/bootstrap.css",
			"./bower_components/font-awesome/css/font-awesome.css",
			"./assets/styles/*.scss"
		])
		.pipe(sourcemaps.init())
		.pipe(sass(options).on("error", sass.logError))
		.pipe(concat(stylesBundle))
		.pipe(sourcemaps.write("/"))
		.pipe(gulp.dest(path.join(distPath, stylesDir)));
});

gulp.task("build:client", function() {
	var options = {
		debug: true // Includes sourcemaps
	};

	return browserify("./client/app.js", options)
	    .bundle()
	    .pipe(exorcist(path.join(distPath, clientBundle) + ".map"))
	    .pipe(source(clientBundle))
	    .pipe(gulp.dest(distPath));
});

gulp.task("build:libs", function() {
	return gulp.src([
			"./bower_components/angular/angular.js",
			"./bower_components/angular-route/angular-route.js"
		])
		.pipe(sourcemaps.init())
		.pipe(concat(libsBundle))
		.pipe(sourcemaps.write("/"))
		.pipe(gulp.dest(distPath));
});

gulp.task("build:views", function() {
	var options = {
		standalone: true
	};

	return gulp.src("./client/**/*.html")
		.pipe(templateCache(viewsBundle, options))
		.pipe(gulp.dest(distPath));
});