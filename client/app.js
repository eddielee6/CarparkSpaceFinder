angular.module("carparkSpaceFinder", ["ngRoute", "listCarparks", "viewCarpark"])
.config(function($routeProvider) {
    $routeProvider
    .when("/", {
        templateUrl: "client/carparks/listCarparks/listCarparks.html",
        controller: "ListCarparksController"
    })
    .when("/:carparkId", {
        templateUrl: "client/carparks/viewCarpark/viewCarpark.html",
        controller: "ViewCarparkController"
    });
});