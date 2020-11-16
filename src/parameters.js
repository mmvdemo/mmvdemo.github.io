//color
export const backgroundColor = 0xF5F5F5;
export const gridLineColor = 0xF5F5F5;
export const headColor = 0x85C1E9; 
export const nodeColor = 0x1ABC9C;
export const selectColor = 0xE74C3C;
export const lineColorDark = 0x2E4053;
export const lineColorLight = 0xF0EDE4;
export const highlightColor = 0xF57F17;
//parameters
export const stage_pix = {'h':800,'w':800};
export const table = {'h':nodeCnt,'w':nodeCnt};
export const step_pix = {'h':stage_pix.h/table.h,'w':stage_pix.w/table.w};
export const linechart_lineWidth_pix = 8;
export const linechart_axisTickFontSize = {'x':6,'y':6};
export const linechart_thresh_pix = {'h':100,'w':100};
export const linechartsTextureScale = 1;
export const chartMargin_normal_pix=15;
export const chartSize_normal_pix = {'h':100,'w':100};
export const nodeRadius_normal_pix =2;
export const nodeRadius_highlight_pix=3;
export const tickmarksLength_pix = 2;
export const gridLineWidth_pix = 1;
export const highlightWidth_pix = 4;
export const EP = 100;
// tracker
export const interval = 1;
export const timeout = 3;
export const DEBUG_recordingTimeout = 10;
export const DEBUG_printData_SpaceAlign = 40;
export function loadParameters() {
    table.h=nodeCnt;
    table.w=nodeCnt;
    step_pix.h=stage_pix.h/table.h;
    step_pix.w=stage_pix.w/table.w;
}
