angular.module("viewCarpark", [])
.controller("ViewCarparkController", function($http, $routeParams) {
    var exports = this;
    
    exports.carparkId = $routeParams.carparkId;
    
    exports.carpark = {};
    
    function _fetchCarpark(carparkId) {
        return $http.get("/api/carparks/" + carparkId)
        .then(function(response) {
            exports.carpark = response.data;
            
            if (exports.carpark.lat && exports.carpark.long) {
                _setupMap(exports.carpark.lat, exports.carpark.long);
            }
        });
    }
    
    function _setupMap(lat, long) {
        var location = new google.maps.LatLng(lat, long);
        var map = new google.maps.Map(document.getElementById("location-map"), {
            center: location,
            zoom: 15
        });
        
        var coordInfoWindow = new google.maps.InfoWindow();
        coordInfoWindow.setContent(exports.carpark.name);
        coordInfoWindow.setPosition(location);
        coordInfoWindow.open(map);
    }
    
    (function init() {
        exports.isLoading = true;
        _fetchCarpark(exports.carparkId)
        .then(function() {
           exports.isLoading = false;
        });        
    })();
});