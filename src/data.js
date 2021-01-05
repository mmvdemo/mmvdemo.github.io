import {loadParameters} from "./parameters.js";

//only valid for US
const label = {
    "US":[],
};
const tableSize = {
    "PILOT":{},
    "US":{},
    "RANDOM":{},
    "STUDY1":{}
};
const DATA = {
    "PILOT":{},
    "RANDOM":{},
    "US":{},
    "STUDY1":{
        "task-1-100x100-downward-0":{},
        "task-2-100x100-tent-0":{}
    }
};
const timerange = {
    "PILOT":{"start":0,"end":4},
    "US":{"start":2005,"end":2009},
    "RANDOM":{"start":0,"end":4},
    "STUDY1":{"start":0,"end":4}
};
const maxValue = {
    "PILOT":0,
    "US":0,
    "RANDOM":0,
    "STUDY1":{}
};
const datasetLoader = {
    "STUDY1":{
        "TASK1":function(dataFileName) {
            const dataFileDir = "static/STUDY1/"+dataFileName+".json"
            $.ajax({
                dataType:"json",
                url:dataFileDir,
                async:false,
                success:function(json) {
                    tableSize["STUDY1"][dataFileName] = {'h':json.nrows,'w':json.ncols};
                    DATA["STUDY1"][dataFileName]=json.values;
                }
            });
        },
        "TASK2":function(dataFileName) {
            const dataFileDir = "static/STUDY1/"+dataFileName+".json"
            $.ajax({
                dataType:"json",
                url:dataFileDir,
                async:false,
                success:function(json) {
                    tableSize["STUDY1"][dataFileName] = {'h':json.nrows,'w':json.ncols};
                    DATA["STUDY1"][dataFileName]=json.values;
                }
            });
        }
    }
};
const initDataFunc = {
    "STUDY1":function() {
        const STUDY1_dataFileDir = "static/STUDY1/";
        for(let file in DATA["STUDY1"]) {
            if(file.startsWith("task-1")) {
                datasetLoader["STUDY1"]["TASK1"](file);
            } else if(file.startsWith("task-2")) {
                datasetLoader["STUDY1"]["TASK2"](file);
            }
        }
        $.ajax({
            dataType:"json",
            url:"static/STUDY1/max_value.json",
            async:false,
            success:function(json) {
                maxValue["STUDY1"] = json;
            }
        });
    },
    "PILOT":function() {
        const PILOT_dataFileDir = "static/PILOT/data.json";
        $.ajax({
            dataType:"json",
            url:PILOT_dataFileDir,
            async:false,
            success:function(json) {
                tableSize["PILOT"].h = json.nrows;
                tableSize["PILOT"].w = json.ncols;
                DATA["PILOT"] = json.values; 
                for(let i=0;i<json.nrows*json.ncols;i++) {
                    maxValue["PILOT"] = Math.max(maxValue["PILOT"],Math.max(...json.values[i]));
                }
            }
        });    
    },
    "US":function() {
        for(let t=timerange["US"].start;t<=timerange["US"].end;t++) {
            const US_dataFilePath = `static/US/${t}.csv`;
            $.ajax({
                url:US_dataFilePath,
                async:false,
                success:function(s) {        
                    csv().fromString(s).then((jsonObj)=>{
                        DATA["US"][t]=jsonObj;
                        if(t!=timerange["US"].end) return;
                        for(let i=0;i<DATA["US"][timerange["US"].end].length;i++) {
                            label["US"].push(DATA["US"][timerange["US"].end][i]['Destinations']);
                        }                
                        tableSize["US"].h = label["US"].length;
                        tableSize["US"].w = label["US"].length;
                        for(let i=0;i<DATA["US"][timerange["US"].end].length;i++) {
                            for(let j=0;j<label["US"].length;j++) {
                                let value = DATA["US"][timerange["US"].end][i][label["US"][j]];
                                if(value.length>0) {
                                    if(maxValue["US"]<Number(value)) {
                                        maxValue["US"] = Number(value);
                                    }
                                }
                            }
                        }
                        maxValue["US"] /=16;
                    });
                }
            });
        }       
    }
};
const getValueFunc = {
    "STUDY1":function(timeIdx,h,w) {
        return DATA["STUDY1"][currentTrial][h*tableSize["STUDY1"][currentTrial].w+w][timeIdx]/maxValue["STUDY1"][currentTrial];
    },
    "PILOT":function(timeIdx,h,w) {
        return DATA["PILOT"][h*tableSize["PILOT"].w+w][timeIdx]/maxValue["PILOT"];
    },
    "US":function(timeIdx,h,w) {
        const value =DATA["US"][timeIdx][h][label["US"][w]];
        if(value.length==0) {
            return 0;
        } else {
            const ans = Number(value)/maxValue;
            return ans;
        }
    },
    "RANDOM":function(timeIdx,h,w) {
        return DATA["RANDOM"][timeIdx][h][w];
    }
};
const generateRandomData = function() {
    for(let t=timerange["RANDOM"].start;t<=timerange["RANDOM"].end;t++) {
        let matrix = [];
        for(let i=0;i<tableSize["RANDOM"].h;i++) {
            matrix.push(d3.range(tableSize["RANDOM"].w).map(Math.random));
        }
        DATA["RANDOM"][t] = matrix;
    }
};
export function initData() {
    for(let k of Object.keys(initDataFunc)) {
        console.log(`initing ${k} data`);
        initDataFunc[k]();
    }
    loadData();
    console.log(`data init complete`);
}
export function loadData() {
    dataType = input.dataType.options[input.dataType.selectedIndex].value;
    currentTrial = input.dataType.options[input.dataType.selectedIndex].innerHTML;
    if(dataType=="RANDOM") {
        nodeCnt = Number(input.nodeCnt.value);
        tableSize["RANDOM"] = {'h':nodeCnt,'w':nodeCnt};
        generateRandomData();
    }
    technique = input.technique.options[input.technique.selectedIndex].value;
    timeStart=timerange[dataType].start;
    timeEnd = timerange[dataType].end;
    currentTime.value = timeStart;
    getValue = getValueFunc[dataType];
    if(dataType==="STUDY1") {
        loadParameters(tableSize[dataType][currentTrial].h,tableSize[dataType][currentTrial].w);
    } else {
        loadParameters(tableSize[dataType].h,tableSize[dataType].w);
    }
};
