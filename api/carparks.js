var express = require("express");
var http = require("http");
var path = require("path");

var router = express.Router();

var cache = require("memory-cache");

var cacheKeys = {
    liveData: "live-data",
    staticData: "static-data"
};

router.get("/api/carparks/:id", function(req, res) {
    var carParkId = req.params.id;

    var carpark = {};

    getCachedLiveParkingData(function(liveCarparks) {
        var liveCarpark = liveCarparks.find(function(x) {
            return x.systemCodeNumber == carParkId;
        });

        if (!liveCarpark) {
            return res.sendStatus(404);
        }

        Object.assign(carpark, liveCarpark);

        getCachedStaticParkingData(function(staticCarparks) {
            var staticCarpark = staticCarparks.find(function(x) {
                return x.systemCodeNumber == carParkId;
            });

            Object.assign(carpark, staticCarpark);

            serveJsonResponse(res, carpark);
        });
    });
});

router.get("/api/carparks", function(req, res) {
    getCachedLiveParkingData(function(data) {
        var carparks = sortArray(data, "shortDescription");
        serveJsonResponse(res, carparks);
    });
});

router.get("/api/static_carparks", function(req, res) {
    getCachedStaticParkingData(function(data) {
        serveJsonResponse(res, data);
    });
});

function setCarparkStatus(carpark) {

    if (carpark.state == "Faulty") {
        carpark.status = "unknown";
    } else if (carpark.state == "Full") {
        carpark.status = "bad";
    } else if (carpark.occupancyPercentage <= 75) {
        carpark.status = "good";
    } else if (carpark.occupancyPercentage > 75 && carpark.occupancyPercentage < 95) {
        carpark.status = "ok";
    } else if (carpark.occupancyPercentage >= 95) {
        carpark.status = "bad";
    }

    return carpark;
}

function getCachedStaticParkingData(callback) {
    var cacheExpiry = 600000; // 10min
    fetchCachedData(cacheKeys.staticData, fetchStaticParkingData, cacheExpiry, callback);
}

function getCachedLiveParkingData(callback) {
    var cacheExpiry = 60000; // 1min
    fetchCachedData(cacheKeys.liveData, fetchLiveParkingData, cacheExpiry, callback);
}

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
        var carparks = data.parking.carpark.map(setCarparkStatus);
        return callback(carparks);
    });
}

function fetchStaticParkingData(callback) {
    var filePath = "./data/carparks.json";
    getLocalJson(filePath, function(data) {
        return callback(data);
    });
}

function sortArray(array, property) {
    array.sort(function(a, b) {
        if (a[property] < b[property]) return -1;
        if (a[property] > b[property]) return 1;
        return 0;
    });
    return array;
}

function getLocalJson(path, callback) {
    var fs = require("fs");

    fs.readFile(path, "utf8", function(err, data) {
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

function serveJsonResponse(res, response) {
    var formattedJson = JSON.stringify(response, formatKeysAsLowerCamelCase, 4);
    res.write(formattedJson);
    res.end();
}

function parseJson(stringValue) {
    if (!stringValue) {
        return {};
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

module.exports = router