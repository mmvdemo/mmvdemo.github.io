import {initData,loadData} from "./data.js"; 
import {highlightManager} from "./highlight.js";
import {mouseTracker_mousemoveHandle,mouseTracker} from "./tracking.js";
import {destroyCartesianLens,loadCartesianLens} from "./cartesianLens.js";
import {destroyTableLens_stretch,loadTableLens_stretch} from "./tableLens.js";
import {destroyTableLens_step,loadTableLens_step} from "./tableLens.js";
import {destroyFisheyeLens_inside,loadFisheyeLens_inside} from "./fisheyeLens.js";
import {destroyFisheyeLens_outside,loadFisheyeLens_outside} from "./fisheyeLens.js";
import {destroyZoom,loadZoom} from "./zoom.js";
//loadData();
initData();
let destroyFunc = {
    "cartesianlens":destroyCartesianLens,
    "tablelens_stretch":destroyTableLens_stretch,
    "tablelens_step":destroyTableLens_step,
    "fisheyelens_inside":destroyFisheyeLens_inside,
    "fisheyelens_outside":destroyFisheyeLens_outside,
    "zoom":destroyZoom
};
let loadFunc = {
    "cartesianlens":loadCartesianLens,
    "tablelens_stretch":loadTableLens_stretch,
    "tablelens_step":loadTableLens_step,
    "fisheyelens_inside":loadFisheyeLens_inside,
    "fisheyelens_outside":loadFisheyeLens_outside,
    "zoom":loadZoom
};
loadFunc[technique]();
input.technique.onchange = function() {
    let newTechnique = input.technique.options[input.technique.selectedIndex].value;
    destroyFunc[technique]();
    technique = newTechnique;
    loadFunc[newTechnique]();
}
input.nodeCntButton.onclick = function() {
    destroyFunc[technique]();
    loadData();
    loadFunc[technique]();
}
input.addHighlightButton.onclick = function() {
    highlightManager.addHighlightByString(input.addHighlight.value);
    input.addHighlight.value="";
}
input.removeHighlightButton.onclick = function() {
    highlightManager.removeHighlightByString(input.removeHighlight.value);
    input.removeHighlight.value="";
}
input.mouseTrackButton.onclick = function() {
    if(mouseTracker.recording) {
        mouseTracker.pause();
        input.mouseTrackButton.innerHTML = "start";
    } else {
        mouseTracker.start();
        input.mouseTrackButton.innerHTML = "pause";
    }
}
document.body.addEventListener('mousemove',mouseTracker_mousemoveHandle);


