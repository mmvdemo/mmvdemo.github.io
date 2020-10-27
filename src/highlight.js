import * as PARA from "./parameters.js";
import {createGridGeometry,initGridMesh} from "./mesh.js";
import {createSingleColorTexture} from "./texture.js";

let highlightTexture;
function initHighlightTexture() {
    highlightTexture = createSingleColorTexture(PARA.highlightColor);
}
initHighlightTexture();

class HighlightObject {
    constructor(pos1,pos2) {
        this.pos1 = pos1;
        this.pos2 = pos2;
        this.gridNum = {};
        this.gridNum.h = Math.abs(pos2.h-pos1.h)+1;
        this.gridNum.w = Math.abs(pos2.w-pos1.w)+1;
        this.verticeNum = {'h':this.gridNum.h+1,'w':this.gridNum.w+1};
        this.topMesh = initGridMesh(1,this.gridNum.w,highlightTexture,{'h':PARA.highlightWidth_pix,'w':PARA.step_pix.w});
        this.bottom = initGridMesh(1,this.gridNum.w,highlightTexture,{'h':PARA.highlightWidth_pix,'w':PARA.step_pix.w});
        this.left = initGridMesh(this.gridNum.h,1,highlightTexture,{'h':PARA.step_pix.h,'w':PARA.highlightWidth_pix});
        this.right = initGridMesh(this.gridNum.h,1,highlightTexture,{'h':PARA.step_pix.h,'w':PARA.highlightWidth_pix});
        this.container = new PIXI.Container();
        this.container.addChild(this.topMesh);
        this.container.addChild(this.left);
        this.container.addChild(this.right);
        this.container.addChild(this.bottom);
    }
    addTo(fatherContainer) {
        fatherContainer.addChild(this.container);
    }
    removeFrom(fatherContainer) {
        fatherContainer.removeChild(this.container);
        this.container.destroy(true);
    }
    updatePosByVertice(array) {
        let buffer = this.topMesh.geometry.getBuffer('aVertexPosition');
        for(let i=0;i<this.verticeNum.w;i++) {
            buffer.data[2*i+1] = array[0][i].h;
            buffer.data[2*i] = array[0][i].w;
            buffer.data[2*(i+this.verticeNum.w)+1] = array[0][i].h+PARA.highlightWidth_pix;
            buffer.data[2*(i+this.verticeNum.w)] = array[0][i].w;
        }
        buffer.update();
        buffer = this.bottom.geometry.getBuffer('aVertexPosition');
        for(let i=0;i<this.verticeNum.w;i++) {
            buffer.data[2*i+1] = array[this.gridNum.h][i].h;
            buffer.data[2*i] = array[this.gridNum.h][i].w;
            buffer.data[2*(i+this.verticeNum.w)+1] = array[this.gridNum.h][i].h+PARA.highlightWidth_pix;
            buffer.data[2*(i+this.verticeNum.w)] = array[this.gridNum.h][i].w;
        }
        buffer.update();
        buffer = this.left.geometry.getBuffer('aVertexPosition');
        for(let i=0;i<this.verticeNum.h;i++) {
            buffer.data[2*(2*i)+1] = array[i][0].h;
            buffer.data[2*(2*i)] = array[i][0].w;
            buffer.data[2*(2*i+1)+1] = array[i][0].h;
            buffer.data[2*(2*i+1)] = array[i][0].w+PARA.highlightWidth_pix;
        }
        buffer.update();
        buffer = this.right.geometry.getBuffer('aVertexPosition');
        for(let i=0;i<this.verticeNum.h;i++) {
            buffer.data[2*(2*i)+1] = array[i][this.gridNum.w].h;
            buffer.data[2*(2*i)] = array[i][this.gridNum.w].w;
            buffer.data[2*(2*i+1)+1] = array[i][this.gridNum.w].h;
            buffer.data[2*(2*i+1)] = array[i][this.gridNum.w].w+PARA.highlightWidth_pix;
        }
        buffer.update();
    }
    equals(p1,p2) {
        function isSame(p,q) {return p.h==q.h && p.w==q.w;}
        if(isSame(p1,this.pos1)&&isSame(p2,this.pos2)) {return true;}
        else if(isSame(p2,this.pos1)&&isSame(p1,this.pos2)) {return true;}
        else {return false;}
    }
}
class HighlightManager {
    constructor() {
        this.highlightPositions = [];
        this.highlightObjects = [];
        this.getPos = function(){alert("HighlightManager uninitialized!")};
        this.container = new PIXI.Container();
        this.highlightListDiv = document.getElementById("highlightList");
    }
    registerGetPosHandle(getPositionHandle) {this.getPos = getPositionHandle;}
    unregisterGetPosHandle() {this.getPos = function(){alert("HighlightManager uninitialized!")};}
    loadTo(fatherContainer) {
        this.highlightObjects=[];
        this.container = new PIXI.Container();
        for(let i=0;i<this.highlightPositions.length;i++) {
            const positions = this.highlightPositions[i];
            const obj = new HighlightObject(positions.pos1,positions.pos2);
            this.highlightObjects.push(obj);
            obj.addTo(this.container);
        }
        this.updateAll();
        fatherContainer.addChild(this.container);
    }
    updateAll() {
        for(let i=0;i<this.highlightObjects.length;i++) {
            this.updateByIndex(i); 
        }
    }
    updateByIndex(n) {
        const obj = this.highlightObjects[n];
        const array = this.getPos(obj.pos1,obj.pos2);
        obj.updatePosByVertice(array);
    }
    find(pos1,pos2) {
        for(let i=0;i<this.highlightObjects.length;i++) {
            if(this.highlightObjects[i].equals(pos1,pos2)) {
                return i;
            }
        }
        return -1;
    }
    processString(s) {
        const pos = {};
        const numbers = s.match(/-?\d+/g);
        if(numbers.length!==4) {alert(`Adding highlight: gives ${numbers.length} numbers, requiring 4`);return;}
        for(let i=0;i<4;i++) {
            const num = Number(numbers[i]);
            const max = i%2==0?PARA.table.h:PARA.table.w;
            if(num<0||num>=max) {alert(`Adding highlight: ${num} out of boundary`);return;}
        }
        pos.pos1={'h':Number(numbers[0]),'w':Number(numbers[1])};
        pos.pos2={'h':Number(numbers[2]),'w':Number(numbers[3])};
        return pos;
    }
    addHighlightByString(s) {
        const pos = this.processString(s);
        if(typeof pos === "undefined") return;
        this.addHighlight(pos.pos1,pos.pos2);
    }
    removeHighlightByString(s) {
        const pos = this.processString(s);
        if(typeof pos === "undefined") return;
        this.removeHighlight(pos.pos1,pos.pos2);
    }
    getId(pos1,pos2) {
        return `(${pos1.h},${pos1.w})-(${pos2.h},${pos2.w})`;
    }
    addHighlight(pos1,pos2) {
        let idx = this.find(pos1,pos2);
        if(idx>=0) {alert(`Adding highlight: highlight already exists`);return;}
        const obj = new HighlightObject(pos1,pos2);
        obj.addTo(this.container);
        this.highlightPositions.push({'pos1':pos1,'pos2':pos2});
        this.highlightObjects.push(obj);
        idx = this.highlightObjects.length-1;
        this.updateByIndex(idx);
        const text = document.createElement("p");
        text.id = this.getId(pos1,pos2);
        text.innerHTML = text.id;
        this.highlightListDiv.appendChild(text);
    }
    removeHighlight(pos1,pos2) {
        let idx = this.find(pos1,pos2);
        if(idx<0) {alert(`Adding highlight: no highlight to remove`);return;}
        this.highlightPositions.splice(idx,1);
        const obj = this.highlightObjects.splice(idx,1)[0];
        obj.removeFrom(this.container);
        const id = this.getId(pos1,pos2);
        const text = document.getElementById(id);
        this.highlightListDiv.removeChild(text);
    }
}
export let highlightManager = new HighlightManager();
