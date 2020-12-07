import * as PARA from "./parameters.js"
import {mouseTracker_mouseclickHandle} from "./tracking.js";

export let displaying_charts = {};

let xaxisLabels = [];
for(let i=timeStart;i<=timeEnd;i+=5) {
    xaxisLabels.push(i.toString());
}
function getKey(h,w) {return `linechart${h}-${w}`;}
function formatColor(hex) {return "#"+hex.toString(16);}
function getStrokeColor(h,w) {
    let stroke = PARA.lineColorDark;
    if(getValue(currentTime.value,h,w)>0.5) stroke = PARA.lineColorLight;
    return formatColor(stroke);
}
export function initSingleLinechart(h,w) {
    let key = getKey(h,w);
    let div = document.createElement("div");   
    div.setAttribute("id",key);
    div.setAttribute("class","linechart");
    div.display = "none";
    document.body.appendChild(div);
    
    const svg = d3.select("#"+key).append("svg")
        .append("g");

    const chartGroup = svg.append("g");
    chartGroup.append("g")
            .attr("id","x_axis");
            
    chartGroup.append("g")
        .attr("id", "y_axis");

    const dataset = d3.range(timeStart,timeEnd+1).map(function(d) { return {"time":d, "value":0} });
    chartGroup.append("path")
        .attr("id","line");
    chartGroup.selectAll(".dot")
        .data(dataset)
        .enter().append("circle")
        .attr("class","dot");
}

export function updateSingleLinechart(h,w,idx,grid_pix,pos_pix) {
    let minGridSide = grid_pix.h<=grid_pix.w?"h":"w";
    let ratio = grid_pix[minGridSide]/(PARA.chartSize_normal_pix[minGridSide]+2*PARA.chartMargin_normal_pix);
    let key = getKey(h,w);
    displaying_charts[key] = {...idx};
    let div = document.getElementById(key);
    div.display = "inline-block";
    
    //position
    div.style.top = `${pos_pix.h}px`;
    div.style.left = `${pos_pix.w}px`;
    //size
    div.style.height = `${grid_pix.h}px`;
    div.style.width = `${grid_pix.w}px`;

    let dataset = d3.range(timeStart,timeEnd+1).map(function(d) { return {"time":d, "value": getValue(d,idx.h,idx.w) } });
    let stroke = PARA.lineColorDark;
    if(dataset[currentTime.value-timeStart].value>0.5) stroke = PARA.lineColorLight;

    const xScale = d3.scaleLinear()
        .domain([timeStart,timeEnd])
        .range([0, PARA.chartSize_normal_pix.w*ratio]); 
    const yScale = d3.scaleLinear()
        .domain([0, 1])  
        .range([PARA.chartSize_normal_pix.h*ratio, 0]);
    const line = d3.line()
                .x(function(d) { return xScale(d.time); })
                .y(function(d) { return yScale(d.value); });
    let svg = d3.select("#"+key).select("svg");
    svg.attr("visibility","visible");
    if(grid_pix[minGridSide]<PARA.linechart_thresh_pix){
        svg.attr("visibility","hidden");
        return;
    }
    svg = svg.attr("width",grid_pix.w)
             .attr("height",grid_pix.h)
            .select("g");
    
    const chartTranslate = {
        'h':(grid_pix.h-PARA.chartSize_normal_pix.h*ratio)/2,
        'w':(grid_pix.w-PARA.chartSize_normal_pix.w*ratio)/2
    };
    const chartGroup = svg.select("g")
                          .attr("stroke",formatColor(stroke))
                          .attr("transform",`translate(${chartTranslate.w},${chartTranslate.h})`);
    chartGroup.select("#x_axis")
              .attr("transform",`translate(0,${PARA.chartSize_normal_pix.h*ratio})`)
              .call(d3.axisBottom(xScale).ticks(Math.floor((timeEnd-timeStart))).tickSize(-PARA.chartSize_normal_pix.h*ratio).tickFormat(""))
              .style("color",formatColor(stroke))
              .style("stroke-opacity","0.3")
              //.selectAll("text")
              //    .attr("transform", "translate(5,0)rotate(0)")
              //    .style("text-anchor", "end")
              //    .style("font-size", PARA.linechart_axisTickFontSize.x*ratio); 
    chartGroup.select("#y_axis")
              .call(d3.axisLeft(yScale).ticks(5).tickSize(-PARA.chartSize_normal_pix.w*ratio).tickFormat(""))
              .style("color",formatColor(stroke))
              .style("stroke-opacity","0.3")
              //.selectAll("text")
              //    .attr("transform", "translate(2,0)rotate(0)")
              //    .style("text-anchor", "end")
              //    .style("font-size", PARA.linechart_axisTickFontSize.y*ratio);
    chartGroup.select("#line")
              .datum(dataset)
              .attr("d",line)
              .attr("fill","none")
              .style("stroke-width",PARA.linechart_lineWidth_pix);
    chartGroup.selectAll(".dot")
                .data(dataset)
                .attr("fill",formatColor(stroke))
                .attr("class", "dot") 
                .attr("cx", function(d) { return xScale(d.time) })
                .attr("cy", function(d) { return yScale(d.value) })
                .attr("r",PARA.nodeRadius_normal_pix)
                .style("fill",function(d) {
                    const color = d.time==currentTime.value?PARA.highlightColor:stroke;
                    return formatColor(color); 
                })
                .style("stroke",function(d) {
                    const color = d.time==currentTime.value?PARA.highlightColor:stroke;
                    return formatColor(color); 
                })
                .style("stroke-width","3")
                .style("stroke-opacity","0.5")
                .on("click",function(d) {
                    //d3.select(this)
                    //    .style("fill",formatColor(PARA.highlightColor))
                    //    .style("stroke",formatColor(PARA.highlightColor));
                    currentTime.setCurrent = d.time;
                    let slider = document.getElementById("currentTime");
                    slider.value = currentTime.value;
                    let text = document.getElementById("currentTime-text");
                    text.innerHTML = slider.value;
                    mouseTracker_mouseclickHandle(); 
                });
}

export function destroyLinecharts() {
    displaying_charts = {};
    let linechartDiv = document.getElementsByClassName("linechart"); 
    while(document.getElementsByClassName("linechart").length>0) {
        linechartDiv = document.getElementsByClassName("linechart");
        document.body.removeChild(linechartDiv[0]);
    }
}
export function hideLinecharts() {
    for(let key of Object.keys(displaying_charts)) {
        let svg = d3.select("#"+key).select("svg");
        svg.attr("visibility","hidden");
    }
}
