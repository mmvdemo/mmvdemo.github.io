import * as PARA from "./parameters.js";

//export function time_sliderHandle() {
//    let text = document.getElementById("currentTime-text");
//    let slider = document.getElementById("currentTime");
//    text.innerHTML = slider.value;
//    currentTime.setCurrent = Number(slider.value);
//}
export function time_sliderHandle(value) {
    let text = document.getElementById("currentTime-text");
    text.innerHTML = `${value}`;
    currentTime.setCurrent = Number(value);
}
export function initSliders(info) {
    let sliderContainer = document.getElementById("sliderContainer");
    for(let i=0;i<info.length;i++) {
        sliderContainer.innerHTML += `<p>${info[i].id}=<span id=${info[i].id}-text></span></p>`;
        let output = document.getElementById(`${info[i].id}-text`);
        output.innerHTML = info[i].defaultValue.toString();
        let slider = document.createElement("div");
        slider.setAttribute("class","slider-div");
        //slider.type = "range";
        //slider.value = info[i].defaultValue.toString();
        //slider.max = info[i].max.toString();
        //slider.min = info[i].min.toString();
        noUiSlider.create(slider,{
            start: [Number(info[i].defaultValue)],
            step:1,
            range: {
                'min': [Number(info[i].min)],
                'max': [Number(info[i].max)]
            }
        });
        slider.style.width = `${PARA.slider_length}px`;
        slider.style.height = `20px`;

        slider.setAttribute("id",info[i].id);
        slider.noUiSlider.on('update',function(values,handle){
            info[i].oninputHandle(values[handle]);
        });
            
        sliderContainer.append(slider);
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
