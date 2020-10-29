import * as PARA from "./parameters.js";
import * as UTILS from "./utils.js";
import {displaying_charts} from "./linechart.js";
/**
 * Data = {
 *      timestamp:time, // since task start
 *
 *      mouse_window_pix:{'h':Float,'w':Float}, // hover & click
 *      mouse_window_client_pix:{'h':Float,'w':Float}, // hover & click
 *      mouse_canvas_pix:{'h':Float,'w':Float}, // hover & click
 *      focus:{'h':Integer,'w':Integer}, // hover & click
 *      displaying_chart_list:[], // hover & click
 *      
 *      currentTime:Integer, // click
 *
 *      is_clicked:Boolean
 * }
 */
class MouseTracker {
    constructor() {
        this.dataStream = [];
        this.timestamp_start = (new Date()).getTime();
        this.timestamp_last = this.timestamp_start;
        this.recording = false;

        this.mouse_window_pix = {'h':0,'w':0};
        this.mouse_window_client_pix = {'h':0,'w':0};
        this.mouse_canvas_pix = {'h':0,'w':0};
        this.focus = {'h':0,'w':0};
        this.displaying_chart_list = [];
      
        this.appendInterval;
        this.sendInterval;

    }
    init() {
        this.dataStream = [];
    }
    start() {
        this.timestamp_start = (new Date()).getTime();
        this.timestamp_last = this.timestamp_start; 
        this.appendInterval = setInterval(this.appendData.bind(this,false), PARA.interval*1000);
        this.sendInterval = setInterval(this.sendData.bind(this), PARA.timeout*1000);

        this.init();
        this.recording = true;
    }
    pause() {
        this.recording = false;
        clearInterval(this.appendInterval);
        clearInterval(this.sendInterval);
    }
    
    getTimeSinceStart() {
        const current = (new Date()).getTime();
        return (current-this.timestamp_start)/1000;
    }
    getTimeSinceLast() {
        const current = (new Date()).getTime();
        return (current-this.timestamp_last)/1000;
    }
    getDisplayingChartList() {
        const list = []; 
        for(let key of Object.keys(displaying_charts)) {
            list.push(displaying_charts[key]);
        }
        return list;
    }
    mousemoveHandle(e) {
        const evt = window.event;
        this.mouse_canvas_pix = UTILS.getMouseOnCanvas(evt);
        this.mouse_window_pix = {'h':evt.pageY,'w':evt.pageX};
        this.mouse_window_client_pix = {'h':evt.clientY,'w':evt.clientX};
    }
    mouseclickHandle() {
        this.appendData(true);
    }
    appendData(clicked) {
        if(!this.recording) return;
        const data = {};
        data.timestamp = this.getTimeSinceStart();
        data.mouse_window_pix=this.mouse_window_pix;
        data.mouse_window_client_pix=this.mouse_window_client_pix;
        data.mouse_canvas_pix=this.mouse_canvas_pix;
        data.focus = {...currentPos};
        data.displaying_chart_list = this.getDisplayingChartList();
        
        data.clicked = clicked;
        data.currentTime = currentTime.value;
        this.dataStream.push(data);
        if(clicked) {
            this.sendData();
        }
    }

    sendData() {
        if(!this.recording) return;
        this.sendToConsole();
        this.timestamp_last = (new Date()).getTime();
        this.init();
    }
    sendToConsole() {
        for(let i=0;i<this.dataStream.length;i++) {
            this.printData(this.dataStream[i]);
        }
    }
    printData(data) {
        let message = `-`.repeat(PARA.DEBUG_printData_SpaceAlign)+"\n";
        for(let it of Object.keys(data)) {
            let s = `${it}`;
            s += ` `.repeat(Math.max(0,PARA.DEBUG_printData_SpaceAlign-s.length));
            s += this.prettyPrint(data[it]);
            message+= s+'\n';
        }
        console.log(message);
    }
    prettyPrint(data) {
        let s = "";
        if(typeof data === 'object') {
            if(Array.isArray(data)) {
                s+="[ ";
                for(let i=0;i<data.length;i++) {
                    s += this.prettyPrint(data[i]);
                }
                s+="] ";
            } else {
                s+="{ ";
                for(let it of Object.keys(data)) {
                    s+=`${it}:`;
                    s+=this.prettyPrint(data[it]);
                }
                s+="} ";
            }
        } else {
            s = `${data} `;
        }
        return s;
    }
}
export let mouseTracker = new MouseTracker();
export let mouseTracker_mousemoveHandle = mouseTracker.mousemoveHandle.bind(mouseTracker);
export let mouseTracker_mouseclickHandle = mouseTracker.mouseclickHandle.bind(mouseTracker);
