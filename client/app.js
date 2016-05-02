var carParkApp = angular.module("CarparkSpaceFinder", []);

carParkApp.controller("CarparkController", function($http) {
    var exports = this;
    
    this.carparks = [];
    
    function _mapCarpark(carpark) {
        
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
    
    function _fetchCarparks() {
        return $http.get("/api/carparks")
        .then(function(response) {
            exports.carparks = _.map(response.data, _mapCarpark);
        });
    }
    
    (function init() {
        exports.isLoading = true;
        _fetchCarparks()
        .then(function() {
           exports.isLoading = false; 
        });
    })();
});