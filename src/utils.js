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
//    //for(let h=0;h<height;h++) {
//    //    for(let j=0;j<width*PARA.step_pix.w;j++) {
//    //        let w = Math.floor(j/PARA.step_pix.w);
//    //        if(h+h1<0||w+w1<0||h+h1>=PARA.table.h||w+w1>=PARA.table.w) {
//    //            continue;
//    //        }
//    //        let idx = h*PARA.step_pix.h*width*PARA.step_pix.w+j;
//    //        rgba[idx*4] = (PARA.backgroundColor>>16)/256;
//    //        rgba[idx*4+1] = ((PARA.backgroundColor>>8)&((1<<8)-1))/256;
//    //        rgba[idx*4+2] = (PARA.backgroundColor&((1<<8)-1))/256;
//
//    //    }
//    //}
//       
//    const texture = PIXI.Texture.fromBuffer(rgba,width*PARA.step_pix.w,height*PARA.step_pix.h);
//    return texture;
//}
export function createLineChartsSvg(gridH,gridW,h1,w1,h2,w2) {
    gridH = gridH*PARA.linechartsTextureScale;
    gridW = gridW*PARA.linechartsTextureScale;
    const svg = d3.create("svg")
                    .attr("width",gridW*(w2-w1+1))
                    .attr("height",gridH*(h2-h1+1));
    const chartHeight = gridH*PARA.chartRatio;
    const chartWidth = gridW*PARA.chartRatio;
    const originW = (gridW-chartWidth)/2;
    const originH = (gridH-chartHeight)/2;
    for(let i=Math.max(h1,0);i<=Math.min(h2,PARA.table.h-1);i++) {
        for(let j=Math.max(w1,0);j<=Math.min(w2,PARA.table.w-1);j++) {
            
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
            let stroke = PARA.lineColorDark;
            if(dataset[currentTime.value-timeStart].value>0.5) stroke = PARA.lineColorLight;

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
export function createLineChartsTexture(grid_pix,pos1,pos2) {
    let svg = createLineChartsSvg(grid_pix.h,grid_pix.w,pos1.h,pos1.w,pos2.h,pos2.w);
    let svgStr = svgToBase64(svg);
    let texture = PIXI.Texture.from(svgStr);
    return texture;
}
let dotTexture;
export function initDotTexture(renderer) {
    const graphics = new PIXI.Graphics();
    graphics.beginFill(0xDE3249,1);
    graphics.drawCircle(0,0,PARA.nodeRadius);
    graphics.endFill();
    const texture = renderer.generateTexture(graphics);
    dotTexture = texture;
}
export function createSingleLineChart(clickHandle) {
    const container = new PIXI.Container();
    container.interactive = true;
    const background = new PIXI.Sprite();
    container.addChild(background);
    const dots = new PIXI.Container();
    dots.interactive = true;
    for(let i=timeStart;i<=timeEnd;i++) {
        const dot = new PIXI.Sprite(dotTexture);
        dot.time = i;
        dot.interactive = true;
        dot.on("mouseover",function(e) {
            dot.scale.set(1.5,1.5);
        });
        dot.on("mouseout",function(e) {
            dot.scale.set(1,1);
        });
        dot.on("click",function(e) {
            currentTime.value = this.time;
            clickHandle();
        });
        dots.addChild(dot);
    }
    container.addChild(dots);
    return container;
}
export function updateSingleLineChart(linechart,grid_pix,pos) {
    const texture = createLineChartsTexture(grid_pix,pos,pos); 
    const background = linechart.getChildAt(0);
    const dots = linechart.getChildAt(1);
    background.texture = texture;
    const chartTrans_pix = {
        'h':grid_pix.h*(1-PARA.chartRatio)/2,
        'w':grid_pix.w*(1-PARA.chartRatio)/2
    };
    const chart_pix = {
        'h':grid_pix.h*PARA.chartRatio,
        'w':grid_pix.w*PARA.chartRatio
    };
    dots.position.set(chartTrans_pix.w,chartTrans_pix.h);
    for(let i=timeStart;i<=timeEnd;i++) {
        const value = getValue(i,pos.h,pos.w);
        const dot = dots.getChildAt(i-timeStart);
        dot.pivot.set(PARA.nodeRadius,PARA.nodeRadius);
        dot.interactive = true;
        dot.x = chart_pix.w*(i-timeStart)/(timeEnd-timeStart);
        dot.y = (1-value)*chart_pix.h;
    }
}

function svgToBase64(svg) {
    let svgStr = new XMLSerializer().serializeToString(svg.node());
    let image64 = `data:image/svg+xml;base64,${btoa(svgStr)}`;
    return image64;
}
export function createGridGeometry(h,w) {
    const pos_list = [],pos_list_uv = [],index_list=[];
    for(let i=0;i<=h;i++) {
        for(let j=0;j<=w;j++) {
            pos_list.push(j*PARA.step_pix.w);
            pos_list.push(i*PARA.step_pix.h);
            pos_list_uv.push(j/w);
            pos_list_uv.push(i/h);
        }
    }
    for(let i=0;i<h;i++) {
        for(let j=0;j<w;j++) {
            if((i<Math.floor(h/2)&&j<Math.floor(w/2))||(i>=Math.floor(h/2)&&j>=Math.floor(w/2))) {
                index_list.push(i*(w+1)+j);
                index_list.push(i*(w+1)+j+1);
                index_list.push((i+1)*(w+1)+j+1);

                index_list.push(i*(w+1)+j);
                index_list.push((i+1)*(w+1)+j);
                index_list.push((i+1)*(w+1)+j+1);
            } else {
                index_list.push(i*(w+1)+j);
                index_list.push(i*(w+1)+j+1);
                index_list.push((i+1)*(w+1)+j);

                index_list.push(i*(w+1)+j+1);
                index_list.push((i+1)*(w+1)+j);
                index_list.push((i+1)*(w+1)+j+1);
            }
        }
    }
    const geometry = new PIXI.Geometry()
        .addAttribute('aVertexPosition',pos_list,2)
        .addAttribute('aUvs',pos_list_uv,2)
        .addIndex(index_list);
    return geometry;
}
export function time_sliderHandle() {
    let text = document.getElementById("currentTime-text");
    let slider = document.getElementById("currentTime");
    text.innerHTML = slider.value;
    currentTime.setCurrent = Number(slider.value);
}
export function initSliders(info) {
    let sliderContainer = document.getElementById("sliderContainer");
    for(let i=0;i<info.length;i++) {
        let slider = document.createElement("input");
        slider.type = "range";
        slider.value = info[i].defaultValue;
        slider.max = info[i].max;
        slider.min = info[i].min;
        slider.setAttribute("id",info[i].id);
        slider.className = "range-sliders";
        sliderContainer.innerHTML += `<p>${info[i].id}=<span id=${info[i].id}-text></span></p>`;
        sliderContainer.append(slider);
        let output = document.getElementById(`${info[i].id}-text`);
        output.innerHTML = slider.value;
    }
    for(let i=0;i<info.length;i++) {
        let slider = document.getElementById(info[i].id);
        slider.oninput = info[i].oninputHandle;
    }
};
export function clearSliders() {
    let sliderContainer = document.getElementById("sliderContainer");
    sliderContainer.innerHTML = "";
};
