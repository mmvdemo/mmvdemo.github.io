import * as PARA from "./parameters.js"
import {mouseTracker_mouseclickHandle} from "./tracking.js";
import {selector,selector_mouseDBLclickHandle} from "./selector.js";

export let displaying_charts = {};

let selectedDot = {
    time:-1,
    pos:{'h':-1,'w':-1},
    idx:{'h':-1,'w':-1},
    set setTime(newTime) {
        this.time = newTime;
        updateSelectDot(this.pos);
    },
    set setPos(newPos) {
        if(newPos.h==this.pos.h&&newPos.w==this.pos.w) return;
        const oldPos={...this.pos};
        this.pos = newPos;
        updateSelectDot(oldPos);
        updateSelectDot(this.pos);
    },
    get getTime() {
        return this.time;
    },
    get getPos() {
        return this.pos;
    }
}
function updateSelectDot(pos) {
    if(pos.h<0||pos.w<0) return; 
    const key = getKey(pos.h,pos.w);
    if(!(key in displaying_charts)) return;
    const idx=displaying_charts[key];
    const value=getValue(currentTime.value,idx.h,idx.w);
    const stroke=value<0.5?PARA.lineColorDark:PARA.lineColorLight;
    const chartGroup = d3.select("#"+key).select("svg").select("g").select("g");
    chartGroup.selectAll(".dot")
                .style("fill",function(d) {
                    let color=stroke;
                    if(pos.h==selectedDot.pos.h&&pos.w==selectedDot.pos.w&&d.time==selectedDot.getTime) {
                        color=PARA.select_highlight_color;
                    }else if(d.time==currentTime.value) {
                        color=PARA.hint_highlight_color;
                    }
                    return formatColor(color); 
                })
                .style("stroke",function(d) {
                    const color = d.time==currentTime.value?PARA.hint_highlight_color:stroke;
                    return formatColor(color); 
                })
}
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
export function initSingleLinechart(h,w,parent_node) {
    let key = getKey(h,w);
    let div = document.createElement("div");   
    div.setAttribute("id",key);
    div.setAttribute("class","linechart");
    div.display = "none";
    if (typeof parent_node === "undefined") {
        document.body.appendChild(div);
    } else {
        parent_node.appendChild(div);
    }
    
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


export function hideLinecharts_svg() {
    for (let key of Object.keys(displaying_charts)) {
        console.log("hiding",key);
        d3.select(`#${key}`).attr("visibility","hidden");
    }
}
export function initSingleLinechart_full(h,w,grid_pix,parent_svg) {
    const key = getKey(h,w);

    const min_grid_side = grid_pix.h<=grid_pix.w?"h":"w";
    const ratio = grid_pix[min_grid_side]/PARA.focal_cell_pix;
    
    const chart_size_pix = PARA.chartSize_normal_pix*ratio;
    const chart_margin_pix = PARA.chartMargin_normal_pix*ratio;
    const stroke_width_pix = PARA.linechart_lineWidth_pix*ratio;
    const tick_size_pix = stroke_width_pix+chart_size_pix;
    const dot_radius = PARA.nodeRadius_normal_pix*ratio;

    const dataset = d3.range(timeStart,timeEnd+1).map(function(d) { return {"time":d, "value":1} });
    const stroke = PARA.lineColorDark;

    //const hideTime = !currentTrial.startsWith("task-3");
    const hideTime = false;

    const xScale = d3.scaleLinear()
        .domain([timeStart,timeEnd])
        .range([0, chart_size_pix]); 
    const yScale = d3.scaleLinear()
        .domain([0, 1])  
        .range([chart_size_pix, 0]);


    const cell_g = parent_svg.append("g")
        .attr("id",key)
        .attr("class","linechart")
        .attr("display","inherent");

    const chart_g = cell_g.append("g");
    const x_axis = chart_g.append("g")
        .attr("id","x_axis")
        .attr("transform",`translate(0,${chart_size_pix})`)
        .call(d3.axisTop(xScale).ticks(timeEnd-timeStart).tickPadding(0).tickSizeInner(chart_size_pix).tickFormat(""))
        .style("color",formatColor(stroke))
        .style("stroke-opacity","0.3")
        .style("stroke-width",stroke_width_pix);
    const x_axis_domain = x_axis.select("path.domain").remove();
        
    x_axis.selectAll(".tick").each(function(data) {
        const tick = d3.select(this);
        tick.attr("transform",`translate(${xScale(data)},0)`)
    })

    const y_axis = chart_g.append("g")
        .attr("id","y_axis")
        .call(d3.axisRight(yScale).ticks(5).tickPadding(0).tickSize(chart_size_pix).tickFormat(""))
        .attr("transform",`translate(0,0)`)
        .style("color",formatColor(stroke))
        .style("stroke-opacity","0.3")
        .style("stroke-width",stroke_width_pix);
    const y_axis_domain = y_axis.select("path.domain").remove();
    
    y_axis.selectAll(".tick").each(function(data) {
        const tick = d3.select(this);
        tick.attr("transform",`translate(0,${yScale(data)})`);
    })
    
    chart_g.append("path")
        .attr("id","line")
        .attr("fill","none")
        .style("stroke-width",stroke_width_pix);


    chart_g.selectAll(".dot")
        .data(dataset)
        .enter().append("circle")
        .attr("class","dot")
        .attr("fill",formatColor(stroke))
        .attr("class", "dot") 
        .attr("cx", function(d) { return xScale(d.time) })
        .attr("cy", function(d) { return yScale(d.value) })
        .attr("r",PARA.nodeRadius_normal_pix*ratio)
        .style("fill",function(d) {
            const color = d.time==currentTime.value?PARA.hint_highlight_color:stroke;
            return formatColor(color); 
        })
        .style("stroke",function(d) {
            const color = d.time==currentTime.value?PARA.hint_highlight_color:stroke;
            return formatColor(color); 
        })
        .style("stroke-width",`${3*ratio}`)
        .style("stroke-opacity","0.5")
        .on("click",function(d) {

            if (hideTime) return;
            
            selector.clickOnDot = true;
            currentTime.setCurrent = d.time;

            let slider = document.getElementById("currentTime");
            slider.noUiSlider.set([currentTime.value]);
            let text = document.getElementById("currentTime-text");
            text.innerHTML = currentTime.value;
            mouseTracker_mouseclickHandle(); 
        });

}
export function updateSingleLinechart_simple(h,w,idx,grid_pix,pos_pix,cell_g) {

    const key = getKey(h,w);
    displaying_charts[key] = {...idx};
    
    const min_grid_side = grid_pix.h<=grid_pix.w?"h":"w";
    const ratio = grid_pix[min_grid_side]/PARA.focal_cell_pix;
    
    const chart_size_pix = PARA.chartSize_normal_pix*ratio;
    const chart_margin_pix = PARA.chartMargin_normal_pix*ratio;
    const stroke_width_pix = PARA.linechart_lineWidth_pix*ratio;
    const tick_size_pix = stroke_width_pix+chart_size_pix;
    const dot_radius = PARA.nodeRadius_normal_pix*ratio;
    //const hideTime = !currentTrial.startsWith("task-3");
    const hideTime = false;

    cell_g = d3.select(`#${key}`)
        .attr("transform",`translate(${pos_pix.w},${pos_pix.h})`)
        .attr("width",`${grid_pix.w}`)
        .attr("height",`${grid_pix.h}`);
    
    //if(grid_pix[min_grid_side]<PARA.linechart_thresh_pix){
    //    cell_g.attr("visibility","hidden");
    //    return;
    //} else {
    //    cell_g.attr("visibility","visible");
    //}
   

    const dataset = d3.range(timeStart,timeEnd+1).map(function(d) { return {"time":d, "value": getValue(d,idx.h,idx.w) } });
    let stroke = PARA.lineColorDark;
    if(dataset[currentTime.value-timeStart].value>0.5) stroke = PARA.lineColorLight;


    const xScale = d3.scaleLinear()
        .domain([timeStart,timeEnd])
        .range([0, chart_size_pix]); 
    const yScale = d3.scaleLinear()
        .domain([0, 1])  
        .range([chart_size_pix, 0]);


    const line = d3.line()
                .x(function(d) { return xScale(d.time); })
                .y(function(d) { return yScale(d.value); });

    const chart_g = cell_g.select("g")
        .attr("stroke",formatColor(stroke))
        .attr("transform",`translate(${chart_margin_pix},${chart_margin_pix})`);

    const x_axis = chart_g.select("#x_axis")
        .style("color",formatColor(stroke));

    const y_axis = chart_g.select("#y_axis") 
        .style("color",formatColor(stroke));

    chart_g.select("#line")
        .datum(dataset)
        .attr("d",line);

    chart_g.selectAll(".dot")
        .each(function(data) {
            const dot = d3.select(this);
            const color = !hideTime && data.time==currentTime.value?PARA.hint_highlight_color:stroke;

            const format_color = formatColor(color);
            dot.attr("transform",`translate(0,${yScale(dataset[data.time].value)})`)
                .style("fill",format_color)
                .style("stroke",format_color);
        })

}

export function updateSingleLinechart(h,w,idx,grid_pix,pos_pix) {

    //console.log(`updateSingleLinechart`,h,w,idx,grid_pix,pos_pix);
    let minGridSide = grid_pix.h<=grid_pix.w?"h":"w";
    let ratio = grid_pix[minGridSide]/(PARA.chartSize_normal_pix+2*PARA.chartMargin_normal_pix);
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
        .range([0, PARA.chartSize_normal_pix*ratio]); 
    const yScale = d3.scaleLinear()
        .domain([0, 1])  
        .range([PARA.chartSize_normal_pix*ratio, 0]);
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
        'h':(grid_pix.h-PARA.chartSize_normal_pix*ratio)/2,
        'w':(grid_pix.w-PARA.chartSize_normal_pix*ratio)/2
    };
    const chartGroup = svg.select("g")
                          .attr("stroke",formatColor(stroke))
                          .attr("transform",`translate(${chartTranslate.w},${chartTranslate.h})`);
    chartGroup.select("#x_axis")
              .attr("transform",`translate(0,${PARA.chartSize_normal_pix*ratio})`)
              .call(d3.axisTop(xScale).ticks(Math.floor((timeEnd-timeStart))).tickSize(PARA.chartSize_normal_pix*ratio).tickFormat(""))
              .style("color",formatColor(stroke))
              .style("stroke-opacity","0.3")
              //.selectAll("text")
              //    .attr("transform", "translate(5,0)rotate(0)")
              //    .style("text-anchor", "end")
              //    .style("font-size", PARA.linechart_axisTickFontSize.x*ratio); 
    chartGroup.select("#y_axis")
              .call(d3.axisRight(yScale).ticks(5).tickSize(PARA.chartSize_normal_pix*ratio).tickFormat(""))
              .style("color",formatColor(stroke))
              .style("stroke-opacity","0.3")
              //.selectAll("text")
              //    .attr("transform", "translate(2,0)rotate(0)")
              //    .style("text-anchor", "end")
              //    .style("font-size", PARA.linechart_axisTickFontSize.y*ratio);
    //const hideTime = !currentTrial.startsWith("task-3");
    const hideTime = false;
    chartGroup.select("#line")
              .datum(dataset)
              .attr("d",line)
              .attr("fill","none")
              .style("stroke-width",PARA.linechart_lineWidth_pix*grid_pix.h/PARA.focal_cell_pix);
    chartGroup.selectAll(".dot")
                .data(dataset)
                .attr("fill",formatColor(stroke))
                .attr("class", "dot") 
                .attr("cx", function(d) { return xScale(d.time) })
                .attr("cy", function(d) { return yScale(d.value) })
                .attr("r",PARA.nodeRadius_normal_pix*grid_pix.h/PARA.focal_cell_pix)
                .style("fill",function(d) {
                    let color=stroke;
                    if(idx.h==selectedDot.idx.h&&idx.w==selectedDot.idx.w&&d.time==selectedDot.getTime) {
                        color=PARA.select_highlight_color;
                    }else if(!hideTime && d.time==currentTime.value) {
                        color=PARA.hint_highlight_color;
                    }
                    return formatColor(color); 
                })
                .style("stroke",function(d) {
                    const color = !hideTime && d.time==currentTime.value?PARA.hint_highlight_color:stroke;
                    return formatColor(color); 
                })
                .style("stroke-width","3"*grid_pix.h/PARA.focal_cell_pix)
                .style("stroke-opacity","0.5")
                //.on("dblclick",function(d){
                //    if(h==selectedDot.getPos.h&&w==selectedDot.getPos.w&&d.time==selectedDot.getTime) {
                //        const pos={...selectedDot.getPos};
                //        const time=selectedDot.getTime;
                //        selectedDot.setPos={'h':-1,'w':-1}; 
                //        selectedDot.setTime=-1;
                //        selector_mouseDBLclickHandle(false,idx,time);
                //    }else{
                //        selectedDot.idx={...idx};
                //        selectedDot.setPos={'h':h,'w':w};
                //        selectedDot.setTime=d.time;
                //        const pos={...selectedDot.getPos};
                //        const time=selectedDot.getTime;
                //        selector_mouseDBLclickHandle(true,idx,time);
                //    }
                //})
                .on("click",function(d) {
                    //if (currentTrial.startsWith("task-1")) return;
                    if (hideTime) return;
                    if (currentTrial.startsWith("task-3")) {
                        if (task3_anchorCell.pos1.h!=idx.h || task3_anchorCell.pos1.w!=idx.w) return;
                    }
                    
                    selector.clickOnDot = true;
                    currentTime.setCurrent = d.time;

                    let slider = document.getElementById("currentTime");
                    slider.noUiSlider.set([currentTime.value]);
                    let text = document.getElementById("currentTime-text");
                    text.innerHTML = currentTime.value;
                    mouseTracker_mouseclickHandle(); 
                });
}

export function destroyLinecharts() {
    displaying_charts = {};
    let linechartDiv = document.getElementsByClassName("linechart"); 
    while(document.getElementsByClassName("linechart").length>0) {
        linechartDiv = document.getElementsByClassName("linechart");
        //document.body.removeChild(linechartDiv[0]);
        linechartDiv[0].parentNode.removeChild(linechartDiv[0]);
    }
}

export function hideLinecharts() {
    for(let key of Object.keys(displaying_charts)) {
        let svg = d3.select("#"+key).select("svg");
        svg.attr("visibility","hidden");
    }
}
