import {throttleAndDebounce} from "./flekschas_utils_timing.js";
import * as PARA from "./parameters.js";
import * as UTILS from "./utils.js";
import {time_sliderHandle,initSliders,clearSliders} from "./slider.js";
import {getMeshPos,initGridMesh,restoreGridMesh} from "./mesh.js";
import {createBackgroundTexture} from "./texture.js";
import {GridLineObject} from "./gridLines.js";
import {initSingleLinechart_full,updateSingleLinechart_simple,destroyLinecharts} from "./linechart.js";
import {mouseTracker,mouseTracker_mousemoveHandle} from "./tracking.js";

const zoomRange = {'min':1,'max':200};
const throttle_time = 10;
const debounce_time = 10;
let app,container;
let background_mesh,gridLineObj;
let scale_thresh = PARA.focal_cell_pix/PARA.step_pix.h;
const visible_linecharts_total = {'h':PARA.table.h,'w':PARA.table.w};
let pos1 = {'h':0,'w':0},pos2={'h':0,'w':0};
let visible_linecharts_start = {'h':0,'w':0};
let zoom_scale=1,zoom_x=0,zoom_y=0;

function bufferIndex(h,w) {return h*(PARA.table.w+1)+w;}

function zoom_svg(x,y,scale) {
   
    container.position.set(x,y);
    container.scale.set(scale,scale);
    
    gridLineObj.setScale(1/scale);

    const pos1_updated = {
        'h':Math.max(0,Math.floor((0-y)/scale/PARA.step_pix.h)),
        'w':Math.max(0,Math.floor((0-x)/scale/PARA.step_pix.w))
    };
    const pos2_updated = {
        'h':Math.min(PARA.table.h-1,Math.floor((PARA.stage_pix.h-y)/scale/PARA.step_pix.h)),
        'w':Math.min(PARA.table.w-1,Math.floor((PARA.stage_pix.w-x)/scale/PARA.step_pix.w))
    };
    
    let linechartsNeedUpdate = function(pos1new,pos2new) {
        if (pos1_updated.h<visible_linecharts_start.h||pos1_updated.w<visible_linecharts_start.w) return true;
        else if (pos2_updated.h>=visible_linecharts_start.h+visible_linecharts_total.h||pos2_updated.w>=visible_linecharts_start.w+visible_linecharts_total.w) return true;
        return false;
    }
    let linecharts_need_update = linechartsNeedUpdate(pos1_updated,pos2_updated);

    pos1={...pos1_updated};
    pos2={...pos2_updated};
    const constant_div = document.getElementById("constant_div");

    const canvas = document.getElementById(`canvas`);
    constant_div.style.top = `${canvas.getBoundingClientRect().top+window.scrollY}px`;
    constant_div.style.left = `${canvas.getBoundingClientRect().left+window.scrollX}px`;

    const linecharts_svg = d3.select("#linecharts_svg")
        .attr("transform-origin",`0 0`)
        .attr("transform",`translate(${x},${y}) scale(${scale})`);

    d3.select("#svgPath").select("path").attr("transform",`scale(${1/scale}) translate(${-x} ${-y})`);
    
    if(scale<scale_thresh) {
        linecharts_svg.attr("display", "none");
    } else {

        linecharts_svg.attr("display", "inline-block");
        if (linecharts_need_update) updateLinecharts_svg();
    }

}
function canvas_zoom_handle() {
    if (d3.event === null) return;
    zoom_x = d3.event.transform.x;
    zoom_y = d3.event.transform.y;
    zoom_scale = d3.event.transform.k;
    zoom_svg(zoom_x,zoom_y,zoom_scale);
}
function linecharts_svg_zoom_handle() {
    if (d3.event === null) return;
    zoom_x = d3.event.transform.x;
    zoom_y = d3.event.transform.y;
    zoom_scale = d3.event.transform.k;
    zoom_svg(zoom_x,zoom_y,zoom_scale);
}
function updateGridLine() {
    const buffer = background_mesh.geometry.getBuffer('aVertexPosition');

    const hori=[],vert=[];
    for(let i=0;i<PARA.table.h+1;i++) {hori.push(buffer.data[2*bufferIndex(i,0)+1]);}
    for(let j=0;j<PARA.table.w+1;j++) {vert.push(buffer.data[2*bufferIndex(0,j)]);}
    gridLineObj.updatePosByLine(hori,vert);
}
function initLinecharts_svg() {
    const canvas = document.getElementById("canvas");
    const constant_div = document.createElement("div");
    constant_div.setAttribute("id","constant_div");
    constant_div.style.position = "absolute";
    constant_div.style.top = `${canvas.getBoundingClientRect().top+window.scrollY}px`;
    constant_div.style.left = `${canvas.getBoundingClientRect().left+window.scrollX}px`;
    constant_div.style.width=`${PARA.stage_pix.w}px`;
    constant_div.style.height = `${PARA.stage_pix.h}px`;
    constant_div.style.overflow = "hidden";
    document.body.appendChild(constant_div);

    const linecharts_svg = d3.select("#constant_div").append("svg")
        .attr("id","linecharts_svg")
        .attr("viewBox",`0 0 ${PARA.stage_pix.w} ${PARA.stage_pix.h}`)
        .attr("display","none")
        .attr("clip-path","url(#svgPath)");

    visible_linecharts_total.h = Math.floor(PARA.stage_pix.h/PARA.focal_cell_pix)+1; 
    visible_linecharts_total.w = Math.floor(PARA.stage_pix.w/PARA.focal_cell_pix)+1;
    
    for (let i=0;i<visible_linecharts_total.h;i++) {
        for(let j=0;j<visible_linecharts_total.w;j++) {
            //initSingleLinechart_svg(i,j,{...PARA.step_pix},linecharts_svg);
            initSingleLinechart_full(i,j,{...PARA.step_pix},linecharts_svg);
        }
    }
}
function updateLinecharts_svg() {
    const visible_center = {'h':Math.floor((pos1.h+pos2.h)/2),'w':Math.floor((pos1.w+pos2.w)/2)};
    visible_linecharts_start = {'h':visible_center.h-Math.floor(visible_linecharts_total.h/2),'w':visible_center.w-Math.floor(visible_linecharts_total.w/2)};
    visible_linecharts_start.h = Math.min(Math.max(0,visible_linecharts_start.h),PARA.table.h-visible_linecharts_total.h);
    visible_linecharts_start.w = Math.min(Math.max(0,visible_linecharts_start.w),PARA.table.w-visible_linecharts_total.w);
    
    for (let i=0;i<visible_linecharts_total.h;i++) {
        for (let j=0;j<visible_linecharts_total.w;j++) {
            const pos = {'h':visible_linecharts_start.h+i,'w':visible_linecharts_start.w+j};
            const grid_pix = {...PARA.step_pix};
            const pos_pix = {'h':pos.h*PARA.step_pix.h,'w':pos.w*PARA.step_pix.w};
            //updateSingleLinechart_svg(i,j,pos,grid_pix,pos_pix);
            updateSingleLinechart_simple(i,j,pos,grid_pix,pos_pix);
        }
    }

}
function getVerticePositionsByGrid(pos1,pos2) {
    const array = Array(...Array(pos2.h-pos1.h+2)).map((_,h)=>{
        return Array(...Array(pos2.w-pos1.w+2)).map((_,w)=>{
            return {'h':(h+pos1.h)*PARA.step_pix.h,'w':(w+pos1.w)*PARA.step_pix.w};
        })
    });
    return array;
}
function changeCurrentTimeHandle() {
    const background_texture = createBackgroundTexture(0,0,PARA.table.h-1,PARA.table.w-1);
    background_mesh.shader.uniforms.uSampler2 = background_texture;

    const linecharts_svg = d3.select("#linecharts_svg");
    if (linecharts_svg.attr("display") === "inline-block") updateLinecharts_svg();
}

function mouse_click_handle(evt) {
   
}
function bodyListener(evt) {
   

    const mouseOnCanvas = UTILS.getMouseOnCanvas(evt); 
    currentPos.h = Math.floor((mouseOnCanvas.h-zoom_y)/PARA.step_pix.h/zoom_scale);
    currentPos.w = Math.floor((mouseOnCanvas.w-zoom_x)/PARA.step_pix.w/zoom_scale);
    
}
export function loadZoom() {
    zoom_x = 0,zoom_y=0,zoom_scale=1;
    scale_thresh = PARA.focal_cell_pix/PARA.step_pix.h;
    container = new PIXI.Container();
    container.interactive = true;

    let canvas = document.createElement("canvas");
    canvas.id = "canvas";
    canvas.style.position = "absolute";
    d3.select('#canvasVis').node().appendChild(canvas);
    
    app = new PIXI.Application({width:PARA.stage_pix.w, height:PARA.stage_pix.h, antialias:true, view:canvas});
    app.renderer.backgroundColor = PARA.backgroundColor;
    app.stage.interactive = true;
    app.stage.addChild(container);
    
    const background_texture = createBackgroundTexture(0,0,PARA.table.h-1,PARA.table.w-1);
    background_mesh = initGridMesh(PARA.table.h,PARA.table.w,background_texture); 
    container.addChild(background_mesh); 
    gridLineObj = new GridLineObject(PARA.table.h,PARA.table.w);
    updateGridLine();
    gridLineObj.addTo(container);
   
    initLinecharts_svg();

    const d3canvas = d3.select("#canvas");
    const throttle_debounce_canvas = throttleAndDebounce(canvas_zoom_handle,throttle_time,debounce_time);
    //d3canvas.call(d3.zoom().scaleExtent([zoomRange.min, zoomRange.max]).on("zoom", throttle_debounce_canvas));
    d3canvas.call(d3.zoom().scaleExtent([zoomRange.min, zoomRange.max]).on("zoom", canvas_zoom_handle));

    const d3constant_div = d3.select("#constant_div");
    const throttle_debounce_linecharts_svg = throttleAndDebounce(linecharts_svg_zoom_handle,throttle_time,debounce_time);
    //d3constant_div.call(d3.zoom().scaleExtent([zoomRange.min, zoomRange.max]).on("zoom", throttle_debounce_linecharts_svg));
    d3constant_div.call(d3.zoom().scaleExtent([zoomRange.min, zoomRange.max]).on("zoom", linecharts_svg_zoom_handle));

    currentTime.setHandle = changeCurrentTimeHandle;

    document.addEventListener('mousemove',bodyListener);
    document.addEventListener('click',mouse_click_handle);

    let sliderInfo = [];
    let time_para = {
        "defaultValue":currentTime.value,
        "max":timeEnd,
        "min":timeStart,
        "id":"currentTime",
        "oninputHandle":time_sliderHandle
    };
    sliderInfo.push(time_para);
    initSliders(sliderInfo);

}
export function destroyZoom() {
    clearSliders();
    destroyLinecharts();
    const linecharts_svg = document.getElementById("linecharts_svg");
    linecharts_svg.parentNode.removeChild(linecharts_svg);
    const constant_div = document.getElementById("constant_div");
    constant_div.parentNode.removeChild(constant_div);
    document.removeEventListener("mousemove",bodyListener);
    document.removeEventListener('click',mouse_click_handle);
    app.destroy(true,true); 
}
