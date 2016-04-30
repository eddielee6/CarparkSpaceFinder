var express = require("express");
var path = require("path");
var http = require("http");
var cache = require("memory-cache");

var cacheKey = "data";
var cacheExpiry = 60000; // 1min

var app = express();

app.use("/bower_components", express.static(getAbsolutePath("bower_components")));
app.use("/client", express.static(getAbsolutePath("client")));

app.get("/", function(req, res) {
    res.sendFile(getAbsolutePath("index.html"));
});

app.get("/api", function(req, res) {
    var cachedData = cache.get(cacheKey);

    if (cachedData) {
        serveJsonResponse(res, cachedData);
    } else {
        var address = "http://data.nottinghamtravelwise.org.uk/parking.json";
        getJson(address, function(response) {
            var carparks = response.Parking.Carpark;
            cache.put(cacheKey, carparks, cacheExpiry);
            serveJsonResponse(res, carparks);
        });
    }
});

app.listen(3000, function() {
    console.log("Running on port 3000");
});

function getAbsolutePath(relativePath) {
    return path.join(__dirname, relativePath);
}

function getJson(address, callback) {
    var url = require("url");

    var requestUrl = url.parse(address);

    http.get({
        host: requestUrl.host,
        path: requestUrl.path
    }, function(response) {
        var data = "";
        response.on("data", function(chunk) {
            data += chunk;
        });

        response.on("end", function() {
            callback(JSON.parse(data));
        });
    });
}

function serveJsonResponse(res, response) {
    var formattedJson = JSON.stringify(response, formatJson, 4);
    res.write(formattedJson);
    res.end();
}

// Replaces 'MyProperty' with 'myProperty'
function formatJson(key, value) {
    if (value && typeof value === 'object') {
        var replacement = Array.isArray(value) ? [] : {};
        for (var k in value) {
            if (Object.hasOwnProperty.call(value, k)) {
                replacement[k && k.charAt(0).toLowerCase() + k.substring(1)] = value[k];
            }
        }
        return replacement;
    }
    return value;
}