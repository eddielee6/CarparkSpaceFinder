angular.module("viewCarpark", [])
.controller("ViewCarparkController", function($scope, $http, $routeParams) {
    
    $scope.carparkId = $routeParams.carparkId;
    
    $scope.carpark = {};
    
    function _fetchCarpark(carparkId) {
        return $http.get("/api/carparks/" + carparkId)
        .then(function(response) {
            $scope.carpark = response.data;
            
            if ($scope.carpark.lat && $scope.carpark.long) {
                setTimeout(function() {
                    _setupMap($scope.carpark.lat, $scope.carpark.long);
                }, 100);
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
        coordInfoWindow.setContent($scope.carpark.name);
        coordInfoWindow.setPosition(location);
        coordInfoWindow.open(map);
    }
    
    (function init() {
        $scope.isLoading = true;
        _fetchCarpark($scope.carparkId)
        .then(function() {
           $scope.isLoading = false;
        });        
    })();
});