var express = require("express");
var path = require("path");

var app = express();
var port = process.env.PORT || 8080;

app.use("/bower_components", express.static(path.join(__dirname, "bower_components")));
app.use("/assets", express.static(path.join(__dirname, "assets")));
app.use("/client", express.static(path.join(__dirname, "client")));

var staticRouter = express.Router();

staticRouter.get("/", function(req, res) {
    res.sendFile(path.join(__dirname, "index.html"));
});

app.use(staticRouter);

app.use(require("./api/carparks"));

app.listen(port, function() {
    console.log("Running on port " + port);
});