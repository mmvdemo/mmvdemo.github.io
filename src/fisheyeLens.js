import * as PARA from "./parameters.js";
import {createBackgroundTexture,createLineChartsTexture,initSliders,clearSliders} from "./utils.js";

let focal = {'h':1,'w':1};
let distort = {'h':25,'w':25};
let focusPos = {'h':-1,'w':-1};
let fisheyeScale = 9;
let d = 0.001;
let distort_pix = {'h':distort.h*PARA.step_pix.h,'w':distort.w*PARA.step_pix.w};
let quad,backgroundSprite,linechartsSprite;
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
    let scale = h1(beta);
    let pos = {
        'h':h*PARA.step_pix.h+ scale*(h*PARA.step_pix.h-f_pix['h']),
        'w':w*PARA.step_pix.w+ scale*(w*PARA.step_pix.w-f_pix['w'])
    };
    return pos;
}
function getFocusInQuad(s,h,w) {
    const f = {
        'h':distort.h/2,
        'w':distort.w/2
    };
    if(s==="OUTSIDE") {
        return f;
    }
    const frame = {'h':(distort.h-focal.h)/2,'w':(distort.w-focal.w)/2}; 
    const lensOrigin = {
        'h':Math.min(PARA.table.h-distort.h+1,Math.max(0,h-Math.floor(distort.h/2))),
        'w':Math.min(PARA.table.w-distort.w+1,Math.max(0,w-Math.floor(distort.w/2)))
    };
    if(w<=frame.w) {
        f['w'] = w-lensOrigin.w;
    } else if (w>=PARA.table.w-frame.w-1) {
        f['w'] = w-lensOrigin.w+1;
    } else {
        f['w'] = distort.w/2;
    }
    if(h<=frame.h) {
        f['h'] = h-lensOrigin.h;
    } else if(h>=PARA.table.h-frame.h-1) {
        f['h'] = h-lensOrigin.h+1;
    } else {
        f['h'] = distort.h/2;
    }
    return f;
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
    const lensOrigin = {
        'h':Math.min(PARA.table.h-distort.h+1,Math.max(0,h-Math.floor(distort.h/2))),
        'w':Math.min(PARA.table.w-distort.w+1,Math.max(0,w-Math.floor(distort.w/2)))
    };
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
    const lensOrigin = {
        'h':h-Math.floor(distort.h/2),
        'w':w-Math.floor(distort.w/2)
    };
    const bgTexture = createBackgroundTexture(lensOrigin.h,lensOrigin.w,lensOrigin.h+distort.h-1,lensOrigin.w+distort.w-1);
    quad.shader.uniforms.uSampler2 = bgTexture;
    quad.x = lensOrigin.w * PARA.step_pix.w;
    quad.y = lensOrigin.h * PARA.step_pix.h;
}
function updateLinechartsSprite(h,w) {
    let frameWidth = (distort.w-focal.w)/2;
    let frameHeight = (distort.h-focal.h)/2;
    w = Math.max(frameWidth,Math.min(w,PARA.table.w-frameWidth-1));
    h = Math.max(frameHeight,Math.min(h,PARA.table.h-frameHeight-1));
    const focalOrigin = [(distort.w-focal.w*fisheyeScale)/2*PARA.step_pix.w,(distort.h-focal.w*fisheyeScale)/2*PARA.step_pix.h];
    
    let startW = w-Math.floor(distort.w/2);
    let startH = h-Math.floor(distort.h/2);
    let innerW = w-Math.floor(focal.w/2);
    let innerH = h-Math.floor(focal.h/2);
    let linechartsTexture = createLineChartsTexture(PARA.step_pix.h*fisheyeScale,PARA.step_pix.w*fisheyeScale,innerH,innerW,innerH+focal.h-1,innerW+focal.w-1);
    linechartsSprite.texture = linechartsTexture;
    linechartsSprite.x = startW*PARA.step_pix.w+focalOrigin[0];
    linechartsSprite.y = startH*PARA.step_pix.h+focalOrigin[1];
    linechartsSprite.h=h;
    linechartsSprite.w = w;
};
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
};
let app;
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
        "defaultValue":1,
        "max":10,
        "min":1,
        "id":"d",
        "oninputHandle":d_sliderHandle
    };
    sliderInfo.push(d_para);
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
    
    //line chart sprite
    linechartsSprite = new PIXI.Sprite();
    linechartsSprite.scale.x=1/PARA.linechartsTextureScale;
    linechartsSprite.scale.y=1/PARA.linechartsTextureScale;
    linechartsSprite.h = Math.floor(distort.h/2);
    linechartsSprite.w = Math.floor(distort.w/2);

    const uniforms = {
        uSampler2: backgroundTexture,
    };
    const shader = PIXI.Shader.from(vertexSrc, fragmentSrc, uniforms);
    const geometry = createFisheyeGeometry(); 
    quad = new PIXI.Mesh(geometry, shader);
    quad.position.set(0,0);
    quad.interactive = true;
   
    const container = new PIXI.Container();
    container.x = EP/2;
    container.y=EP/2;
    //let canvas = document.getElementById("mycanvas");
    let canvas = document.createElement("canvas");
    document.body.appendChild(canvas);
    app = new PIXI.Application({width:PARA.stage_pix.w+EP, height:PARA.stage_pix.h+EP, antialias:true, view:canvas});
    app.renderer.backgroundColor = PARA.backgroundColor;
    app.stage.interactive = true;
    app.stage.addChild(container);   

    container.addChild(backgroundSprite);
    container.addChild(quad);
    canvas.addEventListener('mousemove',function(evt) {
        const rect = canvas.getBoundingClientRect();
        const mouseOnCanvas = {'h':evt.clientY-rect.top-container.y,'w':evt.clientX-rect.left-container.x};
        let w = Math.floor(mouseOnCanvas.w/PARA.step_pix.w);
        let h = Math.floor(mouseOnCanvas.h/PARA.step_pix.h);

        if(w<0||h<0||w>=PARA.table.w||h>=PARA.table.h) {
            return;
        }
        w = Math.max(0,Math.min(PARA.table.w-1,w)); 
        h = Math.max(0,Math.min(PARA.table.h-1,h)); 
        if((focusPos.h>=0&&focusPos.w>=0)&&(Math.abs(h-focusPos.h)<=Math.floor(distort.h/2))&&(Math.abs(w-focusPos.w)<=Math.floor(distort.w/2))) {
            const lensOrigin = {};
            if(s==="INSIDE") {
                lensOrigin.h = Math.min(PARA.table.h-distort.h+1,Math.max(0,focusPos.h-Math.floor(distort.h/2)));
                lensOrigin.w = Math.min(PARA.table.w-distort.w+1,Math.max(0,focusPos.w-Math.floor(distort.w/2)));
            } else if(s==="OUTSIDE") {
                lensOrigin.h=focusPos.h-Math.floor(distort.h/2);
                lensOrigin.w=focusPos.w-Math.floor(distort.w/2);
            }
            
            let mouselocal = {
                'h':mouseOnCanvas.h-lensOrigin.h*PARA.step_pix.h,
                'w':mouseOnCanvas.w-lensOrigin.w*PARA.step_pix.w
            };
            let pos = searchMousePosition(mouselocal); 
            w = pos.w+lensOrigin.w;
            h = pos.h+lensOrigin.h;
        }
        if(s==="INSIDE") {
            updateQuad_inside(h,w);
        } else if (s==="OUTSIDE") {
            updateQuad_outside(h,w); 
        }
        //updateLinechartsSprite(h,w);
    });
    //container.addChild(linechartsSprite);
}
export function loadFisheyeLens_inside() {
    init("INSIDE");
}
export function loadFisheyeLens_outside() {
    init("OUTSIDE");
}
export function destroyFisheyeLens_inside() {
    app.destroy(true,true);
    clearSliders();
}
export function destroyFisheyeLens_outside() {
    app.destroy(true,true);
    clearSliders();
}
