//color
export const backgroundColor = 0xF5F5F5;
export const headColor = 0x85C1E9; 
export const nodeColor = 0x1ABC9C;
export const selectColor = 0xE74C3C;
export const lineColorDark = 0x2E4053;
export const lineColorLight = 0xF0EDE4;
//parameters
export const stage_pix = {'h':800,'w':800};
export const table = {'h':nodeCnt,'w':nodeCnt};
export const step_pix = {'h':stage_pix.h/table.h,'w':stage_pix.w/table.w};
export const linechartsTextureScale = 1;
export const chartMargin=25;
export const nodeRadius =3;
export const EP = 100;
export function loadParameters() {
    table.h=nodeCnt;
    table.w=nodeCnt;
    step_pix.h=stage_pix.h/table.h;
    step_pix.w=stage_pix.w/table.w;
}
