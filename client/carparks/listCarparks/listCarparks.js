angular.module("listCarparks", [])
.controller("ListCarparksController", function($http) {
    var exports = this;
    
    this.carparks = [];
    
    function _fetchCarparks() {
        return $http.get("/api/carparks")
        .then(function(response) {
            exports.carparks = response.data, "shortDescription";
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