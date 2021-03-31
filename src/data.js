import {loadParameters} from "./parameters.js";

export const trial = {
    "50":"task-1-50x50-upward-0",
    "100":"task-1-100x100-downward-0"
}

const tableSize = {
    "DEMO":{
        "task-1-50x50-upward-0":{'h':50,'w':50},
        "task-1-100x100-downward-0":{'h':100,'w':100}
    }
};
const DATA = {
    "DEMO":{
        "task-1-50x50-upward-0":{},
        "task-1-100x100-downward-0":{}
    }
};
const timerange = {
    "DEMO":{"start":0,"end":4}
};
const maxValue = {
    "DEMO":{}
};
const datasetLoader = {
    "DEMO":function(dataFileName) {
        const dataFileDir = "static/STUDY1/"+dataFileName+".json"
        $.ajax({
            dataType:"json",
            url:dataFileDir,
            async:false,
            success:function(json) {
                tableSize["DEMO"][dataFileName] = {'h':json.nrows,'w':json.ncols};
                DATA["DEMO"][dataFileName]=json.values;
            }
        });
    }
};
const initDataFunc = {
    "DEMO":function() {
        const STUDY1_dataFileDir = "static/STUDY1/";
        for(let file in DATA["DEMO"]) {
            datasetLoader["DEMO"](file);
        }
        $.ajax({
            dataType:"json",
            url:"static/STUDY1/max_value.json",
            async:false,
            success:function(json) {
                maxValue["DEMO"] = json;
            }
        });
    }
};
const getValueFunc = {
    "DEMO":function(timeIdx,h,w) {
        return DATA["DEMO"][currentTrial][h*tableSize["DEMO"][currentTrial].w+w][timeIdx]/maxValue["DEMO"][currentTrial];
    }
};

export function initData() {
    currentTrial = trial[nodeCnt];
    initDataFunc["DEMO"]();
    loadData();
}
export function loadData() {
    timeStart = timerange[dataType].start;
    timeEnd = timerange[dataType].end;
    currentTime.value = timeStart;
    getValue = getValueFunc[dataType];
    loadParameters(tableSize[dataType][currentTrial].h,tableSize[dataType][currentTrial].w);
};
