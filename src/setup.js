import {trial,initData,loadData} from "./data.js"; 
import {destroyCartesianLens,loadCartesianLens} from "./cartesianLens.js";
import {destroyTableLens_stretch,loadTableLens_stretch} from "./tableLens.js";
import {destroyTableLens_step,loadTableLens_step} from "./tableLens.js";
import {destroyFisheyeLens_inside,loadFisheyeLens_inside} from "./fisheyeLens.js";
import {destroyFisheyeLens_outside,loadFisheyeLens_outside} from "./fisheyeLens.js";
import {destroyZoom,loadZoom} from "./zoom.js";
import {loadOD,destroyOD} from "./overview_details.js";
initData();
let destroyFunc = {
    "cartesianlens":destroyCartesianLens,
    "tablelens_stretch":destroyTableLens_stretch,
    "tablelens_step":destroyTableLens_step,
    "fisheyelens_inside":destroyFisheyeLens_inside,
    "fisheyelens_outside":destroyFisheyeLens_outside,
    "zoom":destroyZoom,
    "overview_details":destroyOD
};
let loadFunc = {
    "cartesianlens":loadCartesianLens,
    "tablelens_stretch":loadTableLens_stretch,
    "tablelens_step":loadTableLens_step,
    "fisheyelens_inside":loadFisheyeLens_inside,
    "fisheyelens_outside":loadFisheyeLens_outside,
    "zoom":loadZoom,
    "overview_details":loadOD
};
loadFunc[technique]();
input.technique.onchange = function() {
    let newTechnique = input.technique.options[input.technique.selectedIndex].value;
    destroyFunc[technique]();
    technique = newTechnique;
    loadFunc[newTechnique]();
}
input["matrix_size"].onchange = function() {
    let size = input["matrix_size"].options[input["matrix_size"].selectedIndex].value;
    destroyFunc[technique]();
    nodeCnt = size;
    currentTrial = trial[nodeCnt];
    loadData();
    loadFunc[technique]();
}


