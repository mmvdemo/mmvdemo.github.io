import * as PARA from "./parameters.js";

export function rgbStrToHex(s) {
    let pat = new RegExp("\\d+","g");
    let numbers = s.match(pat);
    let color = 0x0;
    for (var i=0;i<3;i++) {
        color += Number(numbers[i])*Math.pow(256,2-i);
    }
    return color; 
}
export function createSingleColorTexture(color) {
    const rgba = new Float32Array(4);
    rgba[0] = (color>>16)/256;
    rgba[1] = ((color>>8)&((1<<8)-1))/256;
    rgba[2] = (color&((1<<8)-1))/256;
    rgba[3] = 1;
    const texture = PIXI.Texture.fromBuffer(rgba,1,1);
    return texture;
}
export function createBackgroundTexture(h1,w1,h2,w2) {
    const width = w2-w1+1;
    const height=h2-h1+1;
    const rgba = new Float32Array(width*height*4);
    for(let i=0;i<height;i++) {
        for(let j=0;j<width;j++) {
            if(i+h1<0||j+w1<0||i+h1>=PARA.table.h||j+w1>=PARA.table.w) {
                continue;
            }
            let value = getValue(currentTime.value,i+h1,j+w1);
            let colorStr = d3.interpolateGreys(value);
            let color = rgbStrToHex(colorStr);
            let idx = i*width+j;
            rgba[idx*4] = (color>>16)/256;
            rgba[idx*4+1] = ((color>>8)&((1<<8)-1))/256;
            rgba[idx*4+2] = (color&((1<<8)-1))/256;
            rgba[idx*4+3] = 1;
        }
    }   
    const texture = PIXI.Texture.fromBuffer(rgba,width,height);
    return texture;
}
