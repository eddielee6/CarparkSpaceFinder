angular.module("listCarparks", [])
.controller("ListCarparksController", function($scope, $http) {    
    $scope.carparks = [];
    
    function _fetchCarparks() {
        return $http.get("/api/carparks")
        .then(function(response) {
            $scope.carparks = response.data, "shortDescription";
        });
    }
    
    (function init() {
        $scope.isLoading = true;
        _fetchCarparks()
        .then(function() {
           $scope.isLoading = false; 
        });
    })();
});