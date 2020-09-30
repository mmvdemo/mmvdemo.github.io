import * as PARA from "./parameters.js";
import {initDotTexture,updateSingleLineChart,createSingleLineChart,createGridGeometry,createBackgroundTexture,initSliders,clearSliders} from "./utils.js";
let d=10;
let focusPos = {'w':-1,'h':-1};
let quad;
let app;
let linechart;
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
};
function updateLineCharts(h,w) {
    const buffer = quad.geometry.getBuffer('aVertexPosition');
    let grid_pix = {
        'h':buffer.data[2*bufferIndex(h+1,w)+1]-buffer.data[2*bufferIndex(h,w)+1],
        'w':buffer.data[2*bufferIndex(h,w+1)]-buffer.data[2*bufferIndex(h,w)]
    };
    let pos = {'h':h,'w':w};
    let pos_pix = {
        'h':buffer.data[2*bufferIndex(h,w)+1],
        'w':buffer.data[2*bufferIndex(h,w)]
    };
    updateSingleLineChart(linechart,grid_pix,pos);
    linechart.position.set(pos_pix.w,pos_pix.h);
    linechart.visible = true;
}

function d_sliderHandle() {
    let text = document.getElementById("d-text");
    let slider = document.getElementById("d");
    text.innerHTML = slider.value;

    d = Number(slider.value);
    updateQuad(focusPos.h,focusPos.w);
    updateLineCharts(focusPos.h,focusPos.w);
};
function changeCurrentTimeHandle() {
    const backgroundTexture = createBackgroundTexture(0,0,PARA.table.h-1,PARA.table.w-1);
    quad.shader.uniforms.uSampler2 = backgroundTexture; 
}
export function loadCartesianLens() {
    let sliderInfo = [];
    let d_para = {
        "defaultValue":10,
        "max":20,
        "min":1,
        "id":"d",
        "oninputHandle":d_sliderHandle
    };
    sliderInfo.push(d_para);
    initSliders(sliderInfo);

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
    let canvas = document.createElement("canvas");
    document.body.appendChild(canvas);
    app = new PIXI.Application({width:PARA.stage_pix.w, height:PARA.stage_pix.h, antialias:true, view:canvas});
    app.renderer.backgroundColor = PARA.backgroundColor;
    app.stage.interactive = true;
    app.stage.addChild(container);
    container.addChild(quad);

    initDotTexture(app.renderer);
    linechart = createSingleLineChart(changeCurrentTimeHandle);
    linechart.visible = false;
    container.addChild(linechart);

    canvas.addEventListener('mousemove',function(evt) {
        const rect = canvas.getBoundingClientRect();
        const mouseOnCanvas = {'h':evt.clientY-rect.top-container.y,'w':evt.clientX-rect.left-container.x};
        let h,w;
        if(focusPos.h<0 || focusPos.w<0) {
            w = Math.floor(mouseOnCanvas.w/PARA.step_pix.w);
            h = Math.floor(mouseOnCanvas.h/PARA.step_pix.h);
        } else {
            w = binSearch(mouseOnCanvas.w,'w',0,PARA.table.w);
            h = binSearch(mouseOnCanvas.h,'h',0,PARA.table.h);
        }
        //console.log(`h=${h},w=${w}`);
        if(w<0||h<0||w>=PARA.table.w+1||h>=PARA.table.h+1) {
            return;
        }
        updateQuad(h,w);
        updateLineCharts(h,w);
    });
}
export function destroyCartesianLens() {
    app.destroy(true,true);
    clearSliders();
}
