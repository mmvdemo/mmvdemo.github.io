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
    constructor(h,w) {
        this.h = h;
        this.w = w;
        this.horiLines=[];
        this.vertLines = [];

        for(let i=0;i<=h;i++) {
            const line = this.createSingleLine("HORIZONTAL",w);
            this.horiLines.push(line);
        }
        for(let i=0;i<=w;i++) {
            const line = this.createSingleLine("VERTICAL",h);
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
            for(let j=0;j<this.w;j++) {
                updateSinglePos(i,j,array[i][j]);
            }
        }
    }

    updatePosByLine(hori,vert) {
        for(let i=0;i<=this.h;i++) {
            this.horiLines[i].position.set(0,hori[i]); 
        }
        for(let j=0;j<=this.w;j++) {
            this.vertLines[j].position.set(vert[j],0);
        }
    }
    
    //updateSinglePos(h,w,pos) {
    //    //horizontal
    //    const horiMesh = this.horiLines[h];
    //    const horiBuffer = horiMesh.geometry.getBuffer('aVertexPosition');
    //    let horiIndex = w;
    //    horiBuffer.data[2*horiIndex+1] = pos.h;
    //    horiBuffer.data[2*horiIndex]=pos.w;
    //    horiIndex = this.w+w;
    //    horiBuffer.data[2*horiIndex+1] = pos.h+1;
    //    horiBuffer.data[2*horiIndex]=pos.w;
    //    horiBuffer.update();
    //    //vertical
    //    const vertMesh = this.vertLines[w];
    //    const vertBuffer = vertMesh.geometry.getBuffer('aVertexPosition');
    //    let vertIndex=2*h;
    //    horiBuffer.data[2*vertIndex+1]=pos.h;
    //    horiBuffer.data[2*vertIndex]=pos.w;
    //    vertIndex += 1;
    //    horiBuffer.data[2*vertIndex+1]=pos.h;
    //    horiBuffer.data[2*vertIndex]=pos.w+1;
    //    vertBuffer.update();
    //}

}

