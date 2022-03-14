import * as PARA from "./parameters.js";

//export function time_sliderHandle() {
//    let text = document.getElementById("currentTime-text");
//    let slider = document.getElementById("currentTime");
//    text.innerHTML = slider.value;
//    currentTime.setCurrent = Number(slider.value);
//}
export function time_sliderHandle(value) {
    console.log("time_sliderHandle",value);
    let text = document.getElementById("currentTime-text");
    text.innerHTML = `${value}`;
    currentTime.setCurrent = Number(value);
}
export function initSliders(info) {
    let sliderContainer = document.getElementById("sliderContainer");
    for(let i=0;i<info.length;i++) {
        console.log(info[i]);
        sliderContainer.innerHTML += `<p>${info[i].displayName}=<span id=${info[i].id}-text></span></p>`;
        let output = document.getElementById(`${info[i].id}-text`);
        output.innerHTML = info[i].defaultValue.toString();
        let slider = document.createElement("div");
        slider.setAttribute("class","slider-div");
        slider.setAttribute("id",info[i].id);
        slider.style.width = `${PARA.slider_length}px`;
        slider.style.height = `20px`;
        sliderContainer.append(slider);
    }
        
    for(let i=0;i<info.length;i++) {
        let slider = document.getElementById(info[i].id);
        console.log('init slider info step')
        console.log(info[i].step)
        noUiSlider.create(slider,{
            start: [Number(info[i].defaultValue)],
            step:Number(info[i].step),
            connect: 'lower',
            range: {
                'min': [Number(info[i].min)],
                'max': [Number(info[i].max)]
            }
        });

        slider.noUiSlider.on('update',function(values,handle){
            console.log("slider update ",values, handle);
            info[i].oninputHandle(values[handle]);
        });
    }
};
export function clearSliders() {
    let sliderContainer = document.getElementById("sliderContainer");
    const slider_list = sliderContainer.getElementsByClassName("slider-div");
    for(let i=0;i<slider_list.length;i++) {
        //slider_list[i].noUiSlider.on("update",function(values,handle){});
        slider_list[i].noUiSlider.destroy();
    }
    sliderContainer.innerHTML = "";
};
