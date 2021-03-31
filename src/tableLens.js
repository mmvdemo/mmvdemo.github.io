import * as PARA from "./parameters.js";
import * as UTILS from "./utils.js";
import {time_sliderHandle,initSliders,clearSliders} from "./slider.js";
import {getMeshPos,initGridMesh,restoreGridMesh} from "./mesh.js";
import {GridLineObject} from "./gridLines.js";
import {createBackgroundTexture} from "./texture.js";
import {initSingleLinechart,updateSingleLinechart,destroyLinecharts,hideLinecharts} from "./linechart.js";
// parameters
// Magnification scale for the focused cells.
let focalScale = 2;
// The range of cells that are showing line charts. (There are (2*${contextRadius}+1)^2 line charts in total.)
let contextRadius=1;

let quad;
let gridLineObj;
let style_flag;
let linecharts=[];
let app;
//DOI
let tableDOI = function(dis) {
    if (Math.abs(dis)<=contextRadius) return focalScale;
    else return 1;
}
let expDOI = function(dis) {
    return Math.exp(-Math.abs(dis)/50);
}
let transfer = function(doi,foc,x) {
    let res = 0;
    for(let i=0;i<x;i++) res+=doi(i-foc);
    return res;
}
let sumDOI = function(doi,foc,isWidth) {
    let sum = 0; 
    let length = PARA.table.h;
    if(isWidth) length = PARA.table.w;
    for(let i=0;i<length;i++) sum+=doi(i-foc);
    return sum;
}
//let doi = expDOI;
let doi = tableDOI;


let maskSprites = {};
let maskGridlines = {};
let maskSpriteContainer;
function initMaskGridlines() {
    maskGridlines['hori_left']=[];
    maskGridlines['hori_right']=[];
    maskGridlines['vert_up']=[];
    maskGridlines['vert_down']=[];
    for(let key of Object.keys(maskGridlines)) {
        for(let i=0;i<contextRadius*2+1;i++) {
            const obj = new GridLineObject(1,1);
            obj.addTo(maskSpriteContainer);
            maskGridlines[key].push(obj);
        }
    }
}
function initMaskSprite() {
    maskSprites = {};
    for(let i=0;i<maskSpriteContainer.children.length;i++) {
        maskSpriteContainer.children[i].destroy(true);
    }
    maskSpriteContainer.removeChildren();
    const rgba = new Float32Array(4); 
    const color = PARA.backgroundColor;
    rgba[0] = (color>>16)/256;
    rgba[1] = ((color>>8)&((1<<8)-1))/256;
    rgba[2] = (color&((1<<8)-1))/256;
    rgba[3] = 1;
    const texture = PIXI.Texture.fromBuffer(rgba,1,1);
    maskSprites['hori_left']=[];
    maskSprites['hori_right']=[];
    maskSprites['vert_up']=[];
    maskSprites['vert_down']=[];
    let sprite;
    for(let i=0;i<2*(contextRadius*2+1);i++) {
        sprite = new PIXI.Sprite(texture);
        maskSpriteContainer.addChild(sprite);
        maskSprites.hori_left.push(sprite); 
        sprite = new PIXI.Sprite(texture);
        maskSpriteContainer.addChild(sprite);
        maskSprites.hori_right.push(sprite);
        sprite = new PIXI.Sprite(texture);
        maskSpriteContainer.addChild(sprite);
        maskSprites.vert_up.push(sprite);
        sprite = new PIXI.Sprite(texture);
        maskSpriteContainer.addChild(sprite);
        maskSprites.vert_down.push(sprite);
    }
    initMaskGridlines();
}
function setMaskGridlinesVisibility(visible) {
    for(let key of Object.keys(maskGridlines)) {
        for(let obj of maskGridlines[key]) {
            obj.setVisibility(visible);
        }
    }
}
function setMasksVisibility(visible) {
    for(let key of Object.keys(maskSprites)) {
        for(let mask of maskSprites[key]) {mask.visible = visible;}
    }
    setMaskGridlinesVisibility(visible);
}
function setMasksVisibilityByKey(visible,key) {
    for(let mask of maskSprites[key]) {mask.visible = visible;}
    for(let obj of maskGridlines[key]) {obj.setVisibility(visible);}
}
function binSearch(n,s,lo,hi) {
    const sum = transfer(doi,focusPos[s],PARA.table[s]);
    const ratio = PARA.stage_pix[s]/sum;
    while(lo<hi) {
        let mi = Math.floor((lo+hi)/2);
        if(n<transfer(doi,focusPos[s],mi)*ratio) {
            hi = mi;
        } else {
            lo = mi+1;
        }
    }
    return lo-1;
}
function bufferIndex(h,w) {return h*(PARA.table.w+1)+w;}
function updateQuad(h,w) {
    if(style_flag==="STEP") setMasksVisibility(true);
    const sum = {
        'h':transfer(doi,h,PARA.table.h),
        'w':transfer(doi,w,PARA.table.w)};
    const buffer = quad.geometry.getBuffer('aVertexPosition');
    let trans = {'h':0,'w':0};
    for(let i=0;i<=PARA.table.h;i++) {
        trans.w = 0;
        for(let j=0;j<=PARA.table.w;j++) {
            buffer.data[2*bufferIndex(i,j)+1] = trans.h/sum.h*PARA.stage_pix.h;
            buffer.data[2*bufferIndex(i,j)] = trans.w/sum.w*PARA.stage_pix.w;
            trans.w += doi(j-w);
        }
        trans.h += doi(i-h);
    }
    focusPos = {'h':h,'w':w};
    currentPos = {...focusPos};
    buffer.update();
    updateGridLine();
};
function restoreQuad() {
    focusPos.h = -1; focusPos.w = -1;
    restoreGridMesh(quad,PARA.table,PARA.step_pix);
    updateGridLine();
    hideLinecharts();
    if(style_flag==="STEP") {setMasksVisibility(false);}
};
function updateGridLine() {
    const buffer = quad.geometry.getBuffer('aVertexPosition');

    const hori=[],vert=[];
    for(let i=0;i<=PARA.table.h;i++) {hori.push(buffer.data[2*bufferIndex(i,0)+1]);}
    for(let j=0;j<=PARA.table.w;j++) {vert.push(buffer.data[2*bufferIndex(0,j)]);}
    gridLineObj.updatePosByLine(hori,vert);
}
function getVerticePositionsByGrid(pos1,pos2) {
    const quadSize = {'h':PARA.table.h+1,'w':PARA.table.w+1};
    const array = getMeshPos(quad,quadSize,pos1,{'h':pos2.h+1,'w':pos2.w+1});
    return array;
}
function updateMaskSprite() {
    const sum = {
        'h':transfer(doi,focusPos.h,PARA.table.h),
        'w':transfer(doi,focusPos.w,PARA.table.w)};
    const buffer = quad.geometry.getBuffer('aVertexPosition'); 
    const len = {};
    const regLen = {
        'h':1/sum.h*PARA.stage_pix.h,
        'w':1/sum.w*PARA.stage_pix.w
    };
    const focalLen = {
        'w':focalScale/sum.h*PARA.stage_pix.h,
        'h':focalScale/sum.w*PARA.stage_pix.w
    };
     
    len.vert_up = {
        'h': -PARA.gridLineWidth_pix+buffer.data[2*bufferIndex(focusPos.h-contextRadius,focusPos.w)+1],
        'w': -PARA.gridLineWidth_pix+(focalLen.w-regLen.w)/2
    };
    len.vert_down = {
        'h': -PARA.gridLineWidth_pix+PARA.stage_pix.h-buffer.data[2*bufferIndex(focusPos.h+contextRadius+1,focusPos.w)+1],
        'w': -PARA.gridLineWidth_pix+(focalLen.w-regLen.w)/2
    };
    len.hori_left = {
        'h':-PARA.gridLineWidth_pix+(focalLen.h-regLen.h)/2,
        'w':-PARA.gridLineWidth_pix+buffer.data[2*bufferIndex(focusPos.h,focusPos.w-contextRadius)]
    };
    len.hori_right = {
        'h':-PARA.gridLineWidth_pix+(focalLen.h-regLen.h)/2,
        'w':-PARA.gridLineWidth_pix+PARA.stage_pix.w-buffer.data[2*bufferIndex(focusPos.h,focusPos.w+contextRadius+1)]
    };
    if(len.vert_up.h<=0) {
        setMasksVisibilityByKey(false,"vert_up");
    } else {
        setMasksVisibilityByKey(true,"vert_up");
        for(let i=0;i<maskSprites.vert_up.length;i+=2) {
            let sprite = maskSprites.vert_up[i];
            let position = {
                'h':PARA.gridLineWidth_pix/2+buffer.data[2*bufferIndex(0,i/2+focusPos.w-contextRadius)+1],
                'w':PARA.gridLineWidth_pix/2+buffer.data[2*bufferIndex(0,i/2+focusPos.w-contextRadius)]
            };
            sprite.position.set(position.w,position.h);
            sprite.scale.set(len.vert_up.w,len.vert_up.h);
            sprite = maskSprites.vert_up[i+1];
            sprite.position.set(PARA.gridLineWidth_pix+position.w+len.vert_up.w+regLen.w,position.h);
            sprite.scale.set(len.vert_up.w,len.vert_up.h);

            const hori = [0,len.vert_up.h+PARA.gridLineWidth_pix];
            const vert = [position.w+len.vert_up.w,position.w+len.vert_up.w+PARA.gridLineWidth_pix/2+regLen.w];
            const array=[];
            array.push([{'h':hori[0],'w':vert[0]},{'h':hori[0],'w':vert[1]}]);
            array.push([{'h':hori[1],'w':vert[0]},{'h':hori[1],'w':vert[1]}]);
            maskGridlines.vert_up[i/2].updatePosByVertice(array);
        }
    }
    if(len.vert_down.h<=0) {
        setMasksVisibilityByKey(false,"vert_down");
    } else {
        setMasksVisibilityByKey(true,"vert_down");
        for(let i=0;i<maskSprites.vert_down.length;i+=2) {
            let sprite = maskSprites.vert_down[i];
            let position = {
                'h':PARA.gridLineWidth_pix/2+buffer.data[2*bufferIndex(focusPos.h+contextRadius+1,i/2+focusPos.w-contextRadius)+1],
                'w':PARA.gridLineWidth_pix/2+buffer.data[2*bufferIndex(focusPos.h+contextRadius+1,i/2+focusPos.w-contextRadius)]
            };
            sprite.position.set(position.w,position.h);
            sprite.scale.set(len.vert_down.w,len.vert_down.h);
            sprite = maskSprites.vert_down[i+1];
            sprite.position.set(PARA.gridLineWidth_pix+position.w+len.vert_down.w+regLen.w,position.h);
            sprite.scale.set(len.vert_down.w,len.vert_down.h);
            
            const hori = [position.h-PARA.gridLineWidth_pix/2,PARA.stage_pix.h];
            const vert = [position.w+len.vert_down.w,position.w+len.vert_down.w+PARA.gridLineWidth_pix/2+regLen.w];
            const array=[];
            array.push([{'h':hori[0],'w':vert[0]},{'h':hori[0],'w':vert[1]}]);
            array.push([{'h':hori[1],'w':vert[0]},{'h':hori[1],'w':vert[1]}]);
            maskGridlines.vert_down[i/2].updatePosByVertice(array);
        }
    }
    if(len.hori_left.w<=0) {
        setMasksVisibilityByKey(false,"hori_left");
    } else {
        setMasksVisibilityByKey(true,"hori_left");
        for(let i=0;i<maskSprites.hori_left.length;i+=2) {
            let sprite = maskSprites.hori_left[i];
            let position = {
                'h':PARA.gridLineWidth_pix/2+buffer.data[2*bufferIndex(i/2+focusPos.h-contextRadius,0)+1],
                'w':PARA.gridLineWidth_pix/2+buffer.data[2*bufferIndex(i/2+focusPos.h-contextRadius,0)]
            };
            sprite.position.set(position.w,position.h);
            sprite.scale.set(len.hori_left.w,len.hori_left.h);
            sprite = maskSprites.hori_left[i+1];
            sprite.position.set(position.w,PARA.gridLineWidth_pix+position.h+len.hori_left.h+regLen.h);
            sprite.scale.set(len.hori_left.w,len.hori_left.h);

            const hori = [position.h+len.hori_left.h-PARA.gridLineWidth_pix/2,position.h+len.hori_left.h+PARA.gridLineWidth_pix/2+regLen.h];
            const vert = [0,len.hori_left.w+PARA.gridLineWidth_pix];
            const array=[];
            array.push([{'h':hori[0],'w':vert[0]},{'h':hori[0],'w':vert[1]}]);
            array.push([{'h':hori[1],'w':vert[0]},{'h':hori[1],'w':vert[1]}]);
            maskGridlines.hori_left[i/2].updatePosByVertice(array);
        }
    }
    if(len.hori_right.w<=0) {
        setMasksVisibilityByKey(false,"hori_right");
    } else {
        setMasksVisibilityByKey(true,"hori_right");
        for(let i=0;i<maskSprites.hori_right.length;i+=2) {
            let sprite = maskSprites.hori_right[i];
            let position = {
                'h':PARA.gridLineWidth_pix/2+buffer.data[2*bufferIndex(i/2+focusPos.h-contextRadius,focusPos.w+contextRadius+1)+1],
                'w':PARA.gridLineWidth_pix/2+buffer.data[2*bufferIndex(i/2+focusPos.h-contextRadius,focusPos.w+contextRadius+1)]
            };
            sprite.position.set(position.w,position.h);
            sprite.scale.set(len.hori_right.w,len.hori_right.h);
            sprite = maskSprites.hori_right[i+1];
            sprite.position.set(position.w,PARA.gridLineWidth_pix+position.h+len.hori_right.h+regLen.h);
            sprite.scale.set(len.hori_right.w,len.hori_right.h);

            const hori = [position.h+len.hori_right.h,position.h+len.hori_right.h+PARA.gridLineWidth_pix/2+regLen.h];
            const vert = [position.w-PARA.gridLineWidth_pix/2,PARA.stage_pix.w];
            const array=[];
            array.push([{'h':hori[0],'w':vert[0]},{'h':hori[0],'w':vert[1]}]);
            array.push([{'h':hori[1],'w':vert[0]},{'h':hori[1],'w':vert[1]}]);
            maskGridlines.hori_right[i/2].updatePosByVertice(array);
        }
    }
}
function initLinecharts() {
    for(let i=0;i<=2*contextRadius;i++) {
        for(let j=0;j<=2*contextRadius;j++) {
            initSingleLinechart(i,j); 
        }
    }
}
function updateLinecharts(h,w) {
    w = Math.max(contextRadius,Math.min(PARA.table.w-contextRadius-1,w));
    h = Math.max(contextRadius,Math.min(PARA.table.h-contextRadius-1,h));
    const buffer = quad.geometry.getBuffer('aVertexPosition');
    let grid_pix = {
        'h':buffer.data[2*bufferIndex(h+1,w)+1]-buffer.data[2*bufferIndex(h,w)+1],
        'w':buffer.data[2*bufferIndex(h,w+1)]-buffer.data[2*bufferIndex(h,w)]
    };
    const canvas = document.getElementById("canvas");
    const rect = canvas.getBoundingClientRect();
    for(let i=0;i<2*contextRadius+1;i++) {
        for(let j=0;j<2*contextRadius+1;j++) {
            let pos = {'h':h-contextRadius+i,'w':w-contextRadius+j};
            if(pos.h<0||pos.w<0||pos.h>=PARA.table.h||pos.w>=PARA.table.w) {continue;}
            let pos_pix = {
                'h':buffer.data[2*bufferIndex(pos.h,pos.w)+1],
                'w':buffer.data[2*bufferIndex(pos.h,pos.w)]
            };
            pos_pix.h += rect.top + window.scrollY;
            pos_pix.w += rect.left+window.scrollX;
            updateSingleLinechart(i,j,pos,grid_pix,pos_pix);
        }
    }
}
function scale_sliderHandle() {
    let text = document.getElementById("tablelensScale-text");
    let slider = document.getElementById("tablelensScale");
    text.innerHTML = slider.value;
    
    focalScale = Number(slider.value);
    updateQuad(focusPos.h,focusPos.w);
    destroyLinecharts();
    initLinecharts();
    updateLinecharts(focusPos.h,focusPos.w);
    if(style_flag=="STEP") {
        updateMaskSprite();
    }
}
function contextLength_sliderHandle() {
    let text = document.getElementById("contextLength-text");
    let slider = document.getElementById("contextLength");
    text.innerHTML = slider.value;

    contextRadius = Math.floor(Number(slider.value)/2);
    updateQuad(focusPos.h,focusPos.w);
    destroyLinecharts();
    initLinecharts();
    updateLinecharts(focusPos.h,focusPos.w);
    if(style_flag=="STEP") {
        initMaskSprite();
    }
};
function changeCurrentTimeHandle() {
    const backgroundTexture = createBackgroundTexture(0,0,PARA.table.h-1,PARA.table.w-1); 
    quad.shader.uniforms.uSampler2 = backgroundTexture;
    updateLinecharts(focusPos.h,focusPos.w);
}
function bodyListener(evt) {
    const mouseOnCanvas = UTILS.getMouseOnCanvas(evt);
    if(mouseOnCanvas.h<0||mouseOnCanvas.w<0||mouseOnCanvas.h>PARA.stage_pix.h||mouseOnCanvas.w>PARA.stage_pix.w) {
        restoreQuad();
        return;
    }
    //let w = Math.floor(mouseOnCanvas.w/PARA.step_pix.w);
    //let h = Math.floor(mouseOnCanvas.h/PARA.step_pix.h);
    let h,w;
    if (focusPos.h<0 || focusPos.w<0) {
        h = Math.floor(mouseOnCanvas.h/PARA.step_pix.h);
        w = Math.floor(mouseOnCanvas.w/PARA.step_pix.w);
    } else {
        w = binSearch(mouseOnCanvas.w,'w',0,PARA.table.w);
        h= binSearch(mouseOnCanvas.h,'h',0,PARA.table.h);
    }
    w = Math.max(contextRadius,Math.min(PARA.table.w-contextRadius-1,w));
    h = Math.max(contextRadius,Math.min(PARA.table.h-contextRadius-1,h));
    updateQuad(h,w);
    updateLinecharts(h,w);
    if(style_flag=="STEP") {
        updateMaskSprite();
    }
}
function setup(config) {
    focalScale = config.tablelensScale;
    contextRadius = Math.floor(config.contextLength/2);
}
function init(s) {
    style_flag = s;

    if (nodeCnt == "50") {
        focalScale = 4;
        contextRadius = 1;
    } else {
        focalScale = 8;
        contextRadius = 1;
    }


    //focalScale = scale_para.defaultValue;
    //contextRadius = Math.floor(contextLength_para.defaultValue/2);

    const backgroundTexture = createBackgroundTexture(0,0,PARA.table.h-1,PARA.table.w-1);
    quad = initGridMesh(PARA.table.h,PARA.table.w,backgroundTexture); 

    const container = new PIXI.Container();
    container.interactive = true;
    let canvas = document.createElement("canvas");
    canvas.id = "canvas";
    canvas.style.position = "absolute";
    //document.body.appendChild(canvas);
    d3.select("#canvasVis").node().appendChild(canvas);
    app = new PIXI.Application({width:PARA.stage_pix.w, height:PARA.stage_pix.h, antialias:true, view:canvas});
    app.renderer.backgroundColor = PARA.backgroundColor;
    app.stage.interactive = true;
    app.stage.addChild(container);
    container.addChild(quad);

    gridLineObj = new GridLineObject(PARA.table.h,PARA.table.w);
    updateGridLine();
    gridLineObj.addTo(container);

    initLinecharts();
    currentTime.setHandle = changeCurrentTimeHandle;

    maskSpriteContainer = new PIXI.Container();
    container.addChild(maskSpriteContainer);
    
    if(style_flag=="STEP") {
        initMaskSprite();
    }
    document.addEventListener('mousemove',bodyListener);
    
    let sliderInfo = [];
    //let scale_para = {
    //    "defaultValue":focalScale,
    //    "max":20,
    //    "min":1,
    //    "id":"tablelensScale",
    //    "oninputHandle":scale_sliderHandle
    //};
    //sliderInfo.push(scale_para);
    //let contextLength_para = {
    //    "defaultValue":contextRadius*2+1,
    //    "max":5,
    //    "min":1,
    //    "id":"contextLength",
    //    "oninputHandle":contextLength_sliderHandle
    //};
    //sliderInfo.push(contextLength_para);
    let time_para = {
        "defaultValue":currentTime.getCurrent,
        "max":timeEnd,
        "min":timeStart,
        "id":"currentTime",
        "oninputHandle":time_sliderHandle
    };
    sliderInfo.push(time_para);
    initSliders(sliderInfo);

}
export function loadTableLens_stretch(config) {
    init("STRETCH",config); 
}
export function loadTableLens_step(config) {
    init("STEP",config); 
}
export function destroyTableLens_stretch() {
    if (typeof app ==='undefined') return;
    document.removeEventListener("mousemove",bodyListener);
    app.destroy(true,true);
    clearSliders();
    destroyLinecharts();
    currentTime.setHandle = function(val){};
}
export function destroyTableLens_step() {
    if (typeof app ==='undefined') return;
    document.removeEventListener("mousemove",bodyListener);
    app.destroy(true,true);
    clearSliders();
    destroyLinecharts();
    currentTime.setHandle = function(val){};
}
