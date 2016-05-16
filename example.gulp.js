var gulp = require("gulp");
var sequence = require("gulp-sequence").use(gulp);
var less = require("gulp-less");
var sourcemaps = require("gulp-sourcemaps");
var gulpif = require("gulp-if");
var concat = require("gulp-concat");
var cssNano = require("gulp-cssnano");
var replace = require("gulp-replace-task");
var gutil = require("gulp-util");
var bower = require("gulp-bower");

require("es6-promise").polyfill();

function lintPath(path) {
    var jshint = require("gulp-jshint");
    var stylish = require("jshint-stylish");

    return gulp.src(path)
        .pipe(jshint())
        .pipe(jshint.reporter(stylish));
}

function reportChange(event) {
    console.log("File " + event.path + " was " + event.type + ".");

    if (event.path.indexOf(".js", event.path.length - ".js".length) !== -1) {
        lintPath(event.path);
    }
}

// Process distribution path
var distPath = "dist";
function distWithPath(path, inverse) {
    var dist = "./" + distPath + path;
    if (inverse) {
        dist = "!" + dist;
    }
    return dist;
}

// Read in --dev parameter
var isProduction = true;
if (gutil.env.dev === true) {
    isProduction = false;
}

/*
    Build Tasks
*/
gulp.task("bower:install", function() {
  return bower();
});

gulp.task("build:mainjs", function(callback) {
    var durandal = require("gulp-durandal");

    durandal({
        verbose: false,
        baseDir: "Client",
        main: "launcher.js",
        output: "main.js",

        almond: true,
        minify: isProduction
    })
    .on("error", callback)
    .pipe(gulp.dest(isProduction ? "./dist" : "./"))
    .on("end", callback);
});

gulp.task("build:sln", function() {
    var msbuild = require("gulp-msbuild");

    return gulp
    .src("../../Xenon.sln")
    .pipe(msbuild({
        toolsVersion: 14.0,
        targets: ["Clean", "Build"],
        errorOnFail: true,
        stdout: false,
        stderr: true,
        configuration: "release",
        maxBuffer: 1024 * 1024,
        properties: {
            "PublishProfile": "Local",
            "DeployOnBuild": "True"
        }
    }));
});

gulp.task("build:maincss", function() {
    return gulp
    .src(["./Content/Styles/xenon.less"])
    .pipe(sourcemaps.init())
    .pipe(less())
    .pipe(concat("main.css"))
    .pipe(gulpif(isProduction, cssNano()))
    .pipe(sourcemaps.write("/"))
    .pipe(gulp.dest(isProduction ? "./dist" : "./"));
});

gulp.task("build:libcss", function() {
    return gulp
    .src([
        "./bower_components/bootstrap/dist/css/bootstrap.css",
        "./bower_components/fullcalendar/dist/fullcalendar.css",
        "./bower_components/select2/dist/css/select2.css",
        "./bower_components/knockout-file-bindings/knockout-file-bindings.css",
        "./bower_components/gudatepicker/gudatepicker.css"])
    .pipe(sourcemaps.init())
    .pipe(less())
    .pipe(concat("lib.css"))
    .pipe(gulpif(isProduction, cssNano()))
    .pipe(sourcemaps.write("/"))
    .pipe(gulp.dest(isProduction ? "./dist" : "./"));
});

gulp.task("build:libjs", function() {
    var uglify = require("gulp-uglify");

    return gulp
    .src([
        "./bower_components/jquery/dist/jquery.js",
        "./bower_components/underscore/underscore.js",
        "./bower_components/knockout/dist/knockout.js",
        "./bower_components/moment/moment.js",
        "./bower_components/moment/locale/en-gb.js",
        "./bower_components/q/q.js",
        "./bower_components/bootstrap/dist/js/bootstrap.js",
        "./bower_components/fullcalendar/dist/fullcalendar.js",
        "./bower_components/fullcalendar/dist/lang/en-gb.js",
        "./bower_components/select2/dist/js/select2.full.js",
        "./bower_components/typeahead.js/dist/typeahead.bundle.js",
        "./bower_components/autosize/dist/autosize.js",
        "./bower_components/blockUI/jquery.blockUI.js",
        "./bower_components/knockout-file-bindings/knockout-file-bindings.js",
        "./bower_components/bowser/bowser.js",
        "./bower_components/amplify/lib/amplify.store.js",

        // Our packages
        "./bower_components/mrvalidate/mrvalidate.js",
        "./bower_components/guprogress/guprogress.js",
        "./bower_components/gutruncate/gutruncate.js",
        "./bower_components/guevents/guevents.js",
        "./bower_components/gudatepicker/gudatepicker.js",
        "./bower_components/gudatepicker/gudatepicker-ko.js",

        // This is our own custom build
        "./Scripts/jquery.hc-sticky.js",
        // Swapping this for CSS 
        "./Scripts/jquery.ui.shake.js",

        "./Scripts/BindingHandlers/*.js",
        "./Scripts/Extensions/*.js"
    ])
    .pipe(sourcemaps.init())
    .pipe(concat("lib.js"))
    .pipe(gulpif(isProduction, uglify()))
    .pipe(sourcemaps.write("/"))
    .pipe(gulp.dest(isProduction ? "./dist" : "./"));
});

gulp.task("build:staticjs", function() {
    return gulp
    .src([
        "./bower_components/mathjs/dist/math.js",
        "./bower_components/highcharts/highcharts.js"
    ])
    .pipe(replace({
        patterns: [
            {
                match: /#\s*sourceMappingURL=(.+?)\.map/igm,
                replacement: ""
            }
        ]
    }))
    .pipe(concat("static.js"))
    .pipe(gulp.dest(isProduction ? "./dist" : "./"));
});


/*
    Publish Tasks
*/
var cacheBust = new Date().getTime();

gulp.task("clean:sln", function(cb) {
    var del = require("del");
    del(["dist/**", "bin", "obj"], cb);
});

gulp.task("set:debugflag", function() {
    return gulp.src(distWithPath("/Client/config/settings.js"))
    .pipe(replace({
        patterns: [
            {
                match: /debug:\s*(true|false)/i,
                replacement: isProduction ? "debug: false" : "debug: true"
            }
        ]
    }))
	.pipe(gulp.dest(distWithPath("/Client/config")));
});

gulp.task("fix-mapfile-lib-css", function() {
    return gulp.src(distWithPath("/lib_" + cacheBust + ".css"))
    .pipe(replace({
        patterns: [
            {
                match: /sourceMappingURL=lib\.css\.map/i,
                replacement: function() {
                    return "sourceMappingURL=lib_" + cacheBust + ".css.map";
                }
            },
        ]
    }))
    .pipe(gulp.dest(distWithPath("/")));
});

gulp.task("fix-mapfile-lib-js", function() {
    return gulp.src(distWithPath("/lib_" + cacheBust + ".js"))
    .pipe(replace({
        patterns: [
            {
                match: /sourceMappingURL=lib\.js\.map/i,
                replacement: function() {
                    return "sourceMappingURL=lib_" + cacheBust + ".js.map";
                }
            },
        ]
    }))
    .pipe(gulp.dest(distWithPath("/")));
});

gulp.task("fix-mapfile-main-css", function() {
    return gulp.src(distWithPath("/main_" + cacheBust + ".css"))
    .pipe(replace({
        patterns: [
            {
                match: /sourceMappingURL=main\.css\.map/i,
                replacement: function() {
                    return "sourceMappingURL=main_" + cacheBust + ".css.map";
                }
            },
        ]
    }))
    .pipe(gulp.dest(distWithPath("/")));
});

gulp.task("fix-mapfile-main-js", function() {
    return gulp.src(distWithPath("/main_" + cacheBust + ".js"))
    .pipe(replace({
        patterns: [
            {
                match: /sourceMappingURL=main\.js\.map/i,
                replacement: function() {
                    return "sourceMappingURL=main_" + cacheBust + ".js.map";
                }
            },
            {
                match: /sourceMappingURL=launcher\.build\.js\.map/i,
                replacement: ""
            }
        ]
    }))
    .pipe(gulp.dest(distWithPath("/")));
});

gulp.task("cache-bust:xenon", function() {
    return gulp.src(distWithPath("/index.html"))
        .pipe(replace({
            patterns: [
                {
                    match: /src="main.js"/i,
                    replacement: function() {
                        return "src=\"main_" + cacheBust + ".js\"";
                    }
                },
                {
                    match: /src="lib.js"/i,
                    replacement: function() {
                        return "src=\"lib_" + cacheBust + ".js\"";
                    }
                },
                {
                    match: /src="static.js"/i,
                    replacement: function() {
                        return "src=\"static_" + cacheBust + ".js\"";
                    }
                },
                {
                    match: /href="main.css"/i,
                    replacement: function() {
                        return "href=\"main_" + cacheBust + ".css\"";
                    }
                },
                {
                    match: /href="lib.css"/i,
                    replacement: function() {
                        return "href=\"lib_" + cacheBust + ".css\"";
                    }
                }
            ],
            usePrefix: false
        }))
        .pipe(gulp.dest(distWithPath("/")));
});

gulp.task("cache-bust:files", function() {
    var rename = require("gulp-rename");

    return gulp.src([distWithPath("/main.*"), distWithPath("/lib.*"), distWithPath("/static.*")])
    .pipe(rename(function(path) {
        if (path.extname == ".map") {
            var otherExtension = "." + path.basename.split(".")[1];
            path.basename = path.basename.replace(otherExtension, "");
            path.basename += "_" + cacheBust + otherExtension;
        } else {
            path.basename += "_" + cacheBust;
        }
        return path;
    }))
    .pipe(gulp.dest("./dist"));
});

gulp.task("zip:xenon", function() {
    var zip = require("gulp-zip");

    return gulp
    .src([distWithPath("/**/*"),
        distWithPath("/main.*", true),
        distWithPath("/lib.*", true),
        distWithPath("/main_*.*"),
        distWithPath("/lib_*.*"),
        distWithPath("/static.*", true),
        distWithPath("/static_*.*"),
        distWithPath("/Client/**", true),
        distWithPath("/Client", true),
        distWithPath("/gulpfile.js", true),
        distWithPath("/packages.config", true),
        distWithPath("/package.json", true),
        distWithPath("/**/*.zip", true),
        distWithPath("/Scripts/**", true),
        distWithPath("/Scripts", true),
        distWithPath("/Scripts/durandal/**/*", true),
        distWithPath("/Scripts/Extensions/*", true),
        distWithPath("/Scripts/require/*", true),
        distWithPath("/Content/Styles/**", true),
        distWithPath("/Content/*", true),
        distWithPath("/Content/Images/*"),
        distWithPath("/Content/Font/*")])
    .pipe(zip("dist.zip"))
    .pipe(gulp.dest(distPath));
});

gulp.task("publish:local", sequence("clean:sln", "build:sln", "set:debugflag", "bower:install", ["build:libjs", "build:staticjs", "build:mainjs", "build:maincss", "build:libcss"], "cache-bust:xenon", "cache-bust:files", ["fix-mapfile-lib-css", "fix-mapfile-main-css", "fix-mapfile-lib-js", "fix-mapfile-main-js"]));
gulp.task("publish", sequence("publish:local", "zip:xenon"));

/*
    JSHint Tasks
*/
gulp.task("lint:all", function() {
    return lintPath("Client/**/*.js");
});

/*
    Watch Tasks
*/
gulp.task("watch:js", function(cb) {
    isProduction = false;
    return gulp.watch(["./Client/**/*.js"], ["build:mainjs"])
        .on("change", reportChange);
});
gulp.task("watch:html", function(cb) {
    isProduction = false;
    return gulp.watch(["./Client/**/*.html"], ["build:mainjs"])
        .on("change", reportChange);
});
gulp.task("watch:less", function(cb) {
    isProduction = false;
    return gulp.watch(["./Content/**/*.less"], ["build:maincss"])
        .on("change", reportChange);
});
gulp.task("watch:css", function(cb) {
    isProduction = false;
    return gulp.watch(["./Content/**/*.css"], ["build:libcss"])
        .on("change", reportChange);
});
gulp.task("watch:all", ["watch:js", "watch:html", "watch:less", "watch:css"]);

gulp.task("build:client", sequence("development:enable", "bower:install", ["build:libjs", "build:staticjs", "build:mainjs", "build:maincss", "build:libcss"]));

gulp.task("development:enable", function() {
    isProduction = false;
});

gulp.task("default", sequence("build:client", "watch:all"));