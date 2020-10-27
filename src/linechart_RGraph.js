import * as PARA from "./parameters.js"

let linechartSVG = {};
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
function getSingleClearLinechart(key) {
    let lc;
    if(!(key in linechartSVG) || !linechartSVG[key]) {
        lc = new RGraph.SVG.Line({
            id:key,
            data:[],
            options:{
                backgroundGrid:false,
                marginTop:PARA.chartMargin_normal_pix,
                marginBottom:PARA.chartMargin_normal_pix,
                marginLeft:PARA.chartMargin_normal_pix,
                marginRight:PARA.chartMargin_normal_pix,
                xaxis:true,
                xaxisTickmarks:true,
                xaxisTickmarksLength:PARA.tickmarksLength_pix,
                //xaxisLabels:xaxisLabels,
                //xaxisLabelsAngle:60,
                //xaxisLabelsOffsety:-3,
                yaxis:true,
                yaxisTickmarksLength:PARA.tickmarksLength_pix,
                yaxisScale:true,
                yaxisScaleDecimals:1,
                yaxisTickmarks:true,
                tickmarksStyle:"circle",
                tickmarksFill:formatColor(PARA.lineColorLight),
                tickmarksSize:PARA.nodeRadius,
                tooltips:'<b>%{value}</b>',
                tooltipsEvent:"click",
                tooltipsOverride:function(obj,opt) {
                    currentTime.setCurrent = timeStart+opt.index;
                    let slider = document.getElementById("currentTime");
                    slider.value = currentTime.getCurrent;
                    let text = document.getElementById("currentTime-text");
                    text.innerHTML = slider.value;
                }
            }
        });
        linechartSVG[key] = lc;
    } else {
        lc = linechartSVG[key];
        RGraph.SVG.clear(lc.svg);
    }
    return lc;
}

export function initSingleLinechart(h,w) {
    let key = getKey(h,w);
    let div = document.createElement("div");   
    div.setAttribute("id",key);
    div.setAttribute("class","linechart");
    div.display = "none";
    document.body.appendChild(div);
}

export function updateSingleLinechart(h,w,idx,grid_pix,pos_pix) {
    let ratio = grid_pix.h/PARA.chartSize_normal_pix;
    let key = getKey(h,w);
    let div = document.getElementById(key);
    div.display = "inline-block";
    //position
    div.style.top = `${pos_pix.h}px`;
    div.style.left = `${pos_pix.w}px`;
    //size
    div.style.height = `${grid_pix.h}px`;
    div.style.width = `${grid_pix.w}px`;
    let lc = getSingleClearLinechart(key);
    //data
    let data = [];
    for(let i=timeStart;i<=timeEnd;i++) {
        data.push(getValue(i,idx.h,idx.w));
    }
    lc.originalData[0] = data;
    //style
    let stroke = getStrokeColor(idx.h,idx.w);
    let chartMargin_pix=PARA.chartMargin_normal_pix * ratio;
    let nodeRadius_pix=PARA.nodeRadius_normal_pix*ratio;
    let interval=(grid_pix.w-2*chartMargin_pix)/(timeEnd-timeStart);
    lc.originalColors.colors = [stroke];

    lc.properties.marginTop=chartMargin_pix; 
    lc.properties.marginBottom=chartMargin_pix; 
    lc.properties.marginLeft=chartMargin_pix; 
    lc.properties.marginRight=chartMargin_pix; 
    lc.properties.tickmarksSize=nodeRadius_pix;

    lc.properties.xaxisTickmarksLength =PARA.tickmarksLength_pix; 
    lc.properties.xaxisLabelsSize = interval*0.8;
    lc.properties.xaxisLabelsColor = stroke;
    lc.properties.xaxisColor = stroke;
    
    lc.properties.yaxisTickmarksLength =PARA.tickmarksLength_pix; 
    lc.properties.yaxisLabelsSize = interval*0.8;
    lc.properties.yaxisLabelsColor = stroke;
    lc.properties.yaxisColor = stroke;
    
    lc.draw();
}

export function destroyLinecharts() {
    linechartSVG = {};
    let linechartDiv = document.getElementsByClassName("linechart"); 
    while(document.getElementsByClassName("linechart").length>0) {
        linechartDiv = document.getElementsByClassName("linechart");
        document.body.removeChild(linechartDiv[0]);
    }
}

