import * as PARA from "./parameters.js";
import * as UTILS from "./utils.js";
import {time_sliderHandle,initSliders,clearSliders} from "./slider.js";
import {getMeshPos,initGridMesh,restoreGridMesh} from "./mesh.js";
import {createBackgroundTexture} from "./texture.js";
import {GridLineObject} from "./gridLines.js";
import {initSingleLinechart,updateSingleLinechart,destroyLinecharts,hideLinecharts} from "./linechart.js";
import {highlightManager} from "./highlight.js";
import {mouseTracker,mouseTracker_mousemoveHandle} from "./tracking.js";

const zoomRange = {'min':1,'max':200};
let app,container;
let background_mesh,gridLineObj;
let scale_thresh = PARA.focal_cell_pix/PARA.step_pix.h;

function bufferIndex(h,w) {return h*(PARA.table.w+1)+w;}
function zoom() {
    let x = d3.event.transform.x;
    let y = d3.event.transform.y;
    let scale = d3.event.transform.k;
    
    container.position.set(x,y);
    container.scale.set(scale,scale);

    //linechartsSprite.x = x+linechartsSprite.pos1.w*PARA.step_pix.w*scale;
    //linechartsSprite.y = y+linechartsSprite.pos1.h*PARA.step_pix.h*scale;
    //linechartsSprite.scale.x = scale/linechartsSprite.svgScale;
    //linechartsSprite.scale.y = scale/linechartsSprite.svgScale;

    let pos1 = {
        'h':Math.max(0,Math.floor((0-y)/scale/PARA.step_pix.h)),
        'w':Math.max(0,Math.floor((0-x)/scale/PARA.step_pix.w))
    };
    let pos2 = {
        'h':Math.min(PARA.table.h-1,Math.floor((PARA.stage_pix.h-y)/scale/PARA.step_pix.h)),
        'w':Math.min(PARA.table.w-1,Math.floor((PARA.stage_pix.w-x)/scale/PARA.step_pix.w))
    };
    //console.log(`mouse:${d3.mouse(canvas)}`);
    //console.log(`left corner is on ${Math.floor((0-y)/scale/PARA.step_pix.h)}, ${Math.floor((0-x)/scale/PARA.step_pix.w)}`);
    //console.log(`hovering on (row,column): (${Math.floor((d3.mouse(canvas)[1]-y)/PARA.step_pix.h/scale)},${Math.floor((d3.mouse(canvas)[0]-x)/scale/PARA.step_pix.w)})`);
    //console.log('');
    
    const linecharts_div = document.getElementById("linecharts_div");
    linecharts_div.style.transformOrigin = (`${0} ${0}`);
    //linecharts_div.style.transform = (`translate(${x}px,${y}px)`);
    linecharts_div.style.transform = (`translate(${x}px,${y}px) scale(${scale})`);
    //linecharts_div.style.clipPath = `rectangle(${-x}px ${-y}px ${PARA.stage_pix.w/scale}px ${PARA.stage_pix.h/scale}px)`;
    //linecharts_div.style.transform = (`scale(${scale})`);
    if(scale<scale_thresh) {
        linecharts_div.style.display = "none";
    } else {
        linecharts_div.style.display = "inline-block";
    }

    //if(scale<focalThresh) {
    //    linechartsSprite.visible = false;
    //}else {
    //    linechartsSprite.visible = true;
    //}
    function needUpdate() {
        return false;
        //if(scale<focalThresh) {
        //    return false;
        //} else if(linechartsSprite.scale.x>maxScale) {
        //    return true;
        //} else if(pos1.h<linechartsSprite.pos1.h||pos1.w<linechartsSprite.pos1.w||pos2.h>linechartsSprite.pos2.h||pos2.w>linechartsSprite.pos2.w){
        //    return true;
        //} else {
        //    return false;
        //}
         
    }
    if(needUpdate()) {
        console.log('need update');
        console.log(`h1,w1 ${pos1.h},${pos1.w}  h2,w2 ${pos2.h},${pos2.w}`);
        //linechartsSprite.pos1 = pos1;
        //linechartsSprite.pos2 = pos2;
        let grid_pix = {
            'h':PARA.step_pix.h*scale,
            'w':PARA.step_pix.w*scale
        };
        
        //let newTexture = createLineChartsTexture(grid_pix,pos1,pos2);
        //linechartsSprite.texture = newTexture;
        //linechartsSprite.x=x+pos1.w*PARA.step_pix.w*scale;
        //linechartsSprite.y=y+pos1.w*PARA.step_pix.h*scale;
        //linechartsSprite.scale.set(1,1);
        //linechartsSprite.svgScale = scale;
    }
}
function updateGridLine() {
    const buffer = background_mesh.geometry.getBuffer('aVertexPosition');

    const hori=[],vert=[];
    for(let i=0;i<PARA.table.h+1;i++) {hori.push(buffer.data[2*bufferIndex(i,0)+1]);}
    for(let j=0;j<PARA.table.w+1;j++) {vert.push(buffer.data[2*bufferIndex(0,j)]);}
    gridLineObj.updatePosByLine(hori,vert);
}
function initLinecharts() {
    const canvas = document.getElementById("canvas");
    const linecharts_div = document.createElement("div");
    linecharts_div.setAttribute("id","linecharts_div");
    linecharts_div.style.position = "absolute";
    linecharts_div.style.clipPath = `rectangle(0px 0px ${PARA.stage_pix.w/2}px ${PARA.stage_pix.h/2}px)`;
    linecharts_div.style.display = "none";
    document.body.appendChild(linecharts_div);
    for (let i=0;i<PARA.table.h;i++) {
        for(let j=0;j<PARA.table.w;j++) {
            initSingleLinechart(i,j,linecharts_div);
            const pos = {'h':i,'w':j};
            const grid_pix = {...PARA.step_pix};
            const pos_pix = {'h':i*PARA.step_pix.h,'w':j*PARA.step_pix.w};
            
            updateSingleLinechart(i,j,pos,grid_pix,pos_pix);
        }
    }
}
export function loadZoom() {

    container = new PIXI.Container();
    container.interactive = true;

    let canvas = document.createElement("canvas");
    canvas.id = "canvas";
    canvas.style.position = "absolute";
    document.body.appendChild(canvas);
    
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
   
    initLinecharts();

    let d3canvas = d3.select("#canvas");
    d3canvas.call(d3.zoom().scaleExtent([zoomRange.min, zoomRange.max]).on("zoom", zoom));
}
export function destroyZoom() {
    destroyLinecharts();
    const linecharts_div = document.getElementById("linecharts_div");
    linecharts_div.parentNode.removeChild(linecharts_div);
    app.destroy(true,true); 
}
