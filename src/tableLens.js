import * as PARA from "./parameters.js";
import {initDotTexture,updateSingleLineChart,createSingleLineChart,createGridGeometry,createBackgroundTexture,initSliders,clearSliders} from "./utils.js";
// for table lens
let focalScale = 10;
let contextRadius=1;
let quad;
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

let focusPos = {'w':-1,'h':-1};

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
let maskSprites = {};
let maskSpriteContainer;
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
}

function binSearch(n,s,lo,hi) {
    const sum = transfer(doi,focusPos[s],PARA.table[s]);
    while(lo<hi) {
        let mi = Math.floor((lo+hi)/2);
        if(n<transfer(doi,focusPos[s],mi)/sum*PARA.stage_pix[s]) {
            hi = mi;
        } else {
            lo = mi+1;
        }
    }
    return lo-1;
}
function bufferIndex(h,w) {return h*(PARA.table.w+1)+w;}
function updateQuad(h,w) {
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
    focusPos.h = h;
    focusPos.w = w;
    buffer.update();
};
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
        'h': buffer.data[2*bufferIndex(focusPos.h-contextRadius,focusPos.w)+1],
        'w': (focalLen.w-regLen.w)/2
    };
    len.vert_down = {
        'h': PARA.stage_pix.h-buffer.data[2*bufferIndex(focusPos.h+contextRadius+1,focusPos.w)+1],
        'w': (focalLen.w-regLen.w)/2
    };
    len.hori_left = {
        'h':(focalLen.h-regLen.h)/2,
        'w':buffer.data[2*bufferIndex(focusPos.h,focusPos.w-contextRadius)]
    };
    len.hori_right = {
        'h':(focalLen.h-regLen.h)/2,
        'w':PARA.stage_pix.w-buffer.data[2*bufferIndex(focusPos.h,focusPos.w+contextRadius+1)]
    };
    for(let i=0;i<maskSprites.vert_up.length;i+=2) {
        let sprite = maskSprites.vert_up[i];
        let position = {
            'h':buffer.data[2*bufferIndex(0,i/2+focusPos.w-contextRadius)+1],
            'w':buffer.data[2*bufferIndex(0,i/2+focusPos.w-contextRadius)]
        };
        sprite.position.set(position.w,position.h);
        sprite.scale.set(len.vert_up.w,len.vert_up.h);
        sprite = maskSprites.vert_up[i+1];
        sprite.position.set(position.w+len.vert_up.w+regLen.w,position.h);
        sprite.scale.set(len.vert_up.w,len.vert_up.h);
    }
    for(let i=0;i<maskSprites.vert_down.length;i+=2) {
        let sprite = maskSprites.vert_down[i];
        let position = {
            'h':buffer.data[2*bufferIndex(focusPos.h+contextRadius+1,i/2+focusPos.w-contextRadius)+1],
            'w':buffer.data[2*bufferIndex(focusPos.h+contextRadius+1,i/2+focusPos.w-contextRadius)]
        };
        sprite.position.set(position.w,position.h);
        sprite.scale.set(len.vert_down.w,len.vert_down.h);
        sprite = maskSprites.vert_down[i+1];
        sprite.position.set(position.w+len.vert_down.w+regLen.w,position.h);
        sprite.scale.set(len.vert_down.w,len.vert_down.h);
    }
    for(let i=0;i<maskSprites.hori_left.length;i+=2) {
        let sprite = maskSprites.hori_left[i];
        let position = {
            'h':buffer.data[2*bufferIndex(i/2+focusPos.h-contextRadius,0)+1],
            'w':buffer.data[2*bufferIndex(i/2+focusPos.h-contextRadius,0)]
        };
        sprite.position.set(position.w,position.h);
        sprite.scale.set(len.hori_left.w,len.hori_left.h);
        sprite = maskSprites.hori_left[i+1];
        sprite.position.set(position.w,position.h+len.hori_left.h+regLen.h);
        sprite.scale.set(len.hori_left.w,len.hori_left.h);
    }
    for(let i=0;i<maskSprites.hori_right.length;i+=2) {
        let sprite = maskSprites.hori_right[i];
        let position = {
            'h':buffer.data[2*bufferIndex(i/2+focusPos.h-contextRadius,focusPos.w+contextRadius+1)+1],
            'w':buffer.data[2*bufferIndex(i/2+focusPos.h-contextRadius,focusPos.w+contextRadius+1)]
        };
        sprite.position.set(position.w,position.h);
        sprite.scale.set(len.hori_right.w,len.hori_right.h);
        sprite = maskSprites.hori_right[i+1];
        sprite.position.set(position.w,position.h+len.hori_right.h+regLen.h);
        sprite.scale.set(len.hori_right.w,len.hori_right.h);
    }
}
function updateLineCharts(h,w) {
    const buffer = quad.geometry.getBuffer('aVertexPosition');
    let grid_pix = {
        'h':buffer.data[2*bufferIndex(h+1,w)+1]-buffer.data[2*bufferIndex(h,w)+1],
        'w':buffer.data[2*bufferIndex(h,w+1)]-buffer.data[2*bufferIndex(h,w)]
    };
    for(let i=0;i<2*contextRadius+1;i++) {
        for(let j=0;j<2*contextRadius+1;j++) {
            let pos = {'h':h-contextRadius+i,'w':w-contextRadius+j};
            let pos_pix = {
                'h':buffer.data[2*bufferIndex(pos.h,pos.w)+1],
                'w':buffer.data[2*bufferIndex(pos.h,pos.w)]
            };
            if(pos.h<0 || pos.h>=PARA.table.h) {
                linecharts[i][j].visible = false;
                continue;
            } else if(pos.w<0 || pos.w>=PARA.table.w) {
                linecharts[i][j].visible = false;
                continue;
            } else {
                console.log("true");
                linecharts[i][j].visible = true;
            }
            updateSingleLineChart(linecharts[i][j],grid_pix,pos);
            linecharts[i][j].position.set(pos_pix.w,pos_pix.h);
        }
    }
}
function scale_sliderHandle() {
    let text = document.getElementById("tablelensScale-text");
    let slider = document.getElementById("tablelensScale");
    text.innerHTML = slider.value;
    
    focalScale = Number(slider.value);
    updateQuad(focusPos.h,focusPos.w);
    updateLineCharts(focusPos.h,focusPos.w);
    if(style_flag=="STEP") {
        updateMaskSprite();
    }
}
function contextRadius_sliderHandle() {
    let text = document.getElementById("contextRadius-text");
    let slider = document.getElementById("contextRadius");
    text.innerHTML = slider.value;

    contextRadius = Number(slider.value);
    updateQuad(focusPos.h,focusPos.w);
    updateLineCharts(focusPos.h,focusPos.w);
    if(style_flag=="STEP") {
        initMaskSprite();
    }
};
function changeCurrentTimeHandle() {
    const backgroundTexture = createBackgroundTexture(0,0,PARA.table.h-1,PARA.table.w-1); 
    quad.shader.uniforms.uSampler2 = backgroundTexture;
}
function init(s) {
    linecharts = [];
    style_flag = s;
    let sliderInfo = [];
    let scale_para = {
        "defaultValue":10,
        "max":20,
        "min":1,
        "id":"tablelensScale",
        "oninputHandle":scale_sliderHandle
    };
    sliderInfo.push(scale_para);
    let contextRadius_para = {
        "defaultValue":1,
        "max":2,
        "min":0,
        "id":"contextRadius",
        "oninputHandle":contextRadius_sliderHandle
    };
    sliderInfo.push(contextRadius_para);
    initSliders(sliderInfo);

    focalScale = scale_para.defaultValue;
    contextRadius = contextRadius_para.defaultValue;

    const backgroundTexture = createBackgroundTexture(0,0,PARA.table.h-1,PARA.table.w-1);
    const uniforms = {
        uSampler2: backgroundTexture,
    };
    const shader = PIXI.Shader.from(vertexSrc, fragmentSrc, uniforms);
    const geometry = createGridGeometry(PARA.table.h,PARA.table.w);
    quad = new PIXI.Mesh(geometry,shader);
    quad.position.set(0,0);

    const container = new PIXI.Container();
    container.interactive = true;
    //let canvas = document.getElementById("mycanvas");
    let canvas = document.createElement("canvas");
    document.body.appendChild(canvas);
    app = new PIXI.Application({width:PARA.stage_pix.w, height:PARA.stage_pix.h, antialias:true, view:canvas});
    app.renderer.backgroundColor = PARA.backgroundColor;
    app.stage.interactive = true;
    app.stage.addChild(container);
    container.addChild(quad);

    initDotTexture(app.renderer);
    for(let i=-contextRadius;i<=contextRadius;i++) {
        let line = [];
        for(let j=-contextRadius;j<=contextRadius;j++) {
            let linechart = createSingleLineChart(changeCurrentTimeHandle);
            linechart.visible = false;
            container.addChild(linechart);
            line.push(linechart);
        }
        linecharts.push(line);
    } 

    maskSpriteContainer = new PIXI.Container();
    container.addChild(maskSpriteContainer);
    
    if(style_flag=="STEP") {
        initMaskSprite();
    }
    canvas.addEventListener('mousemove',function(evt) {
        const rect = canvas.getBoundingClientRect();
        const mouseOnCanvas = {'h':evt.clientY-rect.top-container.y,'w':evt.clientX-rect.left-container.x};
        //let w = Math.floor(mouseOnCanvas.w/PARA.step_pix.w);
        //let h = Math.floor(mouseOnCanvas.h/PARA.step_pix.h);
        let w = binSearch(mouseOnCanvas.w,'w',0,PARA.table.w);
        let h= binSearch(mouseOnCanvas.h,'h',0,PARA.table.h);
        console.log(`h=${h},w=${w}`);
        w = Math.max(contextRadius,Math.min(PARA.table.w-contextRadius-1,w));
        h = Math.max(contextRadius,Math.min(PARA.table.h-contextRadius-1,h));
        updateQuad(h,w);
        updateLineCharts(h,w);
        if(style_flag=="STEP") {
            updateMaskSprite();
        }
    });
}
export function loadTableLens_stretch() {
    init("STRETCH"); 
}
export function loadTableLens_step() {
    init("STEP"); 
}
export function destroyTableLens_stretch() {
    app.destroy(true,true);
    clearSliders();
}
export function destroyTableLens_step() {
    app.destroy(true,true);
    clearSliders();
}
