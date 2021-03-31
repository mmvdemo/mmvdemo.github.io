//color
export const backgroundColor = 0xF5F5F5;
//export const gridLineColor = 0xF5F5F5;
export const gridLineColor = 0x2E4053;
export const headColor = 0x85C1E9; 
export const nodeColor = 0x1ABC9C;
export const selectColor = 0xE74C3C;
export const lineColorDark = 0x2E4053;
export const lineColorLight = 0xF0EDE4;
export const hint_highlight_color = 0xF57F17;
export const select_highlight_color = 0x4285F4;
export const od_select_frame_color = 0xE53935;
//parameters
export const stage_pix = {'h':800,'w':800};
export const page_scroll_max_y_pix = 600;
export const table = {'h':nodeCnt,'w':nodeCnt};
export const step_pix = {'h':stage_pix.h/table.h,'w':stage_pix.w/table.w};
export const linechart_lineWidth_pix = 1;
export const linechart_axisTickFontSize = {'x':6,'y':6};
export const linechart_thresh_pix=30;
export const linechartsTextureScale = 1;
export const nodeRadius_normal_pix =2;
export const nodeRadius_highlight_pix=3;
export const tickmarksLength_pix = 2;
export const gridLineWidth_pix = 1;
export const highlightWidth_pix = 4;
export const highlightHalfWidth_pix = 2;
export const highlight_life = 5;
export const slider_length = 200;
export const EP = 100;
export const focal_cell_pix = 80;
export const chartMargin_normal_pix=focal_cell_pix*0.1;
export const chartSize_normal_pix = focal_cell_pix*0.8;
// tracker
export const interval = 1;
export const timeout = 3;
export const DEBUG_recordingTimeout = 10;
export const DEBUG_printData_SpaceAlign = 40;

export function loadParameters(nrows,ncols) {
    table.h=nrows;
    table.w=ncols;
    step_pix.h=stage_pix.h/table.h;
    step_pix.w=stage_pix.w/table.w;
}
