var express = require("express");
var path = require("path");

var app = express();
var port = process.env.PORT || 8080;

app.use("/", express.static(path.join(__dirname, "dist")));

var staticRouter = express.Router();

staticRouter.get("/", function(req, res) {
    res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.use(staticRouter);

app.use(require("./api/carparks"));

app.listen(port, function() {
    console.log("Running on port " + port);
});