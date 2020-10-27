import * as PARA from "./parameters.js";

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

export function createGridGeometry(h,w,step_pix) {
    step_pix = (typeof step_pix !== 'undefined') ? step_pix:PARA.step_pix;
    const pos_list = [],pos_list_uv = [],index_list=[];
    for(let i=0;i<=h;i++) {
        for(let j=0;j<=w;j++) {
            pos_list.push(j*step_pix.w);
            pos_list.push(i*step_pix.h);
            pos_list_uv.push(j/w);
            pos_list_uv.push(i/h);
        }
    }
    for(let i=0;i<h;i++) {
        for(let j=0;j<w;j++) {
            if((i<Math.floor(h/2)&&j<Math.floor(w/2))||(i>=Math.floor(h/2)&&j>=Math.floor(w/2))) {
                index_list.push(i*(w+1)+j);
                index_list.push(i*(w+1)+j+1);
                index_list.push((i+1)*(w+1)+j+1);

                index_list.push(i*(w+1)+j);
                index_list.push((i+1)*(w+1)+j);
                index_list.push((i+1)*(w+1)+j+1);
            } else {
                index_list.push(i*(w+1)+j);
                index_list.push(i*(w+1)+j+1);
                index_list.push((i+1)*(w+1)+j);

                index_list.push(i*(w+1)+j+1);
                index_list.push((i+1)*(w+1)+j);
                index_list.push((i+1)*(w+1)+j+1);
            }
        }
    }
    const geometry = new PIXI.Geometry()
        .addAttribute('aVertexPosition',pos_list,2)
        .addAttribute('aUvs',pos_list_uv,2)
        .addIndex(index_list);
    return geometry;
}
export function getMeshPos(quad,quadSize,pos1,pos2) {
    if(pos1.h>pos2.h) [pos1.h,pos2.h]=[pos2.h,pos1.h];
    if(pos1.w>pos2.w) [pos1.w,pos2.w]=[pos2.w,pos1.w];
    const buffer = quad.geometry.getBuffer('aVertexPosition');
    function bufferIndex(h,w) {return h*quadSize.w+w;}
    const array = [];
    for(let i=pos1.h;i<=pos2.h;i++) {
        const row = [];
        for(let j=pos1.w;j<=pos2.w;j++) {
            const pos_pix = {};
            pos_pix.h = buffer.data[2*bufferIndex(i,j)+1];
            pos_pix.w = buffer.data[2*bufferIndex(i,j)];
            row.push(pos_pix);
        }
        array.push(row);
    }
    return array;
}
export function initGridMesh(h,w,texture,step_pix) {
    step_pix = (typeof step_pix !== 'undefined') ? step_pix:PARA.step_pix;
    const uniforms = {uSampler2:texture};
    const shader = PIXI.Shader.from(vertexSrc,fragmentSrc,uniforms);
    const geometry = createGridGeometry(h,w,step_pix);
    const quad = new PIXI.Mesh(geometry,shader);
    return quad;
}
export function initMesh(geometry,texture) {
    const uniforms = {uSampler2:texture};
    const shader = PIXI.Shader.from(vertexSrc,fragmentSrc,uniforms);
    const quad = new PIXI.Mesh(geometry,shader);
    return quad;
}

