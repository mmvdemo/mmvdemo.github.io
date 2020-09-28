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
function createLineChartsSvg(gridH,gridW,h1,w1,h2,w2) {
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
            if(dataset[timeEnd-timeStart].value>0.5) stroke = PARA.lineColorLight;

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
export function createLineChartsTexture(gridH,gridW,h1,w1,h2,w2) {
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
