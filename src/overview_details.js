import * as PARA from "./parameters.js";
import * as UTILS from "./utils.js";
import {time_sliderHandle,initSliders,clearSliders} from "./slider.js";
import {getMeshPos,initGridMesh,restoreGridMesh} from "./mesh.js";
import {createBackgroundTexture} from "./texture.js";
import {GridLineObject} from "./gridLines.js";
import {destroyLinecharts,initSingleLinechart_full,updateSingleLinechart_simple} from "./linechart.js";
import {mouseTracker,mouseTracker_mousemoveHandle} from "./tracking.js";
import {selector} from "./selector.js";

let app,container,matrix_container,showcase_container,select_container;
let background_mesh,background_gridlines;
let showcase_mesh,showcase_gridlines;
let select_frame;
let select_frame_move = false;
let select_frame_anchor = {'h':0,'w':0};

const select_length = 3;
const select_radius = Math.floor(select_length/2);
let select_range =[{'h':0,'w':Math.floor(PARA.table.w/2)-select_radius},{'h':2,'w':Math.floor(PARA.table.w/2)+select_radius}];


const matrix_showcase_margin_pix = 50;
const showcase_length = select_length;
const showcase_length_pix = select_length*PARA.focal_cell_pix;

let mouse_down_idx;

function bufferIndex(h,w) {return h*(PARA.table.w+1)+w;}

function updateBackgroundGridlines() {
    const buffer = background_mesh.geometry.getBuffer('aVertexPosition');

    const hori=[],vert=[];
    for(let i=0;i<PARA.table.h+1;i++) {hori.push(buffer.data[2*bufferIndex(i,0)+1]);}
    for(let j=0;j<PARA.table.w+1;j++) {vert.push(buffer.data[2*bufferIndex(0,j)]);}
    
    background_gridlines.updatePosByLine(hori,vert);
}
function updateSelectFrameGridlines() {
    const hori=[0,select_length*PARA.step_pix.h],vert=[0,select_length*PARA.step_pix.w];
    select_frame.updatePosByLine(hori,vert);
}
function updateShowcaseGridlines() {
    function showcaseBufferIndex(h,w) {return h*(showcase_length+1)+w;}
    const buffer = showcase_mesh.geometry.getBuffer('aVertexPosition');

    const hori=[],vert=[];
    for(let i=0;i<showcase_length+1;i++) {hori.push(buffer.data[2*showcaseBufferIndex(i,0)+1]);}
    for(let j=0;j<showcase_length+1;j++) {vert.push(buffer.data[2*showcaseBufferIndex(0,j)]);}
    showcase_gridlines.updatePosByLine(hori,vert);
}
function changeCurrentTimeHandle() {
    const background_texture = createBackgroundTexture(0,0,PARA.table.h-1,PARA.table.w-1);
    background_mesh.shader.uniforms.uSampler2 = background_texture;
    updateShowcaseContent();
}
function mousedownHandle(evt) {
    const mouse_on_canvas = UTILS.getMouseOnCanvas(evt);
    const idx = {'h':Math.floor(mouse_on_canvas.h/PARA.step_pix.h),'w':Math.floor(mouse_on_canvas.w/PARA.step_pix.w)};
    mouse_down_idx = idx;
    if (idx.h>=select_range[0].h && idx.h<=select_range[1].h && idx.w>=select_range[0].w && idx.w<=select_range[1].w) {
        select_frame_anchor = {'h':mouse_on_canvas.h-select_range[0].h*PARA.step_pix.h,'w':mouse_on_canvas.w-select_range[0].w*PARA.step_pix.w};
        select_container.pivot.set(select_frame_anchor.w,select_frame_anchor.h);
        select_container.position.set(mouse_on_canvas.w,mouse_on_canvas.h);
        select_frame_move = true;
    }
}
function mouseupHandle(evt) {
    const mouse_on_canvas = UTILS.getMouseOnCanvas(evt);
    const idx = {'h':Math.floor(mouse_on_canvas.h/PARA.step_pix.h),'w':Math.floor(mouse_on_canvas.w/PARA.step_pix.w)};
    if (select_frame_move) {
        if (!(idx.h==mouse_down_idx.h && idx.w == mouse_down_idx.w)) {
            selector.moveODSelectFrame = true; 
        }
        select_frame_move = false;
        const position_pix = {
            'w':select_container.position.x-select_container.pivot.x,
            'h':select_container.position.y-select_container.pivot.y};

        select_container.pivot.set(0,0);
        select_range[0] = {'h':Math.round(position_pix.h/PARA.step_pix.h),'w':Math.round(position_pix.w/PARA.step_pix.w)};
        select_range[0].h = Math.min(Math.max(0,select_range[0].h),PARA.table.h-select_length);
        select_range[0].w = Math.min(Math.max(0,select_range[0].w),PARA.table.w-select_length);
        select_range[1] = {'h':select_range[0].h+select_length-1,'w':select_range[0].w+select_length-1};
        select_container.position.set(select_range[0].w*PARA.step_pix.w,select_range[0].h*PARA.step_pix.h);
        updateShowcaseContent();
    }
}
function updateShowcaseContent() {
    const showcase_texture = createBackgroundTexture(select_range[0].h,select_range[0].w,select_range[1].h,select_range[1].w);
    showcase_mesh.shader.uniforms.uSampler2 = showcase_texture;
    updateLinecharts();
}
function initLinecharts() {
    const constant_div = document.createElement("div");
    constant_div.setAttribute("id","constant_div");
    
    constant_div.style.position = "relative";
    constant_div.style.top = `${showcase_container.position.y}px`;
    constant_div.style.left = `${showcase_container.x}px`;

    constant_div.style.width=`${showcase_length_pix}px`;
    constant_div.style.height = `${showcase_length_pix}px`;

    //d3.select('#canvasVis').node().appendChild(constant_div);
    d3.select('#wrapper_div').node().appendChild(constant_div);

    const linecharts_svg = d3.select("#constant_div").append("svg")
        .attr("id","linecharts_svg")
        .attr("viewBox",`0 0 ${showcase_length_pix} ${showcase_length_pix}`);

    for (let i=0;i<showcase_length;i++) {
        for (let j=0;j<showcase_length;j++) {
            initSingleLinechart_full(i,j,{'h':PARA.focal_cell_pix,'w':PARA.focal_cell_pix},linecharts_svg);
        }
    }
    updateLinecharts();
}
function updateLinecharts() {
    
    for (let i=0;i<showcase_length;i++) {
        for (let j=0;j<showcase_length;j++) {
            const pos = {'h':i+select_range[0].h,'w':j+select_range[0].w};
            const grid_pix = {'h':PARA.focal_cell_pix,'w':PARA.focal_cell_pix};
            const pos_pix = {'h':i*PARA.focal_cell_pix,'w':j*PARA.focal_cell_pix};
            updateSingleLinechart_simple(i,j,pos,grid_pix,pos_pix);
        }
    }
}
function bodyListener(evt) {
    const mouse_on_canvas = UTILS.getMouseOnCanvas(evt);
    const idx = {'h':Math.floor(mouse_on_canvas.h/PARA.step_pix.h),'w':Math.floor(mouse_on_canvas.w/PARA.step_pix.w)};
    currentPos.h = Math.max(Math.min(idx.h,PARA.table.h-1),0);
    currentPos.w = Math.max(Math.min(idx.w,PARA.table.w-1),0);

    if(mouse_on_canvas.h<0||mouse_on_canvas.w<0||mouse_on_canvas.h>PARA.stage_pix.h||mouse_on_canvas.w>PARA.stage_pix.w) {
        
        if (!select_frame_move) {
            document.body.style.cursor = "default";
        }
        
    } else {
        if (idx.h>=select_range[0].h && idx.h<=select_range[1].h && idx.w>=select_range[0].w && idx.w<=select_range[1].w) {
            document.body.style.cursor = "pointer";
        } else {
            if (!select_frame_move) {
                document.body.style.cursor = "default";
            }
        }
        
        if (select_frame_move) {
            const position_pix = {
                'w':select_container.position.x-select_container.pivot.x,
                'h':select_container.position.y-select_container.pivot.y};

            select_range[0] = {'h':Math.round(position_pix.h/PARA.step_pix.h),'w':Math.round(position_pix.w/PARA.step_pix.w)};
            select_range[0].h = Math.min(Math.max(0,select_range[0].h),PARA.table.h-select_length);
            select_range[0].w = Math.min(Math.max(0,select_range[0].w),PARA.table.w-select_length);
            select_range[1] = {'h':select_range[0].h+select_length-1,'w':select_range[0].w+select_length-1};
            updateShowcaseContent();
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
export function loadOD() {

    // document.body.style.overflowX = "scroll";
    select_range =[{'h':0,'w':Math.floor(PARA.table.w/2)-select_radius},{'h':2,'w':Math.floor(PARA.table.w/2)+select_radius}];
    
    container = new PIXI.Container();
    container.interactive = true;
    
    const wrapper = document.createElement("div");
    wrapper.id = "wrapper_div";
    //wrapper.style.position = "absolute";
    wrapper.style.position = "relative";
    d3.select("#canvasVis").node().appendChild(wrapper);

    let canvas = document.createElement("canvas");
    canvas.id = "canvas";
    canvas.style.position = "absolute";
    //d3.select('#canvasVis').node().appendChild(canvas);
    wrapper.appendChild(canvas);
    
    app = new PIXI.Application({width:PARA.stage_pix.w+2*matrix_showcase_margin_pix+showcase_length_pix, height:PARA.stage_pix.h, antialias:true, view:canvas});
    app.renderer.backgroundColor = PARA.backgroundColor;
    app.stage.interactive = true;
    app.stage.addChild(container);
   
    matrix_container = new PIXI.Container(); container.addChild(matrix_container);
    matrix_container.interactive = true;
    
    const background_container = new PIXI.Container(); matrix_container.addChild(background_container);
    const background_texture = createBackgroundTexture(0,0,PARA.table.h-1,PARA.table.w-1);
    background_mesh = initGridMesh(PARA.table.h,PARA.table.w,background_texture); 
    background_container.addChild(background_mesh); 
    background_gridlines = new GridLineObject(PARA.table.h,PARA.table.w);
    updateBackgroundGridlines();
    background_gridlines.addTo(background_container);
  
    select_container = new PIXI.Container(); matrix_container.addChild(select_container);
    select_container.interactive = true;
    select_container.height = PARA.step_pix.h*select_length;
    select_container.width = PARA.step_pix.w*select_length;
    select_container.position.set(PARA.step_pix.w*select_range[0].w,PARA.step_pix.h*select_range[0].h);
    select_frame = new GridLineObject(1,1,{'h':select_length*PARA.step_pix.h,'w':select_length*PARA.step_pix.w});
    select_frame.setColor(PARA.od_select_frame_color);
    select_frame.setScale(4);
    updateSelectFrameGridlines();
    select_frame.addTo(select_container);
    select_container.on("mousemove",function(e) {
        if (select_frame_move) {
            select_container.position.set(e.data.global.x,e.data.global.y);
        }
    })
    
    document.addEventListener("mousedown",mousedownHandle);
    document.addEventListener("mouseup",mouseupHandle);

    showcase_container = new PIXI.Container(); container.addChild(showcase_container);
    const showcase_texture = createBackgroundTexture(select_range[0].h,select_range[0].w,select_range[1].h,select_range[1].w);
    showcase_mesh = initGridMesh(select_length,select_length,showcase_texture,{'h':PARA.focal_cell_pix,'w':PARA.focal_cell_pix});
    showcase_container.addChild(showcase_mesh);
    showcase_gridlines = new GridLineObject(select_length,select_length,{'h':PARA.focal_cell_pix,'w':PARA.focal_cell_pix});
    updateShowcaseGridlines();
    showcase_gridlines.addTo(showcase_container);
    showcase_container.position.set(PARA.stage_pix.w+matrix_showcase_margin_pix,(PARA.stage_pix.h-showcase_length_pix)/2);


    
    currentTime.setHandle = changeCurrentTimeHandle;
    

    document.addEventListener('mousemove',bodyListener);

    let sliderInfo = [];
    let time_para = {
        "defaultValue":currentTime.value,
        "max":timeEnd,
        "min":timeStart,
        "id":"currentTime",
        "step":1,
        "oninputHandle":time_sliderHandle
    };
    sliderInfo.push(time_para);
    initSliders(sliderInfo);



    initLinecharts();
}
export function destroyOD() {
    // document.body.style.overflowX = "auto";
    clearSliders();
    destroyLinecharts();
    document.removeEventListener("mousedown",mousedownHandle);
    document.removeEventListener("mouseup",mouseupHandle);

    const linecharts_svg = document.getElementById("linecharts_svg");
    linecharts_svg.parentNode.removeChild(linecharts_svg);
    const constant_div = document.getElementById("constant_div");
    constant_div.parentNode.removeChild(constant_div);
    const wrapper_div = document.getElementById("wrapper_div");
    wrapper_div.parentNode.removeChild(wrapper_div);

    document.removeEventListener("mousemove",bodyListener);
    app.destroy(true,true);
}
