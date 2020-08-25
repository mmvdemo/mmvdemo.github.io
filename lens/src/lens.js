//load data

let nodeCnt = 50;
let timeStart = 2012, timeEnd = 2019;

//color
let backgroundColor = 0x707B7C;
let headColor = 0x85C1E9; 
let nodeColor = 0x1ABC9C;
let selectColor = 0xE74C3C;
let lineColor = 0x2E4053;
//DOI
let linearDOI = function(dis) {
    if (dis==0) return focalScale;
    else return 1;
}
let tableDOI = function(dis) {
    let contextRadius = 1;
    if (Math.abs(dis)<=contextRadius) return focalScale;
    else return 1;
}
let fisheyeDOI = function(dis) {
    return Math.exp(-Math.abs(dis)/5);
}
let transfer = function(doi,foc,x) {
    let res = 0;
    for(let i=0;i<x;i++) res+=doi(i-foc);
    return res;
}
let sumDOI = function(doi,foc,isWidth) {
    let sum = 0; 
    let length = tableHeight;
    if(isWidth) length = tableWidth;
    for(let i=0;i<length;i++) sum+=doi(i-foc);
    return sum;
}
//parameters
//let doi = fisheyeDOI;
//let doi = tableDOI;
let doi = linearDOI;
let stageWidth = 800, stageHeight = 800;
let tableWidth = nodeCnt, tableHeight = nodeCnt;
let focalScale = 4;
let stepWidth = stageWidth/tableWidth,stepHeight = stageHeight/tableHeight;
let chartRatio=0.8;
let nodeRadius =0.2; 
let active = false;
let focusPos = {
    width:-1,
    height:-1,
    get w() {
        return this.width;
    },
    get h() {
        return this.height;
    },
    set w(value) {
        this.width=value;
        //shiftFocus();
    },
    set h(value) {
        this.height = value;
        //shiftFocus();
    }
};
//init app
const container = new PIXI.Container();
container.interactive = true;
let canvas = document.getElementById("mycanvas");
let app = new PIXI.Application({width:stageWidth, height:stageHeight, antialias:true, view:canvas});
app.renderer.backgroundColor = backgroundColor;
//document.body.appendChild(app.view);
app.stage.interactive = true;
app.stage.addChild(container);
//generate texture
let rect = new PIXI.Graphics();
rect.beginFill(0xFFFFFF);
rect.drawRect(0,0,stepWidth,stepHeight);
rect.endFill();
const texture =app.renderer.generateTexture(rect);

window.onload = loadTable();

function loadTable() {
    for(let i =0;i<tableWidth;i++) {
        for(let j=0;j<tableHeight;j++) {
            let grid = new PIXI.Sprite(texture);
            let value = getValue(timeEnd,i,j);
            let colorStr = d3.interpolateYlGn(value);
            let color = rgbStrToHex(colorStr);
            grid.tint = color;
            grid.x = j*stepHeight;
            grid.y = i*stepWidth;
            grid.interactive = true;
            grid.hitArea = new PIXI.Rectangle(0,0,stepWidth,stepHeight);
            grid.chart = drawChartGraphics(i,j);
            grid.addChild(grid.chart);
            grid.mouseover = function(data) {
                console.log(i+' '+j);
                if(active==false) return;
                if(focusPos.w!=i || focusPos.h!=j) {
                    focusPos.w=i;
                    focusPos.h=j;
                    shiftFocus();
                }
            }
            container.addChild(grid);
        }
    }
    active=true;
}
function shiftFocus() {
    let w = focusPos.w;
    let h = focusPos.h;
    if(w<0||h<0||active==false) {return;}
    let focalGrid = getGridSprite(w,h);
    let sumW = sumDOI(doi,w,true);
    let sumH = sumDOI(doi,h,false);
    let transferW = 0, transferH =0;
    for(let i=0;i<tableWidth;i++) {
        transferH = 0;
        for(let j=0;j<tableHeight;j++) {
            let grid = getGridSprite(i,j);            
            let scaleH = doi(j-h)/sumH*tableHeight;
            let scaleW = doi(i-w)/sumW*tableWidth;
            grid.scale.x =scaleH; 
            grid.scale.y =scaleW;
            grid.x = transferH/sumH*stageHeight;
            grid.y = transferW/sumW*stageWidth;
            transferH += doi(j-h);
            grid.chart.visible = false;
        }
        transferW += doi(i-w);
    }
    for(let i=0;i<tableWidth;i++) {
        let grid = getGridSprite(i,h);
        grid.chart.visible = true;
    }
    //for(let j=0;j<tableHeight;j++) {
    //    let grid = getGridSprite(w,j);
    //    grid.chart.visible = true;
    //}
}

function rgbStrToHex(s) {
    let pat = new RegExp("\\d+","g");
    let numbers = s.match(pat);
    let color = 0x0;
    for (let i=0;i<3;i++) {
        color += Number(numbers[i])*Math.pow(256,2-i);
    }
    return color; 
}
function drawChartGraphics(i,j) {
    let values = [];
    for(let t=timeStart;t<=timeEnd;t++) {
        values.push(getValue(t,i,j));
    }
    let chart = new PIXI.Graphics();
    chart.visible = false;
    let chartHeight = stepHeight*chartRatio;
    let chartWidth = stepWidth*chartRatio;
    chart.x = (stepWidth-chartWidth)/2;
    chart.y = (stepHeight-chartHeight)/2;
    chart.lineStyle(0.2,lineColor,1)
        .moveTo(0,chartHeight)
        .lineTo(chartWidth,chartHeight);
    chart.lineStyle(0.2,lineColor,1)
        .moveTo(0,chartHeight)
        .lineTo(0,0);
    let timeLen = timeEnd-timeStart;
    let lastX=-1,lastY=-1;
    for(let t=timeStart;t<=timeEnd;t++) {
        let value = getValue(t,i,j);
        let xPos = chartWidth*(t-timeStart)/timeLen;
        let yPos = chartHeight*(1-value);
        chart.beginFill(nodeColor);
        chart.drawCircle(xPos,yPos,nodeRadius);
        chart.endFill();
        if(lastX>=0) {
            chart.lineStyle(0.2,lineColor,1)
                .moveTo(lastX,lastY)
                .lineTo(xPos,yPos);
        }
        lastX=xPos;
        lastY=yPos;
    }
    return chart;
}

function getGridSprite(i,j) {
    //console.log('i='+i+' j='+j);
    return container.children[i*tableHeight+j];
}

function getValue(timeIdx,i,j) {
    return Math.random();
}
