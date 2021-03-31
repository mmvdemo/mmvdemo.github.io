import * as PARA from "./parameters.js";
import * as UTILS from "./utils.js";
import {highlightManager} from "./highlight.js";
import {mouseTracker_selectSubmitHandle,mouseTracker_selectCancelHandle} from "./tracking.js";
const TYPE = {
    NONE:"NONE",
    SINGLE_GRID:"SINGLE_GRID",
    DOT:"DOT",
    AREA:"AREA"
}
const STATUS = {
    OFF:"OFF",
    EMPTY:"EMPTY",
    SELECTED_GRID_SINGLE:"SELECTED_GRID_SINGLE",
    SELECTED_DOT:"SELECTED_DOT",
    SELECTED_AREA:"SELECTED_AREA"
}
class MatrixSelector {
    constructor() {
        this.type = TYPE.SINGLE_GRID;
        this.status = STATUS.EMPTY; 
        this.selected = {};
        this.selected.single_grid = {};
        this.selected.dot = {};
        this.selected.area = {};
        this.selectingArea = {};

        this.clickOnDot = false;
        this.moveODSelectFrame = false;
    }
    setType(s) {
        this.type = TYPE[s];
        if (this.type==TYPE.NONE) this.status = STATUS.OFF;
        if(this.status!=STATUS.OFF) this.status=STATUS.EMPTY;
    }
    start() {
        if (this.type!=TYPE.NONE) this.status=STATUS.EMPTY;
    }
    print() {
        console.log(`selector type: ${this.type} `,`status: ${this.status}`);
    }
    stop() {
        this.selected.single_grid = null;
        this.status=STATUS.OFF;
    }
    mouseclickHandle(evt){
        if (this.clickOnDot || this.moveODSelectFrame) {
            this.clickOnDot = false;
            this.moveODSelectFrame = false;
            return;
        }
        const pos = {...currentPos};
        if (Object.keys(pos).length==0) return;
        switch(this.status) {
            case STATUS.OFF:
                return;
            case STATUS.EMPTY:
                if(!UTILS.isMouseOnCanvas()) return;
                if (pos.h<0||pos.w<0||pos.h>=PARA.table.h||pos.w>=PARA.table.w) return;
                if(this.type==TYPE.SINGLE_GRID) {
                    this.submitSingleGrid(pos);
                }
                break;
            case STATUS.SELECTED_GRID_SINGLE:
                if(!UTILS.isMouseOnCanvas()) return;
                if(pos.h==this.selected.single_grid.h&&pos.w==this.selected.single_grid.w) {
                    this.cancelSingleGrid(pos);
                } else {
                    this.cancelSingleGrid(this.selected.single_grid,true);
                    this.submitSingleGrid(pos);
                }
                break;
            case STATUS.SELECTED_AREA:
                if(!UTILS.isMouseOnCanvas()) {
                    this.cancelArea(this.selected.area.pos1,this.selected.area.pos2);
                }
                break;
        }
    }
    mouseDBLclickHandle(selected,pos,time){
        if(this.type!=TYPE.DOT) return;
        switch(this.status) {
            case STATUS.OFF:
                return;
            case STATUS.EMPTY:
                this.submitDot(pos,time);  
                break;
            case STATUS.SELECTED_DOT:
                if(selected) {
                    this.cancelDot(this.selected.dot.pos,this.selected.dot.time);
                    this.submitDot(pos,time);
                } else {
                    this.cancelDot(pos,time);
                }
                break;
        }
    }
    mousedownHandle() {
        if(this.type!=TYPE.AREA) return;
        if(!freeze) return;
        if(!UTILS.isMouseOnCanvas()) return;
        this.selectingArea.pos1 = {...currentPos};
    }
    mousemoveHandle() {
        if(this.type!=TYPE.AREA) return;
        if(!freeze) return;
    }
    mouseupHandle() {
        // console.log(this.type, freeze,"pos1" in this.selectingArea )
        if(this.type!=TYPE.AREA) return;
        if(!freeze) return;
        if(!("pos1" in this.selectingArea)) return;
        this.selectingArea.pos2={...currentPos};
        const pos1={
            'h':Math.min(this.selectingArea.pos1.h,this.selectingArea.pos2.h),
            'w':Math.min(this.selectingArea.pos1.w,this.selectingArea.pos2.w)};  
        const pos2={
            'h':Math.max(this.selectingArea.pos1.h,this.selectingArea.pos2.h),
            'w':Math.max(this.selectingArea.pos1.w,this.selectingArea.pos2.w)};
        switch(this.status) {
            case STATUS.EMPTY:
                this.submitArea(pos1,pos2);
                break;
            case STATUS.SELECTED_AREA:
                this.submitArea(pos1,pos2);
                break;
        }
        // selectedMatrixCell(pos1.h,pos1.w)
        this.selectingArea={};
    }
    submitArea(pos1,pos2) {
        d3.select('#answerValue').html(`[(${pos1.h},${pos1.w})]`)

        this.status = STATUS.SELECTED_AREA; 
        this.selected.area.pos1={...pos1};
        this.selected.area.pos2={...pos2};

        highlightManager.removeSelect();
        highlightManager.addSelect(pos1,pos2);
        // call Carolina's code
    }
    cancelArea(pos1,pos2) {
        this.status = STATUS.EMPTY; 
        highlightManager.removeSelect();
        // call Carolina's code
    }
    submitDot(pos,time) {
        console.log('submitting dot')
        this.status = STATUS.SELECTED_DOT;
        this.selected.dot.pos=pos;
        this.selected.dot.time = time;
        // call Carolina's code
    }
    cancelDot(pos,time) {
        console.log('canceling dot')
        this.status = STATUS.EMPTY;
        // call Carolina's code
    }
    submitSingleGrid(pos) {
        this.status = STATUS.SELECTED_GRID_SINGLE;
        this.selected.single_grid = pos;
        highlightManager.addSelect(pos,pos);
        selectedMatrixCell(pos.h,pos.w)

        mouseTracker_selectSubmitHandle();
        // call Carolina's code
    }
    //added attribute to detect whether this is a user driven unselect or a clear before new select.
    cancelSingleGrid(pos,preSelect=false) {
        // console.log('unselecting', pos)
        this.status = STATUS.EMPTY;
        highlightManager.removeSelect(pos,pos);
        selectedMatrixCell(undefined,undefined,preSelect)

        mouseTracker_selectCancelHandle();
        // call Carolina's code
    }
    removeAll() {
        if (this.status==STATUS.EMPTY || Object.keys(this.selected.single_grid).length==0) return;
        this.cancelSingleGrid(this.selected.single_grid,true);
    }
}
export let selector = new MatrixSelector();
export let selector_mouseclickHandle=selector.mouseclickHandle.bind(selector);
export let selector_mouseDBLclickHandle=selector.mouseDBLclickHandle.bind(selector);
export let selector_mousedownHandle=selector.mousedownHandle.bind(selector);
export let selector_mousemoveHandle=selector.mousemoveHandle.bind(selector);
export let selector_mouseupHandle=selector.mouseupHandle.bind(selector);
