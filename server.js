var express = require("express");
var path = require("path");
var http = require("http");
var cache = require("memory-cache");

var cacheKeys = {
    liveData: "live-data",
    staticData: "static-data"
};

var app = express();

var port = process.env.PORT || 8080;

app.use("/bower_components", express.static(getAbsolutePath("bower_components")));
app.use("/client", express.static(getAbsolutePath("client")));

app.get("/", function(req, res) {
    res.sendFile(getAbsolutePath("index.html"));
});

app.get("/api/live", function(req, res) {
    var cacheExpiry = 60000; // 1min
    fetchCachedData(cacheKeys.liveData, fetchLiveParkingData, cacheExpiry, function(data) {
        serveJsonResponse(res, data);
    });
});

app.get("/api/static", function(req, res) {
    var cacheExpiry = 600000; // 10min
    fetchCachedData(cacheKeys.staticData, fetchStaticParkingData, cacheExpiry, function(data) {
        serveJsonResponse(res, data);
    });
});

app.listen(port, function() {
    console.log("Running on port " + port);
});

function fetchCachedData(cacheKey, fetchFunc, cacheExpiry, callback) {
    var cachedData = cache.get(cacheKey);
    
    if (cachedData) {
        return callback(cachedData);
    } else {
        fetchFunc(function(data) {
            cache.put(cacheKey, data, cacheExpiry);
            return callback(data);
        })
    }
}

function fetchLiveParkingData(callback) {
    var address = "http://data.nottinghamtravelwise.org.uk/parking.json";
    getRemoteJson(address, function(data) {
        return callback(data.parking.carpark);
    });
}

function fetchStaticParkingData(callback) {
    var filePath = "data/carparks.json";
    getLocalJson(filePath, function(data) {
        return callback(data);
    });
}

function getLocalJson(relativePath, callback) {
    var fs = require("fs");
    
    var absolutePath = getAbsolutePath(relativePath);
    fs.readFile(absolutePath, "utf8", function(err, data) {
        if (err) {
            throw err;
        }
        
        var json = parseJson(data);
        return callback(json);
    });
}

function getRemoteJson(uri, callback) {
    var url = require("url");

    var requestUrl = url.parse(uri);

    http.get({
        host: requestUrl.host,
        path: requestUrl.path
    }, function(response) {
        var data = "";
        response.on("data", function(chunk) {
            data += chunk;
        });

        response.on("end", function() {
            var json = parseJson(data);
            callback(json);
        });
    });
}

function getAbsolutePath(relativePath) {
    return path.join(__dirname, relativePath);
}

function serveJsonResponse(res, response) {
    var formattedJson = JSON.stringify(response, formatKeysAsLowerCamelCase, 4);
    res.write(formattedJson);
    res.end();
}

function parseJson(stringValue) {
    if (!stringValue) {
        return { };
    }
    
    var parsedValue = JSON.parse(stringValue);
    var formattedValue = JSON.stringify(parsedValue, formatKeysAsLowerCamelCase);
    return JSON.parse(formattedValue);
}

function formatKeysAsLowerCamelCase(key, value) {
    // Return unchanged
    if (!value || typeof value !== 'object') {
        return value;
    }

    var replacement = Array.isArray(value) ? [] : {};
    for (var k in value) {
        if (Object.hasOwnProperty.call(value, k)) {
            replacement[k && k.charAt(0).toLowerCase() + k.substring(1)] = value[k];
        }
    }
    return replacement;
}