import * as PARA from "./parameters.js";
import {createGridGeometry,initGridMesh} from "./mesh.js";
import {createSingleColorTexture} from "./texture.js";

let gridLineTexture;
function initGridLine() {
    gridLineTexture = createSingleColorTexture(PARA.gridLineColor); 
}
initGridLine();

export class GridLineObject {
    constructor(hh,ww,step_pix) {
        if (typeof step_pix === "undefined") step_pix = PARA.step_pix;
        this.h = hh+1;
        this.w = ww+1;
        this.horiLines=[];
        this.vertLines = [];

        for(let i=0;i<this.h;i++) {
            const line = initGridMesh(1,ww,gridLineTexture,{'h':PARA.gridLineWidth_pix,'w':step_pix.w});
            line.pivot.set(0,PARA.gridLineWidth_pix/2);
            this.horiLines.push(line);
        }
        for(let i=0;i<this.w;i++) {
            const line = initGridMesh(hh,1,gridLineTexture,{'h':step_pix.h,'w':PARA.gridLineWidth_pix});
            line.pivot.set(PARA.gridLineWidth_pix/2,0);
            this.vertLines.push(line);
        }
    }
    setColor(color) {
        const texture = createSingleColorTexture(color);
        for (let i=0;i<this.h;i++) {
            this.horiLines[i].shader.uniforms.uSampler2 = texture;
        }
        for (let i=0;i<this.w;i++) {
            this.vertLines[i].shader.uniforms.uSampler2 = texture;
        }
    }
    setScale(scale) {
        for (let i=0;i<this.h;i++) {
            this.horiLines[i].scale.set(1,scale);
        }
        for (let j=0;j<this.w;j++) {
            this.vertLines[j].scale.set(scale,1);
        }
    }
    addTo(container) {
        for(let i=0;i<this.h;i++) {container.addChild(this.horiLines[i]);}
        for(let j=0;j<this.w;j++) {container.addChild(this.vertLines[j]);}
    }
    destroy(container) {
        for(let i=0;i<container.children.length;i++) {
            container.children[i].destroy(true);
        }
        container.removeChildren();
    }
    setVisibility(visible) {
        for(let i=0;i<this.h;i++) {this.horiLines[i].visible = visible;}
        for(let j=0;j<this.w;j++) {this.vertLines[j].visible=visible;}
    }
    updatePosByVertice(array) {
        for(let i=0;i<this.h;i++) {
            const mesh = this.horiLines[i];
            const buffer = mesh.geometry.getBuffer('aVertexPosition');
            for(let j=0;j<this.w;j++) {
                buffer.data[2*j+1]=array[i][j].h-PARA.gridLineWidth_pix/2;
                buffer.data[2*j] = array[i][j].w;
                buffer.data[2*(j+this.w)+1] = array[i][j].h+PARA.gridLineWidth_pix/2;
                buffer.data[2*(j+this.w)]=array[i][j].w;
            }
            
            buffer.update();
        }
        for(let j=0;j<this.w;j++) {
            const mesh = this.vertLines[j];
            const buffer = mesh.geometry.getBuffer('aVertexPosition');
            for(let i=0;i<this.h;i++) {
                buffer.data[2*(2*i)+1] = array[i][j].h;
                buffer.data[2*(2*i)] = array[i][j].w-PARA.gridLineWidth_pix/2;
                buffer.data[2*(2*i+1)+1] = array[i][j].h;
                buffer.data[2*(2*i+1)] = array[i][j].w+PARA.gridLineWidth_pix/2;
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
}

