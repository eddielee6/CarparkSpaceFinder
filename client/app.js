angular.module("carparkSpaceFinder", ["ngRoute"])
.config(function($routeProvider) {
    $routeProvider
    .when("/", {
        controller: require("./carparks/listCarparks/listCarparks"),
        templateProvider: function($templateCache) {
        	console.log($templateCache.info());
            return $templateCache.get("client/carparks/listCarparks/listCarparks.html"); 
        }
    })
    .when("/:carparkId", {
       controller: require("./carparks/viewCarpark/viewCarpark"),
       templateProvider: function($templateCache) {
            return $templateCache.get("client/carparks/viewCarpark/viewCarpark.html"); 
        }
    });
});
