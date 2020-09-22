import * as PARA from "./parameters.js";
import {createGridGeometry,createBackgroundTexture,createLineChartsTexture} from "./utils.js";
let d=4;
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


function bufferIndex(h,w) {return h*(PARA.table.w+1)+w;}
function g1(Dmax,Dnorm) {
    let g=0;
    if(Dnorm!=0) {
        g = (d+1)/(d+Dmax/Dnorm);
    }
    return g;
}
function updateQuad(h,w) {
    const buffer = quad.geometry.getBuffer('aVertexPosition');
    for(let i=0;i<=PARA.table.h;i++) {
        for(let j=0;j<=PARA.table.w;j++) {
            let sign={},Dmax = {};
            if(i<h) {
                Dmax['h'] = h;
                sign['h'] = -1;
            } else {
                Dmax['h'] = PARA.table.h-h;
                sign['h'] = 1;
            }
            if(j<w) {
                Dmax['w'] = w;
                sign['w']=-1;
            }else {
                Dmax['w'] = (PARA.table.w-w);
                sign['w']=1;
            }
            
            let scale = {
                'w':g1(Dmax.w,Math.abs(j-w)),
                'h':g1(Dmax.h,Math.abs(i-h))};

            buffer.data[2*bufferIndex(i,j)+1] = (h+sign.h*Dmax.h*scale.h)*PARA.step_pix.h;
            buffer.data[2*bufferIndex(i,j)] = (w+sign.w*Dmax.w*scale.w)*PARA.step_pix.w;
        }
    }
    focusPos.h = h;
    focusPos.w = w;
    buffer.update();
};
//init app
export function loadCartesianLens() {
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
        let w = Math.floor(mouseOnCanvas.w/PARA.step_pix.w);
        let h = Math.floor(mouseOnCanvas.h/PARA.step_pix.h);
        console.log(`h=${h},w=${w}`);
        if(w<0||h<0||w>=PARA.table.w+1||h>=PARA.table.h+1) {
            return;
        }
        updateQuad(h,w);
    });
}
