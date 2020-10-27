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
        slider.value = info[i].defaultValue.toString();
        slider.max = info[i].max.toString();
        slider.min = info[i].min.toString();
        slider.setAttribute("id",info[i].id);
        slider.className = "range-sliders";
        sliderContainer.innerHTML += `<p>${info[i].id}=<span id=${info[i].id}-text></span></p>`;
        sliderContainer.append(slider);
        let output = document.getElementById(`${info[i].id}-text`);
        output.innerHTML = info[i].defaultValue.toString();
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
