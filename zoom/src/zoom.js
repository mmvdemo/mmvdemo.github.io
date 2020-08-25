const nodeCnt = 350;
const timeStart = 2012, timeEnd = 2019;
//color
const backgroundColor = 0x707B7C;
const headColor = 0x85C1E9; 
const nodeColor = 0x1ABC9C;
const selectColor = 0xE74C3C;
const lineColorDark = 0x2E4053;
const lineColorLight = 0xF0EDE4;
//parameters
const stageWidth = 800, stageHeight = 800;
const tableWidth = nodeCnt, tableHeight = nodeCnt;
const stepWidth = stageWidth/tableWidth,stepHeight = stageHeight/tableHeight;
const focalScale = 150/stepWidth;
const maxScale = 1.5;
const chartRatio=0.8;
const nodeRadius =0.2; 
let showChart = false;
//load data
const data= {};
for(let t=timeStart;t<=timeEnd;t++) {
    let matrix = [];
    for(let i=0;i<tableHeight;i++) {
        matrix.push(d3.range(tableWidth).map(Math.random));
    }
    data[t] = matrix;
}

//init app
const container = new PIXI.Container();
let canvas = document.getElementById("mycanvas");
let app = new PIXI.Application({width:stageWidth, height:stageHeight, antialias:true, view:canvas});
app.renderer.backgroundColor = backgroundColor;
//document.body.appendChild(app.view);
app.stage.interactive = true;
app.stage.addChild(container);
//generate background texture

const rgba = new Float32Array(tableWidth*tableHeight*4);
for(let i=0;i<tableHeight;i++) {
    for(let j=0;j<tableWidth;j++) {
        let value = getValue(timeEnd,i,j);
        let colorStr = d3.interpolateYlGn(value);
        let color = rgbStrToHex(colorStr);
        let idx = i*tableWidth+j;
        rgba[idx*4] = (color>>16)/256;
        rgba[idx*4+1] = ((color>>8)&((1<<8)-1))/256;
        rgba[idx*4+2] = (color&((1<<8)-1))/256;
        rgba[idx*4+3] = 1;
    }
}
const backgroundTexture = PIXI.Texture.fromBuffer(rgba,tableWidth,tableHeight);

//const linechartsTexture = createLineChartsTexture(gridH,gridW,h1,w1,h2,w2);
function createLineChartsSvg(gridH,gridW,h1,w1,h2,w2) {
    const svg = d3.create("svg")
                    .attr("width",gridW*(w2-w1+1))
                    .attr("height",gridH*(h2-h1+1));
    const chartHeight = gridH*chartRatio;
    const chartWidth = gridW*chartRatio;
    const originW = (gridW-chartWidth)/2;
    const originH = (gridH-chartHeight)/2;
    for(let i=h1;i<=h2;i++) {
        for(let j=w1;j<=w2;j++) {
            let translateW = (j-w1)*gridW;
            let translateH = (i-h1)*gridH;
            let xScale = d3.scaleLinear()
                .domain([timeStart,timeEnd])
                .range([0, chartWidth]); 

            let yScale = d3.scaleLinear()
                .domain([0, 1])  
                .range([chartHeight, 0]);  

            let line = d3.line()
                .x(function(d) { return xScale(d.time); })
                .y(function(d) { return yScale(d.value); });

            let dataset = d3.range(timeStart,timeEnd+1).map(function(d) { return {"time":d, "value": getValue(d,i,j) } });
            let stroke = lineColorDark;
            if(dataset[timeEnd-timeStart].value>0.5) stroke = lineColorLight;

            let chartGroup = svg.append("g")
                                .attr("transform",`translate(${translateW+originW},${translateH+originH})`)
                                .attr("stroke","#"+stroke.toString(16));
            chartGroup.append("g")
                .attr("class", "x axis")
                .attr("transform", `translate(0,${chartHeight})`)
                .call(d3.axisBottom(xScale).ticks(timeEnd-timeStart+1))
                .selectAll("text")
                    .attr("transform", "translate(-10,5)rotate(-45)")
                    .style("text-anchor", "end")
                    .style("font-size", 6)

            chartGroup.append("g")
                .attr("class", "y axis")
                .call(d3.axisLeft(yScale));

            chartGroup.append("path")
                .datum(dataset)  
                .attr("d", line)
                .attr("fill","none")
                .attr("stroke-width",2);

            chartGroup.selectAll(".dot")
                .data(dataset)
                .enter().append("circle")
                .attr("fill","#"+stroke.toString(16))
                .attr("class", "dot") 
                .attr("cx", function(d) { return xScale(d.time) })
                .attr("cy", function(d) { return yScale(d.value) })
                .attr("r", 3)
                .on("mouseover", function(a, b, c) { 
                })
        }
    }
    return svg;
}
function createLineChartsTexture(gridH,gridW,h1,w1,h2,w2) {
    let svg = createLineChartsSvg(gridH,gridW,h1,w1,h2,w2);
    let svgStr = svgToBase64(svg);
    let texture = PIXI.Texture.from(svgStr);
    return texture;
}
function svgToBase64(svg) {
    let svgStr = new XMLSerializer().serializeToString(svg.node());
    let image64 = `data:image/svg+xml;base64,${btoa(svgStr)}`;
    return image64;
}
let backgroundSprite;
let linechartsSprite = new PIXI.Sprite();
linechartsSprite.h1=tableHeight+1;
linechartsSprite.w1=tableWidth+1;
linechartsSprite.h2=-1;
linechartsSprite.w2=-1;
linechartsSprite.svgScale = 1;
window.onload = loadTable();
function loadTable() {
    backgroundSprite = new PIXI.Sprite(backgroundTexture);
    backgroundSprite.scale.x = stepWidth;
    backgroundSprite.scale.y = stepWidth;
    backgroundSprite.interactive = false;
    backgroundSprite.x = 0;
    backgroundSprite.y = 0;
    container.addChild(backgroundSprite);
    //container.addChild(linechartsSprite);
    app.stage.addChild(linechartsSprite);
}
let d3canvas = d3.select("#mycanvas");
d3canvas.call(d3.zoom().scaleExtent([0.0000001, 200]).on("zoom", zoom));
function zoom() {
    //console.log(parseInt(PIXI.Ticker.shared.FPS)+' FPS');
    let x = d3.event.transform.x;
    let y = d3.event.transform.y;
    let scale = d3.event.transform.k;
    
    container.x = x;
    container.y = y;
    container.scale.x = scale;
    container.scale.y = scale;

    linechartsSprite.x = x+linechartsSprite.w1*stepWidth*scale;
    linechartsSprite.y = y+linechartsSprite.h1*stepHeight*scale;
    linechartsSprite.scale.x = scale/linechartsSprite.svgScale;
    linechartsSprite.scale.y = scale/linechartsSprite.svgScale;

    let h1 = Math.max(0,Math.floor((0-y)/scale/stepHeight));
    let w1 = Math.max(0,Math.floor((0-x)/scale/stepWidth));
    let h2 = Math.min(tableHeight-1,Math.floor((stageHeight-y)/scale/stepHeight));
    let w2 = Math.min(tableWidth-1,Math.floor((stageWidth-x)/scale/stepWidth));
    //console.log(`mouse:${d3.mouse(canvas)}`);
    //console.log(`left corner is on ${Math.floor((0-y)/scale/stepHeight)}, ${Math.floor((0-x)/scale/stepWidth)}`);
    console.log(`hovering on (row,column): (${Math.floor((d3.mouse(canvas)[1]-y)/stepHeight/scale)},${Math.floor((d3.mouse(canvas)[0]-x)/scale/stepWidth)})`);
    console.log('');
    if(scale<focalScale) {
        linechartsSprite.visible = false;
    }else {
        linechartsSprite.visible = true;
    }
    function needUpdate() {
        if(scale<focalScale) {
            return false;
        } else if(linechartsSprite.scale.x>maxScale) {
            return true;
        } else if(h1<linechartsSprite.h1||w1<linechartsSprite.w1||h2>linechartsSprite.h2||w2>linechartsSprite.w2){
            return true;
        } else {
            return false;
        }
         
    }
    if(needUpdate()) {
        console.log('need update');
        console.log(`h1,w1 ${h1},${w1}  h2,w2 ${h2},${w2}`);
        linechartsSprite.h1=h1;
        linechartsSprite.w1=w1;
        linechartsSprite.h2=h2;
        linechartsSprite.w2=w2;
        let gridH = stepHeight*scale;
        let gridW = stepWidth*scale;
        
        let newTexture = createLineChartsTexture(gridH,gridW,h1,w1,h2,w2); 
        linechartsSprite.texture = newTexture;
        linechartsSprite.x=x+w1*stepWidth*scale;
        linechartsSprite.y=y+h1*stepHeight*scale;
        linechartsSprite.scale.x=1;
        linechartsSprite.scale.y=1;
        linechartsSprite.svgScale = scale;
    }
}

function rgbStrToHex(s) {
    let pat = new RegExp("\\d+","g");
    let numbers = s.match(pat);
    let color = 0x0;
    for (var i=0;i<3;i++) {
        color += Number(numbers[i])*Math.pow(256,2-i);
    }
    return color; 
}

function getValue(timeIdx,h,w) {
    return data[timeIdx][h][w]; 
}
