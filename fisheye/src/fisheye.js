//const nodeCnt = 54;
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
let geometry = updateGeometry();
focalScaleSlider.oninput = function() {
    focalScaleText.innerHTML = this.value;
    fisheyeScale = Number(this.value);
    geometry = updateGeometry();
    quad.geometry = geometry;
    updateLinechartsSprite(h=linechartsSprite.h,w=linechartsSprite.w);
};
focalRangeSlider.oninput = function() {
    focalRangeText.innerHTML = this.value;
    focalWidth = Number(this.value);
    if(focalWidth%2==0) focalWidth+=1;
    focalHeight = focalWidth;
    geometry = updateGeometry();
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
    geometry = updateGeometry();
    quad.geometry = geometry;
    updateLinechartsSprite(h=linechartsSprite.h,w=linechartsSprite.w);
}
//random data
//const data= {};
//for(let t=timeStart;t<=timeEnd;t++) {
//    let matrix = [];
//    for(let i=0;i<tableHeight;i++) {
//        matrix.push(d3.range(tableWidth).map(Math.random));
//    }
//    data[t] = matrix;
//}
function getValue(timeIdx,h,w) {
    //return data[timeIdx][h][w];
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
    for(let i=h1;i<=h2;i++) {
        for(let j=w1;j<=w2;j++) {
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
let canvas = document.getElementById("mycanvas");
let app = new PIXI.Application({width:stageWidth_pix, height:stageHeight_pix, antialias:true, view:canvas});
app.renderer.backgroundColor = backgroundColor;
//document.body.appendChild(app.view);
app.stage.interactive = true;
app.stage.addChild(container);

const backgroundSprite = new PIXI.Sprite(backgroundTexture);
backgroundSprite.scale.x = stepWidth_pix;
backgroundSprite.scale.y = stepHeight_pix;
backgroundSprite.x=0;
backgroundSprite.y=0;
container.addChild(backgroundSprite);

var linechartsSprite = new PIXI.Sprite();
linechartsSprite.scale.x=1/linechartsTextureScale;
linechartsSprite.scale.y=1/linechartsTextureScale;
linechartsSprite.h = -1;
linechartsSprite.w = -1;

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
    uniform float time;

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
quad.mousemove = function(e) {
    let w = Math.floor(e.data.global.x/stepWidth_pix);
    let h = Math.floor(e.data.global.y/stepHeight_pix);
    if(w<0||h<0||w>=tableWidth||h>tableHeight) {
        return;
    }
    updateLinechartsSprite(h,w);    
}
container.addChild(quad);
container.addChild(linechartsSprite);
function updateLinechartsSprite(h,w) {
    const focalOrigin = [(distortWidth-focalWidth*fisheyeScale)/2*stepWidth_pix,(distortHeight-focalWidth*fisheyeScale)/2*stepHeight_pix];
    let frameWidth = (distortWidth-focalWidth)/2;
    let frameHeight = (distortHeight-focalHeight)/2;
    //w = Math.max(0,Math.min(w,tableWidth-1));
    //h = Math.max(0,Math.min(h,tableHeight-1));
    w = Math.max(frameWidth,Math.min(w,tableWidth-frameWidth-1));
    h = Math.max(frameHeight,Math.min(h,tableHeight-frameHeight-1));
    let startW = w-Math.floor(distortWidth/2);
    let startH = h-Math.floor(distortHeight/2);
    let bgTexture = createBackgroundTexture(startH,startW,startH+distortHeight-1,startW+distortWidth-1);
    quad.shader.uniforms.uSampler2=bgTexture;
    quad.x=startW*stepWidth_pix;
    quad.y=startH*stepHeight_pix;
    console.log(`focus h=${h},w=${w}`);
    let innerW = w-Math.floor(focalWidth/2);
    let innerH = h-Math.floor(focalHeight/2);
    let linechartsTexture = createLineChartsTexture(stepHeight_pix*fisheyeScale,stepWidth_pix*fisheyeScale,innerH,innerW,innerH+focalHeight-1,innerW+focalWidth-1);
    linechartsSprite.texture = linechartsTexture;
    linechartsSprite.x = startW*stepWidth_pix+focalOrigin[0];
    linechartsSprite.y = startH*stepHeight_pix+focalOrigin[1];
    linechartsSprite.h=h;
    linechartsSprite.w = w;
}
function updateGeometry() {
    const focalOrigin_uv =[(distortWidth-focalWidth)/2/distortWidth,(distortHeight-focalHeight)/2/distortHeight]; 
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

    const geometry = new PIXI.Geometry()
        .addAttribute('aVertexPosition', 
            [0,0,
                distortWidth_pix,0,
                distortWidth_pix,distortHeight_pix,
                0,distortHeight_pix,
                innerRec[0],innerRec[1],
                innerRec[2],innerRec[3],
                innerRec[4],innerRec[5],
                innerRec[6],innerRec[7],
                distortWidth_pix/2,0,
                distortWidth_pix,distortHeight_pix/2,
                distortWidth_pix/2,distortHeight_pix,
                0,distortHeight_pix/2,
                distortWidth_pix/2,focalOrigin[1],
                innerRec[4],distortHeight_pix/2,
                distortWidth_pix/2,innerRec[5],
                focalOrigin[0],distortHeight_pix/2
            ],
            2)
        .addAttribute('aUvs', 
            [0, 0,
                1, 0,
                1, 1,
                0, 1,
                innerRec_uv[0],innerRec_uv[1],
                innerRec_uv[2],innerRec_uv[3],
                innerRec_uv[4],innerRec_uv[5],
                innerRec_uv[6],innerRec_uv[7],
                0.5,0,
                1,0.5,
                0.5,1,
                0,0.5,
                0.5,focalOrigin_uv[1],
                innerRec_uv[4],0.5,
                0.5,innerRec_uv[5],
                focalOrigin_uv[0],0.5
            ],
            2)
        .addIndex([4,0,8,4,8,12,5,12,8,5,8,1,5,1,9,5,13,9,6,13,9,6,9,2,6,2,10,6,10,14,7,14,10,7,10,3,7,3,11,7,11,15,4,15,11,4,11,0,4,5,6,4,6,7]);
    //quad.geometry = geometry;
    return geometry;
}


