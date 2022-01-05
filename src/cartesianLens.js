import * as PARA from "./parameters.js";
import * as UTILS from "./utils.js";
import {time_sliderHandle,initSliders,clearSliders} from "./slider.js";
import {getMeshPos,initGridMesh,restoreGridMesh} from "./mesh.js";
import {createBackgroundTexture} from "./texture.js";
import {GridLineObject} from "./gridLines.js";
import {initSingleLinechart,updateSingleLinechart,destroyLinecharts,hideLinecharts} from "./linechart.js";
// parameters
// The range of cells that are showing line charts. (There are (2*${contextRadius}+1)^2 line charts in total.)
let contextRadius = 1;
// Degree of magnification. 
let d=3.5;

let quad;
let gridLineObj;
let app;

function bufferIndex(h,w) {return h*(PARA.table.w+1)+w;}
function g1(Dmax,Dnorm) {
    let g=0;
    if(Dnorm!=0) {
        g = (d+1)/(d+Dmax/Dnorm);
    }
    return g;
}
function getCartesianPosition(s,foc,x) {
    let sign,Dmax;
    if(x<foc) {
        Dmax = foc;
        sign = -1;
    } else {
        Dmax = PARA.table[s]-foc;
        sign = 1;
    }
    let scale = g1(Dmax,Math.abs(x-foc));
    return (foc+sign*Dmax*scale)*PARA.step_pix[s];
}
function binSearch(n,s,lo,hi) {
    while(lo<hi) {
        let mi = Math.floor((lo+hi)/2);
        if(n<getCartesianPosition(s,focusPos[s],mi)) {
            hi=mi;
        } else {
            lo = mi+1;
        }
    }
    return lo-1;
}
function updateQuad(h,w) {
    currentPos.h=h;
    currentPos.w=w;
    focusPos.h = h>PARA.table.h/2?h+1:h;
    focusPos.w = w>PARA.table.w/2?w+1:w;

    const buffer = quad.geometry.getBuffer('aVertexPosition');
    for(let i=0;i<=PARA.table.h;i++) {
        for(let j=0;j<=PARA.table.w;j++) {
            buffer.data[2*bufferIndex(i,j)+1] = getCartesianPosition('h',focusPos.h,i);
            buffer.data[2*bufferIndex(i,j)] = getCartesianPosition('w',focusPos.w,j);
        }
    }
    buffer.update();
    updateGridLine();
};
function restoreQuad() {
    focusPos.h = -1; focusPos.w = -1;
    restoreGridMesh(quad,PARA.table,PARA.step_pix);
    updateGridLine();
    hideLinecharts();
};
function updateGridLine() {
    //according to current quad
    const buffer = quad.geometry.getBuffer('aVertexPosition');

    const hori=[],vert=[];
    for(let i=0;i<PARA.table.h+1;i++) {hori.push(buffer.data[2*bufferIndex(i,0)+1]);}
    for(let j=0;j<PARA.table.w+1;j++) {vert.push(buffer.data[2*bufferIndex(0,j)]);}
    gridLineObj.updatePosByLine(hori,vert);
}
function getVerticePositionsByGrid(pos1,pos2) {
    const quadSize = {'h':PARA.table.h+1,'w':PARA.table.w+1};
    const array = getMeshPos(quad,quadSize,pos1,{'h':pos2.h+1,'w':pos2.w+1});
    return array;
}
function initLinecharts() {
    for(let i=0;i<=2*contextRadius;i++) {
        for(let j=0;j<=2*contextRadius;j++) {
            initSingleLinechart(i,j);
        }
    }
}
function updateLinecharts(h,w) {
    const canvas = document.getElementById("canvas");
    const rect = canvas.getBoundingClientRect();
    const translate = {
        'h':rect.top+window.scrollY,
        'w':rect.left+window.scrollX
    };
    const buffer = quad.geometry.getBuffer('aVertexPosition');
    const focusIdx = {'h':h,'w':w};
    if(focusIdx.h<contextRadius) {
        focusIdx.h = contextRadius;
    }else if(focusIdx.h+contextRadius>=PARA.table.h) {
        focusIdx.h = PARA.table.h-1-contextRadius;
    }
    if(focusIdx.w<contextRadius) {
        focusIdx.w = contextRadius;
    }else if(focusIdx.w+contextRadius>=PARA.table.w) {
        focusIdx.w = PARA.table.w-1-contextRadius;
    }
    for(let i=0;i<=2*contextRadius;i++) {
        for(let j=0;j<=2*contextRadius;j++) {
            const pos = {
                'h':focusIdx.h-contextRadius+i,
                'w':focusIdx.w-contextRadius+j
            };
            const grid_pix = {
                'h':buffer.data[2*bufferIndex(pos.h+1,pos.w)+1]-buffer.data[2*bufferIndex(pos.h,pos.w)+1],
                'w':buffer.data[2*bufferIndex(pos.h,pos.w+1)]-buffer.data[2*bufferIndex(pos.h,pos.w)]
            };
            const pos_pix = {
                'h':buffer.data[2*bufferIndex(pos.h,pos.w)+1],
                'w':buffer.data[2*bufferIndex(pos.h,pos.w)]
            };
            pos_pix.h+=translate.h;
            pos_pix.w+=translate.w;
            updateSingleLinechart(i,j,pos,grid_pix,pos_pix);
        }
    }
}
function d_sliderHandle(value) {
    let text = document.getElementById("d-text");
    text.innerHTML = `${value}`;
    d = Number(value);
    if (Object.keys(currentPos).length==0 ){
        return;
    }

    //updateQuad(currentPos.h,currentPos.w);
    //destroyLinecharts();
    //initLinecharts();
    //updateLinecharts(currentPos.h,currentPos.w);
};
function contextLength_sliderHandle(value) {
    let text = document.getElementById("contextLength-text");
    text.innerHTML = value;

    contextRadius = Math.floor(Number(value)/2);
    
    //updateQuad(currentPos.h,currentPos.w);
    destroyLinecharts();
    initLinecharts();
    //updateLinecharts(currentPos.h,currentPos.w);
    
};
function changeCurrentTimeHandle() {
    const backgroundTexture = createBackgroundTexture(0,0,PARA.table.h-1,PARA.table.w-1);
    quad.shader.uniforms.uSampler2 = backgroundTexture; 
    if (Object.keys(currentPos).length==0) {
        return;
    }
    updateLinecharts(currentPos.h,currentPos.w);
}
function bodyListener(evt) {
    const mouseOnCanvas = UTILS.getMouseOnCanvas(evt); 
    if(mouseOnCanvas.h<0||mouseOnCanvas.w<0||mouseOnCanvas.h>PARA.stage_pix.h||mouseOnCanvas.w>PARA.stage_pix.w) {
        restoreQuad();
        return;
    }
    let h,w;
    if(focusPos.h<0 || focusPos.w<0) {
        w = Math.floor(mouseOnCanvas.w/PARA.step_pix.w);
        h = Math.floor(mouseOnCanvas.h/PARA.step_pix.h);
    } else {
        w = binSearch(mouseOnCanvas.w,'w',0,PARA.table.w);
        h = binSearch(mouseOnCanvas.h,'h',0,PARA.table.h);
    }
    //if(w<0||h<0||w>=PARA.table.w+1||h>=PARA.table.h+1) {return;}
    //currentPos.h=h;
    //currentPos.w=w;
    //if(freeze) return;
    //focusPos.h = h>PARA.table.h/2?h+1:h;
    //focusPos.w = w>PARA.table.w/2?w+1:w;
    updateQuad(h,w);
    //console.log("bodyListener",currentPos.h,currentPos.w)
    updateLinecharts(h,w);
}

export function loadCartesianLens() {
    
    if (nodeCnt == "50") {
        d = 3.5;
    } else {
        d = 7.5;
    }
    
    const backgroundTexture = createBackgroundTexture(0,0,PARA.table.h-1,PARA.table.w-1);
    quad = initGridMesh(PARA.table.h,PARA.table.w,backgroundTexture); 
    
    const container = new PIXI.Container();
    container.interactive = true;
    container.addChild(quad);
    const canvas = document.createElement("canvas");
    canvas.id = "canvas";
    canvas.style.position = "absolute";
    d3.select('#canvasVis').node().appendChild(canvas);
    app = new PIXI.Application({width:PARA.stage_pix.w, height:PARA.stage_pix.h, antialias:true, view:canvas});
    app.renderer.backgroundColor = PARA.backgroundColor;
    app.stage.interactive = true;
    app.stage.addChild(container);

    gridLineObj = new GridLineObject(PARA.table.h,PARA.table.w);
    updateGridLine(); 
    gridLineObj.addTo(container);

    initLinecharts();
    currentTime.setHandle = changeCurrentTimeHandle;
    
    document.addEventListener('mousemove',bodyListener);
    
    let sliderInfo = [];
    
    let time_para = {
        "defaultValue":currentTime.value,
        "max":timeEnd,
        "min":timeStart,
        "id":"currentTime",
        "displayName": "Current Time",
        "step":1,
        "oninputHandle":time_sliderHandle
    };
    sliderInfo.push(time_para);
    let d_para = {
        "defaultValue":d,
        "max":10,
        "min":1,
        "id":"d",
        "displayName":"Parameter d",
        "step":0.5,
        "oninputHandle":d_sliderHandle
    };
    sliderInfo.push(d_para);
    
    let contextLength_para = {
        "defaultValue":contextRadius*2+1,
        "max":7,
        "min":1,
        "id":"contextLength",
        "displayName":"Context Length",
        "step":2,
        "oninputHandle":contextLength_sliderHandle
    };
    sliderInfo.push(contextLength_para);
    initSliders(sliderInfo);

}
export function destroyCartesianLens() {
    if ( typeof app==="undefined") return;
    document.removeEventListener("mousemove",bodyListener);
    app.destroy(true,true);
    clearSliders();
    destroyLinecharts();
    currentTime.setHandle = function(val){};
}
