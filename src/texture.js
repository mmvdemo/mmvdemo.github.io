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
            let colorStr = d3.interpolateYlGn(value);
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
//export function createBackgroundTexture(h1,w1,h2,w2) {
//    const width = w2-w1+1;
//    const height=h2-h1+1;
//    const rgba = new Float32Array(width*PARA.step_pix.w*height*PARA.step_pix.h*4);
//    for(let i=0;i<height*PARA.step_pix.h;i++) {
//        for(let j=0;j<width*PARA.step_pix.w;j++) {
//            let h = Math.floor(i/PARA.step_pix.h);
//            let w = Math.floor(j/PARA.step_pix.w);
//            if(h+h1<0||w+w1<0||h+h1>=PARA.table.h||w+w1>=PARA.table.w) {
//                continue;
//            }
//            let value = getValue(currentTime.value,h+h1,w+w1);
//            let colorStr = d3.interpolateYlGn(value);
//            let color = rgbStrToHex(colorStr);
//            let idx = i*width*PARA.step_pix.w+j;
//            rgba[idx*4] = (color>>16)/256;
//            rgba[idx*4+1] = ((color>>8)&((1<<8)-1))/256;
//            rgba[idx*4+2] = (color&((1<<8)-1))/256;
//            rgba[idx*4+3] = 1;
//        }
//    }
//    for(let h=0;h<height;h++) {
//        for(let j=0;j<width*PARA.step_pix.w;j++) {
//            let w = Math.floor(j/PARA.step_pix.w);
//            if(h+h1<0||w+w1<0||h+h1>=PARA.table.h||w+w1>=PARA.table.w) {
//                continue;
//            }
//            let idx = h*PARA.step_pix.h*width*PARA.step_pix.w+j;
//            idx = Math.floor(idx);
//            rgba[idx*4] = (PARA.backgroundColor>>16)/256;
//            rgba[idx*4+1] = ((PARA.backgroundColor>>8)&((1<<8)-1))/256;
//            rgba[idx*4+2] = (PARA.backgroundColor&((1<<8)-1))/256;
//
//        }
//    }
//    for(let i=0;i<height*PARA.step_pix.h;i++) {
//        for(let w=0;w<width;w++) {
//            let h = Math.floor(i/PARA.step_pix.h);
//            if(h+h1<0||w+w1<0||h+h1>=PARA.table.h||w+w1>=PARA.table.w) {
//                continue;
//            }
//            let idx = i*width*PARA.step_pix.w+w*PARA.step_pix.w;
//            idx = Math.floor(idx);
//            rgba[idx*4] = (PARA.backgroundColor>>16)/256;
//            rgba[idx*4+1] = ((PARA.backgroundColor>>8)&((1<<8)-1))/256;
//            rgba[idx*4+2] = (PARA.backgroundColor&((1<<8)-1))/256;
//        }
//    }
//       
//    const texture = PIXI.Texture.fromBuffer(rgba,width*PARA.step_pix.w,height*PARA.step_pix.h);
//    return texture;
//}
