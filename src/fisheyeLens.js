import * as PARA from "./parameters.js";
import * as UTILS from "./utils.js";
import {time_sliderHandle,initSliders,clearSliders} from "./slider.js";
import {createBackgroundTexture} from "./texture.js";
import {getMeshPos,initGridMesh,initMesh,restoreGridMesh} from "./mesh.js";
import {GridLineObject} from "./gridLines.js";
import {initSingleLinechart,updateSingleLinechart,destroyLinecharts,hideLinecharts} from "./linechart.js";
import {highlightManager} from "./highlight.js";
import {mouseTracker} from "./tracking.js";

let contextRadius = 1; 
let distort = {'h':9,'w':9};
let d = 5;
let distort_pix = {'h':distort.h*PARA.step_pix.h,'w':distort.w*PARA.step_pix.w};
let app;
let backgroundQuad,quad;
let backgroundGridLineObj,lensGridLineObj;
let container,lensContainer,lensGridLineContainer;
let style_flag;

function createFisheyeGeometry() {
    const pos_list = [],pos_list_uv = [],index_list=[];
    const f = {'h':distort.h/2,'w':distort.w/2};
    for(let h=0;h<=distort.h;h++) {
        for(let w=0;w<=distort.w;w++) {
            const result = getPolarPosition(h,w,f); 
            const pos = result.pos_pix;
            pos_list.push(pos.w);
            pos_list.push(pos.h);
            pos_list_uv.push(w/distort.w);
            pos_list_uv.push(h/distort.h);
        }
    }
    for(let h=0;h<distort.h;h++) {
        for(let w=0;w<distort.w;w++) {
            if((h<Math.floor(distort.h/2)&&w<Math.floor(distort.w/2))||(h>=Math.floor(distort.h/2)&&w>=Math.floor(distort.w/2))) {
                index_list.push(h*(distort.w+1)+w);
                index_list.push(h*(distort.w+1)+w+1);
                index_list.push((h+1)*(distort.w+1)+w+1);
                
                index_list.push(h*(distort.w+1)+w);
                index_list.push((h+1)*(distort.w+1)+w);
                index_list.push((h+1)*(distort.w+1)+w+1);
            } else {
                index_list.push(h*(distort.w+1)+w);
                index_list.push(h*(distort.w+1)+w+1);
                index_list.push((h+1)*(distort.w+1)+w);
                
                index_list.push(h*(distort.w+1)+w+1);
                index_list.push((h+1)*(distort.w+1)+w);
                index_list.push((h+1)*(distort.w+1)+w+1);
            }
        }
    }
    const geometry = new PIXI.Geometry()
                    .addAttribute('aVertexPosition',pos_list,2)
                    .addAttribute('aUvs',pos_list_uv,2)
                    .addIndex(index_list);
    return geometry;
};
function bufferIndex(h,w) {return h*(distort.w+1)+w;};
function h1(x) {return 1-(d+1)*x/(d*x+1);};
function h2(x) {return (d+1)*x/(d*x+1);};
function getPolarPosition(h,w,f) {
    const f_pix = {'h':f['h']*PARA.step_pix.h,'w':f['w']*PARA.step_pix.w};
    let beta_buf = {};
    if(f.h>h) {
        beta_buf['horizontal'] =(f.h-h)/f.h;
    } else {
        if(f.h==distort.h) {
            beta_buf['horizontal'] = 0;
        }else {
            beta_buf['horizontal'] = (h-f.h)/(distort.h-f.h);
        }
    }
    if (f.w>w) {
        beta_buf['vertical'] = (f.w-w)/f.w;
    } else {
        if(f.w==distort.w){
            beta_buf['vertical'] = 0;
        } else {
            beta_buf['vertical'] = (w-f.w)/(distort.w-f.w);
        }
    }
    const dir = beta_buf['horizontal']>beta_buf['vertical']?'horizontal':'vertical';
    let beta = Math.max(beta_buf['horizontal'],beta_buf['vertical']);
    //let scale = h1(beta);
    //let pos = {
    //    'h':h*PARA.step_pix.h+ scale*(h*PARA.step_pix.h-f_pix['h']),
    //    'w':w*PARA.step_pix.w+ scale*(w*PARA.step_pix.w-f_pix['w'])
    //};
    let scale = h2(beta);
    let pos_pix;
    if(beta==0) {
        pos_pix = {'h':h*PARA.step_pix.h,'w':w*PARA.step_pix.w}; 
    } else {
        pos_pix = {
            'h':(f.h+ scale*(h-f.h)/beta)*PARA.step_pix.h,
            'w':(f.w+ scale*(w-f.w)/beta)*PARA.step_pix.w
        };
    }
    return {'pos_pix':pos_pix,'dir':dir};
}
function getFocusInQuad(s,h,w) {
    const f = {
        'h':distort.h/2,
        'w':distort.w/2
    };
    if(s==="OUTSIDE") {
        return f;
    }
    const frame = {'h':(distort.h)/2,'w':(distort.w)/2}; 
    const lensOrigin = getLensOrigin(s,h,w);
    f.w = w-lensOrigin.w;
    f.h = h-lensOrigin.h;
    if(f.w==0) {
    } else if(f.w==distort.w-1) {
        f.w+=1;
    } else {
        f.w+=0.5
    }
    if(f.h==0) {
    } else if(f.h==distort.h-1) {
        f.h+=1;
    } else {
        f.h+=0.5;
    }

    return f;
}
function getLensOrigin(s,h,w) {
    let lensOrigin;
    if(s==="INSIDE") {
        lensOrigin = {
            'h':Math.min(PARA.table.h-distort.h,Math.max(0,h-Math.floor(distort.h/2))),
            'w':Math.min(PARA.table.w-distort.w,Math.max(0,w-Math.floor(distort.w/2)))
        }; 
    } else if(s==="OUTSIDE") {
        lensOrigin = {
            'h':h-Math.floor(distort.h/2),
            'w':w-Math.floor(distort.w/2)
        };
    } else {
        lensOrigin = {};
    }
    return lensOrigin;
}
function searchMousePosition(mouselocal) {
    let pos = {'h':-1,'w':-1};
    const buffer = quad.geometry.getBuffer('aVertexPosition');
    for(let i=0;i<distort.h;i++) {
        for(let j=0;j<distort.w;j++) {
            // use rectangle to approximate grid's shape under distortion
            let pos1 = {
                'h':buffer.data[2*bufferIndex(i,j)+1],
                'w':buffer.data[2*bufferIndex(i,j)]
            };
            let pos2 = {
                'h':buffer.data[2*bufferIndex(i+1,j+1)+1],
                'w':buffer.data[2*bufferIndex(i+1,j+1)]
            };
            if(mouselocal.h>pos1.h&&mouselocal.h<pos2.h&&mouselocal.w>pos1.w&&mouselocal.w<pos2.w) {
                pos.h=i;
                pos.w=j;
                return pos;
            }
        }
    }
    pos.h = Math.floor(mouselocal.h/PARA.step_pix.h);
    pos.w = Math.floor(mouselocal.w/PARA.step_pix.w);
    return pos;
}
function getBoundingBox(pos1,pos2,pos3,pos4) {
    const box = {};
    box.pos1 = {};
    box.pos2 = {};
    box.pos1.h = Math.min(pos1.h,pos2.h,pos3.h,pos4.h);
    box.pos1.w = Math.min(pos1.w,pos2.w,pos3.w,pos4.w);

    box.pos2.h = Math.max(pos1.h,pos2.h,pos3.h,pos4.h);
    box.pos2.w = Math.max(pos1.w,pos2.w,pos3.w,pos4.w);
    return box
}
function alignFocusGrid(f) {
    const buffer = quad.geometry.getBuffer('aVertexPosition');
    f.h = Math.min(distort.h-1,Math.floor(f.h));
    f.w = Math.min(distort.w-1,Math.floor(f.w));
    const pos1 = {'h':buffer.data[2*bufferIndex(f.h,f.w)+1],'w':buffer.data[2*bufferIndex(f.h,f.w)]};
    const pos2 = {'h':buffer.data[2*bufferIndex(f.h,f.w+1)+1],'w':buffer.data[2*bufferIndex(f.h,f.w+1)]};
    const pos3 = {'h':buffer.data[2*bufferIndex(f.h+1,f.w)+1],'w':buffer.data[2*bufferIndex(f.h+1,f.w)]};
    const pos4 = {'h':buffer.data[2*bufferIndex(f.h+1,f.w+1)+1],'w':buffer.data[2*bufferIndex(f.h+1,f.w+1)]};
    
    const focusBox = getBoundingBox(pos1,pos2,pos3,pos4);
    buffer.data[2*bufferIndex(f.h,f.w)+1] = focusBox.pos1.h;
    buffer.data[2*bufferIndex(f.h,f.w)] = focusBox.pos1.w;
    buffer.data[2*bufferIndex(f.h,f.w+1)+1] = focusBox.pos1.h;
    buffer.data[2*bufferIndex(f.h,f.w+1)] = focusBox.pos2.w;
    buffer.data[2*bufferIndex(f.h+1,f.w)+1] = focusBox.pos2.h;
    buffer.data[2*bufferIndex(f.h+1,f.w)] = focusBox.pos1.w;
    buffer.data[2*bufferIndex(f.h+1,f.w+1)+1] = focusBox.pos2.h;
    buffer.data[2*bufferIndex(f.h+1,f.w+1)] = focusBox.pos2.w;
    buffer.update();
}
function alignGrids(bound) {
    const buffer = quad.geometry.getBuffer("aVertexPosition");
    const pos_pix = [];
    for(let i=2;i<4;i++) {
        for(let j=0;j<2;j++) {
            const idx = bufferIndex(bound[i],bound[j]);
            pos_pix.push({'h':buffer.data[2*idx+1],'w':buffer.data[2*idx]});
        }
    }
    const bound_pix = [];
    // TODO: min?max?
    bound_pix.push(Math.min(pos_pix[0].w,pos_pix[2].w));
    bound_pix.push(Math.max(pos_pix[1].w,pos_pix[3].w));
    bound_pix.push(Math.min(pos_pix[0].h,pos_pix[1].h));
    bound_pix.push(Math.max(pos_pix[2].h,pos_pix[3].h));
    ////console.log(bound);
    const length = {'left_right':bound[1]-bound[0],'up_down':bound[3]-bound[2]};
    for(let i=bound[2];i<=bound[3];i++) {
        const h = bound_pix[2]+(i-bound[2])*(bound_pix[3]-bound_pix[2])/(length.up_down);
        for(let j=bound[0];j<=bound[1];j++) {
            const w = bound_pix[0]+(j-bound[0])*(bound_pix[1]-bound_pix[0])/(length.left_right);
            buffer.data[2*bufferIndex(i,j)+1] = h;
            buffer.data[2*bufferIndex(i,j)] = w;
        }
    }
    buffer.update();
}
function correctFlip() {
    const buffer = quad.geometry.getBuffer('aVertexPosition');
    for(let i=0;i<distort.h;i++) {
        for(let j=0;j<distort.w;j++) {
            const index = [2*bufferIndex(i,j),2*bufferIndex(i,j+1),2*bufferIndex(i+1,j),2*bufferIndex(i+1,j+1)];
            if(buffer.data[index[0]]>buffer.data[index[1]]) {
                [buffer.data[index[0]],buffer.data[index[1]]]=[buffer.data[index[1]],buffer.data[index[0]]];
            }
            if(buffer.data[index[2]]>buffer.data[index[3]]) {
                [buffer.data[index[2]],buffer.data[index[3]]]=[buffer.data[index[3]],buffer.data[index[2]]];
            }
            if(buffer.data[index[0]+1]>buffer.data[index[2]+1]) {
                [buffer.data[index[0]+1],buffer.data[index[2]+1]]=[buffer.data[index[2]+1],buffer.data[index[0]+1]];
            }
            if(buffer.data[index[1]+1]>buffer.data[index[3]+1]) {
                [buffer.data[index[1]+1],buffer.data[index[3]+1]]=[buffer.data[index[3]+1],buffer.data[index[1]+1]];
            }
        }
    }
    buffer.update();
}
function updateQuad_inside(h,w) {
    quad.visible = true;
    currentPos={'h':h,'w':w};
    focusPos = {...currentPos};
    const lensOrigin = getLensOrigin("INSIDE",h,w);;
    const bgTexture = createBackgroundTexture(lensOrigin.h,lensOrigin.w,lensOrigin.h+distort.h-1,lensOrigin.w+distort.w-1);
    quad.shader.uniforms.uSampler2 = bgTexture;
    lensContainer.position.set(lensOrigin.w * PARA.step_pix.w,lensOrigin.h * PARA.step_pix.h);
    const f = getFocusInQuad("INSIDE",h,w); 
    const buffer = quad.geometry.getBuffer('aVertexPosition');
    const dirMatrix = [];
    //console.log(`----------------------`);
    //console.log(f);
    for(let i=0;i<=distort.h;i++) {
        let row = "";
        for(let j=0;j<=distort.w;j++) {
            const result = getPolarPosition(i,j,f); 
            const pos_pix = result.pos_pix;
            dirMatrix.push(result.dir);
            row+=`${result.dir[0]} `;
            buffer.data[2*bufferIndex(i,j)+1] =pos_pix.h;
            buffer.data[2*bufferIndex(i,j)] =pos_pix.w;
        }
        //console.log(row);
    }
    //console.log(`----------------------`);
    buffer.update();
    //alignFocusGrid(f);
    const bound = getPlateBound(f,dirMatrix);
    alignGrids(bound);
    //correctFlip();
    highlightManager.updateAll();
    updateLensGridLine();
};
function getPlateBound(f,dirMatrix) {
    f.h = Math.min(distort.h-1,Math.floor(f.h));
    f.w = Math.min(distort.w-1,Math.floor(f.w));
    const hori = [];
    const vert = [];
    for(let i=0;i<=distort.h;i++) {
        let bounds = [];
        for(let j=0;j<distort.w;j++) {
            if(dirMatrix[i*(distort.w+1)+j]!==dirMatrix[i*(distort.w+1)+j+1]) {
                bounds.push(j);
            }
        }
        if(bounds.length==0) {
            if(Math.abs(i-f.h)<=contextRadius) {
                const fw = Math.min(distort.w-contextRadius, Math.max(contextRadius,f.w));
                bounds.push(fw-contextRadius);
                bounds.push(fw+contextRadius);
                //bounds.push(f.w-contextRadius);bounds.push(f.w+contextRadius)
            }
            else {bounds.push(-1);bounds.push(distort.w+1);}
        } else if(bounds.length==1) {
            if(f.w>distort.w/2) {
                bounds.push(distort.w);
            } else {
                bounds = [0].concat(bounds);
            }
        }
        //console.log(bounds);
        hori.push(bounds);
    }

    for(let j=0;j<=distort.w;j++) {
        const bounds = [];
        for(let i=0;i<distort.h;i++) {
            if(dirMatrix[i*(distort.h+1)+j]!==dirMatrix[(i+1)*(distort.h+1)+j]) {bounds.push(i);}
        }
        if(bounds.length==0) {
            if(Math.abs(j-f.w)<=contextRadius) {bounds.push(f.h);bounds.push(f.h);}
            else {bounds.push(-1);bounds.push(distort.h+1);}
        }
        vert.push(bounds);
    }
    function getBound(array,side_flag) {
        const ans = [-1,-1];
        let last_dis = side_flag==="left_right"?distort.w+3:distort.h+3;
        const iter_side = side_flag==="left_right"?'h':'w';
        for(let i=0;i<=distort[iter_side];i++) {
            const dis = array[i][1]-array[i][0];
            if(ans[0]<0 && dis<last_dis && dis<=2*contextRadius+1) {
                ans[0]=i;
            } else if(ans[1]<0 && dis>last_dis && dis>2*contextRadius+1) {
                ans[1]=i-1;
            }
            last_dis = dis;
        }
        return ans;
    }
    const left_right_bound = getBound(hori,'left_right');
    //console.log(`left_right_bound:`);
    //console.log(left_right_bound);
    const up_down_bound = [Math.min(hori[left_right_bound[0]][0],hori[left_right_bound[1]][0]),Math.max(hori[left_right_bound[0]][1],hori[left_right_bound[1]][1])];
    //const up_down_bound = getBound(vert,'up_down');
    const bound = up_down_bound.concat(left_right_bound);
    
    //console.log(`up_down_bound:`);
    //console.log(up_down_bound);
    //console.log(`bound:`);
    //console.log(bound);
    return bound;
}
function getVerticePositionsByGrid(pos1,pos2) {
    const quadSize = {'h':PARA.table.h+1,'w':PARA.table.w+1};
    const array = getMeshPos(backgroundQuad,quadSize,pos1,{'h':pos2.h+1,'w':pos2.w+1}); 
    const lensMeshSize = {'h':distort.h+1,'w':distort.w+1};
    const lensArray = getMeshPos(quad,lensMeshSize,{'h':0,'w':0},lensMeshSize);
    const lensOrigin = getLensOrigin(style_flag,focusPos.h,focusPos.w);
    function inLens(h,w) {return h>=lensOrigin.h&&h<=lensOrigin.h+distort.h&&w>=lensOrigin.w&&w<=lensOrigin.w+distort.w;}
    for(let i=pos1.h;i<=pos2.h+1;i++) {
        for(let j=pos1.w;j<=pos2.w+1;j++) {
            if(inLens(i,j)) {
                array[i-pos1.h][j-pos1.w].h = lensContainer.position.y+lensArray[i-lensOrigin.h][j-lensOrigin.w].h;
                array[i-pos1.h][j-pos1.w].w = lensContainer.position.x+lensArray[i-lensOrigin.h][j-lensOrigin.w].w;
            }
        }
    }
    return array;
}
function updateBackgroundGridLine() {
    const buffer = backgroundQuad.geometry.getBuffer('aVertexPosition');
    function getIndex(h,w) {return h*(PARA.table.w+1)+w;}
    const hori=[],vert=[];
    for(let i=0;i<PARA.table.h+1;i++) {hori.push(buffer.data[2*getIndex(i,0)+1]);}
    for(let j=0;j<PARA.table.w+1;j++) {vert.push(buffer.data[2*getIndex(0,j)]);}
    backgroundGridLineObj.updatePosByLine(hori,vert);
}
function updateLensGridLine() {
    const posArray_pix = getMeshPos(quad,{'h':distort.h+1,'w':distort.w+1},{'h':0,'w':0},{'h':distort.h+1,'w':distort.w+1});
    lensGridLineObj.updatePosByVertice(posArray_pix);
}
function updateQuad_outside(h,w) {
    quad.visible = true;
    currentPos = {'h':h,'w':w};
    focusPos = {...currentPos};
    const lensOrigin =getLensOrigin("OUTSIDE",h,w);
    const bgTexture = createBackgroundTexture(lensOrigin.h,lensOrigin.w,lensOrigin.h+distort.h-1,lensOrigin.w+distort.w-1);
    quad.shader.uniforms.uSampler2 = bgTexture;
    lensContainer.position.set(lensOrigin.w * PARA.step_pix.w,lensOrigin.h * PARA.step_pix.h);
    highlightManager.updateAll();
}
function initLinecharts() {
    //initSingleLinechart(0,0);
    for(let i=0;i<=2*contextRadius;i++) {
        for(let j=0;j<=2*contextRadius;j++) {
            initSingleLinechart(i,j);
        }
    }
}
function updateLinecharts(h,w) {
    const focus = getFocusInQuad(style_flag,h,w);
    focus.h = Math.min(distort.h-1,Math.floor(focus.h));
    focus.w = Math.min(distort.w-1,Math.floor(focus.w));
    const center = {
        'h':Math.floor(distort.h/2),
        'w':Math.floor(distort.w/2)
    };
    const focusIdx={'h':h,'w':w};
    if(focus.h<contextRadius) {
        const delta = contextRadius-focus.h;
        focus.h+=delta;
        focusIdx.h+=delta;
    } else if(focus.h+contextRadius>=distort.h) {
        const delta = focus.h-(distort.h-1-contextRadius);
        focus.h-=delta;
        focusIdx.h-=delta;
    }
    if(focus.w<contextRadius) {
        const delta = contextRadius-focus.w;
        focus.w+=delta;
        focusIdx.w+=delta;
    } else if(focus.w+contextRadius>=distort.w) {
        const delta = focus.w-(distort.w-1-contextRadius);
        focus.w-=delta;
        focusIdx.w-=delta;
    }
    let cr = Math.min(contextRadius,Math.floor((distort.h-1)/2));
    const lensOrigin = getLensOrigin(style_flag,h,w);
    const canvas = document.getElementById("canvas");
    const rect = canvas.getBoundingClientRect();
    const translate = {
        'h':lensOrigin.h*PARA.step_pix.h+rect.top+window.scrollY+container.y,
        'w':lensOrigin.w*PARA.step_pix.w+rect.left+window.scrollX+container.x
    };
    const buffer = quad.geometry.getBuffer('aVertexPosition');
    for(let i=0;i<=2*cr;i++) {
        for(let j=0;j<=2*cr;j++) {
            const local = {
                'h':focus.h-cr+i,
                'w':focus.w-cr+j
            };
            const width = {
                'left':Math.max(buffer.data[2*bufferIndex(local.h,local.w)],buffer.data[2*bufferIndex(local.h+1,local.w)]),
                'right':Math.min(buffer.data[2*bufferIndex(local.h,local.w+1)],buffer.data[2*bufferIndex(local.h+1,local.w+1)])
            };
            const height = {
                'up':Math.max(buffer.data[2*bufferIndex(local.h,local.w)+1],buffer.data[2*bufferIndex(local.h,local.w+1)+1]),
                'down':Math.min(buffer.data[2*bufferIndex(local.h+1,local.w)+1],buffer.data[2*bufferIndex(local.h+1,local.w+1)+1])
            };
            const grid_pix = {
                'h':height.down-height.up,
                'w':width.right-width.left
            };
            const pos = {
                'h':focusIdx.h-cr+i,
                'w':focusIdx.w-cr+j
            };
            const pos_pix = {
                'h':height.up,
                'w':width.left
            };
            pos_pix.h +=translate.h; 
            pos_pix.w +=translate.w;
            updateSingleLinechart(i,j,pos,grid_pix,pos_pix);
        }
    }
}

function distort_sliderHandle() {
    let text = document.getElementById("distort-text");
    let slider = document.getElementById("distort");
    text.innerHTML = slider.value;
    distort.h = Number(slider.value);
    distort.w = Number(slider.value);
    const geometry = createFisheyeGeometry();
    quad.geometry = geometry;
    lensGridLineObj.destroy(lensGridLineContainer);
    lensGridLineObj = new GridLineObject(distort.h,distort.w);
    lensGridLineObj.addTo(lensGridLineContainer);
    if(style_flag==="INSIDE") {
        updateQuad_inside(focusPos.h,focusPos.w);
    } else if(style_flag==="OUTSIDE") {
        updateQuad_outside(focusPos.h,focusPos.w);
    }
    destroyLinecharts();
    initLinecharts();
    updateLinecharts(focusPos.h,focusPos.w);
};
function d_sliderHandle() {
    let text = document.getElementById("d-text");
    let slider = document.getElementById("d");
    text.innerHTML = slider.value;
    d = Number(slider.value);
    const geometry = createFisheyeGeometry();
    quad.geometry = geometry;
    if(style_flag==="INSIDE") {
        updateQuad_inside(focusPos.h,focusPos.w);
    } else if(style_flag==="OUTSIDE") {
        updateQuad_outside(focusPos.h,focusPos.w);
    }
    destroyLinecharts();
    initLinecharts();
    updateLinecharts(focusPos.h,focusPos.w);
};
function changeCurrentTimeHandle() {
    const backgroundTexture = createBackgroundTexture(0,0,PARA.table.h-1,PARA.table.w-1);
    backgroundQuad.shader.uniforms.uSampler2=backgroundTexture;
    if(style_flag==="INSIDE") {
        updateQuad_inside(focusPos.h,focusPos.w);
    } else if(style_flag==="OUTSIDE") {
        updateQuad_outside(focusPos.h,focusPos.w);
    }
    destroyLinecharts();
    initLinecharts();
    updateLinecharts(focusPos.h,focusPos.w);
}
function bodyListener(evt) {
    const mouseOnCanvas = UTILS.getMouseOnCanvas(evt);
    if(mouseOnCanvas.w<0||mouseOnCanvas.h<0||mouseOnCanvas.w>PARA.stage_pix.w+2*container.x||mouseOnCanvas.h>PARA.stage_pix.h+2*container.y){
        quad.visible = false;
        lensGridLineObj.setVisibility(false);
        hideLinecharts();
        return;
    }
    lensGridLineObj.setVisibility(true);  
    mouseOnCanvas.h -= container.y;
    mouseOnCanvas.w -= container.x;
    let w = Math.floor((mouseOnCanvas.w)/PARA.step_pix.w);
    let h = Math.floor((mouseOnCanvas.h)/PARA.step_pix.h);
     
    if((focusPos.h>=0&&focusPos.w>=0)&&(Math.abs(h-focusPos.h)<=Math.floor(distort.h/2))&&(Math.abs(w-focusPos.w)<=Math.floor(distort.w/2))) {
        const lensOrigin = getLensOrigin(style_flag,focusPos.h,focusPos.w);

        let mouselocal = {
            'h':mouseOnCanvas.h-lensOrigin.h*PARA.step_pix.h,
            'w':mouseOnCanvas.w-lensOrigin.w*PARA.step_pix.w
        };
        let pos = searchMousePosition(mouselocal); 
        w = pos.w+lensOrigin.w;
        h = pos.h+lensOrigin.h;
    }
    w = Math.max(0,Math.min(PARA.table.w-1,w)); 
    h = Math.max(0,Math.min(PARA.table.h-1,h));
    ////console.log(`h = ${h}, w = ${w}`);
    if(style_flag==="INSIDE") {
        updateQuad_inside(h,w);
    } else if (style_flag==="OUTSIDE") {
        updateQuad_outside(h,w); 
    }
    updateLinecharts(h,w);
}

function init(s) {
    style_flag = s;
    

    distort_pix = {'h':distort.h*PARA.step_pix.h,'w':distort.w*PARA.step_pix.w};
    let EP = (s==="OUTSIDE") ? Math.max(distort_pix.h,distort_pix.w)/2:0;

    const canvas = document.createElement("canvas");
    canvas.id = "canvas";
    canvas.style.position = "absolute";
    document.body.appendChild(canvas);
    app = new PIXI.Application({width:PARA.stage_pix.w+EP, height:PARA.stage_pix.h+EP, antialias:true, view:canvas});
    app.renderer.backgroundColor = PARA.backgroundColor;
    app.stage.interactive = true;

    const backgroundTexture = createBackgroundTexture(0,0,PARA.table.h-1,PARA.table.w-1);
    backgroundQuad = initGridMesh(PARA.table.h,PARA.table.w,backgroundTexture); 
    backgroundGridLineObj = new GridLineObject(PARA.table.h,PARA.table.w);
    updateBackgroundGridLine();

    const geometry = createFisheyeGeometry(); 
    quad = initMesh(geometry,backgroundTexture);
    lensGridLineObj = new GridLineObject(distort.h,distort.w);
    updateLensGridLine();

    container = new PIXI.Container();
    container.position.set(EP/2,EP/2);
    lensContainer = new PIXI.Container();
    lensGridLineContainer = new PIXI.Container();
    container.addChild(backgroundQuad);
    backgroundGridLineObj.addTo(container);
    lensGridLineObj.addTo(lensGridLineContainer);
    lensContainer.addChild(quad);
    lensContainer.addChild(lensGridLineContainer);
    container.addChild(lensContainer);
    app.stage.addChild(container);   

    initLinecharts();
    currentTime.setHandle = changeCurrentTimeHandle;

    document.addEventListener('mousemove',bodyListener);

    let sliderInfo = [];
    //let distort_para = {
    //    "defaultValue":distort.h,
    //    "max":50,
    //    "min":1,
    //    "id":"distort",
    //    "oninputHandle":distort_sliderHandle
    //};
    //sliderInfo.push(distort_para);
    //let d_para = {
    //    "defaultValue":d,
    //    "max":16,
    //    "min":1,
    //    "id":"d",
    //    "oninputHandle":d_sliderHandle
    //};
    //sliderInfo.push(d_para);
    let time_para = {
        "defaultValue":currentTime.getCurrent,
        "max":timeEnd,
        "min":timeStart,
        "id":"currentTime",
        "oninputHandle":time_sliderHandle
    };
    sliderInfo.push(time_para);
    initSliders(sliderInfo);

    highlightManager.registerGetPosHandle(getVerticePositionsByGrid);
    highlightManager.loadTo(container);

    //mouseTracker.start();
    //// for debug
    //setTimeout(function() {
    //    mouseTracker.pause();
    //},PARA.DEBUG_recordingTimeout*1000);
}
export function loadFisheyeLens_inside() {
    init("INSIDE");
}
export function loadFisheyeLens_outside() {
    init("OUTSIDE");
}
export function destroyFisheyeLens_inside() {
    lensGridLineObj.destroy(lensGridLineContainer);
    document.removeEventListener("mousemove",bodyListener);
    app.destroy(true,true);
    clearSliders();
    destroyLinecharts();
    highlightManager.unregisterGetPosHandle();
}
export function destroyFisheyeLens_outside() {
    lensGridLineObj.destroy(lensGridLineContainer);
    document.removeEventListener("mousemove",bodyListener);
    app.destroy(true,true);
    clearSliders();
    destroyLinecharts();
    highlightManager.unregisterGetPosHandle();
}
