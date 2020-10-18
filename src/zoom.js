import * as PARA from "./parameters.js";
import {createLineChartsTexture} from "./utils.js";
import {createBackgroundTexture} from "./texture.js";

const zoomRange = {'min':0.000001,'max':200};
const maxScale = 1.5;
let focalThresh = 150/PARA.step_pix.w;
let container,backgroundSprite,linechartsSprite;

function zoom() {
    let x = d3.event.transform.x;
    let y = d3.event.transform.y;
    let scale = d3.event.transform.k;
    
    container.position.set(x,y);
    container.scale.set(scale,scale);

    linechartsSprite.x = x+linechartsSprite.pos1.w*PARA.step_pix.w*scale;
    linechartsSprite.y = y+linechartsSprite.pos1.h*PARA.step_pix.h*scale;
    linechartsSprite.scale.x = scale/linechartsSprite.svgScale;
    linechartsSprite.scale.y = scale/linechartsSprite.svgScale;

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
    console.log('');
    if(scale<focalThresh) {
        linechartsSprite.visible = false;
    }else {
        linechartsSprite.visible = true;
    }
    function needUpdate() {
        if(scale<focalThresh) {
            return false;
        } else if(linechartsSprite.scale.x>maxScale) {
            return true;
        } else if(pos1.h<linechartsSprite.pos1.h||pos1.w<linechartsSprite.pos1.w||pos2.h>linechartsSprite.pos2.h||pos2.w>linechartsSprite.pos2.w){
            return true;
        } else {
            return false;
        }
         
    }
    if(needUpdate()) {
        console.log('need update');
        console.log(`h1,w1 ${pos1.h},${pos1.w}  h2,w2 ${pos2.h},${pos2.w}`);
        linechartsSprite.pos1 = pos1;
        linechartsSprite.pos2 = pos2;
        let grid_pix = {
            'h':PARA.step_pix.h*scale,
            'w':PARA.step_pix.w*scale
        };
        
        let newTexture = createLineChartsTexture(grid_pix,pos1,pos2);
        linechartsSprite.texture = newTexture;
        linechartsSprite.x=x+pos1.w*PARA.step_pix.w*scale;
        linechartsSprite.y=y+pos1.w*PARA.step_pix.h*scale;
        linechartsSprite.scale.set(1,1);
        linechartsSprite.svgScale = scale;
    }
}
let app;
export function loadZoom() {
    let showChart = false;
    focalThresh = 150/PARA.step_pix.w;
    container = new PIXI.Container();
    const backgroundTexture = createBackgroundTexture(0,0,PARA.table.h-1,PARA.table.w-1);
    
    backgroundSprite = new PIXI.Sprite(backgroundTexture);
    backgroundSprite.scale.x = PARA.step_pix.w;
    backgroundSprite.scale.y = PARA.step_pix.w;
    backgroundSprite.interactive = false;
    backgroundSprite.x = 0;
    backgroundSprite.y = 0;

    linechartsSprite = new PIXI.Sprite();
    linechartsSprite.pos1 = {'h':PARA.table.h+1,'w':PARA.table.w+1};
    linechartsSprite.pos2 = {'h':-1,'w':-1};
    linechartsSprite.svgScale = 1;
    //let canvas = document.getElementById("mycanvas");
    let canvas = document.createElement("canvas");
    canvas.setAttribute("id","mycanvas");
    document.body.appendChild(canvas);
    app = new PIXI.Application({width:PARA.stage_pix.w, height:PARA.stage_pix.h, antialias:true, view:canvas});
    app.renderer.backgroundColor = PARA.backgroundColor;
    app.stage.interactive = true;
    app.stage.addChild(container); 

    container.addChild(backgroundSprite);
    app.stage.addChild(linechartsSprite);
    
    let d3canvas = d3.select("#mycanvas");
    d3canvas.call(d3.zoom().scaleExtent([zoomRange.min, zoomRange.max]).on("zoom", zoom));
}
export function destroyZoom() {
    app.destroy(true,true); 
}
