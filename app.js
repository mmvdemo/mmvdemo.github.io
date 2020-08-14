var express = require("express");
var app = express();

//app.use(express.static("lens")).listen(3000);
app.use(express.static("zoom")).listen(3000);
