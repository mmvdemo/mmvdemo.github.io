import * as PARA from "./parameters.js";
import {createGridGeometry,createBackgroundTexture,createLineChartsTexture} from "./utils.js";
// for table lens
let focalScale = 4;
let contextRadius=0;
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
//generate background texture
const backgroundTexture = createBackgroundTexture(0,0,PARA.table.h-1,PARA.table.w-1);
const uniforms = {
    uSampler2: backgroundTexture,
};
const shader = PIXI.Shader.from(vertexSrc, fragmentSrc, uniforms);
const geometry = createGridGeometry(PARA.table.h,PARA.table.w);
var quad = new PIXI.Mesh(geometry,shader);
quad.position.set(0,0);

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
export function loadTableLens() {
    const container = new PIXI.Container();
    container.interactive = true;
    let canvas = document.getElementById("mycanvas");
    let app = new PIXI.Application({width:PARA.stage_pix.w, height:PARA.stage_pix.h, antialias:true, view:canvas});
    app.renderer.backgroundColor = PARA.backgroundColor;
    app.stage.interactive = true;
    app.stage.addChild(container);
    container.addChild(quad);
    canvas.addEventListener('mousemove',function(evt) {
        const rect = canvas.getBoundingClientRect();
        const mouseOnCanvas = {'h':evt.clientY-rect.top-container.y,'w':evt.clientX-rect.left-container.x};
        //let w = Math.floor(mouseOnCanvas.w/PARA.step_pix.w);
        //let h = Math.floor(mouseOnCanvas.h/PARA.step_pix.h);
        let w = binSearch(mouseOnCanvas.w,'w',0,PARA.table.w);
        let h= binSearch(mouseOnCanvas.h,'h',0,PARA.table.h);
        console.log(`h=${h},w=${w}`);
        if(w<0||h<0||w>=PARA.table.w+1||h>=PARA.table.h+1) {
            return;
        }
        updateQuad(h,w);
    });
}
