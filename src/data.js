import {loadParameters} from "./parameters.js";

let DATA = {
    "RANDOM":{},
    "US":{}
};

let counter=0,maxValue=0;
for(let i=timeStart;i<=timeEnd;i++) {
    let dataFilePath = `static/US/${i}.csv`;
    $.get(dataFilePath,function(s){
        csv().fromString(s).then((jsonObj)=>{DATA.US[i]=jsonObj;counter+=1;});
    });
}
var callback = function() {
    if($.active!==0||counter<timeEnd-timeStart+1) {
        setTimeout(callback,'100');
        return;
    }
    for(let i=0;i<DATA.US[timeEnd].length;i++) {
        destinations.push(DATA.US[timeEnd][i]['Destinations']);
    }
    nodeCnt = destinations.length;
    //normalize data
    for(let i=0;i<DATA.US[timeEnd].length;i++) {
        for(let j=0;j<destinations.length;j++) {
            let value = DATA.US[timeEnd][i][destinations[j]];
            if(value.length>0) {
                if(maxValue<Number(value)) {
                    maxValue = Number(value);
                }
            }
        }
    }
    maxValue /=16;
}
callback();


export function loadData() {
    dataType = input.dataType.options[input.dataType.selectedIndex].value;
    nodeCnt = Number(input.nodeCnt.value);
    technique = input.technique.options[input.technique.selectedIndex].value;
    if(dataType === "RANDOM") {
        for(let t=timeStart;t<=timeEnd;t++) {
            let matrix = [];
            for(let i=0;i<nodeCnt;i++) {
                matrix.push(d3.range(nodeCnt).map(Math.random));
            }
            DATA.RANDOM[t] = matrix;
        }
        getValue = function(timeIdx,h,w) {
            return DATA.RANDOM[timeIdx][h][w];
        };
    } else if(dataType === "US") {
        getValue = function(timeIdx,h,w) {
            const value =DATA.US[timeIdx][h][destinations[w]];
            if(value.length==0) {
                return 0;
            } else {
                const ans = Number(value)/maxValue;
                return ans;
            }
        };    
    }
    loadParameters(); 
}
