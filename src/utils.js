import * as PARA from "./parameters.js";

export function getMouseOnCanvas(evt) {
    const canvas = document.getElementById("canvas");
    const rect = canvas.getBoundingClientRect();
    if(typeof evt === "undefined") {
        evt = window.event;
    }
    const mouseOnCanvas = {'h':evt.clientY-rect.top,'w':evt.clientX-rect.left};
    return mouseOnCanvas;
}
export function isMouseOnCanvas(evt) {
    if (typeof evt === "undefined") {
        evt = window.event;
    }
    const pos = getMouseOnCanvas(evt);
    if(pos.h<0||pos.w<0||pos.h>PARA.stage_pix.h||pos.w>PARA.stage_pix.w) {
        return false;
    }else {
        return true;
    }
}
function scroll_handle(evt) {
    console.log(`document scroll`,window.scrollY);
    if (window.scrollY>PARA.page_scroll_max_y_pix) {
        window.scroll(0,PARA.page_scroll_max_y_pix);
    }

    //evt.preventDefault();
}
export function disablePageScroll() {

    console.log("disablePageScroll");

    const scrollTop = window.pageYOffset || document.documentElement.scrollTop; 
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

    document.addEventListener("scroll",scroll_handle);

    //$('body').css({'position':'fixed','width':'100%'});


}
export function enablePageScroll() { 
    console.log(`enablePageScroll`);


    //$('body').css({'position':'initial','height':'auto'});


    document.removeEventListener("scroll",scroll_handle);
} 
