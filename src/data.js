import {loadParameters} from "./parameters.js";
//import {loadFunc} from "./setup.js";

const label = {
    "PILOT":[],
    "US":[],
    "RANDOM":[]
};
const tableSize = {
    "PILOT":{},
    "US":{},
    "RANDOM":{}
};
const DATA = {
    "PILOT":{},
    "RANDOM":{},
    "US":{}
};
const timerange = {
    "PILOT":{"start":0,"end":4},
    "US":{"start":2005,"end":2009},
    "RANDOM":{"start":0,"end":4}
};
const maxValue = {
    "PILOT":0,
    "US":0,
    "RANDOM":0
}
const initDataFunc = {
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
    nodeCnt = Number(input.nodeCnt.value);
    tableSize["RANDOM"].h=nodeCnt;
    tableSize["RANDOM"].w=nodeCnt;
    if(dataType=="RANDOM") generateRandomData();
    technique = input.technique.options[input.technique.selectedIndex].value;
    timeStart=timerange[dataType].start;
    timeEnd = timerange[dataType].end;
    currentTime.value = timeStart;
    getValue = getValueFunc[dataType];
    loadParameters(tableSize[dataType].h,tableSize[dataType].w);
};
