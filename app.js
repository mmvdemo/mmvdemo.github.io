const path = require("path");
const express = require("express");
const csvtojson = require("csvtojson");
const ejs = require("ejs");
const fs = require("fs");
const app = express();
app.engine("html",ejs.renderFile);

const DATA = "RANDOM";
//load data
let json = {};
let timeStart,timeEnd,nodeCnt;
if (DATA == "RANDOM") {
    timeStart = 2012;
    timeEnd = 2019;
    nodeCnt = 51;
} else if(DATA == "US") {
    timeStart = 2005;
    timeEnd = 2018;
    for(let i=2005;i<=2018;i++) {
        let dataFilePath = `static/US/${i}.csv`;
        csvtojson().fromFile(dataFilePath).then((jsonObj)=>{json[`${i}`]=JSON.stringify(jsonObj)});
    }
}

app.use(express.static(__dirname));
app.get('/cartesianlens',function(req,res){
    res.render(path.join(__dirname,'index.html'), {technique:"cartesianlens",dataType:DATA,timeStart:timeStart,timeEnd:timeEnd,nodeCnt:nodeCnt,data:JSON.stringify(json)});
})
app.get('/tablelens',function(req,res){
    res.render(path.join(__dirname,'index.html'), {technique:"tablelens",dataType:DATA,timeStart:timeStart,timeEnd:timeEnd,nodeCnt:nodeCnt,data:JSON.stringify(json)});
})
app.get('/fisheyelens',function(req,res){
    res.render(path.join(__dirname,'index.html'), {technique:"fisheyelens",dataType:DATA,timeStart:timeStart,timeEnd:timeEnd,nodeCnt:nodeCnt,data:JSON.stringify(json)});
})
app.get('/zoom',function(req,res){
    res.render(path.join(__dirname,'index.html'), {technique:"zoom",dataType:DATA,timeStart:timeStart,timeEnd:timeEnd,nodeCnt:nodeCnt,data:JSON.stringify(json)});
})
app.get('/inset',function(req,res){
    res.render(path.join(__dirname,'index.html'), {technique:"inset",dataType:DATA,timeStart:timeStart,timeEnd:timeEnd,nodeCnt:nodeCnt,data:JSON.stringify(json)});
})
app.listen(3000);
