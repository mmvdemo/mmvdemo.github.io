import * as PARA from "./parameters.js";
import {createGridGeometry,initGridMesh} from "./mesh.js";

let gridLineTexture;
function createGridLineTexture() {
    const rgba = new Float32Array(4);
    rgba[0] = (PARA.gridLineColor>>16)/256;
    rgba[1] = ((PARA.gridLineColor>>8)&((1<<8)-1))/256;
    rgba[2] = (PARA.gridLineColor&((1<<8)-1))/256;
    rgba[3] = 1;
    const texture = PIXI.Texture.fromBuffer(rgba,1,1);
    return texture;
}
function initGridLine() {
    gridLineTexture = createGridLineTexture(); 
    
}
initGridLine();

export class GridLineObject {
    constructor(hh,ww) {
        this.h = hh+1;
        this.w = ww+1;
        this.horiLines=[];
        this.vertLines = [];

        for(let i=0;i<this.h;i++) {
            const line = this.createSingleLine("HORIZONTAL",ww);
            this.horiLines.push(line);
        }
        for(let i=0;i<this.w;i++) {
            const line = this.createSingleLine("VERTICAL",hh);
            this.vertLines.push(line);
        }

    }

    addTo(container) {
        for(let i=0;i<this.h;i++) {container.addChild(this.horiLines[i]);}
        for(let j=0;j<this.w;j++) {container.addChild(this.vertLines[j]);}
    }

    createSingleLine(dir,gridNum) {
        let mesh;
        if(dir==="VERTICAL") {
            mesh = initGridMesh(gridNum,1,gridLineTexture,{'h':PARA.step_pix.h,'w':PARA.gridLineWidth_pix});
        } else if(dir==="HORIZONTAL") {
            mesh = initGridMesh(1,gridNum,gridLineTexture,{'h':PARA.gridLineWidth_pix,'w':PARA.step_pix.w});
        } else {
            assert(false);
        }
        return mesh;
    }

    updatePosByVertice(array) {
        for(let i=0;i<this.h;i++) {
            const mesh = this.horiLines[i];
            const buffer = mesh.geometry.getBuffer('aVertexPosition');
            for(let j=0;j<this.w;j++) {
                buffer.data[2*j+1]=array[i][j].h;
                buffer.data[2*j] = array[i][j].w;
                buffer.data[2*(j+this.w)+1] = array[i][j].h+1;
                buffer.data[2*(j+this.w)]=array[i][j].w;
            }
            buffer.update();
        }
        for(let j=0;j<this.w;j++) {
            const mesh = this.vertLines[j];
            const buffer = mesh.geometry.getBuffer('aVertexPosition');
            for(let i=0;i<this.h;i++) {
                buffer.data[2*(2*i)+1] = array[i][j].h;
                buffer.data[2*(2*i)] = array[i][j].w;
                buffer.data[2*(2*i+1)+1] = array[i][j].h;
                buffer.data[2*(2*i+1)] = array[i][j].w+1;
            }
            buffer.update();
        }
    }

    updatePosByLine(hori,vert) {
        for(let i=0;i<this.h;i++) {
            this.horiLines[i].position.set(0,hori[i]); 
        }
        for(let j=0;j<this.w;j++) {
            this.vertLines[j].position.set(vert[j],0);
        }
    }
    printHoriPos() {
        for(let i=0;i<this.h;i++) {
            const horiBuffer = this.horiLines[i].geometry.getBuffer('aVertexPosition');
            console.log(horiBuffer.data);
        }
    }
}

