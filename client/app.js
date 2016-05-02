angular.module("carparkSpaceFinder", ["ngRoute", "listCarparks", "viewCarpark"])
.config(function($routeProvider) {
    $routeProvider
    .when("/", {
        templateUrl: "client/carparks/listCarparks/listCarparks.html",
        controller: "ListCarparksController",
        controllerAs: "listCarparksCtrl"
    })
    .when("/:carparkId", {
        templateUrl: "client/carparks/viewCarpark/viewCarpark.html",
        controller: "ViewCarparkController",
        controllerAs: "viewCarparkCtrl"
    });
});