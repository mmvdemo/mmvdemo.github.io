import * as PARA from "./parameters.js";
import {createBackgroundTexture,time_sliderHandle,initSliders,clearSliders} from "./utils.js";
import {initSingleLinechart,updateSingleLinechart,destroyLinecharts} from "./linechart.js";

let distort = {'h':25,'w':25};
let focusPos = {'h':-1,'w':-1};
let d = 4;
let distort_pix = {'h':distort.h*PARA.step_pix.h,'w':distort.w*PARA.step_pix.w};
let quad,backgroundSprite;
let app;
let container;
let style_flag;

const vertexSrc = `

    precision mediump float;

    attribute vec2 aVertexPosition;
    attribute vec2 aUvs;

    uniform mat3 translationMatrix;
    uniform mat3 projectionMatrix;

    varying vec2 vUvs;

    void main() {
        vUvs = aUvs;
        gl_Position = vec4((projectionMatrix * translationMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);

        }`;

const fragmentSrc = `

    precision mediump float;

    varying vec2 vUvs;

    uniform sampler2D uSampler2;

    void main() {
        gl_FragColor = texture2D(uSampler2, vUvs);
                }`;

function createFisheyeGeometry() {
    const pos_list = [],pos_list_uv = [],index_list=[];
    const f = {'h':distort.h/2,'w':distort.w/2};
    for(let h=0;h<=distort.h;h++) {
        for(let w=0;w<=distort.w;w++) {
            let pos = getPolarPosition(h,w,f); 
            pos_list.push(pos.w);
            pos_list.push(pos.h);
            pos_list_uv.push(w/distort.w);
            pos_list_uv.push(h/distort.h);
        }
    }
    for(let h=0;h<distort.h;h++) {
        for(let w=0;w<distort.w;w++) {
            if((h<Math.floor(distort.h/2)&&w<Math.floor(distort.w/2))||(h>=Math.floor(distort.h/2)&&w>=Math.floor(distort.w/2))) {
                index_list.push(h*(distort.w+1)+w);
                index_list.push(h*(distort.w+1)+w+1);
                index_list.push((h+1)*(distort.w+1)+w+1);
                
                index_list.push(h*(distort.w+1)+w);
                index_list.push((h+1)*(distort.w+1)+w);
                index_list.push((h+1)*(distort.w+1)+w+1);
            } else {
                index_list.push(h*(distort.w+1)+w);
                index_list.push(h*(distort.w+1)+w+1);
                index_list.push((h+1)*(distort.w+1)+w);
                
                index_list.push(h*(distort.w+1)+w+1);
                index_list.push((h+1)*(distort.w+1)+w);
                index_list.push((h+1)*(distort.w+1)+w+1);
            }
        }
    }
    const geometry = new PIXI.Geometry()
                    .addAttribute('aVertexPosition',pos_list,2)
                    .addAttribute('aUvs',pos_list_uv,2)
                    .addIndex(index_list);
    return geometry;
};
function bufferIndex(h,w) {return h*(distort.w+1)+w;};
function h1(x) {return 1-(d+1)*x/(d*x+1);};
function h2(x) {return (d+1)*x/(d*x+1);};
function getPolarPosition(h,w,f) {
    const f_pix = {'h':f['h']*PARA.step_pix.h,'w':f['w']*PARA.step_pix.w};
    let beta_buf = {};
    if(f.h>h) {
        beta_buf['horizontal'] =(f.h-h)/f.h;
    } else {
        beta_buf['horizontal'] = (h-f.h)/(distort.h-f.h);
    }
    if (f.w>w) {
        beta_buf['vertical'] = (f.w-w)/f.w;
    } else {
        beta_buf['vertical'] = (w-f.w)/(distort.w-f.w);
    }
    let beta = Math.max(beta_buf['horizontal'],beta_buf['vertical']);
    //let scale = h1(beta);
    //let pos = {
    //    'h':h*PARA.step_pix.h+ scale*(h*PARA.step_pix.h-f_pix['h']),
    //    'w':w*PARA.step_pix.w+ scale*(w*PARA.step_pix.w-f_pix['w'])
    //};
    let scale = h2(beta);
    let pos_pix;
    if(beta==0) {
        pos_pix = {'h':h*PARA.step_pix.h,'w':w*PARA.step_pix.w}; 
    } else {
        pos_pix = {
            'h':(f.h+ scale*(h-f.h)/beta)*PARA.step_pix.h,
            'w':(f.w+ scale*(w-f.w)/beta)*PARA.step_pix.w
        };
    }
    return pos_pix;
}
function getFocusInQuad(s,h,w) {
    const f = {
        'h':distort.h/2,
        'w':distort.w/2
    };
    if(s==="OUTSIDE") {
        return f;
    }
    const frame = {'h':(distort.h)/2,'w':(distort.w)/2}; 
    const lensOrigin = getLensOrigin(s,h,w);
    f.w = w-lensOrigin.w;
    f.h = h-lensOrigin.h;
    if(f.w==0) {
    } else if(f.w==distort.w-2) {
        f.w+=1;
    } else {
        f.w+=0.5
    }
    if(f.h==0) {
    } else if(f.h==distort.h-2) {
        f.h+=1;
    } else {
        f.h+=0.5;
    }
    return f;
}
function getLensOrigin(s,h,w) {
    let lensOrigin;
    if(s==="INSIDE") {
        lensOrigin = {
            'h':Math.min(PARA.table.h-distort.h+1,Math.max(0,h-Math.floor(distort.h/2))),
            'w':Math.min(PARA.table.w-distort.w+1,Math.max(0,w-Math.floor(distort.w/2)))
        }; 
    } else if(s==="OUTSIDE") {
        lensOrigin = {
            'h':h-Math.floor(distort.h/2),
            'w':w-Math.floor(distort.w/2)
        };
    } else {
        lensOrigin = {};
    }
    return lensOrigin;
}
function searchMousePosition(mouselocal) {
    let pos = {'h':-1,'w':-1};
    const buffer = quad.geometry.getBuffer('aVertexPosition');
    for(let i=0;i<distort.h;i++) {
        for(let j=0;j<distort.w;j++) {
            // use rectangle to approximate grid's shape under distortion
            let pos1 = {
                'h':buffer.data[2*bufferIndex(i,j)+1],
                'w':buffer.data[2*bufferIndex(i,j)]
            };
            let pos2 = {
                'h':buffer.data[2*bufferIndex(i+1,j+1)+1],
                'w':buffer.data[2*bufferIndex(i+1,j+1)]
            };
            if(mouselocal.h>pos1.h&&mouselocal.h<pos2.h&&mouselocal.w>pos1.w&&mouselocal.w<pos2.w) {
                pos.h=i;
                pos.w=j;
                return pos;
            }
        }
    }
    pos.h = Math.floor(mouselocal.h/PARA.step_pix.h);
    pos.w = Math.floor(mouselocal.w/PARA.step_pix.w);
    return pos;
}
function updateQuad_inside(h,w) {
    focusPos.h=h;
    focusPos.w=w;
    const lensOrigin = getLensOrigin("INSIDE",h,w);;
    const bgTexture = createBackgroundTexture(lensOrigin.h,lensOrigin.w,lensOrigin.h+distort.h-1,lensOrigin.w+distort.w-1);
    quad.shader.uniforms.uSampler2 = bgTexture;
    quad.x = lensOrigin.w * PARA.step_pix.w;
    quad.y = lensOrigin.h * PARA.step_pix.h;
    const f = getFocusInQuad("INSIDE",h,w); 
    const buffer = quad.geometry.getBuffer('aVertexPosition');
    for(let i=0;i<=distort.h;i++) {
        for(let j=0;j<=distort.w;j++) {
            let pos = getPolarPosition(i,j,f); 
            buffer.data[2*bufferIndex(i,j)+1] =pos.h;
            buffer.data[2*bufferIndex(i,j)] =pos.w;
        }
    }
    buffer.update();
};
function updateQuad_outside(h,w) {
    focusPos.h=h;
    focusPos.w=w;
    const lensOrigin =getLensOrigin("OUTSIDE",h,w);
    const bgTexture = createBackgroundTexture(lensOrigin.h,lensOrigin.w,lensOrigin.h+distort.h-1,lensOrigin.w+distort.w-1);
    quad.shader.uniforms.uSampler2 = bgTexture;
    quad.x = lensOrigin.w * PARA.step_pix.w;
    quad.y = lensOrigin.h * PARA.step_pix.h;
}
function initLinecharts() {
    initSingleLinechart(0,0);
}
function updateLinecharts(h,w) {
    const focus = getFocusInQuad("INSIDE",h,w);
    focus.h = Math.floor(focus.h);
    focus.w = Math.floor(focus.w);
    const buffer = quad.geometry.getBuffer('aVertexPosition');
    let grid_pix = {
        'h':buffer.data[2*bufferIndex(focus.h+1,focus.w)+1]-buffer.data[2*bufferIndex(focus.h,focus.w)+1],
        'w':buffer.data[2*bufferIndex(focus.h,focus.w+1)]-buffer.data[2*bufferIndex(focus.h,focus.w)]
    };
    let pos = {'h':h,'w':w};
    let pos_pix = {
        'h':buffer.data[2*bufferIndex(focus.h,focus.w)+1],
        'w':buffer.data[2*bufferIndex(focus.h,focus.w)]
    };
    const lensOrigin = getLensOrigin(style_flag,h,w);
    const canvas = document.getElementById("canvas");
    const rect = canvas.getBoundingClientRect();
    pos_pix.h += lensOrigin.h*PARA.step_pix.h+rect.top+container.y;
    pos_pix.w+=lensOrigin.w*PARA.step_pix.w+rect.left+container.x;
    updateSingleLinechart(0,0,pos,grid_pix,pos_pix);
}
function distort_sliderHandle() {
    let text = document.getElementById("distort-text");
    let slider = document.getElementById("distort");
    text.innerHTML = slider.value;
    distort.h = Number(slider.value);
    distort.w = Number(slider.value);
    const geometry = createFisheyeGeometry();
    quad.geometry = geometry;
    if(style_flag==="INSIDE") {
        updateQuad_inside(focusPos.h,focusPos.w);
    } else if(style_flag==="OUTSIDE") {
        updateQuad_outside(focusPos.h,focusPos.w);
    }
    destroyLinecharts();
    initLinecharts();
    updateLinecharts(focusPos.h,focusPos.w);
};
function d_sliderHandle() {
    let text = document.getElementById("d-text");
    let slider = document.getElementById("d");
    text.innerHTML = slider.value;
    d = Number(slider.value);
    const geometry = createFisheyeGeometry();
    quad.geometry = geometry;
    if(style_flag==="INSIDE") {
        updateQuad_inside(focusPos.h,focusPos.w);
    } else if(style_flag==="OUTSIDE") {
        updateQuad_outside(focusPos.h,focusPos.w);
    }
    destroyLinecharts();
    initLinecharts();
    updateLinecharts(focusPos.h,focusPos.w);
};
function changeCurrentTimeHandle() {
    const backgroundTexture = createBackgroundTexture(0,0,PARA.table.h-1,PARA.table.w-1);
    backgroundSprite.texture = backgroundTexture;
    if(style_flag==="INSIDE") {
        updateQuad_inside(focusPos.h,focusPos.w);
    } else if(style_flag==="OUTSIDE") {
        updateQuad_outside(focusPos.h,focusPos.w);
    }
    destroyLinecharts();
    initLinecharts();
    updateLinecharts(focusPos.h,focusPos.w);
}
function bodyListener(evt) {
    const canvas = document.getElementById("canvas");
    const rect = canvas.getBoundingClientRect();
    const mouseOnCanvas = {'h':evt.clientY-rect.top,'w':evt.clientX-rect.left};
    let w = Math.floor(mouseOnCanvas.w/PARA.step_pix.w);
    let h = Math.floor(mouseOnCanvas.h/PARA.step_pix.h);

    if(w<0||h<0||w>=PARA.table.w||h>=PARA.table.h) {
        return;
    }
    w = Math.max(0,Math.min(PARA.table.w-1,w)); 
    h = Math.max(0,Math.min(PARA.table.h-1,h)); 
    if((focusPos.h>=0&&focusPos.w>=0)&&(Math.abs(h-focusPos.h)<=Math.floor(distort.h/2))&&(Math.abs(w-focusPos.w)<=Math.floor(distort.w/2))) {
        const lensOrigin = getLensOrigin(style_flag,focusPos.h,focusPos.w);

        let mouselocal = {
            'h':mouseOnCanvas.h-lensOrigin.h*PARA.step_pix.h,
            'w':mouseOnCanvas.w-lensOrigin.w*PARA.step_pix.w
        };
        let pos = searchMousePosition(mouselocal); 
        w = pos.w+lensOrigin.w;
        h = pos.h+lensOrigin.h;
    }
    if(style_flag==="INSIDE") {
        updateQuad_inside(h,w);
    } else if (style_flag==="OUTSIDE") {
        updateQuad_outside(h,w); 
    }
    updateLinecharts(h,w);
}

function init(s) {
    style_flag = s;
    let sliderInfo = [];
    let distort_para = {
        "defaultValue":15,
        "max":50,
        "min":1,
        "id":"distort",
        "oninputHandle":distort_sliderHandle
    };
    sliderInfo.push(distort_para);
    let d_para = {
        "defaultValue":4,
        "max":16,
        "min":1,
        "id":"d",
        "oninputHandle":d_sliderHandle
    };
    sliderInfo.push(d_para);
    let time_para = {
        "defaultValue":currentTime.getCurrent,
        "max":timeEnd,
        "min":timeStart,
        "id":"currentTime",
        "oninputHandle":time_sliderHandle
    };
    sliderInfo.push(time_para);
    initSliders(sliderInfo);

    distort_pix = {'h':distort.h*PARA.step_pix.h,'w':distort.w*PARA.step_pix.w};
    let EP = 0;
    if(s==="INSIDE") {
        EP = 0;
    } else if(s==="OUTSIDE") {
        EP = Math.max(distort_pix.h,distort_pix.w)/2;
    }
    // generate background texture
    const backgroundTexture = createBackgroundTexture(0,0,PARA.table.h-1,PARA.table.w-1);
    // create background sprite
    backgroundSprite = new PIXI.Sprite(backgroundTexture);
    backgroundSprite.scale.x = PARA.step_pix.w;
    backgroundSprite.scale.y = PARA.step_pix.h;
    backgroundSprite.x=0;
    backgroundSprite.y=0;
    
    const uniforms = {
        uSampler2: backgroundTexture,
    };
    const shader = PIXI.Shader.from(vertexSrc, fragmentSrc, uniforms);
    const geometry = createFisheyeGeometry(); 
    quad = new PIXI.Mesh(geometry, shader);
    quad.position.set(0,0);
    quad.interactive = true;
   
    container = new PIXI.Container();
    container.x = EP/2;
    container.y=EP/2;
    //let canvas = document.getElementById("mycanvas");
    const canvas = document.createElement("canvas");
    canvas.id = "canvas";
    canvas.style.position = "absolute";
    document.body.appendChild(canvas);
    app = new PIXI.Application({width:PARA.stage_pix.w+EP, height:PARA.stage_pix.h+EP, antialias:true, view:canvas});
    app.renderer.backgroundColor = PARA.backgroundColor;
    app.stage.interactive = true;
    app.stage.addChild(container);   

    container.addChild(backgroundSprite);
    container.addChild(quad);

    initLinecharts();
    currentTime.setHandle = changeCurrentTimeHandle;

    document.body.addEventListener('mousemove',bodyListener);
}
export function loadFisheyeLens_inside() {
    init("INSIDE");
}
export function loadFisheyeLens_outside() {
    init("OUTSIDE");
}
export function destroyFisheyeLens_inside() {
    document.body.removeEventListener("mousemove",bodyListener);
    app.destroy(true,true);
    clearSliders();
}
export function destroyFisheyeLens_outside() {
    document.body.removeEventListener("mousemove",bodyListener);
    app.destroy(true,true);
    clearSliders();
}
