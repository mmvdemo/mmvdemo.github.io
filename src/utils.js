import * as PARA from "./parameters.js";

export function getMouseOnCanvas(evt) {
    const canvas = document.getElementById("canvas");
    const rect = canvas.getBoundingClientRect();
    const mouseOnCanvas = {'h':evt.clientY-rect.top,'w':evt.clientX-rect.left};
    return mouseOnCanvas;
}

