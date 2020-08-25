var path = require("path");
var express = require("express");
var app = express();

//app.use(express.static(path.join(__dirname,"/zoom")));
//app.get('/',function(req,res){
//    res.sendFile(path.join(__dirname,'zoom','dist','index.html'));
//})

//app.use(express.static(path.join(__dirname,"/lens")));
//app.get('/',function(req,res){
//    res.sendFile(path.join(__dirname,'lens','dist','index.html'));
//})

app.use(express.static(path.join(__dirname,"/fisheye")));
app.get('/',function(req,res){
    res.sendFile(path.join(__dirname,'fisheye','dist','index.html'));
})

app.listen(3000);
