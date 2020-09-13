const nodeCnt = 51;

//const timeStart = 2012, timeEnd = 2019;
//color
const backgroundColor = 0x707B7C;
const headColor = 0x85C1E9; 
const nodeColor = 0x1ABC9C;
const selectColor = 0xE74C3C;
const lineColorDark = 0x2E4053;
const lineColorLight = 0xF0EDE4;
//parameters
const stage_pix = {'h':800,'w':800};
const table = {'h':nodeCnt,'w':nodeCnt};
const step_pix = {'h':stage_pix.h/table.h,'w':stage_pix.w/table.w};
const focalScale = 150/step_pix.w;
const linechartsTextureScale = 2;
const maxScale = 1.5;
const chartRatio=0.8;
const nodeRadius =0.2;
const EP = 0;
//random data
const data= {};
for(let t=timeStart;t<=timeEnd;t++) {
    let matrix = [];
    for(let i=0;i<table.h;i++) {
        matrix.push(d3.range(table.w).map(Math.random));
    }
    data[t] = matrix;
}
let focal = {'h':1,'w':1};
let distort = {'h':15,'w':15};
let fisheyeScale = 9;
let distort_pix = {'h':distort.h*step_pix.h,'w':distort.w*step_pix.w};
const focalScaleSlider = document.getElementById("focal_scale");
const focalScaleText = document.getElementById("focal_scale_text");
const focalRangeSlider = document.getElementById("focal_range");
const focalRangeText = document.getElementById("focal_range_text");
const distortRangeSlider = document.getElementById("distort_range");
const distortRangeText = document.getElementById("distort_range_text");
focalScaleText.innerHTML = focalScaleSlider.value;
fisheyeScale = Number(focalScaleSlider.value);

focalRangeText.innerHTML = focalRangeSlider.value;
focal.w = Number(focalRangeSlider.value);
focal.h = Number(focalRangeSlider.value);

distortRangeText.innerHTML = distortRangeSlider.value;
distort.w = Number(distortRangeSlider.value);
distort.h = Number(distortRangeSlider.value);
//let geometry = updateGeometry(h=Math.floor(distort.h/2),w=Math.floor(distort.w/2));
focalScaleSlider.oninput = function() {
    focalScaleText.innerHTML = this.value;
    fisheyeScale = Number(this.value);
    //geometry = updateGeometry(h=linechartsSprite.h,w=linechartsSprite.w);
    //quad.geometry = geometry;
    updateLinechartsSprite(h=linechartsSprite.h,w=linechartsSprite.w);
};
focalRangeSlider.oninput = function() {
    focalRangeText.innerHTML = this.value;
    focal.w = Number(this.value);
    if(focal.w%2==0) focal.w+=1;
    focal.h = focal.w;
    //geometry = updateGeometry(h=linechartsSprite.h,w=linechartsSprite.w);
    //quad.geometry = geometry;
    updateLinechartsSprite(h=linechartsSprite.h,w=linechartsSprite.w);
}
distortRangeSlider.oninput = function() {
    distortRangeText.innerHTML = this.value;
    distort.w = Number(this.value);
    if(distort.w%2==0) distort.w+=1;
    distort.h = distort.w;
    distort_pix.w=distort.w*step_pix.w;
    distort_pix.h=distort.h*step_pix.h;
    //geometry = updateGeometry(h=linechartsSprite.h,w=linechartsSprite.w);
    //quad.geometry = geometry;
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
            if(i+h1<0||j+w1<0||i+h1>=table.h||j+w1>=table.w) {
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

const backgroundTexture = createBackgroundTexture(0,0,table.h-1,table.w-1);
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
    for(let i=Math.max(h1,0);i<=Math.min(h2,table.h-1);i++) {
        for(let j=Math.max(w1,0);j<=Math.min(w2,table.w-1);j++) {
            
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
let app = new PIXI.Application({width:stage_pix.w+EP, height:stage_pix.h+EP, antialias:true, view:canvas});
app.renderer.backgroundColor = backgroundColor;
//document.body.appendChild(app.view);
app.stage.interactive = true;
app.stage.addChild(container);

const backgroundSprite = new PIXI.Sprite(backgroundTexture);
backgroundSprite.scale.x = step_pix.w;
backgroundSprite.scale.y = step_pix.h;
backgroundSprite.x=0;
backgroundSprite.y=0;
container.addChild(backgroundSprite);

var linechartsSprite = new PIXI.Sprite();
linechartsSprite.scale.x=1/linechartsTextureScale;
linechartsSprite.scale.y=1/linechartsTextureScale;
linechartsSprite.h = Math.floor(distort.h/2);
linechartsSprite.w = Math.floor(distort.w/2);

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
const pos_list = [],pos_list_uv = [],index_list=[];
for(let h=0;h<=distort.h;h++) {
    for(let w=0;w<=distort.w;w++) {
        pos_list.push(w*step_pix.w);
        pos_list.push(h*step_pix.h);
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
var quad = new PIXI.Mesh(geometry, shader);
quad.position.set(0,0);
quad.interactive = true;
container.addChild(quad);
canvas.addEventListener('mousemove',function(evt) {
    const rect = canvas.getBoundingClientRect();
    const mouseOnCanvas = {'h':evt.clientY-rect.top-container.y,'w':evt.clientX-rect.left-container.x};
    let w = Math.floor(mouseOnCanvas.w/step_pix.w);
    let h = Math.floor(mouseOnCanvas.h/step_pix.h);
    if(w<0||h<0||w>=table.w+1||h>=table.h+1) {
        return;
    }
    updateQuad(h,w);
    updateLinechartsSprite(h,w);
});
function bufferIndex(h,w) {return h*(distort.w+1)+w;};
const d = 0.5;
function h1(x) {return 1-(d+1)*x/(d*x+1);};

function updateQuad(h,w) {
    const frame = {'h':(distort.h-focal.h)/2,'w':(distort.w-focal.w)/2}; 
    const lensOrigin = {'h':Math.min(table.h-distort.h+1,Math.max(0,h-Math.floor(distort.h/2))),'w':Math.min(table.w-distort.w+1,Math.max(0,w-Math.floor(distort.w/2)))};
    const bgTexture = createBackgroundTexture(lensOrigin.h,lensOrigin.w,lensOrigin.h+distort.h-1,lensOrigin.w+distort.w-1);
    quad.shader.uniforms.uSampler2 = bgTexture;
    quad.x = lensOrigin.w * step_pix.w;
    quad.y = lensOrigin.h * step_pix.h;
    const f = {};
    if(w<=frame.w) {
        f['w'] = w-lensOrigin.w;
    } else if (w>=table.w-frame.w-1) {
        f['w'] = w-lensOrigin.w+0.5;
    } else {
        f['w'] = distort.w/2;
    }
    if(h<=frame.h) {
        f['h'] = h-lensOrigin.h;
    } else if(h>=table.h-frame.h-1) {
        f['h'] = h-lensOrigin.h+0.5;
    } else {
        f['h'] = distort.h/2;
    }
    
    const f_pix = {'h':f['h']*step_pix.h,'w':f['w']*step_pix.w};
    const buffer = quad.geometry.getBuffer('aVertexPosition');
    for(let i=0;i<=distort.h;i++) {
        for(let j=0;j<=distort.w;j++) {
            let beta_buf = {};
            if(f.h>i) {
                beta_buf['horizontal'] =(f.h-i)/f.h;
            } else {
                beta_buf['horizontal'] = (i-f.h)/(distort.h-f.h);
            }
            if (f.w>j) {
                beta_buf['vertical'] = (f.w-j)/f.w;
            } else {
                beta_buf['vertical'] = (j-f.w)/(distort.w-f.w);
            }
            let beta = Math.max(beta_buf['horizontal'],beta_buf['vertical']);
            let scale = h1(beta);
            buffer.data[2*bufferIndex(h=i,w=j)+1] =i*step_pix.h+ scale*(i*step_pix.h-f_pix['h']);
            buffer.data[2*bufferIndex(h=i,w=j)] =j*step_pix.w+ scale*(j*step_pix.w-f_pix['w']);
        }
    }
    buffer.update();
};
function updateLinechartsSprite(h,w) {
    let frameWidth = (distort.w-focal.w)/2;
    let frameHeight = (distort.h-focal.h)/2;
    w = Math.max(frameWidth,Math.min(w,table.w-frameWidth-1));
    h = Math.max(frameHeight,Math.min(h,table.h-frameHeight-1));
    const focalOrigin = [(distort.w-focal.w*fisheyeScale)/2*step_pix.w,(distort.h-focal.w*fisheyeScale)/2*step_pix.h];
    
    let startW = w-Math.floor(distort.w/2);
    let startH = h-Math.floor(distort.h/2);
    let innerW = w-Math.floor(focal.w/2);
    let innerH = h-Math.floor(focal.h/2);
    let linechartsTexture = createLineChartsTexture(step_pix.h*fisheyeScale,step_pix.w*fisheyeScale,innerH,innerW,innerH+focal.h-1,innerW+focal.w-1);
    linechartsSprite.texture = linechartsTexture;
    linechartsSprite.x = startW*step_pix.w+focalOrigin[0];
    linechartsSprite.y = startH*step_pix.h+focalOrigin[1];
    linechartsSprite.h=h;
    linechartsSprite.w = w;
}
//container.addChild(linechartsSprite);
