const nodeCnt = 15;

//const timeStart = 2012, timeEnd = 2019;
//color
const backgroundColor = 0x707B7C;
const headColor = 0x85C1E9; 
const nodeColor = 0x1ABC9C;
const selectColor = 0xE74C3C;
const lineColorDark = 0x2E4053;
const lineColorLight = 0xF0EDE4;
//parameters
const stageWidth_pix = 800, stageHeight_pix = 800;
const tableWidth = nodeCnt, tableHeight = nodeCnt;
const stepWidth_pix = stageWidth_pix/tableWidth,stepHeight_pix = stageHeight_pix/tableHeight;
const focalScale = 150/stepWidth_pix;
const linechartsTextureScale = 2;
const maxScale = 1.5;
const chartRatio=0.8;
const nodeRadius =0.2;
const EP = 0;
//random data
const data= {};
for(let t=timeStart;t<=timeEnd;t++) {
    let matrix = [];
    for(let i=0;i<tableHeight;i++) {
        matrix.push(d3.range(tableWidth).map(Math.random));
    }
    data[t] = matrix;
}
let focalWidth = 1, focalHeight = 1;
let distortWidth=15,distortHeight=15;
let fisheyeScale = 9;
let distortWidth_pix=distortWidth*stepWidth_pix,distortHeight_pix=distortHeight*stepHeight_pix;
const focalScaleSlider = document.getElementById("focal_scale");
const focalScaleText = document.getElementById("focal_scale_text");
const focalRangeSlider = document.getElementById("focal_range");
const focalRangeText = document.getElementById("focal_range_text");
const distortRangeSlider = document.getElementById("distort_range");
const distortRangeText = document.getElementById("distort_range_text");
focalScaleText.innerHTML = focalScaleSlider.value;
fisheyeScale = Number(focalScaleSlider.value);

focalRangeText.innerHTML = focalRangeSlider.value;
focalWidth = Number(focalRangeSlider.value);
focalHeight = Number(focalRangeSlider.value);

distortRangeText.innerHTML = distortRangeSlider.value;
distortWidth = Number(distortRangeSlider.value);
distortHeight = Number(distortRangeSlider.value);
let geometry = updateGeometry(h=Math.floor(distortHeight/2),w=Math.floor(distortWidth/2));
focalScaleSlider.oninput = function() {
    focalScaleText.innerHTML = this.value;
    fisheyeScale = Number(this.value);
    geometry = updateGeometry(h=linechartsSprite.h,w=linechartsSprite.w);
    quad.geometry = geometry;
    updateLinechartsSprite(h=linechartsSprite.h,w=linechartsSprite.w);
};
focalRangeSlider.oninput = function() {
    focalRangeText.innerHTML = this.value;
    focalWidth = Number(this.value);
    if(focalWidth%2==0) focalWidth+=1;
    focalHeight = focalWidth;
    geometry = updateGeometry(h=linechartsSprite.h,w=linechartsSprite.w);
    quad.geometry = geometry;
    updateLinechartsSprite(h=linechartsSprite.h,w=linechartsSprite.w);
}
distortRangeSlider.oninput = function() {
    distortRangeText.innerHTML = this.value;
    distortWidth = Number(this.value);
    if(distortWidth%2==0) distortWidth+=1;
    distortHeight = distortWidth;
    distortWidth_pix=distortWidth*stepWidth_pix;
    distortHeight_pix=distortHeight*stepHeight_pix;
    geometry = updateGeometry(h=linechartsSprite.h,w=linechartsSprite.w);
    quad.geometry = geometry;
    updateLinechartsSprite(h=linechartsSprite.h,w=linechartsSprite.w);
}

function getValue(timeIdx,h,w) {
    return data[timeIdx][h][w];
    const value =data[timeIdx][h][destinations[w]];
    if(value.length==0) {
        return 0;
    } else {
        const ans = Number(value)/maxValue;
        return ans;
    }
}
function rgbStrToHex(s) {
    let pat = new RegExp("\\d+","g");
    let numbers = s.match(pat);
    let color = 0x0;
    for (var i=0;i<3;i++) {
        color += Number(numbers[i])*Math.pow(256,2-i);
    }
    return color; 
}

// generate background texture
function createBackgroundTexture(h1,w1,h2,w2) {
    const width = w2-w1+1;
    const height=h2-h1+1;
    const rgba = new Float32Array(width*height*4);
    for(let i=0;i<height;i++) {
        for(let j=0;j<width;j++) {
            if(i+h1<0||j+w1<0||i+h1>=tableHeight||j+w1>=tableWidth) {
                continue;
            }
            let value = getValue(timeEnd,i+h1,j+w1);
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

const backgroundTexture = createBackgroundTexture(0,0,tableHeight-1,tableWidth-1);
//line chart texture
function createLineChartsSvg(gridH,gridW,h1,w1,h2,w2) {
    gridH = gridH*linechartsTextureScale;
    gridW = gridW*linechartsTextureScale;
    const svg = d3.create("svg")
                    .attr("width",gridW*(w2-w1+1))
                    .attr("height",gridH*(h2-h1+1));
    const chartHeight = gridH*chartRatio;
    const chartWidth = gridW*chartRatio;
    const originW = (gridW-chartWidth)/2;
    const originH = (gridH-chartHeight)/2;
    for(let i=Math.max(h1,0);i<=Math.min(h2,tableHeight-1);i++) {
        for(let j=Math.max(w1,0);j<=Math.min(w2,tableWidth-1);j++) {
            
            let translateW = (j-w1)*gridW;
            let translateH = (i-h1)*gridH;
            let xScale = d3.scaleLinear()
                .domain([timeStart,timeEnd])
                .range([0, chartWidth]); 

            let yScale = d3.scaleLinear()
                .domain([0, 1])  
                .range([chartHeight, 0]);  

            let line = d3.line()
                .x(function(d) { return xScale(d.time); })
                .y(function(d) { return yScale(d.value); });

            let dataset = d3.range(timeStart,timeEnd+1).map(function(d) { return {"time":d, "value": getValue(d,i,j) } });
            let stroke = lineColorDark;
            if(dataset[timeEnd-timeStart].value>0.5) stroke = lineColorLight;

            let chartGroup = svg.append("g")
                                .attr("transform",`translate(${translateW+originW},${translateH+originH})`)
                                .attr("stroke","#"+stroke.toString(16));
            chartGroup.append("g")
                .attr("class", "x axis")
                .attr("transform", `translate(0,${chartHeight})`)
                .call(d3.axisBottom(xScale).ticks(timeEnd-timeStart+1))
                .selectAll("text")
                    .attr("transform", "translate(-10,5)rotate(-45)")
                    .style("text-anchor", "end")
                    .style("font-size", 6)

            chartGroup.append("g")
                .attr("class", "y axis")
                .call(d3.axisLeft(yScale));

            chartGroup.append("path")
                .datum(dataset)  
                .attr("d", line)
                .attr("fill","none")
                .attr("stroke-width",2);

            chartGroup.selectAll(".dot")
                .data(dataset)
                .enter().append("circle")
                .attr("fill","#"+stroke.toString(16))
                .attr("class", "dot") 
                .attr("cx", function(d) { return xScale(d.time) })
                .attr("cy", function(d) { return yScale(d.value) })
                .attr("r", 1.5)
                .on("mouseover", function(a, b, c) { 
                })
        }
    }
    return svg;
}
function createLineChartsTexture(gridH,gridW,h1,w1,h2,w2) {
    let svg = createLineChartsSvg(gridH,gridW,h1,w1,h2,w2);
    let svgStr = svgToBase64(svg);
    let texture = PIXI.Texture.from(svgStr);
    return texture;
}
function svgToBase64(svg) {
    let svgStr = new XMLSerializer().serializeToString(svg.node());
    let image64 = `data:image/svg+xml;base64,${btoa(svgStr)}`;
    return image64;
}
//init app
const container = new PIXI.Container();
container.x = EP/2;
container.y=EP/2;
let canvas = document.getElementById("mycanvas");
let app = new PIXI.Application({width:stageWidth_pix+EP, height:stageHeight_pix+EP, antialias:true, view:canvas});
app.renderer.backgroundColor = backgroundColor;
//document.body.appendChild(app.view);
app.stage.interactive = true;
app.stage.addChild(container);

const backgroundSprite = new PIXI.Sprite(backgroundTexture);
backgroundSprite.scale.x = stepWidth_pix;
backgroundSprite.scale.y = stepHeight_pix;
backgroundSprite.x=0;
backgroundSprite.y=0;
//container.addChild(backgroundSprite);

var linechartsSprite = new PIXI.Sprite();
linechartsSprite.scale.x=1/linechartsTextureScale;
linechartsSprite.scale.y=1/linechartsTextureScale;
linechartsSprite.h = Math.floor(distortHeight/2);
linechartsSprite.w = Math.floor(distortWidth/2);

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

const uniforms = {
    uSampler2: backgroundTexture,
};

const shader = PIXI.Shader.from(vertexSrc, fragmentSrc, uniforms);

var quad = new PIXI.Mesh(geometry, shader);
quad.position.set(0,0);
quad.interactive = true;
canvas.addEventListener('mousemove',function(evt) {
    const rect = canvas.getBoundingClientRect();
    let x_canvas = evt.clientX-rect.left-container.x;
    let y_canvas = evt.clientY-rect.top-container.y;
    //let w = Math.floor(x_canvas/stepWidth_pix);
    //let h = Math.floor(y_canvas/stepHeight_pix);
    let w = x_canvas/stepWidth_pix;
    let h = y_canvas/stepHeight_pix;
    //let w_num = Math.floor(w);
    //let h_num = Math.floor(h);
    if(w<0||h<0||w>=tableWidth||h>=tableHeight) {
        return;
    }
    let frameWidth = (distortWidth-focalWidth)/2;
    let frameHeight = (distortHeight-focalHeight)/2;
    let startW = w-Math.floor(distortWidth/2);
    let startH = h-Math.floor(distortHeight/2);
    
    if (w<=frameWidth ||h<=frameHeight || w>=tableWidth-frameWidth-1||h>=tableHeight-frameHeight-1) {
        geometry = updateGeometry(h=h,w=w);
        quad.geometry = geometry;
    }
    h = Math.floor(h);
    w = Math.floor(w);
    updateLinechartsSprite(h,w);
});

function updateGeometry(h,w) {
    const frameWidth = (distortWidth-focalWidth)/2;
    const frameHeight = (distortHeight-focalHeight)/2;
    
    const focalOrigin_uv =[frameWidth/distortWidth,frameHeight/distortHeight]; 
    const focalWidth_uv=focalWidth/distortWidth,focalHeight_uv=focalHeight/distortHeight;
    const innerRec_uv = [focalOrigin_uv[0],focalOrigin_uv[1],
        focalOrigin_uv[0]+focalWidth_uv,focalOrigin_uv[1],
        focalOrigin_uv[0]+focalWidth_uv,focalOrigin_uv[1]+focalHeight_uv,
        focalOrigin_uv[0],focalOrigin_uv[1]+focalHeight_uv];

    const focalOrigin = [(distortWidth-focalWidth*fisheyeScale)/2*stepWidth_pix,(distortHeight-focalWidth*fisheyeScale)/2*stepHeight_pix];
    const innerRec = [focalOrigin[0],focalOrigin[1],
        focalOrigin[0]+focalWidth*fisheyeScale*stepWidth_pix,focalOrigin[1],
        focalOrigin[0]+focalWidth*fisheyeScale*stepWidth_pix,focalOrigin[1]+focalHeight*fisheyeScale*stepHeight_pix,
        focalOrigin[0],focalOrigin[1]+focalHeight*fisheyeScale*stepHeight_pix
    ];
    //const pos_list= [0,0,
    //            distortWidth_pix,0,
    //            distortWidth_pix,distortHeight_pix,
    //            0,distortHeight_pix,
    //            innerRec[0],innerRec[1],
    //            innerRec[2],innerRec[3],
    //            innerRec[4],innerRec[5],
    //            innerRec[6],innerRec[7],
    //            distortWidth_pix/2,0,
    //            distortWidth_pix,distortHeight_pix/2,
    //            distortWidth_pix/2,distortHeight_pix,
    //            0,distortHeight_pix/2,
    //            distortWidth_pix/2,focalOrigin[1],
    //            innerRec[4],distortHeight_pix/2,
    //            distortWidth_pix/2,innerRec[5],
    //            focalOrigin[0],distortHeight_pix/2
    //        ];
    //const pos_list_uv = [0, 0,
    //            1, 0,
    //            1, 1,
    //            0, 1,
    //            innerRec_uv[0],innerRec_uv[1],
    //            innerRec_uv[2],innerRec_uv[3],
    //            innerRec_uv[4],innerRec_uv[5],
    //            innerRec_uv[6],innerRec_uv[7],
    //            0.5,0,
    //            1,0.5,
    //            0.5,1,
    //            0,0.5,
    //            0.5,focalOrigin_uv[1],
    //            innerRec_uv[4],0.5,
    //            0.5,innerRec_uv[5],
    //            focalOrigin_uv[0],0.5
    //        ];
    //const index_list = [4,0,8,4,8,12,5,12,8,5,8,1,5,1,9,5,13,9,6,13,9,6,9,2,6,2,10,6,10,14,7,14,10,7,10,3,7,3,11,7,11,15,4,15,11,4,11,0,4,5,6,4,6,7];
    const pos_list = [],pos_list_uv=[],index_list = [];
    for(let i=0;i<tableWidth;i++) {
        pos_list.push(i*stepWidth_pix);
        pos_list.push(0);
        pos_list_uv.push(i/distortWidth);
        pos_list_uv.push(0);
    }
    for(let i=0;i<tableHeight;i++) {
        pos_list.push(distortWidth_pix);
        pos_list.push(i*stepHeight_pix);
        pos_list_uv.push(1);
        pos_list_uv.push(i/distortHeight);
    }
    for(let i=tableWidth;i>0;i--) {
        pos_list.push(i*stepWidth_pix);
        pos_list.push(distortHeight_pix);
        pos_list_uv.push(i/distortWidth);
        pos_list_uv.push(1);
    }
    for(let i=tableHeight;i>0;i--) {
        pos_list.push(0);
        pos_list.push(i*stepHeight_pix);
        pos_list_uv.push(0);
        pos_list_uv.push(i/distortHeight);
    }
    for(let i=0;i<8;i++) {
        pos_list.push(innerRec[i]);
        pos_list_uv.push(innerRec_uv[i]);
    }
    let innerIndexStart = 2*(tableWidth+tableHeight);
    //top
    for(let i=0;i<Math.floor(tableWidth/2);i++) {
        index_list.push(i);
        index_list.push(i+1);
        index_list.push(innerIndexStart);
    }
    index_list.push(Math.floor(tableWidth/2));
    index_list.push(innerIndexStart);
    index_list.push(innerIndexStart+1);
    for(let i=Math.floor(tableWidth/2);i<tableWidth;i++) {
        index_list.push(i);
        index_list.push(i+1);
        index_list.push(innerIndexStart+1);
    }
    //right
    for(let i=0;i<Math.floor(tableHeight/2);i++) {
        index_list.push(tableWidth+i);
        index_list.push(tableWidth+i+1);
        index_list.push(innerIndexStart+1);
    }
    index_list.push(tableWidth+Math.floor(tableHeight/2));
    index_list.push(innerIndexStart+1);
    index_list.push(innerIndexStart+2);
    for(let i=Math.floor(tableHeight/2);i<tableHeight;i++) {
        index_list.push(tableWidth+i);
        index_list.push(tableWidth+i+1);
        index_list.push(innerIndexStart+2);
    }
    //bottom
    for(let i=0;i<Math.floor(tableWidth/2);i++) {
        index_list.push(tableWidth+tableHeight+i);
        index_list.push(tableWidth+tableHeight+i+1);
        index_list.push(innerIndexStart+2);
    }
    index_list.push(tableWidth+tableHeight+Math.floor(tableWidth/2));
    index_list.push(innerIndexStart+2);
    index_list.push(innerIndexStart+3);
    for(let i=Math.floor(tableWidth/2);i<tableWidth;i++) {
        index_list.push(tableWidth+tableHeight+i);
        index_list.push(tableWidth+tableHeight+i+1);
        index_list.push(innerIndexStart+3);
    }
    //left
    for(let i=0;i<Math.floor(tableHeight/2);i++) {
        index_list.push(2*tableWidth+tableHeight+i);
        index_list.push(2*tableWidth+tableHeight+i+1);
        index_list.push(innerIndexStart+3);
    }
    index_list.push(2*tableWidth+tableHeight+Math.floor(tableHeight/2));
    index_list.push(innerIndexStart+3);
    index_list.push(innerIndexStart);
    for(let i=Math.floor(tableHeight/2);i<tableHeight-1;i++) {
        index_list.push(2*tableWidth+tableHeight+i);
        index_list.push(2*tableWidth+tableHeight+i+1);
        index_list.push(innerIndexStart);
    }
    index_list.push(2*tableWidth+2*tableHeight-1);
    index_list.push(0);
    index_list.push(innerIndexStart);
    //center
    index_list.push(innerIndexStart);
    index_list.push(innerIndexStart+1);
    index_list.push(innerIndexStart+2);
    index_list.push(innerIndexStart);
    index_list.push(innerIndexStart+2);
    index_list.push(innerIndexStart+3);

    let h_num=0,w_num=0;
    let translateH=0,translateW=0;
    let translateH_uv = 0,translateW_uv = 0;
    if(h<frameHeight) {
        h_num = frameHeight-h;
        translateH = -h_num*stepHeight_pix;
        translateH_uv = -h_num/distortHeight;
    } else if(h>=tableHeight-frameHeight) {
        h_num = h-(tableHeight-frameHeight)+1;
        translateH = h_num*stepHeight_pix;
        translateH_uv = h_num/distortHeight;
    }
    if(w<frameWidth) {
        w_num = frameWidth-w;
        translateW = -w_num*stepWidth_pix;
        translateW_uv = -w_num/distortWidth;
    }else if(w>=tableWidth-frameWidth) {
        w_num = w-(tableWidth-frameWidth)+1;
        translateW = w_num*stepWidth_pix;
        translateW_uv = w_num/distortWidth;
    }
    //for(let i=4*2;i<8*2;i+=2) {
    for(let i=innerIndexStart*2;i<(innerIndexStart+4)*2;i+=2) {
        pos_list[i+1] += translateH;
        pos_list[i] += translateW;
        pos_list[i+1] = Math.min(Math.max(0,pos_list[i+1]),distortHeight_pix);
        pos_list[i] = Math.min(Math.max(0,pos_list[i]),distortWidth_pix);

        pos_list_uv[i+1] += translateH_uv;
        pos_list_uv[i] += translateW_uv;
        pos_list_uv[i+1] = Math.min(Math.max(0,pos_list_uv[i+1]),1);
        pos_list_uv[i] = Math.min(Math.max(0,pos_list_uv[i]),1);
    }
    for(let i=12*2;i<16*2;i+=2) {
        pos_list[i+1] += translateH;
        pos_list[i] += translateW;
        pos_list[i+1] = Math.min(Math.max(0,pos_list[i+1]),distortHeight_pix);
        pos_list[i] = Math.min(Math.max(0,pos_list[i]),distortWidth_pix);
        
        pos_list_uv[i+1] += translateH_uv;
        pos_list_uv[i] += translateW_uv;
        pos_list_uv[i+1] = Math.min(Math.max(0,pos_list_uv[i+1]),1);
        pos_list_uv[i] = Math.min(Math.max(0,pos_list_uv[i]),1);
    }
    const geometry = new PIXI.Geometry()
        .addAttribute('aVertexPosition', 
            pos_list,
            2)
        .addAttribute('aUvs', 
            pos_list_uv,
            2)
        .addIndex(index_list);
    return geometry;
}
function updateLinechartsSprite(h,w) {
    let frameWidth = (distortWidth-focalWidth)/2;
    let frameHeight = (distortHeight-focalHeight)/2;
    w = Math.max(frameWidth,Math.min(w,tableWidth-frameWidth-1));
    h = Math.max(frameHeight,Math.min(h,tableHeight-frameHeight-1));
    const focalOrigin = [(distortWidth-focalWidth*fisheyeScale)/2*stepWidth_pix,(distortHeight-focalWidth*fisheyeScale)/2*stepHeight_pix];
    
    let startW = w-Math.floor(distortWidth/2);
    let startH = h-Math.floor(distortHeight/2);
    //console.log(`h = ${h}  w = ${w}`);
    let bgTexture = createBackgroundTexture(startH,startW,startH+distortHeight-1,startW+distortWidth-1);
    quad.shader.uniforms.uSampler2=bgTexture;
    //quad.x = startW*stepWidth_pix;
    //quad.y = startH*stepHeight_pix;
    quad.x=Math.min(startW*stepWidth_pix,stageWidth_pix-focalOrigin[0]-focalWidth*fisheyeScale*stepWidth_pix);
    quad.y=Math.min(startH*stepHeight_pix,stageHeight_pix-focalOrigin[1]-focalHeight*fisheyeScale*stepHeight_pix);
    let innerW = w-Math.floor(focalWidth/2);
    let innerH = h-Math.floor(focalHeight/2);
    let linechartsTexture = createLineChartsTexture(stepHeight_pix*fisheyeScale,stepWidth_pix*fisheyeScale,innerH,innerW,innerH+focalHeight-1,innerW+focalWidth-1);
    linechartsSprite.texture = linechartsTexture;
    linechartsSprite.x = startW*stepWidth_pix+focalOrigin[0];
    linechartsSprite.y = startH*stepHeight_pix+focalOrigin[1];
    linechartsSprite.h=h;
    linechartsSprite.w = w;
}
container.addChild(quad);
//container.addChild(linechartsSprite);
